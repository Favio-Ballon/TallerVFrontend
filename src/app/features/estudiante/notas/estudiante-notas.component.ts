import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteService, Matriculacion } from '../../../core/services/docente.service';

@Component({
  selector: 'app-estudiante-notas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-notas.component.html',
  styleUrls: ['./estudiante-notas.component.css'],
})
export class EstudianteNotasComponent implements OnInit {
  matriculaciones: Matriculacion[] = [];
  loading = false;
  selectedNotas: {
    id: number;
    notas: { id: number; evaluacion: string; ponderacion: number; calificacion: number }[];
  } | null = null;

  constructor(private docente: DocenteService) {}

  ngOnInit(): void {
    this.loadMatriculaciones();
  }

  loadMatriculaciones() {
    this.loading = true;
    this.docente.getMatriculacionesByAlumno().subscribe({
      next: (r) => {
        this.matriculaciones = r || [];
        this.loading = false;
      },
      error: (e) => {
        console.error('Error cargando matriculaciones del alumno', e);
        this.loading = false;
      },
    });
  }

  showNotas(matriculacionId?: number) {
    if (!matriculacionId) return;
    this.docente.getNotasByMatriculacion(matriculacionId).subscribe({
      next: (n) => (this.selectedNotas = { id: matriculacionId, notas: n }),
      error: (e) => console.error('Error cargando notas', e),
    });
  }

  closeNotas() {
    this.selectedNotas = null;
  }
}
