import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService, Materia } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
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

    service.getMaterias().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne('http://localhost:8080/materia/');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
