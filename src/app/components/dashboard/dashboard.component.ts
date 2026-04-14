import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
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
export class DashboardComponent implements OnInit, OnDestroy {
    stats: any = {
        week: { count: 0, total: 0 },
        month: { count: 0, total: 0 },
        year: { count: 0, total: 0 },
        pending: { count: 0, total: 0 },
        monthlyIncome: { total: 0 },
        monthPurchases: { total: 0, count: 0 }
    };
    chartsReady = false;

    // Persistable Layout
    statCards: any[] = [];
    chartCards: any[] = [];

    private defaultStats = [
        { id: 'income', title: 'Ingresos del Mes', icon: 'attach_money', class: 'income', gradient: 'hover-gradient-income', subtitle: 'Cobrado efectivamente' },
        { id: 'week', title: 'Esta Semana', icon: 'calendar_today', class: 'week', gradient: 'hover-gradient-week' },
        { id: 'month', title: 'Este Mes (Ventas)', icon: 'date_range', class: 'month', gradient: 'hover-gradient-month' },
        { id: 'pending', title: 'Por Cobrar', icon: 'pending_actions', class: 'pending', gradient: 'hover-gradient-pending' },
        { id: 'year', title: 'Ventas del Año', icon: 'analytics', class: 'year', gradient: 'hover-gradient-year', border: 'border-left: 4px solid var(--brand-color)' },
        { id: 'purchases', title: 'Compras del Mes', icon: 'shopping_cart', class: 'purchases', gradient: 'hover-gradient-purchases' },
        { id: 'net', title: 'Ventas − Compras del Mes', icon: 'balance', class: 'net', gradient: 'hover-gradient-net', subtitle: 'Ventas vs gastos del mes' },
        { id: 'profit', title: 'Utilidad del Mes', icon: 'trending_up', class: 'profit', gradient: 'hover-gradient-profit', subtitle: 'Ingresos cobrados − Compras' }
    ];

    private defaultCharts = [
        { id: 'sales_history', title: 'Historial de Ventas (Mensual)', icon: 'bar_chart', isLarge: true, delay: 'delay-1' },
        { id: 'clients', title: 'Top 5 Clientes', icon: 'people', isLarge: false, delay: 'delay-2' },
        { id: 'payments', title: 'Estado de Pagos', icon: 'pie_chart', isLarge: false, delay: 'delay-3' },
        { id: 'profit_history', title: 'Utilidad Mensual', icon: 'trending_up', isLarge: true, delay: 'delay-4' }
    ];

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

