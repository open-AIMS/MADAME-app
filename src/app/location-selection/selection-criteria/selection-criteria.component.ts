import {Component} from '@angular/core';
import {CalciteComponentsModule} from "@esri/calcite-components-angular";
import {MatSliderModule} from "@angular/material/slider";
import {MatDivider} from "@angular/material/divider";

interface SelectionCriteria {
  // field/id used in date
  id: string;
  name: string;
  desc: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-selection-criteria',
  standalone: true,
  imports: [
    MatSliderModule,
    CalciteComponentsModule,
    MatDivider,
  ],
  templateUrl: './selection-criteria.component.html',
  styleUrl: './selection-criteria.component.scss'
})
export class SelectionCriteriaComponent {

  // TODO mock data, load from API
  criteria: Array<SelectionCriteria> = ['Depth', 'Benthic', 'Geomorphic', 'Slope', 'Turbidity',
    'WavesHs', 'WavesTp', 'Rugosity']
    .map(name => {
      return {
        id: name,
        name,
        desc: name,
        min: 0,
        max: 100
      }
    });

}
