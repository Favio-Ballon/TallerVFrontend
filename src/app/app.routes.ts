import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './core/auth/auth.guard';
import { docenteGuard } from './core/auth/docente.guard';
import { estudianteGuard } from './core/auth/estudiante.guard';
import { adminGuard } from './core/auth/admin.guard';
import { DocenteMatriculacionesComponent } from './features/docentes/matriculaciones/docente-matriculaciones.component';
import { DocenteFaltasComponent } from './features/docentes/faltas/docente-faltas.component';
import { DocenteComponent } from './features/docentes/docente.component';
import { EstudianteComponent } from './features/estudiante/estudiante.component';
import { EstudianteFaltasComponent } from './features/estudiante/faltas/estudiante-faltas.component';
import { EstudianteNotasComponent } from './features/estudiante/notas/estudiante-notas.component';
import { WildcardRedirectComponent } from './core/auth/wildcard-redirect.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  // default admin path -> usuarios and support deep links like /admin/usuarios
  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'admin/:tab', component: AdminComponent, canActivate: [authGuard, adminGuard] },
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
  {
    path: 'estudiante',
    component: EstudianteComponent,
    canActivate: [authGuard, estudianteGuard],
    children: [
      { path: '', redirectTo: 'matriculaciones', pathMatch: 'full' },
      {
        path: 'matriculaciones',
        loadComponent: () =>
          import('./features/estudiante/notas/estudiante-notas.component').then(
            (m) => m.EstudianteNotasComponent
          ),
      },
      { path: 'faltas', component: EstudianteFaltasComponent },
      { path: 'notas', component: EstudianteNotasComponent },
    ],
  },
];

// catch-all route: redirect users to their primary area
// Append the fallback route to the routes exported by this module so the router picks it up.
routes.push({ path: '**', component: WildcardRedirectComponent });
