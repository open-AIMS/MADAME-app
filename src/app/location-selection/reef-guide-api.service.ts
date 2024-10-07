import { environment } from "../../environments/environment";
import {inject, Injectable} from '@angular/core';
import {SelectionCriteria} from "./selection-criteria/selection-criteria.component";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ReefGuideConfigService} from "./reef-guide-config.service";

@Injectable({
  providedIn: 'root'
})
export class ReefGuideApiService {
  private readonly config = inject(ReefGuideConfigService);

  private readonly base: string = environment.reefGuideApiUrl;

  constructor(private http: HttpClient) {
  }

  /**
   * Get URL of COGeoTiff layer matching selection criteria.
   */
  cogUrlForCriteria(region: string, criteria: SelectionCriteria): string {
    if (this.config.mockCOGS()) {
      return `http://localhost:4200/cached-slopes/slopes_${region}.tiff`;
    }

    // http://127.0.0.1:8000/assess/Cairns-Cooktown/slopes?criteria_names=Depth,Slope&lb=-9.0,0.0&ub=-2.0,40.0
    const url = new URL(`/assess/${region}/slopes`, this.base);
    this.addCriteriaToParams(url, criteria);
    return url.toString();
  }

  /**
   * Get XYZ Tile template URL for the criteria
   * @param region
   * @param criteria
   */
  tileUrlForCriteria(region: string, criteria: SelectionCriteria): string {
    // `${this.base}/tile/{z}/{x}/{y}?region=Cairns-Cooktown&rtype=slopes&criteria_names=Depth,Slope,Rugosity&lb=-9.0,0.0,0.0&ub=-2.0,40.0,0.0`,
    const url = `${this.base}/tile/{z}/{x}/{y}`;
    const searchParams = new URLSearchParams();
    searchParams.set('region', region);
    // TODO parameterize rtype
    searchParams.set('rtype', 'slopes');
    this.addCriteriaToParams(searchParams, criteria);
    return `${url}?${searchParams}`;
  }

  private addCriteriaToParams(url: URL | URLSearchParams, criteria: SelectionCriteria) {
    const criteriaNames: Array<string> = [];
    const lb: Array<number> = [];
    const ub: Array<number> = [];

    for (let name in criteria) {
      criteriaNames.push(name);
      const [lower, upper] = criteria[name];
      lb.push(lower);
      ub.push(upper);
    }

    const searchParams = url instanceof URL ? url.searchParams : url;
    searchParams.set('criteria_names', criteriaNames.join(','));
    searchParams.set('lb', lb.join(','));
    searchParams.set('ub', ub.join(','));
  }

  getCriteriaLayers(): Record<string, string> {
    // TODO return from API instead of hardcoding.
    return {
      Depth: "https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_bathymetry/MapServer",
      Slope: "https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_slope_data/MapServer",
      // TODO Turbidity criteria layer
      // Turbidity: "",
      WavesHs: "https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_wave_Hs_data/MapServer",
      WavesTp: "https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_waves_Tp/MapServer"
    // Note: ArcGIS has an alternate WMTS URL
    // https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_waves_Tp/MapServer/WMTS/1.0.0/WMTSCapabilities.xml
    }
  }

  /**
   * Request blob from the URL and createObjectURL for it.
   * Caller is responsible for revokeObjectURL.
   * @param url
   */
  toObjectURL(url: string): Observable<string> {
    return this.http.get(url, { responseType: "blob"}).pipe(
      map(blob => {
        // warn if we're doing this for files > 100mb
        if (blob.size > 100_000_000) {
          console.warn(`Blob size=${blob.size} for ${url}, createObjectURL`, blob.size);
        }

        return URL.createObjectURL(blob);
      })
    );
  }
}
