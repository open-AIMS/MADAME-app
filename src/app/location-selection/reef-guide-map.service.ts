import {environment} from "../../environments/environment";
import {
  Injectable,
  inject,
  signal,
  WritableSignal,
  effect,
  INJECTOR,
  runInInjectionContext,
  DestroyRef, computed, Signal
} from '@angular/core';
import {ArcgisMap} from "@arcgis/map-components-angular";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import {ReefGuideApiService} from "./reef-guide-api.service";
import {SelectionCriteria} from "./selection-criteria/selection-criteria.component";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {BehaviorSubject, mergeMap, of, Subject, throttleTime} from "rxjs";
import {CriteriaRequest, ReadyRegion} from "./selection-criteria/criteria-request.class";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import {createSingleColorRasterFunction} from "../../util/arcgis/arcgis-layer-util";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ReefGuideConfigService} from "./reef-guide-config.service";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import {isDefined} from "../../util/js-util";
import esriConfig from "@arcgis/core/config.js";
import {AuthService} from "../auth/auth.service";

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
  private readonly api = inject(ReefGuideApiService);
  private readonly snackbar = inject(MatSnackBar);

  // map is set shortly after construction
  private map!: ArcgisMap;

  criteriaLayers: Record<string, CriteriaLayer> = {};

  /**
   * HTTP errors encounter by map layers.
   */
  httpErrors: Subject<__esri.Error> = new Subject<__esri.Error>();

  progress$ = new BehaviorSubject<number>(1);

  private readonly pendingRequests = new Set<string>();
  private pendingHighPoint: number = 0;

  private readonly criteriaGroupLayer = signal<GroupLayer | undefined>(undefined);
  private readonly cogAssessRegionsGroupLayer = signal<GroupLayer | undefined>(undefined);
  private readonly tilesAssessRegionsGroupLayer = signal<GroupLayer | undefined>(undefined);

  criteriaRequest = signal<CriteriaRequest | undefined>(undefined);

  showClear = computed(() => {
    return this.cogAssessRegionsGroupLayer() !== undefined
      || this.tilesAssessRegionsGroupLayer() !== undefined;
  });

  /**
   * Layers the user may style
   */
  styledLayers: Signal<Array<GroupLayer>> = computed(() => {
    return [
      this.cogAssessRegionsGroupLayer(),
      this.tilesAssessRegionsGroupLayer(),
      this.criteriaGroupLayer()
    ].filter(isDefined);
  });

  constructor() {
    this.setupRequestInterceptor();

    this.httpErrors.pipe(
      throttleTime(2_000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(err => {
      const status = err.details.httpStatus
      // err.details.url
      this.snackbar.open(`Map layer error (HTTP ${status})`, 'OK');
    })
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
        this.progress$.next((this.pendingHighPoint - this.pendingRequests.size) / this.pendingHighPoint)
      }
    }

    esriConfig.request.interceptors!.push({
      urls: [
        new RegExp(`^${apiUrl}`)
      ],
      before: params => {
        const url = params.url as string;
        this.pendingRequests.add(url);
        this.pendingHighPoint = Math.max(this.pendingRequests.size, this.pendingHighPoint);
        this.progress$.next((this.pendingHighPoint - this.pendingRequests.size) / this.pendingHighPoint)

        // security double-check that we're only intercepting our API urls.
        if (url.startsWith(apiUrl)) {
          const token = this.authService.getAuthToken();
          if (token) {
            const headerVal = `Bearer ${token}`;
            if (params.requestOptions.headers === undefined) {
              params.requestOptions.headers = {
                Authorization: headerVal
              };
            } else {
              params.requestOptions.headers.Authorization = headerVal;
            }
          } else {
            // All reef-guide-api layers require authentication, so spare the API
            // from requests it would reject with a 401 anyway.
            throw new Error("Not authenticated");
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
        } else if (err.name !== 'AbortError') { // ignore cancelled requests
          this.httpErrors.next(err);
        }
      }
    });
  }

  setMap(map: ArcgisMap) {
    this.map = map;

    map.arcgisViewReadyChange.subscribe(() => this.onMapReady())
  }

  goHome() {
    this.map.goTo({target: [146.1979986145376, -16.865253472483754], zoom: 10});
  }

  addCOGLayers(criteria: SelectionCriteria) {
    console.log('addCOGLayers', criteria);

    const regions$ = toObservable(this.config.enabledRegions, {injector: this.injector})
      .pipe(mergeMap(regions => of(...regions)));

    const criteriaRequest = runInInjectionContext(this.injector, () => new CriteriaRequest(criteria, regions$));
    this.criteriaRequest.set(criteriaRequest);

    let title = 'Assessed Regions';
    if (this.config.assessLayerTypes().length > 1) {
      title = `${title} (COGs)`;
    }
    const groupLayer = new GroupLayer({
      title,
    });
    this.cogAssessRegionsGroupLayer.set(groupLayer);
    this.map.addLayer(groupLayer);

    criteriaRequest.regionError$
      .subscribe(region => this.handleRegionError(region))

    criteriaRequest.regionReady$
      // unsubscribe when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(region => this.addRegionLayer(region, groupLayer))
  }

  addTileLayers(criteria: SelectionCriteria) {
    console.log('addTileLayers');

    let title = 'Assessed Regions';
    if (this.config.assessLayerTypes().length > 1) {
      title = `${title} (Tiles)`;
    }

    const tilesGroup = new GroupLayer({
      title,
      blendMode: 'destination-out'
    });
    this.tilesAssessRegionsGroupLayer.set(tilesGroup);
    this.map.addLayer(tilesGroup);

    const regions = this.config.enabledRegions();
    for (const region of regions) {
      this.addTileLayer(region, criteria);
    }
  }

  addTileLayer(region: string, criteria: SelectionCriteria) {
    const urlTemplate = this.api.tileUrlForCriteria(region, criteria);
    console.log('urlTemplate', urlTemplate);

    const layer = new WebTileLayer({
      title: region,
      urlTemplate,
      // TODO minScale, different units than zoom
      // https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-WebTileLayer.html#minScale
      // blendMode: 'destination-out'
      // effect also available.
    });
    this.tilesAssessRegionsGroupLayer()!.add(layer);
  }

  /**
   * Cancel criteria request in progress.
   */
  cancelCriteriaRequest() {
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
    this.cancelCriteriaRequest();

    const groupLayer = this.cogAssessRegionsGroupLayer();
    if (groupLayer) {
      for (const layer of groupLayer.layers) {
        if (layer instanceof ImageryTileLayer && layer.url.startsWith("blob:")) {
          // remove resources after destroy
          setTimeout(() => {
            console.log("revokeObjectURL", layer.url);
            URL.revokeObjectURL(layer.url);
          })
        }
        layer.destroy();
      }
    }

    groupLayer?.destroy();
    this.cogAssessRegionsGroupLayer.set(undefined);

    this.tilesAssessRegionsGroupLayer()?.destroy();
    this.tilesAssessRegionsGroupLayer.set(undefined);
  }

  /**
   * Show this criteria layer and hide others.
   * @param criteria
   */
  showCriteriaLayer(criteria: string) {
    const criteriaGroupLayer = this.criteriaGroupLayer();
    if (criteriaGroupLayer) {
      criteriaGroupLayer.visible = true;
      for (let id in this.criteriaLayers) {
        const criteriaLayer = this.criteriaLayers[id];
        criteriaLayer.visible.set(id === criteria);
      }
    }
  }

  private async addRegionLayer(region: ReadyRegion, groupLayer: GroupLayer) {
    console.log('addRegionLayer', region.region, region.originalUrl);
    const layer = new ImageryTileLayer({
      title: region.region,
      url: region.cogUrl,
      opacity: 0.5,
      // gold color
      rasterFunction: createSingleColorRasterFunction([1, 241, 192, 12])
    });
    groupLayer.add(layer);
  }

  private onMapReady() {
    console.log('ReefGuideMapService.onMapReady');

    // TODO better to set initial map extent
    this.goHome();

    this.addCriteriaLayers();
  }

  private async addCriteriaLayers() {
    const { injector } = this;
    const layers = this.api.getCriteriaLayers();

    const groupLayer = new GroupLayer({
      title: "Criteria"
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
      }

      effect(() => {
        layer.visible = visible();
      }, { injector });
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
