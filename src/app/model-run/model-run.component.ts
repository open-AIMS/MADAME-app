import { Component, input, Signal } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ComponentLibraryModule } from '@arcgis/map-components-angular';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import { ApiService } from '../api.service';
import { Observable, of, switchMap } from 'rxjs';
import { ResultSetInfo } from '../../types/api.type';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-model-run',
  standalone: true,
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss',
  imports: [MatCardModule, MatButtonModule, DatePipe, MatIconModule, RouterLink, ComponentLibraryModule, AsyncPipe]
})
export class ModelRunComponent {

  id = input.required<string>();

  run$: Observable<ResultSetInfo>;
  run: Signal<ResultSetInfo | undefined>;

  mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';

  constructor(private api: ApiService) {
    this.run$ = toObservable(this.id).pipe(
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
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready");
  }
}
