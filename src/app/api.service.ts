import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.http.get<DataFrame>(`/api/resultset/${id}/scenarios`);
  }

  getResultSetModelSpec(id: string): Observable<DataFrame> {
    return this.http.get<DataFrame>(`/api/resultset/${id}/modelspec`);
  }
}
