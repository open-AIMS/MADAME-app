import { Component, computed, input } from '@angular/core';
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { ModelRun } from '../../types/model-run.type';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ComponentLibraryModule } from '@arcgis/map-components-angular';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';

@Component({
  selector: 'app-model-run',
  standalone: true,
  templateUrl: './model-run.component.html',
  styleUrl: './model-run.component.scss',
  imports: [MatCardModule, MatButtonModule, DatePipe, MatIconModule, RouterLink, ComponentLibraryModule]
})
export class ModelRunComponent {

  id = input.required<string>();

  mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';

  run = computed(() => {
    const id = this.id();
    const run = MODEL_RUNS.find(m => m.id === id);
    if (run === undefined) {
      throw new Error(`MODEL_RUNS missing id=${id}`);
    }
    return run;
  });

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready");
  }
}
