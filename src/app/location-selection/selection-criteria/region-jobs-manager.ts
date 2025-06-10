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
  finalize
} from 'rxjs';
import { ReefGuideConfigService } from '../reef-guide-config.service';
import { inject } from '@angular/core';
import { DownloadResponse, JobDetails, JobType } from '../../../api/web-api.types';
import { WebApiService } from '../../../api/web-api.service';
import { retryHTTPErrors } from '../../../util/http-util';

export type RegionDownloadResponse = DownloadResponse & { region: string };

/**
 * Starts and manages jobs for the active regions that all use the same criteria/payload.
 * Provides ways to track and cancel the
 */
export class RegionJobsManager {
  private readonly api = inject(WebApiService);
  private readonly config = inject(ReefGuideConfigService);

  private busyRegions = new Set<string>();
  private _busyRegions$ = new BehaviorSubject<Set<string>>(this.busyRegions);

  private cancel$ = new Subject<void>();

  private regionError = new Subject<string>();

  private jobUpdate = new Subject<JobDetails>();

  /**
   * Emits the regions that are currently busy whenever a region starts or finishes loading.
   */
  busyRegions$ = this._busyRegions$.pipe(takeUntil(this.cancel$));

  /**
   * Emits region assessment jobs when they succeeded.
   */
  jobUpdate$: Observable<JobDetails> = this.jobUpdate.pipe(takeUntil(this.cancel$));

  /**
   * Emits when Job Results download is available and ready to be used in a map layer.
   */
  jobResultsDownload$: Observable<RegionDownloadResponse>;

  /**
   * Emits regions that had an error.
   */
  regionError$ = this.regionError.pipe(takeUntil(this.cancel$));

  /**
   *
   * @param type
   * @param payload partial payload, "region" will be set by this
   * @param regions$ observable that emits each region, then completes
   */
  constructor(jobType: JobType, payload: any, regions$: Observable<string>) {
    const api = this.api;

    // avoid repeating values
    regions$ = regions$.pipe(distinct());

    // parallel requests or sequential according to config.
    const mapFn = this.config.parallelRegionRequests() ? mergeMap : concatMap;

    // TODO review error handling, catchError
    this.jobResultsDownload$ = regions$.pipe(
      mapFn(region => {
        this.startRegion(region);
        const finalPayload = {
          ...payload,
          region
        };

        console.log(`startJob region=${region}`, finalPayload);
        return api.startJob(jobType, finalPayload).pipe(
          tap(job => {
            console.log(`Job id=${job.id} type=${job.type} update`, job);
            this.jobUpdate.next(job);
          }),
          filter(x => x.status === 'SUCCEEDED'),
          switchMap(job => this.api.downloadJobResults(job.id).pipe(retryHTTPErrors(3))),
          map(jobResults => ({ ...jobResults, region })),
          finalize(() => {
            this.stopRegion(region);
          })
        );

        // TODO:region refactor/review state handling, error handling
        // this code will change with user region selection UI
        //
        // const url = api.cogUrlForCriteria(region, criteria);
        // return api.toObjectURL(url).pipe(
        //   map(blobUrl => {
        //     this.stopRegion(region);
        //     return {
        //       region,
        //       cogUrl: blobUrl,
        //       originalUrl: url,
        //     };
        //   }),
        //   catchError(err => {
        //     // console.log(`${region} error`, err);
        //     this.regionError.next(region);
        //     this.stopRegion(region);
        //     // skip, return empty completed observable.
        //     // otherwise, any error stops all regions.
        //     return of();
        //   })
        // );
      }),
      takeUntil(this.cancel$)
    );
  }

  cancel() {
    this._busyRegions$.complete();
    this.regionError.complete();
    this.cancel$.next();
    this.cancel$.complete();
    this.jobUpdate.complete();
  }

  private startRegion(region: string) {
    this.busyRegions.add(region);
    this._busyRegions$.next(this.busyRegions);
  }

  private stopRegion(region: string) {
    this.busyRegions.delete(region);
    this._busyRegions$.next(this.busyRegions);
  }
}
