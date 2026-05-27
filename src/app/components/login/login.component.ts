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
    <div class="login-page">
      <div class="login-box">
        <!-- Panel Izquierdo (Ilustración Isométrica) -->
        <div class="login-visual">
          <div class="visual-glow"></div>
          <div class="isometric-container">
            <img src="login_isometric_art.png" alt="Workspace Illustration" class="isometric-img">
          </div>
        </div>

        <!-- Panel Derecho (Formulario de Acceso) -->
        <div class="login-form-container">
          <div class="login-header">
            <div class="brand-logo">
              <mat-icon>{{ isSetupMode ? 'settings' : 'shield' }}</mat-icon>
            </div>
            <h2 class="login-title">
              {{ isSetupMode ? 'Configuración Inicial' : 'Iniciar Sesión' }}
            </h2>
            <p class="login-subtitle">
              {{ isSetupMode ? 'Establece tu contraseña de administrador' : 'Ingresa tus credenciales para continuar' }}
            </p>
          </div>

          <div class="login-form-body">
            <p *ngIf="!isSetupMode" class="user-hint">
              Usuario: <span class="user-email">iscroberto.rojas&#64;gmail.com</span>
            </p>

            <mat-form-field appearance="outline" class="full-width custom-field">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" [(ngModel)]="password" (keyup.enter)="onSubmit()" placeholder="Escribe tu contraseña">
              <button mat-icon-button matSuffix (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide">
                <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <div *ngIf="isSetupMode" class="setup-notice">
              <mat-icon>info</mat-icon>
              <span>Esta es la única vez que configurarás tu contraseña inicial. El correo ligado es iscroberto.rojas&#64;gmail.com</span>
            </div>

            <button mat-flat-button class="submit-btn" (click)="onSubmit()" [disabled]="isLoading">
              <span *ngIf="!isLoading">{{ isSetupMode ? 'GUARDAR Y EMPEZAR' : 'INGRESAR' }}</span>
              <span *ngIf="isLoading" class="loading-text">Procesando...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 20px;
    }

    .login-box {
      display: flex;
      width: 960px;
      height: 600px;
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }

    /* Panel Izquierdo: Visual */
    .login-visual {
      flex: 1.1;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
      border-right: 1px solid #f1f5f9;
    }

    .visual-glow {
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
      top: 10%;
      left: 10%;
      pointer-events: none;
    }

    .isometric-container {
      width: 85%;
      height: 85%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .isometric-img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      filter: drop-shadow(0 20px 30px rgba(59, 130, 246, 0.08));
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(0.5deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }

    /* Panel Derecho: Formulario */
    .login-form-container {
      flex: 0.9;
      padding: 56px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #ffffff;
    }

    .login-header {
      margin-bottom: 32px;
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      background-color: #eff6ff;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      color: #3b82f6;
    }

    .brand-logo mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .login-title {
      font-size: 1.85rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .login-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 8px 0 0 0;
      line-height: 1.4;
    }

    .login-form-body {
      display: flex;
      flex-direction: column;
    }

    .user-hint {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 24px;
      background-color: #f8fafc;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #f1f5f9;
    }

    .user-email {
      font-weight: 600;
      color: #334155;
    }

    .full-width {
      width: 100%;
    }

    .custom-field {
      margin-bottom: 4px;
    }

    /* Customizing Angular Material Form Field with deep selection for CSS override */
    ::v-deep .custom-field .mat-mdc-text-field-wrapper {
      background-color: #f8fafc !important;
      border-radius: 12px !important;
      transition: background-color 0.2s, box-shadow 0.2s !important;
    }

    ::v-deep .custom-field .mat-mdc-text-field-wrapper:hover {
      background-color: #f1f5f9 !important;
    }

    ::v-deep .custom-field.mat-focused .mat-mdc-text-field-wrapper {
      background-color: #ffffff !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
    }

    ::v-deep .custom-field .mdc-notched-outline__leading,
    ::v-deep .custom-field .mdc-notched-outline__notch,
    ::v-deep .custom-field .mdc-notched-outline__trailing {
      border-color: #e2e8f0 !important;
    }

    ::v-deep .custom-field.mat-focused .mdc-notched-outline__leading,
    ::v-deep .custom-field.mat-focused .mdc-notched-outline__notch,
    ::v-deep .custom-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #3b82f6 !important;
      border-width: 2px !important;
    }

    .setup-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.825rem;
      color: #92400e;
      background: #fef3c7;
      padding: 12px;
      border-radius: 12px;
      margin-top: 16px;
      border: 1px solid #fde68a;
      line-height: 1.4;
    }

    .setup-notice mat-icon {
      color: #d97706;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .submit-btn {
      width: 100%;
      height: 50px !important;
      background: #3b82f6 !important;
      color: #ffffff !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      font-size: 1rem !important;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25) !important;
      transition: all 0.2s ease-in-out !important;
      margin-top: 24px;
    }

    .submit-btn:hover:not([disabled]) {
      background: #2563eb !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35) !important;
    }

    .submit-btn:active:not([disabled]) {
      transform: translateY(0px);
    }

    .submit-btn[disabled] {
      background: #cbd5e1 !important;
      color: #94a3b8 !important;
      box-shadow: none !important;
      cursor: not-allowed;
    }

    .loading-text {
      display: inline-flex;
      align-items: center;
    }

    /* Responsividad */
    @media (max-width: 850px) {
      .login-box {
        width: 100%;
        max-width: 440px;
        height: auto;
        flex-direction: column;
        border-radius: 20px;
      }

      .login-visual {
        display: none;
      }

      .login-form-container {
        padding: 40px 28px;
      }

      .login-title {
        font-size: 1.6rem;
      }
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
