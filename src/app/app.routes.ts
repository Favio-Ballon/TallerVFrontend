import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ProtectedComponent } from './features/protected/protected.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'protected', component: ProtectedComponent, canActivate: [authGuard] },
];
