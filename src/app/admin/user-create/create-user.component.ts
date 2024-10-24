import { CommonModule } from '@angular/common';
import { Component, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserRole } from '../../../api/web-api.types';
import { AdminService } from '../admin.service';
import { MatIconModule } from '@angular/material/icon';

interface CreateUserForm {
  email: FormControl<string>;
  password: FormControl<string>;
  roles: FormControl<UserRole[]>;
}

@Component({
  selector: 'app-admin-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  template: `
    <div class="create-user-dialog">
      <h2 matDialogTitle>Create a new User</h2>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-fields">
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input
                matInput
                formControlName="email"
                type="email"
                autocomplete="email"
                [attr.aria-label]="'Email address'"
              />
              <mat-error *ngIf="email.errors?.['required']">
                Email is required
              </mat-error>
              <mat-error *ngIf="email.errors?.['email']">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="hidePassword ? 'password' : 'text'"
                autocomplete="new-password"
                [attr.aria-label]="'Password'"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="'Toggle password visibility'"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
              <mat-error *ngIf="password.errors?.['required']">
                Password is required
              </mat-error>
              <mat-error *ngIf="password.errors?.['minlength']">
                Password must be at least 8 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>User Roles</mat-label>
              <mat-select
                formControlName="roles"
                multiple
                [attr.aria-label]="'Select user roles'"
              >
                <mat-option *ngFor="let role of availableRoles" [value]="role">
                  {{ role | titlecase }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="roles.errors?.['required']">
                Please select at least one role
              </mat-error>
            </mat-form-field>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button
            mat-button
            mat-dialog-close
            type="button"
            [disabled]="isSubmitting()"
          >
            Cancel
          </button>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="!userForm.valid || isSubmitting()"
          >
            <span class="button-content">
              <mat-spinner
                *ngIf="isSubmitting()"
                diameter="20"
                class="spinner"
              ></mat-spinner>
              {{ isSubmitting() ? 'Creating...' : 'Create User' }}
            </span>
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .create-user-dialog {
        mat-dialog-title {
          margin: 0;
          padding: 24px 24px 0;
          font-size: 24px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
        }

        mat-dialog-content {
          padding: 24px;
          margin: 0;
          min-width: 400px;
          max-width: 100%;
          box-sizing: border-box;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        mat-form-field {
          width: 100%;
        }

        mat-dialog-actions {
          padding: 16px 24px;
          background: #fafafa;
          margin: 0;
          border-top: 1px solid rgba(0, 0, 0, 0.12);
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          margin-right: 8px;
        }

        @media (max-width: 600px) {
          mat-dialog-content {
            min-width: unset;
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class AdminCreateUserDialogComponent {
  private readonly adminService = inject(AdminService);
  private readonly dialogRef = inject(
    MatDialogRef<AdminCreateUserDialogComponent>
  );
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly availableRoles: UserRole[] = ['ADMIN'];
  readonly isSubmitting = signal(false);
  hidePassword = true;

  userForm = new FormGroup<CreateUserForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    roles: new FormControl<UserRole[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Getter methods for form controls
  get email() {
    return this.userForm.get('email') as FormControl;
  }
  get password() {
    return this.userForm.get('password') as FormControl;
  }
  get roles() {
    return this.userForm.get('roles') as FormControl;
  }

  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const userData = {
        email: this.email.value,
        password: this.password.value,
        roles: this.roles.value,
      };

      this.adminService
        .createUser(userData)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => {
            this.snackBar.open('User created successfully', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.snackBar.open(
              error.message || 'Failed to create user. Please try again.',
              'Close',
              { duration: 5000 }
            );
            return of(null);
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe();
    }
  }
}
