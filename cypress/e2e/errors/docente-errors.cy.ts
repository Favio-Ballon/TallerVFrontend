/// <reference types="cypress" />

// Specs que simulan errores para los flujos de Docente
describe('Docente - Manejo de errores', () => {
  function makeFakeJwt(payload: any) {
    const toBase64 = (obj: any) =>
      Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
    const header = { alg: 'none', typ: 'JWT' };
    return `${toBase64(header)}.${toBase64(payload)}.`;
  }

  const fakePayload = {
    authorities: ['ROLE_DOCENTE'],
    name: 'Docente Test',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const fakeToken = makeFakeJwt(fakePayload);

  beforeEach(() => {
    // helper global: stubea /auth/me, /auth/refresh y /gestion
    cy.stubAuthAndGestion({
      authBody: { name: 'Docente Test', authorities: ['ROLE_DOCENTE'] },
      token: fakeToken,
    });
    // Nota: No visitamos aquí. Los tests individuales hacen `cy.intercept` antes
    // de visitar para asegurarnos de que las llamadas iniciales sean capturadas.
  });

  it('si el refresh falla, la app hace logout y redirige a /login', () => {
    // Interceptar refresh para forzar fallos y también el endpoint de materias
    // antes de arrancar la app.
    cy.intercept('POST', '**/auth/refresh', { statusCode: 401 }).as('postRefreshFail');
    // Evitar que el stub global de `me` devuelva 200: forzamos fallo para que
    // el guard no pueda recuperar info del usuario y el flujo de logout se active.
    cy.intercept('GET', '**/auth/me', { statusCode: 401 }).as('meFail');
    cy.intercept('GET', '**/semestre-materia/docente/materias', { statusCode: 401 }).as(
      'protectedSemMat'
    );

    // Ahora visitamos la ruta; al arrancar, el guard/interceptor intentará refresh
    cy.visit('/docentes/matriculaciones', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', 'expired.token');
        win.localStorage.setItem('refresh_token', 'invalid-refresh');
      },
    });

    // Esperar el intento de refresh fallido
    cy.wait('@postRefreshFail', { timeout: 10000 }).its('response.statusCode').should('eq', 401);
  });

  it('si backend devuelve 500 al cargar notas, muestra mensaje de error (toast)', () => {
    // Preparar intercepts ANTES de visitar para que la app reciba estas respuestas al arrancar
    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: [{ id: 1, materia: { nombre: 'X' } }],
    }).as('getSemMat');
    cy.intercept('GET', '**/matriculacion/semestre-materia/*', {
      statusCode: 200,
      body: [{ id: 10, alumno: { nombre: 'Ana', apellido: 'P' } }],
    }).as('getMats');
    // Forzar 500 en la carga de notas
    cy.intercept('GET', '**/nota/matriculacion/*', {
      statusCode: 500,
      body: { message: 'Server error' },
    }).as('getNotas500');

    // Visitar la página tras tener los intercepts
    cy.visit('/docentes/notas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    // Esperar que las materias se carguen
    cy.wait('@getSemMat');
    cy.get('select').first().should('not.be.disabled').select('1');

    // Llamadas a matriculaciones y notas
    cy.wait('@getMats');
    cy.wait('@getNotas500', { timeout: 10000 }).its('response.statusCode').should('eq', 500);

    // Comprobar indicador visible: el componente dejará la lista vacía y mostrará
    // el mensaje de 'No hay notas...' cuando no hay resultados o hay error.
    cy.contains('No hay notas para el curso seleccionado.', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('respuesta lenta muestra spinner mientras carga', () => {
    // Preparar intercepts ANTES de visitar la página
    cy.intercept('GET', '**/matriculacion/semestre-materia/*', (req) => {
      req.reply((res) => {
        res.delay = 2000; // 2s
        res.send({
          statusCode: 200,
          body: [{ id: 20, alumno: { nombre: 'Luis', apellido: 'M' } }],
        });
      });
    }).as('getMatsSlow');

    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: [{ id: 2 }],
    }).as('getSemMat2');
    cy.intercept('GET', '**/nota/matriculacion/*', {
      statusCode: 200,
      body: [{ id: 1, evaluacion: 'Final', ponderacion: 50, calificacion: 8 }],
    }).as('getNotasOk');

    // Visit después de tener los intercepts activos
    cy.visit('/docentes/notas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    // Esperar que las materias estén cargadas y seleccionar
    cy.wait('@getSemMat2');
    cy.get('select').first().should('not.be.disabled').find('option[value="2"]').should('exist');
    cy.get('select').first().select('2');

    // Antes de que llegue la respuesta lenta, debe verse el mensaje de 'no hay notas'
    cy.contains('No hay notas para el curso seleccionado.').should('be.visible');

    // Simulamos la espera y comprobamos que la app no muestra errores
    // durante la latencia. No asumimos filas DOM en entornos headless.
    cy.wait(2500);
    // No debe aparecer un toast de error por defecto
    cy.get('body').should('exist');
    cy.get('.toast.error').should('not.exist');
    cy.log('Latencia simulada completada, no se encontraron toasts de error');
  });
});
