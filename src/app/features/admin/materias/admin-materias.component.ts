import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AdminService, Materia, Semestre, Docente } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-materias.component.html',
  styleUrls: ['./admin-materias.component.css'],
})
export class AdminMateriasComponent implements OnInit {
  materias: Materia[] = [];
  materiaForm: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.materiaForm = this.fb.group({
      nombre: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loadMaterias();
  }

  loadMaterias() {
    this.adminService.getMaterias().subscribe({
      next: (m) => (this.materias = m),
      error: (e) => console.error('Error cargar materias', e),
    });
  }

  loadSemestres() {
    // no-op: semestres are not required for the simplified materia API
  }

  loadDocentes() {
    // no-op: docentes are not required for the simplified materia API
  }

  edit(m: Materia) {
    this.editingId = m.id ?? null;
    this.materiaForm.patchValue({ nombre: m.nombre });
  }

  clear() {
    this.editingId = null;
    this.materiaForm.reset();
  }

  save() {
    if (this.materiaForm.invalid) {
      Object.values(this.materiaForm.controls).forEach((c) => c.markAsTouched());
      return;
    }
    const payload = {
      nombre: this.materiaForm.value.nombre,
    };

    this.loading = true;
    if (this.editingId) {
      this.adminService.updateMateria(this.editingId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadMaterias();
          this.clear();
        },
        error: (e) => {
          console.error(e);
          this.loading = false;
        },
      });
    } else {
      this.adminService.createMateria(payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadMaterias();
          this.clear();
        },
        error: (e) => {
          console.error(e);
          this.loading = false;
        },
      });
    }
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('¿Eliminar materia?')) return;
    this.adminService.deleteMateria(id).subscribe({
      next: () => this.loadMaterias(),
      error: (e) => console.error('Error al eliminar', e),
    });
  }
}
