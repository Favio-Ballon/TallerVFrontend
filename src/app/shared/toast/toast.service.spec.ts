import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('show adds a toast and returns id', (done) => {
    const id = service.show('hola', 'success', 0);
    service.toasts$.subscribe((list) => {
      const found = list.find((t) => t.id === id);
      expect(found).toBeDefined();
      expect(found!.message).toBe('hola');
      done();
    });
  });

  it('remove removes the toast', (done) => {
    const id = service.show('x', 'info', 0);
    service.remove(id);
    service.toasts$.subscribe((list) => {
      const found = list.find((t) => t.id === id);
      expect(found).toBeUndefined();
      done();
    });
  });

  it('clear clears all toasts', (done) => {
    service.show('a', 'success', 0);
    service.clear();
    service.toasts$.subscribe((list) => {
      expect(list.length).toBe(0);
      done();
    });
  });
});
