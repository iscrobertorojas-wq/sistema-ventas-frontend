import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-database-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="container animate-in">
      <mat-card class="header-card-global">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>backup</mat-icon>
            Respaldar / Restaurar Base de Datos
          </mat-card-title>
        </mat-card-header>
      </mat-card>

      <div class="management-grid">
        <!-- Backup Card -->
        <mat-card class="action-card hover-lift">
          <mat-card-header>
            <div class="icon-circle backup-bg">
              <mat-icon>save_alt</mat-icon>
            </div>
            <mat-card-title>Crear Respaldo</mat-card-title>
            <mat-card-subtitle>Descarga una copia completa de la base de datos en formato .sql</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Se generará un archivo con toda la información actual (ventas, clientes, servicios, pólizas, etc.).</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="onBackup()" [disabled]="isLoading">
              <mat-icon>download</mat-icon> RESPALDAR AHORA
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Restore Card -->
        <mat-card class="action-card hover-lift">
          <mat-card-header>
            <div class="icon-circle restore-bg">
              <mat-icon>settings_backup_restore</mat-icon>
            </div>
            <mat-card-title>Restaurar Información</mat-card-title>
            <mat-card-subtitle>Carga un archivo .sql para restaurar la base de datos</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="warn-text">
              <mat-icon>warning</mat-icon>
              <strong>ADVERTENCIA:</strong> Al restaurar, se sobrescribirá toda la información actual por la del respaldo.
            </p>
          </mat-card-content>
          <mat-card-actions align="end">
            <input type="file" #fileInput style="display: none" (change)="onFileSelected($event)" accept=".sql">
            <button mat-raised-button color="accent" (click)="fileInput.click()" [disabled]="isLoading">
              <mat-icon>upload_file</mat-icon> ELEGIR ARCHIVO Y RESTAURAR
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loading-content">
          <h3>Procesando...</h3>
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p>Por favor espere, no cierre esta ventana.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; max-width: 1000px; margin: 0 auto; }
    .management-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-top: 20px;
    }
    .action-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .icon-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 16px;
    }
    .icon-circle mat-icon { color: white; }
    .backup-bg { background-color: #1a73e8; }
    .restore-bg { background-color: #fbbc04; }
    
    .warn-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d32f2f;
      background-color: rgba(211, 47, 47, 0.05);
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.4;
    }
    .warn-text mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .loading-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .loading-content {
      background: var(--bg-card);
      padding: 30px;
      border-radius: 16px;
      width: 300px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .loading-content h3 { margin-top: 0; }

    body.dark-theme .warn-text {
      color: #ff8a80;
      background-color: rgba(255, 138, 128, 0.1);
    }
  `]
})
export class DatabaseManagementComponent {
  isLoading = false;

  constructor(private api: ApiService, private snackBar: MatSnackBar) { }

  onBackup() {
    this.isLoading = true;
    this.api.backupDatabase().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `Respaldo_Sistema_${timestamp}.sql`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.snackBar.open('Respaldo generado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error during backup:', err);
        this.isLoading = false;
        this.snackBar.open('Error al generar respaldo. Verifique que el servidor esté activo.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    if (confirm('¿Está seguro de que desea restaurar la base de datos? Se perderán todos los datos actuales.')) {
      this.isLoading = true;

      this.api.restoreDatabase(file).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.snackBar.open(res.message || 'Información restaurada con éxito', 'Cerrar', { duration: 5000 });
          // Reset input
          event.target.value = '';
        },
        error: (err) => {
          console.error('Error during restore:', err);
          this.isLoading = false;
          this.snackBar.open(err.error?.error || 'Error al restaurar información. Verifique el archivo y la conexión.', 'Cerrar', { duration: 5000 });
          event.target.value = '';
        }
      });
    } else {
      event.target.value = '';
    }
  }
}
