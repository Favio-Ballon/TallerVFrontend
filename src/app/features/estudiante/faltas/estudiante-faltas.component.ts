import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteService, Matriculacion } from '../../../core/services/docente.service';

@Component({
  selector: 'app-estudiante-faltas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiante-faltas.component.html',
  styleUrls: ['./estudiante-faltas.component.css'],
})
export class EstudianteFaltasComponent implements OnInit {
  matriculaciones: Matriculacion[] = [];
  loading = false;

  constructor(private docente: DocenteService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.docente.getMatriculacionesByAlumno().subscribe({
      next: (r) => {
        this.matriculaciones = r || [];
        this.loading = false;
      },
      error: (e) => {
        console.error('Error cargando matriculaciones', e);
        this.loading = false;
      },
    });
  }
}
