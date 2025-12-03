/// <reference types="cypress" />

describe('E2E - Errores de Autenticación (FASE 1)', () => {
  function makeFakeJwt(payload: any) {
    const toBase64 = (obj: any) =>
      Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
    return `${toBase64({ alg: 'none', typ: 'JWT' })}.${toBase64(payload)}.`;
  }

  const fakeToken = makeFakeJwt({
    name: "Docente Test",
    authorities: ["ROLE_DOCENTE"],
    exp: Math.floor(Date.now() / 1000) + 3600,
  });


  it('debe mostrar error cuando credenciales son incorrectas (401)', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Credenciales inválidas' },
    }).as('loginFail');

    cy.visit('/login');

    cy.get('input[type="email"]').clear().type('usuario_falso@example.com');
    cy.get('input[type="password"]').clear().type('password_incorrecta');

    cy.get('button[type="submit"]').should('not.be.disabled').click();

    cy.wait('@loginFail').its('response.statusCode').should('eq', 401);

    cy.get('body').should((body) => {
      const text = body.text();
      expect(
        text.includes('Credenciales inválidas') ||
        text.includes('Login failed') ||
        text.includes('error') ||
        text.includes('Error')
      ).to.be.true;
    });

    cy.url().should('include', '/login');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.be.null;
    });
  });


  it("si backend devuelve 500 en una ruta protegida, muestra toast", () => {
    cy.intercept("GET", "**/auth/me", {
      statusCode: 200,
      body: { name: "Docente Test", authorities: ["ROLE_DOCENTE"] }
    }).as("meOK");

    cy.intercept("GET", "**/semestre-materia/docente/materias", {
      statusCode: 500,
      body: { message: "server error" }
    }).as("get500");

    cy.visit("/docentes/notas", {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", fakeToken);
        win.localStorage.setItem("refresh_token", "ok");
      },
    });

    cy.wait("@get500");

    cy.contains(/error|fallo|servidor/i).should("exist");
  });


  it('debe redirigir a /login si intenta acceder sin token', () => {
    cy.clearLocalStorage();

    cy.visit('/admin');

    cy.url({ timeout: 5000 }).should('include', '/login');

    cy.contains('Panel de Administración', { timeout: 2000 }).should('not.exist');
  });
});
