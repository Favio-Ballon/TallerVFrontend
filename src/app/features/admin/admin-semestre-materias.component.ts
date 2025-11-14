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
  SemestreMateria,
  Semestre,
  Materia,
  Docente,
  Modalidad,
} from '../../core/services/admin.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-semestre-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-semestre-materias.component.html',
  styleUrls: ['./admin-semestre-materias.component.css'],
})
export class AdminSemestreMateriasComponent implements OnInit {
  lista: SemestreMateria[] = [];
  semestres: Semestre[] = [];
  materias: Materia[] = [];
  docentes: Docente[] = [];
  modalidades: Modalidad[] = [];

  form: FormGroup;
  loading = false;
  editingId: number | null = null;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      materiaId: ['', [Validators.required]],
      semestreId: ['', [Validators.required]],
      docenteId: ['', [Validators.required]],
      modalidadId: ['', [Validators.required]],
      cupos: [0, [Validators.required, Validators.min(0)]],
      estaActivo: [true],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.adminService.getSemestreMaterias().subscribe({
      next: (r) => (this.lista = r),
      error: (e) => console.error('Error cargar semestre-materias', e),
    });

    this.adminService.getSemestres().subscribe({ next: (s) => (this.semestres = s) });
    this.adminService.getMaterias().subscribe({ next: (m) => (this.materias = m) });
    this.adminService.getModalidades().subscribe({ next: (md) => (this.modalidades = md) });
    // docentes via usuarios rol docente
    this.adminService.getUsuarios({ rol: 'docente' }).subscribe({
      next: (u) =>
        (this.docentes = u.map(
          (x) => ({ id: x.id, nombre: x.nombre, apellido: x.apellido } as Docente)
        )),
      error: (e) => console.error('Error cargar docentes', e),
    });
  }

  edit(item: SemestreMateria) {
    this.editingId = item.id ?? null;
    this.form.patchValue({
      materiaId: item.materia.id,
      semestreId: item.semestre.id,
      docenteId: item.docente.id,
      modalidadId: item.modalidad.id,
      cupos: item.cupos,
      estaActivo: item.estaActivo,
    });
  }

  clear() {
    this.editingId = null;
    this.form.reset({ estaActivo: true, cupos: 0 });
  }

  save() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => c.markAsTouched());
      return;
    }
    const payload = {
      materiaId: Number(this.form.value.materiaId),
      semestreId: Number(this.form.value.semestreId),
      docenteId: Number(this.form.value.docenteId),
      modalidadId: Number(this.form.value.modalidadId),
      cupos: Number(this.form.value.cupos),
      estaActivo: Boolean(this.form.value.estaActivo),
    };

    this.loading = true;
    if (this.editingId) {
      this.adminService.updateSemestreMateria(this.editingId, payload).subscribe({
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
      this.adminService.createSemestreMateria(payload).subscribe({
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
    if (!confirm('¿Eliminar asignación materia-semestre?')) return;
    this.adminService
      .deleteSemestreMateria(id)
      .subscribe({ next: () => this.loadAll(), error: (e) => console.error(e) });
  }

  cerrar(id?: number) {
    if (!id) return;
    if (!confirm('¿Cerrar esta semestre-materia?')) return;
    this.adminService.cerrarSemestreMateria(id).subscribe({
      next: (resp) => {
        const message = typeof resp === 'string' ? resp : 'Semestre-materia cerrada correctamente';
        this.toast.success(message);
        this.loadAll();
      },
      error: (e) => {
        console.error(e);
        const serverText = e?.error ?? e?.message ?? JSON.stringify(e);
        const msg =
          typeof serverText === 'string' ? serverText : 'Error al cerrar semestre-materia';
        this.toast.error(msg);
      },
    });
  }

  /**
   * Normaliza distintos formatos que el backend pueda enviar para el flag de activo
   * Acepta boolean, 'true'/'false' strings y 1/0 numeric values.
   */
  isActive(item: SemestreMateria): boolean {
    const v: any = (item as any).estaActivo;
    return v === true || v === 'true' || v === 1 || v === '1';
  }
}
