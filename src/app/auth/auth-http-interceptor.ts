import {HttpHandlerFn, HttpRequest} from "@angular/common/http";
import {inject} from "@angular/core";
import {AuthService} from "./auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getAuthToken();
  if (authToken === undefined) {
    return next(req);
  }

  // Clone the request to add the authentication header.
  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${authToken}`),
  });
  return next(newReq);
}
