import {inject, Injectable, signal} from '@angular/core';
import {WebApiService} from "../../api/web-api.service";
import {LoginResponse, UserProfile} from "../../api/web-api.types";
import {map, Observable, of, switchMap} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";

export type AuthenticatedUser = LoginResponse & {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(WebApiService);

  authenticated = signal(false);

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

  constructor() { }

  login(email: string, password: string): Observable<void> {
    return this.api.login({email, password}).pipe(
      map(auth => {
        this.auth = {
          email,
          ...auth
        };

        this.authenticated.set(true);

        // caller shouldn't have access to token.
        return;
      })
    );
  }

  logout() {
    this.unauthenticated();
    // TODO call API logout?
  }

  /**
   * Called when API indicates user is no longer authenticated.
   */
  unauthenticated() {
    this.auth = undefined;
    this.authenticated.set(false);
  }

  getAuthToken() {
    return this.auth?.token;
  }

}
