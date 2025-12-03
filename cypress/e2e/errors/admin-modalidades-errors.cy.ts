/// <reference types="cypress" />

describe("E2E - Admin Modalidades (ERRORES)", () => {
  const apiBase = "http://localhost:8080";
  const fakeToken =
    "header.eyJyb2xlcyI6WyJST0xFX0FETUlOIl19.signature";

  beforeEach(() => {
    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: { name: "Admin Test", authorities: ["ROLE_ADMIN"] },
    }).as("meOK");

    cy.intercept("POST", "**/auth/refresh", {
      statusCode: 200,
      body: { token: "x", refreshToken: "y" },
    });

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });
  });

  // ============================================================
  // 1) Crear modalidad → 400
  // ============================================================
  it("error 400 al crear modalidad → no crashea", () => {
    // Asegurar intercepts antes de visitar la página y tokens en localStorage
    cy.intercept("GET", `${apiBase}/gestion*`, {
      statusCode: 200,
      body: [{ id: 1, ano: "2025", modalidades: [] }],
    }).as("getList");

    cy.intercept("POST", `${apiBase}/modalidad/`, {
      statusCode: 400,
      body: { message: "Nombre duplicado" },
    }).as("post400");

    cy.visit("/admin/modalidades", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });

    // Esperar a que la vista y select estén listos antes de interactuar
    cy.wait("@getList");
    cy.get('select[formControlName="gestionId"]', { timeout: 10000 }).should("be.visible").select("1");
    cy.get('input[formControlName="nombre"]', { timeout: 10000 }).should("be.enabled").type("Presencial");
    cy.get('input[formControlName="faltasPermitidas"]')
      .should("be.enabled")
      .clear()
      .type("0");

    cy.get('button[type="submit"]').contains("Crear").click();
    cy.wait("@post400");

    cy.get("form").should("exist");
  });

  // ============================================================
  // 2) Crear modalidad → 500
  // ============================================================
  it("error 500 al crear modalidad → sigue estable", () => {
    cy.intercept("GET", `${apiBase}/gestion*`, {
      statusCode: 200,
      body: [{ id: 1, ano: "2025", modalidades: [] }],
    }).as("getList");

    cy.intercept("POST", `${apiBase}/modalidad/`, {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("post500");

    cy.visit("/admin/modalidades", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });

    cy.wait("@getList");
    cy.get('select[formControlName="gestionId"]', { timeout: 10000 }).should("be.visible").select("1");
    cy.get('input[formControlName="nombre"]', { timeout: 10000 }).should("be.enabled").type("Híbrida");
    cy.get('input[formControlName="faltasPermitidas"]')
      .should("be.enabled")
      .clear()
      .type("0");

    cy.get('button[type="submit"]').contains("Crear").click();
    cy.wait("@post500");

    cy.get("form").should("exist");
  });

  // ============================================================
  // 3) Editar modalidad → 400
  // ============================================================
  it("error 400 al editar modalidad → formulario sigue visible", () => {
    const existing = {
      id: 10,
      nombre: "Virtual",
      faltasPermitidas: 2,
      gestionId: 1,
    };

    cy.intercept("GET", `${apiBase}/gestion/`, {
      statusCode: 200,
      body: [{ id: 1, ano: "2025", modalidades: [existing] }],
    }).as("getInitial");

    cy.intercept("GET", `${apiBase}/modalidad/10`, {
      statusCode: 200,
      body: existing,
    }).as("getById");

    cy.intercept("PUT", `${apiBase}/modalidad/10`, {
      statusCode: 400,
      body: { message: "Valores inválidos" },
    }).as("put400");

    cy.visit("/admin/modalidades");
    cy.wait("@getInitial");

    cy.contains("Editar").click();
    cy.wait("@getById");

    cy.get('input[formControlName="nombre"]').clear().type("Virtual Pro");
    cy.get('input[formControlName="faltasPermitidas"]').clear().type("3");

    cy.contains("Actualizar").click();
    cy.wait("@put400");

    cy.get("form").should("exist");
  });

  // ============================================================
  // 4) Editar modalidad → 500
  // ============================================================
  it("error 500 al editar modalidad → UI estable", () => {
    const existing = {
      id: 11,
      nombre: "Híbrida",
      faltasPermitidas: 3,
      gestionId: 1,
    };

    cy.intercept("GET", `${apiBase}/gestion/`, {
      statusCode: 200,
      body: [{ id: 1, ano: "2025", modalidades: [existing] }],
    }).as("getInitial");

    cy.intercept("GET", `${apiBase}/modalidad/11`, {
      statusCode: 200,
      body: existing,
    }).as("getById");

    cy.intercept("PUT", `${apiBase}/modalidad/11`, {
      statusCode: 500,
      body: { message: "Internal error" },
    }).as("put500");

    cy.visit("/admin/modalidades");
    cy.wait("@getInitial");

    cy.contains("Editar").click();
    cy.wait("@getById");

    cy.get('input[formControlName="nombre"]').clear().type("Híbrida 2");
    cy.get('input[formControlName="faltasPermitidas"]').clear().type("4");

    cy.contains("Actualizar").click();
    cy.wait("@put500");

    cy.get("form").should("exist");
  });

  // ============================================================
  // 5) Listar modalidades → 403
  // ============================================================
  it("error 403 al listar modalidades → muestra 'Sin modalidades'", () => {
    cy.intercept("GET", `${apiBase}/gestion/`, {
      statusCode: 403,
      body: { message: "Forbidden" },
    }).as("get403");

    cy.visit("/admin/modalidades");
    cy.wait("@get403");

    cy.contains(/sin modalidades|gestión/i).should("exist");
  });

  // ============================================================
  // 6) Listar modalidades → 500
  // ============================================================
  it("error 500 al listar modalidades → UI estable", () => {
    cy.intercept("GET", `${apiBase}/gestion/`, {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("get500");

    cy.visit("/admin/modalidades");
    cy.wait("@get500");

    cy.contains(/sin modalidades|gestión/i).should("exist");
  });
});
