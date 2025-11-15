import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-wildcard-redirect',
  standalone: true,
  imports: [CommonModule],
  template: '',
})
export class WildcardRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const handle = (auths?: string[] | null) => {
      const joined = (auths || []).join(' ').toLowerCase();
      if (joined.includes('admin')) {
        this.router.navigate(['/admin']);
      } else if (joined.includes('docente')) {
        this.router.navigate(['/docentes']);
      } else if (joined.includes('estudiante')) {
        this.router.navigate(['/estudiante/notas']);
      } else {
        this.router.navigate(['/login']);
      }
    };

    // Try to get profile; if it fails attempt refresh and retry
    this.auth
      .me()
      .pipe(
        catchError(() => {
          const refresh = this.auth.getRefreshToken();
          if (refresh) {
            return this.auth.refreshToken().pipe(
              switchMap(() => this.auth.me()),
              catchError(() => of(null))
            );
          }
          return of(null);
        })
      )
      .subscribe({
        next: (p) => {
          handle(p?.authorities || null);
        },
        error: () => this.router.navigate(['/login']),
      });
  }
}
