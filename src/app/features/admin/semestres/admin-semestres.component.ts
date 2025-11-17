import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-semestres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-semestres.component.html',
  styleUrls: ['./admin-semestres.component.css'],
})
export class AdminSemestresComponent implements OnChanges, OnDestroy {
  @Input() semestreForm: any;
  @Input() gestiones: any[] = [];
  @Input() semestres: any[] = [];
  @Input() loadingSemestres = false;
  @Output() submitSemestre = new EventEmitter<void>();
  @Output() refreshSemestres = new EventEmitter<void>();

  private subs: Subscription[] = [];
  private controlsBound = false;

  ngOnChanges(changes: SimpleChanges) {
    // bind to form controls once the form is provided
    if (changes['semestreForm'] && this.semestreForm && !this.controlsBound) {
      try {
        const gCtrl = this.semestreForm.get('gestionId');
        const nCtrl = this.semestreForm.get('nombre');
        if (gCtrl && gCtrl.valueChanges) {
          this.subs.push(gCtrl.valueChanges.subscribe(() => this.updateDatesIfPossible()));
        }
        if (nCtrl && nCtrl.valueChanges) {
          this.subs.push(nCtrl.valueChanges.subscribe(() => this.updateDatesIfPossible()));
        }
        this.controlsBound = true;
        // run once to set initial values if possible
        this.updateDatesIfPossible();
      } catch (e) {
        // silent fail if form structure unexpected
        console.error('Error binding semestreForm controls', e);
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private updateDatesIfPossible() {
    if (!this.semestreForm) return;
    const gestionId = this.semestreForm.get('gestionId')?.value;
    const nombre = this.semestreForm.get('nombre')?.value;
    if (!gestionId || !nombre) return;

    // find gestion by id to get the year (ano)
    const gestion = this.gestiones?.find((g) => g.id == Number(gestionId));
    let year: number | null = null;
    if (gestion && gestion.ano) year = Number(gestion.ano);
    else if (!isNaN(Number(gestionId))) year = Number(gestionId);
    if (!year) return;

    let start: Date | null = null;
    let end: Date | null = null;

    const firstMonday = (y: number, monthIndex: number) => {
      const d = new Date(y, monthIndex, 1);
      const diff = (1 - d.getDay() + 7) % 7; // 1 = Monday
      d.setDate(1 + diff);
      return d;
    };

    const firstFriday = (y: number, monthIndex: number) => {
      const d = new Date(y, monthIndex, 1);
      const diff = (5 - d.getDay() + 7) % 7; // 5 = Friday
      d.setDate(1 + diff);
      return d;
    };

    const secondMonday = (y: number, monthIndex: number) => {
      const fm = firstMonday(y, monthIndex);
      const d = new Date(fm);
      d.setDate(fm.getDate() + 7);
      return d;
    };

    const lastFridayOfMonth = (y: number, monthIndex: number) => {
      // monthIndex: 0-based
      const last = new Date(y, monthIndex + 1, 0); // last day of month
      let d = new Date(last);
      while (d.getDay() !== 5) {
        d.setDate(d.getDate() - 1);
      }
      return d;
    };

    if (nombre === 'I') {
      // first Monday of March -> first Friday of July
      start = firstMonday(year, 2); // March
      end = firstFriday(year, 6); // July
    } else if (nombre === 'II') {
      // first Monday of August -> first Friday of December
      start = firstMonday(year, 7); // August
      end = firstFriday(year, 11); // December
    } else if (nombre === 'Verano') {
      // second Monday of January -> last Friday of February
      start = secondMonday(year, 0); // January
      end = lastFridayOfMonth(year, 1); // February
    }

    if (start && end) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      try {
        this.semestreForm.get('fechaInicio')?.setValue(fmt(start));
        this.semestreForm.get('fechaFin')?.setValue(fmt(end));
      } catch (e) {
        console.error('Error setting semestre dates', e);
      }
    }
  }
}
