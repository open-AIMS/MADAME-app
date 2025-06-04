import {
  Component,
  EventEmitter,
  inject,
  Output,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import {
  CalciteComponentsModule,
  CalciteSlider,
} from '@esri/calcite-components-angular';
import { JobsStatusComponent } from '../../jobs/jobs-status/jobs-status.component';
import {
  CriteriaAssessment,
  SiteSuitabilityCriteria,
} from '../reef-guide-api.types';
import { ReefGuideConfigService } from '../reef-guide-config.service';
import { ReefGuideMapService } from '../reef-guide-map.service';
import { RegionJobsManager } from './region-jobs-manager';

interface SelectionCriteriaInputDef {
  // field/id used by API
  id: string;
  name: string;
  desc?: string;
  min: number;
  minValue?: number;
  max: number;
  maxValue?: number;
  step?: number;
  // Value converter from displayed values to value in CriteriaAssessment
  convertValue?: (value: number) => number;
  // swap the final values
  reverseValues?: boolean;
}

@Component({
  selector: 'app-selection-criteria',
  imports: [
    MatSliderModule,
    CalciteComponentsModule,
    FormsModule,
    MatIconButton,
    MatIcon,
    MatFormFieldModule,
    MatInput,
    MatSlideToggle,
    ReactiveFormsModule,
    JobsStatusComponent, // Add this import
    MatButtonModule, // Add this for the assess button
  ],
  templateUrl: './selection-criteria.component.html',
  styleUrl: './selection-criteria.component.scss',
})
export class SelectionCriteriaComponent {
  readonly mapService = inject(ReefGuideMapService);
  readonly formBuilder = inject(FormBuilder);
  readonly config = inject(ReefGuideConfigService);

  // Add event emitter for assessment
  @Output() assess = new EventEmitter<CriteriaAssessment>();

  // Add property to track active jobs manager
  currentJobsManager?: RegionJobsManager;

  criteria: Array<SelectionCriteriaInputDef> = [
    {
      id: 'Depth',
      name: 'Depth (m)',
      // Bathy: -9.0:-2.0
      // UI is positive, but API takes negative numbers
      min: 0,
      max: 16,
      minValue: 2,
      maxValue: 10,
      step: 0.5,
      // convert Depth to negative values required by API. [-10, -2]
      convertValue: v => -v,
      reverseValues: true,
    },
    {
      id: 'Slope',
      name: 'Slope (degrees)',
      // Slope: 0.0:40.0
      min: 0,
      max: 45,
    },
    {
      id: 'WavesHs',
      name: ' Significant Wave Height (Hs)',
      min: 0,
      max: 6,
      maxValue: 1,
      step: 0.1,
    },
    {
      id: 'WavesTp',
      name: 'Wave Period',
      // Wave Period: 0.0:6.0
      min: 0,
      max: 9,
      maxValue: 6,
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
      ydist: [20, [Validators.min(1), Validators.required]],
      SuitabilityThreshold: [95, Validators.required],
    });
  }

  getCriteria(): CriteriaAssessment {
    // build list of criteria ids with their final values.
    const valueEntries = this.sliders.map(s => {
      const crit = this.criteria.find(c => c.id === s.name);
      if (crit === undefined) {
        throw new Error(`Criteria with id ${s.name} not found`);
      }

      // all criteria are ranges
      let values = s.value as Array<number>;

      // convert values if function defined
      const { convertValue, reverseValues } = crit;
      if (convertValue !== undefined) {
        values = values.map(convertValue);
      }

      if (reverseValues === true) {
        values = [...values].reverse();
      }

      return [s.name, values];
    });
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
   * Reset all criteria to default values.
   */
  reset() {
    const { criteria } = this;
    this.sliders.forEach(s => {
      const c = criteria.find(c => c.id === s.name);
      if (c === undefined) {
        console.warn(`No criteria with id="${s.name}"`, s);
        return;
      }
      s.minValue = c.minValue ?? c.min;
      s.maxValue = c.maxValue ?? c.max;
    });
  }

  /**
   * Method to set the active jobs manager (to be called by parent component)
   */
  setJobsManager(manager: RegionJobsManager | undefined) {
    console.log("Setting jobs manager to ", manager)
    this.currentJobsManager = manager;
  }

  /**
   * Trigger assessment with current criteria
   */
  onAssess() {
    const criteria = this.getCriteria();
    this.assess.emit(criteria);
  }
}
