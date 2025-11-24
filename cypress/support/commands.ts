// Comandos Cypress personalizados para este proyecto
// Mantener los comandos mínimos; añadir helpers por componente cuando haga falta
// Ejemplo de comando de ejemplo
declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<Element>;
      stubAuthAndGestion(overrides?: any): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (email: string, password: string) => {
  // Rellenar inputs del formulario si están presentes (placeholder)
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

// Helper para stubs comunes: asegura `GET /auth/me` y `GET /gestion` devuelvan responses válidos
Cypress.Commands.add('stubAuthAndGestion', (overrides: any = {}) => {
  const authBody = overrides.authBody ?? { name: 'Admin Test', authorities: ['ROLE_ADMIN'] };
  const token = overrides.token ?? 'fake.jwt.token';
  const gestionBody = overrides.gestionBody ?? [{ id: 1, nombre: 'Gestión 1', activo: true }];

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: authBody,
  }).as('meReq');

  // Si la app intenta refrescar tokens, devolver éxito para evitar redirecciones a login
  // Responder con las claves que AuthService espera: { token, refreshToken }
  cy.intercept('POST', '**/auth/refresh', (req) => {
    req.reply({ statusCode: 200, body: { token, refreshToken: 'fake-refresh' } });
  }).as('authRefresh');

  // Usar un patrón amplio para coincidir con `/gestion`, `/gestion/` y `/gestion/{id}`
  cy.intercept('GET', '**/gestion*', {
    statusCode: 200,
    body: gestionBody,
  }).as('getGestion');
});

export {};
