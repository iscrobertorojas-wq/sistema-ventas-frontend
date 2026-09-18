import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-tax-calculation',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule,
        MatTooltipModule,
        MatTabsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        MatPaginatorModule,
        MatButtonToggleModule,
    ],
    templateUrl: './tax-calculation.component.html',
    styleUrl: './tax-calculation.component.css'
})
export class TaxCalculationComponent implements OnInit, OnDestroy {

    // Estado de la FIEL
    fielStatus: { configurada: boolean; vigente: boolean; rfc: string | null } | null = null;
    fielLoading: boolean = false;

    // Formulario de solicitud (Modal)
    showDownloadModal: boolean = false;
    tipoDescarga: 'ambos' | 'emitidos' | 'recibidos' = 'ambos';
    fechaInicio: Date | null = null;
    fechaFin: Date | null = null;
    solicitando: boolean = false;

    // Carga manual de archivos (Modal & Drag & Drop)
    showUploadModal: boolean = false;
    archivosParaSubir: File[] = [];
    subiendoArchivos: boolean = false;
    isDragging: boolean = false;
    resultadoSubida: {
        total_procesados: number;
        guardados: number;
        duplicados: number;
        invalidos?: number;
        errores?: string[];
    } | null = null;

    // Historial de solicitudes
    historial: any[] = [];
    historialLoading: boolean = false;

    // Sincronización automática de solicitudes al SAT
    private autoSyncTimer: any = null;
    private autoSyncRunning: boolean = false; // evita ciclos solapados

    // Solicitudes en progreso (verificando/descargando/eliminando)
    verificandoIds: Set<number> = new Set();
    descargandoIds: Set<number> = new Set();
    eliminandoIds: Set<number> = new Set();

    // Tab de CFDIs almacenados
    cfdis: any[] = [];
    cfdisLoading: boolean = false;
    filtroCfdiTipo: string = '';
    filtroCfdiFechaInicio: Date | null = null;
    filtroCfdiFechaFin: Date | null = null;

    // Paginación de CFDIs
    pageSize: number = 50;
    pageSizeOptions: number[] = [50, 100, 1000];
    pageIndex: number = 0;

    // Columnas tabla historial
    historialColumns = ['tipo', 'periodo', 'total_cfdis', 'estado', 'fecha', 'acciones'];

    // Columnas tabla CFDIs
    cfdisColumns = [
        'uuid',
        'tipo',
        'rfc_emisor',
        'rfc_receptor',
        'fecha_emision',
        'tipo_cfdi',
        'subtotal',
        'iva',
        'ret_iva',
        'ret_isr',
        'ret_cedular',
        'total',
        'moneda'
    ];

    constructor(private api: ApiService, private snackBar: MatSnackBar) {
        this.setPeriodoMesActual();
    }

    ngOnInit(): void {
        this.loadFielStatus();
        this.loadHistorial();
        this.loadCfdis();
        this.loadCalculoImpuestos();
        this.startAutoSyncTimer();
    }

    ngOnDestroy(): void {
        this.stopAutoSyncTimer();
    }

    private formatDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /** Convierte un Date|null a string 'yyyy-MM-dd' para el backend */
    private dateToString(d: Date | null): string {
        return d ? this.formatDate(d) : '';
    }

