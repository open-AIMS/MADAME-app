import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, Subscription } from 'rxjs';
import {
  JobsOverviewState,
  RegionJobsManager,
  RegionJobState,
} from '../../location-selection/selection-criteria/region-jobs-manager';

@Component({
  selector: 'app-jobs-status',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './jobs-status.component.html',
  styleUrl: './jobs-status.component.scss',
})
export class JobsStatusComponent implements OnInit, OnDestroy {
  @Input() jobsManager?: RegionJobsManager;
  @Input() collapsed: boolean = false;

  overview$?: Observable<JobsOverviewState>;
  jobStates$?: Observable<RegionJobState[]>;

  private subscriptions = new Subscription();

  ngOnInit() {
    if (this.jobsManager) {
      this.overview$ = this.jobsManager.jobsOverview$;
      this.jobStates$ = this.jobsManager.jobStates$;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  getStatusIcon(status: RegionJobState['status']): string {
    const iconMap = {
      STARTING: 'hourglass_empty',
      PENDING: 'schedule',
      IN_PROGRESS: 'sync',
      SUCCEEDED: 'check_circle',
      FAILED: 'error',
      CANCELLED: 'cancel',
      TIMED_OUT: 'timer_off',
    };
    return iconMap[status] || 'help';
  }

  getStatusColor(status: RegionJobState['status']): string {
    const colorMap = {
      STARTING: 'primary',
      PENDING: 'primary',
      IN_PROGRESS: 'accent',
      SUCCEEDED: 'primary', // Will be green via CSS
      FAILED: 'warn',
      CANCELLED: '',
      TIMED_OUT: 'warn',
    };
    return colorMap[status] || '';
  }

  getProgressPercentage(overview: JobsOverviewState): number {
    if (overview.totalJobs === 0) return 0;
    return Math.round((overview.completed / overview.totalJobs) * 100);
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatJobDuration(job: RegionJobState): string {
    const duration = job.lastUpdated.getTime() - job.startTime.getTime();
    return this.formatDuration(Math.round(duration / 1000));
  }

  onCancelJob(region: string) {
    if (this.jobsManager) {
      this.jobsManager.cancelJob(region);
    }
  }

  trackByRegion(index: number, job: RegionJobState): string {
    return job.region;
  }
}
