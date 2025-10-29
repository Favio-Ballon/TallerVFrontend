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
}

export interface Semestre {
  id?: number;
  nombre: string;
  gestionId: number;
  fechaInicio: string;
  fechaFin: string;
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
}
