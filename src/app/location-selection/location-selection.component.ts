import {Component, inject, ViewChild} from '@angular/core';
import {MatSidenavModule} from "@angular/material/sidenav";
import {ArcgisMap, ComponentLibraryModule} from "@arcgis/map-components-angular";
import {ArcgisMapCustomEvent} from "@arcgis/map-components";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {SelectionCriteria, SelectionCriteriaComponent} from "./selection-criteria/selection-criteria.component";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import {ReefGuideApiService} from "./reef-guide-api.service";
import {urlToBlobObjectURL} from "../../util/http-util";
import {createSingleColorRasterFunction} from "../../util/arcgis/arcgis-layer-util";
import {MatTooltip} from "@angular/material/tooltip";
import {MatDialog} from "@angular/material/dialog";
import {ConfigDialogComponent} from "./config-dialog/config-dialog.component";
import {ReefGuideConfigService} from "./reef-guide-config.service";
import {concat, concatMap, delay, Observable, of} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {AsyncPipe} from "@angular/common";

/**
 * Prototype of Location Selection app.
 * Map be split-off as its own project in the future.
 */
@Component({
  selector: 'app-location-selection',
  standalone: true,
  imports: [
    MatSidenavModule,
    ComponentLibraryModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    SelectionCriteriaComponent,
    MatTooltip,
    AsyncPipe,
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  private assessedRegionsGroupLayer?: GroupLayer;

  mapItemId$: Observable<string | null>;

  constructor() {
    this.mapItemId$ = toObservable(this.config.arcgisMapItemId).pipe(
      concatMap((x, index) => {
        if (index === 0) {
          return of(x);
        } else {
          // <arcgis-map> cannot update correctly when itemId changes, so recreate it.
          // emit null now, then delay emission of x.
          // this will cause <arcgis-map> to be removed briefly.
          return concat(of(null), of(x).pipe(delay(20)));
        }
      })
    );
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);

    // need to set initial view if not loading a Map.
    this.map.goTo({target: [146.1979986145376, -16.865253472483754], zoom: 10});
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log("arcgis map click", event);
    // const view = this.map.view;
    // const resp = await view.hitTest(event.detail);
  }

  async onSelectionCriteria(criteria: SelectionCriteria) {
    console.log('onSelectionCriteria', criteria);

    this.clearAssessedLayers();

    const groupLayer = new GroupLayer({
      title: 'Assessed Regions',
    });
    this.assessedRegionsGroupLayer = groupLayer;
    this.map.addLayer(groupLayer);

    const regions = this.config.enabledRegions();

    // TODO rxjs design, switchMap, Subject<Criteria>
    if (this.config.parallelRegionRequests()) {
      Promise.all(regions.map((r) => this.addRegionLayer(r, groupLayer, criteria))).then(
        () => {
          console.log("done")
        }
      )
    } else {
      for (let region of regions) {
        await this.addRegionLayer(region, groupLayer, criteria);
      }
    }
  }

  clearAssessedLayers() {
    // TODO revokeObjectURL
    const groupLayer = this.assessedRegionsGroupLayer;
    if (groupLayer) {
      for (const layer of groupLayer.layers) {
        console.log(layer);
        if (layer instanceof ImageryTileLayer && layer.url.startsWith("blob:")) {
          // remove resources after destroy
          setTimeout(() => {
            console.log("revoke", layer.url);
            URL.revokeObjectURL(layer.url);
          })
        }
        layer.destroy();
      }
    }

    groupLayer?.destroy();
    this.assessedRegionsGroupLayer = undefined;
  }

  openConfig() {
    this.dialog.open(ConfigDialogComponent);
  }

  private async addRegionLayer(region: string, groupLayer: GroupLayer, criteria: SelectionCriteria) {
    const cogUrl = this.api.cogUrlForCriteria(region, criteria);
    const blobUrl = await urlToBlobObjectURL(cogUrl);

    const layer = new ImageryTileLayer({
      title: region,
      url: blobUrl,
      opacity: 0.5,
      // gold color
      rasterFunction: createSingleColorRasterFunction([1, 241, 192, 12])
    });
    groupLayer.add(layer);
  }
}
