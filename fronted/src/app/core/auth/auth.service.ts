import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessTokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  isAuthenticated = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.isAuthenticated.set(!!this.getAccessToken());
  }

  login(email: string, password: string): Observable<any> {
    // Cambia la URL por tu endpoint real
    return this.http.post<any>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        this.setTokens(res.accessToken, res.refreshToken);
        this.isAuthenticated.set(true);
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http
      .post<any>('/api/auth/refresh', {
        refreshToken: this.getRefreshToken(),
      })
      .pipe(
        tap((res) => {
          this.setTokens(res.accessToken, res.refreshToken);
        })
      );
  }

  logout() {
    this.clearTokens();
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setTokens(access: string, refresh: string) {
    localStorage.setItem(this.accessTokenKey, access);
    localStorage.setItem(this.refreshTokenKey, refresh);
  }

  clearTokens() {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}
