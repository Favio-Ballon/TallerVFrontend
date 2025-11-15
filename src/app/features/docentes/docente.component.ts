import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-docente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './docente.component.html',
  styleUrls: ['./docente.component.css'],
})
export class DocenteComponent {
  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
