import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdriaApiService } from '../adria-api.service';
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
  myForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.successful_execution = false;

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
    }
  }
}
