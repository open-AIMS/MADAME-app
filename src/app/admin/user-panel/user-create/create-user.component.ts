import {CommonModule} from '@angular/common';
import {Component, inject, DestroyRef, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, finalize, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {UserRole} from '../../../../api/web-api.types';
import {MatIconModule} from '@angular/material/icon';
import {WebApiService} from '../../../../api/web-api.service';

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
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss',
})
export class AdminCreateUserDialogComponent {
  private readonly adminService = inject(WebApiService);
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
      validators: [],
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
          catchError(error => {
            this.snackBar.open(
              error.message || 'Failed to create user. Please try again.',
              'Close',
              {duration: 5000}
            );
            return of(null);
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe();
    }
  }
}
