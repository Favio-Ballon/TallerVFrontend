import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  AdminService,
  Matriculacion,
  SemestreMateria,
  Usuario,
} from '../../core/services/admin.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-matriculaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-matriculaciones.component.html',
  styleUrls: ['./admin-matriculaciones.component.css'],
})
export class AdminMatriculacionesComponent implements OnInit {
  lista: Matriculacion[] = [];
  alumnos: Usuario[] = [];
  semestreMaterias: SemestreMateria[] = [];

  form: FormGroup;
  loading = false;

  constructor(private admin: AdminService, private fb: FormBuilder, private toast: ToastService) {
    this.form = this.fb.group({
      alumnoId: ['', [Validators.required]],
      semestreMateriaId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.admin
      .getMatriculaciones()
      .subscribe({ next: (r) => (this.lista = r), error: (e) => console.error(e) });
    this.admin
      .getUsuarios({ rol: 'estudiante' })
      .subscribe({ next: (a) => (this.alumnos = a), error: (e) => console.error(e) });
    this.admin
      .getSemestreMaterias()
      .subscribe({ next: (s) => (this.semestreMaterias = s), error: (e) => console.error(e) });
  }

  submit() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsTouched());
      return;
    }

    const payload = {
      alumnoId: Number(this.form.value.alumnoId),
      semestreMateriaId: Number(this.form.value.semestreMateriaId),
    };

    this.loading = true;
    this.admin.createMatriculacion(payload).subscribe({
      next: (m) => {
        this.toast.success('Alumno matriculado correctamente');
        this.loading = false;
        this.form.reset();
        this.loadAll();
      },
      error: (e) => {
        console.error(e);
        this.toast.error('Error al matricular alumno');
        this.loading = false;
      },
    });
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('¿Eliminar matriculación?')) return;
    this.admin.deleteMatriculacion(id).subscribe({
      next: () => {
        this.toast.success('Matriculación eliminada');
        this.loadAll();
      },
      error: (e) => {
        console.error(e);
        this.toast.error('Error al eliminar matriculación');
      },
    });
  }
}
