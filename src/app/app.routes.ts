import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ProtectedComponent } from './features/protected/protected.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './core/auth/auth.guard';
import { docenteGuard } from './core/auth/docente.guard';
import { DocenteMatriculacionesComponent } from './features/docentes/matriculaciones/docente-matriculaciones.component';
import { DocenteFaltasComponent } from './features/docentes/faltas/docente-faltas.component';
import { DocenteComponent } from './features/docentes/docente.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'protected', component: ProtectedComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  {
    path: 'docentes',
    component: DocenteComponent,
    canActivate: [authGuard, docenteGuard],
    children: [
      { path: '', redirectTo: 'matriculaciones', pathMatch: 'full' },
      { path: 'matriculaciones', component: DocenteMatriculacionesComponent },
      { path: 'faltas', component: DocenteFaltasComponent },
      {
        path: 'notas',
        loadComponent: () =>
          import('./features/docentes/notas/docente-notas.component').then(
            (m) => m.DocenteNotasComponent
          ),
      },
    ],
  },
];
