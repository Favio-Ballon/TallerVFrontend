import { TestBed } from '@angular/core/testing';
import { jest } from '@jest/globals';
import { ToastComponent } from '../../../../app/shared/toast/toast.component';
import { ToastService } from '../../../../app/shared/toast/toast.service';
import { of } from 'rxjs';

/**
 * Prueba para `ToastComponent`.
 * Explicación:
 * - `ToastComponent` es un componente standalone que depende de `ToastService`.
 * - Para simplificar y evitar complejidades de inyección/DOM en Jest, aquí
 *   instanciamos directamente la clase del componente pasando un stub del servicio.
 * - Esta prueba verifica que la dependencia se asigne correctamente y que la
 *   lógica del componente pueda acceder al `toastService`.
 */
describe('ToastComponent (Jest)', () => {
  it('verifica que el componente recibe el servicio de toasts', () => {
    const stub = {
      toasts$: of([{ id: 1, message: 'Hola', type: 'success' }]),
      remove: jest.fn(),
    } as unknown as ToastService;
    // Instanciación directa para comprobar inyección y accesibilidad
    const comp = new (ToastComponent as any)(stub);
    expect(comp.toastService).toBe(stub);
  });
});
