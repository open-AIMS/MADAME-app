import {Component, input, Signal, ViewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {AsyncPipe, DatePipe, NgIf} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {ArcgisMap, ComponentLibraryModule} from '@arcgis/map-components-angular';
import {ApiService} from '../api.service';
import {map, Observable, switchMap} from 'rxjs';
import {DataFrame, ResultSetInfo} from '../../types/api.type';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatTabsModule} from '@angular/material/tabs';
import {TableComponent} from "../table/table.component";
import {MatExpansionModule} from '@angular/material/expansion';
import {ModelspecExplorerComponent} from "../model/modelspec-explorer/modelspec-explorer.component";
import {dataframeToTable, SimpleTable} from '../../util/dataframe-util';
import {ReefMapComponent} from "../reef-map/reef-map.component";
import {ResultSetService} from '../contexts/result-set.service';
import {MatToolbar} from "@angular/material/toolbar";


@Component({
  selector: 'app-model-run',
  standalone: true,
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss',
  imports: [MatExpansionModule, MatButtonModule, DatePipe, MatIconModule, RouterLink, ComponentLibraryModule, AsyncPipe, NgIf, MatTabsModule, TableComponent, ModelspecExplorerComponent, ReefMapComponent, MatToolbar],
  providers: [ResultSetService]
})
export class ModelRunComponent {

  id = input.required<string>();

  // move this to ResultSetContext instead?
  run$: Observable<ResultSetInfo>;
  run: Signal<ResultSetInfo | undefined>;

  mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';

  modelspecDataframe$: Observable<DataFrame>;
  scenariosTable$: Observable<SimpleTable>;

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  constructor(private api: ApiService, private resultSetContext: ResultSetService) {
    // TODO share needed?
    const id$ = toObservable(this.id);

    // update the id in the ResultSet context
    id$.subscribe(id => this.resultSetContext.id = id);

    this.run$ = resultSetContext.info$;
    this.run = toSignal(this.run$);

    this.modelspecDataframe$ = id$.pipe(
      switchMap(id => this.api.getResultSetModelSpec(id))
    );

    this.scenariosTable$ = id$.pipe(
      switchMap(id => this.api.getResultSetScenarios(id)),
      map(dataframeToTable)
    );
  }
}
