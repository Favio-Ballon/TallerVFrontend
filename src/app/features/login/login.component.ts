import { Component } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  errorMsg = '';
  loading = false;
  form;

  constructor(private auth: AuthService, private router: Router, private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        // after login, inspect token and redirect by role
        const token = this.auth.getAccessToken();
        try {
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // possible role claims
            const single = payload.rol || payload.role;
            const arr = payload.roles || payload.authorities || payload.rolesString;
            const roleStr = (() => {
              if (typeof single === 'string') return single.toLowerCase();
              if (Array.isArray(arr) && arr.length) return String(arr[0]).toLowerCase();
              if (typeof arr === 'string') return arr.toLowerCase();
              // fallback: scan for known roles
              for (const k of Object.keys(payload)) {
                const v = payload[k];
                if (typeof v === 'string' && /admin|docente|estudiante/.test(v.toLowerCase()))
                  return v.toLowerCase();
                if (Array.isArray(v)) {
                  for (const e of v)
                    if (typeof e === 'string' && /admin|docente|estudiante/.test(e.toLowerCase()))
                      return e.toLowerCase();
                }
              }
              return '';
            })();

            if (roleStr.includes('admin')) {
              this.router.navigate(['/admin']);
              return;
            }
            if (roleStr.includes('docente')) {
              this.router.navigate(['/docentes']);
              return;
            }
            if (roleStr.includes('estudiante')) {
              this.router.navigate(['/estudiante/notas']);
              return;
            }
          }
        } catch (e) {
          // ignore parsing errors and fallback
        }

        // fallback
        this.router.navigate(['/protected']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Login failed';
      },
    });
  }
}
