import { Component } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-protected',
  standalone: true,
  templateUrl: './protected.component.html',
  styleUrl: './protected.component.css',
})
export class ProtectedComponent {
  constructor(public auth: AuthService) {}
}
