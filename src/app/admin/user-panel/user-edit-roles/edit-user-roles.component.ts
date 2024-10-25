import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {User, UserRole} from '../../../../api/web-api.types';
import { WebApiService } from '../../../../api/web-api.service';

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
  templateUrl: './edit-user-roles.component.html',
  styleUrl: './edit-user-roles.component.scss',
})
export class UserEditRolesDialogComponent {
  readonly webApiService = inject(WebApiService);
  readonly dialogRef = inject(MatDialogRef<UserEditRolesDialogComponent>);
  readonly availableRoles: UserRole[] = ['ADMIN'];

  data = inject<{user?: User}>(MAT_DIALOG_DATA);

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
      const operation = this.webApiService.updateUserRoles(
        this.data.user?.id!,
        userData.roles!
      );

      operation.subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
