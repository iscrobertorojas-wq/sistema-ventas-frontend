import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PdfService } from '../../services/pdf.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule, Sort } from '@angular/material/sort';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDividerModule,
    MatSortModule
    // Note: If you want to use MatSelect for status/method, add it here. 
    // For now I'll use inputs for simplicity as per common request, but MatSelect is better.
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  sales: any[] = [];
  filteredSales: any[] = [];
  filteredTotal: number = 0;
  settings: any = null;
  displayedColumns: string[] = [
    'formatted_date',
    'client_name',
    'services',
    'total',
    'folio_remission',
    'folio_invoice',
    'status_spanish',
    'payment_date',
    'payment_method',
    'bank_account',
    'actions'
  ];

  filterColumns: string[] = [
    'filter-date',
    'filter-client',
    'filter-services',
    'filter-total',
    'filter-remission',
    'filter-invoice',
    'filter-status',
    'filter-payment-date',
    'filter-method',
    'filter-account',
    'filter-actions'
  ];

  // Filters State
  startDate: Date | null = null;
  endDate: Date | null = null;

  clientFilter: string = '';
  remissionFilter: string = '';
  invoiceFilter: string = '';
  excludeEmptyRemission: boolean = false;
  excludeEmptyInvoice: boolean = false;
  statusFilter: string = '';
  methodFilter: string = '';
  accountFilter: string = '';

  currentSort: Sort = { active: '', direction: '' };

  constructor(
    private api: ApiService,
    private pdfService: PdfService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSales();
    this.loadGlobalSettings();
  }

  loadGlobalSettings() {
    this.api.getSettings().subscribe(settings => this.settings = settings);
  }

  loadSales(startDate?: string, endDate?: string) {
    this.api.getSales(startDate, endDate).subscribe(data => {
      this.sales = data.map(sale => ({
        ...sale,
        status_spanish: this.translateStatus(sale.status, sale.total, sale.paid_amount),
        formatted_date: this.formatDate(sale.date),
        payment_date: sale.last_payment_date ? this.formatDate(sale.last_payment_date) : '-',
        payment_method: this.translatePaymentMethod(sale.payment_methods),
        bank_account: sale.bank_accounts || '-',
        folio_remission: sale.type === 'Remission' ? sale.folio : '-',
        folio_invoice: sale.type === 'Invoice' ? sale.folio : '-'
      }));
      this.applyInternalFilters();
    });
  }

  applyInternalFilters() {
    this.filteredSales = this.sales.filter(sale => {
      // 1. Client Filter
      if (this.clientFilter && !sale.client_name?.toLowerCase().includes(this.clientFilter.toLowerCase())) return false;

      // 2. Remission Filter
      if (this.remissionFilter && !sale.folio_remission?.toLowerCase().includes(this.remissionFilter.toLowerCase())) return false;
      if (this.excludeEmptyRemission && sale.folio_remission === '-') return false;

      // 3. Invoice Filter
      if (this.invoiceFilter && !sale.folio_invoice?.toLowerCase().includes(this.invoiceFilter.toLowerCase())) return false;
      if (this.excludeEmptyInvoice && sale.folio_invoice === '-') return false;

      // 4. Status Filter
      if (this.statusFilter && !sale.status_spanish?.toLowerCase().includes(this.statusFilter.toLowerCase())) return false;

      // 5. Method Filter
      if (this.methodFilter && !sale.payment_method?.toLowerCase().includes(this.methodFilter.toLowerCase())) return false;

      // 6. Account Filter
      if (this.accountFilter && !sale.bank_account?.toLowerCase().includes(this.accountFilter.toLowerCase())) return false;

      return true;
    });

    if (this.currentSort.active) {
      this.sortData(this.currentSort);
    } else {
      this.calculateTotal();
    }
  }

  sortData(sort: Sort) {
    this.currentSort = sort;
    if (!sort.active || sort.direction === '') {
      this.calculateTotal();
      return;
    }

    this.filteredSales = [...this.filteredSales].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'formatted_date': return this.compare(a.date, b.date, isAsc);
        case 'payment_date': return this.compare(a.last_payment_date || '', b.last_payment_date || '', isAsc);
        case 'client_name': return this.compare(a.client_name, b.client_name, isAsc);
        case 'total': return this.compare(parseFloat(a.total), parseFloat(b.total), isAsc);
        default: return 0;
      }
    });

    this.calculateTotal();
  }

  compare(a: string | number, b: string | number, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  calculateTotal() {
    this.filteredTotal = this.filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
  }

  applyDateFilters() {
    if (this.startDate && this.endDate) {
      const start = this.formatDateForAPI(this.startDate);
      const end = this.formatDateForAPI(this.endDate);
      this.loadSales(start, end);
    }
  }

  filterThisWeek() {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    this.loadSales(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
  }

  filterThisMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.loadSales(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
  }

  filterThisYear() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), 11, 31);
    this.loadSales(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  translatePaymentMethod(methods: string): string {
    if (!methods || methods === '-') return '-';

    const translations: { [key: string]: string } = {
      'Cash': 'Efectivo',
      'Check': 'Cheque',
      'Transfer': 'Transferencia'
    };

    return methods.split(', ')
      .map(method => translations[method] || method)
      .join(', ');
  }

  translateStatus(status: string, total: number, paidAmount: number): string {
    if (paidAmount >= total - 0.01) return 'Pagado';
    return 'Pendiente';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }


  clearFilters() {
    this.startDate = null;
    this.endDate = null;
    this.clientFilter = '';
    this.remissionFilter = '';
    this.invoiceFilter = '';
    this.excludeEmptyRemission = false;
    this.excludeEmptyInvoice = false;
    this.statusFilter = '';
    this.methodFilter = '';
    this.accountFilter = '';
    this.loadSales();
  }


  exportToExcel() {
    const exportData = this.filteredSales.map(sale => ({
      'No. Venta': sale.id,
      'Fecha': sale.formatted_date,
      'Cliente': sale.client_name,
      'Servicios': sale.services || '-',
      'Total': sale.total,
      'No. Remisión': sale.folio_remission,
      'No. Factura': sale.folio_invoice,
      'Estado de Pago': sale.status_spanish,
      'Fecha de Pago': sale.payment_date,
      'Método de Pago': sale.payment_method,
      'Tarjeta Destino': sale.bank_account
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

    // Add Total Row
    const totalRow = {
      'No. Venta': '',
      'Fecha': '',
      'Cliente': '',
      'Servicios': 'TOTAL',
      'Total': this.filteredTotal,
      'No. Remisión': '',
      'No. Factura': '',
      'Estado de Pago': '',
      'Fecha de Pago': '',
      'Método de Pago': '',
      'Tarjeta Destino': ''
    };
    XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, 'Reporte_Ventas.xlsx');
  }

  navigateToEditSale(sale: any) {
    if (sale.paid_amount > 0) {
      this.snackBar.open('No se puede editar una venta con pagos registrados', 'Cerrar', { duration: 3000 });
      return;
    }
    this.router.navigate(['/sales'], { queryParams: { id: sale.id } });
  }

  reprintSale(sale: any) {
    this.snackBar.open('Generando PDF...', 'Cerrar', { duration: 2000 });

    // Open window immediately to capture user intent and avoid popup blocker
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

        const settingsToUse = this.settings || {};

        // Use full client object if available from backend, fallback to sale details
        const clientObj = fullSale.client || {
          id: fullSale.client_id,
          name: fullSale.client_name,
          phone: fullSale.client_phone
        };

        try {
          const fileName = `${fullSale.folio} - ${clientObj.name}.pdf`;
          const doc = this.pdfService.generateSalePdf(
            fullSale,
            fullSale.items,
            clientObj,
            settingsToUse,
            false // Don't auto-open inside service, we'll handle it here
          );

          const blob = doc.output('blob');
          const blobUrl = URL.createObjectURL(blob);

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
            // Fallback if initial window was closed or blocked
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
}
