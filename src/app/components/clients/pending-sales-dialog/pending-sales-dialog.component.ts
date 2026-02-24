import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-pending-sales-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>Ventas Pendientes - {{ data.client.name }}</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="pendingSales" class="mat-elevation-z0">
        <ng-container matColumnDef="folio">
          <th mat-header-cell *matHeaderCellDef> Folio </th>
          <td mat-cell *matCellDef="let sale"> {{ sale.folio }} </td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef> Fecha </th>
          <td mat-cell *matCellDef="let sale"> {{ sale.date | date:'dd/MM/yyyy' }} </td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef> Total </th>
          <td mat-cell *matCellDef="let sale"> {{ sale.total | currency }} </td>
        </ng-container>

        <ng-container matColumnDef="paid">
          <th mat-header-cell *matHeaderCellDef> Pagado </th>
          <td mat-cell *matCellDef="let sale"> {{ sale.paid_amount | currency }} </td>
        </ng-container>

        <ng-container matColumnDef="balance">
          <th mat-header-cell *matHeaderCellDef> Saldo </th>
          <td mat-cell *matCellDef="let sale" class="balance-cell"> 
            {{ (sale.total - sale.paid_amount) | currency }} 
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div *ngIf="pendingSales.length === 0" class="no-data">
        No hay ventas con saldo pendiente para este cliente.
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Cerrar</button>
    </mat-dialog-actions>
  `,
    styles: [`
    table { width: 100%; }
    .balance-cell { font-weight: bold; color: #f44336; }
    .no-data { padding: 20px; text-align: center; color: #666; }
    mat-dialog-content { min-width: 500px; }
  `]
})
export class PendingSalesDialogComponent implements OnInit {
    pendingSales: any[] = [];
    displayedColumns: string[] = ['folio', 'date', 'total', 'paid', 'balance'];

    constructor(
        public dialogRef: MatDialogRef<PendingSalesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private api: ApiService
    ) { }

    ngOnInit(): void {
        this.api.getSales(undefined, undefined, this.data.client.id).subscribe({
            next: (sales) => {
                // Filter only sales with balance > 0
                this.pendingSales = sales.filter(s => (s.total - s.paid_amount) > 0.01);
            },
            error: (err) => console.error('Error loading pending sales', err)
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
