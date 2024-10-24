import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../auth/auth.service';
import { AdminService, User } from '../admin.service';
import { AdminCreateUserDialogComponent } from '../user-create/create-user.component';
import { UserEditRolesDialogComponent } from '../user-edit-roles/user-edit-roles-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminUpdateUserPasswordDialogComponent } from '../user-update-password/update-password.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatMenuModule,
    AdminCreateUserDialogComponent,
    UserEditRolesDialogComponent,
  ],
  template: `
    <div class="admin-panel">
      <h2 mat-dialog-title>Admin User Management</h2>

      <mat-dialog-content>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" class="mat-elevation-z8">
            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>

            <!-- Roles Column -->
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let user">
                <div class="role-chips">
                  <span class="role-chip" *ngFor="let role of user.roles">
                    {{ role }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button
                  mat-icon-button
                  [matMenuTriggerFor]="menu"
                  aria-label="User actions"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="editUserRoles(user)">
                    <mat-icon>manage_accounts</mat-icon>
                    <span>Edit Roles</span>
                  </button>
                  <button mat-menu-item (click)="changePassword(user)">
                    <mat-icon>password</mat-icon>
                    <span>Change Password</span>
                  </button>
                  @if ((authService.user$ | async)?.email !== user.email) {
                  <button
                    mat-menu-item
                    (click)="deleteUser(user.id)"
                    class="delete-action"
                  >
                    <mat-icon color="warn">delete</mat-icon>
                    <span class="warn-text">Delete User</span>
                  </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr
              mat-header-row
              *matHeaderRowDef="displayedColumns; sticky: true"
            ></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-flat-button color="primary" (click)="addNewUser()">
          <mat-icon>add</mat-icon>
          Add User
        </button>
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .admin-panel {
        padding: 0;

        h2 {
          margin: 0;
          padding: 24px 24px 16px;
          font-size: 24px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
        }
      }

      .table-container {
        position: relative;
        min-height: 200px;
        max-height: 400px;
        overflow: auto;
        background: white;
      }

      table {
        width: 100%;
        background: white;
        border-radius: 4px;
        overflow: hidden;

        th {
          background: #fafafa;
          color: rgba(0, 0, 0, 0.87);
          font-weight: 500;
          font-size: 14px;
          padding: 16px;
        }

        td {
          padding: 12px 16px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.87);
        }

        tr:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      }

      .role-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .role-chip {
          background: #e0e0e0;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.87);
        }
      }

      .dialog-actions {
        padding: 16px 24px;
        background: #fafafa;
        margin: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }

      mat-dialog-content {
        padding: 0 24px;
        margin: 0;
        max-height: 400px;
      }

      .delete-action {
        .warn-text {
          color: #f44336;
        }
      }
    `,
  ],
})
export class AdminPanelComponent implements OnInit {
  private editDialog = inject(MatDialog);
  private rolesDialog = inject(MatDialog);
  private adminService = inject(AdminService);
  authService = inject(AuthService);

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns = ['email', 'roles', 'actions'];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe((users) => {
      this.dataSource.data = users;
    });
  }

  addNewUser() {
    const dialogRef = this.editDialog.open(AdminCreateUserDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  editUserRoles(user: User) {
    const dialogRef = this.rolesDialog.open(UserEditRolesDialogComponent, {
      width: '400px',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  changePassword(user: User) {
    this.rolesDialog.open(AdminUpdateUserPasswordDialogComponent, {
      width: '400px',
      data: { user },
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }
}
