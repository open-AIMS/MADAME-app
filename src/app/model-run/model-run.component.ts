import { Component, input, Signal, ViewChild } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ArcgisMap, ComponentLibraryModule } from '@arcgis/map-components-angular';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import { ApiService } from '../api.service';
import { map, Observable, of, switchMap } from 'rxjs';
import { DataFrame, ResultSetInfo } from '../../types/api.type';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { TableComponent } from "../table/table.component";
import { MatExpansionModule } from '@angular/material/expansion';
import { ModelspecExplorerComponent } from "../model/modelspec-explorer/modelspec-explorer.component";
import { dataframeToTable, SimpleTable } from '../../util/dataframe-util';

@Component({
  selector: 'app-model-run',
  standalone: true,
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss',
  imports: [MatExpansionModule, MatButtonModule, DatePipe, MatIconModule, RouterLink, ComponentLibraryModule, AsyncPipe, NgIf, MatTabsModule, TableComponent, ModelspecExplorerComponent]
})
export class ModelRunComponent {

  id = input.required<string>();

  run$: Observable<ResultSetInfo>;
  run: Signal<ResultSetInfo | undefined>;

  mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';

  modelspecDataframe$: Observable<DataFrame>;
  scenariosTable$: Observable<SimpleTable>;

  @ViewChild(ArcgisMap) map!: ArcgisMap;

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

    this.scenariosTable$ = id$.pipe(
      switchMap(id => this.api.getResultSetScenarios(id)),
      map(dataframeToTable)
    );
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log("arcgis map click", event);
    const view = this.map.view;
    const resp = await view.hitTest(event.detail);
    console.log("resp", resp);

    /*
    view.hitTest(event).then(function(response) {
      var results = response.results;
      if (results.length > 0) {
        var graphic = results.filter(function(result) {
          return result.graphic.layer === featureLayer;
        })[0].graphic;

        console.log("Selected feature:", graphic);
        // Perform actions with the selected graphic
      }
    });
    */

  }
}
