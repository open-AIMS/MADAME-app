import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdriaApiService, ModelRunParams } from '../adria-api.service';
import { map, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-model-invoke-run',
  standalone: true,
  templateUrl: 'model-invoke-run.component.html',
  styleUrl: 'model-invoke-run.component.scss',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatRippleModule,
    MatIconModule,
    RouterLink,
    AsyncPipe,
    ReactiveFormsModule,
  ]
})
export class ModelInvokeRunComponent {
  successful_execution: boolean;
  model_run_name: string = "";
  myForm: FormGroup;
  model_params: ModelRunParams

  constructor(private fb: FormBuilder, private api: AdriaApiService) {
    this.successful_execution = false;
    this.model_params = new ModelRunParams();

    this.myForm = this.fb.group({
      runName: ['', Validators.required],
      numScenarios: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      ta_lower: ['', [Validators.required, Validators.pattern('^-?[0-9]+(\\.[0-9]+)?$')]],
      ta_upper: ['', [Validators.required, Validators.pattern('^-?[0-9]+(\\.[0-9]+)?$')]]
    });
  }

  onSubmit() {
    if (this.myForm.valid) {
      console.log('Form Submitted!', this.myForm.value);
    } else {
      console.log('Form is invalid');
      return;
    }
    this.model_params.runName = this.myForm.get("runName")!.value
    this.model_params.numScenarios = this.myForm.get("numScenarios")!.value
    this.model_params.ta_lower = this.myForm.get("ta_lower")!.value
    this.model_params.ta_upper = this.myForm.get("ta_upper")!.value

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
