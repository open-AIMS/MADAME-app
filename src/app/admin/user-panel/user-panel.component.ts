import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../auth/auth.service';
import { AdminCreateUserDialogComponent } from './user-create/create-user.component';
import { UserEditRolesDialogComponent } from './user-edit-roles/edit-user-roles.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminUpdateUserPasswordDialogComponent } from './user-update-password/update-password.component';
import { WebApiService } from '../../../api/web-api.service';
import { User, UserLogs } from '../../../api/web-api.types';
import { catchError, finalize, of, tap } from 'rxjs';
import { ThisReceiver } from '@angular/compiler';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
    MatTabsModule,
    MatProgressSpinner,
  ],
  templateUrl: './user-panel.component.html',
  styleUrl: './user-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private editDialog = inject(MatDialog);
  private rolesDialog = inject(MatDialog);
  private webApiService = inject(WebApiService);
  authService = inject(AuthService);

  // User management table data
  tableUsersList = new MatTableDataSource<User>([]);
  displayedColumns = ['email', 'roles', 'actions'];
  selectedUser: User | undefined = undefined;

  // Tab state
  selectedTabIndex = 0;

  // Loaded user logs
  userLogsDisplayedColumns = ['userId', 'email', 'action', 'time'];
  userLogsLoading = false;
  userLogsError: string | null = null;
  userLogs$ = this.webApiService.userLogs().pipe(
    tap(() => {
      this.userLogsLoading = true;
    }),
    catchError((err: any) => {
      this.userLogsError = err as string;
      return of(null);
    }),
    finalize(() => {
      this.userLogsLoading = false;
    })
  );

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.webApiService.getUsers().subscribe(users => {
      this.tableUsersList.data = users;
    });
  }

  addNewUser() {
    const dialogRef = this.editDialog.open(AdminCreateUserDialogComponent, {
      width: '400px',
    });
    dialogRef.afterClosed().subscribe(result => {
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
    dialogRef.afterClosed().subscribe(result => {
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
      this.webApiService.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  // Handle tab changes
  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
  }
}
