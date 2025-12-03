/**
 * Pruebas unitarias para `AdminService`.
 * Explicación:
 * - Se usa `HttpClientTestingModule` para interceptar peticiones HTTP y verificar URLs/métodos.
 * - `AdminService` se instancia directamente con el `HttpClient` inyectado por TestBed.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { AdminService, Materia } from '../../../../app/core/services/admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    const http = TestBed.inject(HttpClient);
    service = new AdminService(http as any);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getMaterias should GET /materia/', () => {
    const mock: Materia[] = [
      {
        id: 1,
        nombre: 'Matematica',
        cupos: 20,
        estado: 'activo',
      } as Materia,
    ];

    // Se suscribe al observable para comprobar que devuelve la lista esperada
    service.getMaterias().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne('http://localhost:8080/materia/');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
