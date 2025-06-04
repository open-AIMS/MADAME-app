import {
  BehaviorSubject,
  concatMap,
  distinct,
  filter,
  map,
  mergeMap,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
  finalize,
  catchError,
  EMPTY,
  distinctUntilChanged,
} from 'rxjs';
import { ReefGuideConfigService } from '../reef-guide-config.service';
import { inject } from '@angular/core';
import { DownloadResponse, JobType } from '../../../api/web-api.types';
import { WebApiService } from '../../../api/web-api.service';
import { retryHTTPErrors } from '../../../util/http-util';

export type RegionDownloadResponse = DownloadResponse & { region: string };

export interface RegionJobState {
  region: string;
  jobId?: number;
  status: 'STARTING' | 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
  startTime: Date;
  lastUpdated: Date;
  error?: string;
  progress?: number; // 0-100 if API provides progress
  downloadUrl?: string;
  jobType: JobType;
  retryCount: number;
}

export interface JobsOverviewState {
  totalJobs: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  timedOut: number;
  estimatedTimeRemaining?: number;
}

/**
 * Starts and manages jobs for the active regions that all use the same criteria/payload.
 * Provides ways to track and cancel the jobs with enhanced state tracking.
 */
export class RegionJobsManager {
  private readonly api = inject(WebApiService);
  private readonly config = inject(ReefGuideConfigService);

  // Legacy properties for backward compatibility
  private busyRegions = new Set<string>();
  private _busyRegions$ = new BehaviorSubject<Set<string>>(this.busyRegions);
  private cancel$ = new Subject<void>();
  private regionError = new Subject<string>();

  // Enhanced job tracking properties
  private jobStates = new Map<string, RegionJobState>();
  private _jobStates$ = new BehaviorSubject<Map<string, RegionJobState>>(this.jobStates);
  private _jobsOverview$ = new BehaviorSubject<JobsOverviewState>(this.calculateOverview());

  // Legacy observables for backward compatibility
  busyRegions$ = this._busyRegions$.pipe(takeUntil(this.cancel$));
  regionError$ = this.regionError.pipe(takeUntil(this.cancel$));

  // New observables for enhanced job tracking
  jobStates$ = this._jobStates$.pipe(
    takeUntil(this.cancel$),
    map(states => Array.from(states.values()))
  );

  jobsOverview$ = this._jobsOverview$.pipe(takeUntil(this.cancel$));

  /**
   * Emits when Job Results download is available and ready to be used in a map layer.
   */
  jobResultsDownload$: Observable<RegionDownloadResponse>;

  /**
   * @param jobType The type of job to run
   * @param payload partial payload, "region" will be set by this
   * @param regions$ observable that emits each region, then completes
   */
  constructor(jobType: JobType, payload: any, regions$: Observable<string>) {
    console.log(`🚀 RegionJobsManager initialized for job type: ${jobType}`);
    
    const api = this.api;

    // avoid repeating values
    regions$ = regions$.pipe(distinct());

    // parallel requests or sequential according to config.
    const mapFn = this.config.parallelRegionRequests() ? mergeMap : concatMap;

    this.jobResultsDownload$ = regions$.pipe(
      mapFn(region => {
        // Initialize job state
        this.updateJobState(region, {
          region,
          status: 'STARTING',
          startTime: new Date(),
          lastUpdated: new Date(),
          jobType,
          retryCount: 0
        });

        // Legacy: mark region as busy
        this.startRegion(region);

        const finalPayload = {
          ...payload,
          region,
        };

        console.log(`🔄 Starting job for region=${region}`, finalPayload);
        
        return api.startJob(jobType, finalPayload).pipe(
          tap(job => {
            console.log(`📊 Job created - id=${job.id} type=${job.type} region=${region}`, job);
            
            // Update with job ID and status
            this.updateJobState(region, {
              jobId: job.id,
              status: job.status,
              lastUpdated: new Date()
            });
          }),
          // Enhanced retry with state tracking
          retryHTTPErrors(3, 1000),
          // Track retry attempts via tap before retryHTTPErrors handles them
          tap({
            error: (error) => {
              const currentState = this.jobStates.get(region);
              const retryCount = (currentState?.retryCount || 0) + 1;
              console.log(`⚠️ Job error for region=${region}, retry ${retryCount}/3:`, error.message);
              
              this.updateJobState(region, {
                retryCount,
                error: error.message,
                lastUpdated: new Date()
              });
            }
          }),
          filter(x => x.status === 'SUCCEEDED'),
          switchMap(job => {
            console.log(`✅ Job completed successfully - id=${job.id} region=${region}`);
            
            return this.api.downloadJobResults(job.id).pipe(
              retryHTTPErrors(3),
              tap(downloadResp => {
                console.log(`📥 Download ready for region=${region}:`, Object.keys(downloadResp.files));
                
                this.updateJobState(region, {
                  status: 'SUCCEEDED',
                  downloadUrl: Object.values(downloadResp.files)[0],
                  lastUpdated: new Date()
                });
              })
            );
          }),
          map(jobResults => ({ ...jobResults, region })),
          catchError(error => {
            console.error(`❌ Final job failure for region=${region}:`, error.message);
            
            this.updateJobState(region, {
              status: 'FAILED',
              error: error.message,
              lastUpdated: new Date()
            });
            
            this.regionError.next(region);
            return EMPTY;
          }),
          finalize(() => {
            console.log(`🏁 Job finalized for region=${region}`);
            this.stopRegion(region);
          })
        );
      }),
      takeUntil(this.cancel$)
    );
  }

