import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-payments-report',
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
        MatButtonToggleModule,
        MatSnackBarModule,
        MatSelectModule,
        MatDividerModule,
        MatSortModule
    ],
    templateUrl: './payments-report.component.html',
    styleUrl: './payments-report.component.css'
})
export class PaymentsReportComponent implements OnInit {
    payments: any[] = [];
    filteredPayments: any[] = [];
    filteredTotal: number = 0;

    displayedColumns: string[] = [
        'date',
        'amount',
        'client_name',
        'sale_folio',
        'sale_type',
        'method',
        'bank_account'
    ];

    filterColumns: string[] = [
        'filter-date',
        'filter-amount',
        'filter-client',
        'filter-folio',
        'filter-type',
        'filter-method',
        'filter-account'
    ];

    // Filters State
    startDate: Date | null = null;
    endDate: Date | null = null;
    clientFilter: string = '';
    folioFilter: string = '';
    typeFilter: string = ''; // 'Remission' or 'Invoice'
    methodFilter: string = '';
    accountFilter: string = '';

    currentSort: Sort = { active: 'date', direction: 'desc' };

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadPayments();
    }

    loadPayments(startDate?: string, endDate?: string) {
        this.api.getPayments(startDate, endDate).subscribe({
            next: (data) => {
                this.payments = data.map(p => ({
                    ...p,
                    method_spanish: this.translateMethod(p.method),
                    type_spanish: p.sale_type === 'Invoice' ? 'Factura' : 'Remisión'
                }));
                this.applyInternalFilters();
            },
            error: (err) => {
                console.error('Error loading payments', err);
                this.snackBar.open('Error al cargar pagos', 'Cerrar', { duration: 3000 });
            }
        });
    }

    applyInternalFilters() {
        this.filteredPayments = this.payments.filter(p => {
            if (this.clientFilter && !p.client_name?.toLowerCase().includes(this.clientFilter.toLowerCase())) return false;
            if (this.folioFilter && !p.sale_folio?.toLowerCase().includes(this.folioFilter.toLowerCase())) return false;
            if (this.typeFilter && p.sale_type !== this.typeFilter) return false;
            if (this.methodFilter && p.method !== this.methodFilter) return false;
            if (this.accountFilter && !p.bank_account?.toLowerCase().includes(this.accountFilter.toLowerCase())) return false;
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

        this.filteredPayments = [...this.filteredPayments].sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'date': return this.compare(new Date(a.date).getTime(), new Date(b.date).getTime(), isAsc);
                case 'amount': return this.compare(parseFloat(a.amount), parseFloat(b.amount), isAsc);
                case 'client_name': return this.compare(a.client_name, b.client_name, isAsc);
                case 'sale_folio': return this.compare(a.sale_folio, b.sale_folio, isAsc);
                default: return 0;
            }
        });

        this.calculateTotal();
    }

    compare(a: string | number, b: string | number, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    calculateTotal() {
        this.filteredTotal = this.filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }

    applyDateFilters() {
        if (this.startDate && this.endDate) {
            this.loadPayments(this.formatDateForAPI(this.startDate), this.formatDateForAPI(this.endDate));
        }
    }

    filterThisWeek() {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        this.loadPayments(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
    }

    filterThisMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.loadPayments(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
    }

    filterThisYear() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        this.loadPayments(this.formatDateForAPI(firstDay), this.formatDateForAPI(lastDay));
    }

    formatDateForAPI(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    translateMethod(method: string): string {
        const translations: { [key: string]: string } = {
            'Cash': 'Efectivo',
            'Check': 'Cheque',
            'Transfer': 'Transferencia'
        };
        return translations[method] || method;
    }

    clearFilters() {
        this.startDate = null;
        this.endDate = null;
        this.clientFilter = '';
        this.folioFilter = '';
        this.typeFilter = '';
        this.methodFilter = '';
        this.accountFilter = '';
        this.loadPayments();
    }

    exportToExcel() {
        const exportData = this.filteredPayments.map(p => ({
            'Fecha': new Date(p.date).toLocaleDateString(),
            'Monto': p.amount,
            'Cliente': p.client_name,
            'Folio Venta': p.sale_folio,
            'Tipo': p.type_spanish,
            'Método': p.method_spanish,
            'Cuenta/Detalle': p.bank_account || '-'
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

        // Add Total Row
        const totalRow = {
            'Fecha': '',
            'Monto': this.filteredTotal,
            'Cliente': 'TOTAL',
            'Folio Venta': '',
            'Tipo': '',
            'Método': '',
            'Cuenta/Detalle': ''
        };
        XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pagos');
        XLSX.writeFile(wb, 'Reporte_Pagos.xlsx');
    }
}
