import {Component, DestroyRef, inject, Injector, runInInjectionContext, signal, ViewChild} from '@angular/core';
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
import {createSingleColorRasterFunction} from "../../util/arcgis/arcgis-layer-util";
import {MatTooltip} from "@angular/material/tooltip";
import {MatDialog} from "@angular/material/dialog";
import {ConfigDialogComponent} from "./config-dialog/config-dialog.component";
import {ReefGuideConfigService} from "./reef-guide-config.service";
import {concat, concatMap, delay, mergeMap, Observable, of} from "rxjs";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {AsyncPipe} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {CriteriaRequest, ReadyRegion} from "./selection-criteria/criteria-request.class";
import {MatSnackBar} from "@angular/material/snack-bar";
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
    MatProgressSpinner,
    LayerStyleEditorComponent,
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);
  private readonly snackbar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  drawerMode = signal<DrawerModes>('criteria');

  @ViewChild(ArcgisMap) map!: ArcgisMap;
  @ViewChild('drawer') drawer!: MatDrawer;

  styleEditorLayer = signal<GroupLayer | undefined>(undefined);

  private tilesAssessedRegionsGroupLayer?: GroupLayer;

  mapItemId$: Observable<string | null>;

  criteriaRequest = signal<CriteriaRequest | undefined>(undefined);

  assessedRegionsGroupLayer = signal<GroupLayer | undefined>(undefined);

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

  addCOGLayers(criteria: SelectionCriteria) {
    console.log('submitSelectionCriteria', criteria);

    this.clearAssessedLayers();

    const regions$ = toObservable(this.config.enabledRegions, { injector: this.injector })
      .pipe(mergeMap(regions => of(...regions)));

    const criteriaRequest = runInInjectionContext(this.injector, () => new CriteriaRequest(criteria, regions$));
    this.criteriaRequest.set(criteriaRequest);

    const groupLayer = new GroupLayer({
      title: 'Assessed Regions',
    });
    this.assessedRegionsGroupLayer.set(groupLayer);
    this.map.addLayer(groupLayer);

    criteriaRequest.regionError$
      .subscribe(region => this.handleRegionError(region))

    criteriaRequest.regionReady$
      // unsubscribe when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(region => this.addRegionLayer(region, groupLayer))
  }

  addTileLayers(criteria: SelectionCriteria) {
    const tilesGroup = new GroupLayer({
      title: 'Assessed Regions (Tiles)',
      blendMode: 'destination-out'
    });
    this.tilesAssessedRegionsGroupLayer = tilesGroup;
    this.map.addLayer(tilesGroup);
    this.styleEditorLayer.set(tilesGroup);

    const regions = this.config.enabledRegions();
    for (const region of regions) {
      this.addTileLayer(region, criteria);
    }
  }

  /**
   * Cancel any CriteriaRequest and destroy map layers.
   */
  clearAssessedLayers() {
    // cancel current request if any
    this.cancelCriteriaRequest();

    const groupLayer = this.assessedRegionsGroupLayer();
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
    this.assessedRegionsGroupLayer.set(undefined);

    this.tilesAssessedRegionsGroupLayer?.destroy();
    this.tilesAssessedRegionsGroupLayer = undefined;
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

  /**
   * User submitted new criteria, clear current layers and request new layers.
   * @param criteria
   */
  onAssess(criteria: SelectionCriteria) {
    this.addCOGLayers(criteria);
    this.addTileLayers(criteria);
  }

  getLoadingRegionsMessage(busyRegions: Set<string>) {
    const vals = Array.from(busyRegions).join(', ');
    return `Loading: ${vals}`;
  }

  private handleRegionError(region: string) {
    console.warn('handleRegionError', region);
    // TODO multi-error display. this replaces previous error.
    this.snackbar.open(`Error loading ${region}`, 'OK');
  }
}
