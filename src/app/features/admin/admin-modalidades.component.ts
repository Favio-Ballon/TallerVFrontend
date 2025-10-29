import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AdminService, Gestion, Modalidad } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-modalidades',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-modalidades.component.html',
  styleUrls: ['./admin-modalidades.component.css'],
})
export class AdminModalidadesComponent implements OnInit {
  gestiones: Gestion[] = [];
  modalidadForm: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.modalidadForm = this.fb.group({
      nombre: ['', [Validators.required]],
      faltasPermitidas: [0, [Validators.required, Validators.min(0)]],
      gestionId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadGestiones();
  }

  loadGestiones() {
    this.adminService.getGestiones().subscribe({
      next: (gestiones) => {
        this.gestiones = gestiones;
      },
      error: (err) => console.error('Error cargando gestiones:', err),
    });
  }

  selectEdit(mod: Modalidad) {
    // populate form for editing
    this.editingId = mod.id ?? null;
    this.modalidadForm.patchValue({
      nombre: mod.nombre,
      faltasPermitidas: mod.faltasPermitidas,
      gestionId: mod.gestion ? mod.gestion.id : mod.gestionId,
    });
  }

  clearForm() {
    this.editingId = null;
    this.modalidadForm.reset();
  }

  save() {
    if (this.modalidadForm.invalid) {
      Object.values(this.modalidadForm.controls).forEach((c) => c.markAsTouched());
      return;
    }
    const payload = {
      nombre: this.modalidadForm.value.nombre,
      faltasPermitidas: Number(this.modalidadForm.value.faltasPermitidas),
      gestionId: Number(this.modalidadForm.value.gestionId),
    };

    this.loading = true;
    if (this.editingId) {
      this.adminService.updateModalidad(this.editingId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadGestiones();
          this.clearForm();
        },
        error: (e) => {
          console.error(e);
          this.loading = false;
        },
      });
    } else {
      this.adminService.createModalidad(payload).subscribe({
        next: () => {
          this.loading = false;
          this.loadGestiones();
          this.clearForm();
        },
        error: (e) => {
          console.error(e);
          this.loading = false;
        },
      });
    }
  }

  editById(id: number) {
    this.adminService.getModalidadById(id).subscribe({
      next: (m) => this.selectEdit(m),
      error: (e) => console.error('Error al obtener modalidad:', e),
    });
  }

  delete(id: number) {
    if (!confirm('¿Eliminar modalidad?')) return;
    this.adminService.deleteModalidad(id).subscribe({
      next: () => this.loadGestiones(),
      error: (e) => console.error('Error al eliminar modalidad:', e),
    });
  }
}
