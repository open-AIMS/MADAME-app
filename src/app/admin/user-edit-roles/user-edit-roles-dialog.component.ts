import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserRole } from '../../../api/web-api.types';
import { AdminService, User } from '../admin.service';

@Component({
  selector: 'app-user-edit-roles-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  template: `
    <div class="edit-dialog">
      <h2 mat-dialog-title>
        Edit User Roles ({{ data.user?.email ?? 'Unknown' }})
      </h2>

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
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
            Submit
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
export class UserEditRolesDialogComponent {
  readonly adminService = inject(AdminService);
  readonly dialogRef = inject(MatDialogRef<UserEditRolesDialogComponent>);
  readonly availableRoles: UserRole[] = ['ADMIN'];

  data = inject<{ user?: User }>(MAT_DIALOG_DATA);

  userForm = new FormGroup({
    roles: new FormControl<UserRole[]>([]),
  });

  ngOnInit() {
    console.log('NG init', this.data);
    if (this.data.user) {
      this.userForm.patchValue({
        roles: this.data.user.roles,
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      const operation = this.adminService.updateUserRoles(
        this.data.user?.id!,
        userData.roles!
      );

      operation.subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
