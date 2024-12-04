import { CommonModule } from '@angular/common';
import {Component, inject, OnInit, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  BehaviorSubject,
  catchError,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { WebApiService } from '../../../api/web-api.service';
import { User } from '../../../api/web-api.types';
import { AuthService } from '../../auth/auth.service';
import { AdminCreateUserDialogComponent } from './user-create/create-user.component';
import { UserEditRolesDialogComponent } from './user-edit-roles/edit-user-roles.component';
import { AdminUpdateUserPasswordDialogComponent } from './user-update-password/update-password.component';
import {extractErrorMessage} from "../../../api/api-util";

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
    MatPaginatorModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
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

  // Displayed columns for the user logs
  userLogsDisplayedColumns = ['email', 'action', 'time'];

  // Pagination state
  private pageSubject = new BehaviorSubject({
    page: 1,
    limit: 50,
  });

  userLogsLoading = signal(false);
  userLogsError = signal<string | undefined>(undefined);
  userLogs$ = this.pageSubject.pipe(
    switchMap(({ page, limit }) => {
      this.userLogsLoading.set(true);
      this.userLogsError.set(undefined);
      return this.webApiService.userLogs({ page, limit }).pipe(
        catchError((err: any) => {
          this.userLogsError.set(extractErrorMessage(err));
          return of(null);
        }),
        finalize(() => {
          this.userLogsLoading.set(false);
        })
      );
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

  onPageChange(event: PageEvent) {
    this.pageSubject.next({
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  refreshLogs() {
    const currentPage = this.pageSubject.value;
    this.pageSubject.next({ ...currentPage });
  }

  // Handle tab changes
  onTabChange(event: any) {
    this.selectedTabIndex = event.index;
  }
}
