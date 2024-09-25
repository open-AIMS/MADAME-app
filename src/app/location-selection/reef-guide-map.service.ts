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
import {mergeMap, of} from "rxjs";
import {CriteriaRequest, ReadyRegion} from "./selection-criteria/criteria-request.class";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import {createSingleColorRasterFunction} from "../../util/arcgis/arcgis-layer-util";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ReefGuideConfigService} from "./reef-guide-config.service";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import {isDefined} from "../../util/js-util";

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(INJECTOR);
  private readonly api = inject(ReefGuideApiService);
  private readonly snackbar = inject(MatSnackBar);

  // map is set shortly after construction
  private map!: ArcgisMap;

  criteriaLayers: Record<string, CriteriaLayer> = {};

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

  constructor() { }

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