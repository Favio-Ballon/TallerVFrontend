import { mount } from 'cypress/angular';
import { of } from 'rxjs';
import { ToastComponent } from '../../src/app/shared/toast/toast.component';
import { ToastService } from '../../src/app/shared/toast/toast.service';

describe('ToastComponent (component test)', () => {
  it('shows toasts from service', () => {
    const toastServiceStub = {
      toasts$: of([{ id: 1, message: 'Hola', type: 'success' }]),
      remove: (id: number) => {},
    } as unknown as ToastService;

    mount(ToastComponent, {
      providers: [{ provide: ToastService, useValue: toastServiceStub }],
    });

    cy.contains('Hola').should('exist');
    cy.get('.toast-close').should('exist');
  });
});
