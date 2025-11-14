import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AdminService, Evaluacion } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-evaluaciones.component.html',
  styleUrls: ['./admin-evaluaciones.component.css'],
})
export class AdminEvaluacionesComponent implements OnInit {
  evaluaciones: Evaluacion[] = [];
  evalForm: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.evalForm = this.fb.group({
      nombre: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.adminService.getEvaluaciones().subscribe({
      next: (r) => (this.evaluaciones = r),
      error: (e) => console.error('Error cargar evaluaciones', e),
    });
  }

  edit(ev: Evaluacion) {
    this.editingId = ev.id ?? null;
    this.evalForm.patchValue({ nombre: ev.nombre });
  }

  clear() {
    this.editingId = null;
    this.evalForm.reset();
  }

  save() {
    if (this.evalForm.invalid) {
      Object.values(this.evalForm.controls).forEach((c) => c.markAsTouched());
      return;
    }
    const payload = { nombre: this.evalForm.value.nombre };
    this.loading = true;
    if (this.editingId) {
      this.adminService.updateEvaluacion(this.editingId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadAll();
          this.clear();
        },
        error: (e) => {
          console.error(e);
          this.loading = false;
        },
      });
    } else {
      this.adminService.createEvaluacion(payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadAll();
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
    if (!confirm('¿Eliminar evaluación?')) return;
    this.adminService.deleteEvaluacion(id).subscribe({
      next: () => this.loadAll(),
      error: (e) => console.error('Error al eliminar', e),
    });
  }
}
