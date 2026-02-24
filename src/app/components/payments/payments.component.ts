import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatOptionModule,
    MatListModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit {
  sales: any[] = [];
  filteredSales: any[] = [];
  displayedColumns: string[] = ['folio', 'date', 'client', 'total', 'status', 'actions'];

  statusFilter: 'all' | 'pending' | 'paid' = 'all';
  searchFolio: string = '';

  selectedSale: any = null;
  payments: any[] = [];

  newPayment = {
    id: null as number | null,
    amount: 0,
    method: 'Cash',
    bank_account: '',
    date: new Date()
  };

  maxPaymentAmount: number = 0;
  isEditing: boolean = false;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales() {
    this.api.getSales().subscribe(data => {
      this.sales = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredSales = this.sales.filter(sale => {
      // Status Filter
      const totalPaid = sale.paid_amount || 0; // Assuming API returns paid_amount or we calculate it? 
      // API currently returns payments separately. getSales returns sales join status.
      // Wait, getSales result has 'status'. 
      // 'Paid' -> status === 'Paid'
      // 'Pending' -> status === 'Pending' || status === 'Partial'

      // Let's rely on the sale.status field, but normalize it for our "Simplified" view
      // ALSO, trust the calculated paid_amount from backend more than the status string if they differ
      const isConfiguredPaid = sale.paid_amount >= sale.total - 0.01;
      let simplifiedStatus = isConfiguredPaid ? 'paid' : 'pending';

      // Override the visual status for the table if needed (optional, but good for consistency)
      if (isConfiguredPaid) sale.status = 'Paid';

      const matchesStatus = this.statusFilter === 'all' || simplifiedStatus === this.statusFilter;

      // Search Filter
      const term = this.searchFolio.toLowerCase();
      const matchesSearch = !term || (sale.folio && sale.folio.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }

  selectSale(sale: any) {
    this.selectedSale = sale;
    this.cancelEdit(); // Reset form
    this.api.getPayments().subscribe(data => {
      this.payments = data.filter(p => p.sale_id === sale.id);
      this.calculateMaxAmount();
    });
  }

  calculateMaxAmount() {
    if (!this.selectedSale) return;
    const totalPaid = this.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const balance = this.selectedSale.total - totalPaid;

    // If editing, we add back the current payment amount to the balance
    let currentEditingAmount = 0;
    if (this.isEditing && this.newPayment.amount) {
      // This logic is tricky because newPayment.amount is bound to input.
      // We need the original amount of the payment being edited.
      // Let's simplify: Max Amount = Balance + (isEditing ? OriginalAmount : 0)
      // Actually, simpler: Backend validates. Frontend just shows hint.
      // Let's set maxPaymentAmount to Balance.
    }

    this.maxPaymentAmount = balance > 0 ? balance : 0;

    if (!this.isEditing) {
      this.newPayment.amount = this.maxPaymentAmount;
    }
  }

  registerPayment() {
    if (!this.selectedSale || this.newPayment.amount <= 0) return;

    if (this.newPayment.amount > this.maxPaymentAmount + 0.01) {
      this.snackBar.open('La cantidad ingresada excede el saldo pendiente', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.isEditing) {
      this.updatePayment();
      return;
    }

    const paymentData = {
      sale_id: this.selectedSale.id,
      amount: this.newPayment.amount,
      method: this.newPayment.method,
      bank_account: this.newPayment.bank_account,
      date: this.newPayment.date // Send date
    };

    this.api.registerPayment(paymentData).subscribe({
      next: (res) => {
        this.snackBar.open('Pago registrado', 'Cerrar', { duration: 3000 });
        this.refreshData();
      },
      error: (err) => {
        console.error('Error registering payment', err);
        this.snackBar.open(err.error?.error || 'Error al registrar pago', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editPayment(payment: any) {
    this.isEditing = true;
    this.newPayment = {
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      bank_account: payment.bank_account,
      date: new Date(payment.date) // Set existing date
    };

    // Calculate max allowed for this edit (Balance + Current Payment Amount)
    const totalPaidOthers = this.payments
      .filter(p => p.id !== payment.id)
      .reduce((acc, p) => acc + parseFloat(p.amount), 0);

    this.maxPaymentAmount = this.selectedSale.total - totalPaidOthers;
  }

  updatePayment() {
    this.api.updatePayment(this.newPayment).subscribe({
      next: () => {
        this.snackBar.open('Pago actualizado', 'Cerrar', { duration: 3000 });
        this.refreshData();
      },
      error: (err) => {
        console.error('Error updating payment', err);
        this.snackBar.open(err.error?.error || 'Error al actualizar pago', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deletePayment(id: number) {
    if (!confirm('¿Estás seguro de eliminar este pago?')) return;

    this.api.deletePayment(id).subscribe({
      next: () => {
        this.snackBar.open('Pago eliminado', 'Cerrar', { duration: 3000 });
        this.refreshData();
      },
      error: (err) => console.error('Error deleting payment', err)
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.newPayment = { id: null, amount: 0, method: 'Cash', bank_account: '', date: new Date() };
    this.calculateMaxAmount();
  }

  refreshData() {
    this.loadSales();
    if (this.selectedSale) {
      // We need to re-fetch totals to have accurate balance calculation
      this.api.getSales().subscribe(sales => {
        this.sales = sales;
        const updatedSale = this.sales.find(s => s.id === this.selectedSale.id);
        if (updatedSale) {
          this.selectSale(updatedSale);
        }
      });
    }
  }
}
