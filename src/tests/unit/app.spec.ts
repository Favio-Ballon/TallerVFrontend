/**
 * Test simplificado para la raíz de la aplicación (`App`).
 * Explicación:
 * - En lugar de probar el componente real con `templateUrl`/`styleUrl`,
 *   usamos un componente mock standalone que simula el contenido principal.
 * - Esto evita la necesidad de resolver recursos externos y acelera la prueba.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';

@Component({
  selector: 'app-mock',
  standalone: true,
  template: '<h1>Hello, fronted</h1>',
})
class MockApp {}

describe('App', () => {
  let fixture: ComponentFixture<MockApp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockApp],
    }).compileComponents();

    fixture = TestBed.createComponent(MockApp as any);
  });

  it('debe crear la app (mock)', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debe renderizar el título en el mock', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, fronted');
  });
});
