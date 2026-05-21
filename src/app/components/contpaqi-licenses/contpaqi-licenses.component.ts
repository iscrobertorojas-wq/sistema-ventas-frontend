import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmación</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(true)">Aceptar</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}
}

@Component({
  selector: 'app-date-prompt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, CommonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p *ngIf="data.message">{{ data.message }}</p>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 10px;">
        <mat-label>Fecha</mat-label>
        <input matInput type="date" [(ngModel)]="dateValue" required>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!dateValue" (click)="dialogRef.close(dateValue)">Aceptar</button>
    </mat-dialog-actions>
  `
})
export class DatePromptDialogComponent {
  dateValue: string;
  constructor(
    public dialogRef: MatDialogRef<DatePromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message?: string, defaultDate: string }
  ) {
    this.dateValue = data.defaultDate;
  }
}

@Component({
  selector: 'app-contpaqi-licenses',
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
    MatChipsModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatDialogModule
  ],
  templateUrl: './contpaqi-licenses.component.html',
  styleUrl: './contpaqi-licenses.component.css'
})
export class ContpaqiLicensesComponent implements OnInit {
  licenses: any[] = [];
  clients: any[] = [];
  products: any[] = [];

  displayedColumns: string[] = [
    'serial_number',
    'client_name',
    'product_description',
    'users_count',
    'expiration_date',
    'days_remaining',
    'contact_name',
    'contact_phone',
    'status',
    'renewal_date',
    'actions'
  ];

  searchTerm: string = '';
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  availableYears: number[] = [];
  isEditing: boolean = false;
  showForm: boolean = false;

  clientSearchTerm: string = '';
  filteredClients: any[] = [];

  months = [
    { value: 0, name: 'Ene' },
    { value: 1, name: 'Feb' },
    { value: 2, name: 'Mar' },
    { value: 3, name: 'Abr' },
    { value: 4, name: 'May' },
    { value: 5, name: 'Jun' },
    { value: 6, name: 'Jul' },
    { value: 7, name: 'Ago' },
    { value: 8, name: 'Sep' },
    { value: 9, name: 'Oct' },
    { value: 10, name: 'Nov' },
    { value: 11, name: 'Dic' }
  ];

  newLicense: any = {
    id: null,
    serial_number: '',
    client_id: null,
    product_id: null,
    users_count: 1,
    expiration_date: '',
    contact_name: '',
    contact_phone: '',
    is_renewed_current_year: false,
    renewal_date: ''
  };

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadLicenses();
    this.loadClients();
    this.loadProducts();
    this.selectedYear = new Date().getFullYear(); // Default to current year filter
  }

  loadLicenses() {
    this.api.getContpaqiLicenses().subscribe({
      next: (data) => {
        this.licenses = data;
        this.updateAvailableYears();
      },
      error: (err) => console.error('Error loading licenses', err)
    });
  }

  loadClients() {
    this.api.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
      },
      error: (err) => console.error('Error loading clients', err)
    });
  }

  onClientSearch() {
    const searchTerm = typeof this.clientSearchTerm === 'string' ? this.clientSearchTerm : '';
    const filterValue = searchTerm.toLowerCase();

    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(filterValue)
    );
    
    if (!searchTerm) {
      this.newLicense.client_id = null;
    }
  }

  selectClient(event: any) {
    const selectedClient = event.option.value;
    this.newLicense.client_id = selectedClient.id;
    this.clientSearchTerm = selectedClient.name;
  }

  loadProducts() {
    this.api.getContpaqiProducts().subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Error loading products', err)
    });
  }

  updateAvailableYears() {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear, currentYear - 1, currentYear + 1, currentYear + 2]);
    this.licenses.forEach(l => {
      if (l.expiration_date) {
        const y = new Date(l.expiration_date).getFullYear();
        if (!isNaN(y)) {
          yearsSet.add(y);
        }
      }
    });
    this.availableYears = Array.from(yearsSet).sort((a, b) => a - b);
  }

  // Parse a date string "YYYY-MM-DD" using local time to avoid UTC timezone shifts
  private parseLocalDate(dateStr: string): Date {
    if (!dateStr) return new Date(NaN);
    // MySQL returns dates as ISO strings like "2026-05-15T00:00:00.000Z" or "2026-05-15"
    const parts = dateStr.substring(0, 10).split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  getDaysRemaining(license: any): number | null {
    if (!license.expiration_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = this.parseLocalDate(license.expiration_date);
    if (isNaN(expDate.getTime())) return null;
    const diffMs = expDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  get filteredLicenses() {
    return this.licenses.filter(license => {
      // Search filter
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        license.serial_number?.toLowerCase().includes(searchLower) ||
        license.client_name?.toLowerCase().includes(searchLower) ||
        license.product_description?.toLowerCase().includes(searchLower) ||
        license.contact_name?.toLowerCase().includes(searchLower);

      let matchesDate = true;
      if (license.expiration_date) {
        const expDate = this.parseLocalDate(license.expiration_date);
        const monthMatches = this.selectedMonth === null || expDate.getMonth() === this.selectedMonth;
        const yearMatches = this.selectedYear === null || expDate.getFullYear() === this.selectedYear;
        matchesDate = monthMatches && yearMatches;
      } else {
        if (this.selectedMonth !== null || this.selectedYear !== null) {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }

  selectMonth(monthVal: number) {
    if (this.selectedMonth === monthVal) {
      this.selectedMonth = null; // Toggle off
    } else {
      this.selectedMonth = monthVal;
    }
  }

  clearFilters() {
    this.selectedMonth = null;
    this.selectedYear = null;
    this.searchTerm = '';
  }

  toggleForm(form?: NgForm) {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm(form);
    }
  }

  saveLicense(form?: NgForm) {
    if (!this.newLicense.client_id) {
      this.snackBar.open('Por favor, selecciona un cliente válido de la lista.', 'Cerrar', { duration: 4000 });
      return;
    }

    const lData = {
      ...this.newLicense,
      is_renewed_current_year: this.newLicense.is_renewed_current_year ? 1 : 0
    };

    const request = this.isEditing
      ? this.api.updateContpaqiLicense(lData)
      : this.api.createContpaqiLicense(lData);

    request.subscribe({
      next: () => {
        this.loadLicenses();
        this.snackBar.open(this.isEditing ? 'Licencia actualizada con éxito' : 'Licencia agregada con éxito', 'Cerrar', { duration: 3000 });
        this.resetForm(form);
      },
      error: (err) => {
        console.error('Error saving license', err);
        const errorMsg = err.error?.error || 'Error al guardar la licencia';
        this.snackBar.open(errorMsg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Format a date field (ISO string or Date) to YYYY-MM-DD for input[type=date]
  private formatDateForInput(dateVal: any): string {
    if (!dateVal) return '';
    return String(dateVal).substring(0, 10);
  }

  // Handle checkbox change to prompt for renewal date when checked
  onRenewedChange(event: any) {
    const isChecked = event.target?.checked;
    if (isChecked && !this.newLicense.renewal_date) {
      const today = new Date().toISOString().substring(0, 10);
      
      const dialogRef = this.dialog.open(DatePromptDialogComponent, {
        width: '350px',
        data: { title: 'Fecha de Renovación', defaultDate: today }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== null && result !== undefined) {
          this.newLicense.renewal_date = result;
        } else {
          // User cancelled, uncheck the box
          this.newLicense.is_renewed_current_year = false;
        }
      });
    }
    if (!isChecked) {
      this.newLicense.renewal_date = '';
    }
  }

  editLicense(license: any) {
    this.newLicense = {
      id: license.id,
      serial_number: license.serial_number,
      client_id: license.client_id,
      product_id: license.product_id,
      users_count: license.users_count,
      expiration_date: this.formatDateForInput(license.expiration_date),
      contact_name: license.contact_name,
      contact_phone: license.contact_phone,
      is_renewed_current_year: license.is_renewed_current_year === 1,
      renewal_date: this.formatDateForInput(license.renewal_date)
    };

    const client = this.clients.find(c => c.id === license.client_id);
    this.clientSearchTerm = client ? client.name : license.client_name;

    this.isEditing = true;
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleQuickRenewal(license: any) {
    const isCurrentlyRenewed = license.is_renewed_current_year === 1;
    const actionText = isCurrentlyRenewed ? 'desmarcar como renovada' : 'marcar como renovada';

    const confirmDialog = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `¿Estás seguro de que deseas ${actionText} la licencia ${license.serial_number}?` }
    });

    confirmDialog.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      if (!isCurrentlyRenewed) {
        const today = new Date().toISOString().substring(0, 10);
        const dateDialog = this.dialog.open(DatePromptDialogComponent, {
          width: '350px',
          data: { 
            title: 'Fecha de Renovación',
            message: `Ingresa la fecha en que se renovó la licencia ${license.serial_number}:`,
            defaultDate: today 
          }
        });

        dateDialog.afterClosed().subscribe(result => {
          if (result === null || result === undefined) return;
          this.executeToggleRenewal(license, result);
        });
      } else {
        this.executeToggleRenewal(license, undefined);
      }
    });
  }

  private executeToggleRenewal(license: any, renewalDate: string | undefined) {
    this.api.updateContpaqiLicense({ id: license.id, toggleRenewal: true, renewalDate }).subscribe({
      next: (res: any) => {
        this.loadLicenses();
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error toggling renewal', err);
        this.snackBar.open('Error al actualizar el estado de renovación', 'Cerrar', { duration: 3000 });
      }
    });
  }

  quoteRenewal(license: any) {
    // Navigate to quotations with prefill query params
    const renewDesc = `Renovación de Licencia ${license.product_description} (Serie: ${license.serial_number})`;
    this.router.navigate(['/quotations'], {
      queryParams: {
        clientId: license.client_id,
        productName: renewDesc,
        price: license.product_price
      }
    });
  }

  deleteLicense(license: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `¿Estás seguro de que deseas eliminar la licencia con número de serie "${license.serial_number}"?` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteContpaqiLicense(license.id).subscribe({
          next: () => {
            this.loadLicenses();
            this.snackBar.open('Licencia eliminada', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            console.error('Error deleting license', err);
            this.snackBar.open('Error al eliminar la licencia', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  cancelEdit(form?: NgForm) {
    this.resetForm(form);
  }

  resetForm(form?: NgForm) {
    if (form) {
      form.resetForm();
    }
    this.newLicense = {
      id: null,
      serial_number: '',
      client_id: null,
      product_id: null,
      users_count: 1,
      expiration_date: '',
      contact_name: '',
      contact_phone: '',
      is_renewed_current_year: false,
      renewal_date: ''
    };
    this.clientSearchTerm = '';
    this.isEditing = false;
    this.showForm = false;
  }
}
