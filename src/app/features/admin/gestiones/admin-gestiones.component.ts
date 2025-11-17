import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-gestiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-gestiones.component.html',
  styleUrls: ['./admin-gestiones.component.css'],
})
export class AdminGestionesComponent implements OnChanges {
  @Input() gestionForm: any;
  @Input() gestiones: any[] = [];
  @Input() loadingGestiones = false;
  @Output() submitGestion = new EventEmitter<void>();

  // years to choose from in the select (e.g. currentYear-5 .. currentYear+5)
  years: number[] = [];

  // when true, show a custom input to type the year
  showCustom = false;

  constructor() {
    const current = new Date().getFullYear();
    const start = current - 5;
    const end = current + 5;
    for (let y = start; y <= end; y++) this.years.push(y);
  }

  ngOnChanges(changes: SimpleChanges) {
    // if the parent form has a value for 'ano' that is outside the generated years,
    // show the custom input so the value can be edited.
    try {
      const val = this.gestionForm?.get('ano')?.value;
      if (val !== null && val !== undefined && val !== '') {
        const num = Number(val);
        this.showCustom = isNaN(num) ? true : !this.years.includes(num);
      } else {
        this.showCustom = false;
      }
    } catch (e) {
      // defensive: if gestionForm isn't ready yet, ignore
    }
  }

  onYearSelect(value: string) {
    if (!this.gestionForm) return;
    if (value === 'other') {
      this.showCustom = true;
      // clear current form value so user can type
      this.gestionForm.get('ano')?.setValue('');
    } else {
      this.showCustom = false;
      this.gestionForm.get('ano')?.setValue(value);
    }
  }
}
