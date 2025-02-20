import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { RouterLink } from '@angular/router';
import { AdriaApiService, ModelRunParams } from '../adria-api.service';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModelScenariosDesc, ModelParamDesc} from '../../types/api.type';

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
  ]
})
export class ModelInvokeRunComponent {
  successful_execution: boolean;
  model_run_name: string = "";
  myForm: FormGroup;
  model_params: ModelScenariosDesc;

  constructor(private fb: FormBuilder, private api: AdriaApiService) {
    this.successful_execution = false;
    this.model_params = {
    } as ModelScenariosDesc;

    this.myForm = this.fb.group({
      runName: ['', Validators.required],
      numScenarios: [0, [Validators.required, this.powerOfTwoValidator]],
      ta_lower: 0,
      ta_upper: 1000000,
    });
  }

  thousandDeployed(value: number): string {
    return `${value / 1000}k`
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
    this.model_params.run_name = this.myForm.get("runName")!.value
    this.model_params.num_scenarios = this.myForm.get("numScenarios")!.value

    const ta_params = {
      name: "N_seeded_TA",
      third_param_flag: true,
      lower: this.myForm.get("ta_lower")!.value,
      upper: this.myForm.get("ta_upper")!.value,
      optional_third: (this.myForm.get("ta_upper")!.value - this.myForm.get("ta_lower")!.value) / 10
    } as ModelParamDesc;

    this.model_params.model_params = Array<ModelParamDesc>(ta_params);

    this.api.postModelInvokeRun(this.model_params).subscribe({
      next: (response) => {
        this.successful_execution = true;
        this.model_run_name = response.run_name
        console.log(this.model_run_name);
        console.log('Response:', response);
      },
      error: (error) => {
        if (error.message.includes('Bad Request')) {
          console.error('There was a 400 error!', error);
        } else {
          console.error('There was an error!', error);
        }
      }
    });
  }
}
