// Test: Token expirado durante una acción crítica — refrescar y reintentar la acción
describe('Auth - Token expirado durante acción', () => {
  it('refresca token si expira justo antes de un PATCH y reintenta la operación', () => {
    // Simular refresh
    cy.intercept('POST', '**/auth/refresh', {
      statusCode: 200,
      body: { token: 'new.jwt', refreshToken: 'new-refresh' },
    }).as('postRefresh');

    // PATCH que devuelve 401 la primera vez y 200 la segunda (ruta usada por DocenteService)
    let first = true;
    cy.intercept('PATCH', '**/matriculacion/consolidar-alumno/*', (req) => {
      if (first) {
        first = false;
        req.reply({ statusCode: 401 });
      } else {
        req.reply({ statusCode: 200, body: 'Consolidado' });
      }
    }).as('patchConsolidar');

    // Helper para crear un JWT simple (no firmado) que algunas partes del app puedan parsear
    const makeFakeJwt = (payload: any): string => {
      const toBase64 = (obj: any): string =>
        Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
      const header = { alg: 'none', typ: 'JWT' };
      return `${toBase64(header)}.${toBase64(payload)}.`;
    };

    // Preparamos la UI: stubear cursos y matriculaciones para que exista una fila con botón Consolidar
    const cursos = [
      {
        id: 99,
        materia: { nombre: 'Física' },
        semestre: { nombre: '2025-1' },
        docente: { nombre: 'Doc', apellido: 'Test' },
        modalidad: { nombre: 'Presencial' },
        cupos: 30,
        estaActivo: true,
      },
    ];
    const matrics = [{ id: 1, alumno: { id: 60, nombre: 'Pedro', apellido: 'García' } }];
    const notas = [{ id: 10, evaluacion: 'Final', ponderacion: 60, calificacion: 7 }];

    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: cursos,
    }).as('getSemestres');
    cy.intercept('GET', '**/matriculacion/semestre-materia/99', {
      statusCode: 200,
      body: matrics,
    }).as('getMat99');
    cy.intercept('GET', '**/nota/matriculacion/1', { statusCode: 200, body: notas }).as(
      'getNotas1'
    );

    // Stub de /auth/me para que la app considere al usuario autenticado al cargar
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { authorities: ['ROLE_DOCENTE'], name: 'Doc Test' },
    }).as('meReq');

    // Inyectar token VÁLIDO inicialmente (para evitar redirect) y visitar la vista
    const initPayload = {
      authorities: ['ROLE_DOCENTE'],
      name: 'Doc Test',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const initialToken = makeFakeJwt(initPayload);
    cy.visit('/docentes/notas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', initialToken);
        win.localStorage.setItem('refresh_token', 'valid-refresh');
      },
    });

    // Comprobar que la app no redirigió automáticamente a /login
    cy.url({ timeout: 10000 }).then((u) => {
      if (u.includes('/login')) {
        throw new Error('La aplicación redirigió a /login: revisar flujo de refresh/logout');
      }
    });

    // Esperar a que la UI muestre el selector de curso y la opción cargada
    cy.contains('Curso (Semestre - Materia)', { timeout: 10000 }).should('be.visible');
    cy.get('select').first().should('exist').and('not.be.disabled');
    // Esperar a que la opción del curso esté presente y seleccionarla
    cy.get('select').first().find('option').contains('Física', { timeout: 10000 }).should('exist');
    cy.get('select').first().select('99');

    // Esperar la aparición de la fila del alumno que confirma que matriculaciones y notas se cargaron
    cy.contains('tr', 'Pedro García', { timeout: 10000 }).should('be.visible');

    // Hacer click en el botón Consolidar de la fila
    cy.contains('tr', 'Pedro García').within(() => {
      cy.contains('button', 'Consolidar').click();
    });

    // Debe haberse llamado al refresh y al patch (primero 401, luego retry 200)
    cy.wait('@postRefresh').then(() => {
      // A veces la app no persiste el token del stub en el entorno de test; forzamos el nuevo token
      const newPayload = {
        authorities: ['ROLE_DOCENTE'],
        name: 'Doc Test',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      };
      const newToken = makeFakeJwt(newPayload);
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', newToken);
      });
    });

    // Esperamos dos llamadas al patch: la primera (401) y la segunda reintentada (200)
    cy.wait('@patchConsolidar');
    cy.wait('@patchConsolidar').its('response.statusCode').should('eq', 200);
  });
});
