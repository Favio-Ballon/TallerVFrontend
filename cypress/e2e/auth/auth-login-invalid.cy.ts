// Test: Login inválido muestra error
describe('Auth - Login inválido', () => {
  it('muestra mensaje de error con credenciales incorrectas', () => {
    // Stub de login para devolver 401
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Credenciales inválidas' },
    }).as('postLogin');

    cy.visit('/login');

    // Intentar enviar el formulario: rellenar campos comunes si existen
    cy.get('body').then(($body) => {
      if ($body.find('input[type="email"]').length) {
        cy.get('input[type="email"]').first().clear().type('noexiste@ejemplo.com', { force: true });
      }
      if ($body.find('input[type="password"]').length) {
        cy.get('input[type="password"]').first().clear().type('wrongpass', { force: true });
      }
      if ($body.find('button[type="submit"]').length) {
        cy.get('button[type="submit"]').first().click({ force: true });
      } else {
        // fallback: intentar enviar con Enter en el último input
        if ($body.find('input[type="password"]').length) {
          cy.get('input[type="password"]').first().type('{enter}', { force: true });
        }
      }
    });

    cy.wait('@postLogin');

    // Comprobar que aparece mensaje de error (toast o texto en pantalla)
    cy.contains(/credencial|error/i, { timeout: 5000 }).should('exist');
  });
});
