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
import { WebApiService } from '../../../../api/web-api.service';
import { User } from '../../../../api/web-api.types';

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
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.scss',
})
export class AdminUpdateUserPasswordDialogComponent {
  private readonly webApiService = inject(WebApiService);
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

      this.webApiService
        .updatePassword(this.data.user.id, userData.password)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          tap(() => {
            this.snackBar.open('User password updated successfully', 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }),
          catchError(error => {
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
