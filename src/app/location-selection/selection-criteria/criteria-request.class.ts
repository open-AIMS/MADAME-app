import {BehaviorSubject, concatMap, distinct, map, mergeMap, Observable, Subject, takeUntil} from "rxjs";
import {ReefGuideApiService} from "../reef-guide-api.service";
import {SelectionCriteria} from "./selection-criteria.component";
import {ReefGuideConfigService} from "../reef-guide-config.service";

/**
 * Region layer data that is ready to be loaded.
 */
export interface ReadyRegion {
  region: string;
  cogUrl: string;
  originalUrl: string;
}

export class CriteriaRequest {

  private busyRegions = new Set<string>();
  private _busyRegions$ = new BehaviorSubject<Set<string>>(this.busyRegions);

  private cancel$ = new Subject<void>();

  /**
   * Emits the regions that are currently busy whenever a region starts or finishes loading.
   */
  busyRegions$ = this._busyRegions$.pipe(takeUntil(this.cancel$));

  /**
   * Emits when COG is available and ready to be used in a map layer.
   */
  regionReady$: Observable<ReadyRegion>;

  constructor(criteria: SelectionCriteria,
              regions$: Observable<string>,
              private readonly api: ReefGuideApiService,
              private readonly config: ReefGuideConfigService) {

    // avoid repeating values
    regions$ = regions$.pipe(distinct())

    // parallel requests or sequential according to config.
    const mapFn = this.config.parallelRegionRequests() ? mergeMap : concatMap;

    this.regionReady$ = regions$.pipe(
      mapFn(region => {
        this.startRegion(region);
        const url = api.cogUrlForCriteria(region, criteria);
        return api.toObjectURL(url).pipe(
          map(blobUrl => {
            this.stopRegion(region);
            return {
              region,
              cogUrl: blobUrl,
              originalUrl: url
            };
          })
        );
      }),
      takeUntil(this.cancel$),
    );
  }

  cancel() {
    this.cancel$.next();
    this._busyRegions$.complete();
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
