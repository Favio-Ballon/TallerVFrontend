/// <reference types="cypress" />

import { AuthService } from '../../src/app/core/auth/auth.service';
import { of } from 'rxjs';

describe('AuthService', () => {

  let httpMock: any;
  let routerMock: any;
  let service: AuthService;

  beforeEach(() => {
    httpMock = { post: cy.stub().returns(of({ token: 'AAA', refreshToken: 'BBB' })), get: cy.stub() };
    routerMock = { navigate: cy.stub() };

    service = new AuthService(httpMock as any, routerMock as any);

    localStorage.clear();
  });

  it('debe guardar access y refresh token al hacer login', () => {
    service['setTokens']('ABC', 'XYZ');  // método real

    expect(localStorage.getItem('access_token')).to.equal('ABC');
    expect(localStorage.getItem('refresh_token')).to.equal('XYZ');
  });

  it('debe limpiar tokens al hacer logout', () => {
    localStorage.setItem('access_token', '123');
    localStorage.setItem('refresh_token', '456');

    service.logout();

    expect(localStorage.getItem('access_token')).to.be.null;
    expect(localStorage.getItem('refresh_token')).to.be.null;
    expect(routerMock.navigate).to.have.been.calledWith(['/login']);
  });

  it('debe retornar correctamente el access token', () => {
    localStorage.setItem('access_token', 'TOKEN123');
    expect(service.getAccessToken()).to.equal('TOKEN123');
  });
});