    setPeriodoMesActual() {
        const now = new Date();
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        this.fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setPeriodoMesAnterior() {
        const now = new Date();
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.fechaFin = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setPeriodoAnioActual() {
        const now = new Date();
        this.fechaInicio = new Date(now.getFullYear(), 0, 1);
        this.fechaFin = new Date(now.getFullYear(), 11, 31);
    }

    openDownloadModal() {
        this.showDownloadModal = true;
    }

    closeDownloadModal() {
        if (!this.solicitando) {
            this.showDownloadModal = false;
        }
    }

    formatCurrency(val: any): string {
        const n = parseFloat(val) || 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
    }

    // ─── FIEL ───

    loadFielStatus() {
        this.fielLoading = true;
        this.api.getFielStatus().subscribe({
            next: (s) => { this.fielStatus = s; this.fielLoading = false; },
            error: () => { this.fielLoading = false; }
        });
    }

    // ─── Solicitar descarga ───

    solicitarDescarga() {
        const inicio = this.dateToString(this.fechaInicio);
        const fin = this.dateToString(this.fechaFin);

        if (!inicio || !fin) {
            this.snackBar.open('Selecciona un rango de fechas', 'Cerrar', { duration: 3000 });
            return;
        }
        if (inicio > fin) {
            this.snackBar.open('La fecha de inicio no puede ser mayor a la fecha fin', 'Cerrar', { duration: 3000 });
            return;
        }
        if (!this.fielStatus?.vigente) {
            this.snackBar.open('Configura tu FIEL vigente en Configuración antes de continuar', 'Cerrar', { duration: 4000 });
            return;
        }

        this.solicitando = true;
        this.api.satRequestDownload({
            tipo: this.tipoDescarga,
            fecha_inicio: inicio,
            fecha_fin: fin
        }).subscribe({
            next: (res) => {
                this.solicitando = false;
                this.showDownloadModal = false;
                const msg = res.message || 'Solicitud enviada al SAT exitosamente';
                this.snackBar.open(`✓ ${msg}. Revisa el estado en el historial en unos momentos.`, 'Cerrar', { duration: 6000 });
                this.loadHistorial();
            },
            error: (err) => {
                this.solicitando = false;
                const msg = err.error?.error || 'Error al enviar solicitud al SAT';
                this.snackBar.open(`⚠ ${msg}`, 'Cerrar', { duration: 7000 });
            }
        });
    }

    // ─── Carga Manual (XMLs / ZIP) ───

    openUploadModal() {
        this.showUploadModal = true;
        this.archivosParaSubir = [];
        this.resultadoSubida = null;
    }

    closeUploadModal() {
        if (!this.subiendoArchivos) {
            this.showUploadModal = false;
            this.archivosParaSubir = [];
            this.resultadoSubida = null;
        }
    }

    onDragOver(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = false;
    }

    onDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = false;
        if (e.dataTransfer && e.dataTransfer.files) {
            this.agregarArchivos(Array.from(e.dataTransfer.files));
        }
    }

    onFileSelected(e: any) {
        if (e.target && e.target.files) {
            this.agregarArchivos(Array.from(e.target.files));
            e.target.value = '';
        }
    }

    agregarArchivos(files: File[]) {
        const permitidos = files.filter(f => {
            const name = f.name.toLowerCase();
            return name.endsWith('.xml') || name.endsWith('.zip');
        });

        if (permitidos.length < files.length) {
            this.snackBar.open('Algunos archivos no son .xml ni .zip y fueron descartados', 'Cerrar', { duration: 3500 });
        }

        const nombresExistentes = new Set(this.archivosParaSubir.map(f => f.name));
        for (const file of permitidos) {
            if (!nombresExistentes.has(file.name)) {
                this.archivosParaSubir.push(file);
                nombresExistentes.add(file.name);
            }
        }
    }

    removerArchivo(index: number) {
        this.archivosParaSubir.splice(index, 1);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    subirArchivos() {
        if (this.archivosParaSubir.length === 0) return;

        this.subiendoArchivos = true;
        this.resultadoSubida = null;

        const formData = new FormData();
        for (const file of this.archivosParaSubir) {
            formData.append('files', file, file.name);
        }

        this.api.satUploadCfdis(formData).subscribe({
            next: (res) => {
                this.subiendoArchivos = false;
                this.resultadoSubida = res;
                this.archivosParaSubir = [];
                const msg = `✓ Importación finalizada: ${res.guardados} CFDIs nuevos guardados (${res.duplicados} omitidos por ya existir).`;
                this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
                this.loadCfdis();
            },
            error: (err) => {
                this.subiendoArchivos = false;
                this.snackBar.open(err.error?.error || 'Error al procesar los archivos', 'Cerrar', { duration: 5000 });
            }
        });
    }

    // ─── Historial y Sincronización Automática Cada 5 Minutos ───

    loadHistorial() {
        this.historialLoading = true;
        this.api.satGetHistory().subscribe({
            next: (data) => {
                this.historial = data;
                this.historialLoading = false;
                this.revisarPendientesAuto();
            },
            error: () => { this.historialLoading = false; }
        });
    }

    startAutoSyncTimer() {
        this.stopAutoSyncTimer();
        // Verificar automáticamente cada 5 minutos (300,000 ms) en segundo plano
        this.autoSyncTimer = setInterval(() => {
            const hayPendientes = this.historial.some(h => h.estado === 'pendiente' || h.estado === 'listo');
            if (hayPendientes) {
                this.loadHistorial();
            }
        }, 5 * 60 * 1000);
    }

    stopAutoSyncTimer() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    private revisarPendientesAuto() {
        // Procesar en orden secuencial para no saturar el SAT con peticiones paralelas
        const pendientes = this.historial.filter(
            (h) => (h.estado === 'pendiente' && !this.isVerificando(h.id)) ||
                   (h.estado === 'listo' && !this.isDescargando(h.id))
        );

        if (pendientes.length === 0) return;

        // Encadenar secuencialmente con un delay de 3 s entre cada uno
        let chain = Promise.resolve();
        for (const item of pendientes) {
            chain = chain.then(() => new Promise<void>((res) => {
                setTimeout(() => {
                    if (item.estado === 'listo' && !this.isDescargando(item.id)) {
                        this.descargarPaquetes(item);
                    } else if (item.estado === 'pendiente' && !this.isVerificando(item.id)) {
                        this.verificarSolicitud(item, true);
                    }
                    res();
                }, 3000);
            }));
        }
    }

    verificarSolicitud(item: any, isAuto: boolean = false) {
        this.verificandoIds.add(item.id);
        this.api.satVerifyRequest(item.id).subscribe({
            next: (res) => {
                this.verificandoIds.delete(item.id);
                const estado = res.estado;
                if (estado === 'listo' && res.paquetes && res.paquetes.length > 0) {
                    this.snackBar.open(`✓ Solicitud autorizada por el SAT. Descargando ${res.total_cfdis ?? ''} CFDIs automáticamente...`, 'OK', { duration: 5000 });
                    this.loadHistorial();
                    // AUTO-DESCARGA INMEDIATA
                    this.descargarPaquetes(item);
                } else {
                    const msg = estado === 'listo'
                        ? `¡Listo! ${res.total_cfdis ?? '?'} CFDIs disponibles.`
                        : estado === 'pendiente'
                        ? 'El SAT aún está procesando la solicitud. Se verificará automáticamente en 5 min.'
                        : `Estado: ${estado}`;
                    // En modo automático en segundo plano no interrumpir al usuario con toasts repetitivos
                    if (!isAuto) {
                        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
                    }
                    this.loadHistorial();
                }
            },
            error: (err) => {
                this.verificandoIds.delete(item.id);
                console.warn('[SAT Auto-Sync] Verificación en segundo plano no completada:', err.error?.error || err.message);
                // Si fue manual, mostrar toast; si fue automático, no interrumpir la pantalla del usuario
                if (!isAuto) {
                    this.snackBar.open(err.error?.error || 'Error al verificar con el SAT', 'Cerrar', { duration: 4500 });
                }
            }
        });
    }

    descargarPaquetes(item: any) {
        this.descargandoIds.add(item.id);
        this.api.satDownloadPackages(item.id).subscribe({
            next: (res) => {
                this.descargandoIds.delete(item.id);
                const nuevos = res.cfdis_nuevos ?? 0;
                const duplicados = res.cfdis_duplicados ?? 0;
                let msg = `✓ Descarga completa: ${nuevos} CFDIs nuevos guardados.`;
                if (duplicados > 0) {
                    msg += ` (${duplicados} omitidos por ya existir previamente).`;
                }
                this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
                this.loadHistorial();
                this.loadCfdis();
            },
            error: (err) => {
                this.descargandoIds.delete(item.id);
                this.snackBar.open(err.error?.error || 'Error al descargar paquetes del SAT', 'Cerrar', { duration: 5000 });
            }
        });
    }

    isVerificando(id: number): boolean { return this.verificandoIds.has(id); }
    isDescargando(id: number): boolean { return this.descargandoIds.has(id); }
    isEliminando(id: number): boolean { return this.eliminandoIds.has(id); }

    eliminarSolicitud(item: any) {
        const estado = item.estado;
        const esPendiente = estado === 'pendiente' || estado === 'vacio' || estado === 'error';
        const esDescargado = estado === 'descargado';
        const esListo = estado === 'listo';

        let msg = `¿Eliminar esta solicitud (${item.tipo}, ${item.fecha_inicio} — ${item.fecha_fin})?`;
        if (esDescargado) {
            msg += '\n\nNota: Los CFDIs ya guardados en la base de datos NO serán eliminados.';
        } else if (esListo) {
            msg += '\n\nNota: Los paquetes del SAT pendientes de descargar se perderán.';
        } else if (esPendiente) {
            msg += '\n\nSe eliminará el registro del historial.';
        }

        if (!confirm(msg)) return;

        this.eliminandoIds.add(item.id);
        this.api.satDeleteRequest(item.id).subscribe({
            next: () => {
                this.eliminandoIds.delete(item.id);
                this.snackBar.open('Solicitud eliminada del historial', 'Cerrar', { duration: 3500 });
                this.loadHistorial();
            },
            error: (err) => {
                this.eliminandoIds.delete(item.id);
                this.snackBar.open(err.error?.error || 'Error al eliminar la solicitud', 'Cerrar', { duration: 4000 });
            }
        });
    }

    getEstadoColor(estado: string): string {
        const map: Record<string, string> = {
            pendiente: 'accent',
            verificando: 'primary',
            listo: 'primary',
            descargado: 'primary',
            error: 'warn'
        };
        return map[estado] || 'default';
    }

    getEstadoIcon(estado: string): string {
        const map: Record<string, string> = {
            pendiente: 'hourglass_empty',
            verificando: 'sync',
            listo: 'download_for_offline',
            descargado: 'check_circle',
            error: 'error'
        };
        return map[estado] || 'help';
    }

    // ─── CFDIs almacenados ───

    loadCfdis() {
        this.cfdisLoading = true;
        this.pageIndex = 0; // reset al filtrar
        const params: any = {};
        if (this.filtroCfdiTipo) params.tipo = this.filtroCfdiTipo;
        const fi = this.dateToString(this.filtroCfdiFechaInicio);
        const ff = this.dateToString(this.filtroCfdiFechaFin);
        if (fi) params.fecha_inicio = fi;
        if (ff) params.fecha_fin = ff;

        this.api.satGetCfdis(params).subscribe({
            next: (data) => { this.cfdis = data; this.cfdisLoading = false; },
            error: () => { this.cfdisLoading = false; }
        });
    }

    aplicarFiltrosCfdis() {
        this.loadCfdis();
    }

    limpiarFiltrosCfdis() {
        this.filtroCfdiTipo = '';
        this.filtroCfdiFechaInicio = null;
        this.filtroCfdiFechaFin = null;
        this.loadCfdis();
    }

    onPageChange(event: PageEvent) {
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;
    }

    setTipoFilter(tipo: string) {
        this.filtroCfdiTipo = tipo;
        this.aplicarFiltrosCfdis();
    }

    minVal(a: number, b: number): number {
        return Math.min(a, b);
    }

    // CFDIs de la página actual
    get cfdisPage(): any[] {
        const start = this.pageIndex * this.pageSize;
        return this.cfdis.slice(start, start + this.pageSize);
    }

    // ─── Totales generales (para pie de tabla) ───
    get totalSubtotal(): number   { return this.cfdis.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0); }
    get totalIva(): number        { return this.cfdis.reduce((s, c) => s + parseFloat(c.iva || 0), 0); }
    get totalRetIva(): number     { return this.cfdis.reduce((s, c) => s + parseFloat(c.ret_iva || 0), 0); }
    get totalRetIsr(): number     { return this.cfdis.reduce((s, c) => s + parseFloat(c.ret_isr || 0), 0); }
    get totalRetCedular(): number { return this.cfdis.reduce((s, c) => s + parseFloat(c.ret_cedular || 0), 0); }
    get totalMonto(): number      { return this.cfdis.reduce((s, c) => s + parseFloat(c.total || 0), 0); }

    // ─── Totales por tipo ───
    get emitidos(): any[] { return this.cfdis.filter(c => c.tipo === 'emitido'); }
    get recibidos(): any[] { return this.cfdis.filter(c => c.tipo === 'recibido'); }

    get totalSubtotalEmitidos(): number { return this.emitidos.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0); }
    get totalIvaEmitidos(): number      { return this.emitidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0); }
    get totalMontoEmitidos(): number    { return this.emitidos.reduce((s, c) => s + parseFloat(c.total || 0), 0); }

    get totalSubtotalRecibidos(): number { return this.recibidos.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0); }
    get totalIvaRecibidos(): number      { return this.recibidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0); }
    get totalMontoRecibidos(): number    { return this.recibidos.reduce((s, c) => s + parseFloat(c.total || 0), 0); }

    // ═════════════════════════════════════════════════════════════
    // ─── PESTAÑA 3: CÁLCULO DE IMPUESTOS MENSUAL (DETERMINACIÓN) ───
    // ═════════════════════════════════════════════════════════════

    readonly Math = Math;

    calcAnio: number = new Date().getFullYear();
    calcMes: number = new Date().getMonth() + 1; // 1..12
    calcLoading: boolean = false;
    calcCfdis: any[] = [];

    meses = [
        { id: 1, nombre: 'Enero' },
        { id: 2, nombre: 'Febrero' },
        { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' },
        { id: 5, nombre: 'Mayo' },
        { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' },
        { id: 8, nombre: 'Agosto' },
        { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' },
        { id: 11, nombre: 'Noviembre' },
        { id: 12, nombre: 'Diciembre' }
    ];

    anios: number[] = [2024, 2025, 2026, 2027, 2028];

    loadCalculoImpuestos() {
        this.calcLoading = true;
        const mesStr = String(this.calcMes).padStart(2, '0');
        const lastDay = new Date(this.calcAnio, this.calcMes, 0).getDate();
        const fecha_inicio = `${this.calcAnio}-${mesStr}-01`;
        const fecha_fin = `${this.calcAnio}-${mesStr}-${String(lastDay).padStart(2, '0')}`;

        this.api.satGetCfdis({ fecha_inicio, fecha_fin }).subscribe({
            next: (data) => {
                this.calcCfdis = data || [];
                this.calcLoading = false;
            },
            error: (err) => {
                console.error('[Cálculo Impuestos] Error cargando CFDIs del mes:', err);
                this.calcLoading = false;
                this.snackBar.open('Error al cargar CFDIs para el cálculo mensual', 'Cerrar', { duration: 4000 });
            }
        });
    }

    mesAnterior() {
        if (this.calcMes === 1) {
            this.calcMes = 12;
            this.calcAnio--;
        } else {
            this.calcMes--;
        }
        this.loadCalculoImpuestos();
    }

    mesSiguiente() {
        if (this.calcMes === 12) {
            this.calcMes = 1;
            this.calcAnio++;
        } else {
            this.calcMes++;
        }
        this.loadCalculoImpuestos();
    }

    get nombreMesSeleccionado(): string {
        const m = this.meses.find(item => item.id === this.calcMes);
        return m ? m.nombre : '';
    }

    // CFDIs del mes
    get calcEmitidos(): any[] {
        return this.calcCfdis.filter(c => c.tipo === 'emitido');
    }

    get calcRecibidos(): any[] {
        return this.calcCfdis.filter(c => c.tipo === 'recibido');
    }

    // Separación de emitidos por tipo de receptor (Física = 13 caracteres, Moral = 12 caracteres)
    get calcEmitidosPF(): any[] {
        return this.calcEmitidos.filter(c => ((c.rfc_receptor || '').trim().length === 13));
    }

    get calcEmitidosPM(): any[] {
        return this.calcEmitidos.filter(c => ((c.rfc_receptor || '').trim().length === 12));
    }

    // Subtotales cobrados
    get ingresosCobradosPF(): number {
        return this.calcEmitidosPF.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0);
    }

    get ingresosCobradosPM(): number {
        return this.calcEmitidosPM.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0);
    }

    get ingresosCobradosTotales(): number {
        return this.ingresosCobradosPF + this.ingresosCobradosPM;
    }

    // ─── 1. ISR Federal (RESICO) ───
    get tasaIsrInfo(): { tasa: number; porcentaje: string; tope: number } {
        const ing = this.ingresosCobradosTotales;
        if (ing <= 25000) return { tasa: 0.01, porcentaje: '1.00%', tope: 25000 };
        if (ing <= 50000) return { tasa: 0.011, porcentaje: '1.10%', tope: 50000 };
        if (ing <= 83333.33) return { tasa: 0.015, porcentaje: '1.50%', tope: 83333.33 };
        if (ing <= 208333.33) return { tasa: 0.02, porcentaje: '2.00%', tope: 208333.33 };
        return { tasa: 0.025, porcentaje: '2.50%', tope: 3500000 };
    }

    get isrCalculado(): number {
        return Math.round(this.ingresosCobradosTotales * this.tasaIsrInfo.tasa * 100) / 100;
    }

    get isrRetenido(): number {
        return Math.round(this.ingresosCobradosPM * 0.0125 * 100) / 100;
    }

    get isrFederalAPagar(): number {
        return Math.max(0, Math.round((this.isrCalculado - this.isrRetenido) * 100) / 100);
    }

    // ─── 2. Impuesto Estatal (Cedular) ───
    get tasaCedularInfo(): { tasa: number; porcentaje: string; tope: number } {
        const ing = this.ingresosCobradosTotales;
        if (ing <= 25000) return { tasa: 0.02, porcentaje: '2.00%', tope: 25000 };
        if (ing <= 50000) return { tasa: 0.021, porcentaje: '2.10%', tope: 50000 };
        if (ing <= 83333.33) return { tasa: 0.022, porcentaje: '2.20%', tope: 83333.33 };
        if (ing <= 208333.33) return { tasa: 0.023, porcentaje: '2.30%', tope: 208333.33 };
        return { tasa: 0.025, porcentaje: '2.50%', tope: 3500000 };
    }

    get cedularCalculado(): number {
        return Math.round(this.ingresosCobradosTotales * this.tasaCedularInfo.tasa * 100) / 100;
    }

    get cedularRetenido(): number {
        return this.calcEmitidos.reduce((s, c) => s + parseFloat(c.ret_cedular || 0), 0);
    }

    get impuestoEstatalAPagar(): number {
        return Math.max(0, Math.round((this.cedularCalculado - this.cedularRetenido) * 100) / 100);
    }

    // ─── 3. IVA ───
    get ivaEmitidos(): number {
        return this.calcEmitidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0);
    }

    get ivaRecibidos(): number {
        return this.calcRecibidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0);
    }

    get ivaAPagar(): number {
        return Math.round((this.ivaEmitidos - this.ivaRecibidos) * 100) / 100;
    }

    // ─── 4. Totales Generales ───
    get impuestoFederalTotal(): number {
        return Math.max(0, this.ivaAPagar) + this.isrFederalAPagar;
    }

    get granTotalImpuestos(): number {
        return this.impuestoFederalTotal + this.impuestoEstatalAPagar;
    }

    // ─── Exportación a Excel (.xlsx) ───
    exportarCalculoExcel() {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen de Determinación de Impuestos
        const resumenData = [
            ['DETERMINACIÓN MENSUAL DE IMPUESTOS'],
            ['Periodo:', `${this.nombreMesSeleccionado} ${this.calcAnio}`],
            ['Fecha de Cálculo:', new Date().toLocaleDateString('es-MX')],
            ['Contribuyente (RFC):', this.fielStatus?.rfc || '—'],
            [],
            ['1. IMPUESTO SOBRE LA RENTA (ISR FEDERAL - RESICO)'],
            ['Concepto', 'Importe / Detalle'],
            ['Ingresos cobrados a Personas Físicas (RFC 13 caracteres)', this.ingresosCobradosPF],
            ['Ingresos cobrados a Personas Morales (RFC 12 caracteres)', this.ingresosCobradosPM],
            ['Total Ingresos Cobrados', this.ingresosCobradosTotales],
            ['Tasa Aplicable según escala mensual', this.tasaIsrInfo.porcentaje],
            ['ISR Calculado (Ingresos Totales × Tasa)', this.isrCalculado],
            ['(-) ISR Retenido por Personas Morales (1.25%)', this.isrRetenido],
            ['(=) ISR FEDERAL A PAGAR', this.isrFederalAPagar],
            [],
            ['2. IMPUESTO ESTATAL (CEDULAR)'],
            ['Concepto', 'Importe / Detalle'],
            ['Ingresos cobrados a Personas Físicas (RFC 13 caracteres)', this.ingresosCobradosPF],
            ['Ingresos cobrados a Personas Morales (RFC 12 caracteres)', this.ingresosCobradosPM],
            ['Total Ingresos Cobrados', this.ingresosCobradosTotales],
            ['Tasa Aplicable Estatal según escala', this.tasaCedularInfo.porcentaje],
            ['Impuesto Cedular Calculado (Ingresos Totales × Tasa)', this.cedularCalculado],
            ['(-) Impuesto Cedular Retenido en XMLs', this.cedularRetenido],
            ['(=) IMPUESTO ESTATAL A PAGAR', this.impuestoEstatalAPagar],
            [],
            ['3. IMPUESTO AL VALOR AGREGADO (IVA)'],
            ['Concepto', 'Importe / Detalle'],
            ['IVA Trasladado (Facturas Emitidas)', this.ivaEmitidos],
            ['(-) IVA Acreditable (Facturas Recibidas / Gastos)', this.ivaRecibidos],
            ['(=) IVA A PAGAR (o a Favor)', this.ivaAPagar],
            [],
            ['4. RESUMEN GENERAL DE OBLIGACIONES FISCALES'],
            ['Obligación', 'Importe'],
            ['ISR Federal a Pagar', this.isrFederalAPagar],
            ['IVA a Pagar', Math.max(0, this.ivaAPagar)],
            ['TOTAL IMPUESTO FEDERAL (IVA + ISR)', this.impuestoFederalTotal],
            ['IMPUESTO ESTATAL (CEDULAR)', this.impuestoEstatalAPagar],
            ['GRAN TOTAL A PAGAR (Federal + Estatal)', this.granTotalImpuestos],
        ];

        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        wsResumen['!cols'] = [{ wch: 55 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Cálculo de Impuestos');

        // Hoja 2: CFDIs Emitidos del Mes
        const emitidosData = this.calcEmitidos.map(c => ({
            'Folio Fiscal (UUID)': c.uuid,
            'Fecha Emisión': c.fecha_emision ? c.fecha_emision.substring(0, 10) : '',
            'Tipo Receptor': (c.rfc_receptor || '').trim().length === 13 ? 'Persona Física' : ((c.rfc_receptor || '').trim().length === 12 ? 'Persona Moral' : 'Otro'),
            'RFC Receptor': c.rfc_receptor || '',
            'Nombre Receptor': c.nombre_receptor || '',
            'Subtotal': parseFloat(c.subtotal || 0),
            'IVA': parseFloat(c.iva || 0),
            'Ret. ISR': parseFloat(c.ret_isr || 0),
            'Ret. Cedular': parseFloat(c.ret_cedular || 0),
            'Total': parseFloat(c.total || 0),
            'Moneda': c.moneda || 'MXN'
        }));
        const wsEmitidos = XLSX.utils.json_to_sheet(emitidosData);
        wsEmitidos['!cols'] = [
            { wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 35 },
            { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 }
        ];
        XLSX.utils.book_append_sheet(wb, wsEmitidos, 'CFDIs Emitidos');

        // Hoja 3: CFDIs Recibidos del Mes
        const recibidosData = this.calcRecibidos.map(c => ({
            'Folio Fiscal (UUID)': c.uuid,
            'Fecha Emisión': c.fecha_emision ? c.fecha_emision.substring(0, 10) : '',
            'RFC Emisor': c.rfc_emisor || '',
            'Nombre Emisor': c.nombre_emisor || '',
            'Subtotal': parseFloat(c.subtotal || 0),
            'IVA (Acreditable)': parseFloat(c.iva || 0),
            'Total': parseFloat(c.total || 0),
            'Moneda': c.moneda || 'MXN'
        }));
        const wsRecibidos = XLSX.utils.json_to_sheet(recibidosData);
        wsRecibidos['!cols'] = [
            { wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 35 },
            { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 8 }
        ];
        XLSX.utils.book_append_sheet(wb, wsRecibidos, 'CFDIs Recibidos');

        XLSX.writeFile(wb, `Determinacion_Impuestos_${this.nombreMesSeleccionado}_${this.calcAnio}.xlsx`);
        this.snackBar.open(`✓ Hoja de cálculo descargada: Determinacion_Impuestos_${this.nombreMesSeleccionado}_${this.calcAnio}.xlsx`, 'OK', { duration: 4000 });
    }
}
