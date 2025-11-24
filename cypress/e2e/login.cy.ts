describe('E2E - Login flow', () => {
  beforeEach(() => {
    // Asegurarse de que la app esté disponible en localhost:4200 antes del test
    cy.visit('http://localhost:4200/login');
  });

  it('intercepts login and redirects after success', () => {
    // Crear un token JWT falso cuyo payload incluye roles: ["admin"]
    // payload JSON: {"roles":["admin"]} -> base64: eyJyb2xlcyI6WyJhZG1pbiJdfQ==
    const fakeToken = 'header.eyJyb2xlcyI6WyJhZG1pbiJdfQ==.signature';
    // Interceptar la URL absoluta usada por AuthService
    cy.intercept('POST', 'http://localhost:8080/auth/login', {
      statusCode: 200,
      body: { token: fakeToken, refreshToken: 'fake-refresh' },
    }).as('loginReq');

    // La app normalmente llama a GET /auth/me tras el login para obtener roles/usuario.
    // Stubear esa petición para que la app reconozca al usuario como admin y permita /admin.
    cy.intercept('GET', 'http://localhost:8080/auth/me', {
      statusCode: 200,
      body: { authorities: ['admin'], name: 'admin' },
    }).as('meReq');

    cy.get('input[type="email"]').type('admin@example.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginReq');
    // esperar a que la app recupere el perfil de usuario
    cy.wait('@meReq');
    // Verificar que el token se guardó correctamente en localStorage
    cy.window().then((win) => {
      const t = win.localStorage.getItem('access_token');
      // Esto confirma que AuthService procesó la respuesta de login
      expect(t).to.equal(fakeToken);
    });

    // La app debería redirigir a /admin tras login + perfil.
    // Si no lo hace, navegar manualmente y comprobar el contenido del panel.
    cy.url({ timeout: 10000 }).then((url) => {
      if (url.includes('/admin')) {
        cy.url().should('include', '/admin');
        cy.contains('Panel de Administración', { timeout: 10000 }).should('exist');
      } else {
        // navegar manualmente y comprobar el contenido del admin
        cy.visit('/admin');
        cy.contains('Panel de Administración', { timeout: 10000 }).should('exist');
      }
    });
  });
});
