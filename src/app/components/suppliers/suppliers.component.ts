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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-suppliers',
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
    MatSnackBarModule
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent implements OnInit {
  suppliers: any[] = [];
  displayedColumns: string[] = ['id', 'name', 'phone', 'address', 'actions'];
  searchTerm: string = '';
  isEditing: boolean = false;

  newSupplier: any = {
    name: '',
    phone: '',
    address: ''
  };

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  get filteredSuppliers() {
    return this.suppliers.filter(s =>
      s.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadSuppliers() {
    this.api.getSuppliers().subscribe({
      next: (data) => this.suppliers = data,
      error: (err) => console.error('Error loading suppliers', err)
    });
  }

  saveSupplier() {
    if (!this.newSupplier.name) return;

    const request = this.isEditing
      ? this.api.updateSupplier(this.newSupplier)
      : this.api.createSupplier(this.newSupplier);

    request.subscribe({
      next: () => {
        this.loadSuppliers();
        this.resetForm();
        this.snackBar.open(
          this.isEditing ? 'Proveedor actualizado' : 'Proveedor agregado',
          'Cerrar', { duration: 3000 }
        );
      },
      error: (err) => {
        if (err.status === 409) {
          this.snackBar.open('Error: El nombre del proveedor ya existe', 'Cerrar', { duration: 5000 });
        } else {
          this.snackBar.open('Error al guardar el proveedor', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  editSupplier(supplier: any) {
    this.newSupplier = { ...supplier };
    this.isEditing = true;
  }

  cancelEdit() {
    this.resetForm();
  }

  resetForm() {
    this.newSupplier = { name: '', phone: '', address: '' };
    this.isEditing = false;
  }

  deleteSupplier(supplier: any) {
    if (confirm(`¿Deseas eliminar al proveedor "${supplier.name}"?`)) {
      this.api.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.loadSuppliers();
          this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          const message = err.error?.error || 'Error al eliminar el proveedor';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
}
