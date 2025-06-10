import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WebApiService } from '../../../api/web-api.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { interval, merge, startWith, Subject, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cluster-admin-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule
  ],
  templateUrl: './ClusterAdminDialog.component.html',
  styleUrl: './ClusterAdminDialog.component.scss'
})
export class ClusterAdminDialogComponent implements OnInit {
  private readonly api = inject(WebApiService);
  private readonly dialogRef = inject(MatDialogRef<ClusterAdminDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  private manualRefresh$ = new Subject<void>();
  isSyncing = signal(false);
  lastSynced = signal<Date | null>(null);
  timeToNextSync = signal(5);

  status$ = merge(interval(5000).pipe(startWith(0)), this.manualRefresh$).pipe(
    tap(() => {
      this.isSyncing.set(true);
      this.timeToNextSync.set(5);
    }),
    switchMap(() => this.api.getClusterStatus()),
    tap(() => {
      this.lastSynced.set(new Date());
      this.isSyncing.set(false);
    }),
    takeUntilDestroyed(this.destroyRef)
  );

  scaleForm: FormGroup;
  busy = false;

  constructor() {
    this.scaleForm = this.fb.group({
      desiredCount: ['', [Validators.required, Validators.min(0), Validators.max(10)]]
    });

    // Update countdown timer
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.isSyncing()) {
          const current = this.timeToNextSync();
          if (current > 0) {
            this.timeToNextSync.set(current - 1);
          }
        }
      });
  }

  ngOnInit() {
    this.refreshStatus();
  }

  refreshStatus() {
    this.manualRefresh$.next();
  }

  getLastSyncedText(): string {
    const lastSync = this.lastSynced();
    if (!lastSync) return 'Never';

    const seconds = Math.floor((new Date().getTime() - lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return lastSync.toLocaleTimeString();
  }

  async scaleCluster() {
    if (this.scaleForm.valid && !this.busy) {
      try {
        this.busy = true;
        await this.api.scaleCluster(this.scaleForm.value.desiredCount).toPromise();
        this.refreshStatus();
      } finally {
        this.busy = false;
      }
    }
  }

  async redeployCluster() {
    if (!this.busy) {
      try {
        this.busy = true;
        await this.api.redeployCluster().toPromise();
        this.refreshStatus();
      } finally {
        this.busy = false;
      }
    }
  }
}
