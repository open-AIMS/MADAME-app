import { Component, Input } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { ModelRun } from '../../types/model-run.type';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-model-run',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, DatePipe, MatIconModule, RouterLink],
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss'
})
export class ModelRunComponent {

  // TODO signal?
  run?: ModelRun;

  @Input()
  set id(id: string) {
    const run = MODEL_RUNS.find(m => m.id === id);
    console.log("id", id, run);
    this.run = run;
  }
}
