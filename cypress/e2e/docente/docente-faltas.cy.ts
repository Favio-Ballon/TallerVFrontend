// Pruebas E2E: Docente - Faltas
// - Cargar cursos del docente
// - Seleccionar curso y listar estudiantes (matriculaciones)
// - Subir faltas para una matriculación y verificar petición PATCH
// - Eliminar una matriculación y verificar petición DELETE

/// <reference types="cypress" />

describe('Docente - Faltas', () => {
  // Generar token falso con rol docente (igual que en otros specs)
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
    // Stubs comunes y token
    cy.stubAuthAndGestion({
      authBody: { name: 'Docente Test', authorities: ['ROLE_DOCENTE'] },
      token: fakeToken,
    });

    // Cursos disponibles para el docente
    const cursos = [
      {
        id: 42,
        materia: { nombre: 'Historia' },
        semestre: { nombre: '2025-1' },
        docente: { nombre: 'Doc', apellido: 'Test' },
        modalidad: { nombre: 'Presencial' },
        cupos: 20,
        estaActivo: true,
      },
    ];

    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: cursos,
    }).as('getSemestreMaterias');

    // Inicial: lista general de matriculaciones vacía
    cy.intercept('GET', '**/matriculacion/', { statusCode: 200, body: [] }).as(
      'getMatriculaciones'
    );

    // Petición que lista matriculaciones por curso: la implementaremos dinámicamente
    // en cada test cuando sea necesario (para simular el refresco que hace el componente).
    cy.intercept('GET', '**/matriculacion/semestre-materia/*', { statusCode: 200, body: [] }).as(
      'getFaltasByCourse'
    );

    // PATCH para subir faltas (respuesta genérica por defecto)
    cy.intercept('PATCH', '**/matriculacion/subir-faltas/*', (req) => {
      req.reply({ statusCode: 200, body: 'OK' });
    }).as('patchFaltas');

    // DELETE matriculacion
    cy.intercept('DELETE', '**/matriculacion/*', { statusCode: 200, body: {} }).as(
      'deleteMatriculacion'
    );

    // Visitar la ruta específica
    cy.visit('/docentes/faltas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    // Esperar las cargas iniciales visibles: perfil y lista de cursos.
    // Nota: esta vista no solicita la lista general de matriculaciones, por eso
    // no esperamos `@getMatriculaciones` aquí.
    cy.wait(['@meReq', '@getSemestreMaterias']);
  });

  it('muestra estudiantes por curso y permite subir faltas', () => {
    // Preparar respuesta con una matriculación existente y la versión actualizada.
    const enrolledBefore = [
      { id: 9001, alumno: { id: 10, nombre: 'Laura', apellido: 'Ruiz' }, faltas: 2, notaFinal: 0 },
    ];
    const enrolledAfter = [
      { id: 9001, alumno: { id: 10, nombre: 'Laura', apellido: 'Ruiz' }, faltas: 5, notaFinal: 0 },
    ];

    // Flag para controlar la respuesta del GET: antes del PATCH devuelve enrolledBefore,
    // después del PATCH devolverá enrolledAfter.
    let returnedUpdated = false;
    cy.intercept('GET', '**/matriculacion/semestre-materia/42', (req) => {
      if (returnedUpdated) req.reply({ statusCode: 200, body: enrolledAfter });
      else req.reply({ statusCode: 200, body: enrolledBefore });
    }).as('getEnrolled42');

    // Intercept de PATCH: cuando llegue, marcamos que las siguientes GET deben devolver updated
    cy.intercept('PATCH', '**/matriculacion/subir-faltas/*', (req) => {
      returnedUpdated = true;
      req.reply({ statusCode: 200, body: 'OK' });
    }).as('patchFaltasDynamic');

    // Seleccionar curso en el select (primer select en la vista)
    cy.get('select').first().select('42');

    // Esperar la carga por curso (versión inicial)
    cy.wait('@getEnrolled42');

    // Ver la fila del alumno con faltas iniciales
    cy.contains('tr', 'Laura Ruiz').within(() => {
      cy.contains('span', '2').should('be.visible');
    });

    // Ingresar nuevas faltas en el input de la fila y pulsar 'Subir'
    cy.contains('tr', 'Laura Ruiz').within(() => {
      cy.get('input[type="number"]').clear().type('3').blur();
      cy.contains('button', 'Subir').click();
    });

    // Esperar el PATCH que sube faltas (dynamic)
    cy.wait('@patchFaltasDynamic').its('response.statusCode').should('eq', 200);

    // Esperar que el componente recargue la lista y devuelva la versión actualizada
    cy.wait('@getEnrolled42');

    // Ver que la UI muestra ahora 5 faltas (2 + 3)
    cy.contains('tr', 'Laura Ruiz').within(() => {
      cy.contains('span', '5').should('be.visible');
    });
  });

  it('elimina una matriculación desde la lista de faltas', () => {
    // Preparar matriculación existente
    const enrolledBefore = [
      { id: 7777, alumno: { id: 20, nombre: 'Carlos', apellido: 'Diaz' }, faltas: 0, notaFinal: 0 },
    ];

    // Flag para simular que tras el DELETE la siguiente GET devuelve lista vacía
    let deletedFlag = false;
    cy.intercept('GET', '**/matriculacion/semestre-materia/42', (req) => {
      if (deletedFlag) req.reply({ statusCode: 200, body: [] });
      else req.reply({ statusCode: 200, body: enrolledBefore });
    }).as('getEnrolled42b');

    // Intercept DELETE: marcar flag y responder OK
    cy.intercept('DELETE', '**/matriculacion/*', (req) => {
      deletedFlag = true;
      req.reply({ statusCode: 200, body: {} });
    }).as('deleteMatriculacionDynamic');

    // Seleccionar curso y esperar la lista inicial
    cy.get('select').first().select('42');
    cy.wait('@getEnrolled42b');

    // Aceptar confirm dialog
    cy.on('window:confirm', () => true);

    // Hacer click en Eliminar de la fila
    cy.contains('tr', 'Carlos Diaz').within(() => {
      cy.contains('button', 'Eliminar').click();
    });

    // Esperar el DELETE dinámico
    cy.wait('@deleteMatriculacionDynamic').its('response.statusCode').should('eq', 200);

    // Esperar que el componente recargue la lista y devuelva lista vacía
    cy.wait('@getEnrolled42b');

    // Comprobar mensaje de estado vacío en la UI
    cy.contains('No hay estudiantes para gestionar faltas en el curso seleccionado.').should(
      'be.visible'
    );
  });
});
