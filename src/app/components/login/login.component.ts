import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card glass-morphism">
        <mat-card-header>
          <div class="header-icon">
            <mat-icon>{{ isSetupMode ? 'settings' : 'lock' }}</mat-icon>
          </div>
          <mat-card-title>{{ isSetupMode ? 'Configuración Inicial' : 'Iniciar Sesión' }}</mat-card-title>
          <mat-card-subtitle>
            {{ isSetupMode ? 'Establece tu contraseña de administrador' : 'Ingresa tus credenciales para continuar' }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <p *ngIf="!isSetupMode" class="user-hint">
            Usuario: <strong>iscroberto.rojas&#64;gmail.com</strong>
          </p>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hide ? 'password' : 'text'" [(ngModel)]="password" (keyup.enter)="onSubmit()">
            <button mat-icon-button matSuffix (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide">
              <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
          </mat-form-field>

          <div *ngIf="isSetupMode" class="setup-notice">
            <mat-icon color="warn">info</mat-icon>
            <span>Esta es la única vez que configurarás tu contraseña inicial. El correo ligado es iscroberto.rojas&#64;gmail.com</span>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" class="full-width" (click)="onSubmit()" [disabled]="isLoading">
            {{ isSetupMode ? 'GUARDAR Y EMPEZAR' : 'INGRESAR' }}
          </button>
        </mat-card-actions>

        <mat-card-footer *ngIf="!isSetupMode">
          <p class="forgot-password">
            En caso de olvidar la contraseña externa, contacta a soporte o revisa tu correo ligado.
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at top right, #3f51b5, #212121);
    }
    .login-card {
      width: 400px;
      padding: 20px;
      border-radius: 16px;
      text-align: center;
    }
    .header-icon {
      background: #3f51b5;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 16px;
    }
    .header-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .full-width { width: 100%; margin-top: 10px; }
    .user-hint { font-size: 0.9rem; color: #666; margin-bottom: 20px; }
    .setup-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
      color: #795548;
      background: #efebe9;
      padding: 10px;
      border-radius: 8px;
      margin-top: 15px;
    }
    .forgot-password { font-size: 0.75rem; color: #999; margin-top: 10px; padding: 0 10px 10px; }
    
    .glass-morphism {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
  `]
})
export class LoginComponent implements OnInit {
  isSetupMode = false;
  password = '';
  hide = true;
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.auth.checkSetupStatus().subscribe({
      next: (res) => this.isSetupMode = !res.isSetup,
      error: (err) => console.error('Error checking setup status', err)
    });
  }

  onSubmit() {
    if (!this.password || this.isLoading) return;
    this.isLoading = true;

    const request = this.isSetupMode
      ? this.auth.setup(this.password)
      : this.auth.login(this.password);

    request.subscribe({
      next: () => {
        if (this.isSetupMode) {
          this.snackBar.open('¡Contraseña configurada con éxito! Ahora inicia sesión.', 'Cerrar', { duration: 5000 });
          this.isSetupMode = false;
          this.password = '';
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.error || 'Error al procesar la solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
