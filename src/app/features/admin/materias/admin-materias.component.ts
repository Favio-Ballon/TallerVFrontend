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
  semestres: Semestre[] = [];
  docentes: Docente[] = [];
  materiaForm: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.materiaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      cupos: [0, [Validators.required, Validators.min(0)]],
      estado: ['Activa', [Validators.required]],
      semestreId: ['', [Validators.required]],
      docenteId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loadSemestres();
    this.loadDocentes();
    this.loadMaterias();
  }

  loadMaterias() {
    this.adminService.getMaterias().subscribe({
      next: (m) => (this.materias = m),
      error: (e) => console.error('Error cargar materias', e),
    });
  }

  loadSemestres() {
    this.adminService.getSemestres().subscribe({
      next: (s) => (this.semestres = s),
      error: (e) => console.error('Error cargar semestres', e),
    });
  }

  loadDocentes() {
    // Reuse getUsuarios with filter rol=docente
    this.adminService.getUsuarios({ rol: 'docente' }).subscribe({
      next: (users) => {
        // map to Docente minimal shape
        this.docentes = users.map(
          (u) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido } as Docente)
        );
      },
      error: (e) => console.error('Error cargar docentes', e),
    });
  }

  edit(m: Materia) {
    this.editingId = m.id ?? null;
    this.materiaForm.patchValue({
      nombre: m.nombre,
      cupos: m.cupos,
      estado: m.estado,
      semestreId: m.semestre ? m.semestre.id : m.semestreId,
      docenteId: m.docente ? m.docente.id : m.docenteId,
    });
  }

  clear() {
    this.editingId = null;
    this.materiaForm.reset({ estado: 'Activa' });
  }

  save() {
    if (this.materiaForm.invalid) {
      Object.values(this.materiaForm.controls).forEach((c) => c.markAsTouched());
      return;
    }
    const payload = {
      nombre: this.materiaForm.value.nombre,
      cupos: Number(this.materiaForm.value.cupos),
      estado: this.materiaForm.value.estado,
      semestreId: Number(this.materiaForm.value.semestreId),
      docenteId: Number(this.materiaForm.value.docenteId),
    };

    // Cupos positivos
    if (isNaN(payload.cupos) || payload.cupos < 0) {
      payload.cupos = Math.max(0, Number(payload.cupos) || 0);
      this.materiaForm.controls['cupos'].setValue(payload.cupos);
    }

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
