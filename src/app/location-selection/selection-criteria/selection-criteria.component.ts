import {Component, output, QueryList, ViewChildren} from '@angular/core';
import {CalciteComponentsModule, CalciteSlider} from "@esri/calcite-components-angular";
import {MatSliderModule} from "@angular/material/slider";
import {MatDivider} from "@angular/material/divider";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatToolbar} from "@angular/material/toolbar";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatTooltip} from "@angular/material/tooltip";

export type SelectionCriteria = Record<string, [number, number]>;

interface SelectionCriteriaInputDef {
  // field/id used by API
  id: string;
  name: string;
  desc?: string;
  min: number;
  max: number;
  step?: number;
}

@Component({
  selector: 'app-selection-criteria',
  standalone: true,
  imports: [
    MatSliderModule,
    CalciteComponentsModule,
    MatDivider,
    FormsModule,
    MatButton,
    MatToolbar,
    MatProgressSpinner,
    MatTooltip
  ],
  templateUrl: './selection-criteria.component.html',
  styleUrl: './selection-criteria.component.scss'
})
export class SelectionCriteriaComponent {

  /*
  Distance to Nearest Port (NM): 0.0:200.0
  Good if you add just a little bit beyond these bounds, like +1, except where the lower bound is zero.
   */

  criteria: Array<SelectionCriteriaInputDef> = [
    {
      id: 'Depth',
      name: 'Depth (m)',
      // Bathy: -9.0:-2.0
      min: -10,
      max: 0,
      step: 0.5
    },
    {
      id: 'Slope',
      name: 'Slope',
      // Slope: 0.0:40.0
      min: 0,
      max: 45
    },
    {
      id: 'Turbidity',
      name: 'Turbidity',
      // Turbidity: 0.0:58.0
      min: 0,
      max: 60
    },
    {
      id: 'WavesHs',
      name: ' Significant Wave Height (Hs)',
      min: 0,
      max: 1,
      step: 0.1
    },
    {
      id: 'WavesTp',
      name: 'Wave Period',
      // Wave Period: 0.0:6.0
      min: 0,
      max: 6,
      step: 0.5
    }
  ];

  // form isn't working with Calcite, so we get form data via ViewChildren access
  // @ViewChild('form') form!: NgForm;

  @ViewChildren(CalciteSlider) sliders!: QueryList<CalciteSlider>;

  getCriteria(): SelectionCriteria {
    const valueEntries = this.sliders.map(s => [s.name, s.value]);
    return Object.fromEntries(valueEntries);
  }

  /**
   * Reset all criteria to min/max.
   */
  reset() {
    this.sliders.forEach(s => {
      s.minValue = s.min;
      s.maxValue = s.max;
    });
  }
}
