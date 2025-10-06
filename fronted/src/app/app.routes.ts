import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ProtectedComponent } from './features/protected/protected.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'protected', component: ProtectedComponent },
];
