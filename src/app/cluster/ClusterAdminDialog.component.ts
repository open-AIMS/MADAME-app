import {Component, DestroyRef, inject, OnInit, signal} from "@angular/core";
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {WebApiService} from "../../api/web-api.service";
import {CommonModule} from "@angular/common";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatDividerModule} from "@angular/material/divider";
import {interval, merge, startWith, Subject, switchMap, tap} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: "app-cluster-admin-dialog",
  standalone: true,
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
    MatDividerModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">Cluster Administration</h2>

      <mat-dialog-content class="dialog-content">
        <div class="status-section">
          <!-- Status Header -->
          <div class="section-header">
            <div class="header-content">
              <h3>Cluster Status</h3>
              <div class="sync-status" [class.syncing]="isSyncing()">
                <mat-spinner *ngIf="isSyncing()" diameter="16"></mat-spinner>
                <span
                  class="sync-info"
                  [matTooltip]="lastSynced() | date : 'medium'"
                >
                  Last synced: {{ getLastSyncedText() }}
                  <span class="next-sync" *ngIf="!isSyncing()">
                    (updates in {{ timeToNextSync() }}s)
                  </span>
                </span>
              </div>
            </div>
            <button
              mat-icon-button
              [disabled]="isSyncing()"
              (click)="refreshStatus()"
              matTooltip="Refresh status"
            >
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

          <!-- Status Content -->
          <div *ngIf="status$ | async as status" class="status-content">
            <!-- Metrics -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Running</div>
                <div class="metric-value">{{ status.runningCount || 0 }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Pending</div>
                <div class="metric-value">{{ status.pendingCount || 0 }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Desired</div>
                <div class="metric-value">{{ status.desiredCount || 0 }}</div>
              </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Deployments -->
            <div *ngIf="status.deployments?.length" class="deployments-section">
              <h4>Active Deployments</h4>
              <div class="scrollable-section">
                <div
                  *ngFor="let deployment of status.deployments"
                  class="deployment-card"
                >
                  <div class="deployment-header">
                    <span
                      class="status-badge"
                      [class.status-primary]="deployment.status === 'PRIMARY'"
                    >
                      {{ deployment.status }}
                    </span>
                    <span class="deployment-count">
                      {{ deployment.runningCount }}/{{
                        deployment.desiredCount
                      }}
                      running
                    </span>
                  </div>
                  <div
                    *ngIf="deployment.rolloutState"
                    class="deployment-state text-truncate"
                    [matTooltip]="deployment.rolloutStateReason"
                  >
                    {{ deployment.rolloutStateReason }}
                  </div>
                </div>
              </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <!-- Events -->
            <div *ngIf="status.events?.length" class="events-section">
              <h4>Recent Events</h4>
              <div class="scrollable-section">
                <div *ngFor="let event of status.events" class="event-item">
                  <span class="event-time">{{
                    event.createdAt | date : "short"
                  }}</span>
                  <span
                    class="event-message text-truncate"
                    [matTooltip]="event.message"
                  >
                    {{ event.message }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <mat-divider class="my-4"></mat-divider>

        <!-- Controls -->
        <div class="controls-section">
          <h3>Scaling Controls</h3>
          <form [formGroup]="scaleForm" class="scale-form">
            <mat-form-field class="w-full">
              <mat-label>Desired Count</mat-label>
              <input matInput type="number" formControlName="desiredCount" />
              <mat-error
                *ngIf="scaleForm.get('desiredCount')?.errors?.['required']"
              >
                Required
              </mat-error>
              <mat-error
                *ngIf="scaleForm.get('desiredCount')?.errors?.['min'] || scaleForm.get('desiredCount')?.errors?.['max']"
              >
                Must be between 0 and 10
              </mat-error>
            </mat-form-field>

            <div class="action-buttons">
              <button
                mat-raised-button
                color="primary"
                [disabled]="scaleForm.invalid || busy"
                (click)="scaleCluster()"
                matTooltip="Scale the cluster to the specified number of instances"
                matTooltipPosition="above"
              >
                Scale Cluster
              </button>

              <button
                mat-raised-button
                color="accent"
                [disabled]="busy"
                (click)="redeployCluster()"
                matTooltip="Force a new deployment using the latest container image"
                matTooltipPosition="above"
              >
                Force Redeploy
              </button>
            </div>
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        max-height: 95vh;
        display: flex;
        flex-direction: column;
      }

      .dialog-title {
        margin: 0;
        padding: 8px 24px;
        background: #f5f5f5;
        font-size: 20px;
        font-weight: 500;
        flex-shrink: 0;
      }

      .dialog-content {
        padding: 24px;
        overflow-y: auto;
        min-width: 500px;
        max-width: 800px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .header-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .header-content h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 20px;
      }

      .sync-info {
        font-size: 12px;
        color: #666;
      }

      .next-sync {
        color: #888;
        margin-left: 4px;
      }

      .sync-status.syncing .sync-info {
        color: #1976d2;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }

      .metric-card {
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        text-align: center;
      }

      .metric-label {
        color: #666;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 24px;
        font-weight: 500;
        color: #333;
      }

      .scrollable-section {
        max-height: 150px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 8px;
      }

      .deployment-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
      }

      .deployment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .status-badge {
        padding: 4px 8px;
        background: #e0e0e0;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-primary {
        background: #e3f2fd;
        color: #1976d2;
      }

      .deployment-count {
        font-size: 14px;
        color: #666;
      }

      .deployment-state {
        font-size: 13px;
        color: #666;
      }

      .event-item {
        display: flex;
        gap: 8px;
        padding: 8px;
        border-bottom: 1px solid #eee;
        font-size: 13px;
      }

      .event-time {
        color: #666;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .event-message {
        color: #333;
        flex-grow: 1;
        min-width: 0;
      }

      .text-truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .controls-section {
        margin-top: 24px;
      }

      .controls-section h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 500;
      }

      .scale-form {
        max-width: 100%;
      }

      .action-buttons {
        display: flex;
        gap: 16px;
        margin-top: 16px;
      }

      :host ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }

      .my-4 {
        margin-top: 1rem;
        margin-bottom: 1rem;
      }

      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
      }
    `,
  ],
})
export class ClusterAdminDialogComponent implements OnInit {
  private readonly api = inject(WebApiService);
  private readonly dialogRef = inject(
    MatDialogRef<ClusterAdminDialogComponent>
  );
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
      desiredCount: [
        "",
        [Validators.required, Validators.min(0), Validators.max(10)],
      ],
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
    if (!lastSync) return "Never";

    const seconds = Math.floor(
      (new Date().getTime() - lastSync.getTime()) / 1000
    );
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return lastSync.toLocaleTimeString();
  }

  async scaleCluster() {
    if (this.scaleForm.valid && !this.busy) {
      try {
        this.busy = true;
        await this.api
          .scaleCluster(this.scaleForm.value.desiredCount)
          .toPromise();
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
