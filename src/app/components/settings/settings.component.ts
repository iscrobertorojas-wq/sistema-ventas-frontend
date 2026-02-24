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
    companyName: string = 'ROBERTO ROJAS SALDAÑA';
    companyProfession: string = 'Ingeniero en Sistemas Computacionales';
    bankName: string = 'BBVA';
    bankCard: string = '4152 3141 8750 3829';
    footerText: string = 'Esta orden de servicio se emite para describir los servicios prestados. El pago deberá efectuarse dentro de un plazo de 15 días a partir de la fecha de emisión.';
    companyLogo: string | null = null;
    brandColor: string = '#1a73e8';

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
                this.companyName = settings.company_name || this.companyName;
                this.companyProfession = settings.company_profession || this.companyProfession;
                this.bankName = settings.bank_name || this.bankName;
                this.bankCard = settings.bank_card || this.bankCard;
                this.footerText = settings.footer_text || this.footerText;
                this.companyLogo = settings.company_logo || null;
                this.brandColor = settings.brand_color || '#1a73e8';
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

    private saveSetting(key: string, value: string) {
        this.api.updateSetting(key, value).subscribe({
            error: (err) => console.error(`Error saving ${key}:`, err)
        });
    }
}
