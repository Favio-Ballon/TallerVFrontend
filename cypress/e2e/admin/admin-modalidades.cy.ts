/// <reference types="cypress" />
/// <reference types="cypress" />

/**
 * E2E - Admin Modalidades (CRUD)
 *
 * Pruebas básicas: listar, crear, editar y eliminar modalidades.
 * Usa `cy.stubAuthAndGestion` para evitar race en /auth y /gestion.
 */
describe('E2E - Admin Modalidades (CRUD)', () => {
  const apiBase = 'http://localhost:8080';
  const fakeToken = 'header.eyJyb2xlcyI6WyJhZG1pbiJdfQ==.signature';

  beforeEach(() => {
    // No stubbing global aquí: los tests registran `stubAuthAndGestion` con el
    // `gestionBody` adecuado para evitar interferencias entre tests.
    // Asegurarnos de partir de una app limpia entre tests
    cy.visit('about:blank');
  });

  it('lists modalidades', () => {
    // La vista carga las gestiones que incluyen `modalidades` dentro de cada gestión
    const gestiones = [
      { id: 1, ano: '2025', modalidades: [{ id: 1, nombre: 'Presencial', faltasPermitidas: 0 }] },
      { id: 2, ano: '2026', modalidades: [{ id: 2, nombre: 'Virtual', faltasPermitidas: 0 }] },
    ];
    cy.stubAuthAndGestion({
      authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] },
      token: fakeToken,
      gestionBody: gestiones,
      skipGestion: true,
    });
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: gestiones }).as('getList');

    cy.visit('/admin/modalidades', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });
    cy.wait('@getList');

    cy.contains('Presencial').should('exist');
    cy.contains('Virtual').should('exist');
  });

  it('creates a new modalidad', () => {
    // Inicial: gestiones sin modalidades (el stub global responde a GET /gestion/)
    const gestionesEmpty = [{ id: 1, ano: '2025', modalidades: [] }];
    cy.stubAuthAndGestion({
      authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] },
      token: fakeToken,
      gestionBody: gestionesEmpty,
      skipGestion: true,
    });

    // Intercept GET inicial (gestiones vacías) para controlar el flujo de la UI
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: gestionesEmpty }).as(
      'getInitial'
    );
    // Intercept POST de creación de modalidad
    cy.intercept('POST', `${apiBase}/modalidad/`, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 50,
          nombre: req.body.nombre,
          faltasPermitidas: req.body.faltasPermitidas,
          gestionId: req.body.gestionId,
        },
      });
    }).as('postCreate');

    // Después de crear, la app recarga las gestiones
    const gestionesAfter = [
      { id: 1, ano: '2025', modalidades: [{ id: 50, nombre: 'Híbrida', faltasPermitidas: 0 }] },
    ];
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: gestionesAfter }).as(
      'getAfterCreate'
    );

    cy.visit('/admin/modalidades', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });
    // Esperar a que la vista se monte y el selector de gestión esté visible
    cy.get('select[formControlName="gestionId"]', { timeout: 10000 }).should('be.visible');
    // Seleccionar la gestión antes de completar el formulario (la UI puede deshabilitar inputs)
    cy.get('select[formControlName="gestionId"]').select('1');
    cy.get('input[formControlName="nombre"]', { timeout: 10000 })
      .should('be.enabled')
      .type('Híbrida')
      .blur();
    cy.get('input[formControlName="faltasPermitidas"]').should('be.enabled').clear().type('0');
    cy.get('button[type="submit"]').contains('Crear').click();

    cy.wait('@postCreate');
    cy.wait('@getAfterCreate');
    cy.contains('Híbrida').should('exist');
  });

  it('edits an existing modalidad', () => {
    const existing = { id: 60, nombre: 'Semipresencial', faltasPermitidas: 2 };
    const updated = { ...existing, nombre: 'Semipresencial Avanzada', faltasPermitidas: 5 };

    // Inicial: gestión con modalidad existente (usamos el stub para esta respuesta)
    const gestionesWithExisting = [
      {
        id: 1,
        ano: '2025',
        modalidades: [
          { id: existing.id, nombre: existing.nombre, faltasPermitidas: existing.faltasPermitidas },
        ],
      },
    ];
    cy.stubAuthAndGestion({
      authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] },
      token: fakeToken,
      gestionBody: gestionesWithExisting,
      skipGestion: true,
    });

    // Intercept inicial para la gestión que ya contiene la modalidad existente
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: gestionesWithExisting }).as(
      'getInitialExisting'
    );

    // Cuando se pulsa 'Editar' el componente pedirá GET /modalidad/{id}
    // Devolver también `gestionId` para que el formulario quede válido al editar
    cy.intercept('GET', `${apiBase}/modalidad/${existing.id}`, {
      statusCode: 200,
      body: { ...existing, gestionId: 1 },
    }).as('getModalidadById');

    cy.intercept('PUT', `${apiBase}/modalidad/${existing.id}`, {
      statusCode: 200,
      body: updated,
    }).as('putReq');
    const gestionesAfterUpdate = [
      {
        id: 1,
        ano: '2025',
        modalidades: [
          { id: existing.id, nombre: updated.nombre, faltasPermitidas: updated.faltasPermitidas },
        ],
      },
    ];
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: gestionesAfterUpdate }).as(
      'getAfterPut'
    );

    cy.visit('/admin/modalidades', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });
    // Comprobar que la modalidad existente aparece en la UI
    cy.contains(existing.nombre, { timeout: 10000 }).should('exist');

    cy.contains('Editar').click();
    cy.wait('@getModalidadById');

    // Re-query inputs después del fetch para evitar elementos desconectados
    // Esperar que la animación de la vista/modal termine y el formulario sea visible
    cy.get('main.animate-fade-in', { timeout: 10000 }).should('have.css', 'opacity', '1');
    cy.get('input[formControlName="nombre"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(updated.nombre);
    cy.get('input[formControlName="faltasPermitidas"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(String(updated.faltasPermitidas));
    cy.get('button').contains('Actualizar').should('not.be.disabled').click();

    cy.wait('@putReq', { timeout: 10000 });
    cy.wait('@getAfterPut', { timeout: 10000 });
    cy.contains(updated.nombre, { timeout: 10000 }).should('exist');
  });

  it('deletes a modalidad', () => {
    // Crear primero la modalidad vía UI (asegura estado consistente en este test)
    const toDelete = { id: 70, nombre: 'Temporal', faltasPermitidas: 1 };
    const gestionesEmpty = [{ id: 1, ano: '2025', modalidades: [] }];
    cy.stubAuthAndGestion({
      authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] },
      token: fakeToken,
      gestionBody: gestionesEmpty,
      skipGestion: true,
    });

    // Intercept POST creación
    cy.intercept('POST', `${apiBase}/modalidad/`, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: toDelete.id,
          nombre: req.body.nombre,
          faltasPermitidas: req.body.faltasPermitidas,
          gestionId: req.body.gestionId,
        },
      });
    }).as('postCreateDelete');
    // Después de crear, la app recarga las gestiones con la nueva modalidad
    const gestionesAfterCreate = [
      {
        id: 1,
        ano: '2025',
        modalidades: [
          { id: toDelete.id, nombre: toDelete.nombre, faltasPermitidas: toDelete.faltasPermitidas },
        ],
      },
    ];
    cy.intercept('GET', `${apiBase}/gestion*`, { statusCode: 200, body: gestionesAfterCreate }).as(
      'getAfterCreateDelete'
    );

    cy.visit('/admin/modalidades', {
      onBeforeLoad(win) {
        // confirmar automáticamente los confirm dialogs
        cy.stub(win, 'confirm').returns(true);
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    // Esperar selector y crear la modalidad Temporal
    cy.get('select[formControlName="gestionId"]', { timeout: 10000 })
      .should('be.visible')
      .select('1');
    cy.get('input[formControlName="nombre"]').should('be.enabled').type(toDelete.nombre).blur();
    cy.get('input[formControlName="faltasPermitidas"]')
      .should('be.enabled')
      .clear()
      .type(String(toDelete.faltasPermitidas));
    cy.get('button[type="submit"]').contains('Crear').click();

    cy.wait('@postCreateDelete');
    cy.wait('@getAfterCreateDelete');
    cy.contains(toDelete.nombre, { timeout: 10000 }).should('exist');

    // Ahora interceptar DELETE y la recarga posterior
    cy.intercept('DELETE', `${apiBase}/modalidad/${toDelete.id}`, { statusCode: 200, body: {} }).as(
      'delReq'
    );
    const gestionesAfterDel = [{ id: 1, ano: '2025', modalidades: [] }];
    cy.intercept('GET', `${apiBase}/gestion*`, { statusCode: 200, body: gestionesAfterDel }).as(
      'getAfterDel'
    );

    // Ejecutar la eliminación desde la UI
    cy.contains('Eliminar').click();
    cy.wait('@delReq');
    cy.wait('@getAfterDel', { timeout: 10000 });

    // Verificar que la modalidad eliminada ya no está en la lista
    cy.contains(toDelete.nombre, { timeout: 10000 }).should('not.exist');
  });
});
