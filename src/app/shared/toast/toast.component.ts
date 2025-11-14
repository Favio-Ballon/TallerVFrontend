import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      <div *ngFor="let t of toastService.toasts$ | async" class="toast" [ngClass]="t.type">
        <div class="toast-message">{{ t.message }}</div>
        <button class="toast-close" (click)="toastService.remove(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-wrapper {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 9999;
      }
      .toast {
        min-width: 220px;
        max-width: 400px;
        padding: 0.6rem 0.9rem;
        border-radius: 8px;
        color: #fff;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .toast.success {
        background: #16a34a;
      }
      .toast.error {
        background: #dc2626;
      }
      .toast.info {
        background: #2563eb;
      }
      .toast-message {
        flex: 1;
        padding-right: 0.5rem;
      }
      .toast-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1rem;
        line-height: 1;
        cursor: pointer;
      }
    `,
  ],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