  /**
   * Get observable of job state for a specific region
   */
  getJobState(region: string): Observable<RegionJobState | undefined> {
    return this._jobStates$.pipe(
      map(states => states.get(region)),
      distinctUntilChanged()
    );
  }

  /**
   * Cancel all jobs and clean up resources
   */
  cancel() {
    console.log('🛑 RegionJobsManager cancelled - cleaning up all jobs');
    
    // Mark all active jobs as cancelled
    this.jobStates.forEach((jobState, region) => {
      if (['STARTING', 'PENDING', 'IN_PROGRESS'].includes(jobState.status)) {
        this.updateJobState(region, {
          status: 'CANCELLED',
          lastUpdated: new Date()
        });
      }
    });

    this._busyRegions$.complete();
    this._jobStates$.complete();
    this._jobsOverview$.complete();
    this.regionError.complete();
    this.cancel$.next();
    this.cancel$.complete();
  }

  /**
   * Cancel a specific job by region
   */
  cancelJob(region: string) {
    const jobState = this.jobStates.get(region);
    if (jobState && ['STARTING', 'PENDING', 'IN_PROGRESS'].includes(jobState.status)) {
      console.log(`🛑 Cancelling job for region=${region}`);
      
      this.updateJobState(region, {
        status: 'CANCELLED',
        lastUpdated: new Date()
      });
    } else {
      console.warn(`⚠️ Cannot cancel job for region=${region} - job not found or not active`);
    }
  }

  /**
   * Get current statistics for all jobs
   */
  getCurrentOverview(): JobsOverviewState {
    return this.calculateOverview();
  }

  // Private methods

  private updateJobState(region: string, updates: Partial<RegionJobState>) {
    const currentState = this.jobStates.get(region);
    const newState = { ...currentState, ...updates } as RegionJobState;
    
    this.jobStates.set(region, newState);
    this._jobStates$.next(this.jobStates);
    this.updateOverview();

    // Debug logging
    const statusEmoji = this.getStatusEmoji(newState.status);
    console.log(
      `${statusEmoji} Job state update - Region: ${region}, Status: ${newState.status}, ` +
      `Type: ${newState.jobType}${newState.jobId ? `, ID: ${newState.jobId}` : ''}` +
      `${newState.retryCount > 0 ? `, Retries: ${newState.retryCount}` : ''}` +
      `${newState.error ? `, Error: ${newState.error}` : ''}`
    );
  }

  private updateOverview() {
    const overview = this.calculateOverview();
    this._jobsOverview$.next(overview);

    // Debug logging for overview changes
    console.log(
      `📈 Jobs Overview - Total: ${overview.totalJobs}, ` +
      `Completed: ${overview.completed}, Failed: ${overview.failed}, ` +
      `In Progress: ${overview.inProgress}, Pending: ${overview.pending}` +
      `${overview.estimatedTimeRemaining ? `, ETA: ${overview.estimatedTimeRemaining}s` : ''}`
    );
  }

  private calculateOverview(): JobsOverviewState {
    const states = Array.from(this.jobStates.values());
    const totalJobs = states.length;
    
    return {
      totalJobs,
      completed: states.filter(s => s.status === 'SUCCEEDED').length,
      failed: states.filter(s => s.status === 'FAILED').length,
      inProgress: states.filter(s => s.status === 'IN_PROGRESS').length,
      pending: states.filter(s => s.status === 'PENDING').length,
      cancelled: states.filter(s => s.status === 'CANCELLED').length,
      timedOut: states.filter(s => s.status === 'TIMED_OUT').length,
      estimatedTimeRemaining: this.calculateETA(states)
    };
  }

  private calculateETA(states: RegionJobState[]): number | undefined {
    const completed = states.filter(s => s.status === 'SUCCEEDED');
    const remaining = states.filter(s => ['PENDING', 'IN_PROGRESS'].includes(s.status));
    
    if (completed.length === 0 || remaining.length === 0) return undefined;
    
    const avgDuration = completed.reduce((sum, job) => {
      return sum + (job.lastUpdated.getTime() - job.startTime.getTime());
    }, 0) / completed.length;
    
    return Math.round((avgDuration * remaining.length) / 1000); // seconds
  }

  private getStatusEmoji(status: RegionJobState['status']): string {
    const emojiMap = {
      'STARTING': '🔄',
      'PENDING': '⏳',
      'IN_PROGRESS': '🔄',
      'SUCCEEDED': '✅',
      'FAILED': '❌',
      'CANCELLED': '🛑',
      'TIMED_OUT': '⏰'
    };
    return emojiMap[status] || '❓';
  }

  // Legacy methods for backward compatibility
  private startRegion(region: string) {
    this.busyRegions.add(region);
    this._busyRegions$.next(this.busyRegions);
  }

  private stopRegion(region: string) {
    this.busyRegions.delete(region);
    this._busyRegions$.next(this.busyRegions);
  }
}
