import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private isDarkTheme = new BehaviorSubject<boolean>(false);
    isDarkTheme$ = this.isDarkTheme.asObservable();

    constructor() {
        // Check if theme is already applied to body (e.g., from initial load in SettingsComponent)
        const storedTheme = localStorage.getItem('theme');
        const isDark = storedTheme === 'dark';
        this.setTheme(isDark);
    }

    setTheme(isDark: boolean) {
        this.isDarkTheme.next(isDark);
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    setBrandColor(color: string) {
        if (!color) return;

        document.documentElement.style.setProperty('--brand-color', color);

        // Derived colors for consistency
        const dark = this.adjustColor(color, -20);
        const light = this.hexToRgba(color, 0.1);
        const hover = this.hexToRgba(color, 0.04);

        document.documentElement.style.setProperty('--brand-color-dark', dark);
        document.documentElement.style.setProperty('--brand-color-light', light);
        document.documentElement.style.setProperty('--brand-color-hover', hover);
    }

    private adjustColor(hex: string, percent: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    toggleTheme() {
        this.setTheme(!this.isDarkTheme.value);
    }

    getCurrentTheme(): boolean {
        return this.isDarkTheme.value;
    }
}
