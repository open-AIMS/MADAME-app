import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AdminService, User } from '../admin.service';
import { UserEditDialogComponent } from '../user-edit/user-edit-dialog.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogActions,
    MatDialogContent,
  ],
  template: `
    <div class="admin-panel">
      <h2 mat-dialog-title>User Management</h2>

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
                <div class="action-buttons">
                  <button
                    mat-icon-button
                    class="edit-button"
                    (click)="editUser(user)"
                    matTooltip="Edit User"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteUser(user.id)"
                    matTooltip="Delete User"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
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

      .action-buttons {
        display: flex;
        gap: 8px;

        .edit-button {
          color: #1976d2;
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
    `,
  ],
})
export class AdminPanelComponent implements OnInit {
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<AdminPanelComponent>);
  private adminService = inject(AdminService);

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
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '400px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  editUser(user: User) {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '400px',
      data: { mode: 'edit', user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
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
