// Pruebas E2E: Flujo de Matriculaciones (Docente)
// - Ver listado de cursos
// - Inscribir un alumno usando el input de búsqueda + select de curso
// - Eliminar una matriculación (confirm -> true)

/// <reference types="cypress" />

describe('Docente - Matriculaciones', () => {
  // Generar JWT falso con claim de docente y expiración en el futuro
  function makeFakeJwt(payload: any) {
    const toBase64 = (obj: any) =>
      Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
    const header = { alg: 'none', typ: 'JWT' };
    return `${toBase64(header)}.${toBase64(payload)}.`; // "alg:none" token
  }

  const fakePayload = {
    authorities: ['ROLE_DOCENTE'],
    name: 'Docente Test',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const fakeToken = makeFakeJwt(fakePayload);

  beforeEach(() => {
    // Stub global auth/gestion antes de cargar la app para evitar 403/race.
    // Pasamos el token generado para que el stub de refresh devuelva el mismo JWT.
    cy.stubAuthAndGestion({
      authBody: { name: 'docente', authorities: ['ROLE_DOCENTE'] },
      token: fakeToken,
    });

    // alumnos que devuelve POST /auth/usuarios cuando se filtra por rol estudiante
    const alumnos = [
      { id: 10, nombre: 'Juan', apellido: 'Perez', username: 'juan.perez' },
      { id: 11, nombre: 'Ana', apellido: 'Gomez', username: 'ana.gomez' },
    ];

    // cursos (semestre-materia) que muestra el docente
    const cursos = [
      {
        id: 1,
        materia: { nombre: 'Matemáticas', cupos: 30 },
        semestre: { id: 1, nombre: '2025-1', fechaInicio: '', fechaFin: '', gestionId: 1 },
        docente: { id: 2, nombre: 'Docente', apellido: 'Uno' },
        modalidad: { id: 1, nombre: 'Presencial', faltasPermitidas: 0 },
        cupos: 30,
        estaActivo: true,
      },
    ];

    // Lista general de matriculaciones (inicio vacío)
    cy.intercept('GET', '**/matriculacion/', { statusCode: 200, body: [] }).as(
      'getMatriculaciones'
    );

    // Endpoint que devuelve cursos para el docente
    cy.intercept('GET', '**/semestre-materia/docente/materias', {
      statusCode: 200,
      body: cursos,
    }).as('getSemestreMaterias');

    // Endpoint para listar alumnos (POST /auth/usuarios)
    cy.intercept('POST', '**/auth/usuarios', (req) => {
      req.reply({ statusCode: 200, body: alumnos });
    }).as('postUsuarios');

    // Endpoint que devuelve alumnos inscriptos en un curso (inicialmente vacio)
    cy.intercept('GET', '**/matriculacion/semestre-materia/*', { statusCode: 200, body: [] }).as(
      'getEnrolled'
    );

    // Crear matriculación (cuando el form se envía)
    cy.intercept('POST', '**/matriculacion/', (req) => {
      const body = req.body || {};
      // simular respuesta con id y datos mínimos
      req.reply({
        statusCode: 201,
        body: {
          id: 123,
          alumno: alumnos[0],
          faltas: 0,
          notaFinal: 0,
          estaAprobado: false,
          estaConsolidado: false,
        },
      });
    }).as('createMatriculacion');

    // Borrar matriculacion
    cy.intercept('DELETE', '**/matriculacion/*', { statusCode: 200, body: {} }).as(
      'deleteMatriculacion'
    );

    // Visitar la ruta de matriculaciones del docente inyectando tokens antes de la inicialización
    // de esta forma el componente se monta y dispara las llamadas esperadas (semestre-materias)
    cy.visit('/docentes/matriculaciones', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeToken);
        win.localStorage.setItem('refresh_token', 'fake-refresh');
      },
    });

    // esperar cargas iniciales: auth/me, listado general de matriculaciones, la búsqueda
    // de usuarios y la lista de semestre-materias. No esperamos `getGestion` porque la
    // vista de docentes no realiza esa llamada.
    cy.wait(['@meReq', '@getMatriculaciones', '@postUsuarios', '@getSemestreMaterias']);
  });

  it('inscribe un alumno usando la búsqueda y el select de curso', () => {
    // Tipo en el input de búsqueda; el componente hace POST /auth/usuarios y muestra sugerencias
    cy.get('input[placeholder="Buscar alumno por nombre..."]').type('Juan').blur();

    // La petición de usuarios ya se ejecutó en el setup; buscar el `ul` dentro del
    // wrapper del input del alumno para evitar seleccionar otros `ul` en la página.
    cy.get('input[placeholder="Buscar alumno por nombre..."]')
      .parent()
      .within(() => {
        cy.get('ul')
          .should('be.visible')
          .find('li')
          .first()
          .should('contain.text', 'Juan Perez')
          .trigger('mousedown');
      });

    // Seleccionar curso en el select del formulario (formControlName)
    cy.get('select[formcontrolname="semestreMateriaId"]').select('1');

    // Asegurarse que el botón de submit está habilitado y hacer click
    cy.get('button[type="submit"]').should('not.be.disabled').click();

    // Esperar que se haya enviado la creación
    cy.wait('@createMatriculacion').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Después del submit el input de búsqueda se limpia según la implementación
    cy.get('input[placeholder="Buscar alumno por nombre..."]').should('have.value', '');
  });

  it('elimina una matriculación desde la lista de inscriptos del curso', () => {
    // Preparamos que la llamada a matriculacion/semestre-materia/1 devuelva una matriculación existente
    const enrolled = [
      {
        id: 777,
        alumno: { id: 10, nombre: 'Juan', apellido: 'Perez' },
        faltas: 0,
        notaFinal: 0,
      },
    ];

    // Re-interceptamos la petición por curso para devolver el elemento
    cy.intercept('GET', '**/matriculacion/semestre-materia/1', {
      statusCode: 200,
      body: enrolled,
    }).as('getEnrolledWithOne');

    // Seleccionar el curso en el dropdown de "Ver estudiantes matriculados por curso" (es el segundo select en la vista)
    cy.get('select').eq(1).select('1');

    // Esperar que la lista de inscriptos se cargue
    cy.wait('@getEnrolledWithOne');

    // Confirm dialog: aceptar siempre para permitir eliminación
    cy.on('window:confirm', () => true);

    // Hacer click en el botón Eliminar de la fila
    cy.contains('button', 'Eliminar').click();

    // Esperar el delete al backend
    cy.wait('@deleteMatriculacion').its('response.statusCode').should('eq', 200);
  });
});
