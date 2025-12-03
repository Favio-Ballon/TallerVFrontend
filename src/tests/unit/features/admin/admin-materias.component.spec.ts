/**
 * Prueba para `AdminMateriasComponent`.
 * Explicación:
 * - Se instancia la clase del componente con stubs que simulan `AdminService` y `ToastService`.
 * - Esta prueba verifica el flujo de creación: llamar a `createMateria` y mostrar un toast.
 */
import { FormBuilder } from '@angular/forms';
import { jest } from '@jest/globals';
import { AdminMateriasComponent } from '../../../../app/features/admin/materias/admin-materias.component';

describe('AdminMateriasComponent (Jest unit)', () => {
  it('save() llama a createMateria y muestra toast al crear', () => {
    const fb = new FormBuilder();
    const adminStub: any = {
      // simulamos métodos que devuelven objetos con subscribe para imitar observables
      getMaterias: jest.fn().mockReturnValue({ subscribe: (o: any) => o.next && o.next([]) }),
      createMateria: jest.fn().mockReturnValue({ subscribe: (o: any) => o.next && o.next(null) }),
      updateMateria: jest.fn(),
      deleteMateria: jest.fn(),
    };

    const toastStub: any = { show: jest.fn() };

    // Instanciamos el componente con los stubs
    const comp = new AdminMateriasComponent(adminStub, fb as any, toastStub);

    // Rellenamos el formulario y ejecutamos save()
    comp.materiaForm.setValue({ nombre: 'Nueva' });
    comp.save();

    // Validaciones: se llamó a createMateria y se mostró el toast esperado
    expect(adminStub.createMateria).toHaveBeenCalled();
    expect(toastStub.show).toHaveBeenCalledWith('Materia creada', 'success');
  });
});
