import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-gestiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-gestiones.component.html',
  styleUrls: ['./admin-gestiones.component.css'],
})
export class AdminGestionesComponent {
  @Input() gestionForm: any;
  @Input() gestiones: any[] = [];
  @Input() loadingGestiones = false;
  @Output() submitGestion = new EventEmitter<void>();
}
