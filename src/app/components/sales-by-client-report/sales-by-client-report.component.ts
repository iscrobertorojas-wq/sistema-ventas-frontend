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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ApiService } from '../../services/api.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-sales-by-client-report',
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
        MatSnackBarModule,
        MatSortModule
    ],
    templateUrl: './sales-by-client-report.component.html',
    styleUrl: './sales-by-client-report.component.css'
})
export class SalesByClientReportComponent implements OnInit {
    reportData: any[] = [];
    filteredData: any[] = [];
    filteredTotal: number = 0;

    displayedColumns: string[] = ['client_name', 'sales_count', 'total_amount'];
    filterColumns: string[] = ['filter-client', 'filter-count', 'filter-total'];

    startDate: Date | null = null;
    endDate: Date | null = null;
    clientFilter: string = '';

    currentSort: Sort = { active: 'total_amount', direction: 'desc' };

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadReport();
    }

    loadReport(startDate?: string, endDate?: string) {
        this.api.getSalesByClientReport(startDate, endDate).subscribe({
            next: (data) => {
                this.reportData = data;
                this.applyInternalFilters();
            },
            error: (err) => {
                console.error('Error loading sales by client report', err);
                this.snackBar.open('Error al cargar reporte', 'Cerrar', { duration: 3000 });
            }
        });
    }

    applyInternalFilters() {
        this.filteredData = this.reportData.filter(item => {
            if (this.clientFilter && !item.client_name?.toLowerCase().includes(this.clientFilter.toLowerCase())) return false;
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

        this.filteredData = [...this.filteredData].sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            switch (sort.active) {
                case 'client_name': return this.compare(a.client_name, b.client_name, isAsc);
                case 'sales_count': return this.compare(a.sales_count, b.sales_count, isAsc);
                case 'total_amount': return this.compare(parseFloat(a.total_amount), parseFloat(b.total_amount), isAsc);
                default: return 0;
            }
        });

        this.calculateTotal();
    }

    compare(a: string | number, b: string | number, isAsc: boolean) {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    calculateTotal() {
        this.filteredTotal = this.filteredData.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);
    }

    applyDateFilters() {
        if (this.startDate && this.endDate) {
            this.loadReport(this.formatDateForAPI(this.startDate), this.formatDateForAPI(this.endDate));
        }
    }

    filterThisWeek() {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.applyDateFilters();
    }

    filterThisMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.applyDateFilters();
    }

    filterThisYear() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.applyDateFilters();
    }

    formatDateForAPI(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    clearFilters() {
        this.startDate = null;
        this.endDate = null;
        this.clientFilter = '';
        this.loadReport();
    }

    exportToExcel() {
        const exportData = this.filteredData.map(item => ({
            'Cliente': item.client_name,
            'Cantidad de Ventas': item.sales_count,
            'Monto Total': item.total_amount
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

        const totalRow = {
            'Cliente': 'TOTAL',
            'Cantidad de Ventas': '',
            'Monto Total': this.filteredTotal
        };
        XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas_por_Cliente');
        XLSX.writeFile(wb, 'Reporte_Ventas_por_Cliente.xlsx');
    }
}