    // Bar Chart - Monthly Profit
    public profitChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Utilidad ($)',
                backgroundColor: '#10b981', // Emerald/Green
                hoverBackgroundColor: '#059669'
            }
        ]
    };
    public profitChartType: ChartType = 'bar';
    public profitChartOptions: ChartConfiguration['options'] = {
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

    constructor(
        private api: ApiService,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        this.loadLayout();
        this.loadStats();
        this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
            this.updateChartTheme(isDark);
        });
    }

    ngOnDestroy(): void {
        this.themeSubscription?.unsubscribe();
    }

    loadLayout() {
        this.api.getSettings().subscribe({
            next: (settings) => {
                const savedStats = settings.dashboard_stats_order;
                const savedCharts = settings.dashboard_charts_order;

                if (savedStats) {
                    try {
                        const order = JSON.parse(savedStats);
                        this.statCards = order.map((id: string) => this.defaultStats.find(s => s.id === id)).filter(Boolean);
                        // Add any missing default stats
                        this.defaultStats.forEach(s => {
                            if (!this.statCards.find(sc => sc.id === s.id)) this.statCards.push(s);
                        });
                    } catch (e) {
                        this.statCards = [...this.defaultStats];
                    }
                } else {
                    this.statCards = [...this.defaultStats];
                }

                if (savedCharts) {
                    try {
                        const order = JSON.parse(savedCharts);
                        this.chartCards = order.map((id: string) => this.defaultCharts.find(c => c.id === id)).filter(Boolean);
                        // Add any missing default charts
                        this.defaultCharts.forEach(c => {
                            if (!this.chartCards.find(cc => cc.id === c.id)) this.chartCards.push(c);
                        });
                    } catch (e) {
                        this.chartCards = [...this.defaultCharts];
                    }
                } else {
                    this.chartCards = [...this.defaultCharts];
                }
            },
            error: (err) => {
                console.error('Error loading settings for layout:', err);
                this.statCards = [...this.defaultStats];
                this.chartCards = [...this.defaultCharts];
            }
        });
    }

    getStatValue(id: string): any {
        switch (id) {
            case 'income': return this.stats.monthlyIncome?.total;
            case 'week': return this.stats.week?.total;
            case 'month': return this.stats.month?.total;
            case 'pending': return this.stats.pending?.total;
            case 'year': return this.stats.year?.total;
            case 'purchases': return this.stats.monthPurchases?.total;
            case 'net': return this.stats.month?.total - this.stats.monthPurchases?.total;
            case 'profit': return this.stats.monthlyIncome?.total - this.stats.monthPurchases?.total;
            default: return 0;
        }
    }

    getStatSubtitle(card: any): string {
        if (card.subtitle) return card.subtitle;
        switch (card.id) {
            case 'week': return `${this.stats.week?.count || 0} ventas`;
            case 'month': return `${this.stats.month?.count || 0} ventas`;
            case 'pending': return `${this.stats.pending?.count || 0} ventas`;
            case 'year': return `${this.stats.year?.count || 0} ventas en 2024`;
            case 'purchases': return `${this.stats.monthPurchases?.count || 0} compras registradas`;
            default: return '';
        }
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

        if (this.profitChartOptions?.scales?.['x']) {
            this.profitChartOptions.scales['x'].ticks!.color = textColor;
        }
        if (this.profitChartOptions?.scales?.['y']) {
            this.profitChartOptions.scales['y'].ticks!.color = textColor;
            this.profitChartOptions.scales['y'].grid!.color = gridColor;
        }

        // Trigger chart updates if they exist
        // Note: ng2-charts usually handles this via change detection if options are re-assigned
        this.salesByMonthOptions = { ...this.salesByMonthOptions };
        this.barChartOptions = { ...this.barChartOptions };
        this.doughnutChartOptions = { ...this.doughnutChartOptions };
        this.profitChartOptions = { ...this.profitChartOptions };
    }

    loadStats() {
        this.api.getStats().subscribe({
            next: (data) => {
                this.stats = data;
                this.chartsReady = false;

                // Update Bar Chart - Sales by Month
                const labels = data.salesByMonth.map((item: any) => {
                    const [year, month] = item.month.split('-');
                    return `${this.monthNames[parseInt(month) - 1]} ${year.substring(2)}`;
                });
                
                this.salesByMonthData.labels = labels;
                this.salesByMonthData.datasets[0].data = data.salesByMonth.map((item: any) => item.total);

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

                // Update Profit Chart (Utilidad por Mes)
                // Create a map of purchases by month for easy lookup
                const purchasesMap: { [key: string]: number } = {};
                data.purchasesByMonth.forEach((p: any) => {
                    purchasesMap[p.month] = parseFloat(p.total);
                });

                this.profitChartData.labels = labels;
                this.profitChartData.datasets[0].data = data.salesByMonth.map((s: any) => {
                    const salesTotal = parseFloat(s.total) || 0;
                    const purchasesTotal = purchasesMap[s.month] || 0;
                    return salesTotal - purchasesTotal;
                });

                // Re-trigger charts after data is set and DOM updates
                setTimeout(() => {
                    this.chartsReady = true;
                }, 100);
            },
            error: (err) => console.error('Error loading stats:', err)
        });
    }
}
