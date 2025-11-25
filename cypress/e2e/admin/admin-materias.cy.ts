/// <reference types="cypress" />

// Spec: Admin - CRUD Materias
// Pruebas básicas: listar, crear, editar y eliminar materias.
// Notas:
// - Registramos los `cy.intercept` antes de `cy.visit` para capturar llamadas de bootstrap.
// - Usamos `cy.stubAuthAndGestion` para stubs de auth comunes.

/**
 * E2E - Admin Materias (CRUD)
 *
 * Pruebas que cubren: listado inicial, creación, edición y eliminación de materias.
 * Usamos `cy.intercept` para controlar las respuestas del backend y `cy.stubAuthAndGestion`
 * para evitar problemas de autorización en `/gestion` durante los tests.
 */
describe('E2E - Admin Materias (CRUD)', () => {
  const apiBase = 'http://localhost:8080';

  beforeEach(() => {
    // Preparación común: registrar stubs de autenticación/gestión ANTES de cargar la app
    // para evitar condiciones de carrera que provoquen 403.
    const fakeToken = 'header.eyJyb2xlcyI6WyJhZG1pbiJdfQ==.signature';
    cy.stubAuthAndGestion({ authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] } });
    // Inyectar tokens en localStorage antes de que el app boot haga llamadas al backend
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });
  });

  it('creates a new materia and displays it in the list', () => {
    // 1) Preparar estado inicial: backend devuelve lista vacía
    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [] }).as('getEmpty');
    cy.visit('/admin/materias');
    cy.wait('@getEmpty');
    cy.contains('No hay materias');

    // 2) Interceptar POST de creación y subsequent GET que recarga la lista
    const created = { id: 101, nombre: 'Programación I', cupos: 30, estado: 'activo' };
    cy.intercept('POST', `${apiBase}/materia/`, { statusCode: 201, body: created }).as('createReq');
    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [created] }).as(
      'getAfterCreate'
    );
    // 3) Completar el formulario y enviar
    // - `.blur()` ayuda a que el FormControl de Angular actualice su estado de validación
    // - clicamos el `button[type="submit"]` para asegurarnos de activar el submit correcto
    cy.get('input[formControlName="nombre"]').type('Programación I').blur();
    cy.get('button[type="submit"]').should('not.be.disabled').contains('Crear').click();

    // 4) Esperar a que se envíe el POST y que la lista se recargue
    cy.wait('@createReq');
    cy.wait('@getAfterCreate');
    cy.contains('Programación I').should('exist');
  });

  it('edits an existing materia', () => {
    const existing = { id: 102, nombre: 'Matemática', cupos: 20, estado: 'activo' };
    const updated = { ...existing, nombre: 'Matemática Avanzada' };

    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [existing] }).as('getOne');
    cy.visit('/admin/materias');
    cy.wait('@getOne');
    cy.contains(existing.nombre).should('exist');

    // Clic en 'Editar' (botón con texto 'Editar') — debe poblar el formulario con los datos
    cy.contains('Editar').click();
    cy.get('input[formControlName="nombre"]').clear().type('Matemática Avanzada');

    cy.intercept('PUT', `${apiBase}/materia/${existing.id}`, { statusCode: 200, body: updated }).as(
      'putReq'
    );
    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [updated] }).as(
      'getAfterPut'
    );

    // Pulsar el botón de actualizar; la app hace PUT y luego recarga la lista
    cy.contains('Actualizar').click();
    cy.wait('@putReq');
    cy.wait('@getAfterPut');
    cy.contains('Matemática Avanzada').should('exist');
  });

  it('deletes a materia from the list', () => {
    const toDelete = { id: 103, nombre: 'Historia', cupos: 15, estado: 'activo' };
    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [toDelete] }).as('getOne');
    cy.visit('/admin/materias');
    cy.wait('@getOne');
    cy.contains(toDelete.nombre).should('exist');

    cy.intercept('DELETE', `${apiBase}/materia/${toDelete.id}`, { statusCode: 204, body: {} }).as(
      'delReq'
    );
    cy.intercept('GET', `${apiBase}/materia/`, { statusCode: 200, body: [] }).as('getAfterDel');

    // Al confirmar, la app llama DELETE y recarga la lista; esperamos ambas llamadas
    cy.contains('Eliminar').click();
    cy.wait('@delReq');
    cy.wait('@getAfterDel');
    cy.contains('No hay materias').should('exist');
  });
});
