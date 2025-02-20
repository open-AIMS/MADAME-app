import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { DataFrame, ModelScenariosDesc, ResultSetInfo } from '../types/api.type';
import { PointOrRange, pointOrRangeToParam } from '../util/param-util';
import { MODEL_RUNS } from '../mock-data/model-runs.mockdata';

@Injectable({
  providedIn: 'root',
})
export class AdriaApiService {
  private base: string = environment.adriaApiUrl;

  constructor(private http: HttpClient) {}

  getResultSets(): Observable<Array<string>> {
    return this.http.get<Array<string>>(`${this.base}/resultsets`);
  }

  getResultSetInfo(id: string): Observable<ResultSetInfo> {
    // temporary mock data for prototyping
    if (id.startsWith('MOCK-')) {
      const run = MODEL_RUNS.find(m => m.id === id);
      if (run === undefined) {
        throw new Error(`MODEL_RUNS missing id=${id}`);
      }
      return of(run);
    } else {
      return this.http.get<ResultSetInfo>(`${this.base}/resultset/${id}/info`);
    }
  }

  getResultSetScenarios(id: string): Observable<DataFrame> {
    return fixDataFrame(
      this.http.get<DataFrame>(`${this.base}/resultset/${id}/scenarios`)
    );
  }

  getResultSetModelSpec(id: string): Observable<DataFrame> {
    return fixDataFrame(
      this.http.get<DataFrame>(`${this.base}/resultset/${id}/modelspec`)
    );
  }

  getMeanRelativeCover(
    id: string,
    timestep?: PointOrRange
  ): Observable<DataFrame> {
    if (timestep !== undefined) {
      return fixDataFrame(
        this.http.get<DataFrame>(
          `${this.base}/resultset/${id}/relative_cover`,
          { params: { timestep: pointOrRangeToParam(timestep) } }
        )
      );
    } else {
      return fixDataFrame(
        this.http.get<DataFrame>(`${this.base}/resultset/${id}/relative_cover`)
      );
    }
  }

  postModelInvokeRun(
    params: ModelScenariosDesc
  ): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.base}/invoke-run/coralblox`, JSON.stringify(params), { headers }
    );
  }
}


/**
 * Convert 1-based lookup values to 0-based. (mutates)
 * @param dataframe raw dataframe from API
 */
function fixDataFrame(dataframe: Observable<DataFrame>) {
  return dataframe.pipe(
    tap(df => {
      const { lookup } = df.colindex;
      for (let key in lookup) {
        lookup[key]--;
      }
    })
  );
}
