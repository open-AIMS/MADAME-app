import { environment } from '../../environments/environment';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, switchMap } from 'rxjs';
import { ReefGuideConfigService } from './reef-guide-config.service';
import {
  SelectionCriteria,
  SiteSuitabilityCriteria,
} from './reef-guide-api.types';

@Injectable({
  providedIn: 'root',
})
export class ReefGuideApiService {
  private readonly config = inject(ReefGuideConfigService);

  private readonly base: string = environment.reefGuideApiUrl;

  // URL where public contents are deployed.
  private readonly publicBase = '';

  constructor(private http: HttpClient) {}

  /**
   * Get URL of COGeoTiff layer matching selection criteria.
   */
  cogUrlForCriteria(region: string, criteria: SelectionCriteria): string {
    // http://127.0.0.1:8000/assess/Cairns-Cooktown/slopes?criteria_names=Depth,Slope&lb=-9.0,0.0&ub=-2.0,40.0
    const url = new URL(`/assess/${region}/slopes`, this.base);
    this.addCriteriaToParams(url, criteria);
    return url.toString();
  }

  siteSuitabilityUrlForCriteria(
    region: string,
    criteria: SelectionCriteria,
    suitabilityCriteria: SiteSuitabilityCriteria
  ): string {
    const rtype = 'slopes';
    const url = new URL(
      `/suitability/site-suitability/${region}/${rtype}`,
      this.base
    );
    this.addCriteriaToParams(url, criteria);
    for (const [key, value] of Object.entries(suitabilityCriteria)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  getSiteSuitability(
    region: string,
    criteria: SelectionCriteria,
    suitabilityCriteria: SiteSuitabilityCriteria
  ): Observable<any> {
    const url = this.siteSuitabilityUrlForCriteria(
      region,
      criteria,
      suitabilityCriteria
    );
    return this.http.get(url);
  }

  private addCriteriaToParams(
    url: URL | URLSearchParams,
    criteria: SelectionCriteria
  ) {
    const searchParams = url instanceof URL ? url.searchParams : url;
    for (const name in criteria) {
      const [lower, upper] = criteria[name];
      searchParams.set(name, `${lower}:${upper}`);
    }
  }

  getCriteriaLayers(): Record<string, string> {
    // TODO return from API instead of hardcoding.
    return {
      Depth:
        'https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_bathymetry/MapServer',
      Slope:
        'https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_slope_data/MapServer',
      WavesHs:
        'https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_wave_Hs_data/MapServer',
      WavesTp:
        'https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_waves_Tp/MapServer',
      // Note: ArcGIS has an alternate WMTS URL
      // https://tiles.arcgis.com/tiles/wfyOCawpdks4prqC/arcgis/rest/services/GBR_waves_Tp/MapServer/WMTS/1.0.0/WMTSCapabilities.xml
    };
  }

  /**
   * Request blob from the URL and createObjectURL for it.
   * Caller is responsible for revokeObjectURL.
   * @param url
   * @param plainHttp - use fetch instead of Angular HTTP client
   * @param fileFormat - optional file extension (e.g., 'tif', 'tiff') to help with format detection
   */
  toObjectURL(
    url: string,
    plainHttp = false,
    fileFormat?: string
  ): Observable<string> {
    const request$ = plainHttp
      ? from(fetch(url)).pipe(switchMap(r => from(r.blob())))
      : this.http.get(url, { responseType: 'blob' });

    return request$.pipe(
      map(blob => {
        // warn if we're doing this for files > 100mb
        if (blob.size > 100_000_000) {
          console.warn(
            `Blob size=${blob.size} for ${url}, createObjectURL`,
            blob.size
          );
        }

        // If fileFormat is provided, create a File object with proper name and MIME type
        if (fileFormat) {
          const extension = fileFormat.startsWith('.')
            ? fileFormat
            : `.${fileFormat}`;
          const mimeType = this.getMimeTypeForExtension(extension);
          const filename = `file${extension}`;

          const file = new File([blob], filename, {
            type: mimeType,
            lastModified: Date.now(),
          });
          return URL.createObjectURL(file);
        }

        return URL.createObjectURL(blob);
      })
    );
  }

  /**
   * Helper method to get MIME type based on file extension
   */
  private getMimeTypeForExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.tif': 'image/tiff',
      '.tiff': 'image/tiff',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.geojson': 'application/geo+json',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
