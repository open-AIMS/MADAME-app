import {inject, Injectable, Signal, signal} from '@angular/core';
import {WebApiService} from "../../api/web-api.service";
import {UserPayload, UserProfile} from "../../api/web-api.types";
import {map, Observable, of, retry, switchMap} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {jwtDecode, JwtPayload} from "jwt-decode";

export type AuthenticatedUser = {
  user: UserPayload;
  token: string;
  refreshToken: string;
  expires: number;  // epoch in seconds
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Refresh token this many seconds before it expires.
   */
  refreshPrior = 30; // seconds

  private _authenticated = signal(false);
  /**
   * Whether user is authenticated. readonly
   */
  get authenticated(): Signal<boolean> {
    return this._authenticated;
  }

  private readonly api = inject(WebApiService);

  user$: Observable<UserPayload | undefined> = toObservable(this._authenticated).pipe(
    map(isAuthenticated => {
        return this.auth?.user;
    })
  );

  /**
   * Emits the profile when authenticated; undefined when unauthenticated.
   * @deprecated not needed unless profile gains more information than token.
   */
  profile$: Observable<UserProfile | undefined> = toObservable(this._authenticated).pipe(
    switchMap(isAuthenticated => {
      if (isAuthenticated) {
        return this.api.getProfile();
      } else {
        return of(undefined);
      }
    })
  )

  private auth?: AuthenticatedUser;

  private lsToken = "jwtToken";
  private lsRefreshToken = "jwtRefreshToken";

  private refreshHandle?: any;

  constructor() {
    this.load();
  }

  login(email: string, password: string): Observable<void> {
    return this.api.login({email, password}).pipe(
      map(auth => {
        if (this.onAuth(auth.token, auth.refreshToken)) {
          this.store();
        }
        // map to void, caller shouldn't have access to token.
        return;
      })
    );
  }

  /**
   * Explicit logout request by user.
   */
  logout() {
    this.unauthenticated();
  }

  /**
   * Called when API indicates user is no longer authenticated.
   */
  unauthenticated() {
    if (this.refreshHandle !== undefined) {
      clearTimeout(this.refreshHandle);
      this.refreshHandle = undefined;
    }

    if (this.auth === undefined) {
      return;
    }

    console.log("unauthenticated");
    this.auth = undefined;

    this.clearStore();

    this._authenticated.set(false);
  }

  getAuthToken() {
    return this.auth?.token;
  }

  /**
   * User authenticated or token refreshed.
   * Schedules token refresh.
   * @param token
   * @param refreshToken
   * @returns false if expired
   */
  private onAuth(token: string, refreshToken: string): boolean {
    const auth = this.extractTokenPayload(token, refreshToken);
    if (auth.expires < Date.now() / 1_000) {
      console.log("token expired")
      return false;
    }

    this.auth = auth;
    this._authenticated.set(true);
    this.scheduleTokenRefresh(token);
    return true;
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
          this.onAuth(newToken, auth.refreshToken);
          this.store();
        },
        error: err => {
          console.error("Refresh token failed!", err);
          this.unauthenticated();
        }
      });
  }

  private scheduleTokenRefresh(token: string) {
    const payload = jwtDecode(token);

    if (payload.exp && payload.iat) {
      // working with seconds.
      const expireTime = payload.exp - payload.iat;
      const refreshIn = expireTime - this.refreshPrior;
      if (refreshIn < 0) {
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

  private extractTokenPayload(token: string, refreshToken: string): AuthenticatedUser {
    const payload = jwtDecode<UserPayload & JwtPayload>(token);
    if (payload.exp === undefined) {
      throw new Error('exp field missing in token');
    }
    return {
      user: {
        email: payload.email,
        id: payload.id,
        roles: payload.roles
      },
      token,
      refreshToken,
      expires: payload.exp
    };
  }

  /**
   * Try to load from localStorage.
   */
  private load(): boolean {
    const token = localStorage.getItem(this.lsToken);
    const refreshToken = localStorage.getItem(this.lsRefreshToken);
    if (token != null && refreshToken != null) {
      const accepted = this.onAuth(token, refreshToken);
      if (accepted) {
        this.refreshToken()
        return true;
      } else {
        this.clearStore();
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Store the current tokens in localStorage.
   */
  private store() {
    if (this.auth === undefined) {
      return;
    }
    const { token, refreshToken } = this.auth;
    localStorage.setItem(this.lsToken, token);
    localStorage.setItem(this.lsRefreshToken, refreshToken);
  }

  private clearStore() {
    localStorage.removeItem(this.lsToken);
    localStorage.removeItem(this.lsRefreshToken);
  }

}
