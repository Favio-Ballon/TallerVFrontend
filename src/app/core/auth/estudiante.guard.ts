import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const estudianteGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const accessToken = auth.getAccessToken();
  const refreshToken = auth.getRefreshToken();

  const checkProfile = () =>
    auth.me().pipe(
      map((p) => {
        const auths = p?.authorities || [];
        for (const a of auths) {
          if (typeof a === 'string' && a.toLowerCase().includes('estudiante')) return true;
        }
        // not a estudiante: redirect to the primary area the user belongs to
        const joined = auths.join(' ').toLowerCase();
        if (joined.includes('admin')) {
          router.navigate(['/admin']);
        } else if (joined.includes('docente')) {
          router.navigate(['/docentes']);
        } else if (joined.includes('estudiante')) {
          router.navigate(['/estudiante/notas']);
        } else {
          router.navigate(['/login']);
        }
        return false;
      }),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );

  if (accessToken && !isTokenExpired(accessToken)) {
    return checkProfile();
  } else if (refreshToken) {
    return auth.refreshToken().pipe(
      switchMap(() => checkProfile()),
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
