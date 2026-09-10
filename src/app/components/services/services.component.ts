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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-services',
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
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  services: any[] = [];
  displayedColumns: string[] = ['id', 'description', 'price', 'actions'];

  newService: any = {
    id: null,
    description: '',
    price: null
  };

  isEditing = false;
  isSaving = false;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices() {
    this.api.getServices().subscribe({
      next: (data) => this.services = data,
      error: (err) => {
        console.error('Error loading services', err);
        this.snackBar.open('Error al cargar los servicios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  saveService() {
    if (!this.newService.description?.trim() || this.newService.price === null || this.newService.price === undefined || this.newService.price < 0) {
      this.snackBar.open('Por favor ingresa una descripción y un precio válido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    const request = this.isEditing
      ? this.api.updateService({
          id: this.newService.id,
          description: this.newService.description.trim(),
          price: parseFloat(this.newService.price)
        })
      : this.api.createService({
          description: this.newService.description.trim(),
          price: parseFloat(this.newService.price)
        });

    request.subscribe({
      next: () => {
        this.snackBar.open(this.isEditing ? 'Servicio actualizado correctamente' : 'Servicio agregado correctamente', 'Cerrar', { duration: 3000 });
        this.loadServices();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error saving service', err);
        this.snackBar.open(err.error?.error || 'Error al guardar el servicio', 'Cerrar', { duration: 5000 });
      },
      complete: () => { this.isSaving = false; }
    });
  }

  editService(service: any) {
    this.isEditing = true;
    this.newService = {
      id: service.id,
      description: service.description,
      price: service.price
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newService = {
      id: null,
      description: '',
      price: null
    };
    this.isEditing = false;
    this.isSaving = false;
  }

  deleteService(service: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar servicio',
        message: `¿Estás seguro de que deseas eliminar el servicio "${service.description}"?`,
        warning: 'Esta acción no se puede deshacer.',
        icon: 'delete_forever',
        type: 'warn',
        confirmText: 'Eliminar',
        confirmIcon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.api.deleteService(service.id).subscribe({
        next: () => {
          this.snackBar.open('Servicio eliminado correctamente', 'Cerrar', { duration: 3000 });
          this.loadServices();
          if (this.isEditing && this.newService.id === service.id) {
            this.resetForm();
          }
        },
        error: (err) => {
          console.error('Error deleting service', err);
          const message = err.error?.error || 'Error al eliminar el servicio';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        }
      });
    });
  }
}
