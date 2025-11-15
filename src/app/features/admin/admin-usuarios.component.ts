import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Usuario } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css'],
})
export class AdminUsuariosComponent {
  @Input() usuarioForm: any;
  @Input() loadingUsuarios = false;
  @Input() usuarios: Usuario[] = [];
  @Output() submitUsuario = new EventEmitter<void>();
  // Emitimos el rol seleccionado (p. ej. 'admin', 'estudiante', 'docente') o undefined para todos
  @Output() refreshUsuarios = new EventEmitter<string | undefined>();

  // Valor local del selector de rol (por defecto mostrar Todos)
  selectedRole: string | undefined = '';

  onRoleChange(role: string | undefined) {
    // Actualizamos el valor local y emitimos para que el padre recargue la lista
    this.selectedRole = role;
    this.refreshUsuarios.emit(role ? role : undefined);
  }
}
