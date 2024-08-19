import {Component, ElementRef, ViewChild} from '@angular/core';
import {MatSidenavModule} from "@angular/material/sidenav";
import {ArcgisMap, ComponentLibraryModule} from "@arcgis/map-components-angular";
import {ArcgisMapCustomEvent} from "@arcgis/map-components";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbar} from "@angular/material/toolbar";
import {SelectionCriteriaComponent} from "./selection-criteria/selection-criteria.component";
import TileLayer from "@arcgis/core/layers/TileLayer";
import ExtentAndRotationGeoreference from "@arcgis/core/layers/support/ExtentAndRotationGeoreference";
import Extent from "@arcgis/core/geometry/Extent";
import ImageElement from "@arcgis/core/layers/support/ImageElement";
import MediaLayer from "@arcgis/core/layers/MediaLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";

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
    MatToolbar,
    SelectionCriteriaComponent,
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  // TODO new Angular 18 API to do this?
  //drawerButton = viewChild.required("drawerButton");
  @ViewChild("drawerButton", {static: true, read: ElementRef}) drawerButton!: ElementRef;

  // Decision Sim 2 v1_5 GS
  // mapItemId = 'fee03c9e65a8413f8b0bb8c158c7f040';

  // "MADAME App - Testing" map
  // temporary, quicker to load.
  // mapItemId = 'd7404f1b7eed4269b0028a0a6b698000';

  // AIMS DS test map
  mapItemId = '86a52eb849fe40fe91645a4e87d821fb';

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);

    // Put our button within ArcGIS UI layout
    this.map.view.ui.add(this.drawerButton.nativeElement, {position: "top-left", index: 0});
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log("arcgis map click", event);
    // const view = this.map.view;
    // const resp = await view.hitTest(event.detail);
  }

  private async createTileLayer() {
    const landsat = "https://landsat2.arcgis.com/arcgis/rest/services/Landsat8_Views/ImageServer";
    const suitableFlats = 'https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/Suitable_Flat_Locations/MapServer';
    let layer = new TileLayer({
      // URL to the imagery service
      url: suitableFlats
    });

    return layer;
  }

  private async createMaskLayer() {
    const geo1 = new ExtentAndRotationGeoreference({
      extent: new Extent({
        xmin: 16248507.078578336,
        xmax: 16252038.470218176,
        ymin: -1884503.5431953117,
        ymax: -1887851.4843927128,
        spatialReference: {
          // using same wkid from click event
          // TODO which is more correct? using standard coords would be better
          // detail.mapPoint.spatialReference.wkid
          wkid: 102100
          // detail.mapPoint.spatialReference.latestWkid
          // wkid: 3857
        }
      })
    });

    const source = new ImageElement({
      // image: "tmp-files/black-square.png",
      image: "http://localhost:4200/tmp-files/blackcircle-on-trans.png",
      georeference: geo1,
    });

    const layer = new MediaLayer({
      title: 'Mask Test',
      source,
      blendMode: 'destination-in'
    });

    return layer;
  }

  private async testMask() {
    const tileLayer = await this.createTileLayer();
    const maskLayer = await this.createMaskLayer();

    const groupLayer = new GroupLayer({
      title: 'GroupLayer',
      layers: [
        tileLayer,
        maskLayer
      ]
    })
    this.map.addLayer(groupLayer);
  }

}
