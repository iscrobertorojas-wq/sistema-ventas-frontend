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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx-js-style';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

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
        MatDialogModule,
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
    today: Date = new Date();
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

    // Filtro estado SAT
    filtroCfdiEstado: string = '';
    sincronizandoEstado: boolean = false;

    // Columnas tabla historial
    historialColumns = ['tipo', 'periodo', 'total_cfdis', 'estado', 'fecha', 'acciones'];

    // Columnas tabla CFDIs
    cfdisColumns = [
        'uuid',
        'tipo',
        'estado_sat',
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

    constructor(
        private api: ApiService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.setPeriodoMesActual();
    }

    ngOnInit(): void {
        this.loadFielStatus();
        this.loadHistorial();
        this.loadCfdis();
        this.loadCalculoImpuestos();
    }

    ngOnDestroy(): void {
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
        const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        this.fechaFin = finMes > now ? now : finMes;
    }

    setPeriodoMesAnterior() {
        const now = new Date();
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        this.fechaFin = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setPeriodoAnioActual() {
        const now = new Date();
        this.fechaInicio = new Date(now.getFullYear(), 0, 1);
        const finAnio = new Date(now.getFullYear(), 11, 31);
        this.fechaFin = finAnio > now ? now : finAnio;
    }

    openDownloadModal() {
        this.today = new Date();
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
        const hoy = this.dateToString(new Date());
        if (fin > hoy) {
            this.snackBar.open('La fecha final no puede ser posterior al día de hoy', 'Cerrar', { duration: 4000 });
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

    // ─── Historial de Solicitudes ───

    loadHistorial() {
        this.historialLoading = true;
        this.api.satGetHistory().subscribe({
            next: (data) => {
                this.historial = data;
                this.historialLoading = false;
            },
            error: () => { this.historialLoading = false; }
        });
    }

    verificarSolicitud(item: any) {
        this.verificandoIds.add(item.id);
        this.api.satVerifyRequest(item.id).subscribe({
            next: (res) => {
                this.verificandoIds.delete(item.id);
                const estado = res.estado;
                const msg = estado === 'listo'
                    ? `¡Listo! ${res.total_cfdis ?? '?'} CFDIs disponibles para descargar.`
                    : estado === 'pendiente'
                    ? 'El SAT aún está procesando la solicitud. Intenta verificar nuevamente en unos momentos.'
                    : estado === 'vacio'
                    ? 'El SAT no encontró CFDIs para el periodo solicitado.'
                    : `Estado: ${estado}`;
                this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
                this.loadHistorial();
            },
            error: (err) => {
                this.verificandoIds.delete(item.id);
                this.snackBar.open(err.error?.error || 'Error al verificar con el SAT', 'Cerrar', { duration: 4500 });
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
                const canceladosActualizados = res.cfdis_cancelados_actualizados ?? 0;
                const canceladosNuevos = res.cfdis_cancelados_nuevos ?? 0;
                let msg = `✓ Descarga completa: ${nuevos} CFDIs guardados`;
                if (canceladosNuevos > 0) {
                    msg += ` (${canceladosNuevos} cancelados)`;
                }
                if (canceladosActualizados > 0) {
                    msg += `. ${canceladosActualizados} CFDIs actualizados a Cancelado en BD.`;
                } else if (duplicados > 0) {
                    msg += ` (${duplicados} omitidos por ya existir previamente).`;
                }
                this.snackBar.open(msg, 'Cerrar', { duration: 6000 });
                this.loadHistorial();
                this.loadCfdis();
                this.loadCalculoImpuestos();
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
        const esDescargado = estado === 'descargado';
        const esListo = estado === 'listo';

        let warning = '';
        if (esDescargado) {
            warning = 'Los CFDIs ya guardados en la base de datos NO serán eliminados.';
        } else if (esListo) {
            warning = 'Los paquetes del SAT pendientes de descargar se perderán.';
        } else {
            warning = 'Se eliminará el registro de la solicitud del historial.';
        }

        const fInicio = String(item.fecha_inicio).substring(0, 10);
        const fFin = String(item.fecha_fin).substring(0, 10);

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '430px',
            data: {
                title: 'Eliminar solicitud',
                message: `¿Deseas eliminar la solicitud de comprobantes ${item.tipo} del ${fInicio} al ${fFin}?`,
                warning: warning,
                icon: 'delete_sweep',
                type: 'warn',
                confirmText: 'Eliminar',
                confirmIcon: 'delete'
            }
        });

        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (!confirmed) return;

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
        if (this.filtroCfdiEstado) params.estado_sat = this.filtroCfdiEstado;
        const fi = this.dateToString(this.filtroCfdiFechaInicio);
        const ff = this.dateToString(this.filtroCfdiFechaFin);
        if (fi) params.fecha_inicio = fi;
        if (ff) params.fecha_fin = ff;

        this.api.satGetCfdis(params).subscribe({
            next: (data) => { this.cfdis = data; this.cfdisLoading = false; },
            error: () => { this.cfdisLoading = false; }
        });
    }

    sincronizarEstatusSat() {
        this.sincronizandoEstado = true;
        const fi = this.dateToString(this.filtroCfdiFechaInicio);
        const ff = this.dateToString(this.filtroCfdiFechaFin);
        const params: any = {};
        if (fi) params.fecha_inicio = fi;
        if (ff) params.fecha_fin = ff;
        if (this.filtroCfdiTipo) params.tipo = this.filtroCfdiTipo;

        this.api.satSyncStatus(params).subscribe({
            next: (res) => {
                this.sincronizandoEstado = false;
                this.snackBar.open(`✓ ${res.message}`, 'Cerrar', { duration: 6000 });
                this.loadCfdis();
                this.loadCalculoImpuestos();
            },
            error: (err) => {
                this.sincronizandoEstado = false;
                this.snackBar.open(err.error?.error || 'Error al sincronizar estatus con el SAT', 'Cerrar', { duration: 5000 });
            }
        });
    }

    aplicarFiltrosCfdis() {
        this.loadCfdis();
    }

    limpiarFiltrosCfdis() {
        this.filtroCfdiTipo = '';
        this.filtroCfdiEstado = '';
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

    calculoData: any = null;
    resumenCalculo: any = null;
    calcEmitidos: any[] = [];
    calcRecibidos: any[] = [];
    ppdExcluidos: any[] = [];
    canceladosExcluidos: any[] = [];
    conteoInfo: any = null;
    verDetalleEmitidos: boolean = false;

    loadCalculoImpuestos() {
        this.calcLoading = true;
        this.api.satGetCalculoImpuestos(this.calcAnio, this.calcMes).subscribe({
            next: (data) => {
                this.calculoData = data;
                this.resumenCalculo = data.resumen;
                this.calcEmitidos = data.emitidos || [];
                this.calcRecibidos = data.recibidos || [];
                this.ppdExcluidos = data.ppd_excluidos || [];
                this.canceladosExcluidos = data.cancelados_excluidos || [];
                this.conteoInfo = data.conteo;
                this.calcCfdis = [...this.calcEmitidos, ...this.calcRecibidos];
                this.calcLoading = false;
            },
            error: (err) => {
                console.error('[Cálculo Impuestos] Error cargando determinación:', err);
                this.calcLoading = false;
                this.snackBar.open('Error al cargar datos para el cálculo mensual', 'Cerrar', { duration: 4000 });
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

    // Separación de emitidos por tipo de receptor (Física = 13 caracteres, Moral = 12 caracteres)
    get calcEmitidosPF(): any[] {
        return this.calcEmitidos.filter(c => c.es_persona_fisica || (!c.es_persona_moral && (c.rfc_receptor || '').trim().length === 13));
    }

    get calcEmitidosPM(): any[] {
        return this.calcEmitidos.filter(c => c.es_persona_moral || (c.rfc_receptor || '').trim().length === 12);
    }

    // Subtotales cobrados
    get ingresosCobradosPF(): number {
        return this.resumenCalculo ? this.resumenCalculo.ingresosCobradosPF : this.calcEmitidosPF.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0);
    }

    get ingresosCobradosPM(): number {
        return this.resumenCalculo ? this.resumenCalculo.ingresosCobradosPM : this.calcEmitidosPM.reduce((s, c) => s + parseFloat(c.subtotal || 0), 0);
    }

    get ingresosCobradosTotales(): number {
        return this.resumenCalculo ? this.resumenCalculo.ingresosCobradosTotales : (this.ingresosCobradosPF + this.ingresosCobradosPM);
    }

    // ─── 1. ISR Federal (RESICO) ───
    get tasaIsrInfo(): { tasa: number; porcentaje: string; tope: number } {
        if (this.resumenCalculo?.tasaIsrInfo) return this.resumenCalculo.tasaIsrInfo;
        const ing = this.ingresosCobradosTotales;
        if (ing <= 25000) return { tasa: 0.01, porcentaje: '1.00%', tope: 25000 };
        if (ing <= 50000) return { tasa: 0.011, porcentaje: '1.10%', tope: 50000 };
        if (ing <= 83333.33) return { tasa: 0.015, porcentaje: '1.50%', tope: 83333.33 };
        if (ing <= 208333.33) return { tasa: 0.02, porcentaje: '2.00%', tope: 208333.33 };
        return { tasa: 0.025, porcentaje: '2.50%', tope: 3500000 };
    }

    get isrCalculado(): number {
        return this.resumenCalculo ? this.resumenCalculo.isrCalculado : Math.round(this.ingresosCobradosTotales * this.tasaIsrInfo.tasa * 100) / 100;
    }

    get isrRetenido(): number {
        return this.resumenCalculo ? this.resumenCalculo.isrRetenido : Math.round(this.ingresosCobradosPM * 0.0125 * 100) / 100;
    }

    get isrFederalAPagar(): number {
        return this.resumenCalculo ? this.resumenCalculo.isrFederalAPagar : Math.max(0, Math.round((this.isrCalculado - this.isrRetenido) * 100) / 100);
    }

    // ─── 2. Impuesto Estatal (Cedular) ───
    get tasaCedularInfo(): { tasa: number; porcentaje: string; tope: number } {
        if (this.resumenCalculo?.tasaCedularInfo) return this.resumenCalculo.tasaCedularInfo;
        const ing = this.ingresosCobradosTotales;
        if (ing <= 25000) return { tasa: 0.02, porcentaje: '2.00%', tope: 25000 };
        if (ing <= 50000) return { tasa: 0.021, porcentaje: '2.10%', tope: 50000 };
        if (ing <= 83333.33) return { tasa: 0.022, porcentaje: '2.20%', tope: 83333.33 };
        if (ing <= 208333.33) return { tasa: 0.023, porcentaje: '2.30%', tope: 208333.33 };
        return { tasa: 0.025, porcentaje: '2.50%', tope: 3500000 };
    }

    get cedularCalculado(): number {
        return this.resumenCalculo ? this.resumenCalculo.cedularCalculado : Math.round(this.ingresosCobradosTotales * this.tasaCedularInfo.tasa * 100) / 100;
    }

    get cedularRetenido(): number {
        return this.resumenCalculo ? this.resumenCalculo.cedularRetenido : this.calcEmitidos.reduce((s, c) => s + parseFloat(c.ret_cedular || 0), 0);
    }

    get impuestoEstatalAPagar(): number {
        return this.resumenCalculo ? this.resumenCalculo.impuestoEstatalAPagar : Math.max(0, Math.round((this.cedularCalculado - this.cedularRetenido) * 100) / 100);
    }

    // ─── 3. IVA ───
    get ivaEmitidos(): number {
        return this.resumenCalculo ? this.resumenCalculo.ivaEmitidos : this.calcEmitidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0);
    }

    get ivaRecibidos(): number {
        return this.resumenCalculo ? this.resumenCalculo.ivaRecibidos : this.calcRecibidos.reduce((s, c) => s + parseFloat(c.iva || 0), 0);
    }

    get ivaAPagar(): number {
        return this.resumenCalculo ? this.resumenCalculo.ivaAPagar : Math.round((this.ivaEmitidos - this.ivaRecibidos) * 100) / 100;
    }

    // ─── 4. Totales Generales ───
    get impuestoFederalTotal(): number {
        return this.resumenCalculo ? this.resumenCalculo.impuestoFederalTotal : Math.max(0, this.ivaAPagar) + this.isrFederalAPagar;
    }

    get granTotalImpuestos(): number {
        return this.resumenCalculo ? this.resumenCalculo.granTotalImpuestos : this.impuestoFederalTotal + this.impuestoEstatalAPagar;
    }

    // ─── Exportación a Excel (.xlsx) con estilos de color ───
    private xlsxStyle(bg: string, fontColor: string = 'FFFFFFFF', bold: boolean = true): any {
        return {
            fill: { fgColor: { rgb: bg } },
            font: { bold, color: { rgb: fontColor }, sz: 11 },
            alignment: { vertical: 'center', wrapText: false }
        };
    }

    private setCellStyle(ws: XLSX.WorkSheet, cellAddr: string, style: any) {
        if (!ws[cellAddr]) ws[cellAddr] = { t: 's', v: '' };
        ws[cellAddr].s = style;
    }

    private styleResumenSheet(ws: XLSX.WorkSheet) {
        // Fila 1: Título principal — azul marino oscuro
        const titleStyle = this.xlsxStyle('FF1E3A5F');
        this.setCellStyle(ws, 'A1', { ...titleStyle, font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 14 } });
        this.setCellStyle(ws, 'B1', titleStyle);

        // Filas 2-4: Metadata — azul claro
        const metaStyle = this.xlsxStyle('FFD6E4F7', 'FF1E3A5F');
        const metaStyleB = { ...metaStyle, font: { bold: false, color: { rgb: 'FF1E3A5F' } } };
        ['A2','B2','A3','B3','A4','B4'].forEach(c => this.setCellStyle(ws, c, metaStyleB));

        // Sección ISR (filas 6-14): encabezado sección en azul, sub-header en gris, final en verde oscuro
        const isrHeaderStyle = this.xlsxStyle('FF2563EB');
        const isrColHeaderStyle = this.xlsxStyle('FFD1D5DB', 'FF111827');
        const isrFinalStyle = this.xlsxStyle('FF065F46');
        const isrSubtotalStyle = this.xlsxStyle('FFEFF6FF', 'FF1E3A5F');
        this.setCellStyle(ws, 'A6', isrHeaderStyle);
        this.setCellStyle(ws, 'B6', isrHeaderStyle);
        this.setCellStyle(ws, 'A7', isrColHeaderStyle);
        this.setCellStyle(ws, 'B7', isrColHeaderStyle);
        this.setCellStyle(ws, 'A10', isrSubtotalStyle);
        this.setCellStyle(ws, 'B10', isrSubtotalStyle);
        this.setCellStyle(ws, 'A14', isrFinalStyle);
        this.setCellStyle(ws, 'B14', isrFinalStyle);

        // Sección Cedular (filas 16-24): encabezado en naranja oscuro
        const cedHeaderStyle = this.xlsxStyle('FFD97706');
        const cedColHeaderStyle = this.xlsxStyle('FFFEF3C7', 'FF78350F');
        const cedFinalStyle = this.xlsxStyle('FF7C2D12');
        const cedSubtotalStyle = this.xlsxStyle('FFFEF9EE', 'FF78350F');
        this.setCellStyle(ws, 'A16', cedHeaderStyle);
        this.setCellStyle(ws, 'B16', cedHeaderStyle);
        this.setCellStyle(ws, 'A17', cedColHeaderStyle);
        this.setCellStyle(ws, 'B17', cedColHeaderStyle);
        this.setCellStyle(ws, 'A20', cedSubtotalStyle);
        this.setCellStyle(ws, 'B20', cedSubtotalStyle);
        this.setCellStyle(ws, 'A24', cedFinalStyle);
        this.setCellStyle(ws, 'B24', cedFinalStyle);

        // Sección IVA (filas 26-30): encabezado en violeta
        const ivaHeaderStyle = this.xlsxStyle('FF7C3AED');
        const ivaColHeaderStyle = this.xlsxStyle('FFEDE9FE', 'FF4C1D95');
        const ivaFinalStyle = this.xlsxStyle('FF4C1D95');
        this.setCellStyle(ws, 'A26', ivaHeaderStyle);
        this.setCellStyle(ws, 'B26', ivaHeaderStyle);
        this.setCellStyle(ws, 'A27', ivaColHeaderStyle);
        this.setCellStyle(ws, 'B27', ivaColHeaderStyle);
        this.setCellStyle(ws, 'A30', ivaFinalStyle);
        this.setCellStyle(ws, 'B30', ivaFinalStyle);

        // Sección Resumen (filas 32-38): encabezado en gris oscuro, gran total en azul profundo
        const resHeaderStyle = this.xlsxStyle('FF374151');
        const resColHeaderStyle = this.xlsxStyle('FFF3F4F6', 'FF111827');
        const resFederalStyle = this.xlsxStyle('FF1D4ED8', 'FFFFFFFF');
        const granTotalStyle = this.xlsxStyle('FF0F172A', 'FFFFF0A0');
        this.setCellStyle(ws, 'A32', resHeaderStyle);
        this.setCellStyle(ws, 'B32', resHeaderStyle);
        this.setCellStyle(ws, 'A33', resColHeaderStyle);
        this.setCellStyle(ws, 'B33', resColHeaderStyle);
        this.setCellStyle(ws, 'A36', resFederalStyle);
        this.setCellStyle(ws, 'B36', resFederalStyle);
        this.setCellStyle(ws, 'A38', granTotalStyle);
        this.setCellStyle(ws, 'B38', granTotalStyle);
    }

    private styleDataSheet(ws: XLSX.WorkSheet, headerBg: string) {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1');
        const numCols = range.e.c + 1;

        const headerStyle = this.xlsxStyle(headerBg);
        const altRowStyle = { fill: { fgColor: { rgb: 'FFF8FAFC' } }, font: { sz: 10 } };
        const normalStyle = { fill: { fgColor: { rgb: 'FFFFFFFF' } }, font: { sz: 10 } };

        for (let C = 0; C < numCols; C++) {
            const addr = XLSX.utils.encode_cell({ r: 0, c: C });
            this.setCellStyle(ws, addr, headerStyle);
        }

        for (let R = 1; R <= range.e.r; R++) {
            const rowStyle = R % 2 === 0 ? altRowStyle : normalStyle;
            for (let C = 0; C < numCols; C++) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[addr]) ws[addr].s = rowStyle;
            }
        }
    }

    exportarCalculoExcel() {
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen de Determinación de Impuestos
        const resumenData = [
            ['DETERMINACIÓN MENSUAL DE IMPUESTOS (FLUJO DE EFECTIVO)'],
            ['Periodo:', `${this.nombreMesSeleccionado} ${this.calcAnio}`],
            ['Fecha de Cálculo:', new Date().toLocaleDateString('es-MX')],
            ['Contribuyente (RFC):', this.fielStatus?.rfc || '—'],
            [],
            ['1. IMPUESTO SOBRE LA RENTA (ISR FEDERAL - RESICO)'],
            ['Concepto', 'Importe / Detalle'],
            ['Ingresos cobrados a Personas Físicas (PUE + Pagos PPD)', this.ingresosCobradosPF],
            ['Ingresos cobrados a Personas Morales (PUE + Pagos PPD)', this.ingresosCobradosPM],
            ['Total Ingresos Cobrados', this.ingresosCobradosTotales],
            ['Tasa Aplicable según escala mensual', this.tasaIsrInfo.porcentaje],
            ['ISR Calculado (Ingresos Totales × Tasa)', this.isrCalculado],
            ['(-) ISR Retenido por Personas Morales (1.25%)', this.isrRetenido],
            ['(=) ISR FEDERAL A PAGAR', this.isrFederalAPagar],
            [],
            ['2. IMPUESTO ESTATAL (CEDULAR)'],
            ['Concepto', 'Importe / Detalle'],
            ['Ingresos cobrados a Personas Físicas', this.ingresosCobradosPF],
            ['Ingresos cobrados a Personas Morales', this.ingresosCobradosPM],
            ['Total Ingresos Cobrados', this.ingresosCobradosTotales],
            ['Tasa Aplicable Estatal según escala', this.tasaCedularInfo.porcentaje],
            ['Impuesto Cedular Calculado (Ingresos Totales × Tasa)', this.cedularCalculado],
            ['(-) Impuesto Cedular Retenido en XMLs', this.cedularRetenido],
            ['(=) IMPUESTO ESTATAL A PAGAR', this.impuestoEstatalAPagar],
            [],
            ['3. IMPUESTO AL VALOR AGREGADO (IVA)'],
            ['Concepto', 'Importe / Detalle'],
            ['IVA Trasladado (Facturas PUE + Pagos PPD cobrados)', this.ivaEmitidos],
            ['(-) IVA Acreditable (Facturas Recibidas Vigentes / Gastos)', this.ivaRecibidos],
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
        this.styleResumenSheet(wsResumen);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Cálculo de Impuestos');

        // Hoja 2: CFDIs Emitidos y Complementos de Pago del Mes
        const emitidosData = this.calcEmitidos.map(c => ({
            'Folio Fiscal (UUID)': c.uuid,
            'Origen / Tipo': c.origen === 'PPD_PAGO' ? 'Complemento de Pago (PPD)' : 'Factura PUE',
            'UUID Factura Relacionada': c.uuid_relacionado || '—',
            'Fecha Efectiva': c.origen === 'PPD_PAGO'
                ? (c.fecha_pago ? c.fecha_pago.substring(0, 10) : '')
                : (c.fecha_emision ? c.fecha_emision.substring(0, 10) : ''),
            'Tipo Receptor': c.tipo_receptor || ((c.rfc_receptor || '').trim().length === 13 ? 'Persona Física' : 'Persona Moral'),
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
            { wch: 38 }, { wch: 25 }, { wch: 38 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 35 },
            { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 }
        ];
        this.styleDataSheet(wsEmitidos, 'FF1D4ED8'); // azul para Emitidos
        XLSX.utils.book_append_sheet(wb, wsEmitidos, 'Emitidos y Pagos');

        // Hoja 3: CFDIs Recibidos del Mes (Vigentes)
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
        this.styleDataSheet(wsRecibidos, 'FF0F766E'); // teal para Recibidos
        XLSX.utils.book_append_sheet(wb, wsRecibidos, 'Recibidos (Gastos)');

        // Hoja 4: CFDIs Excluidos del Cálculo (PPD no cobrados y Cancelados)
        if (this.ppdExcluidos.length > 0 || this.canceladosExcluidos.length > 0) {
            const excluidosData = [
                ...this.ppdExcluidos.map(c => ({
                    'Folio Fiscal (UUID)': c.uuid,
                    'Motivo de Exclusión': 'Factura PPD diferida (se acumula hasta su pago)',
                    'Fecha Emisión': c.fecha_emision ? c.fecha_emision.substring(0, 10) : '',
                    'RFC Receptor': c.rfc_receptor || '',
                    'Nombre Receptor': c.nombre_receptor || '',
                    'Subtotal': parseFloat(c.subtotal || 0),
                    'IVA': parseFloat(c.iva || 0),
                    'Total': parseFloat(c.total || 0)
                })),
                ...this.canceladosExcluidos.map(c => ({
                    'Folio Fiscal (UUID)': c.uuid,
                    'Motivo de Exclusión': 'Comprobante Cancelado ante el SAT',
                    'Fecha Emisión': c.fecha_emision ? c.fecha_emision.substring(0, 10) : '',
                    'RFC Receptor': c.rfc_receptor || c.rfc_emisor || '',
                    'Nombre Receptor': c.nombre_receptor || '',
                    'Subtotal': parseFloat(c.subtotal || 0),
                    'IVA': parseFloat(c.iva || 0),
                    'Total': parseFloat(c.total || 0)
                }))
            ];
            const wsExcluidos = XLSX.utils.json_to_sheet(excluidosData);
            wsExcluidos['!cols'] = [
                { wch: 38 }, { wch: 45 }, { wch: 14 }, { wch: 16 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 14 }
            ];
            this.styleDataSheet(wsExcluidos, 'FF6B7280'); // gris para Excluidos
            XLSX.utils.book_append_sheet(wb, wsExcluidos, 'CFDIs Excluidos');
        }

        XLSX.writeFile(wb, `Determinacion_Impuestos_${this.nombreMesSeleccionado}_${this.calcAnio}.xlsx`);
        this.snackBar.open(`✓ Hoja de cálculo descargada: Determinacion_Impuestos_${this.nombreMesSeleccionado}_${this.calcAnio}.xlsx`, 'OK', { duration: 4000 });
    }
}
