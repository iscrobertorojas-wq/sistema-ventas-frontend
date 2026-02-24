import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PdfService } from '../../services/pdf.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-service-policies',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatTooltipModule,
        MatDividerModule
    ],
    templateUrl: './service-policies.component.html',
    styleUrl: './service-policies.component.css'
})
export class ServicePoliciesComponent implements OnInit {
    // Views: 'list' | 'new-policy' | 'detail'
    currentView: 'list' | 'new-policy' | 'detail' = 'list';

    // Policies list
    policies: any[] = [];
    filteredPolicies: any[] = [];
    searchTerm: string = '';

    // Clients
    clients: any[] = [];

    // New / Edit Policy form
    isEditingPolicy: boolean = false;
    policyForm = {
        id: null as number | null,
        client_id: null as number | null,
        policy_number: '',
        date: new Date(),
        total_hours: null as number | null
    };

    // Selected policy detail
    selectedPolicy: any = null;
    settings: any = null;

    // Record form
    showRecordForm: boolean = false;
    isEditingRecord: boolean = false;
    recordForm = {
        id: null as number | null,
        policy_id: null as number | null,
        service_date: new Date(),
        description: '',
        start_hour: null as number | null,
        start_minute: null as number | null,
        end_hour: null as number | null,
        end_minute: null as number | null,
        duration_minutes: 0,
        service_type: 'Remoto'
    };

    recordColumns: string[] = ['service_date', 'description', 'start_time', 'end_time', 'duration', 'service_type', 'actions'];

