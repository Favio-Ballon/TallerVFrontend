import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const accessToken = auth.getAccessToken();
  const refreshToken = auth.getRefreshToken();

  if (accessToken && !isTokenExpired(accessToken)) {
    return true;
  } else if (refreshToken) {
    // Intentar refrescar el token
    return auth.refreshToken().pipe(
      switchMap(() => {
        const newAccessToken = auth.getAccessToken();
        if (newAccessToken && !isTokenExpired(newAccessToken)) {
          return of(true);
        } else {
          router.navigate(['/login']);
          return of(false);
        }
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  } else {
    router.navigate(['/login']);
    return false;
  }
};

