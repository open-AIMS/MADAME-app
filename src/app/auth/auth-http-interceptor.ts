import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { tap } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const authToken = authService.getAuthToken();
  if (authToken === undefined) {
    return next(req);
  }

  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${authToken}`)
  });
  return next(newReq).pipe(
    tap({
      error: err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            authService.unauthenticated();
          }
        }
      }
    })
  );
}
