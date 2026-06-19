import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header" [ngClass]="data.type || 'warn'">
      <mat-icon class="dialog-icon">{{ data.icon || 'delete_forever' }}</mat-icon>
    </div>
    <h2 mat-dialog-title class="dialog-title">{{ data.title || 'Confirmar acción' }}</h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message">{{ data.message || '¿Estás seguro de realizar esta acción?' }}</p>
      <p class="dialog-warning" *ngIf="data.warning">
        <mat-icon class="warn-icon">warning</mat-icon>
        {{ data.warning }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button (click)="onNoClick()" class="cancel-btn">Cancelar</button>
      <button mat-flat-button [color]="data.type || 'warn'" [mat-dialog-close]="true" cdkFocusInitial class="confirm-btn">
        <mat-icon>{{ data.confirmIcon || 'delete' }}</mat-icon>
        {{ data.confirmText || 'Eliminar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 0 16px;
    }
    .dialog-header.warn .dialog-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: #f44336;
      background: #fdecea;
      border-radius: 50%;
      padding: 12px;
      box-sizing: content-box;
    }
    .dialog-header.primary .dialog-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: #1976d2;
      background: #e3f2fd;
      border-radius: 50%;
      padding: 12px;
      box-sizing: content-box;
    }
    .dialog-title {
      text-align: center;
      font-size: 20px !important;
      font-weight: 600 !important;
      margin: 0 24px 8px !important;
      padding: 0 !important;
      color: #1a1a2e;
    }
    .dialog-content {
      min-width: 340px;
      max-width: 440px;
      padding: 0 24px 8px !important;
    }
    .dialog-message {
      text-align: center;
      color: #555;
      font-size: 14.5px;
      line-height: 1.6;
      margin: 0 0 12px;
    }
    .dialog-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff8e1;
      border-left: 3px solid #ffc107;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 13px;
      color: #7a5c00;
      margin: 0;
    }
    .warn-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .dialog-actions {
      padding: 8px 16px 16px !important;
      gap: 8px;
    }
    .cancel-btn {
      min-width: 100px;
    }
    .confirm-btn {
      min-width: 120px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title?: string;
      message?: string;
      warning?: string;
      icon?: string;
      type?: 'warn' | 'primary';
      confirmText?: string;
      confirmIcon?: string;
    }
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
