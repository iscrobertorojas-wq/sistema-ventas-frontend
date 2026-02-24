import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PendingSalesDialogComponent } from './pending-sales-dialog/pending-sales-dialog.component';

@Component({
  selector: 'app-clients',
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
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent implements OnInit {
  clients: any[] = [];
  displayedColumns: string[] = ['id', 'name', 'phone', 'address', 'pending_balance', 'actions'];
  searchTerm: string = '';
  isEditing: boolean = false;

  newClient: any = {
    name: '',
    phone: '',
    address: ''
  };

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadClients();
  }

  get filteredClients() {
    return this.clients.filter(client =>
      client.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadClients() {
    this.api.getClients().subscribe({
      next: (data) => this.clients = data,
      error: (err) => console.error('Error loading clients', err)
    });
  }

  saveClient() {
    if (!this.newClient.name) return;

    const request = this.isEditing
      ? this.api.updateClient(this.newClient)
      : this.api.createClient(this.newClient);

    request.subscribe({
      next: (res) => {
        this.loadClients();
        this.resetForm();
        this.snackBar.open(this.isEditing ? 'Cliente actualizado' : 'Cliente agregado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        if (err.status === 409) {
          this.snackBar.open('Error: El nombre del cliente ya existe', 'Cerrar', { duration: 5000 });
        } else {
          console.error('Error saving client', err);
          this.snackBar.open('Error al guardar el cliente', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  editClient(client: any) {
    this.newClient = { ...client };
    this.isEditing = true;
  }

  cancelEdit() {
    this.resetForm();
  }

  resetForm() {
    this.newClient = { name: '', phone: '', address: '' };
    this.isEditing = false;
  }

  deleteClient(client: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${client.name}"?`)) {
      this.api.deleteClient(client.id).subscribe({
        next: () => {
          this.loadClients();
          this.snackBar.open('Cliente eliminado', 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error deleting client', err);
          const message = err.error?.error || 'Error al eliminar el cliente';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  openPendingSalesDialog(client: any) {
    if (client.pending_balance <= 0) return;

    this.dialog.open(PendingSalesDialogComponent, {
      data: { client },
      width: '600px'
    });
  }
}
