import {Component, inject, signal} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {WebApiService} from "../../../api/web-api.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../auth.service";
import {extractErrorMessage} from "../../../api/api-util";
import {merge, take} from "rxjs";

type Modes = "register" | "login";

type Credentials = { email: string; password: string };

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButton, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss'
})
export class LoginDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LoginDialogComponent>);
  readonly authService = inject(AuthService);
  readonly api = inject(WebApiService);

  mode = signal<Modes>("login");

  busy = signal(false);

  errorMessage = signal<string | undefined>(undefined);

  form = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  })

  onSubmit() {
    if (this.form.valid) {
      const value = this.form.value as Credentials;

      if (this.mode() === 'register') {
        this.register(value);
      } else {
        this.login(value);
      }
    } else {
      // shouldn't happen
      console.warn('submitted invalid form?');
    }
  }

  private login(value: Credentials) {
    console.info('login', value.email);
    this.busy.set(true);
    this.authService.login(value.email, value.password).subscribe({
      next: () => {
        this.busy.set(false);
        this.dialogRef.close();
      },
      error: err => this.handleError(err)
    });
  }

  private register(value: Credentials) {
    console.info('register', value.email);
    this.busy.set(true);
    this.api.register(value).subscribe({
      next: () => {
        this.api.getProfile().subscribe(x => {
          console.log('registered profile, logging in', x);
          this.login(value);
        })
      },
      error: err => this.handleError(err)
    });
  }

  private handleError(error: any) {
    this.busy.set(false);
    const errorMessage = extractErrorMessage(error)
    this.errorMessage.set(errorMessage);

    const {email, password} = this.form.controls;

    // set error without invalidating form
    if (errorMessage === 'Invalid email') {
      email.setErrors({
        invalid: true
      });
    } else if (errorMessage === 'Invalid credentials') {

      email.setErrors({
        invalid: true
      });
      password.setErrors({
        invalid: true
      });
      // in this case user only needs to fix one input, but form will
      // remain invalid until user changes both.
      merge(email.valueChanges, password.valueChanges)
        .pipe(take(1))
        .subscribe(() => {
          this.errorMessage.set(undefined);
          email.updateValueAndValidity();
          password.updateValueAndValidity();
        });
    }
  }
}
