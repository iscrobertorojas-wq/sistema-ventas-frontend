import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-purchases',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.css'
})
export class PurchasesComponent implements OnInit {
  suppliers: any[] = [];
  purchases: any[] = [];

  displayedColumns: string[] = ['date', 'supplier_name', 'notes', 'total'];

  // New purchase form
  newPurchase: any = {
    supplier_id: null,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  };

  isSaving = false;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadPurchases();
    this.addItem(); // Start with one empty item
  }

  loadSuppliers() {
    this.api.getSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Error loading suppliers', err)
    });
  }

  loadPurchases() {
    this.api.getPurchases().subscribe({
      next: (data) => this.purchases = data,
      error: (err) => console.error('Error loading purchases', err)
    });
  }

  addItem() {
    this.newPurchase.items.push({ description: '', cost: null });
  }

  removeItem(index: number) {
    if (this.newPurchase.items.length > 1) {
      this.newPurchase.items.splice(index, 1);
    }
  }

  get purchaseTotal(): number {
    return this.newPurchase.items.reduce((sum: number, item: any) => {
      const cost = parseFloat(item.cost);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
  }

  get isFormValid(): boolean {
    if (!this.newPurchase.supplier_id) return false;
    if (!this.newPurchase.date) return false;
    return this.newPurchase.items.every((item: any) =>
      item.description?.trim() && item.cost && parseFloat(item.cost) > 0
    );
  }

  savePurchase() {
    if (!this.isFormValid || this.isSaving) return;
    this.isSaving = true;

    const payload = {
      supplier_id: this.newPurchase.supplier_id,
      date: this.newPurchase.date,
      notes: this.newPurchase.notes,
      items: this.newPurchase.items.map((item: any) => ({
        description: item.description.trim(),
        cost: parseFloat(item.cost)
      }))
    };

    this.api.createPurchase(payload).subscribe({
      next: () => {
        this.loadPurchases();
        this.resetForm();
        this.snackBar.open('Compra registrada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err.error?.error || 'Error al registrar la compra';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      },
      complete: () => { this.isSaving = false; }
    });
  }

  resetForm() {
    this.newPurchase = {
      supplier_id: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ description: '', cost: null }]
    };
    this.isSaving = false;
  }
}
