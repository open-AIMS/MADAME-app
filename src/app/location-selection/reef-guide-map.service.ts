import {Injectable, inject, signal, WritableSignal, effect, INJECTOR} from '@angular/core';
import {ArcgisMap} from "@arcgis/map-components-angular";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import TileLayer from "@arcgis/core/layers/TileLayer";
import {ReefGuideApiService} from "./reef-guide-api.service";

interface CriteriaLayer {
  layer: TileLayer;
  visible: WritableSignal<boolean>;
}

/**
 * Reef Guide map context.
 */
@Injectable()
export class ReefGuideMapService {
  private readonly injector = inject(INJECTOR);
  private readonly api = inject(ReefGuideApiService);

  // map is set shortly after construction
  private map!: ArcgisMap;

  criteriaGroupLayer?: GroupLayer;

  criteriaLayers: Record<string, CriteriaLayer> = {};

  constructor() { }

  setMap(map: ArcgisMap) {
    this.map = map;

    map.arcgisViewReadyChange.subscribe(() => this.onMapReady())
  }
  /**
   * Show this criteria layer and hide others.
   * @param criteria
   */
  showCriteriaLayer(criteria: string) {
    if (this.criteriaGroupLayer) {
      this.criteriaGroupLayer.visible = true;
      for (let id in this.criteriaLayers) {
        const criteriaLayer = this.criteriaLayers[id];
        criteriaLayer.visible.set(id === criteria);
      }
    }
  }

  private onMapReady() {
    console.log('ReefGuideMapService.onMapReady');
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
    this.criteriaGroupLayer = groupLayer;
  }

}
