import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  telefono: string;
  // el backend puede retornar distintos valores o null, así que lo dejamos flexible
  rol?: string | null;
  codigo?: string;
}

export interface Gestion {
  id?: number;
  ano: string;
  semestres?: Semestre[];
  modalidades?: Modalidad[];
}

export interface Modalidad {
  id?: number;
  nombre: string;
  faltasPermitidas: number;
  gestionId?: number;
  gestion?: Gestion;
}

export interface Semestre {
  id?: number;
  nombre: string;
  gestionId: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface Docente {
  id?: number;
  nombre: string;
  apellido: string;
}

export interface Materia {
  id?: number;
  nombre: string;
  cupos: number;
  estado: string;
  semestreId?: number;
  docenteId?: number;
  semestre?: Semestre;
  docente?: Docente;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiBase = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Usuario
  createUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiBase}/auth/register`, usuario);
  }

  getUsuarios(filter?: { rol?: string }): Observable<Usuario[]> {
    const body = filter ? filter : {};
    return this.http.post<Usuario[]>(`${this.apiBase}/auth/usuarios`, body);
  }

  // Gestion
  createGestion(gestion: Gestion): Observable<any> {
    return this.http.post(`${this.apiBase}/gestion/`, gestion);
  }

  getGestiones(): Observable<Gestion[]> {
    return this.http.get<Gestion[]>(`${this.apiBase}/gestion/`);
  }

  // Semestre
  createSemestre(semestre: Semestre): Observable<any> {
    return this.http.post(`${this.apiBase}/semestre/`, semestre);
  }

  getSemestres(): Observable<Semestre[]> {
    return this.http.get<Semestre[]>(`${this.apiBase}/semestre/`);
  }

  // Modalidad
  /** Obtener modalidad por id */
  getModalidadById(id: number): Observable<Modalidad> {
    return this.http.get<Modalidad>(`${this.apiBase}/modalidad/${id}`);
  }

  /** Crear modalidad (asumo POST /modalidad/) */
  createModalidad(mod: Partial<Modalidad>): Observable<any> {
    return this.http.post(`${this.apiBase}/modalidad/`, mod);
  }

  /** Actualizar modalidad por id */
  updateModalidad(id: number, mod: Partial<Modalidad>): Observable<any> {
    return this.http.put(`${this.apiBase}/modalidad/${id}`, mod);
  }

  /** Eliminar modalidad por id */
  deleteModalidad(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/modalidad/${id}`);
  }

  // Materia
  getMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.apiBase}/materia/`);
  }

  createMateria(m: Partial<Materia>): Observable<any> {
    return this.http.post(`${this.apiBase}/materia/`, m);
  }

  updateMateria(id: number, m: Partial<Materia>): Observable<any> {
    return this.http.put(`${this.apiBase}/materia/${id}`, m);
  }

  deleteMateria(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/materia/${id}`);
  }
}
