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
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';


@Component({
    selector: 'app-quotations',
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
        MatRadioModule,
        MatTabsModule,
        MatDialogModule
    ],
    templateUrl: './quotations.component.html',
    styleUrl: './quotations.component.css'
})
export class QuotationsComponent implements OnInit {
    clients: any[] = [];
    selectedClient: any = null;
    quotationItems: any[] = [];
    allQuotations: any[] = [];
    isLoadingList: boolean = false;
    selectedTab: number = 0;

    // Autocomplete
    clientSearchTerm: string = '';
    filteredClients: any[] = [];

    // Current item being added
    currentDescription: string = '';
    currentUnitPrice: number = 0;
    currentQuantity: number = 1;
    currentDiscount: number = 0;

    // IVA mode: 'none' | 'add' | 'breakdown'
    ivaMode: string = 'none';

    observations: string = '';
    today: Date = new Date();
    nextFolio: string = '';
    isEditing: boolean = false;
    quotationId: number | null = null;
    settings: any = null;

    displayedColumns: string[] = ['description', 'unitPrice', 'quantity', 'discount', 'amount', 'actions'];
    quotationsColumns: string[] = ['folio', 'date', 'client', 'total', 'actions'];

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
        this.loadGlobalSettings();
        this.loadNextFolio();
        this.loadQuotations();

