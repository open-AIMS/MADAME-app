import {Component, inject, signal, ViewChild} from '@angular/core';
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
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
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import {LayerStyleEditorComponent} from "../widgets/layer-style-editor/layer-style-editor.component";

type DrawerModes = 'criteria' | 'style';

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
    LayerStyleEditorComponent,
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);

  drawerMode = signal<DrawerModes>('criteria');

  @ViewChild(ArcgisMap) map!: ArcgisMap;
  @ViewChild('drawer') drawer!: MatDrawer;

  styleEditorLayer = signal<GroupLayer | undefined>(undefined);
  private cogsAssessedRegionsGroupLayer?: GroupLayer;
  private tilesAssessedRegionsGroupLayer?: GroupLayer;

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
      title: 'Assessed Regions (COGs)',
    });
    this.cogsAssessedRegionsGroupLayer = groupLayer;
    this.map.addLayer(groupLayer);

    const regions = this.config.enabledRegions();

    // TODO rxjs design, switchMap, Subject<Criteria>
    if (this.config.parallelRegionRequests()) {
      Promise.all(regions.map((r) => this.addCOGLayer(r, groupLayer, criteria))).then(
        () => {
          console.log("done")
        }
      )
    } else {
      for (let region of regions) {
        await this.addCOGLayer(region, groupLayer, criteria);
      }
    }

    const tilesGroup = new GroupLayer({
      title: 'Assessed Regions (Tiles)',
      blendMode: 'destination-out'
    });
    this.tilesAssessedRegionsGroupLayer = tilesGroup;
    this.map.addLayer(tilesGroup);
    this.styleEditorLayer.set(tilesGroup);

    for (const region of regions) {
      this.addTileLayer(region, criteria);
    }
  }

  clearAssessedLayers() {
    const groupLayer = this.cogsAssessedRegionsGroupLayer;
    if (groupLayer) {
      for (const layer of groupLayer.layers) {
        console.log(layer);
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
    this.cogsAssessedRegionsGroupLayer = undefined;

    this.tilesAssessedRegionsGroupLayer?.destroy();
    this.tilesAssessedRegionsGroupLayer = undefined;
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
    this.tilesAssessedRegionsGroupLayer!.add(layer);
  }

  openDrawer(mode: DrawerModes) {
    this.drawerMode.set(mode);
   this.drawer.toggle(true);
  }

  openConfig() {
    this.dialog.open(ConfigDialogComponent);
  }

  private async addCOGLayer(region: string, groupLayer: GroupLayer, criteria: SelectionCriteria) {
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
