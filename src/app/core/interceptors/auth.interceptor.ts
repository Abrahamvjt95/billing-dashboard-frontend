import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.includes('/auth/')) {
        return throwError(() => err);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.logout();
        return EMPTY;
      }

      if (isRefreshing) {
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(addToken(req, newToken!)))
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return auth.refresh({ refreshToken }).pipe(
        switchMap(res => {
          isRefreshing = false;
          refreshDone$.next(res.accessToken);
          return next(addToken(req, res.accessToken));
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
