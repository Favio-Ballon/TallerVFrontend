import { mount } from 'cypress/angular';
import { of } from 'rxjs';
import { AdminMateriasComponent } from '../../src/app/features/admin/materias/admin-materias.component';
import { AdminService } from '../../src/app/core/services/admin.service';

describe('AdminMateriasComponent (component test)', () => {
  it('mounts and shows materia form', () => {
    const adminServiceStub: Partial<AdminService> = {
      getMaterias: () => of([]),
      createMateria: () => of(null),
      updateMateria: () => of(null),
      deleteMateria: () => of(null),
    };

    mount(AdminMateriasComponent, {
      providers: [{ provide: AdminService, useValue: adminServiceStub }],
    });

    cy.get('form').should('exist');
    cy.get('input[formcontrolname="nombre"]').should('exist');
  });
});
