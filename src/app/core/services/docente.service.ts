import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, Docente, Materia, Semestre, SemestreMateria } from './admin.service';

export interface Matriculacion {
  id?: number;
  alumno: Usuario;
  docente: Docente;
  materia: Materia;
  faltas: number;
  estaAprobado: boolean;
  notaFinal: number;
  estaConsolidado: boolean;
  semestreMateriaId?: number;
}

@Injectable({ providedIn: 'root' })
export class DocenteService {
  private apiBase = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  createMatriculacion(payload: {
    alumnoId: number;
    semestreMateriaId: number;
  }): Observable<Matriculacion> {
    return this.http.post<Matriculacion>(`${this.apiBase}/matriculacion/`, payload);
  }

  deleteMatriculacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/matriculacion/${id}`);
  }

  getMatriculacionById(id: number): Observable<Matriculacion> {
    return this.http.get<Matriculacion>(`${this.apiBase}/matriculacion/${id}`);
  }

  getMatriculaciones(): Observable<Matriculacion[]> {
    return this.http.get<Matriculacion[]>(`${this.apiBase}/matriculacion/`);
  }

  // Semestre-Materia (needed by docentes UI)
  getSemestreMaterias(): Observable<SemestreMateria[]> {
    return this.http.get<SemestreMateria[]>(`${this.apiBase}/semestre-materia/`);
  }

  // Usuarios filtered by rol (reuse auth/usuarios endpoint)
  getUsuarios(filter?: { rol?: string }): Observable<Usuario[]> {
    const body = filter ? filter : {};
    return this.http.post<Usuario[]>(`${this.apiBase}/auth/usuarios`, body);
  }
}
