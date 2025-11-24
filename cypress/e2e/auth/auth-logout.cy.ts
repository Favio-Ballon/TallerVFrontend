// Test: Logout limpia localStorage y redirige a login
describe('Auth - Logout', () => {
  it('limpia tokens y redirige a /login', () => {
    const fakeToken = 'fake.jwt.token';

    // En lugar de intentar forzar la UI desde el inicio, hacemos un login simulado
    // por la propia interfaz: stub POST /auth/login y GET /auth/me para que la app
    // realice el flujo normal y renderice la cabecera con el botón de logout.
    cy.intercept('POST', '**/auth/login', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          token: fakeToken,
          refreshToken: 'fake-refresh',
        },
      });
    }).as('postLogin');

    // El guard espera `authorities: string[]` en la respuesta de /auth/me
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: {
        authorities: ['ROLE_DOCENTE'],
        name: 'Docente Test',
      },
    }).as('getMe');

    // Evitar race con refresh: responder con OK si la app intenta refresh
    cy.intercept('POST', '**/auth/refresh', (req) => {
      req.reply({
        statusCode: 200,
        body: { token: 'refreshed.jwt', refreshToken: 'refreshed-refresh' },
      });
    }).as('postRefresh2');

    // Ir a la pantalla de login y rellenar el formulario (selectores robustos)
    cy.visit('/login');
    cy.get('input[formControlName="email"]', { timeout: 5000 }).type('docente@test.local');
    cy.get('input[formControlName="password"]').type('password{enter}');

    // Esperar la llamada de login
    cy.wait('@postLogin');

    // Construir un JWT simple con la claim de rol para que la app redirija correctamente.
    // Usamos Buffer (disponible en el runner) para generar base64 del payload.
    const headerB64 = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64');
    const payloadB64 = Buffer.from(JSON.stringify({ roles: ['ROLE_DOCENTE'] })).toString('base64');
    const goodJwt = `${headerB64}.${payloadB64}.sig`;

    // Asegurar tokens en localStorage (algunas apps no dependen de la respuesta para setearlos)
    cy.window().then((win) => {
      win.localStorage.setItem('access_token', goodJwt);
      win.localStorage.setItem('refresh_token', 'fake-refresh');
    });

    // Ir a la ruta de docentes para forzar render del header autenticado
    cy.visit('/docentes');

    // Ahora la cabecera debería mostrar el botón de logout; esperamos y hacemos click
    cy.get('button[title="Cerrar sesión"], button[aria-label="Cerrar sesión"]', { timeout: 15000 })
      .should('be.visible')
      .click({ force: true });

    // Tokens borrados
    cy.window()
      .its('localStorage')
      .then((ls) => {
        expect(ls.getItem('access_token')).to.be.null;
      });

    // Redirigido a login
    cy.url({ timeout: 5000 }).should('include', '/login');
  });
});
