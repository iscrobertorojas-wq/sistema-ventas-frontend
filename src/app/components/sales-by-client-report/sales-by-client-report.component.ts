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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
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
        MatSortModule,
        MatButtonToggleModule,
        MatExpansionModule
    ],
    templateUrl: './sales-by-client-report.component.html',
    styleUrl: './sales-by-client-report.component.css'
})
export class SalesByClientReportComponent implements OnInit {
    reportData: any[] = [];
    filteredData: any[] = [];
    filteredTotal: number = 0;

    displayedColumns: string[] = ['client_name', 'sales_count', 'total_amount'];

    startDate: Date | null = null;
    endDate: Date | null = null;
    activeFilterLabel: string = 'de todas';
    clientFilter: string = '';

    viewMode: 'list' | 'grouped' = 'grouped';
    detailMode: 'summary' | 'detailed' = 'summary';
    groupedSales: any[] = [];

    currentSort: Sort = { active: 'total_amount', direction: 'desc' };

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadReport();
    }


    loadReport(startDate?: string, endDate?: string) {
        this.api.getSales(startDate, endDate).subscribe({
            next: (data) => {
                this.reportData = data.map(sale => ({
                    ...sale,
                    formatted_date: this.formatDateForDisplay(new Date(sale.date))
                }));
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
        this.filteredTotal = this.filteredData.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        this.groupSales();
    }

    groupSales() {
        const groups = new Map<string, any>();

        this.filteredData.forEach(sale => {
            const date = new Date(sale.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const monthKey = `${year}-${month}`;

            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthYear = `${monthNames[date.getMonth()]} ${year}`;

            if (!groups.has(monthKey)) {
                groups.set(monthKey, {
                    monthYear: monthYear,
                    monthKey: monthKey,
                    totalSales: 0,
                    totalAmount: 0,
                    clients: [],
                    expanded: true // Default expanded for months
                });
            }

            const monthGroup = groups.get(monthKey)!;
            monthGroup.totalSales++;
            monthGroup.totalAmount += parseFloat(sale.total) || 0;

            let clientGroup = monthGroup.clients.find((c: any) => c.clientName === sale.client_name);
            if (!clientGroup) {
                clientGroup = {
                    clientName: sale.client_name || 'Desconocido',
                    totalSales: 0,
                    totalAmount: 0,
                    sales: [],
                    expanded: false // Default collapsed for clients inside detailed view
                };
                monthGroup.clients.push(clientGroup);
            }

            clientGroup.totalSales++;
            clientGroup.totalAmount += parseFloat(sale.total) || 0;
            clientGroup.sales.push(sale);
        });

        this.groupedSales = Array.from(groups.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        this.groupedSales.forEach(g => {
            g.clients.sort((a: any, b: any) => a.clientName.localeCompare(b.clientName));
            g.clients.forEach((c: any) => {
                c.sales.sort((sa: any, sb: any) => sb.date.localeCompare(sa.date));
            });
        });
    }

    applyDateFilters() {
        if (this.startDate && this.endDate) {
            if (this.activeFilterLabel === 'de todas') {
                this.activeFilterLabel = `del ${this.formatDateForDisplay(this.startDate)} al ${this.formatDateForDisplay(this.endDate)}`;
            }
            this.loadReport(this.formatDateForAPI(this.startDate), this.formatDateForAPI(this.endDate));
        }
    }

    filterThisWeek() {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.activeFilterLabel = 'de esta semana';
        this.applyDateFilters();
    }

    filterThisMonth() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.activeFilterLabel = 'de este mes';
        this.applyDateFilters();
    }

    filterThisYear() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        this.startDate = firstDay;
        this.endDate = lastDay;
        this.activeFilterLabel = 'de este año';
        this.applyDateFilters();
    }

    formatDateForAPI(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForDisplay(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    clearFilters() {
        this.startDate = null;
        this.endDate = null;
        this.activeFilterLabel = 'de todas';
        this.clientFilter = '';
        this.loadReport();
    }

    exportToExcel() {
        let ws: XLSX.WorkSheet;

        if (this.viewMode === 'list') {
            const exportData = this.filteredData.map(item => ({
                'Cliente': item.client_name,
                'No. Venta': item.id,
                'Fecha': item.formatted_date,
                'Monto Total': item.total
            }));

            ws = XLSX.utils.json_to_sheet(exportData);

            const totalRow = {
                'Cliente': 'TOTAL GENERAL',
                'No. Venta': '',
                'Fecha': '',
                'Monto Total': this.filteredTotal
            };
            XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

        } else {
            // Grouped Export
            const exportData: any[] = [];

            this.groupedSales.forEach(month => {
                exportData.push({
                    'Agrupación': `[ MES ] ${month.monthYear}`,
                    'Ventas': month.totalSales,
                    'Total': month.totalAmount,
                    'Fecha': '',
                    'Servicios': ''
                });

                month.clients.forEach((client: any) => {
                    exportData.push({
                        'Agrupación': `  • Cliente: ${client.clientName}`,
                        'Ventas': client.totalSales,
                        'Total': client.totalAmount,
                        'Fecha': '',
                        'Servicios': ''
                    });

                    if (this.detailMode === 'detailed') {
                        client.sales.forEach((sale: any) => {
                            exportData.push({
                                'Agrupación': `      Venta #${sale.id}`,
                                'Ventas': '',
                                'Total': parseFloat(sale.total) || 0,
                                'Fecha': sale.formatted_date,
                                'Servicios': sale.services || '-'
                            });
                        });
                    }
                });

                // Blank row
                exportData.push({});
            });

            // Grand Total
            exportData.push({
                'Agrupación': 'TOTAL GENERAL',
                'Ventas': this.filteredData.length,
                'Total': this.filteredTotal,
                'Fecha': '',
                'Servicios': ''
            });

            ws = XLSX.utils.json_to_sheet(exportData);
        }

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas_por_Cliente');
        XLSX.writeFile(wb, 'Reporte_Ventas_por_Cliente.xlsx');
    }
}
