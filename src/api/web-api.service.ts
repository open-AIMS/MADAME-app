import {inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {LoginResponse, Note, Polygon, UserProfile} from "./web-api.types";
import {map, Observable} from "rxjs";

// TODO import types from API

/**
 * MADAME/ReefGuide Web API
 * https://github.com/open-AIMS/reefguide-web-api
 *
 * This service provides authentication endpoints, which is used by AuthService.
 */
@Injectable({
  providedIn: "root",
})
export class WebApiService {
  private readonly http = inject(HttpClient);

  base = environment.webApiUrl;

  constructor() {}

  register(user: {email: string; password: string}) {
    return this.http.post<{userId: number}>(`${this.base}/auth/register`, user);
  }

  login(user: {email: string; password: string}) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, user);
  }

  refreshToken(refreshToken: string): Observable<string> {
    return this.http
      .post<{token: string}>(`${this.base}/auth/token`, {refreshToken})
      .pipe(map(resp => resp.token));
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.base}/auth/profile`);
  }

  getPolygons(): Observable<Polygon[]> {
    return this.http.get<Polygon[]>(`${this.base}/polygons`);
  }

  getPolygon(id: string): Observable<Polygon> {
    return this.http.get<Polygon>(`${this.base}/polygons/${id}`);
  }

  // TODO fix types where using any
  createPolygon(geoJSON: any): Observable<any> {
    return this.http.post<any>(`${this.base}/polygons`, geoJSON);
  }

  updatePolygon(id: string, geoJSON: any): Observable<void> {
    return this.http.put<any>(`${this.base}/polygons/${id}`, geoJSON);
  }

  deletePolygon(id: string) {
    return this.http.delete(`${this.base}/polygons/${id}`);
  }

  // TODO remaining note endpoints, types
  getNotes(): Observable<Array<Note>> {
    return this.http.get<Array<Note>>(`${this.base}/notes`);
  }

  getNote(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.base}/notes/${id}`);
  }

  createNote(polygonId: number, content: string) {
    return this.http.post(`${this.base}/notes`, {
      polygonId,
      content,
    });
  }

  updateNote(id: string, content: string) {
    return this.http.put(`${this.base}/notes/${id}`, {content});
  }

  getClusterStatus() {
    return this.http.get<any>(`${this.base}/admin/status`);
  }

  scaleCluster(desiredCount: number) {
    return this.http.post<void>(`${this.base}/admin/scale`, {desiredCount});
  }

  redeployCluster() {
    return this.http.post<void>(`${this.base}/admin/redeploy`, {});
  }
}
