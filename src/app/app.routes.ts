import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SalesComponent } from './components/sales/sales.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ServicesComponent } from './components/services/services.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { ReportsComponent } from './components/reports/reports.component';
import { PaymentsReportComponent } from './components/payments-report/payments-report.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ServicePoliciesComponent } from './components/service-policies/service-policies.component';
import { DatabaseManagementComponent } from './components/database-management/database-management.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'sales', component: SalesComponent, canActivate: [AuthGuard] },
    { path: 'clients', component: ClientsComponent, canActivate: [AuthGuard] },
    { path: 'services', component: ServicesComponent, canActivate: [AuthGuard] },
    { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard] },
    { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },
    { path: 'payments-report', component: PaymentsReportComponent, canActivate: [AuthGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
    { path: 'service-policies', component: ServicePoliciesComponent, canActivate: [AuthGuard] },
    { path: 'database-management', component: DatabaseManagementComponent, canActivate: [AuthGuard] }
];

