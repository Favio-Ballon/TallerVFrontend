import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 1;

  show(message: string, type: ToastType = 'success', duration = 3500) {
    const toast: Toast = { id: this.nextId++, message, type };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(toast.id), duration);
    }
    return toast.id;
  }

  success(message: string, duration = 3500) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  remove(id: number) {
    const next = this.toastsSubject.value.filter((t) => t.id !== id);
    this.toastsSubject.next(next);
  }

  clear() {
    this.toastsSubject.next([]);
  }
}
