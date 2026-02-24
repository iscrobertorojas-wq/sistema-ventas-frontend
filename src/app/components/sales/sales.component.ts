import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PdfService } from '../../services/pdf.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements OnInit {
  clients: any[] = [];
  services: any[] = [];
  selectedClient: any = null;
  selectedService: any = null;
  saleType: string = '';
  saleItems: any[] = [];

  // Autocomplete
  clientSearchTerm: string = '';
  filteredClients: any[] = [];

  currentPrice: number = 0;
  currentNotes: string = '';
  observations: string = '';
  today: Date = new Date();
  nextFolio: string = '';
  isEditing: boolean = false;
  saleId: number | null = null;
  settings: any = null;

  displayedColumns: string[] = ['service', 'price', 'notes', 'actions'];

  constructor(
    private api: ApiService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadServices();
    this.loadGlobalSettings();

    // Check for edit mode
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.saleId = +params['id'];
        this.loadSaleForEdit(this.saleId);
      }
    });
  }

  loadSaleForEdit(id: number) {
    this.api.getSaleById(id).subscribe({
      next: (sale) => {
        // Find client
        this.selectedClient = this.clients.find(c => c.id === sale.client_id) || { id: sale.client_id, name: sale.client_name };
        this.clientSearchTerm = this.selectedClient.name;
        this.saleType = sale.type;
        this.today = new Date(sale.date);
        this.nextFolio = sale.folio;
        this.observations = sale.observations || '';

        // Map items
        this.saleItems = sale.items.map((item: any) => ({
          service_id: item.service_id,
          description: item.description || '', // Backend might need to join description
          price: item.price,
          notes: item.notes
        }));

        // If items don't have descriptions, we need to find them from this.services
        // Since loadServices might still be running, we might need to wait or re-match later
        this.matchServiceDescriptions();
      },
      error: (err) => {
        this.snackBar.open('Error al cargar la venta para editar', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/reports']);
      }
    });
  }

  matchServiceDescriptions() {
    if (this.services.length > 0 && this.saleItems.length > 0) {
      this.saleItems.forEach(item => {
        if (!item.description) {
          const service = this.services.find(s => s.id === item.service_id);
          if (service) item.description = service.description;
        }
      });
    }
  }

  loadClients() {
    this.api.getClients().subscribe(data => {
      this.clients = data;
      this.filteredClients = data;
    });
  }

  onClientSearch() {
    // Ensure we handle cases where it might not be a string (though it should be)
    const searchTerm = typeof this.clientSearchTerm === 'string' ? this.clientSearchTerm : '';
    const filterValue = searchTerm.toLowerCase();

    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(filterValue)
    );
    // If user clears the input, clear the selection
    if (!searchTerm) {
      this.selectedClient = null;
    }
  }

  selectClient(event: any) {
    this.selectedClient = event.option.value;
    this.clientSearchTerm = this.selectedClient.name;
    // Trigger folio update if type is already selected
    if (this.saleType) this.onSaleTypeChange();
  }

  displayClient(client: any): string {
    return client ? client.name : '';
  }

  loadServices() {
    this.api.getServices().subscribe(data => {
      this.services = data;
      if (this.isEditing) this.matchServiceDescriptions();
    });
  }

  loadGlobalSettings() {
    this.api.getSettings().subscribe(settings => this.settings = settings);
  }

  onSaleTypeChange() {
    if (!this.saleType) {
      this.nextFolio = '';
      return;
    }

    this.api.getSettings().subscribe({
      next: (settings) => {
        const settingKey = this.saleType === 'Invoice' ? 'folio_invoice' : 'folio_remission';
        const currentFolio = settings[settingKey] || '1';
        const prefix = this.saleType === 'Invoice' ? 'F' : 'R';
        this.nextFolio = `${prefix}-${currentFolio}`;
      },
      error: (err) => console.error('Error loading folio:', err)
    });
  }


  onServiceChange() {
    if (this.selectedService) {
      this.currentPrice = this.selectedService.price;
    }
  }

  addItem() {
    if (!this.selectedService || this.currentPrice <= 0) return;

    this.saleItems = [...this.saleItems, {
      service_id: this.selectedService.id,
      description: this.selectedService.description,
      price: this.currentPrice,
      notes: this.currentNotes
    }];

    this.selectedService = null;
    this.currentPrice = 0;
    this.currentNotes = '';
  }

  removeItem(index: number) {
    this.saleItems.splice(index, 1);
    this.saleItems = [...this.saleItems];
  }

  getTotal(): number {
    return this.saleItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  }

  saveSale() {
    if (!this.selectedClient || this.saleItems.length === 0) return;

    const saleData = {
      id: this.saleId,
      client_id: this.selectedClient.id,
      type: this.saleType,
      items: this.saleItems,
      date: this.today,
      observations: this.observations
    };

    const request = this.isEditing ? this.api.updateSale(saleData) : this.api.createSale(saleData);

    request.subscribe({
      next: (res) => {
        const folio = res.folio || this.nextFolio;
        this.snackBar.open(`Venta ${this.isEditing ? 'actualizada' : 'guardada'} con éxito. Folio: ${folio}`, 'Cerrar', { duration: 5000 });

        if (this.saleType === 'Remission') {
          this.pdfService.generateSalePdf(
            { id: res.id || this.saleId, folio: res.folio || folio, type: this.saleType, date: this.today, observations: this.observations },
            this.saleItems,
            this.selectedClient,
            this.settings
          );
        }

        if (this.isEditing) {
          this.router.navigate(['/reports']);
        } else {
          this.startNewSale();
        }
      },
      error: (err) => {
        console.error('Error saving/updating sale', err);
        this.snackBar.open(err.error?.error || 'Error al procesar la venta', 'Cerrar', { duration: 3000 });
      }
    });
  }

  startNewSale() {
    this.selectedClient = null;
    this.clientSearchTerm = '';
    this.selectedService = null;
    this.saleType = '';
    this.saleItems = [];
    this.currentPrice = 0;
    this.currentNotes = '';
    this.nextFolio = '';
    this.observations = '';
  }
}
