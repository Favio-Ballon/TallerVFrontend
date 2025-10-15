import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  activeTab: 'usuarios' | 'gestiones' | 'semestres' = 'usuarios';

  usuarioForm: FormGroup;
  gestionForm: FormGroup;
  semestreForm: FormGroup;


  usuarios: Usuario[] = [];
  gestiones: Gestion[] = [];
  semestres: Semestre[] = [];

  loadingUsuarios = false;
  loadingGestiones = false;
  loadingSemestres = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService
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
      ano: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
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
  }

  setActiveTab(tab: 'usuarios' | 'gestiones' | 'semestres') {
    this.activeTab = tab;

    if (tab === 'gestiones') {
      this.loadGestiones();
    } else if (tab === 'semestres') {
      this.loadSemestres();
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
          alert('Usuario creado exitosamente');
          this.loadingUsuarios = false;
        },
        error: (error: any) => {
          console.error('Error al crear usuario:', error);
          alert('Error al crear usuario: ' + (error.error?.message || error.message));
          this.loadingUsuarios = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.usuarioForm);
    }
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
          alert('Gestión creada exitosamente');
          this.loadGestiones();
          this.loadingGestiones = false;
        },
        error: (error: any) => {
          console.error('Error al crear gestión:', error);
          alert('Error al crear gestión: ' + (error.error?.message || error.message));
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
          alert('Semestre creado exitosamente');
          this.loadSemestres();
          this.loadingSemestres = false;
        },
        error: (error: any) => {
          console.error('Error al crear semestre:', error);
          alert('Error al crear semestre: ' + (error.error?.message || error.message));
          this.loadingSemestres = false;
        },
      });
    } else {
      this.markFormGroupTouched(this.semestreForm);
    }
  }

  loadSemestres() {
    console.log('🔄 Cargando semestres...');
    this.adminService.getSemestres().subscribe({
      next: (semestres: Semestre[]) => {
        console.log('✅ Semestres cargados:', semestres);
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
