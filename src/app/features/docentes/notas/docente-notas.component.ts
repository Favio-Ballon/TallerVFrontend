import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../core/services/docente.service';
import { Matriculacion } from '../../../core/services/docente.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { SemestreMateria } from '../../../core/services/admin.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-docente-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-notas.component.html',
  styleUrls: ['./docente-notas.component.css'],
})
export class DocenteNotasComponent implements OnInit {
  matriculaciones: Matriculacion[] = [];
  selectedMatriculacionId: number | null = null;
  notas: { id: number; evaluacion: string; ponderacion: number; calificacion: number }[] = [];
  semestreMaterias: SemestreMateria[] = [];
  selectedCourseId: number | null = null;
  evaluaciones: string[] = [];
  selectedEvaluacion: string | null = null;
  displayedRows: {
    matriculacionId: number;
    notaId: number;
    alumnoNombre: string;
    evaluacion: string;
    ponderacion: number;
    calificacion: number;
  }[] = [];

  // flattened rows for course: one row per (matriculacion, nota)
  notaRows: {
    matriculacionId: number;
    notaId: number;
    alumnoNombre: string;
    evaluacion: string;
    ponderacion: number;
    calificacion: number;
  }[] = [];

  // per-row state
  notaToUpload: { [id: number]: number } = {};
  uploadingNota: { [id: number]: boolean } = {};

  constructor(private docente: DocenteService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadMatriculaciones();
    this.loadSemestreMaterias();
  }

  loadMatriculaciones() {
    this.docente
      .getMatriculaciones()
      .subscribe({ next: (r) => (this.matriculaciones = r), error: (e) => console.error(e) });
  }

  onMatriculacionSelect(val: any) {
    const id = Number(val);
    this.selectedMatriculacionId = id || null;
    if (id) this.loadNotas(id);
    else this.notas = [];
  }

  onCourseSelect(val: any) {
    const id = Number(val);
    this.selectedCourseId = id || null;
    if (id) this.loadNotasForCourse(id);
    else this.notaRows = [];
  }

  onEvaluacionSelect(val: any) {
    const ev = val ? String(val) : null;
    this.selectedEvaluacion = ev;
    if (!ev) {
      this.displayedRows = [...this.notaRows];
      return;
    }
    this.displayedRows = this.notaRows.filter((r) => r.evaluacion === ev);
  }

  loadSemestreMaterias() {
    this.docente.getSemestreMaterias().subscribe({
      next: (s) => (this.semestreMaterias = s),
      error: (e) => {
        console.error('Error cargando cursos', e);
        this.toast.error('Error al cargar cursos');
      },
    });
  }

  // Load all matriculaciones for a course and then fetch their notas in parallel
  loadNotasForCourse(semestreMateriaId: number) {
    this.docente.getMatriculacionesBySemestreMateria(semestreMateriaId).subscribe({
      next: (matrics) => {
        this.matriculaciones = matrics;
        if (!matrics || matrics.length === 0) {
          this.notaRows = [];
          return;
        }

        const calls = matrics.map((m) => this.docente.getNotasByMatriculacion(m.id!));
        forkJoin(calls).subscribe({
          next: (allNotasArray) => {
            // build flattened rows
            const rows: any[] = [];
            for (let i = 0; i < matrics.length; i++) {
              const m = matrics[i];
              const notas = allNotasArray[i] || [];
              notas.forEach((n) => {
                rows.push({
                  matriculacionId: m.id!,
                  notaId: n.id,
                  alumnoNombre: `${m.alumno.nombre} ${m.alumno.apellido}`,
                  evaluacion: n.evaluacion,
                  ponderacion: n.ponderacion,
                  calificacion: n.calificacion,
                });
              });
            }
            this.notaRows = rows;
            // compute available evaluaciones and initialize displayedRows
            this.evaluaciones = Array.from(new Set(rows.map((r) => r.evaluacion)));
            this.selectedEvaluacion = null;
            this.displayedRows = [...this.notaRows];
          },
          error: (e) => {
            console.error('Error cargando notas por curso', e);
            this.toast.error('Error al cargar notas para el curso');
          },
        });
      },
      error: (e) => {
        console.error('Error cargando matriculaciones por curso', e);
        this.toast.error('Error al cargar estudiantes del curso');
      },
    });
  }

  loadNotas(matriculacionId: number) {
    this.docente.getNotasByMatriculacion(matriculacionId).subscribe({
      next: (r) => (this.notas = r),
      error: (e) => {
        console.error('Error cargando notas', e);
        this.toast.error('Error al cargar notas');
      },
    });
  }

  subirCalificacion(notaId: number) {
    const nuevo = Number(this.notaToUpload[notaId]);
    if (isNaN(nuevo)) {
      this.toast.error('Ingrese un valor válido');
      return;
    }
    this.uploadingNota[notaId] = true;
    this.docente.subirCalificacion(notaId, nuevo).subscribe({
      next: (res) => {
        // res es texto devuelto por backend
        this.toast.success(res);
        // refresh depending on current view: if we are viewing a single matriculacion, refresh it,
        // otherwise if viewing a course, refresh the whole course notes
        if (this.selectedMatriculacionId) this.loadNotas(this.selectedMatriculacionId);
        if (this.selectedCourseId) this.loadNotasForCourse(this.selectedCourseId);
        this.notaToUpload[notaId] = 0;
        this.uploadingNota[notaId] = false;
      },
      error: (e) => {
        console.error('Error subiendo calificación', e);
        const text = e?.error?.text || 'Error al subir calificación';
        this.toast.error(text);
        this.uploadingNota[notaId] = false;
      },
    });
  }
}
