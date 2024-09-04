import {Injectable} from '@angular/core';
import {SelectionCriteria} from "./selection-criteria/selection-criteria.component";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ReefGuideApiService {

  // TODO configuration system
  // use the API proxy
  private base: string = 'http://localhost:4200/reef-api';

  /**
   * Use COGs in public/cached-slopes instead of requesting from API.
   */
  public enableMockData = true;

  constructor(private http: HttpClient) {
  }

  /**
   * Get URL of COGeoTiff layer matching selection criteria.
   */
  cogUrlForCriteria(region: string, criteria: SelectionCriteria): string {
    if (this.enableMockData) {
      return `http://localhost:4200/cached-slopes/slopes_${region}.tiff`;
    }

    // http://127.0.0.1:8000/assess/Cairns-Cooktown/slopes?criteria_names=Depth,Slope&lb=-9.0,0.0&ub=-2.0,40.0
    const url = new URL(this.base)
    url.pathname = `${url.pathname}/assess/${region}/slopes`;

    const criteriaNames: Array<string> = [];
    const lb: Array<number> = [];
    const ub: Array<number> = [];

    for (let name in criteria) {
      criteriaNames.push(name);
      const [lower, upper] = criteria[name];
      lb.push(lower);
      ub.push(upper);
    }

    url.searchParams.set('criteria_names', criteriaNames.join(','));
    url.searchParams.set('lb', lb.join(','));
    url.searchParams.set('ub', ub.join(','));

    return url.toString();
  }
}
