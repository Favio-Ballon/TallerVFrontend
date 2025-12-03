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

  /** Obtener matriculaciones del alumno actual (endpoint expuesto por el backend) */
  getMatriculacionesByAlumno(): Observable<Matriculacion[]> {
    return this.http.get<Matriculacion[]>(`${this.apiBase}/matriculacion/alumno`);
  }

  /** Obtener matriculaciones por semestre-materia (alumnos inscriptos en un curso) */
  getMatriculacionesBySemestreMateria(semestreMateriaId: number): Observable<Matriculacion[]> {
    return this.http.get<Matriculacion[]>(
      `${this.apiBase}/matriculacion/semestre-materia/${semestreMateriaId}`
    );
  }

  // Semestre-Materia
  getSemestreMaterias(): Observable<SemestreMateria[]> {
    return this.http.get<SemestreMateria[]>(`${this.apiBase}/semestre-materia/docente/materias`);
  }

  // Usuarios filtered by rol (reuse auth/usuarios endpoint)
  getUsuarios(filter?: { rol?: string }): Observable<Usuario[]> {
    const body = filter ? filter : {};
    return this.http.post<Usuario[]>(`${this.apiBase}/auth/usuarios`, body);
  }

  /** Subir faltas para una matriculacion (nuevoValor puede ser el incremento o el valor a aplicar segun backend)
   *  Nota: usar PATCH según la API.
   */
  subirFaltas(matriculacionId: number, nuevoValor: number): Observable<string> {
    // The backend returns a plain text message (not JSON). Request the response as text
    // to avoid HttpClient JSON parsing errors.
    const url = `${this.apiBase}/matriculacion/subir-faltas/${matriculacionId}`;
    return this.http.patch<string>(url, { nuevoValor }, { responseType: 'text' as 'json' });
  }

  /** Consolidar matriculaciones para un alumno (backend: POST /matriculacion/consolidar-alumno/{alumnoId})
   *  Devuelve texto con el resultado.
   */
  consolidarAlumno(alumnoId: number): Observable<string> {
    const url = `${this.apiBase}/matriculacion/consolidar-alumno/${alumnoId}`;
    return this.http.post<string>(url, {}, { responseType: 'text' as 'json' });
  }

  /** Consolidar una matriculación usando su id (PATCH). Usa PATCH según contrato del backend. */
  consolidarMatriculacion(matriculacionId: number): Observable<string> {
    const url = `${this.apiBase}/matriculacion/consolidar-alumno/${matriculacionId}`;
    return this.http.patch<string>(url, {}, { responseType: 'text' as 'json' });
  }

  /** Consolidar todas las matriculaciones asociadas a un semestre-materia (PATCH).
   * Endpoint: PATCH /matriculacion/consolidar-todos/{semestreMateriaId}
   */
  consolidarTodosPorSemestreMateria(semestreMateriaId: number): Observable<string> {
    const url = `${this.apiBase}/matriculacion/consolidar-todos/${semestreMateriaId}`;
    return this.http.patch<string>(url, {}, { responseType: 'text' as 'json' });
  }

  /** Obtener notas por matriculacion */
  getNotasByMatriculacion(matriculacionId: number): Observable<
    {
      id: number;
      evaluacion: string;
      ponderacion: number;
      calificacion: number;
    }[]
  > {
    return this.http.get<
      {
        id: number;
        evaluacion: string;
        ponderacion: number;
        calificacion: number;
      }[]
    >(`${this.apiBase}/nota/matriculacion/${matriculacionId}`);
  }

  /** Subir calificacion para una nota (PATCH) - backend devuelve texto */
  subirCalificacion(notaId: number, nuevoValor: number): Observable<string> {
    const url = `${this.apiBase}/nota/${notaId}/subir-calificacion`;
    return this.http.patch<string>(url, { nuevoValor }, { responseType: 'text' as 'json' });
  }
}
