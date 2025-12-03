/**
 * Pruebas unitarias para `AuthService`.
 * Explicación general:
 * - Se usa `HttpClientTestingModule` para interceptar llamadas HTTP y verificar rutas y métodos.
 * - Se incluye `RouterTestingModule` para proporcionar un `Router` falso durante las pruebas.
 * - En algunos entornos ESM/TestBed la fábrica de DI puede ser problemática; por eso se instancia
 *   el servicio manualmente con las dependencias inyectadas por TestBed.
 */
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../../app/core/auth/auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockLoginResponse = {
    token: 'fake-jwt-token',
    refreshToken: 'fake-refresh',
  };

  const mockUser = {
    id: 1,
    nombre: 'Flavia',
    apellido: 'Nogales',
    email: 'docente1@mail.com',
    rol: 'Docente',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });

    const http = TestBed.inject(HttpClient);
    const router = TestBed.inject(Router);
    // Instantiate service manually to avoid DI factory issues under Jest ESM
    service = new AuthService(http, router);
    httpMock = TestBed.inject(HttpTestingController);

    // Limpia localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería hacer login() y guardar token en localStorage', () => {
    const email = 'docente1@mail.com';
    const password = '123456';

    // Llamamos a login() y suscribimos para comprobar el comportamiento asíncrono
    service.login(email, password).subscribe((resp) => {
      // se espera que el mock de la respuesta devuelva el token y que el servicio lo guarde
      expect(resp.token).toBe('fake-jwt-token');
      expect(localStorage.getItem('access_token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('refresh_token')).toBe('fake-refresh');
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/login');
    expect(req.request.method).toBe('POST');

    req.flush(mockLoginResponse);
  });

  it('debería refrescar el token en refreshToken()', () => {
    localStorage.setItem('refresh_token', 'fake-refresh-old');

    service.refreshToken().subscribe((resp) => {
      expect(resp.token).toBe('fake-jwt-token');
      expect(localStorage.getItem('access_token')).toBe('fake-jwt-token');
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/refresh');
    expect(req.request.method).toBe('POST');

    req.flush(mockLoginResponse);
  });

  it('debería obtener datos del usuario con me()', () => {
    service.me().subscribe((resp) => {
      expect(resp.authorities).toBeDefined();
    });

    const req = httpMock.expectOne('http://localhost:8080/auth/me');
    expect(req.request.method).toBe('GET');

    req.flush(mockUser);
  });

  it('debería limpiar localStorage al llamar logout()', () => {
    localStorage.setItem('access_token', 'test');
    localStorage.setItem('refresh_token', 'test2');

    service.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
