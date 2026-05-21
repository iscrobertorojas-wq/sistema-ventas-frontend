import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule, NgForm } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-contpaqi-products',
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
  templateUrl: './contpaqi-products.component.html',
  styleUrl: './contpaqi-products.component.css'
})
export class ContpaqiProductsComponent implements OnInit {
  products: any[] = [];
  displayedColumns: string[] = ['id', 'description', 'price', 'actions'];
  searchTerm: string = '';
  isEditing: boolean = false;

  newProduct: any = {
    id: null,
    description: '',
    price: 0
  };

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  get filteredProducts() {
    return this.products.filter(product =>
      product.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadProducts() {
    this.api.getContpaqiProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error loading Contpaqi products', err)
    });
  }

  saveProduct(form?: NgForm) {
    if (!this.newProduct.description || this.newProduct.price === null || this.newProduct.price === undefined) return;

    const request = this.isEditing
      ? this.api.updateContpaqiProduct(this.newProduct)
      : this.api.createContpaqiProduct(this.newProduct);

    request.subscribe({
      next: () => {
        this.loadProducts();
        this.snackBar.open(this.isEditing ? 'Producto actualizado' : 'Producto agregado', 'Cerrar', { duration: 3000 });
        this.resetForm(form);
      },
      error: (err) => {
        console.error('Error saving product', err);
        this.snackBar.open('Error al guardar el producto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editProduct(product: any) {
    this.newProduct = { ...product };
    this.isEditing = true;
  }

  cancelEdit(form?: NgForm) {
    this.resetForm(form);
  }

  resetForm(form?: NgForm) {
    if (form) {
      form.resetForm();
    }
    this.newProduct = { id: null, description: '', price: 0 };
    this.isEditing = false;
  }

  deleteProduct(product: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${product.description}"?\nSe eliminarán todas las licencias asociadas a este producto.`)) {
      this.api.deleteContpaqiProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
          this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error deleting product', err);
          this.snackBar.open('Error al eliminar el producto', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
