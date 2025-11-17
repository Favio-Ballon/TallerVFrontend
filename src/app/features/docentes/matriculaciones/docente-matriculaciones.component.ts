import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DocenteService, Matriculacion } from '../../../core/services/docente.service';
import { SemestreMateria, Usuario } from '../../../core/services/admin.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../shared/toast/toast.service';

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
  enrolled: Matriculacion[] = [];
  selectedCourseId: number | null = null;

  // search/filter for alumnos
  alumnoQuery: string = '';
  filteredAlumnos: Usuario[] = [];
  // keyboard navigation state for alumno suggestions
  selectedAlumnoIndex: number = -1;

  @ViewChild('alumnoWrapper', { static: false }) alumnoWrapper!: ElementRef;

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

  filterAlumnos() {
    const q = (this.alumnoQuery || '').trim().toLowerCase();
    if (!q) {
      // show first few as suggestion
      this.filteredAlumnos = this.alumnos ? this.alumnos.slice(0, 10) : [];
      this.selectedAlumnoIndex = -1;
      return;
    }
    this.filteredAlumnos = this.alumnos.filter((a) => {
      const full = `${a.nombre} ${a.apellido}`.toLowerCase();
      return full.includes(q);
    });
    this.selectedAlumnoIndex = -1;
  }

  selectAlumno(a: Usuario) {
    if (!a) return;
    // set reactive form control to the alumno id
    this.form.patchValue({ alumnoId: a.id });
    // set the visible query to the chosen name and clear suggestions
    this.alumnoQuery = `${a.nombre} ${a.apellido}`;
    this.filteredAlumnos = [];
    this.selectedAlumnoIndex = -1;
  }

  onAlumnoKeydown(ev: KeyboardEvent) {
    if (!this.filteredAlumnos || this.filteredAlumnos.length === 0) return;
    const max = this.filteredAlumnos.length - 1;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (this.selectedAlumnoIndex < max) this.selectedAlumnoIndex++;
      else this.selectedAlumnoIndex = 0;
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (this.selectedAlumnoIndex > 0) this.selectedAlumnoIndex--;
      else this.selectedAlumnoIndex = max;
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (this.selectedAlumnoIndex >= 0 && this.selectedAlumnoIndex <= max) {
        const a = this.filteredAlumnos[this.selectedAlumnoIndex];
        this.selectAlumno(a);
      }
    } else if (ev.key === 'Escape') {
      this.filteredAlumnos = [];
      this.selectedAlumnoIndex = -1;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!this.alumnoWrapper) return;
    if (!this.alumnoWrapper.nativeElement.contains(target)) {
      this.filteredAlumnos = [];
      this.selectedAlumnoIndex = -1;
    }
  }

  onSemestreMateriaChange(val: any) {
    const id = Number(val);
    if (id) this.loadEnrolled(id);
    else this.enrolled = [];
  }

  onCourseSelect(val: any) {
    const id = Number(val);
    this.selectedCourseId = id || null;
    if (id) this.loadEnrolled(id);
    else this.enrolled = [];
  }

  loadEnrolled(semestreMateriaId: number) {
    this.docente.getMatriculacionesBySemestreMateria(semestreMateriaId).subscribe({
      next: (r) => (this.enrolled = r),
      error: (e) => {
        console.error('Error cargando matriculaciones por curso', e);
        this.toast.error('Error al cargar estudiantes inscriptos');
      },
    });
  }

  loadAll() {
    this.docente
      .getMatriculaciones()
      .subscribe({ next: (r) => (this.lista = r), error: (e) => console.error(e) });
    this.docente.getUsuarios({ rol: 'estudiante' }).subscribe({
      next: (a) => {
        this.alumnos = a;
        this.filteredAlumnos = a ? a.slice(0, 10) : [];
      },
      error: (e) => console.error(e),
    });
    this.docente.getSemestreMaterias().subscribe({
      next: (s) => {
        this.semestreMaterias = s;
        if (!s || s.length === 0) {
          this.toast.success('No hay materias disponibles para inscribir');
          this.adminService.getMaterias().subscribe({
            next: (m) => {
              if (m && m.length > 0) {
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
        // refresh lists and enrolled students for the currently selected course
        this.loadAll();
        if (this.selectedCourseId) this.loadEnrolled(this.selectedCourseId);
        // clear alumno query and suggestions so UI resets
        this.alumnoQuery = '';
        this.filteredAlumnos = this.alumnos ? this.alumnos.slice(0, 10) : [];
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
        if (this.selectedCourseId) this.loadEnrolled(this.selectedCourseId);
      },
      error: (e) => {
        console.error(e);
        this.toast.error('Error al eliminar matriculación');
      },
    });
  }
}
