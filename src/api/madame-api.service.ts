import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

/**
 * MADAME API
 * https://github.com/PeterBaker0/madame-rest-api
 */
@Injectable({
  providedIn: 'root'
})
export class MadameApiService {
  private readonly http = inject(HttpClient);

  base = "http://127.0.0.1:5000/api"

  constructor() { }

  // TODO import types from API
  register(user: { email: string, password: string }) {
    return this.http.post(`${this.base}/auth/register`, user);
  }

  login(user: { email: string, password: string }) {
    return this.http.post(`${this.base}/auth/login`, user);
  }

  getProfile() {
    return this.http.get<{ id: number; email: string;}>(`${this.base}/auth/profile`);
  }
}
