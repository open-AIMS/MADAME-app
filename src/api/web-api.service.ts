import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {LoginResponse, UserProfile} from "./web-api.types";
import {map, Observable} from "rxjs";

// TODO import types from API

/**
 * MADAME/ReefGuide Web API
 * https://github.com/open-AIMS/reefguide-web-api
 *
 * This service provides authentication endpoints, which is used by AuthService.
 */
@Injectable({
  providedIn: 'root'
})
export class WebApiService {
  private readonly http = inject(HttpClient);

  base = environment.webApiUrl;

  constructor() { }

  register(user: { email: string, password: string }) {
    return this.http.post<{ userId: number}>(`${this.base}/auth/register`, user);
  }

  login(user: { email: string, password: string }) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, user);
  }

  refreshToken(refreshToken: string): Observable<string> {
    return this.http.post<{ token: string }>(`${this.base}/auth/token`, { refreshToken }).pipe(
      map(resp => resp.token)
    );
  }

  getProfile() {
    return this.http.get<UserProfile>(`${this.base}/auth/profile`);
  }
}
