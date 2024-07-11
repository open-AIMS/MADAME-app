import { Component, input, Signal } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ComponentLibraryModule } from '@arcgis/map-components-angular';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import { ApiService } from '../api.service';
import { Observable, of, switchMap } from 'rxjs';
import { DataFrame, ResultSetInfo } from '../../types/api.type';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { DataframeTableComponent } from "../dataframe-table/dataframe-table.component";
import { MatExpansionModule } from '@angular/material/expansion';
import { ModelspecExplorerComponent } from "../model/modelspec-explorer/modelspec-explorer.component";

@Component({
  selector: 'app-model-run',
  standalone: true,
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss',
  imports: [MatExpansionModule, MatButtonModule, DatePipe, MatIconModule, RouterLink, ComponentLibraryModule, AsyncPipe, NgIf, MatTabsModule, DataframeTableComponent, ModelspecExplorerComponent]
})
export class ModelRunComponent {

  id = input.required<string>();

  run$: Observable<ResultSetInfo>;
  run: Signal<ResultSetInfo | undefined>;

  mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';

  modelspecDataframe$: Observable<DataFrame>;
  scenariosDataframe$: Observable<DataFrame>;

  constructor(private api: ApiService) {
    // TODO share needed?
    const id$ = toObservable(this.id);

    this.run$ = id$.pipe(
      switchMap(id => {
        // HACK mock data has integer ids
        if (isNaN(Number(id))) {
          return this.api.getResultSetInfo(id)
        } else {
          const run = MODEL_RUNS.find(m => m.id === id);
          if (run === undefined) {
            throw new Error(`MODEL_RUNS missing id=${id}`);
          }
          return of(run);
        }
      }),
    );
    this.run = toSignal(this.run$);

    this.modelspecDataframe$ = id$.pipe(
      switchMap(id => this.api.getResultSetModelSpec(id))
    );

    this.scenariosDataframe$ = id$.pipe(
      switchMap(id => this.api.getResultSetScenarios(id))
    );
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready");
  }
}
