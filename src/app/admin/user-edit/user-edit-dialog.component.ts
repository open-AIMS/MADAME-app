import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserRole } from '../../../api/web-api.types';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogActions,
    MatDialogContent,
  ],
  template: `
    <div class="edit-dialog">
      <h2 mat-dialog-title>
        {{ data.mode === 'create' ? 'Create User' : 'Edit User' }}
      </h2>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
            <mat-error *ngIf="userForm.get('email')?.errors?.['required']">
              Email is required
            </mat-error>
            <mat-error *ngIf="userForm.get('email')?.errors?.['email']">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password" />
            <mat-error *ngIf="userForm.get('password')?.errors?.['required']">
              Password is required for new users
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Roles</mat-label>
            <mat-select formControlName="roles" multiple>
              <mat-option *ngFor="let role of availableRoles" [value]="role">
                {{ role }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button mat-dialog-close>Cancel</button>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="!userForm.valid"
          >
            {{ data.mode === 'create' ? 'Create' : 'Update' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .edit-dialog {
        h2 {
          margin: 0;
          padding: 24px 24px 16px;
          font-size: 24px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
        }
      }

      mat-dialog-content {
        padding: 0 24px;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 400px;
      }

      mat-form-field {
        width: 100%;
      }

      .dialog-actions {
        padding: 16px 24px;
        background: #fafafa;
        margin: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }
    `,
  ],
})
export class UserEditDialogComponent {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<UserEditDialogComponent>);
  public availableRoles: UserRole[] = ['ADMIN'];

  @Inject(MAT_DIALOG_DATA) public data: {
    mode: 'create';
    user?: any;
  } = { mode: 'create', user: {} };

  userForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl(''),
    roles: new FormControl<UserRole[]>([], Validators.required),
  });

  ngOnInit() {
    if (this.data.user) {
      this.userForm.patchValue({
        email: this.data.user.email,
        roles: this.data.user.roles,
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;

      const filledOutData = {
        email: userData.email!,
        password: userData.password!,
        roles: userData.roles!,
      };
      const operation = this.adminService.createUser(filledOutData);

      operation.subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
