import {Component, effect, ElementRef, inject, ViewChild} from '@angular/core';
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

export const allRegions = [
  "Townsville-Whitsunday",
  "Cairns-Cooktown",
  "Mackay-Capricorn",
  "FarNorthern"
];

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
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  // TODO new Angular 18 API to do this?
  //drawerButton = viewChild.required("drawerButton");
  @ViewChild("drawerButton", {static: true, read: ElementRef}) drawerButton!: ElementRef;
  @ViewChild("configButton", {static: true, read: ElementRef}) configButton!: ElementRef;

  // Decision Sim 2 v1_5 GS
  mapItemId = 'fee03c9e65a8413f8b0bb8c158c7f040';

  // "MADAME App - Testing" map
  // temporary, quicker to load.
  // mapItemId = 'd7404f1b7eed4269b0028a0a6b698000';

  // AIMS DS test map
  // mapItemId = '86a52eb849fe40fe91645a4e87d821fb';

  private assessedRegionsGroupLayer?: GroupLayer;

  /**
   * Request all regions simultaneously.
   */
  private parallelRegionRequests: boolean = true;

  constructor(public api: ReefGuideApiService) {
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);

    // Put our button within ArcGIS UI layout
    this.map.view.ui.add(this.configButton.nativeElement, {position: "top-left", index: 0});
    this.map.view.ui.add(this.drawerButton.nativeElement, {position: "top-left", index: 0});

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

    // TODO rxjs design, switchMap, Subject<Criteria>
    if (this.parallelRegionRequests) {
      Promise.all(allRegions.map((r) => this.addRegionLayer(r, groupLayer, criteria))).then(
        () => {
          console.log("done")
        }
      )
    } else {
      for (let region of allRegions) {
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
