/**
 * Prueba para `LoginComponent` (unidad rápida).
 * Explicación:
 * - En lugar de compilar el componente y el template, instanciamos la clase
 *   `LoginComponent` directamente con stubs para `AuthService` y `Router`.
 * - Se construye un token simulado con la carga útil que contiene el rol
 *   y se verifica que, tras `submit()`, el rutero navegue según el rol.
 */
import { FormBuilder } from '@angular/forms';
import { jest } from '@jest/globals';
import { LoginComponent } from '../../../../app/features/login/login.component';

describe('LoginComponent (Jest unit)', () => {
  it('submit() navega según el rol cuando el login tiene éxito', () => {
    const fb = new FormBuilder();
    const fakeTokenPayload = { rol: 'docente' };
    const fakeToken = `h.${Buffer.from(JSON.stringify(fakeTokenPayload)).toString('base64')}.s`;

    const authStub: any = {
      // login() simula un observable que llama a next inmediatamente
      login: jest.fn().mockReturnValue({ subscribe: (opts: any) => opts.next && opts.next() }),
      getAccessToken: jest.fn().mockReturnValue(fakeToken),
    };

    const routerStub: any = { navigate: jest.fn() };

    // Instanciamos el componente con los stubs
    const comp = new LoginComponent(authStub, routerStub, fb as any);

    // Llenamos el formulario y ejecutamos submit()
    comp.form.setValue({ email: 'a@b.com', password: '123456' });
    comp.submit();

    // Validaciones: se llamó a login y la navegación se realizó a /docentes
    expect(authStub.login).toHaveBeenCalled();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/docentes']);
  });
});
