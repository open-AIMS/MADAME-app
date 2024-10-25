import {
  Component,
  inject,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import {
  CalciteComponentsModule,
  CalciteSlider,
} from '@esri/calcite-components-angular';
import { MatSliderModule } from '@angular/material/slider';
import { MatDivider } from '@angular/material/divider';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { ReefGuideMapService } from '../reef-guide-map.service';
import {
  CriteriaAssessment,
  SiteSuitabilityCriteria,
} from '../reef-guide-api.types';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';

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
    MatTooltip,
    MatIconButton,
    MatIcon,
    MatFormFieldModule,
    MatInput,
    MatSlideToggle,
    ReactiveFormsModule,
  ],
  templateUrl: './selection-criteria.component.html',
  styleUrl: './selection-criteria.component.scss',
})
export class SelectionCriteriaComponent {
  readonly mapService = inject(ReefGuideMapService);
  readonly formBuilder = inject(FormBuilder);

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
      step: 0.5,
    },
    {
      id: 'Slope',
      name: 'Slope',
      // Slope: 0.0:40.0
      min: 0,
      max: 45,
    },
    {
      id: 'Turbidity',
      name: 'Turbidity',
      // Turbidity: 0.0:58.0
      min: 0,
      max: 60,
    },
    {
      id: 'WavesHs',
      name: ' Significant Wave Height (Hs)',
      min: 0,
      max: 1,
      step: 0.1,
    },
    {
      id: 'WavesTp',
      name: 'Wave Period',
      // Wave Period: 0.0:6.0
      min: 0,
      max: 6,
      step: 0.5,
    },
  ];

  enableSiteSuitability = signal(false);

  // form isn't working with Calcite, so we get form data via ViewChildren access
  // @ViewChild('form') form!: NgForm;

  siteForm: FormGroup;

  @ViewChildren(CalciteSlider) sliders!: QueryList<CalciteSlider>;

  constructor() {
    this.siteForm = this.formBuilder.group({
      xdist: [450, [Validators.min(1), Validators.required]],
      ydist: [50, [Validators.min(1), Validators.required]],
      SuitabilityThreshold: [50, Validators.required],
    });
  }

  getCriteria(): CriteriaAssessment {
    const valueEntries = this.sliders.map(s => [s.name, s.value]);
    const criteria = Object.fromEntries(valueEntries);

    let siteSuitability: SiteSuitabilityCriteria | undefined = undefined;
    if (this.enableSiteSuitability() && this.siteForm.valid) {
      siteSuitability = this.siteForm.value;
    }

    return {
      criteria,
      siteSuitability,
    };
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
