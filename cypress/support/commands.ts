// Custom Cypress commands for this project
// Keep commands minimal; add helpers per-component as needed
// Example placeholder command
declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(email: string, password: string): Chainable<Element>;
      stubAuthAndGestion(overrides?: any): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (email: string, password: string) => {
  // Placeholder: fill form inputs if present
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

// Helper para stubs comunes: asegura `GET /auth/me` y `GET /gestion` devuelvan responses válidos
Cypress.Commands.add('stubAuthAndGestion', (overrides: any = {}) => {
  const authBody = overrides.authBody ?? { name: 'Admin Test', authorities: ['ROLE_ADMIN'] };
  const gestionBody = overrides.gestionBody ?? [{ id: 1, nombre: 'Gestión 1', activo: true }];

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: authBody,
  }).as('meReq');

  // Use a broader pattern to match `/gestion` and `/gestion/` and `/gestion/{id}`
  cy.intercept('GET', '**/gestion*', {
    statusCode: 200,
    body: gestionBody,
  }).as('getGestion');
});

export {};
