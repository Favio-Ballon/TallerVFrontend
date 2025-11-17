import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService, Usuario, Gestion, Semestre } from '../../core/services/admin.service';
import { ToastService } from '../../shared/toast/toast.service';
import { AdminUsuariosComponent } from './usuarios/admin-usuarios.component';
import { AdminGestionesComponent } from './gestiones/admin-gestiones.component';
import { AdminSemestresComponent } from './semestres/admin-semestres.component';
import { AdminModalidadesComponent } from './modalidades/admin-modalidades.component';
import { AdminMateriasComponent } from './materias/admin-materias.component';
import { AdminEvaluacionesComponent } from './evaluaciones/admin-evaluaciones.component';
import { AdminSemestreMateriasComponent } from './semestre-materias/admin-semestre-materias.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminUsuariosComponent,
    AdminGestionesComponent,
    AdminSemestresComponent,
    AdminModalidadesComponent,
    AdminMateriasComponent,
    AdminEvaluacionesComponent,
    AdminSemestreMateriasComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  activeTab:
    | 'usuarios'
    | 'gestiones'
    | 'semestres'
    | 'modalidades'
    | 'materias'
    | 'evaluaciones'
    | 'semestreMaterias' = 'usuarios';
  // TODO modularizar mas, con scream architecture
  usuarioForm: FormGroup;
  gestionForm: FormGroup;
  semestreForm: FormGroup;

  usuarios: Usuario[] = [];
  gestiones: Gestion[] = [];
  semestres: Semestre[] = [];

  loadingUsuarios = false;
  loadingGestiones = false;
  loadingSemestres = false;
  // Mobile nav toggle
  isNavOpen = false;
  userName: string | null = null;
  // keep router injected to sync URL <-> activeTab
  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      telefono: ['', [Validators.required]],
      rol: ['estudiante', [Validators.required]],
    });

    this.gestionForm = this.fb.group({
      ano: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
    });

    this.semestreForm = this.fb.group({
      nombre: ['', [Validators.required]],
      gestionId: ['', [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.loadGestiones();
    // sync active tab with URL
    this.syncActiveTabFromUrl();
    // listen for navigation changes
    this.router.events.subscribe(() => this.syncActiveTabFromUrl());
    // load user name for header
    this.authService.me().subscribe({
      next: (p) => (this.userName = p?.name || null),
      error: () => (this.userName = null),
    });
  }

  private syncActiveTabFromUrl() {
    const url = this.router.url || '';
    // expected /admin or /admin/<tab>
    const parts = url.split('/').filter(Boolean);
    const tab = parts[1] || 'usuarios';
    this.setActiveTabFromRoute(tab);
  }

  private setActiveTabFromRoute(tab: string) {
    switch (tab) {
      case 'usuarios':
        this.setActiveTab('usuarios');
        break;
      case 'gestiones':
        this.setActiveTab('gestiones');
        break;
      case 'semestres':
        this.setActiveTab('semestres');
        break;
      case 'modalidades':
        this.setActiveTab('modalidades');
        break;
      case 'materias':
        this.setActiveTab('materias');
        break;
      case 'evaluaciones':
        this.setActiveTab('evaluaciones');
        break;
      case 'semestreMaterias':
        this.setActiveTab('semestreMaterias');
        break;
      default:
        this.setActiveTab('usuarios');
        break;
    }
  }
  setActiveTab(
    tab:
      | 'usuarios'
      | 'gestiones'
      | 'semestres'
      | 'modalidades'
      | 'materias'
      | 'evaluaciones'
      | 'semestreMaterias'
  ) {
    this.activeTab = tab;

    if (tab === 'usuarios') {
      this.loadUsuarios();
    } else if (tab === 'gestiones') {
      this.loadGestiones();
    } else if (tab === 'semestres') {
      this.loadSemestres();
    } else if (tab === 'modalidades') {
      // ensure gestiones + modalidades are loaded
      this.loadGestiones();
    }
  }

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  selectTab(
    tab:
      | 'usuarios'
      | 'gestiones'
      | 'semestres'
      | 'modalidades'
      | 'materias'
      | 'evaluaciones'
      | 'semestreMaterias'
  ) {
    // navigate so URL reflects the selected admin page
    this.router.navigate(['/admin', tab]);
    // close mobile nav after selecting
    this.isNavOpen = false;
  }

  getActiveTabLabel() {
    switch (this.activeTab) {
      case 'usuarios':
        return 'Usuarios';
      case 'gestiones':
        return 'Gestiones';
      case 'semestres':
        return 'Semestres';
      case 'modalidades':
        return 'Modalidades';
      case 'materias':
        return 'Materias';
      case 'evaluaciones':
        return 'Evaluaciones';
      case 'semestreMaterias':
        return 'Semestre-Materias';
      default:
        return '';
    }
  }

  onSubmitUsuario() {
    if (this.usuarioForm.valid) {
      this.loadingUsuarios = true;
      const usuario: Usuario = this.usuarioForm.value;

      this.adminService.createUsuario(usuario).subscribe({
        next: (response: any) => {
          console.log('Usuario creado:', response);
          this.usuarioForm.reset();
          this.usuarioForm.patchValue({ rol: 'estudiante' });
          this.toast.success('Usuario creado exitosamente');
          // recargar la lista de usuarios después de crear uno
          this.loadUsuarios();
          this.loadingUsuarios = false;
        },
        error: (error: any) => {
          console.error('Error al crear usuario:', error);
          this.toast.error('Error al crear usuario: ' + (error.error?.message || error.message));
          this.loadingUsuarios = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.usuarioForm);
    }
  }

  loadUsuarios(role: string | undefined = undefined) {
    this.loadingUsuarios = true;

    // Si role es undefined (o vacio) pedimos todo, si no pedimos por rol
    const fetch$ =
      role === undefined || role === ''
        ? this.adminService.getUsuarios()
        : this.adminService.getUsuarios({ rol: role });

    fetch$.subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarios = usuarios;
        this.loadingUsuarios = false;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.loadingUsuarios = false;
      },
    });
  }

  // Gestion
  onSubmitGestion() {
    if (this.gestionForm.valid) {
      this.loadingGestiones = true;
      const gestion: Gestion = this.gestionForm.value;

      this.adminService.createGestion(gestion).subscribe({
        next: (response: any) => {
          console.log('Gestión creada:', response);
          this.gestionForm.reset();
          this.toast.success('Gestión creada exitosamente');
          this.loadGestiones();
          this.loadingGestiones = false;
        },
        error: (error: any) => {
          console.error('Error al crear gestión:', error);
          this.toast.error('Error al crear gestión: ' + (error.error?.message || error.message));
          this.loadingGestiones = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.gestionForm);
    }
  }

  loadGestiones() {
    this.adminService.getGestiones().subscribe({
      next: (gestiones: Gestion[]) => {
        this.gestiones = gestiones;
      },
      error: (error: any) => {
        console.error('Error al cargar gestiones:', error);
      },
    });
  }

  // Semestre
  onSubmitSemestre() {
    if (this.semestreForm.valid) {
      this.loadingSemestres = true;
      const semestre: Semestre = this.semestreForm.value;

      this.adminService.createSemestre(semestre).subscribe({
        next: (response: any) => {
          console.log('Semestre creado:', response);
          this.semestreForm.reset();
          this.toast.success('Semestre creado exitosamente');
          this.loadSemestres();
          this.loadingSemestres = false;
        },
        error: (error: any) => {
          console.error('Error al crear semestre:', error);
          this.toast.error('Error al crear semestre: ' + (error.error?.message || error.message));
          this.loadingSemestres = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.semestreForm);
    }
  }

  loadSemestres() {
    console.log('Cargando semestres...');
    this.adminService.getSemestres().subscribe({
      next: (semestres: Semestre[]) => {
        console.log('Semestres cargados:', semestres);
        this.semestres = semestres;
      },
      error: (error: any) => {
        console.error('Error al cargar semestres:', error);
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  logout() {
    this.authService.logout();
  }
}
