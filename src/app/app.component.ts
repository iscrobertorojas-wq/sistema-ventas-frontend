import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from './services/api.service';
import { ThemeService } from './services/theme.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { inject } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private themeService = inject(ThemeService);
  private breakpointObserver = inject(BreakpointObserver);

  title = 'Reds sales app';
  isAuthenticated$ = this.auth.isAuthenticated$;
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit(): void {
    this.loadGlobalSettings();
  }

  loadGlobalSettings() {
    this.api.getSettings().subscribe({
      next: (settings: any) => {
        if (settings.theme) {
          this.themeService.setTheme(settings.theme === 'dark');
        }
        if (settings.brand_color) {
          this.themeService.setBrandColor(settings.brand_color);
        }
      },
      error: (err: any) => console.error('Error loading global settings:', err)
    });
  }

  logout() {
    this.auth.logout();
  }

  closeSidenavOnMobile() {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset && this.sidenav) {
        this.sidenav.close();
      }
    });
  }
}
