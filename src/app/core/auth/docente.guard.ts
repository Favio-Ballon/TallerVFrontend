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

function hasDocenteRole(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // common single-value claims
    const single = payload.rol || payload.role;
    if (typeof single === 'string' && single.toLowerCase() === 'docente') return true;

    // roles as array or comma-separated string
    const arr = payload.roles || payload.authorities || payload.rolesString;
    if (Array.isArray(arr)) {
      for (const r of arr) {
        if (typeof r === 'string' && r.toLowerCase().includes('docente')) return true;
      }
    } else if (typeof arr === 'string') {
      const parts = arr.split(/[,;\s]+/);
      for (const p of parts) if (p.toLowerCase().includes('docente')) return true;
    }

    // fallback: check any field for docente-like value
    for (const k of Object.keys(payload)) {
      const v = payload[k];
      if (typeof v === 'string' && v.toLowerCase().includes('docente')) return true;
      if (Array.isArray(v)) {
        for (const e of v)
          if (typeof e === 'string' && e.toLowerCase().includes('docente')) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export const docenteGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const accessToken = auth.getAccessToken();
  const refreshToken = auth.getRefreshToken();

  if (accessToken && !isTokenExpired(accessToken)) {
    if (hasDocenteRole(accessToken)) return true;
    // authenticated but not docente
    router.navigate(['/protected']);
    return false;
  } else if (refreshToken) {
    return auth.refreshToken().pipe(
      switchMap(() => {
        const newAccess = auth.getAccessToken();
        if (newAccess && !isTokenExpired(newAccess) && hasDocenteRole(newAccess)) {
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
