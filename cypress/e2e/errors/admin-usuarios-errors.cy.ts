/// <reference types="cypress" />

/**
 * E2E - Admin Usuarios (ERRORES)
 *
 * Pruebas:
 * 1) Crear usuario → 400 (validación backend: email duplicado)
 * 2) Crear usuario → 500 (error general)
 * 3) Listar usuarios → 403 (sin permisos)
 * 4) Listar usuarios → 500 (error general)
 */

describe("E2E - Admin Usuarios (ERRORES)", () => {
  const apiBase = "http://localhost:8080";
  const fakeToken =
    "header.eyJyb2xlcyI6WyJhZG1pbiJdfQ==.signature";

  beforeEach(() => {
    cy.stubAuthAndGestion({
      authBody: { name: "admin", authorities: ["ROLE_ADMIN"] },
    });

    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "fake-refresh");
      },
    });
  });

  // ---------------------------------------------------
  // 1) Crear usuario → 400
  // ---------------------------------------------------
  it("error 400 al crear usuario → no crashea y el form sigue visible", () => {
    cy.intercept("POST", `${apiBase}/auth/usuarios`, {
      statusCode: 200,
      body: [],
    }).as("getList");

    cy.intercept("POST", `${apiBase}/auth/register`, {
      statusCode: 400,
      body: { message: "Email ya registrado" },
    }).as("post400");

    cy.visit("/admin/usuarios");
    cy.wait("@getList");

    cy.get('input[formControlName="nombre"]').type("Ana");
    cy.get('input[formControlName="apellido"]').type("López");
    cy.get('input[formControlName="email"]').type("ana@example.com");
    cy.get('input[formControlName="telefono"]').type("+59170000000");
    cy.get('input[formControlName="password"]').type("1234");
    cy.get('select[formControlName="rol"]').select("Estudiante");

    cy.contains("Crear Usuario").click();
    cy.wait("@post400");

    cy.get("form").should("exist");
    cy.contains(/ana@example.com/i).should("not.exist");
  });

  // ---------------------------------------------------
  // 2) Crear usuario → 500
  // ---------------------------------------------------
  it("error 500 al crear usuario → no crashea", () => {
    cy.intercept("POST", `${apiBase}/auth/usuarios`, {
      statusCode: 200,
      body: [],
    }).as("getList");

    cy.intercept("POST", `${apiBase}/auth/register`, {
      statusCode: 500,
      body: { message: "Error interno" },
    }).as("post500");

    cy.visit("/admin/usuarios");
    cy.wait("@getList");

    cy.get('input[formControlName="nombre"]').type("Pedro");
    cy.get('input[formControlName="apellido"]').type("Rojas");
    cy.get('input[formControlName="email"]').type("pedro@example.com");
    cy.get('input[formControlName="telefono"]').type("+59170000000");
    cy.get('input[formControlName="password"]').type("1234");
    cy.get('select[formControlName="rol"]').select("Docente");

    cy.contains("Crear Usuario").click();
    cy.wait("@post500");

    cy.get("form").should("exist");
  });

  // ---------------------------------------------------
  // 3) Listar usuarios → 403
  // ---------------------------------------------------
  it("error 403 al listar usuarios → muestra estado vacío y no crashea", () => {
    cy.intercept("POST", `${apiBase}/auth/usuarios`, {
      statusCode: 403,
      body: { message: "Forbidden" },
    }).as("list403");

    cy.visit("/admin/usuarios");
    cy.wait("@list403");

    cy.contains("No hay usuarios para mostrar").should("exist");
  });

  // ---------------------------------------------------
  // 4) Listar usuarios → 500
  // ---------------------------------------------------
  it("error 500 al listar usuarios → UI estable", () => {
    cy.intercept("POST", `${apiBase}/auth/usuarios`, {
      statusCode: 500,
      body: { message: "Server error" },
    }).as("list500");

    cy.visit("/admin/usuarios");
    cy.wait("@list500");

    cy.contains("No hay usuarios para mostrar").should("exist");
  });
});
