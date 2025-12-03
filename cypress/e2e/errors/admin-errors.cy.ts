/// <reference types="cypress" />

/**
 * E2E – Admin: Errores comunes en Materias y Semestres
 *
 * Pruebas de errores:
 * 1) Crear materia → 400 (validación de backend)
 * 2) Crear materia → 500 (error general)
 * 3) Crear semestre → 400 (fecha inválida)
 * 4) Crear semestre → 500 (error general)
 *
 * Estas pruebas NO son CRUD, solo validan cómo reacciona la UI ante errores.
 */

describe("E2E - Admin: Errores Materias y Semestres", () => {
  const apiBase = "http://localhost:8080";
  const fakeToken = "header.eyJhdXRob3JpdGllcyI6WyJST0xFX0FETUlOIl19.signature";

  // ============================================================
  // 1) CREAR MATERIA → 400 (validación)
  // ============================================================
  it("error 400 al crear materia → muestra mensaje de validación", () => {
    // PASO 1: Definir todos intercepts ANTES de visit (ORDEN CRÍTICO)
    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: { name: "Admin Test", authorities: ["ROLE_ADMIN"] },
    }).as("meOK");

    cy.intercept("POST", "**/auth/refresh", {
      statusCode: 200,
      body: { token: "x", refreshToken: "y" },
    }).as("refreshOK");

    cy.intercept("GET", "**/gestion/", {
      statusCode: 200,
      body: [],
    }).as("getGestion");

    cy.intercept("GET", "**/materia/", {
      statusCode: 200,
      body: [],
    }).as("getList");

    // Intercept POST con 400 ANTES de visitar
    cy.intercept("POST", "**/materia/", {
      statusCode: 400,
      body: { message: "El nombre ya existe" },
    }).as("post400");

    // PASO 2: Visitar con tokens inyectados
    cy.visit("/admin/materias", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });

    // PASO 3: Esperar cargas iniciales
    cy.wait("@meOK");
    cy.wait("@getList");

    // PASO 4: Rellenar y enviar
    cy.get('input[formControlName="nombre"]').clear().type("Programación I");
    cy.get('button[type="submit"]').click();

    // PASO 5: Esperar POST fallido
    cy.wait("@post400");

    // PASO 6: Verificar que el toast de error aparece con el mensaje
    // El ToastService ahora renderiza el mensaje en un toast visible
    cy.contains(/nombre ya existe|El nombre ya existe/i).should("be.visible");
  });

  // ============================================================
  // 2) CREAR MATERIA → 500
  // ============================================================
  it("error 500 al crear materia → muestra toast de error general", () => {
    // PASO 1: Definir intercepts ANTES de visit
    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: { name: "Admin Test", authorities: ["ROLE_ADMIN"] },
    }).as("meOK");

    cy.intercept("POST", "**/auth/refresh", {
      statusCode: 200,
      body: { token: "x", refreshToken: "y" },
    }).as("refreshOK");

    cy.intercept("GET", "**/gestion/", {
      statusCode: 200,
      body: [],
    }).as("getGestion");

    cy.intercept("GET", "**/materia/", {
      statusCode: 200,
      body: [],
    }).as("getList");

    // Intercept POST con 500 ANTES de visitar
    cy.intercept("POST", "**/materia/", {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("post500");

    // PASO 2: Visitar
    cy.visit("/admin/materias", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });

    // PASO 3: Esperar cargas iniciales
    cy.wait("@meOK");
    cy.wait("@getList");

    // PASO 4: Rellenar y enviar
    cy.get('input[formControlName="nombre"]').clear().type("Matemática");
    cy.get('button[type="submit"]').click();

    // PASO 5: Esperar POST fallido
    cy.wait("@post500");

    // PASO 6: Verificar que el toast de error aparece y la UI no crasheó
    cy.contains(/server error|Server error|Error al crear/i).should("be.visible");
    cy.get("form").should("exist");
    cy.get('input[formControlName="nombre"]').should("exist");
  });


  // ============================================================
  // 3) CREAR SEMESTRE → 400 (formato/fechas inválidas)
  // ============================================================
  it("error 400 al crear semestre → muestra validación", () => {
    const gestion = { id: 701, ano: "2026" };

    // Intercepts auth y recursos ANTES de visit
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { name: 'Admin Test', authorities: ['ROLE_ADMIN'] },
    }).as('meOK');

    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { token: 'x', refreshToken: 'y' },
    }).as('refreshOK');

    cy.intercept('GET', `${apiBase}/gestion/`, {
      statusCode: 200,
      body: [gestion],
    }).as('getGestiones');

    cy.intercept('GET', `${apiBase}/semestre/`, {
      statusCode: 200,
      body: [],
    }).as('getEmpty');

    // Define POST error antes de visitar (evita race)
    cy.intercept('POST', `${apiBase}/semestre/`, {
      statusCode: 400,
      body: { message: 'Fechas inválidas' },
    }).as('post400');

    cy.visit('/admin/semestres', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    cy.wait('@meOK');
    cy.wait('@getGestiones');
    cy.wait('@getEmpty');

    // Seleccionar gestión y semestre
    cy.get('select[formControlName="gestionId"]').should('be.visible').select(String(gestion.id));
    cy.get('select[formControlName="nombre"]').should('be.visible').select('I');

    // Enviar formulario (botón submit)
    cy.get('button[type="submit"]').contains(/Crear Semestre|Crear/).click();

    cy.wait('@post400');

    cy.contains(/fecha|inv[aá]lida|Fechas inválidas|400|error/i).should('be.visible');
  });

  // ============================================================
  // 4) CREAR SEMESTRE → 500 (error general)
  // ============================================================
  it("error 500 al crear semestre → muestra mensaje y no crashea", () => {
    const gestion = { id: 702, ano: '2026' };

    // Intercepts auth y recursos ANTES de visit
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { name: 'Admin Test', authorities: ['ROLE_ADMIN'] },
    }).as('meOK');

    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { token: 'x', refreshToken: 'y' },
    }).as('refreshOK');

    cy.intercept('GET', `${apiBase}/gestion/`, {
      statusCode: 200,
      body: [gestion],
    }).as('getGestiones');

    cy.intercept('GET', `${apiBase}/semestre/`, {
      statusCode: 200,
      body: [],
    }).as('getEmpty');

    // Define POST error 500 ANTES de visitar
    cy.intercept('POST', `${apiBase}/semestre/`, {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('post500');

    cy.visit('/admin/semestres', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    cy.wait('@meOK');
    cy.wait('@getGestiones');
    cy.wait('@getEmpty');

    cy.get('select[formControlName="gestionId"]').should('be.visible').select(String(gestion.id));
    cy.get('select[formControlName="nombre"]').should('be.visible').select('II');

    cy.get('button[type="submit"]').contains(/Crear Semestre|Crear/).click();
    cy.wait('@post500');

    cy.contains(/error|500|servidor|Internal Server Error/i).should('be.visible');
    cy.get('form').should('exist');
  });
});