        // Check for edit mode
        this.route.queryParams.subscribe(params => {
            if (params['id']) {
                this.isEditing = true;
                this.quotationId = +params['id'];
                this.loadQuotationForEdit(this.quotationId);
            }
        });
    }

    loadQuotationForEdit(id: number) {
        this.api.getQuotationById(id).subscribe({
            next: (quotation) => {
                this.selectedClient = this.clients.find(c => c.id === quotation.client_id) || { id: quotation.client_id, name: quotation.client_name };
                this.clientSearchTerm = this.selectedClient.name;
                this.today = new Date(quotation.date);
                this.nextFolio = quotation.folio;
                this.ivaMode = quotation.iva_mode || 'none';
                this.observations = quotation.observations || '';

                this.quotationItems = quotation.items.map((item: any) => ({
                    description: item.description,
                    unitPrice: parseFloat(item.unit_price),
                    quantity: item.quantity,
                    discount: parseFloat(item.discount_percent),
                    amount: parseFloat(item.amount)
                }));
            },
            error: () => {
                this.snackBar.open('Error al cargar la cotización', 'Cerrar', { duration: 3000 });
                this.router.navigate(['/quotations']);
            }
        });
    }

    loadClients() {
        this.api.getClients().subscribe(data => {
            this.clients = data;
            this.filteredClients = data;

            // Check for pre-fill parameters
            this.route.queryParams.subscribe(params => {
                if (params['clientId']) {
                    const cId = +params['clientId'];
                    const foundClient = this.clients.find(c => c.id === cId);
                    if (foundClient) {
                        this.selectedClient = foundClient;
                        this.clientSearchTerm = foundClient.name;
                    }
                }
                if (params['productName']) {
                    this.currentDescription = params['productName'];
                }
                if (params['price']) {
                    this.currentUnitPrice = +params['price'];
                }
            });
        });
    }

    loadGlobalSettings() {
        this.api.getSettings().subscribe(settings => this.settings = settings);
    }

    loadNextFolio() {
        this.api.getSettings().subscribe({
            next: (settings) => {
                const currentFolio = settings['folio_quotation'] || '1';
                this.nextFolio = `C-${currentFolio}`;
            },
            error: (err) => console.error('Error loading folio:', err)
        });
    }

    loadQuotations() {
        this.isLoadingList = true;
        this.api.getQuotations().subscribe({
            next: (data) => {
                this.allQuotations = data;
                this.isLoadingList = false;
            },
            error: (err) => {
                console.error('Error loading quotations', err);
                this.isLoadingList = false;
            }
        });
    }

    onClientSearch() {
        const searchTerm = typeof this.clientSearchTerm === 'string' ? this.clientSearchTerm : '';
        const filterValue = searchTerm.toLowerCase();

        this.filteredClients = this.clients.filter(client =>
            client.name.toLowerCase().includes(filterValue)
        );
        if (!searchTerm) {
            this.selectedClient = null;
        }
    }

    selectClient(event: any) {
        this.selectedClient = event.option.value;
        this.clientSearchTerm = this.selectedClient.name;
    }

    displayClient(client: any): string {
        return client ? client.name : '';
    }

    addItem() {
        if (!this.currentDescription || this.currentUnitPrice <= 0) return;

        const amount = this.currentUnitPrice * this.currentQuantity * (1 - this.currentDiscount / 100);

        this.quotationItems = [...this.quotationItems, {
            description: this.currentDescription,
            unitPrice: this.currentUnitPrice,
            quantity: this.currentQuantity,
            discount: this.currentDiscount,
            amount: amount
        }];

        this.currentDescription = '';
        this.currentUnitPrice = 0;
        this.currentQuantity = 1;
        this.currentDiscount = 0;
    }

    removeItem(index: number) {
        this.quotationItems.splice(index, 1);
        this.quotationItems = [...this.quotationItems];
    }

    getSubtotal(): number {
        return this.quotationItems.reduce((sum, item) => sum + item.amount, 0);
    }

    getIva(): number {
        const subtotal = this.getSubtotal();
        if (this.ivaMode === 'add') {
            return subtotal * 0.16;
        } else if (this.ivaMode === 'breakdown') {
            return subtotal - (subtotal / 1.16);
        }
        return 0;
    }

    getSubtotalBeforeIva(): number {
        if (this.ivaMode === 'breakdown') {
            return this.getSubtotal() / 1.16;
        }
        return this.getSubtotal();
    }

    getTotal(): number {
        const subtotal = this.getSubtotal();
        if (this.ivaMode === 'add') {
            return subtotal + (subtotal * 0.16);
        }
        // For 'breakdown' and 'none', total equals subtotal (prices already include IVA or no IVA)
        return subtotal;
    }

    getTotalDiscount(): number {
        return this.quotationItems.reduce((sum, item) => {
            const fullPrice = item.unitPrice * item.quantity;
            return sum + (fullPrice - item.amount);
        }, 0);
    }

    saveQuotation() {
        if (!this.selectedClient || this.quotationItems.length === 0) return;

        const quotationData = {
            id: this.quotationId,
            client_id: this.selectedClient.id,
            items: this.quotationItems.map(item => ({
                description: item.description,
                unit_price: item.unitPrice,
                quantity: item.quantity,
                discount_percent: item.discount
            })),
            date: this.today,
            iva_mode: this.ivaMode,
            observations: this.observations
        };

        const request = this.isEditing
            ? this.api.updateQuotation(quotationData)
            : this.api.createQuotation(quotationData);

        request.subscribe({
            next: (res) => {
                const folio = res.folio || this.nextFolio;
                this.snackBar.open(
                    `Cotización ${this.isEditing ? 'actualizada' : 'guardada'} con éxito. Folio: ${folio}`,
                    'Cerrar',
                    { duration: 5000 }
                );

                // Generate PDF
                this.pdfService.generateQuotationPdf(
                    {
                        id: res.id || this.quotationId,
                        folio: folio,
                        date: this.today,
                        iva_mode: this.ivaMode,
                        observations: this.observations
                    },
                    this.quotationItems,
                    this.selectedClient,
                    this.settings
                );

                if (this.isEditing) {
                    this.router.navigate(['/quotations']);
                    this.isEditing = false;
                    this.quotationId = null;
                }
                this.startNewQuotation();
                this.loadQuotations();
            },
            error: (err) => {
                console.error('Error saving quotation', err);
                this.snackBar.open(err.error?.error || 'Error al procesar la cotización', 'Cerrar', { duration: 3000 });
            }
        });
    }

    startNewQuotation() {
        this.selectedClient = null;
        this.clientSearchTerm = '';
        this.quotationItems = [];
        this.currentDescription = '';
        this.currentUnitPrice = 0;
        this.currentQuantity = 1;
        this.currentDiscount = 0;
        this.ivaMode = 'none';
        this.observations = '';
        this.isEditing = false;
        this.quotationId = null;
        this.loadNextFolio();
    }

    editQuotation(q: any) {
        this.selectedTab = 0;
        this.isEditing = true;
        this.quotationId = q.id;
        this.loadQuotationForEdit(q.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    printQuotation(q: any) {
        this.api.getQuotationById(q.id).subscribe({
            next: (quotation) => {
                const client = { id: quotation.client_id, name: quotation.client_name };
                const items = quotation.items.map((item: any) => ({
                    description: item.description,
                    unitPrice: parseFloat(item.unit_price),
                    quantity: item.quantity,
                    discount: parseFloat(item.discount_percent),
                    amount: parseFloat(item.amount)
                }));

                this.pdfService.generateQuotationPdf(
                    {
                        id: quotation.id,
                        folio: quotation.folio,
                        date: quotation.date,
                        iva_mode: quotation.iva_mode,
                        observations: quotation.observations
                    },
                    items,
                    client,
                    this.settings
                );
            },
            error: () => this.snackBar.open('Error al cargar cotización para imprimir', 'Cerrar', { duration: 3000 })
        });
    }

    deleteQuotation(q: any) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Eliminar Cotización',
                message: `¿Estás seguro de que deseas eliminar la cotización ${q.folio}?`
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.api.deleteQuotation(q.id).subscribe({
                    next: () => {
                        this.snackBar.open('Cotización eliminada con éxito', 'Cerrar', { duration: 3000 });
                        this.loadQuotations();
                    },
                    error: (err) => {
                        console.error('Error deleting quotation', err);
                        this.snackBar.open('Error al eliminar la cotización', 'Cerrar', { duration: 3000 });
                    }
                });
            }
        });
    }
}
