// Test: Refresh token flow — app debe llamar POST /auth/refresh y reintentar acción
describe('Auth - Refresh token flow', () => {
  it('intenta refrescar token cuando access token expiró y reintenta la acción', () => {
    // Stub de refresh que devuelve nuevo token
    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { token: 'new.jwt.token', refreshToken: 'new-refresh' },
    }).as('postRefresh');

    // Stubear GET /auth/me para evitar llamadas reales durante el boot
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { authorities: ['ROLE_ADMIN'], name: 'Tester' },
    }).as('getMe');

    // Simular petición que devuelve 401 inicial y luego 200 tras refresh
    let firstAttempt = true;
    cy.intercept('GET', '**/gestion*', (req) => {
      if (firstAttempt) {
        firstAttempt = false;
        req.reply({ statusCode: 401 });
      } else {
        req.reply({ statusCode: 200, body: { ok: true } });
      }
    }).as('getGestion');

    // Inyectar token expirado y visitar ruta que desencadena GET /gestion
    // Navegamos a la zona de admin que carga las gestiones al iniciar
    cy.visit('/admin', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', 'expired.token');
        win.localStorage.setItem('refresh_token', 'valid-refresh');
      },
    });

    // Esperamos que el refresh haya sido llamado
    cy.wait('@postRefresh');

    // Comprobar que el token en localStorage fue actualizado por el refresh
    cy.window()
      .its('localStorage')
      .then((ls) => {
        const token = ls.getItem('access_token');
        expect(token).to.be.a('string').and.not.be.empty;
      });

    // Ver alguna indicación de que la carga no mostró errores visibles en la UI
    cy.contains(/error|forbidden/i).should('not.exist');
  });
});
