import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        MatSnackBarModule,
        MatIconModule
    ],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
    isDarkMode: boolean = false;
    folioRemission: string = '1';
    folioInvoice: string = '1';
    folioQuotation: string = '1';
    companyName: string = 'ROBERTO ROJAS SALDAÑA';
    companyProfession: string = 'Ingeniero en Sistemas Computacionales';
    bankName: string = 'BBVA';
    bankCard: string = '4152 3141 8750 3829';
    footerText: string = 'Esta orden de servicio se emite para describir los servicios prestados. El pago deberá efectuarse dentro de un plazo de 15 días a partir de la fecha de emisión.';
    companyLogo: string | null = null;
    brandColor: string = '#1a73e8';

    // Dashboard Ordering
    statCardsOrder: any[] = [
        { id: 'income', title: 'Ingresos del Mes', order: 1 },
        { id: 'week', title: 'Esta Semana', order: 2 },
        { id: 'month', title: 'Este Mes (Ventas)', order: 3 },
        { id: 'pending', title: 'Por Cobrar', order: 4 },
        { id: 'year', title: 'Ventas del Año', order: 5 },
        { id: 'purchases', title: 'Compras del Mes', order: 6 },
        { id: 'net', title: 'Ventas − Compras del Mes', order: 7 },
        { id: 'profit', title: 'Utilidad del Mes', order: 8 }
    ];

    chartCardsOrder: any[] = [
        { id: 'sales_history', title: 'Historial de Ventas', order: 1 },
        { id: 'clients', title: 'Top 5 Clientes', order: 2 },
        { id: 'payments', title: 'Estado de Pagos', order: 3 },
        { id: 'profit_history', title: 'Utilidad Mensual', order: 4 }
    ];

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings() {
        this.api.getSettings().subscribe({
            next: (settings) => {
                this.isDarkMode = settings.theme === 'dark';
                this.folioRemission = settings.folio_remission || '1';
                this.folioInvoice = settings.folio_invoice || '1';
                this.folioQuotation = settings.folio_quotation || '1';
                this.companyName = settings.company_name || this.companyName;
                this.companyProfession = settings.company_profession || this.companyProfession;
                this.bankName = settings.bank_name || this.bankName;
                this.bankCard = settings.bank_card || this.bankCard;
                this.footerText = settings.footer_text || this.footerText;
                this.companyLogo = settings.company_logo || null;
                this.brandColor = settings.brand_color || '#1a73e8';

                if (settings.dashboard_stats_order) {
                    try {
                        const savedStats = JSON.parse(settings.dashboard_stats_order);
                        this.statCardsOrder.forEach(card => {
                            const index = savedStats.indexOf(card.id);
                            card.order = index !== -1 ? index + 1 : 99;
                        });
                        this.statCardsOrder.sort((a, b) => a.order - b.order);
                    } catch (e) { console.error('Error parsing stats order', e); }
                }

                if (settings.dashboard_charts_order) {
                    try {
                        const savedCharts = JSON.parse(settings.dashboard_charts_order);
                        this.chartCardsOrder.forEach(card => {
                            const index = savedCharts.indexOf(card.id);
                            card.order = index !== -1 ? index + 1 : 99;
                        });
                        this.chartCardsOrder.sort((a, b) => a.order - b.order);
                    } catch (e) { console.error('Error parsing charts order', e); }
                }

                this.applyTheme(this.isDarkMode);
                this.themeService.setBrandColor(this.brandColor);
            },
            error: (err) => console.error('Error loading settings:', err)
        });
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.themeService.setTheme(this.isDarkMode);
        this.saveTheme();
    }

    updateBrandColor() {
        this.themeService.setBrandColor(this.brandColor);
        this.saveSetting('brand_color', this.brandColor);
    }

    applyTheme(isDark: boolean) {
        this.themeService.setTheme(isDark);
    }

    saveTheme() {
        const theme = this.isDarkMode ? 'dark' : 'light';
        this.api.updateSetting('theme', theme).subscribe({
            next: () => {
                this.snackBar.open('Tema actualizado', 'Cerrar', { duration: 2000 });
            },
            error: (err) => {
                console.error('Error saving theme:', err);
                this.snackBar.open('Error al guardar tema', 'Cerrar', { duration: 3000 });
            }
        });
    }

    saveFolioRemission() {
        const valueToSave = String(this.folioRemission).trim();
        if (!valueToSave || isNaN(Number(valueToSave))) {
            this.snackBar.open('Por favor ingresa un número válido', 'Cerrar', { duration: 3000 });
            return;
        }

        this.api.updateSetting('folio_remission', valueToSave).subscribe({
            next: () => {
                this.snackBar.open('Consecutivo de remisión actualizado', 'Cerrar', { duration: 2000 });
                this.loadSettings();
            },
            error: (err) => {
                console.error('Error saving folio:', err);
                this.snackBar.open('Error al guardar consecutivo', 'Cerrar', { duration: 3000 });
            }
        });
    }

    saveFolioInvoice() {
        const valueToSave = String(this.folioInvoice).trim();
        if (!valueToSave || isNaN(Number(valueToSave))) {
            this.snackBar.open('Por favor ingresa un número válido', 'Cerrar', { duration: 3000 });
            return;
        }

        this.api.updateSetting('folio_invoice', valueToSave).subscribe({
            next: () => {
                this.snackBar.open('Consecutivo de factura actualizado', 'Cerrar', { duration: 2000 });
                this.loadSettings();
            },
            error: (err) => {
                console.error('Error saving folio:', err);
                this.snackBar.open('Error al guardar consecutivo', 'Cerrar', { duration: 3000 });
            }
        });
    }

    saveFolioQuotation() {
        const valueToSave = String(this.folioQuotation).trim();
        if (!valueToSave || isNaN(Number(valueToSave))) {
            this.snackBar.open('Por favor ingresa un número válido', 'Cerrar', { duration: 3000 });
            return;
        }

        this.api.updateSetting('folio_quotation', valueToSave).subscribe({
            next: () => {
                this.snackBar.open('Consecutivo de cotización actualizado', 'Cerrar', { duration: 2000 });
                this.loadSettings();
            },
            error: (err) => {
                console.error('Error saving folio:', err);
                this.snackBar.open('Error al guardar consecutivo', 'Cerrar', { duration: 3000 });
            }
        });
    }

    onLogoSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.companyLogo = e.target.result;
                this.saveSetting('company_logo', this.companyLogo!);
            };
            reader.readAsDataURL(file);
        }
    }

    saveCompanyInfo() {
        this.saveSetting('company_name', this.companyName);
        this.saveSetting('company_profession', this.companyProfession);
        this.saveSetting('bank_name', this.bankName);
        this.saveSetting('bank_card', this.bankCard);
        this.saveSetting('footer_text', this.footerText);
        this.snackBar.open('Información de empresa actualizada', 'Cerrar', { duration: 2000 });
    }

    saveDashboardOrder() {
        const statsOrder = this.statCardsOrder
            .sort((a, b) => a.order - b.order)
            .map(c => c.id);
        
        const chartsOrder = this.chartCardsOrder
            .sort((a, b) => a.order - b.order)
            .map(c => c.id);

        this.api.updateSetting('dashboard_stats_order', JSON.stringify(statsOrder)).subscribe();
        this.api.updateSetting('dashboard_charts_order', JSON.stringify(chartsOrder)).subscribe({
            next: () => {
                this.snackBar.open('Orden del dashboard actualizado', 'Cerrar', { duration: 2000 });
                // Re-sort current view
                this.statCardsOrder.sort((a, b) => a.order - b.order);
                this.chartCardsOrder.sort((a, b) => a.order - b.order);
            },
            error: (err) => {
                console.error('Error saving dashboard order:', err);
                this.snackBar.open('Error al guardar el orden', 'Cerrar', { duration: 3000 });
            }
        });
    }

    private saveSetting(key: string, value: string) {
        this.api.updateSetting(key, value).subscribe({
            error: (err) => console.error(`Error saving ${key}:`, err)
        });
    }
}
