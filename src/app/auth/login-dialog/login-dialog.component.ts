import {Component, inject, signal} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {WebApiService} from "../../../api/web-api.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";

type Modes = "register" | "login";

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButton, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login-dialog.component.html',
  styleUrl: './login-dialog.component.scss'
})
export class LoginDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LoginDialogComponent>);
  readonly api = inject(WebApiService);

  mode = signal<Modes>("login");

  form = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  })

  constructor() {
    // check if already logged-in
    // TODO maybe auth service should do this
    this.api.getProfile().subscribe({
      next: profile => {
        // TODO show logout
        console.log("got profile");
      },
      error: error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            console.log("TODO login");
          }
        }
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const value = this.form.value as { email: string; password: string };

      if (this.mode() === 'register') {
        this.login(value);
      } else {
        this.register(value);
      }
    }
    {
      console.warn('submitted invalid form');
    }

  }

  private register(value: { email: string; password: string }) {
    console.info('login', value.email);
    this.api.login(value).subscribe(() => {
      this.api.getProfile().subscribe(x => {
        console.log('profile', x);
        // authService.setToken
      })
    });
  }

  private login(value: { email: string; password: string }) {
    console.info('register', value.email);
    this.api.register(value).subscribe({
      next: () => {
        this.api.getProfile().subscribe(x => {
          console.log('registered profile', x);
        })
      },
      error: err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 400 && err.message === "User already exists") {
            console.log("user exists");
            // TODO invalidate email, show message
          }
        }
      }
    });
  }
}
