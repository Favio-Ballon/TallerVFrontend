import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocenteService } from '../../../core/services/docente.service';
import { SemestreMateria } from '../../../core/services/admin.service';
import { Matriculacion } from '../../../core/services/docente.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-docente-faltas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docente-faltas.component.html',
  styleUrls: ['./docente-faltas.component.css'],
})
export class DocenteFaltasComponent implements OnInit {
  semestreMaterias: SemestreMateria[] = [];
  faltasList: Matriculacion[] = [];
  selectedFaltasCourseId: number | null = null;

  // per-row state
  faltasToUpload: { [id: number]: number } = {};
  uploadingFalta: { [id: number]: boolean } = {};

  constructor(private docente: DocenteService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadSemestreMaterias();
  }

  loadSemestreMaterias() {
    this.docente.getSemestreMaterias().subscribe({
      next: (s) => (this.semestreMaterias = s),
      error: (e) => {
        console.error('Error cargando semestre-materias', e);
        this.toast.error('Error al cargar cursos');
      },
    });
  }

  onFaltasCourseSelect(val: any) {
    const id = Number(val);
    this.selectedFaltasCourseId = id || null;
    if (id) this.loadFaltas(id);
    else this.faltasList = [];
  }

  loadFaltas(semestreMateriaId: number) {
    this.docente.getMatriculacionesBySemestreMateria(semestreMateriaId).subscribe({
      next: (r) => (this.faltasList = r),
      error: (e) => {
        console.error('Error cargando matriculaciones para faltas', e);
        this.toast.error('Error al cargar estudiantes para gestionar faltas');
      },
    });
  }

  subirFaltas(matriculacionId: number) {
    const nuevo = Number(this.faltasToUpload[matriculacionId]) || 1;
    this.uploadingFalta[matriculacionId] = true;
    this.docente.subirFaltas(matriculacionId, nuevo).subscribe({
      next: () => {
        this.toast.success('Faltas actualizadas');
        if (this.selectedFaltasCourseId) this.loadFaltas(this.selectedFaltasCourseId);
        this.faltasToUpload[matriculacionId] = 0;
        this.uploadingFalta[matriculacionId] = false;
      },
      error: (e) => {
        console.error('Error subiendo faltas', e);
        this.toast.error('Error al actualizar faltas');
        this.uploadingFalta[matriculacionId] = false;
      },
    });
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('¿Eliminar matriculación?')) return;
    this.docente.deleteMatriculacion(id).subscribe({
      next: () => {
        this.toast.success('Matriculación eliminada');
        if (this.selectedFaltasCourseId) this.loadFaltas(this.selectedFaltasCourseId);
      },
      error: (e) => {
        console.error(e);
        this.toast.error('Error al eliminar matriculación');
      },
    });
  }
}
