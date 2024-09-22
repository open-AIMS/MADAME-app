import {AfterViewInit, Component, inject, signal, ViewChild} from '@angular/core';
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {ArcgisMap, ComponentLibraryModule} from "@arcgis/map-components-angular";
import {ArcgisMapCustomEvent} from "@arcgis/map-components";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {SelectionCriteria, SelectionCriteriaComponent} from "./selection-criteria/selection-criteria.component";
import {ReefGuideApiService} from "./reef-guide-api.service";
import {MatTooltip} from "@angular/material/tooltip";
import {MatDialog} from "@angular/material/dialog";
import {ConfigDialogComponent} from "./config-dialog/config-dialog.component";
import {ReefGuideConfigService} from "./reef-guide-config.service";
import {AsyncPipe} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {LayerStyleEditorComponent} from "../widgets/layer-style-editor/layer-style-editor.component";
import {ReefGuideMapService} from "./reef-guide-map.service";
import {MatAccordion, MatExpansionModule} from "@angular/material/expansion";
import {LoginDialogComponent} from "../auth/login-dialog/login-dialog.component";

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
    MatProgressSpinner,
    LayerStyleEditorComponent,
    MatAccordion,
    MatExpansionModule,
  ],
  providers: [ReefGuideMapService],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent implements AfterViewInit {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);
  readonly mapService = inject(ReefGuideMapService);

  drawerMode = signal<DrawerModes>('criteria');

  @ViewChild(ArcgisMap) map!: ArcgisMap;
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor() {
  }

  ngAfterViewInit() {
    this.mapService.setMap(this.map);

    setTimeout(() => {
      this.dialog.open(LoginDialogComponent);
    }, 500)
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log("arcgis map click", event);
    // const view = this.map.view;
    // const resp = await view.hitTest(event.detail);
  }

  openDrawer(mode: DrawerModes) {
    this.drawerMode.set(mode);
    this.drawer.toggle(true);
  }

  openConfig() {
    this.dialog.open(ConfigDialogComponent);
  }

  /**
   * User submitted new criteria, clear current layers and request new layers.
   * @param criteria
   */
  onAssess(criteria: SelectionCriteria) {
    this.mapService.clearAssessedLayers();

    const layerTypes = this.config.assessLayerTypes();
    if (layerTypes.includes("cog")) {
      this.mapService.addCOGLayers(criteria);
    }
    if (layerTypes.includes("tile")) {
      this.mapService.addTileLayers(criteria);
    }
  }

  getLoadingRegionsMessage(busyRegions: Set<string>) {
    const vals = Array.from(busyRegions).join(', ');
    return `Loading: ${vals}`;
  }
}
