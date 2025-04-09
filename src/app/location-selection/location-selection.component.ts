import { AsyncPipe, CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import {
  ArcgisMap,
  ComponentLibraryModule,
} from '@arcgis/map-components-angular';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { AdminPanelComponent } from '../admin/user-panel/user-panel.component';
import { AuthService } from '../auth/auth.service';
import { LoginDialogComponent } from '../auth/login-dialog/login-dialog.component';
import { ClusterAdminDialogComponent } from '../admin/cluster/ClusterAdminDialog.component';
import { LayerStyleEditorComponent } from '../widgets/layer-style-editor/layer-style-editor.component';
import { ConfigDialogComponent } from './config-dialog/config-dialog.component';
import { ReefGuideApiService } from './reef-guide-api.service';
import { CriteriaAssessment } from './reef-guide-api.types';
import { ReefGuideConfigService } from './reef-guide-config.service';
import { ReefGuideMapService } from './reef-guide-map.service';
import { SelectionCriteriaComponent } from './selection-criteria/selection-criteria.component';

type DrawerModes = 'criteria' | 'style';

/**
 * Prototype of Location Selection app.
 * Map be split-off as its own project in the future.
 */
@Component({
  selector: 'app-location-selection',
  imports: [
    CommonModule,
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
    CommonModule,
    MatMenuModule,
    MatProgressBar,
  ],
  providers: [ReefGuideMapService],
  templateUrl: './location-selection.component.html',
  styleUrl: './location-selection.component.scss',
})
export class LocationSelectionComponent implements AfterViewInit {
  readonly config = inject(ReefGuideConfigService);
  readonly authService = inject(AuthService);
  readonly api = inject(ReefGuideApiService);
  readonly dialog = inject(MatDialog);
  readonly mapService = inject(ReefGuideMapService);

  drawerMode = signal<DrawerModes>('criteria');

  /**
   * Assess related layer is loading.
   */
  isAssessing$: Observable<boolean>;

  @ViewChild(ArcgisMap) map!: ArcgisMap;
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor() {
    this.isAssessing$ = combineLatest([
      toObservable(this.mapService.siteSuitabilityLoading),
      toObservable(this.mapService.criteriaRequest).pipe(
        switchMap(cr => {
          if (cr) {
            return cr.busyRegions$.pipe(map(r => r.size > 0));
          } else {
            return of(false);
          }
        })
      ),
    ]).pipe(
      // any busy
      map(vals => vals.includes(true))
    );
  }

  ngAfterViewInit() {
    this.mapService.setMap(this.map);
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log('arcgis map click', event);
    // const view = this.map.view;
    // const resp = await view.hitTest(event.detail);
    const point = event.detail.mapPoint;
    // point.spatialReference
    console.log(
      `Point ${point.x}, ${point.y} Lon/Lat ${point.longitude}, ${point.latitude}`
    );
  }

  openDrawer(mode: DrawerModes) {
    if (mode === 'criteria') {
      this.mapService.updateCriteriaLayerStates();
    }
    this.drawerMode.set(mode);
    this.drawer.toggle(true);
  }

  openAdminPanel() {
    this.dialog.open(AdminPanelComponent, {
      width: '800px',
    });
  }

  openConfig() {
    this.dialog.open(ConfigDialogComponent);
  }

  openLogin() {
    this.dialog.open(LoginDialogComponent);
  }

  openClusterAdmin() {
    this.dialog.open(ClusterAdminDialogComponent, {
      width: '800px',
    });
  }

  /**
   * User submitted new criteria, clear current layers and request new layers.
   * @param assessment
   */
  onAssess(assessment: CriteriaAssessment) {
    const { criteria, siteSuitability } = assessment;

    this.mapService.clearAssessedLayers();

    const layerTypes = this.config.assessLayerTypes();
    if (layerTypes.includes('cog')) {
      this.mapService.addCOGLayers(criteria);
    }
    if (layerTypes.includes('tile')) {
      this.mapService.addTileLayers(criteria);
    }

    if (siteSuitability) {
      this.mapService.addSiteSuitabilityLayer(criteria, siteSuitability);
    }
  }

  getLoadingRegionsMessage(busyRegions: Set<string> | null): string {
    if (busyRegions == null) {
      return '';
    }
    const vals = Array.from(busyRegions).join(', ');
    return `Loading: ${vals}`;
  }
}
