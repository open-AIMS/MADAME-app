import {Component, DestroyRef, inject, Injector, signal, ViewChild} from '@angular/core';
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
  ],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss'
})
export class LocationSelectionComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  @ViewChild(ArcgisMap) map!: ArcgisMap;

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

  async submitSelectionCriteria(criteria: SelectionCriteria) {
    console.log('submitSelectionCriteria', criteria);

    this.clearAssessedLayers();

    const regions$ = toObservable(this.config.enabledRegions, { injector: this.injector })
      .pipe(mergeMap(regions => of(...regions)));

    const criteriaRequest = new CriteriaRequest(criteria, regions$, this.api, this.config);
    this.criteriaRequest.set(criteriaRequest);

    const groupLayer = new GroupLayer({
      title: 'Assessed Regions',
    });
    this.assessedRegionsGroupLayer.set(groupLayer);
    this.map.addLayer(groupLayer);

    criteriaRequest.regionReady$
      // unsubscribe when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(region => this.addRegionLayer(region, groupLayer))
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
            console.log("revoke", layer.url);
            URL.revokeObjectURL(layer.url);
          })
        }
        layer.destroy();
      }
    }

    groupLayer?.destroy();
    this.assessedRegionsGroupLayer.set(undefined);
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

  openConfig() {
    this.dialog.open(ConfigDialogComponent);
  }

  private async addRegionLayer(region: ReadyRegion, groupLayer: GroupLayer) {
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
    // TODO error handling
    this.submitSelectionCriteria(criteria);
  }

  getLoadingRegionsMessage(busyRegions: Set<string>) {
    const vals = Array.from(busyRegions).join(', ');
    return `Loading: ${vals}`;
  }
}
