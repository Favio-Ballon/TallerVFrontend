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
  const skipGestion = overrides.skipGestion === true;

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: authBody,
  }).as('meReq');

  // Si la app intenta refrescar tokens, devolver éxito para evitar redirecciones a login
  // Responder con las claves que AuthService espera: { token, refreshToken }
  cy.intercept('POST', '**/auth/refresh', (req) => {
    req.reply({ statusCode: 200, body: { token, refreshToken: 'fake-refresh' } });
  }).as('authRefresh');

  // Por defecto stubear /gestion/, pero permitir a tests desactivar este stub
  // cuando necesiten controlar respuestas dinámicas (crear/editar/eliminar).
  if (!skipGestion) {
    cy.intercept('GET', '**/gestion*', {
      statusCode: 200,
      body: gestionBody,
    }).as('getGestion');
  }
});

export {};

// Ignorar excepciones no críticas provenientes de herramientas de snapshot/Studio
// (p. ej. errores que intentan acceder a `top.document` al restaurar snapshots).
// Esto evita que Cypress falle el test por errores que no afectan la lógica bajo prueba.
// Si prefieres, podemos restringir el handler solo a mensajes/stack específicos.
// Nota: mantener esto temporalmente mientras se investiga la causa raíz.
(function registerExceptionHandler() {
  // @ts-ignore
  if (Cypress && Cypress.on) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cypress.on('uncaught:exception', (err: any) => {
      const msg = String(err?.message ?? '');
      const stack = String(err?.stack ?? '');
      // Ignorar errores que intentan leer `document` de top/frame desde bibliotecas de snapshot
      if (
        msg.includes('Cannot read properties of null') &&
        stack.includes('doesAUTMatchTopSuperDomainOrigin')
      ) {
        return false; // evita que Cypress falle el test
      }
      return true; // dejar que otros errores sigan fallando
    });
  }
})();
