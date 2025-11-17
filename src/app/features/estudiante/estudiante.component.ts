import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-estudiante',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './estudiante.component.html',
  styleUrls: ['./estudiante.component.css'],
})
export class EstudianteComponent implements OnInit {
  isNavOpen = false;
  userName: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth
      .me()
      .subscribe({
        next: (p) => (this.userName = p?.name || null),
        error: () => (this.userName = null),
      });
  }

  logout() {
    this.auth.logout();
  }

  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  getActiveTabLabel(): string {
    const url = this.router.url || '';
    if (url.includes('matricul')) return 'Matriculaciones';
    if (url.includes('faltas')) return 'Faltas';
    if (url.includes('notas')) return 'Notas';
    return 'Área estudiante';
  }
}
