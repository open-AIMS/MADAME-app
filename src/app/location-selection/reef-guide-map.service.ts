import { environment } from '../../environments/environment';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  INJECTOR,
  runInInjectionContext,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { ArcgisMap } from '@arcgis/map-components-angular';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';
import { ReefGuideApiService } from './reef-guide-api.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  throttleTime,
} from 'rxjs';
import {
  CriteriaRequest,
  ReadyRegion,
} from './selection-criteria/criteria-request.class';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import {
  ColorRGBA,
  createGlobalPolygonLayer,
  createSingleColorRasterFunction,
} from '../../util/arcgis/arcgis-layer-util';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReefGuideConfigService } from './reef-guide-config.service';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import { isDefined } from '../../util/js-util';
import esriConfig from '@arcgis/core/config.js';
import { AuthService } from '../auth/auth.service';
import Editor from '@arcgis/core/widgets/Editor';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import {
  SelectionCriteria,
  SiteSuitabilityCriteria,
} from './reef-guide-api.types';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import { StylableLayer } from '../widgets/layer-style-editor/layer-style-editor.component';
import { JobType } from '../../api/web-api.types';
import { WebApiService } from '../../api/web-api.service';
import {
  RegionDownloadResponse,
  RegionJobsManager,
} from './selection-criteria/region-jobs-manager';

interface CriteriaLayer {
  layer: TileLayer;
  visible: WritableSignal<boolean>;
}

/**
 * Reef Guide map context and layer management.
 * Higher-level abstraction over the map component.
 */
