import {
  BehaviorSubject,
  catchError,
  concatMap,
  distinct,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  takeUntil
} from 'rxjs';
import { ReefGuideApiService } from '../reef-guide-api.service';
import { SelectionCriteria } from '../reef-guide-api.types';
import { ReefGuideConfigService } from '../reef-guide-config.service';
import { inject } from '@angular/core';
import { urlToBlobObjectURL } from '../../../util/http-util';

/**
 * Region layer data that is ready to be loaded.
 */
export interface ReadyRegion {
  region: string;
  cogUrl: string;
  originalUrl: string;
}

export class CriteriaRequest {
  private readonly api = inject(ReefGuideApiService);
  private readonly config = inject(ReefGuideConfigService);

  private busyRegions = new Set<string>();
  private _busyRegions$ = new BehaviorSubject<Set<string>>(this.busyRegions);

  private cancel$ = new Subject<void>();

  private regionError = new Subject<string>();

  /**
   * Emits the regions that are currently busy whenever a region starts or finishes loading.
   */
  busyRegions$ = this._busyRegions$.pipe(takeUntil(this.cancel$));

  /**
   * Emits when COG is available and ready to be used in a map layer.
   */
  regionReady$: Observable<ReadyRegion>;

  /**
   * Emits regions that had an error.
   */
  regionError$ = this.regionError.pipe(takeUntil(this.cancel$));

  constructor(criteria: SelectionCriteria, regions$: Observable<string>) {
    const api = this.api;

    // avoid repeating values
    regions$ = regions$.pipe(distinct());

    // parallel requests or sequential according to config.
    const mapFn = this.config.parallelRegionRequests() ? mergeMap : concatMap;

    this.regionReady$ = regions$.pipe(
      mapFn(region => {
        this.startRegion(region);
        const url = api.cogUrlForCriteria(region, criteria);
        return from(urlToBlobObjectURL(url)).pipe(
          map(blobUrl => {
            this.stopRegion(region);
            return {
              region,
              cogUrl: blobUrl,
              originalUrl: url
            };
          }),
          catchError(err => {
            // console.log(`${region} error`, err);
            this.regionError.next(region);
            this.stopRegion(region);
            // skip, return empty completed observable.
            // otherwise, any error stops all regions.
            return of();
          })
        );
      }),
      takeUntil(this.cancel$)
    );
  }

  cancel() {
    this._busyRegions$.complete();
    this.regionError.complete();
    this.cancel$.next();
    this.cancel$.complete();
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
