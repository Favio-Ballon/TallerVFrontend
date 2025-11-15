import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-semestres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-semestres.component.html',
  styleUrls: ['./admin-semestres.component.css'],
})
export class AdminSemestresComponent {
  @Input() semestreForm: any;
  @Input() gestiones: any[] = [];
  @Input() semestres: any[] = [];
  @Input() loadingSemestres = false;
  @Output() submitSemestre = new EventEmitter<void>();
  @Output() refreshSemestres = new EventEmitter<void>();
}
