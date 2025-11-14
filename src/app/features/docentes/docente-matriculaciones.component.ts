import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DocenteService, Matriculacion } from '../../core/services/docente.service';
import { SemestreMateria, Usuario, Materia } from '../../core/services/admin.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-docente-matriculaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './docente-matriculaciones.component.html',
  styleUrls: ['./docente-matriculaciones.component.css'],
})
export class DocenteMatriculacionesComponent implements OnInit {
  lista: Matriculacion[] = [];
  alumnos: Usuario[] = [];
  semestreMaterias: SemestreMateria[] = [];

  form: FormGroup;
  loading = false;

  constructor(
    private docente: DocenteService,
    private adminService: AdminService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      alumnoId: ['', [Validators.required]],
      semestreMateriaId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.docente
      .getMatriculaciones()
      .subscribe({ next: (r) => (this.lista = r), error: (e) => console.error(e) });
    this.docente
      .getUsuarios({ rol: 'estudiante' })
      .subscribe({ next: (a) => (this.alumnos = a), error: (e) => console.error(e) });
    this.docente.getSemestreMaterias().subscribe({
      next: (s) => {
        this.semestreMaterias = s;
        console.log('debug: semestreMaterias loaded', s);
        if (!s || s.length === 0) {
          this.toast.success('No hay materias disponibles para inscribir');
          // fallback: cargar materias simples si el backend no devuelve semestre-materias
          this.adminService.getMaterias().subscribe({
            next: (m) => {
              if (m && m.length > 0) {
                // map Materia -> SemestreMateria minimal para permitir selección
                this.semestreMaterias = m.map(
                  (mat) =>
                    ({
                      id: undefined,
                      materia: mat,
                      semestre: {
                        id: 0,
                        nombre: 'N/A',
                        gestionId: 0,
                        fechaInicio: '',
                        fechaFin: '',
                      },
                      docente: { id: undefined, nombre: 'N/A', apellido: '' },
                      modalidad: { id: undefined, nombre: 'N/A', faltasPermitidas: 0 },
                      cupos: mat.cupos,
                      estaActivo: true,
                    } as SemestreMateria)
                );
                this.toast.success('Usando listado de materias como fallback');
              }
            },
            error: (err) => console.error('Error cargando materias fallback', err),
          });
        }
      },
      error: (e) => {
        console.error('Error cargando semestre-materias', e);
        this.toast.error('Error al cargar materias para inscribir');
      },
    });
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
    this.docente.createMatriculacion(payload).subscribe({
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
    this.docente.deleteMatriculacion(id).subscribe({
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
