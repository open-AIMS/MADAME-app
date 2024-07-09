import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResultSetInfo } from '../types/api.type';

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
}
