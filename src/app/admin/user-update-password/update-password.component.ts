import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AdminService, User } from '../admin.service';

interface UpdatePasswordForm {
  password: FormControl<string>;
}

@Component({
  selector: 'admin-update-password-dialog',
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
    <div class="update-password-dialog">
      <h2 matDialogTitle>Update User Password</h2>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-fields">
            <mat-form-field appearance="outline">
              <mat-label>New Password</mat-label>
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
              {{ isSubmitting() ? 'Updating...' : 'Submit' }}
            </span>
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .update-password-dialog {
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
export class AdminUpdateUserPasswordDialogComponent {
  private readonly adminService = inject(AdminService);
  private readonly dialogRef = inject(
    MatDialogRef<AdminUpdateUserPasswordDialogComponent>
  );
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<{ user: User }>(MAT_DIALOG_DATA);

  readonly isSubmitting = signal(false);
  hidePassword = true;

  userForm = new FormGroup<UpdatePasswordForm>({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  // Getter methods for form controls
  get password() {
    return this.userForm.get('password') as FormControl;
  }

  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const userData = {
        password: this.password.value,
      };

      this.adminService
        .updatePassword(this.data.user.id, userData.password)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => {
            this.snackBar.open('User password updated successfully', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.snackBar.open(
              error.message ||
                'Failed to update user password. Please try again.',
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
