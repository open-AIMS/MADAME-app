import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AdriaApiService } from '../adria-api.service';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModelScenariosDesc, ModelParamDesc } from '../../types/api.type';

@Component({
  selector: 'app-model-invoke-run',
  standalone: true,
  templateUrl: 'model-invoke-run.component.html',
  styleUrl: 'model-invoke-run.component.scss',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatRippleModule,
    MatSliderModule,
    RouterLink,
    AsyncPipe,
    ReactiveFormsModule,
    MatProgressSpinner,
  ],
})
export class ModelInvokeRunComponent {
  is_loading: boolean = false;
  successful_execution: boolean;
  model_run_id: string = '';
  myForm: FormGroup;
  model_params: ModelScenariosDesc;

  constructor(
    private fb: FormBuilder,
    private api: AdriaApiService,
    private router: Router
  ) {
    this.successful_execution = false;
    this.model_params = {} as ModelScenariosDesc;

    this.myForm = this.fb.group({
      runName: ['', Validators.required],
      numScenarios: [0, [Validators.required, this.powerOfTwoValidator]],
      ta_lower: 0,
      ta_upper: 1000000,
    });

    this.myForm = this.fb.group({
      runName: ['', Validators.required],
      numScenarios: [0, [Validators.required, this.powerOfTwoValidator]],

      // tabular Acropora
      ta_lower: 0,
      ta_upper: 1000000,

      // corymbose Acropora
      ca_lower: 0,
      ca_upper: 1000000,

      // Small massives
      sm_lower: 0,
      sm_upper: 1000000,
    });
  }

  millionDeployed(value: number): string {
    return `${value / 1000000}M`;
  }

  powerOfTwoValidator(control: FormControl) {
    const value = control.value;
    return (value & (value - 1)) === 0 ? null : { notPowerOfTwo: true };
  }

  onSubmit() {
    if (this.myForm.valid) {
      console.log('Form Submitted!', this.myForm.value);
    } else {
      console.log('Form is invalid');
      return;
    }
    this.model_params.run_name = this.myForm.get('runName')!.value;
    this.model_params.num_scenarios = Number(
      this.myForm.get('numScenarios')!.value
    );

    const ta_params = {
      param_name: 'N_seed_TA',
      third_param_flag: true,
      lower: this.myForm.get('ta_lower')!.value,
      upper: this.myForm.get('ta_upper')!.value,
      optional_third: 100000, // Discrete uniform, third param is step size
    } as ModelParamDesc;

    const ca_params = {
      param_name: 'N_seed_CA',
      third_param_flag: true,
      lower: this.myForm.get('ca_lower')!.value,
      upper: this.myForm.get('ca_upper')!.value,
      optional_third: 100000, // Discrete uniform, third param is step size
    } as ModelParamDesc;

    const sm_params = {
      param_name: 'N_seed_SM',
      third_param_flag: true,
      lower: this.myForm.get('sm_lower')!.value,
      upper: this.myForm.get('sm_upper')!.value,
      optional_third: 100000, // Discrete uniform, third param is step size
    } as ModelParamDesc;

    this.model_params.model_params = Array<ModelParamDesc>(
      ta_params,
      ca_params,
      sm_params
    );

    this.api.postModelInvokeRun(this.model_params).subscribe({
      next: response => {
        this.successful_execution = true;
        this.model_run_id = response.run_name;
        this.is_loading = false;
        this.router.navigate([`view-run/${this.model_run_id}`]);
      },
      error: error => {
        this.is_loading = false;
        this.successful_execution = false;
        if (error.message.includes('Bad Request')) {
          console.error('There was a 400 error!', error);
        } else {
          console.error('There was an error!', error);
        }
      },
    });
    this.is_loading = true;
  }
}
