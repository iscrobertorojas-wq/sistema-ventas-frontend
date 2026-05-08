import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-utility-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDividerModule,
    MatSortModule
  ],
  templateUrl: './utility-report.component.html',
  styleUrl: './utility-report.component.css'
})
export class UtilityReportComponent implements OnInit {
  payments: any[] = [];
  purchases: any[] = [];
  
  // Totals
  totalPaid: number = 0;
  totalPurchases: number = 0;
  totalIVA: number = 0;
  totalIVAPurchases: number = 0;
  utility: number = 0;

  // Filters
  startDate: Date | null = null;
  endDate: Date | null = null;
  activeFilterLabel: string = 'general';

  paymentColumns: string[] = ['date', 'client', 'total', 'subtotal', 'iva'];
  purchaseColumns: string[] = ['date', 'supplier', 'total', 'subtotal', 'iva'];

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(start?: string, end?: string) {
    // Load Payments
    this.api.getPayments(start, end).subscribe({
      next: (data) => {
        this.payments = data.map(p => {
          const total = parseFloat(p.amount) || 0;
          let subtotal = 0;
          let iva = 0;

          // Logic for IVA/Subtotal: Transfer or Check to Rober BBVA
          if ((p.method === 'Transfer' || p.method === 'Check') && p.bank_account === 'Rober BBVA') {
            subtotal = total / 1.16;
            iva = total - subtotal;
          }

          return {
            ...p,
            total,
            subtotal,
            iva,
            formatted_date: this.formatDate(p.date)
          };
        });
        this.calculateTotals();
      },
      error: (err) => this.handleError('Error al cargar pagos', err)
    });

    // Load Purchases
    this.api.getPurchases(start, end).subscribe({
      next: (data) => {
        this.purchases = data.map(p => {
          const total = parseFloat(p.total) || 0;
          const subtotal = total / 1.16;
          const iva = total - subtotal;

          return {
            ...p,
            total,
            subtotal,
            iva,
            formatted_date: this.formatDate(p.date)
          };
        });
        this.calculateTotals();
      },
      error: (err) => this.handleError('Error al cargar compras', err)
    });
  }

  calculateTotals() {
    this.totalPaid = this.payments.reduce((sum, p) => sum + p.total, 0);
    this.totalIVA = this.payments.reduce((sum, p) => sum + p.iva, 0);
    this.totalPurchases = this.purchases.reduce((sum, p) => sum + p.total, 0);
    this.totalIVAPurchases = this.purchases.reduce((sum, p) => sum + p.iva, 0);
    this.utility = this.totalPaid - this.totalPurchases;
  }

  applyDateFilters() {
    if (this.startDate && this.endDate) {
      if (this.activeFilterLabel === 'general') {
        this.activeFilterLabel = `del ${this.formatDate(this.formatDateForAPI(this.startDate))} al ${this.formatDate(this.formatDateForAPI(this.endDate))}`;
      }
      this.loadData(this.formatDateForAPI(this.startDate), this.formatDateForAPI(this.endDate));
    }
  }

  filterThisWeek() {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    this.startDate = firstDay;
    this.endDate = lastDay;
    this.activeFilterLabel = 'de esta semana';
    this.applyDateFilters();
  }

  filterThisMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.startDate = firstDay;
    this.endDate = lastDay;
    this.activeFilterLabel = 'de este mes';
    this.applyDateFilters();
  }

  filterThisYear() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    this.startDate = firstDay;
    this.endDate = lastDay;
    this.activeFilterLabel = 'de este año';
    this.applyDateFilters();
  }

  clearFilters() {
    this.startDate = null;
    this.endDate = null;
    this.activeFilterLabel = 'general';
    this.loadData();
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private handleError(message: string, error: any) {
    console.error(message, error);
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}
