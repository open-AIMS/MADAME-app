import {inject, Injectable, signal} from '@angular/core';
import {WebApiService} from "../../api/web-api.service";
import {LoginResponse, UserProfile} from "../../api/web-api.types";
import {map, Observable, of, retry, switchMap} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {jwtDecode} from "jwt-decode";

export type AuthenticatedUser = LoginResponse & {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Refresh token this many seconds before it expires.
   */
  refreshPrior = 30; // seconds

  authenticated = signal(false);

  private readonly api = inject(WebApiService);

  /**
   * Emits the profile when authenticated; undefined when unauthenticated.
   */
  profile$: Observable<UserProfile | undefined> = toObservable(this.authenticated).pipe(
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        return this.api.getProfile();
      } else {
        return of(undefined);
      }
    })
  )

  private auth?: AuthenticatedUser;

  private refreshHandle?: any;

  constructor() {
  }

  login(email: string, password: string): Observable<void> {
    return this.api.login({email, password}).pipe(
      map(auth => {
        this.onAuth({
          email,
          ...auth
        });

        // caller shouldn't have access to token.
        return;
      })
    );
  }

  logout() {
    this.unauthenticated();
  }

  /**
   * Called when API indicates user is no longer authenticated.
   */
  unauthenticated() {
    this.auth = undefined;
    if (this.refreshHandle !== undefined) {
      clearTimeout(this.refreshHandle);
      this.refreshHandle = undefined;
    }
    this.authenticated.set(false);
  }

  getAuthToken() {
    return this.auth?.token;
  }

  private onAuth(auth: AuthenticatedUser) {
    this.auth = auth;
    this.authenticated.set(true);
    this.scheduleTokenRefresh(auth.token);
  }

  private refreshToken() {
    const auth = this.auth;
    if (auth === undefined) {
      throw new Error("unauthenticated, can't refresh token");
    }

    this.api.refreshToken(auth.refreshToken)
      .pipe(retry({count: 2, delay: 2_000}))
      .subscribe({
        next: newToken => {
          console.log("refreshed token");
          auth.token = newToken;
          this.scheduleTokenRefresh(newToken);
        },
        error: err => {
          console.error("Refresh token failed!", err);
          // user will become unauthenticated when current token expires.
        }
      });
  }

  private scheduleTokenRefresh(token: string) {
    const payload = jwtDecode(token);

    if (payload.exp) {
      // working with seconds.
      const expireTime = payload.exp - Date.now() / 1_000;
      const refreshIn = expireTime - this.refreshPrior;
      if (refreshIn < 10) {
        console.warn("Token expiration too soon, not refreshing!");
      } else {
        console.log(`scheduling refresh token in ${refreshIn} seconds`);
        this.refreshHandle = setTimeout(() => {
          this.refreshHandle = undefined;
          this.refreshToken();
        }, refreshIn * 1_000);
      }
    }
  }

}
