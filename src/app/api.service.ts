import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DataFrame, ResultSetInfo } from '../types/api.type';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  getResultSets(): Observable<Array<string>> {
    return this.http.get<Array<string>>(`/api/resultsets`);
  }

  getResultSetInfo(id: string): Observable<ResultSetInfo> {
    return this.http.get<ResultSetInfo>(`/api/resultset/${id}/info`);
  }

  getResultSetScenarios(id: string): Observable<DataFrame> {
    return fixDataFrame(this.http.get<DataFrame>(`/api/resultset/${id}/scenarios`));
  }

  getResultSetModelSpec(id: string): Observable<DataFrame> {
    return fixDataFrame(this.http.get<DataFrame>(`/api/resultset/${id}/modelspec`));
  }

  getMeanRelativeCover(id: string): Observable<DataFrame> {
    return fixDataFrame(this.http.get<DataFrame>(`/api/resultset/${id}/relative_cover`));
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
