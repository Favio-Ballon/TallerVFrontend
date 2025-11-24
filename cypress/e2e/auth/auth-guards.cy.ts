// Test: Guards por rol — accesos bloqueados para roles no autorizados
describe('Auth - Guards por rol', () => {
  it('impide acceso a rutas de admin para docente/estudiante', () => {
    // Crear token con ROLE_DOCENTE
    const toBase64 = (obj) =>
      Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '');
    const header = { alg: 'none', typ: 'JWT' };
    const payloadDocente = {
      authorities: ['ROLE_DOCENTE'],
      name: 'Docente Mock',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };
    const fakeDocente = `${toBase64(header)}.${toBase64(payloadDocente)}.`;

    // Stub /auth/me para que el guard pueda leer el perfil y redirigir correctamente
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: { authorities: ['ROLE_DOCENTE'], name: 'Docente Mock' },
    }).as('meReq');

    // Poner token en la key que usa AuthService
    cy.visit('/admin', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', fakeDocente);
      },
    });

    // El guard debe redirigir al área de docentes
    cy.wait('@meReq');
    cy.url({ timeout: 5000 }).should('include', '/docentes');
  });
});
