import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatGridListModule,
        BaseChartDirective
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    stats: any = {
        week: { count: 0, total: 0 },
        month: { count: 0, total: 0 },
        year: { count: 0, total: 0 },
        pending: { count: 0, total: 0 },
        monthlyIncome: { total: 0 }
    };
    chartsReady = false;

    private monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    private themeSubscription?: Subscription;

    // Bar Chart - Sales by Month
    public salesByMonthData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Ventas ($)',
                backgroundColor: '#a8c7fa', // Google Blue Light
                hoverBackgroundColor: '#82b1ff'
            }
        ]
    };
    public salesByMonthOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#888' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#888' }
            }
        }
    };
    public salesByMonthType: ChartType = 'bar';

    // Bar Chart - Top Clients
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Total Ventas',
                backgroundColor: '#1e40af'
            }
        ]
    };
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#888' } },
            y: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        }
    };
    public barChartType: ChartType = 'bar';

    public doughnutChartData: ChartData<'doughnut'> = {
        labels: ['Pendiente', 'Pagado Parcial', 'Pagado'],
        datasets: [
            {
                data: [],
                backgroundColor: ['#fbbf24', '#60a5fa', '#34d399'],
                borderWidth: 0,
                cutout: '75%'
            } as any
        ]
    };


    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#888',
                    padding: 20,
                    font: { size: 12 }
                }
            }
        }
    };

    public doughnutChartType: ChartType = 'doughnut';

    // Bar Chart - Top Services
    public servicesChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Cantidad Vendida',
                backgroundColor: '#8b5cf6'
            }
        ]
    };
    public servicesChartType: ChartType = 'bar';

    constructor(
        private api: ApiService,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        this.loadStats();
        this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
            this.updateChartTheme(isDark);
        });
    }

    ngOnDestroy(): void {
        this.themeSubscription?.unsubscribe();
    }

    updateChartTheme(isDark: boolean) {
        const textColor = isDark ? '#e3e3e3' : '#666';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        // Update Sales By Month
        if (this.salesByMonthOptions?.scales?.['x']) {
            this.salesByMonthOptions.scales['x'].ticks!.color = textColor;
        }
        if (this.salesByMonthOptions?.scales?.['y']) {
            this.salesByMonthOptions.scales['y'].ticks!.color = textColor;
            this.salesByMonthOptions.scales['y'].grid!.color = gridColor;
        }

        // Update Bar Chart
        if (this.barChartOptions?.scales?.['x']) {
            this.barChartOptions.scales['x'].ticks!.color = textColor;
        }
        if (this.barChartOptions?.scales?.['y']) {
            this.barChartOptions.scales['y'].ticks!.color = textColor;
            this.barChartOptions.scales['y'].grid!.color = gridColor;
        }

        // Update Doughnut
        if (this.doughnutChartOptions?.plugins?.legend?.labels) {
            this.doughnutChartOptions.plugins.legend.labels.color = textColor;
        }

        // Trigger chart updates if they exist
        // Note: ng2-charts usually handles this via change detection if options are re-assigned
        this.salesByMonthOptions = { ...this.salesByMonthOptions };
        this.barChartOptions = { ...this.barChartOptions };
        this.doughnutChartOptions = { ...this.doughnutChartOptions };
    }

    loadStats() {
        this.api.getStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.chartsReady = false;

                // Update Bar Chart - Sales by Month
                this.salesByMonthData.labels = data.salesByMonth.map((item: any) => {
                    const [year, month] = item.month.split('-');
                    return `${this.monthNames[parseInt(month) - 1]} ${year.substring(2)}`;
                });
                this.salesByMonthData.datasets[0].data = data.salesByMonth.map((item: any) => item.total);

                // Re-trigger charts after data is set and DOM updates
                setTimeout(() => {
                    this.chartsReady = true;
                }, 100);

                // Update Bar Chart - Top Clients
                this.barChartData.labels = data.topClients.map((item: any) => item.name);
                this.barChartData.datasets[0].data = data.topClients.map((item: any) => item.total);

                // Update Doughnut Chart - Payment Status
                const statusMap: { [key: string]: number } = {
                    'Pending': 0,
                    'Partial': 1,
                    'Paid': 2
                };
                const statusCounts = [0, 0, 0];
                data.statusDistribution.forEach((item: any) => {
                    const index = statusMap[item.status];
                    if (index !== undefined) {
                        statusCounts[index] = item.count;
                    }
                });
                this.doughnutChartData.datasets[0].data = statusCounts;

                // Update Services Chart
                this.servicesChartData.labels = data.topServices.map((item: any) => item.description);
                this.servicesChartData.datasets[0].data = data.topServices.map((item: any) => item.count);
            },
            error: (err) => console.error('Error loading stats:', err)
        });
    }
}
