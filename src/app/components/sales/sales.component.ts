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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

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
    MatAutocompleteModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule
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

  // Pestañas y listado
  selectedTab: number = 0;
  allSales: any[] = [];
  filteredSales: any[] = [];
  isLoadingList: boolean = false;
  // Si la edición se abrió desde Reportes (?id=), al terminar regresamos allá
  private returnToReports: boolean = false;

  // Filtro del listado
  filterType: 'all' | 'client' | 'services' | 'folio' = 'all';
  filterTerm: string = '';

  displayedColumns: string[] = ['service', 'price', 'notes', 'actions'];
  salesColumns: string[] = ['folio', 'date', 'type', 'client', 'services', 'total', 'status', 'actions'];

  constructor(
    private api: ApiService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadClients();
    this.loadServices();
    this.loadGlobalSettings();
    this.loadSales();

    // Check for edit mode
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.returnToReports = true;
        this.selectedTab = 0;
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
        this.cancelEdit();
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

    const wasEditing = this.isEditing;
    const request = this.isEditing ? this.api.updateSale(saleData) : this.api.createSale(saleData);

    request.subscribe({
      next: (res) => {
        const folio = res.folio || this.nextFolio;
        this.snackBar.open(`Venta ${wasEditing ? 'actualizada' : 'guardada'} con éxito. Folio: ${folio}`, 'Cerrar', { duration: 5000 });

        if (this.saleType === 'Remission') {
          this.pdfService.generateSalePdf(
            { id: res.id || this.saleId, folio: res.folio || folio, type: this.saleType, date: this.today, observations: this.observations },
            this.saleItems,
            this.selectedClient,
            this.settings
          );
        }

        this.loadSales();
        if (wasEditing) {
          this.finishEdit();
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
    this.today = new Date();
    this.isEditing = false;
    this.saleId = null;
  }

  cancelEdit() {
    this.finishEdit();
  }

  /** Sale del modo edición: regresa a Reportes si de ahí vino, o al listado de ventas. */
  private finishEdit() {
    this.startNewSale();
    if (this.returnToReports) {
      this.returnToReports = false;
      this.router.navigate(['/reports']);
      return;
    }
    this.selectedTab = 1;
  }

  // ===== Listado de ventas =====

  loadSales() {
    this.isLoadingList = true;
    this.api.getSales().subscribe({
      next: (data) => {
        this.allSales = data.map((s: any) => ({
          ...s,
          paid_amount: parseFloat(s.paid_amount) || 0,
          status_label: this.getStatusLabel(parseFloat(s.total) || 0, parseFloat(s.paid_amount) || 0)
        }));
        this.applyFilter();
        this.isLoadingList = false;
      },
      error: (err) => {
        console.error('Error loading sales', err);
        this.isLoadingList = false;
      }
    });
  }

  private getStatusLabel(total: number, paid: number): string {
    if (paid >= total - 0.01) return 'Pagado';
    if (paid > 0) return 'Parcial';
    return 'Pendiente';
  }

  private normalize(value: any): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  get filterPlaceholder(): string {
    switch (this.filterType) {
      case 'client': return 'Nombre del cliente';
      case 'services': return 'Servicio vendido';
      case 'folio': return 'Ej: R-120 o F-35';
      default: return 'Cliente, servicio o folio';
    }
  }

  applyFilter() {
    const term = this.normalize(this.filterTerm).trim();
    if (!term) {
      this.filteredSales = [...this.allSales];
      return;
    }
    this.filteredSales = this.allSales.filter(s => {
      const client = this.normalize(s.client_name);
      const services = this.normalize(s.services);
      const folio = this.normalize(s.folio);
      switch (this.filterType) {
        case 'client': return client.includes(term);
        case 'services': return services.includes(term);
        case 'folio': return folio.includes(term);
        default: return client.includes(term) || services.includes(term) || folio.includes(term);
      }
    });
  }

  clearFilter() {
    this.filterTerm = '';
    this.applyFilter();
  }

  get filteredTotal(): number {
    return this.filteredSales.reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0);
  }

  editSale(sale: any) {
    if (sale.paid_amount > 0) {
      this.snackBar.open('No se puede editar una venta con pagos registrados', 'Cerrar', { duration: 3000 });
      return;
    }
    this.returnToReports = false;
    this.isEditing = true;
    this.saleId = sale.id;
    this.selectedTab = 0;
    this.loadSaleForEdit(sale.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reprintSale(sale: any) {
    // Abrir la ventana de inmediato para evitar el bloqueador de ventanas emergentes
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write('<html><body style="margin:0;display:flex;align-items:center;justify-content:center;font-family:sans-serif;background:#f0f2f5;"><div style="text-align:center;"><h3>Generando Orden de Servicio...</h3><p>Por favor espere un momento.</p></div></body></html>');
    }

    this.api.getSaleById(sale.id).subscribe({
      next: (fullSale) => {
        if (!fullSale || !fullSale.items) {
          if (pdfWindow) pdfWindow.close();
          this.snackBar.open('No se encontraron los detalles de la venta', 'Cerrar', { duration: 3000 });
          return;
        }

        const clientObj = fullSale.client || {
          id: fullSale.client_id,
          name: fullSale.client_name,
          phone: fullSale.client_phone
        };

        try {
          const fileName = `${fullSale.folio} - ${clientObj.name}.pdf`;
          const doc = this.pdfService.generateSalePdf(fullSale, fullSale.items, clientObj, this.settings || {}, false);
          const blobUrl = URL.createObjectURL(doc.output('blob'));

          if (pdfWindow && !pdfWindow.closed) {
            pdfWindow.document.open();
            pdfWindow.document.write(`
              <html>
                <head>
                  <title>${fileName}</title>
                  <style>body { margin: 0; padding: 0; overflow: hidden; }</style>
                </head>
                <body>
                  <embed src="${blobUrl}" type="application/pdf" width="100%" height="100%">
                </body>
              </html>
            `);
            pdfWindow.document.close();
          } else {
            window.open(blobUrl, '_blank');
          }
        } catch (pdfError) {
          console.error('Error generating PDF content:', pdfError);
          if (pdfWindow) pdfWindow.close();
          this.snackBar.open('Error al generar el formato del PDF', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        if (pdfWindow) pdfWindow.close();
        console.error('Error fetching sale for reprint:', err);
        this.snackBar.open('Error al conectar con el servidor', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteSale(sale: any) {
    if (sale.paid_amount > 0) {
      this.snackBar.open('No se puede eliminar una venta con pagos registrados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar venta',
        message: `¿Estás seguro de eliminar la venta ${sale.folio || '#' + sale.id} de ${sale.client_name}?`,
        warning: 'Esta acción es permanente y no se puede deshacer.',
        icon: 'delete_forever',
        type: 'warn',
        confirmText: 'Eliminar',
        confirmIcon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.api.deleteSale(sale.id).subscribe({
        next: () => {
          this.snackBar.open('Venta eliminada correctamente', 'Cerrar', { duration: 3000 });
          this.loadSales();
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Error al eliminar la venta', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }
}