@Injectable()
export class ReefGuideMapService {
  readonly config = inject(ReefGuideConfigService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(INJECTOR);
  private readonly api = inject(WebApiService);
  private readonly reefGuideApi = inject(ReefGuideApiService);
  private readonly snackbar = inject(MatSnackBar);

  // map is set shortly after construction
  private map!: ArcgisMap;
  private editor?: __esri.Editor;

  assessColor: ColorRGBA = [241, 192, 12, 1];

  criteriaLayers: Record<string, CriteriaLayer> = {};

  /**
   * HTTP errors encounter by map layers.
   */
  httpErrors: Subject<__esri.Error> = new Subject<__esri.Error>();

  /**
   * Progress on loading incremental map layers, i.e. tiles
   */
  progress$ = new BehaviorSubject<number>(1);

  private cancelAssess$ = new Subject<void>();

  /**
   * Site Suitability polygons are loading.
   *
   * TODO better map layer management and progress system.
   * This is too hardcoded, in the future will abstract this, but wait til OpenLayers.
   */
  siteSuitabilityLoading = signal(false);

  private readonly pendingRequests = new Set<string>();
  private pendingHighPoint: number = 0;

  // criteria data layers
  private readonly criteriaGroupLayer = signal<GroupLayer | undefined>(
    undefined
  );

  // region assessment raster layers. COG vs Tile depends on app config.
  private readonly cogAssessRegionsGroupLayer = signal<GroupLayer | undefined>(
    undefined
  );
  private readonly tilesAssessRegionsGroupLayer = signal<
    GroupLayer | undefined
  >(undefined);

  // suitable sites polygons group layer
  private readonly siteSuitabilityLayer = signal<GroupLayer | undefined>(
    undefined
  );

  criteriaRequest = signal<CriteriaRequest | undefined>(undefined);

  // whether to show the clear layers button
  showClear = computed(() => {
    return (
      this.cogAssessRegionsGroupLayer() !== undefined ||
      this.tilesAssessRegionsGroupLayer() !== undefined
    );
  });

  /**
   * Layers the user may style
   */
  styledLayers: Signal<Array<StylableLayer>> = computed(() => {
    return [
      this.cogAssessRegionsGroupLayer(),
      this.tilesAssessRegionsGroupLayer(),
      this.criteriaGroupLayer(),
      this.siteSuitabilityLayer(),
    ].filter(isDefined);
  });

  constructor() {
    this.setupRequestInterceptor();

    this.httpErrors
      .pipe(throttleTime(2_000), takeUntilDestroyed(this.destroyRef))
      .subscribe(err => {
        const status = err.details.httpStatus;
        // err.details.url
        this.snackbar.open(`Map layer error (HTTP ${status})`, 'OK');
      });
  }

  private setupRequestInterceptor() {
    const apiUrl = environment.reefGuideApiUrl;

    /*
    ArcGIS map seems to have its own queue and do 10 tile requests at a time by default.
    This makes the progress appear to be doing nothing even though tiles are being loaded.
    Ideally would get the total pending tiles from ArcGIS SDK.
     */
    const onRequestDone = (url: string) => {
      this.pendingRequests.delete(url);
      if (this.pendingRequests.size === 0) {
        // finished, reset
        this.pendingHighPoint = 0;
        this.progress$.next(1); // 100%
      } else {
        this.progress$.next(
          (this.pendingHighPoint - this.pendingRequests.size) /
            this.pendingHighPoint
        );
      }
    };

    esriConfig.request.interceptors!.push({
      urls: [new RegExp(`^${apiUrl}`)],
      before: params => {
        const url = params.url as string;
        this.pendingRequests.add(url);
        this.pendingHighPoint = Math.max(
          this.pendingRequests.size,
          this.pendingHighPoint
        );
        this.progress$.next(
          (this.pendingHighPoint - this.pendingRequests.size) /
            this.pendingHighPoint
        );

        // security double-check that we're only intercepting our API urls.
        if (url.startsWith(apiUrl)) {
          const token = this.authService.getAuthToken();
          if (token) {
            const headerVal = `Bearer ${token}`;
            if (params.requestOptions.headers === undefined) {
              params.requestOptions.headers = {
                Authorization: headerVal,
              };
            } else {
              params.requestOptions.headers.Authorization = headerVal;
            }
          } else {
            // All reef-guide-api layers require authentication, so spare the API
            // from requests it would reject with a 401 anyway.
            throw new Error('Not authenticated');
            // Note: we also have access to an AbortSignal here.
            // const signal = params.requestOptions.signal as AbortSignal;
          }
        } else {
          console.warn('esri request interceptor intercepted wrong URL!');
        }
      },
      after: response => {
        const url = response.url;
        if (url) {
          onRequestDone(url);
        }
      },
      error: err => {
        const url = err.details.url;
        onRequestDone(url);

        if (err.details.httpStatus === 401) {
          this.authService.unauthenticated();
        } else if (err.name !== 'AbortError') {
          // ignore cancelled requests
          this.httpErrors.next(err);
        }
      },
    });
  }

  setMap(map: ArcgisMap) {
    this.map = map;

    map.arcgisViewReadyChange.subscribe(() => this.onMapReady());
  }

  goHome() {
    this.map.goTo({
      target: [146.1979986145376, -16.865253472483754],
      zoom: 10,
    });
  }

  /**
   * Start region jobs and add layers using the job results.
   * @param jobType
   * @param payload
   */
  addJobLayers(jobType: JobType, payload: any) {
    console.log('addJobLayers', payload);

    const regions$ = toObservable(this.config.enabledRegions, {
      injector: this.injector,
    }).pipe(mergeMap(regions => of(...regions)));

    const jobManager = runInInjectionContext(
      this.injector,
      () => new RegionJobsManager(jobType, payload, regions$)
    );
    // FIXME refactor, thinking the job/data manager should be outside map service
    // this.criteriaRequest.set(criteriaRequest);

    const groupLayer = this.setupCOGAssessRegionsGroupLayer();

    jobManager.regionError$.subscribe(region => this.handleRegionError(region));

    jobManager.jobResultsDownload$
      .pipe(
        // unsubscribe when this component is destroyed
        takeUntilDestroyed(this.destroyRef),
        switchMap(results => this.jobResultsToReadyRegion(results))
      )
      .subscribe(readyRegion => {
        this.addRegionLayer(readyRegion, groupLayer);
      });
  }

  /**
   * Download job results and create map layer to display it.
   * @param jobId
   */
  loadLayerFromJobResults(jobId: number, region?: string) {
    const groupLayer = this.setupCOGAssessRegionsGroupLayer();

    // standardize getting region as an Observable
    let region$: Observable<string>;
    if (region !== undefined) {
      region$ = of(region);
    } else {
      region$ = this.api
        .getJob(jobId)
        .pipe(map(x => x.job.input_payload.region));
    }

    forkJoin([region$, this.api.downloadJobResults(jobId)]).subscribe(
      ([region, results]) => {
        const regionResults = { ...results, region };
        this.jobResultsToReadyRegion(regionResults).subscribe(readyRegion => {
          this.addRegionLayer(readyRegion, groupLayer);
        });
      }
    );
  }

  private jobResultsToReadyRegion(
    results: RegionDownloadResponse
  ): Observable<ReadyRegion> {
    // hacky, but currently Jobs only create one file.
    const url = Object.values(results.files)[0];

    // assuming file is small and better to download whole thing to blob
    // TODO only convert to local Blob if less than certain size
    // REVIEW move to other API service?
    // plain HTTP required for S3 url
    return this.reefGuideApi.toObjectURL(url, true).pipe(
      map(blobUrl => {
        const readyRegion: ReadyRegion = {
          region: results.region,
          cogUrl: blobUrl,
          originalUrl: url,
        };
        return readyRegion;
      })
    );
  }

  private setupCOGAssessRegionsGroupLayer() {
    const currentGroupLayer = this.cogAssessRegionsGroupLayer();
    if (currentGroupLayer) {
      return currentGroupLayer;
    }

    let title = 'Assessed Regions';
    if (this.config.assessLayerTypes().length > 1) {
      title = `${title} (COGs)`;
    }
    const groupLayer = new GroupLayer({
      title,
      listMode: 'hide-children',
    });
    this.cogAssessRegionsGroupLayer.set(groupLayer);
    this.map.addLayer(groupLayer);
    return groupLayer;
  }

  addCOGLayers(criteria: SelectionCriteria) {
    console.log('addCOGLayers', criteria);

    const regions$ = toObservable(this.config.enabledRegions, {
      injector: this.injector,
    }).pipe(mergeMap(regions => of(...regions)));

    const criteriaRequest = runInInjectionContext(
      this.injector,
      () => new CriteriaRequest(criteria, regions$)
    );
    this.criteriaRequest.set(criteriaRequest);

    const groupLayer = this.setupCOGAssessRegionsGroupLayer();

    criteriaRequest.regionError$.subscribe(region =>
      this.handleRegionError(region)
    );

    criteriaRequest.regionReady$
      // unsubscribe when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(region => this.addRegionLayer(region, groupLayer));
  }

  addTileLayers(criteria: SelectionCriteria) {
    console.log('addTileLayers');

    let title = 'Assessed Regions';
    if (this.config.assessLayerTypes().length > 1) {
      title = `${title} (Tiles)`;
    }

    const tilesGroup = new GroupLayer({
      title,
      // blendMode: 'destination-out',
      visibilityMode: 'inherited',
    });

    this.tilesAssessRegionsGroupLayer.set(tilesGroup);
    this.map.addLayer(tilesGroup);

    const regions = this.config.enabledRegions();
    for (const region of regions) {
      this.addTileLayer(region, criteria);
    }
  }

  addTileLayer(region: string, criteria: SelectionCriteria) {
    const urlTemplate = this.reefGuideApi.tileUrlForCriteria(region, criteria);
    console.log('urlTemplate', urlTemplate);

    // Need a group for each layer and the graphic behind it to blend with.
    const groupLayer = new GroupLayer({
      title: region,
      listMode: 'hide-children',
    });
    groupLayer.add(createGlobalPolygonLayer(this.assessColor));

    const layer = new WebTileLayer({
      title: region,
      urlTemplate,
      maxScale: 100,
      // TODO minScale, different units than zoom
      // https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-WebTileLayer.html#minScale
      blendMode: 'destination-in',
      // effect also available.
    });
    groupLayer.add(layer);

    this.tilesAssessRegionsGroupLayer()!.add(groupLayer);
  }

  addSiteSuitabilityLayer(
    criteria: SelectionCriteria,
    siteCriteria: SiteSuitabilityCriteria
  ) {
    const regions = this.config.enabledRegions();

    const groupLayer = new GroupLayer({
      title: 'Site Suitability',
      listMode: 'hide-children',
    });
    this.map.addLayer(groupLayer);
    this.siteSuitabilityLayer.set(groupLayer);

    // TODO[OpenLayers] site suitability loading indicator
    // rework multi-request progress tracking, review CriteriaRequest
    // this.siteSuitabilityLoading.set(true);
    for (const region of regions) {
      const url = this.reefGuideApi.siteSuitabilityUrlForCriteria(
        region,
        criteria,
        siteCriteria
      );
      const layer = new GeoJSONLayer({
        title: `Site Suitability (${region})`,
        url,
      });

      groupLayer.add(layer);
    }
  }

  /**
   * Cancel assess criteria related map layer requests.
   */
  cancelAssess() {
    this.cancelAssess$.next();

    const cr = this.criteriaRequest();
    if (cr) {
      cr.cancel();
      this.criteriaRequest.set(undefined);
    }
  }

  /**
   * Cancel any CriteriaRequest and destroy map layers.
   */
  clearAssessedLayers() {
    // cancel current request if any
    this.cancelAssess();

    const groupLayer = this.cogAssessRegionsGroupLayer();
    if (groupLayer) {
      for (const layer of groupLayer.layers) {
        if (
          layer instanceof ImageryTileLayer &&
          layer.url.startsWith('blob:')
        ) {
          // remove resources after destroy
          setTimeout(() => {
            console.log('revokeObjectURL', layer.url);
            URL.revokeObjectURL(layer.url);
          });
        }
        layer.destroy();
      }
    }

    groupLayer?.destroy();
    this.cogAssessRegionsGroupLayer.set(undefined);

    this.tilesAssessRegionsGroupLayer()?.destroy();
    this.tilesAssessRegionsGroupLayer.set(undefined);

    this.siteSuitabilityLayer()?.destroy();
    this.siteSuitabilityLayer.set(undefined);
  }

  /**
   * Show this criteria layer and hide others.
   * @param criteria layer id
   * @param show show/hide layer
   */
  showCriteriaLayer(criteria: string, show = true) {
    const criteriaGroupLayer = this.criteriaGroupLayer();
    if (criteriaGroupLayer) {
      criteriaGroupLayer.visible = true;
      for (let id in this.criteriaLayers) {
        const criteriaLayer = this.criteriaLayers[id];
        criteriaLayer.visible.set(id === criteria && show);
      }
    }
  }

  toggleEditor() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = undefined;
    } else {
      this.setupEditor();
    }
  }

  /**
   * Update criteria layers signals based on ArcGIS state.
   * Note: ideally would subscribe to layer event, but doesn't seem to exist.
   */
  updateCriteriaLayerStates() {
    const criteriaGroupLayer = this.criteriaGroupLayer();
    if (criteriaGroupLayer) {
      criteriaGroupLayer.visible = true;
      for (let id in this.criteriaLayers) {
        const criteriaLayer = this.criteriaLayers[id];
        criteriaLayer.visible.set(criteriaLayer.layer.visible);
      }
    }
  }

  private async addRegionLayer(region: ReadyRegion, groupLayer: GroupLayer) {
    console.log('addRegionLayer', region.region, region.originalUrl);
    const layer = new ImageryTileLayer({
      title: region.region,
      url: region.cogUrl,
      opacity: 0.9,
      // gold color
      // this breaks new COG, TODO heatmap in OpenLayers
      //rasterFunction: createSingleColorRasterFunction(this.assessColor),
    });
    groupLayer.add(layer);
  }

  private onMapReady() {
    console.log('ReefGuideMapService.onMapReady');

    // limit how far map can zoom.
    this.map.constraints = {
      minZoom: 4,
      maxZoom: 19,
    };

    // TODO better to set initial map extent
    this.goHome();

    this.addCriteriaLayers();
  }

  private setupEditor() {
    this.editor = new Editor({
      view: this.map.view,
    });

    this.map.view.ui.add(this.editor, 'top-right');
  }

  /**
   * WIP
   * Need to sync with our API, but if we're switching to OpenLayers, then this will need
   * to largely be re-written.
   */
  private addReefNotesLayer() {
    const layer = new FeatureLayer({
      title: 'Reef Notes',
      editingEnabled: true,
      fields: [
        {
          name: 'ObjectID',
          alias: 'ObjectID',
          type: 'oid',
        },
        {
          name: 'notes',
          alias: 'Notes',
          type: 'string',
        },
      ],
      objectIdField: 'ObjectID',
      geometryType: 'polygon',
      source: [],
    });
    this.map.addLayer(layer);

    layer.on('edits', edits => {
      console.log('edits', edits);

      for (let f of edits.addedFeatures) {
        console.log('f', f);
        f.objectId;
        layer.queryFeatures({ objectIds: [f.objectId] }).then(x => {
          console.log('q', x);
          // Util.arcgisToGeoJSON()
        });
      }

      // @ts-ignore
      console.log('x', edits.edits);

      /*
      {
    "aggregateGeometries": null,
    "geometry": {
        "spatialReference": {
            "latestWkid": 3857,
            "wkid": 102100
        },
        "rings": [
            [
                [
                    16268327.203744985,
                    -1892548.5535436415
                ],
                [
                    16240687.576183194,
                    -1884599.1026019813
                ],
                [
                    16271873.88372356,
                    -1878117.2435364644
                ],
                [
                    16268327.203744985,
                    -1892548.5535436415
                ]
            ]
        ]
    },
    "symbol": null,
    "attributes": {
        "notes": "aoue",
        "ObjectID": 1
    },
    "popupTemplate": null
}

Queried
{
    "features": [
        {
            "aggregateGeometries": null,
            "geometry": null,
            "symbol": null,
            "attributes": {
                "ObjectID": 1,
                "notes": "a"
            },
            "popupTemplate": null
        }
    ],
    "geometryType": "esriGeometryPolygon",
    "spatialReference": {
        "wkid": 4326
    }
}
       */
    });

    //this.editor.when
    //this.editor.addHandles()
  }

  private async addCriteriaLayers() {
    const { injector } = this;
    const layers = this.reefGuideApi.getCriteriaLayers();

    const groupLayer = new GroupLayer({
      title: 'Criteria',
    });

    for (let criteria in layers) {
      const url = layers[criteria];

      const layer = new TileLayer({
        id: `criteria_${criteria}`,
        // TODO user-friendly title
        // title:
        url,
        visible: false,
      });
      groupLayer.add(layer);

      const visible = signal(false);

      this.criteriaLayers[criteria] = {
        layer,
        visible,
      };

      effect(
        () => {
          layer.visible = visible();
        },
        { injector }
      );
    }

    this.map.addLayer(groupLayer);
    this.criteriaGroupLayer.set(groupLayer);
  }

  private handleRegionError(region: string) {
    console.warn('handleRegionError', region);
    // TODO multi-error display. this replaces previous error.
    this.snackbar.open(`Error loading ${region}`, 'OK');
  }
}
