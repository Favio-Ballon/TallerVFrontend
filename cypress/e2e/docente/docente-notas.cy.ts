// Pruebas E2E: Docente - Notas
// - Cargar cursos del docente
// - Seleccionar curso y listar notas por matriculación (forkJoin)
// - Subir calificación para una nota y verificar recarga
// - Consolidar una matriculación (PATCH) y verificar la llamada
// Pruebas E2E: Docente - Notas
// - Cargar cursos del docente
// - Seleccionar curso y listar notas por matriculación (forkJoin)
// - Subir calificación para una nota y verificar recarga
// - Consolidar una matriculación (PATCH) y verificar la llamada

/// <reference types="cypress" />

describe('Docente - Notas', () => {
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
    // Stub global de auth + token
    cy.stubAuthAndGestion({
      authBody: { name: 'Docente Test', authorities: ['ROLE_DOCENTE'] },
      token: fakeToken,
    });

    // Cursos
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
    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: cursos,
    }).as('getSemestreMaterias');

    // GET general de matriculaciones (vacío por defecto)
    cy.intercept('GET', '**/matriculacion/', { statusCode: 200, body: [] }).as(
      'getMatriculaciones'
    );

    // GET notas por matriculacion y otros endpoints se interceptarán dinámicamente en cada test

    // PATCH subir-calificación (respuesta por defecto)
    cy.intercept('PATCH', '**/nota/*/subir-calificacion', (req) => {
      req.reply({ statusCode: 200, body: 'OK' });
    }).as('patchSubirCalificacion');

    // PATCH consolidar matriculacion
    cy.intercept('PATCH', '**/matriculacion/consolidar-alumno/*', (req) => {
      req.reply({ statusCode: 200, body: 'Consolidado' });
    }).as('patchConsolidar');

    cy.visit('/docentes/notas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    cy.wait(['@meReq', '@getSemestreMaterias']);
  });

  it('muestra notas por matriculación y permite subir calificación', () => {
    // Matriculaciones del curso
    const matrics = [{ id: 300, alumno: { id: 50, nombre: 'María', apellido: 'López' } }];

    // Notas antes y después de la subida
    // Notas representan la calificación ya ponderada que devuelve el backend.
    // El backend almacena la calificación como: (valorIngresado * ponderacion) / 100
    const notasBefore = [{ id: 1, evaluacion: 'Parcial 1', ponderacion: 40, calificacion: 6 }];
    // Si el usuario ingresa 8 (raw), la calificación almacenada será 8 * 40 / 100 = 3.2
    const notasAfter = [{ id: 1, evaluacion: 'Parcial 1', ponderacion: 40, calificacion: 3.2 }];

    let returnedUpdated = false;

    // Intercept para obtener matriculaciones por curso
    cy.intercept('GET', '**/matriculacion/semestre-materia/99', {
      statusCode: 200,
      body: matrics,
    }).as('getMatriculas99');

    // Intercept dinámico para notas por matriculacion
    cy.intercept('GET', '**/nota/matriculacion/300', (req) => {
      if (returnedUpdated) req.reply({ statusCode: 200, body: notasAfter });
      else req.reply({ statusCode: 200, body: notasBefore });
    }).as('getNotas300');

    // Intercept PATCH: marcar que futuras GET devuelvan la versión actualizada
    cy.intercept('PATCH', '**/nota/1/subir-calificacion', (req) => {
      returnedUpdated = true;
      req.reply({ statusCode: 200, body: 'OK' });
    }).as('patchSubirCalificacionDynamic');

    // Seleccionar curso: esperar que el select esté habilitado y que exista la opción
    cy.get('select')
      .first()
      .should('not.be.disabled')
      .within(($s) => {
        // esperar que la opción exista antes de seleccionar
        cy.wrap($s).find('option[value="99"]').should('exist');
      });
    cy.get('select').first().select('99');
    cy.wait('@getMatriculas99');

    // Ahora la vista hace GET por cada matriculación -> getNotas300
    cy.wait('@getNotas300');

    // Ver fila con la nota inicial (valor ya almacenado en el backend)
    cy.contains('td', 'María López').should('be.visible');
    cy.contains('tr', 'María López').within(() => {
      cy.contains('td', 'Parcial 1').should('be.visible');
      // Aseguramos que se muestra la calificación almacenada (notaBefore.calificacion)
      cy.contains('td', String(notasBefore[0].calificacion)).should('be.visible');
    });

    // Ingresar nueva calificación y subir
    cy.contains('tr', 'María López').within(() => {
      cy.get('input[type="number"]').first().clear().type('8').blur();
      cy.contains('button', 'Subir').click();
    });

    cy.wait('@patchSubirCalificacionDynamic').its('response.statusCode').should('eq', 200);

    // Esperar recarga de notas y validar primero la respuesta del backend (fuente de verdad)
    cy.wait('@getNotas300').then((inter) => {
      const respBody = inter.response && inter.response.body ? inter.response.body : [];
      // Aseguramos que el backend devolvió la calificación ponderada
      expect(respBody[0].calificacion).to.be.closeTo((8 * 40) / 100, 0.01);
    });

    // Ver nota actualizada en UI: debe aparecer el valor ponderado (3.2) — comprobamos con tolerancia
    cy.contains('tr', 'María López').within(() => {
      cy.get('td')
        .eq(4)
        .invoke('text')
        .then((txt) => {
          const val = parseFloat(txt.replace(',', '.')) || NaN;
          // Mostrar un mensaje más claro si la UI no refleja la respuesta del backend
          expect(val, `valor en UI (${txt.trim()})`).to.be.closeTo((8 * 40) / 100, 0.2);
        });
    });
  });

  it('consolida una matriculación y verifica la llamada', () => {
    const matrics = [{ id: 400, alumno: { id: 60, nombre: 'Pedro', apellido: 'García' } }];
    // notas para la matriculacion
    const notas = [{ id: 10, evaluacion: 'Final', ponderacion: 60, calificacion: 7 }];

    cy.intercept('GET', '**/matriculacion/semestre-materia/99', {
      statusCode: 200,
      body: matrics,
    }).as('getMat99b');
    cy.intercept('GET', '**/nota/matriculacion/400', { statusCode: 200, body: notas }).as(
      'getNotas400'
    );

    // Re-intercept consolidar para espiar la llamada (ya stubbed globally, aquí sólo alias)
    cy.intercept('PATCH', '**/matriculacion/consolidar-alumno/400', {
      statusCode: 200,
      body: 'Consolidado',
    }).as('consolidar400');

    // Seleccionar curso y esperar matriculas+notas
    cy.get('select').first().select('99');
    cy.wait('@getMat99b');
    cy.wait('@getNotas400');

    // Aceptar confirm y llamar consolidar sobre la fila
    cy.on('window:confirm', () => true);
    cy.contains('tr', 'Pedro García').within(() => {
      cy.contains('button', 'Consolidar').click();
    });

    cy.wait('@consolidar400').its('response.statusCode').should('eq', 200);
  });
});
