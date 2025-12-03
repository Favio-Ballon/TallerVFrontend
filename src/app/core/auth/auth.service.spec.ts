import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockLoginResponse = {
    token: 'fake-jwt-token',
    refreshToken: 'fake-refresh'
  };

  const mockUser = {
    id: 1,
    nombre: 'Flavia',
    apellido: 'Nogales',
    email: 'docente1@mail.com',
    rol: 'Docente'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Limpia localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  // =============================================================
  // LOGIN
  // =============================================================

  it('debería hacer login() y guardar token en localStorage', () => {
    const email = 'docente1@mail.com';
    const password = '123456';

    service.login(email, password).subscribe(resp => {
      expect(resp.token).toBe('fake-jwt-token');
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('refreshToken')).toBe('fake-refresh');
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/login');
    expect(req.request.method).toBe('POST');

    req.flush(mockLoginResponse);
  });

  // =============================================================
  // REFRESH TOKEN
  // =============================================================

  it('debería refrescar el token en refreshToken()', () => {
    localStorage.setItem('refreshToken', 'fake-refresh-old');

    service.refreshToken().subscribe(resp => {
      expect(resp.token).toBe('fake-jwt-token');
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/refresh');
    expect(req.request.method).toBe('POST');

    req.flush(mockLoginResponse);
  });

  // =============================================================
  // ME()
  // =============================================================

  it('debería obtener datos del usuario con me()', () => {
    service.me().subscribe(resp => {
      expect(resp.email).toBe(mockUser.email);
      expect(resp.rol).toBe('Docente');
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/me');
    expect(req.request.method).toBe('GET');

    req.flush(mockUser);
  });

  // =============================================================
  // LOGOUT
  // =============================================================

  it('debería limpiar localStorage al llamar logout()', () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('refreshToken', 'test2');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
