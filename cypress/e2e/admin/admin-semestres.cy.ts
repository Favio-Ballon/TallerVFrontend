/**
 * E2E - Admin Semestres
 *
 * Pruebas para creación y refresco de semestres. Se stubea `/auth/me` y `/gestion`
 * para garantizar permisos y listas de gestión durante los tests.
 */
describe('E2E - Admin Semestres', () => {
  const apiBase = 'http://localhost:8080';

  beforeEach(() => {
    const fakeToken = 'header.eyJyb2xlcyI6WyJhZG1pbiJdfQ==.signature';
    // Registrar intercepts antes de arrancar la app y establecer tokens antes de la carga
    cy.stubAuthAndGestion({ authBody: { name: 'admin', authorities: ['ROLE_ADMIN'] } });
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });
  });

  it('creates a semestre and auto-fills dates based on gestión and nombre', () => {
    const gestion = { id: 301, ano: '2026' };
    cy.intercept('GET', `${apiBase}/gestion/`, { statusCode: 200, body: [gestion] }).as(
      'getGestiones'
    );
    cy.intercept('GET', `${apiBase}/semestre/`, { statusCode: 200, body: [] }).as('getEmpty');

    cy.visit('/admin/semestres');
    // Esperamos las llamadas iniciales que cargan las opciones de gestión y la lista vacía
    cy.wait('@getGestiones');
    cy.wait('@getEmpty');

    // Seleccionar gestión y nombre de semestre; el componente debe auto-completar fechaInicio/fechaFin
    cy.get('select[formControlName="gestionId"]').select(String(gestion.id));
    cy.get('select[formControlName="nombre"]').select('I');

    // fechaInicio y fechaFin deben ser completados por la lógica del componente
    // Usamos `invoke('val')` para permitir reintentos hasta que el componente setee los valores
    cy.get('input[formControlName="fechaInicio"]')
      .invoke('val')
      .should('match', /\d{4}-\d{2}-\d{2}/);
    cy.get('input[formControlName="fechaFin"]')
      .invoke('val')
      .should('match', /\d{4}-\d{2}-\d{2}/);

    const created = {
      id: 401,
      nombre: 'I',
      gestionId: gestion.id,
      fechaInicio: '2026-03-02',
      fechaFin: '2026-07-02',
    };
    cy.intercept('POST', `${apiBase}/semestre/`, { statusCode: 201, body: created }).as(
      'createReq'
    );
    cy.intercept('GET', `${apiBase}/semestre/`, { statusCode: 200, body: [created] }).as(
      'getAfterCreate'
    );

    // Enviar creación: el formulario hace POST y luego la app recarga la lista con GET
    cy.contains('Crear Semestre').click();
    cy.wait('@createReq');
    cy.wait('@getAfterCreate');

    // Verificar que la UI muestra el semestre creado
    cy.contains('I Semestre').should('exist');
    cy.contains('2026-03').should('exist');
  });

  it('refreshes semestres list when clicking refresh', () => {
    const existing = {
      id: 402,
      nombre: 'II',
      gestionId: 301,
      fechaInicio: '2026-08-03',
      fechaFin: '2026-12-03',
    };
    cy.intercept('GET', `${apiBase}/semestre/`, { statusCode: 200, body: [existing] }).as('getOne');
    cy.visit('/admin/semestres');
    cy.wait('@getOne');

    cy.contains('Semestres Existentes').should('exist');

    // Al pulsar 'Actualizar semestres' la app debe volver a solicitar GET /semestre/
    cy.intercept('GET', `${apiBase}/semestre/`, { statusCode: 200, body: [existing] }).as(
      'getRefreshed'
    );
    cy.get('button[aria-label="Actualizar semestres"]').click();
    // Esperar a que la petición refrescada llegue y validar que el elemento aparece
    cy.wait('@getRefreshed');
    cy.contains('II Semestre').should('exist');
  });
});
