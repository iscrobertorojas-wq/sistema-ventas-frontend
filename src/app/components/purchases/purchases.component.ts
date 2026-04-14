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

  displayedColumns: string[] = ['date', 'supplier_name', 'items_description', 'total', 'actions'];

  // New purchase form
  newPurchase: any = {
    supplier_id: null,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
  
  purchaseItems: any[] = [];
  currentDescription: string = '';
  currentCost: number | null = null;

  isSaving = false;
  isEditing = false;
  editPurchaseId: number | null = null;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadPurchases();
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

  loadPurchaseForEdit(id: number) {
    this.api.getPurchaseById(id).subscribe({
      next: (purchase) => {
        this.isEditing = true;
        this.editPurchaseId = id;
        this.newPurchase = {
          supplier_id: purchase.supplier_id,
          date: new Date(purchase.date).toISOString().split('T')[0],
          notes: purchase.notes || ''
        };
        this.purchaseItems = purchase.items.map((item: any) => ({
          description: item.description,
          cost: item.cost
        }));
        // Scroll to top to see the form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.snackBar.open('Error al cargar la compra para editar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  addItem() {
    if (!this.currentDescription?.trim() || !this.currentCost || this.currentCost <= 0) {
      this.snackBar.open('Ingresa una descripción y un costo válido', 'Cerrar', { duration: 2000 });
      return;
    }

    this.purchaseItems = [...this.purchaseItems, {
      description: this.currentDescription.trim(),
      cost: this.currentCost
    }];

    this.currentDescription = '';
    this.currentCost = null;
  }

  removeItem(index: number) {
    this.purchaseItems.splice(index, 1);
    this.purchaseItems = [...this.purchaseItems];
  }

  get purchaseTotal(): number {
    return this.purchaseItems.reduce((sum: number, item: any) => sum + parseFloat(item.cost), 0);
  }

  get isFormValid(): boolean {
    return !!this.newPurchase.supplier_id && !!this.newPurchase.date && this.purchaseItems.length > 0;
  }

  savePurchase() {
    if (!this.isFormValid || this.isSaving) return;
    this.isSaving = true;

    const payload = {
      id: this.editPurchaseId,
      supplier_id: this.newPurchase.supplier_id,
      date: this.newPurchase.date,
      notes: this.newPurchase.notes,
      items: this.purchaseItems
    };

    const request = this.isEditing ? this.api.updatePurchase(payload) : this.api.createPurchase(payload);

    request.subscribe({
      next: () => {
        this.loadPurchases();
        this.resetForm();
        this.snackBar.open(`Compra ${this.isEditing ? 'actualizada' : 'registrada'} correctamente`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        const message = err.error?.error || 'Error al procesar la compra';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      },
      complete: () => { this.isSaving = false; }
    });
  }

  resetForm() {
    this.newPurchase = {
      supplier_id: null,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    this.purchaseItems = [];
    this.currentDescription = '';
    this.currentCost = null;
    this.isSaving = false;
    this.isEditing = false;
    this.editPurchaseId = null;
  }
}
