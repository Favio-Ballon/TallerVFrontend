import { mount } from 'cypress/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from '../../src/app/features/login/login.component';

describe('LoginComponent (component test)', () => {
  it('mounts and shows login form', () => {
    mount(LoginComponent, {
      imports: [RouterTestingModule],
    });

    cy.get('form').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
  });
});
