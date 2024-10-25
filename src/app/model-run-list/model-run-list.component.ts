import { Component } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdriaApiService } from '../adria-api.service';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

interface ModelRun {
  id: string;
  title: string;
  desc?: string;
  handle_id?: string;
}

@Component({
  selector: 'app-model-run-list',
  standalone: true,
  templateUrl: './model-run-list.component.html',
  styleUrl: './model-run-list.component.scss',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatRippleModule,
    MatIconModule,
    RouterLink,
    AsyncPipe,
  ],
})
export class ModelRunListComponent {
  runs$: Observable<Array<ModelRun>>;

  constructor(private api: AdriaApiService) {
    this.runs$ = this.api.getResultSets().pipe(
      map(ids => {
        const x: Array<ModelRun> = [
          ...ids.map(id => {
            return {
              id,
              title: id,
            };
          }),
          ...MODEL_RUNS,
        ];
        return x;
      })
    );
  }
}
