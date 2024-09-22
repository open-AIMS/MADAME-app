import { Component, inject } from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MadameApiService} from "../../../api/madame-api.service";
import {FormsModule, NgForm} from "@angular/forms";

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButton, MatFormFieldModule, MatInput, FormsModule],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss'
})
export class LoginDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LoginDialogComponent>);
  readonly api = inject(MadameApiService);

  register(form: NgForm) {
    // this.api.register()
  }

  onSubmit(form: NgForm) {
    console.log("submit", form.form.value);
  }
}