    hours: number[] = Array.from({ length: 24 }, (_, i) => i);
    minutes: number[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    constructor(
        private api: ApiService,
        private pdfService: PdfService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadPolicies();
        this.loadClients();
        this.loadSettings();
    }

    loadPolicies() {
        this.api.getServicePolicies().subscribe({
            next: (data) => {
                this.policies = data;
                this.applySearch();
            },
            error: (err) => this.snackBar.open('Error al cargar pólizas', 'Cerrar', { duration: 3000 })
        });
    }

    loadClients() {
        this.api.getClients().subscribe(data => this.clients = data);
    }

    loadSettings() {
        this.api.getSettings().subscribe(data => this.settings = data);
    }

    applySearch() {
        const term = this.searchTerm.toLowerCase();
        this.filteredPolicies = this.policies.filter(p =>
            p.policy_number.toLowerCase().includes(term) ||
            p.client_name.toLowerCase().includes(term)
        );
    }

    // ─── Policy CRUD ───────────────────────────────────────────────

    showNewPolicyForm() {
        this.isEditingPolicy = false;
        this.policyForm = { id: null, client_id: null, policy_number: '', date: new Date(), total_hours: null };
        this.currentView = 'new-policy';
    }

    editPolicy(policy: any, event: Event) {
        event.stopPropagation();
        this.isEditingPolicy = true;
        this.policyForm = {
            id: policy.id,
            client_id: policy.client_id,
            policy_number: policy.policy_number,
            date: new Date(policy.date),
            total_hours: policy.total_hours
        };
        this.currentView = 'new-policy';
    }

    savePolicy() {
        if (!this.policyForm.client_id || !this.policyForm.policy_number || !this.policyForm.date || !this.policyForm.total_hours) {
            this.snackBar.open('Por favor completa todos los campos', 'Cerrar', { duration: 3000 });
            return;
        }

        const payload = {
            ...this.policyForm,
            date: this.formatDate(this.policyForm.date)
        };

        const isNew = !this.isEditingPolicy;
        const request = this.isEditingPolicy
            ? this.api.updateServicePolicy(payload)
            : this.api.createServicePolicy(payload);

        request.subscribe({
            next: (res) => {
                this.snackBar.open(`Póliza ${this.isEditingPolicy ? 'actualizada' : 'creada'} correctamente`, 'Cerrar', { duration: 3000 });
                // Reload list, then if new policy open its detail automatically
                this.api.getServicePolicies().subscribe(data => {
                    this.policies = data;
                    this.applySearch();
                    if (isNew && res?.id) {
                        const newPolicy = this.policies.find(p => p.id === res.id);
                        if (newPolicy) {
                            this.openPolicy(newPolicy);
                            return;
                        }
                    }
                    this.currentView = 'list';
                });
            },
            error: (err) => this.snackBar.open(err.error?.error || 'Error al guardar póliza', 'Cerrar', { duration: 3000 })
        });
    }

    deletePolicy(policy: any, event: Event) {
        event.stopPropagation();
        if (!confirm(`¿Eliminar la póliza ${policy.policy_number}? Se eliminarán todos sus registros.`)) return;

        this.api.deleteServicePolicy(policy.id).subscribe({
            next: () => {
                this.snackBar.open('Póliza eliminada', 'Cerrar', { duration: 3000 });
                this.loadPolicies();
                if (this.selectedPolicy?.id === policy.id) {
                    this.currentView = 'list';
                    this.selectedPolicy = null;
                }
            },
            error: (err) => this.snackBar.open(err.error?.error || 'Error al eliminar póliza', 'Cerrar', { duration: 3000 })
        });
    }

    // ─── Policy Detail ─────────────────────────────────────────────

    openPolicy(policy: any) {
        // Load records via the list endpoint + separate records call
        // This avoids depending on the dynamic [id] route
        this.api.getPolicyRecords(policy.id).subscribe({
            next: (records) => {
                // Merge policy data (from list) with its records
                const usedMinutes = records.reduce((sum: number, r: any) => sum + (r.duration_minutes || 0), 0);
                this.selectedPolicy = {
                    ...policy,
                    records,
                    used_minutes: usedMinutes,
                    remaining_minutes: policy.total_hours * 60 - usedMinutes
                };
                this.showRecordForm = false;
                this.resetRecordForm();
                this.currentView = 'detail';
            },
            error: () => this.snackBar.open('Error al cargar registros de la póliza', 'Cerrar', { duration: 3000 })
        });
    }

    refreshSelectedPolicy() {
        if (!this.selectedPolicy) return;
        // Reload policy list to get updated totals, then reload records
        this.api.getServicePolicies().subscribe(policies => {
            const updated = policies.find((p: any) => p.id === this.selectedPolicy.id);
            if (updated) {
                this.policies = policies;
                this.applySearch();
                this.openPolicy(updated);
            }
        });
    }

    isCompleted(): boolean {
        if (!this.selectedPolicy) return false;
        return parseFloat(this.selectedPolicy.remaining_minutes) <= 0;
    }

    // ─── Record CRUD ───────────────────────────────────────────────

    showAddRecord() {
        this.isEditingRecord = false;
        this.resetRecordForm();
        this.showRecordForm = true;
    }

    editRecord(record: any) {
        this.isEditingRecord = true;
        const [sh, sm] = record.start_time.split(':').map(Number);
        const [eh, em] = record.end_time.split(':').map(Number);
        this.recordForm = {
            id: record.id,
            policy_id: this.selectedPolicy.id,
            service_date: new Date(record.service_date + 'T12:00:00'),
            description: record.description,
            start_hour: sh,
            start_minute: sm,
            end_hour: eh,
            end_minute: em,
            duration_minutes: record.duration_minutes,
            service_type: record.service_type
        };
        this.showRecordForm = true;
    }

    onTimeChange() {
        const sh = this.recordForm.start_hour;
        const sm = this.recordForm.start_minute;
        const eh = this.recordForm.end_hour;
        const em = this.recordForm.end_minute;

        if (sh !== null && sm !== null && eh !== null && em !== null) {
            const startTotal = sh * 60 + sm;
            const endTotal = eh * 60 + em;
            const diff = endTotal - startTotal;
            this.recordForm.duration_minutes = diff > 0 ? diff : 0;
        }
    }

    saveRecord() {
        const { start_hour, start_minute, end_hour, end_minute } = this.recordForm;

        if (!this.recordForm.description || start_hour === null || start_minute === null || end_hour === null || end_minute === null) {
            this.snackBar.open('Por favor completa todos los campos', 'Cerrar', { duration: 3000 });
            return;
        }

        if (this.recordForm.duration_minutes <= 0) {
            this.snackBar.open('La hora final debe ser mayor a la hora inicial', 'Cerrar', { duration: 3000 });
            return;
        }

        const pad = (n: number) => n.toString().padStart(2, '0');
        const payload = {
            id: this.recordForm.id,
            policy_id: this.selectedPolicy.id,
            service_date: this.formatDate(this.recordForm.service_date),
            description: this.recordForm.description,
            start_time: `${pad(start_hour!)}:${pad(start_minute!)}:00`,
            end_time: `${pad(end_hour!)}:${pad(end_minute!)}:00`,
            duration_minutes: this.recordForm.duration_minutes,
            service_type: this.recordForm.service_type
        };

        const request = this.isEditingRecord
            ? this.api.updatePolicyRecord(payload)
            : this.api.createPolicyRecord(payload);

        request.subscribe({
            next: () => {
                this.snackBar.open(`Registro ${this.isEditingRecord ? 'actualizado' : 'guardado'} correctamente`, 'Cerrar', { duration: 3000 });
                this.showRecordForm = false;
                this.resetRecordForm();
                this.refreshSelectedPolicy();
            },
            error: (err) => this.snackBar.open(err.error?.error || 'Error al guardar registro', 'Cerrar', { duration: 3000 })
        });
    }

    deleteRecord(record: any) {
        if (!confirm('¿Eliminar este registro de servicio?')) return;

        this.api.deletePolicyRecord(record.id).subscribe({
            next: () => {
                this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
                this.refreshSelectedPolicy();
            },
            error: (err) => this.snackBar.open(err.error?.error || 'Error al eliminar registro', 'Cerrar', { duration: 3000 })
        });
    }

    cancelRecord() {
        this.showRecordForm = false;
        this.resetRecordForm();
    }

    resetRecordForm() {
        this.recordForm = {
            id: null,
            policy_id: null,
            service_date: new Date(),
            description: '',
            start_hour: null,
            start_minute: null,
            end_hour: null,
            end_minute: null,
            duration_minutes: 0,
            service_type: 'Remoto'
        };
        this.isEditingRecord = false;
    }

    // ─── Helpers ───────────────────────────────────────────────────

    formatDate(date: Date): string {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatMinutes(minutes: number): string {
        if (minutes === null || minutes === undefined) return '0h 0min';
        const m = Math.max(0, Math.round(minutes));
        const h = Math.floor(m / 60);
        const min = m % 60;
        return `${h}h ${min}min`;
    }

    formatTime(timeStr: string): string {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    }

    formatDisplayDate(dateStr: any): string {
        if (!dateStr) return '';

        let d: Date;
        if (dateStr instanceof Date) {
            d = dateStr;
        } else if (typeof dateStr === 'string') {
            // If it's just a date YYYY-MM-DD, append T12:00:00 to avoid timezone shifts
            if (dateStr.length === 10 && dateStr.includes('-')) {
                d = new Date(dateStr + 'T12:00:00');
            } else {
                d = new Date(dateStr);
            }
        } else {
            return 'Fecha inválida';
        }

        if (isNaN(d.getTime())) return 'Fecha inválida';

        return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    getUsedPercent(): number {
        if (!this.selectedPolicy) return 0;
        const total = this.selectedPolicy.total_hours * 60;
        const used = parseFloat(this.selectedPolicy.used_minutes) || 0;
        return Math.min(100, Math.round((used / total) * 100));
    }

    // ─── Excel Export ──────────────────────────────────────────────

    exportToExcel() {
        if (!this.selectedPolicy) return;

        const p = this.selectedPolicy;
        const wb = XLSX.utils.book_new();

        // Combined data for a single sheet
        const data = [
            ['PÓLIZA DE SERVICIO'],
            [],
            ['DETALLES DE LA PÓLIZA'],
            ['Número de Póliza:', p.policy_number],
            ['Cliente:', p.client_name],
            ['Fecha de Inicio:', this.formatDisplayDate(p.date)],
            ['Total de Horas Contratadas:', `${p.total_hours}h`],
            ['Horas Usadas:', this.formatMinutes(p.used_minutes)],
            ['Horas Restantes:', this.formatMinutes(p.remaining_minutes)],
            ['Estado:', this.isCompleted() ? 'COMPLETADA' : 'ACTIVA'],
            [],
            ['LISTADO DE SERVICIOS'],
            ['Fecha', 'Descripción', 'Hora Inicio', 'Hora Fin', 'Duración', 'Tipo']
        ];

        // Add records
        (p.records || []).forEach((r: any) => {
            data.push([
                this.formatDisplayDate(r.service_date),
                r.description,
                this.formatTime(r.start_time),
                this.formatTime(r.end_time),
                this.formatMinutes(r.duration_minutes),
                r.service_type
            ]);
        });

        // Add a final summary row
        data.push([]);
        data.push(['', '', '', 'TOTAL USADO:', this.formatMinutes(p.used_minutes)]);
        data.push(['', '', '', 'TOTAL RESTANTE:', this.formatMinutes(p.remaining_minutes)]);

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Adjust column widths (optional but helpful)
        const wscols = [
            { wch: 15 }, // Fecha
            { wch: 50 }, // Descripción
            { wch: 12 }, // Hora Inicio
            { wch: 12 }, // Hora Fin
            { wch: 15 }, // Duración
            { wch: 12 }  // Tipo
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Póliza');

        XLSX.writeFile(wb, `Poliza_${p.policy_number}.xlsx`);
    }

    exportToPdf() {
        if (!this.selectedPolicy || !this.settings) {
            this.snackBar.open('Espere a que carguen los datos de configuración', 'Cerrar', { duration: 3000 });
            return;
        }
        this.pdfService.generatePolicyPdf(this.selectedPolicy, this.selectedPolicy.records || [], this.settings);
    }
}
