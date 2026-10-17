import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as QRCode from 'qrcode';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    // Custom number to text converter for Spanish
    private numeroALetras(num: number, currency: string = 'MXN'): string {
        const currencyName = currency === 'USD' ? 'DÓLARES' : 'PESOS';
        const currencySuffix = currency === 'USD' ? 'USD' : 'M.N.';

        const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        if (num === 0) return `CERO ${currencyName} 00/100 ${currencySuffix}`;

        const entero = Math.floor(num);
        const centavos = Math.round((num - entero) * 100);
        let resultado = '';

        if (entero >= 1000000) {
            const millones = Math.floor(entero / 1000000);
            resultado += (millones === 1 ? 'UN MILLÓN ' : this.convertirGrupo(millones) + ' MILLONES ');
        }

        const miles = Math.floor((entero % 1000000) / 1000);
        if (miles > 0) {
            resultado += (miles === 1 ? 'MIL ' : this.convertirGrupo(miles) + ' MIL ');
        }

        const resto = entero % 1000;
        if (resto > 0) {
            resultado += this.convertirGrupo(resto);
        }

        return resultado.trim() + ` ${currencyName} ${centavos.toString().padStart(2, '0')}/100 ${currencySuffix}`;
    }

    private convertirGrupo(num: number): string {
        const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        let resultado = '';
        const c = Math.floor(num / 100);
        const d = Math.floor((num % 100) / 10);
        const u = num % 10;

        if (c > 0) {
            resultado += (num === 100 ? 'CIEN' : centenas[c]) + ' ';
        }

        if (d === 1) {
            resultado += especiales[u] + ' ';
        } else {
            if (d > 0) {
                resultado += decenas[d];
                if (u > 0) resultado += ' Y ';
            }
            if (u > 0 && d !== 1) {
                resultado += unidades[u] + ' ';
            }
        }

        return resultado.trim();
    }

    generateSalePdf(sale: any, items: any[], client: any, settings: any, autoOpen: boolean = true): jsPDF {
        const doc = new jsPDF();

        // Settings / Brand Data
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const bankName = settings.bank_name || 'BBVA';
        const bankCard = settings.bank_card || '4152 3146 4227 0287';
        const footerText = settings.footer_text || 'Esta orden de servicio se emite para describir los servicios prestados.';

        const primaryColor = [30, 78, 140];
        const textColor = [31, 45, 61];

        // -- HEADER --
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');

        // Logo
        if (logo) {
            try {
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 22.5, 9, 'F');
            }
        } else {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 22.5, 9, 'F');
        }

        // Company Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.toUpperCase(), 40, 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(profession, 40, 23);

        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';

        try {
            doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2);
        } catch (e) { }

        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`476-135-7354`, 44.5, 28.5);

        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27);
        doc.line(76, 26, 74.5, 27);
        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE SERVICIO', 195, 24, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 40, 200, 40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Orden No.:', 15, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(String(sale.folio || sale.id || 'S/N'), 38, 46);

        const dateStr = sale.date ? new Date(sale.date).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', 160, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(dateStr, 175, 46);
        doc.line(10, 50, 200, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 15, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(String(client?.name || 'Público General'), 31, 56);
        doc.line(10, 60, 200, 60);

        const tableColumn = ["Cant.", "Descripción del servicio", "Precio Unitario", "Importe"];
        const tableRows = items.map(item => [
            '1',
            `${item.description || 'Servicio'}${item.notes ? `. ${item.notes}` : ''}`,
            `$${parseFloat(item.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            `$${parseFloat(item.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            margin: { left: 10, right: 10 },
            theme: 'grid',
            headStyles: { fillColor: [30, 78, 140], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3, textColor: [31, 45, 61] },
            columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0);

        if (sale.observations && sale.observations.trim() !== '') {
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(10, finalY, 110, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Observaciones:', 13, finalY + 4.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const splitObs = doc.splitTextToSize(sale.observations, 104);
            doc.text(splitObs, 13, finalY + 12);
        }

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, finalY, 70, 16);
        doc.setFontSize(9);
        doc.text('Subtotal:', 135, finalY + 6);
        doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, finalY + 6, { align: 'right' });
        doc.line(130, finalY + 9, 200, finalY + 9);
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, finalY + 9, 70, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 135, finalY + 14);
        doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, finalY + 14, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CANTIDAD CON LETRA:', 10, finalY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.numeroALetras(total)}`, 45, finalY + 22);

        const bankY = Math.max(finalY + 30, (doc as any).lastAutoTable.finalY + 40);
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, bankY, 190, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos para transferencia:', 13, bankY + 4.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(`Banco: ${bankName}`, 13, bankY + 13);
        doc.text(`Tarjeta / Cuenta: ${bankCard}`, 80, bankY + 13);

        doc.setDrawColor(204, 204, 204);
        doc.line(10, 275, 200, 275);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(footerText, 10, 280, { maxWidth: 190 });

        if (autoOpen) {
            const fileName = `${sale.folio || 'Venta'} - ${client.name}.pdf`;
            doc.setProperties({ title: fileName });
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const pdfWindow = window.open("", "_blank");
            if (pdfWindow) {
                pdfWindow.document.write(`<html><head><title>${fileName}</title><style>body { margin: 0; padding: 0; overflow: hidden; }</style></head><body><embed src="${url}" type="application/pdf" width="100%" height="100%"></body></html>`);
                pdfWindow.document.close();
            }
        }
        return doc;
    }

    generatePolicyPdf(policy: any, records: any[], settings: any): jsPDF {
        const doc = new jsPDF();
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const primaryColor = [30, 78, 140];
        const textColor = [31, 45, 61];
        const centerX = 105;
        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');
        if (logo) {
            try {
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 22.5, 9, 'F');
            }
        } else {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 22.5, 9, 'F');
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.toUpperCase(), 40, 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(profession, 40, 23);
        try { doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2); } catch (e) { }
        doc.setFontSize(7);
        doc.text(`476-135-7354`, 44.5, 28.5);
        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27);
        doc.line(76, 26, 74.5, 27);
        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PÓLIZA DE SERVICIO', 195, 24, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 40, 200, 40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Póliza No.:', 15, 46);
        doc.setFont('helvetica', 'normal');
        const policyNumStr = String(policy.policy_number || '');
        doc.text(policyNumStr, 35, 46);

        if (policy.invoice_number && String(policy.invoice_number).trim() !== '') {
            const policyNumWidth = doc.getTextWidth(policyNumStr);
            const invoiceX = 35 + policyNumWidth + 8;
            doc.setFont('helvetica', 'bold');
            doc.text('Factura No.:', invoiceX, 46);
            doc.setFont('helvetica', 'normal');
            doc.text(String(policy.invoice_number).trim(), invoiceX + 24, 46);
        }

        const dateStr = policy.date ? new Date(policy.date).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', 160, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(dateStr, 175, 46);
        doc.line(10, 50, 200, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 15, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(String(policy.client_name), 30, 56);
        doc.line(10, 60, 200, 60);

        const cardWidth = 46;
        const cardHeight = 22;
        const startY = 65;
        const gap = 2;
        const formatMinutes = (m: number) => {
            const h = Math.floor(m / 60);
            const min = Math.round(m % 60);
            return `${h}h ${min}min`;
        };
        const cards = [
            { label: 'TOTAL', value: `${policy.total_hours}h`, color: [30, 78, 140] },
            { label: 'USADO', value: formatMinutes(policy.used_minutes), color: [245, 124, 0] },
            { label: 'RESTANTE', value: formatMinutes(policy.remaining_minutes), color: [56, 142, 60] },
            { label: 'AVANCE', value: `${Math.round((policy.used_minutes / (policy.total_hours * 60)) * 100)}%`, color: [123, 31, 162] }
        ];

        cards.forEach((card, i) => {
            const x = 10 + (cardWidth + gap) * i;
            doc.setDrawColor(230, 230, 230);
            doc.setFillColor(255, 255, 255);
            doc.rect(x, startY, cardWidth, cardHeight, 'FD');
            doc.setFillColor(card.color[0], card.color[1], card.color[2]);
            doc.rect(x, startY, 4, cardHeight, 'F');
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            doc.text(card.label, x + 8, startY + 8);
            doc.setFontSize(12);
            doc.setTextColor(card.color[0], card.color[1], card.color[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(card.value, x + 8, startY + 16);
        });

        const tableColumn = ["Fecha", "Descripción", "Inicio", "Fin", "Duración", "Tipo", "Solicitado por"];
        const tableRows = records.map(r => [
            new Date(r.service_date).toLocaleDateString('es-MX'),
            r.description,
            r.start_time.substring(0, 5),
            r.end_time.substring(0, 5),
            formatMinutes(r.duration_minutes),
            r.service_type,
            r.requested_by || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + cardHeight + 10,
            margin: { left: 10, right: 10 },
            theme: 'grid',
            headStyles: { fillColor: [30, 78, 140], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 1: { cellWidth: 'auto' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' }, 6: { halign: 'center' } }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        if (policy.remaining_minutes <= 0) {
            doc.setFillColor(56, 142, 60);
            doc.rect(10, finalY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('PÓLIZA COMPLETADA - TOTALMENTE CONSUMIDA', centerX, finalY + 5.5, { align: 'center' });
        }

        const fileName = `${policy.policy_number} - ${policy.client_name}.pdf`;
        doc.setProperties({ title: fileName });
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
            pdfWindow.document.write(`<html><head><title>${fileName}</title><style>body { margin: 0; padding: 0; overflow: hidden; }</style></head><body><embed src="${url}" type="application/pdf" width="100%" height="100%"></body></html>`);
            pdfWindow.document.close();
        }
        return doc;
    }

    generateServiceRecordPdf(record: any, policy: any, settings: any): jsPDF {
        const doc = new jsPDF();

        // Settings / Brand Data
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const footerText = settings.footer_text || 'Esta orden de servicio se emite para describir los servicios prestados.';

        const primaryColor = [30, 78, 140];
        const textColor = [31, 45, 61];

        // -- HEADER (same as sales PDF) --
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');

        // Logo
        if (logo) {
            try {
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 22.5, 9, 'F');
            }
        } else {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 22.5, 9, 'F');
        }

        // Company Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.toUpperCase(), 40, 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(profession, 40, 23);

        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';

        try {
            doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2);
        } catch (e) { }

        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`476-135-7354`, 44.5, 28.5);

        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27);
        doc.line(76, 26, 74.5, 27);
        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);

        // Title: "ORDEN DE SERVICIO"
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ORDEN DE SERVICIO', 195, 20, { align: 'right' });

        // Subtitle: "Póliza # <number>"
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const policySub = policy.invoice_number && String(policy.invoice_number).trim() !== ''
            ? `Póliza # ${policy.policy_number}  |  Factura # ${policy.invoice_number}`
            : `Póliza # ${policy.policy_number}`;
        doc.text(policySub, 195, 27, { align: 'right' });

        // -- Info section below header --
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 40, 200, 40);

        // Time info instead of "Orden No."
        const startTime = record.start_time ? record.start_time.substring(0, 5) : '';
        const endTime = record.end_time ? record.end_time.substring(0, 5) : '';
        const formatMinutes = (m: number) => {
            const h = Math.floor(m / 60);
            const min = Math.round(m % 60);
            return `${h}h ${min}min`;
        };
        const durationStr = formatMinutes(record.duration_minutes || 0);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Hora Inicio:', 15, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(startTime, 38, 46);

        doc.setFont('helvetica', 'bold');
        doc.text('Hora Fin:', 55, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(endTime, 73, 46);

        doc.setFont('helvetica', 'bold');
        doc.text('Duración:', 95, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(durationStr, 115, 46);

        // Date (same position as sales PDF)
        const dateStr = record.service_date
            ? new Date(record.service_date).toLocaleDateString('es-MX')
            : new Date().toLocaleDateString('es-MX');
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', 160, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(dateStr, 175, 46);
        doc.line(10, 50, 200, 50);

        // Client (same position as sales PDF)
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 15, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(String(policy.client_name || ''), 31, 56);
        doc.line(10, 60, 200, 60);

        // Table with only "Descripción de Servicio"
        const tableColumn = ["Descripción de Servicio"];
        const tableRows = [[record.description || 'Servicio']];

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            margin: { left: 10, right: 10 },
            theme: 'grid',
            headStyles: { fillColor: [30, 78, 140], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3, textColor: [31, 45, 61] },
            columnStyles: { 0: { cellWidth: 'auto' } }
        });

        // Footer
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 275, 200, 275);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(footerText, 10, 280, { maxWidth: 190 });

        // Open the PDF
        const fileName = `Orden Servicio - ${policy.policy_number} - ${policy.client_name}.pdf`;
        doc.setProperties({ title: fileName });
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
            pdfWindow.document.write(`<html><head><title>${fileName}</title><style>body { margin: 0; padding: 0; overflow: hidden; }</style></head><body><embed src="${url}" type="application/pdf" width="100%" height="100%"></body></html>`);
            pdfWindow.document.close();
        }
        return doc;
    }

    generateQuotationPdf(quotation: any, items: any[], client: any, settings: any, autoOpen: boolean = true): jsPDF {
        const doc = new jsPDF();
        
        const ivaMode = quotation.iva_mode || 'none';
        const subtotalItems = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
        const hasDiscount = items.some((item: any) => item.discount > 0);
        
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const bankName = settings.bank_name || 'BBVA';
        const bankCard = settings.bank_card || '4152 3146 4227 0287';
        const footerText = settings.footer_text || 'Esta cotización se emite para describir los servicios y/o productos ofrecidos.';
        
        const primaryColor = [30, 78, 140];
        const textColor = [31, 45, 61];

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');

        if (logo) {
            try {
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 22.5, 9, 'F');
            }
        } else {
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 22.5, 9, 'F');
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName.toUpperCase(), 40, 18);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(profession, 40, 23);

        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';
        try { doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2); } catch (e) { }
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`476-135-7354`, 44.5, 28.5);
        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27);
        doc.line(76, 26, 74.5, 27);
        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('COTIZACIÓN', 195, 24, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 40, 200, 40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Cotización No.:', 15, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(String(quotation.folio || 'S/N'), 43, 46);
        const dateStr = quotation.date ? new Date(quotation.date).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', 160, 46);
        doc.setFont('helvetica', 'normal');
        doc.text(dateStr, 175, 46);
        doc.line(10, 50, 200, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 15, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(String(client?.name || 'Público General'), 31, 56);
        doc.line(10, 60, 200, 60);

        let tableColumn: string[];
        let columnStyles: any;
        const isIvaEnabled = ivaMode !== 'none';

        if (isIvaEnabled) {
            if (hasDiscount) {
                tableColumn = ["Cant.", "Descripción", "P. Unitario", "Desc. %", "IVA 16%", "Importe"];
                columnStyles = {
                    0: { cellWidth: 12, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 25, halign: 'right' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 25, halign: 'right' },
                    5: { cellWidth: 25, halign: 'right' }
                };
            } else {
                tableColumn = ["Cant.", "Descripción", "P. Unitario", "IVA 16%", "Importe"];
                columnStyles = {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 30, halign: 'right' }
                };
            }
        } else {
            if (hasDiscount) {
                tableColumn = ["Cant.", "Descripción", "P. Unitario", "Desc. %", "Importe"];
                columnStyles = {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 30, halign: 'right' }
                };
            } else {
                tableColumn = ["Cant.", "Descripción", "Precio Unitario", "Importe"];
                columnStyles = {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 35, halign: 'right' }
                };
            }
        }

        const tableRows = items.map((item: any) => {
            let unitPrice = parseFloat(item.unitPrice || 0);
            let quantity = parseFloat(item.quantity || 1);
            let discountPercent = parseFloat(item.discount || 0);
            
            // Base price calculation depending on mode
            let unitPriceSiva: number;
            if (ivaMode === 'breakdown') {
                unitPriceSiva = unitPrice / 1.16;
            } else {
                unitPriceSiva = unitPrice;
            }

            const subtotalItemSiva = unitPriceSiva * quantity;
            const discountAmount = subtotalItemSiva * (discountPercent / 100);
            const baseForIva = subtotalItemSiva - discountAmount;
            const ivaItem = baseForIva * 0.16;
            const totalItemCiva = baseForIva + ivaItem;

            const discountDisplay = discountPercent > 0 
                ? `${discountPercent}% - $${discountAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                : '-';

            if (isIvaEnabled) {
                if (hasDiscount) {
                    return [
                        String(quantity),
                        item.description || 'Producto',
                        `$${unitPriceSiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        discountDisplay,
                        `$${ivaItem.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        `$${totalItemCiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    ];
                } else {
                    return [
                        String(quantity),
                        item.description || 'Producto',
                        `$${unitPriceSiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        `$${ivaItem.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        `$${totalItemCiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    ];
                }
            } else {
                const finalAmountNoIva = subtotalItemSiva - discountAmount;
                if (hasDiscount) {
                    return [
                        String(quantity),
                        item.description || 'Producto',
                        `$${unitPriceSiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        discountDisplay,
                        `$${finalAmountNoIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    ];
                } else {
                    return [
                        String(quantity),
                        item.description || 'Producto',
                        `$${unitPriceSiva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        `$${finalAmountNoIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    ];
                }
            }
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            margin: { left: 10, right: 10 },
            theme: 'grid',
            headStyles: { fillColor: [30, 78, 140], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 8, cellPadding: 2, textColor: [31, 45, 61] },
            columnStyles
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        let subtotalDisplay: number;
        let ivaAmount: number;
        let totalDisplay: number;
        
        // Calculate total discount for the summary
        const totalDiscountAmount = items.reduce((sum, item) => {
            const up = parseFloat(item.unitPrice || 0);
            const q = parseFloat(item.quantity || 1);
            const dp = parseFloat(item.discount || 0);
            const base = ivaMode === 'breakdown' ? up / 1.16 : up;
            return sum + (base * q * (dp / 100));
        }, 0);

        if (ivaMode === 'add') {
            subtotalDisplay = subtotalItems;
            ivaAmount = subtotalItems * 0.16;
            totalDisplay = subtotalItems + ivaAmount;
        } else if (ivaMode === 'breakdown') {
            subtotalDisplay = subtotalItems / 1.16;
            ivaAmount = subtotalItems - subtotalDisplay;
            totalDisplay = subtotalItems;
        } else {
            subtotalDisplay = subtotalItems;
            ivaAmount = 0;
            totalDisplay = subtotalItems;
        }

        if (quotation.observations && quotation.observations.trim() !== '') {
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(10, finalY, 110, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Observaciones:', 13, finalY + 4.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const splitObs = doc.splitTextToSize(quotation.observations, 104);
            doc.text(splitObs, 13, finalY + 12);
        }

        const hasAnyDiscount = totalDiscountAmount > 0;
        let totalsHeight = 16; // Basic: Subtotal + Total
        if (ivaMode !== 'none') totalsHeight += 12; // + IVA row
        if (hasAnyDiscount) totalsHeight += 12; // + Discount row

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, finalY, 70, totalsHeight);
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        // Subtotal row (Bruto)
        const subtotalBruto = subtotalDisplay + totalDiscountAmount;
        doc.text('Subtotal:', 135, finalY + 6);
        doc.text(`$${subtotalBruto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, finalY + 6, { align: 'right' });
        doc.line(130, finalY + 9, 200, finalY + 9);
        
        let currentY = finalY + 9;

        // Discount row
        if (hasAnyDiscount) {
            doc.text('Descuento:', 135, currentY + 6);
            doc.text(`-$${totalDiscountAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, currentY + 6, { align: 'right' });
            doc.line(130, currentY + 9, 200, currentY + 9);
            currentY += 9;
        }

        // IVA row
        if (ivaMode !== 'none') {
            doc.text('IVA 16%:', 135, currentY + 6);
            doc.text(`$${ivaAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, currentY + 6, { align: 'right' });
            doc.line(130, currentY + 9, 200, currentY + 9);
            currentY += 9;
        }

        // Total row
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, currentY, 70, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 135, currentY + 5);
        doc.text(`$${totalDisplay.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, currentY + 5, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const lettersY = currentY + 20;
        doc.text('CANTIDAD CON LETRA:', 10, lettersY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.numeroALetras(totalDisplay, quotation.currency)}`, 45, lettersY);

        const bankY = Math.max(lettersY + 12, (doc as any).lastAutoTable.finalY + 45);
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, bankY, 190, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos para transferencia:', 13, bankY + 4.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Banco: ${bankName}`, 13, bankY + 13);
        doc.text(`Tarjeta / Cuenta: ${bankCard}`, 80, bankY + 13);

        doc.setDrawColor(204, 204, 204);
        doc.line(10, 280, 200, 280);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(footerText, 105, 285, { align: 'center' });

        if (autoOpen) {
            const fileName = `${quotation.folio || 'Cotizacion'} - ${client.name}.pdf`;
            doc.setProperties({ title: fileName });
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const pdfWindow = window.open("", "_blank");
            if (pdfWindow) {
                pdfWindow.document.write(`<html><head><title>${fileName}</title><style>body { margin: 0; padding: 0; overflow: hidden; }</style></head><body><embed src="${url}" type="application/pdf" width="100%" height="100%"></body></html>`);
                pdfWindow.document.close();
            }
        }
        return doc;
    }

    // --- CFDI PDF GENERATOR ---

    private getRegimenFiscalLabel(code: string): string {
        const map: { [k: string]: string } = {
            '601': '601 - General de Ley Personas Morales',
            '603': '603 - Personas Morales con Fines no Lucrativos',
            '605': '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios',
            '606': '606 - Arrendamiento',
            '607': '607 - Régimen de Enajenación o Adquisición de Bienes',
            '608': '608 - Demás ingresos',
            '610': '610 - Residentes en el Extranjero sin Establecimiento Permanente en México',
            '611': '611 - Ingresos por Dividendos (socios y accionistas)',
            '612': '612 - Personas Físicas con Actividades Empresariales y Profesionales',
            '614': '614 - Ingresos por intereses',
            '615': '615 - Régimen de los ingresos por obtención de premios',
            '616': '616 - Sin obligaciones fiscales',
            '620': '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
            '621': '621 - Incorporación Fiscal',
            '622': '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
            '623': '623 - Opcional para Grupos de Sociedades',
            '624': '624 - Coordinados',
            '625': '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
            '626': '626 - Régimen Simplificado de Confianza'
        };
        return map[code] || (code ? `${code}` : '—');
    }

    private getUsoCfdiLabel(code: string): string {
        const map: { [k: string]: string } = {
            'G01': 'G01 - Adquisición de mercancías',
            'G02': 'G02 - Devoluciones, descuentos o bonificaciones',
            'G03': 'G03 - Gastos en general.',
            'I01': 'I01 - Construcciones',
            'I02': 'I02 - Mobiliario y equipo de oficina por inversiones',
            'I03': 'I03 - Equipo de transporte',
            'I04': 'I04 - Equipo de cómputo y accesorios',
            'I05': 'I05 - Dados, troqueles, moldes, matrices y herramental',
            'I06': 'I06 - Comunicaciones telefónicas',
            'I07': 'I07 - Comunicaciones satelitales',
            'I08': 'I08 - Otra maquinaria y equipo',
            'D01': 'D01 - Honorarios médicos, dentales y gastos hospitalarios',
            'D02': 'D02 - Gastos médicos por incapacidad o discapacidad',
            'D03': 'D03 - Gastos funerales',
            'D04': 'D04 - Donativos',
            'D05': 'D05 - Intereses reales efectivamente pagados por créditos hipotecarios',
            'D06': 'D06 - Aportaciones voluntarias al SAR',
            'D07': 'D07 - Primas por seguros de gastos médicos',
            'D08': 'D08 - Gastos de transportación escolar obligatoria',
            'D09': 'D09 - Depósitos en cuentas personales para el ahorro',
            'D10': 'D10 - Pagos por servicios educativos (colegiaturas)',
            'S01': 'S01 - Sin efectos fiscales',
            'CP01': 'CP01 - Pagos',
            'CN01': 'CN01 - Nómina'
        };
        return map[code] || (code ? `${code}` : '—');
    }

    private getMetodoPagoLabel(code: string): string {
        const map: { [k: string]: string } = {
            'PUE': 'PUE - Pago en una sola exhibición',
            'PPD': 'PPD - Pago en parcialidades o diferido'
        };
        return map[code] || (code ? `${code}` : '—');
    }

    private getFormaPagoLabel(code: string): string {
        const map: { [k: string]: string } = {
            '01': '01 - Efectivo',
            '02': '02 - Cheque nominativo',
            '03': '03 - Transferencia electrónica de fondos',
            '04': '04 - Tarjeta de crédito',
            '05': '05 - Monedero electrónico',
            '06': '06 - Dinero electrónico',
            '08': '08 - Vales de despensa',
            '12': '12 - Dación en pago',
            '13': '13 - Pago por subrogación',
            '14': '14 - Pago por consignación',
            '15': '15 - Condonación',
            '17': '17 - Compensación',
            '28': '28 - Tarjeta de débito',
            '29': '29 - Tarjeta de servicios',
            '30': '30 - Aplicación de anticipos',
            '31': '31 - Intermediario pagos',
            '99': '99 - Por definir'
        };
        return map[code] || (code ? `${code}` : '—');
    }

    private getTipoComprobanteLabel(code: string): string {
        const map: { [k: string]: string } = {
            'I': 'I - Ingreso',
            'E': 'E - Egreso',
            'P': 'P - Pago',
            'N': 'N - Nómina',
            'T': 'T - Traslado'
        };
        return map[code] || (code ? `${code}` : '—');
    }

    private getMonedaLabel(code: string): string {
        const map: { [k: string]: string } = {
            'MXN': 'MXN - Peso Mexicano',
            'USD': 'USD - Dólar Americano',
            'EUR': 'EUR - Euro'
        };
        return map[code] || (code ? `${code}` : 'MXN - Peso Mexicano');
    }

    private formatSatDate(dateStr: string): string {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr.replace('T', ' ');
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const seconds = d.getSeconds().toString().padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        } catch {
            return dateStr.replace('T', ' ');
        }
    }

    private parseCfdiXml(xmlContent: string): any {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        const getAttr = (element: Element | null, attr: string): string => {
            if (!element) return '';
            return element.getAttribute(attr) || element.getAttribute(attr.toLowerCase()) || '';
        };

        const findFirst = (parent: Element | Document, localName: string): Element | null => {
            const all = parent.getElementsByTagName('*');
            for (let i = 0; i < all.length; i++) {
                if (all[i].localName === localName) return all[i];
            }
            return null;
        };

        const findAll = (parent: Element | Document, localName: string): Element[] => {
            const res: Element[] = [];
            const all = parent.getElementsByTagName('*');
            for (let i = 0; i < all.length; i++) {
                if (all[i].localName === localName) res.push(all[i]);
            }
            return res;
        };

        const comprobanteEl = findFirst(xmlDoc, 'Comprobante');
        const emisorEl = findFirst(xmlDoc, 'Emisor');
        const receptorEl = findFirst(xmlDoc, 'Receptor');
        const timbreEl = findFirst(xmlDoc, 'TimbreFiscalDigital');
        const impuestosEl = findFirst(xmlDoc, 'Impuestos');

        // Conceptos
        const conceptosList = findAll(xmlDoc, 'Concepto');
        const conceptos = conceptosList.map(c => {
            const traslados = findAll(c, 'Traslado').map(t => {
                const imp = getAttr(t, 'Impuesto');
                const impName = imp === '002' ? 'IVA' : (imp === '001' ? 'ISR' : imp);
                const monto = parseFloat(getAttr(t, 'Importe') || '0').toFixed(2);
                return `${imp} ${impName} ${monto}`;
            });
            const retenciones = findAll(c, 'Retencion').map(r => {
                const imp = getAttr(r, 'Impuesto');
                const impName = imp === '002' ? 'Ret. IVA' : (imp === '001' ? 'Ret. ISR' : imp);
                const monto = parseFloat(getAttr(r, 'Importe') || '0').toFixed(2);
                return `${imp} ${impName} ${monto}`;
            });

            const objetoImp = getAttr(c, 'ObjetoImp');
            const objLabel = objetoImp === '02' ? '02 - Sí objeto de impuesto.' :
                             (objetoImp === '01' ? '01 - No objeto de impuesto.' : (objetoImp || ''));

            const impParts = [objLabel, ...traslados, ...retenciones].filter(Boolean);

            return {
                claveProdServ: getAttr(c, 'ClaveProdServ'),
                noIdentificacion: getAttr(c, 'NoIdentificacion'),
                cantidad: parseFloat(getAttr(c, 'Cantidad') || '1'),
                claveUnidad: getAttr(c, 'ClaveUnidad'),
                unidad: getAttr(c, 'Unidad'),
                descripcion: getAttr(c, 'Descripcion'),
                valorUnitario: parseFloat(getAttr(c, 'ValorUnitario') || '0'),
                importe: parseFloat(getAttr(c, 'Importe') || '0'),
                descuento: parseFloat(getAttr(c, 'Descuento') || '0'),
                objetoImp,
                impuestosDetalle: impParts.join('\n')
            };
        });

        // Detalle de impuestos globales
        const trasladosGlobales: any[] = [];
        const retencionesGlobales: any[] = [];

        if (impuestosEl) {
            // Find direct or descendant traslados/retenciones
            const trasladosEls = findAll(impuestosEl, 'Traslado');
            trasladosEls.forEach(t => {
                const imp = getAttr(t, 'Impuesto');
                const impName = imp === '002' ? 'IVA' : (imp === '001' ? 'ISR' : (imp === '003' ? 'IEPS' : imp));
                trasladosGlobales.push({
                    clave: imp,
                    impuesto: impName,
                    tipo: 'Traslado',
                    factor: getAttr(t, 'TipoFactor') || 'Tasa',
                    tasaOCuota: getAttr(t, 'TasaOCuota') || '',
                    importe: parseFloat(getAttr(t, 'Importe') || '0')
                });
            });

            const retencionesEls = findAll(impuestosEl, 'Retencion');
            retencionesEls.forEach(r => {
                const imp = getAttr(r, 'Impuesto');
                const impName = imp === '002' ? 'IVA' : (imp === '001' ? 'ISR' : (imp === '003' ? 'IEPS' : imp));
                retencionesGlobales.push({
                    clave: imp,
                    impuesto: impName,
                    tipo: 'Retención',
                    factor: getAttr(r, 'TipoFactor') || 'Tasa',
                    tasaOCuota: getAttr(r, 'TasaOCuota') || '',
                    importe: parseFloat(getAttr(r, 'Importe') || '0')
                });
            });
        }

        // Impuestos Locales (Cedular)
        const retencionesLocalesEls = findAll(xmlDoc, 'RetencionesLocales');
        retencionesLocalesEls.forEach(rl => {
            const impName = getAttr(rl, 'ImpLocRetenido') || 'Cedular';
            const tasa = getAttr(rl, 'TasadeRetencion') || '';
            const tasaNum = parseFloat(tasa) || 0;
            const tasaNorm = tasaNum > 1 ? (tasaNum / 100).toFixed(6) : tasaNum.toFixed(6);
            retencionesGlobales.push({
                clave: 'cedular',
                impuesto: `Impuesto Estatal ${impName.charAt(0).toUpperCase() + impName.slice(1)}`,
                tipo: 'Retención',
                factor: 'Tasa',
                tasaOCuota: tasaNorm,
                importe: parseFloat(getAttr(rl, 'Importe') || '0')
            });
        });

        // Complemento de Pagos (Doctos Relacionados)
        const pagosDoctos: any[] = [];
        const doctosRelEls = findAll(xmlDoc, 'DoctoRelacionado');
        doctosRelEls.forEach(dr => {
            pagosDoctos.push({
                uuid: getAttr(dr, 'IdDocumento'),
                serie: getAttr(dr, 'Serie'),
                folio: getAttr(dr, 'Folio'),
                moneda: getAttr(dr, 'MonedaDR') || 'MXN',
                numParcialidad: getAttr(dr, 'NumParcialidad') || '1',
                saldoAnterior: parseFloat(getAttr(dr, 'ImpSaldoAnt') || '0'),
                montoPagado: parseFloat(getAttr(dr, 'ImpPagado') || '0'),
                saldoInsoluto: parseFloat(getAttr(dr, 'ImpSaldoInsoluto') || '0')
            });
        });

        return {
            comprobante: {
                version: getAttr(comprobanteEl, 'Version') || '4.0',
                serie: getAttr(comprobanteEl, 'Serie'),
                folio: getAttr(comprobanteEl, 'Folio'),
                fecha: getAttr(comprobanteEl, 'Fecha'),
                noCertificado: getAttr(comprobanteEl, 'NoCertificado'),
                lugarExpedicion: getAttr(comprobanteEl, 'LugarExpedicion'),
                tipoDeComprobante: getAttr(comprobanteEl, 'TipoDeComprobante') || 'I',
                formaPago: getAttr(comprobanteEl, 'FormaPago'),
                metodoPago: getAttr(comprobanteEl, 'MetodoPago'),
                moneda: getAttr(comprobanteEl, 'Moneda') || 'MXN',
                tipoCambio: getAttr(comprobanteEl, 'TipoCambio'),
                condicionesDePago: getAttr(comprobanteEl, 'CondicionesDePago'),
                exportacion: getAttr(comprobanteEl, 'Exportacion') || '01',
                subTotal: parseFloat(getAttr(comprobanteEl, 'SubTotal') || '0'),
                descuento: parseFloat(getAttr(comprobanteEl, 'Descuento') || '0'),
                total: parseFloat(getAttr(comprobanteEl, 'Total') || '0'),
                sello: getAttr(comprobanteEl, 'Sello')
            },
            emisor: {
                rfc: getAttr(emisorEl, 'Rfc'),
                nombre: getAttr(emisorEl, 'Nombre'),
                regimenFiscal: getAttr(emisorEl, 'RegimenFiscal')
            },
            receptor: {
                rfc: getAttr(receptorEl, 'Rfc'),
                nombre: getAttr(receptorEl, 'Nombre'),
                domicilioFiscalReceptor: getAttr(receptorEl, 'DomicilioFiscalReceptor'),
                regimenFiscalReceptor: getAttr(receptorEl, 'RegimenFiscalReceptor'),
                usoCFDI: getAttr(receptorEl, 'UsoCFDI'),
                domicilio: receptorEl ? getAttr(findFirst(receptorEl, 'Domicilio'), 'Calle') : ''
            },
            conceptos,
            impuestos: {
                totalRetenciones: parseFloat(getAttr(impuestosEl, 'TotalImpuestosRetenidos') || '0'),
                totalTraslados: parseFloat(getAttr(impuestosEl, 'TotalImpuestosTrasladados') || '0'),
                traslados: trasladosGlobales,
                retenciones: retencionesGlobales
            },
            timbre: {
                version: getAttr(timbreEl, 'Version') || '1.1',
                uuid: getAttr(timbreEl, 'UUID'),
                fechaTimbrado: getAttr(timbreEl, 'FechaTimbrado'),
                rfcProvCertif: getAttr(timbreEl, 'RfcProvCertif'),
                selloCFD: getAttr(timbreEl, 'SelloCFD'),
                noCertificadoSAT: getAttr(timbreEl, 'NoCertificadoSAT'),
                selloSAT: getAttr(timbreEl, 'SelloSAT')
            },
            pagosDoctos
        };
    }

    async generateCfdiPdf(xmlContent: string, settings: any, targetWindow?: Window | null): Promise<jsPDF> {
        const parsed = this.parseCfdiXml(xmlContent);
        const { comprobante, emisor, receptor, conceptos, impuestos, timbre, pagosDoctos } = parsed;

        const doc = new jsPDF({ format: 'letter', unit: 'mm' });
        const primaryColor = [19, 80, 143]; // #13508f azul corporativo del PDF
        const textColor = [33, 37, 41];
        const subTextColor = [71, 85, 105];

        const companyLogo = settings?.company_logo;
        const folioCompleto = [comprobante.serie, comprobante.folio].filter(Boolean).join(' ') || comprobante.folio || 'S/N';
        const tipoComprobanteLabel = this.getTipoComprobanteLabel(comprobante.tipoDeComprobante);
        const regimenEmisorLabel = this.getRegimenFiscalLabel(emisor.regimenFiscal);
        const regimenReceptorLabel = this.getRegimenFiscalLabel(receptor.regimenFiscalReceptor);
        const usoCfdiLabel = this.getUsoCfdiLabel(receptor.usoCFDI);
        const metodoPagoLabel = this.getMetodoPagoLabel(comprobante.metodoPago);
        const formaPagoLabel = this.getFormaPagoLabel(comprobante.formaPago);
        const monedaLabel = this.getMonedaLabel(comprobante.moneda);
        const exportacionLabel = comprobante.exportacion === '01' ? '01 - No aplica' : comprobante.exportacion;

        // --- 1. CABECERA: LOGO + DATOS EMISOR (IZQ) Y CAJA AZUL + DATOS TIMBRADO (DER) ---
        // Logo
        if (companyLogo) {
            try {
                const format = companyLogo.includes('image/png') ? 'PNG' : 'JPEG';
                doc.addImage(companyLogo, format, 10, 10, 24, 24, undefined, 'FAST');
            } catch (e) {
                console.warn('Error cargando logo en CFDI PDF:', e);
            }
        }

        // Datos del Emisor (debajo del logo)
        let emisorY = 38;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(emisor.nombre || settings?.company_name || 'EMISOR', 10, emisorY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        emisorY += 4;
        doc.text(`Nombre: ${emisor.nombre || settings?.company_name || ''}`, 10, emisorY);
        emisorY += 4;
        doc.text(`RFC: ${emisor.rfc || ''}`, 10, emisorY);
        emisorY += 4;
        const splitRegEmisor = doc.splitTextToSize(`Régimen fiscal: ${regimenEmisorLabel}`, 95);
        doc.text(splitRegEmisor, 10, emisorY);
        emisorY += splitRegEmisor.length * 3.6;

        doc.text(`Domicilio fiscal: ${comprobante.lugarExpedicion || ''}`, 10, emisorY);
        emisorY += 4;
        doc.text(`Teléfono: ${settings?.phone || '476-135-7354'}`, 10, emisorY);
        emisorY += 4;
        doc.text(`Email: ${settings?.email || 'iscroberto.rojas@gmail.com'}`, 10, emisorY);
        emisorY += 4;

        // Caja Azul Superior Derecha (Folio Interno, Tipo, UUID, Expedido en)
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(108, 10, 98, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(`FOLIO INTERNO No. ${folioCompleto}`, 112, 15.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Tipo de comprobante: ${tipoComprobanteLabel}`, 112, 20.5);
        doc.text(`Folio fiscal: ${timbre.uuid || '—'}`, 112, 25.5);
        doc.text(`Expedido en (C.P.): ${comprobante.lugarExpedicion || '—'}`, 112, 30.5);

        // Datos Timbrado (debajo de la caja azul)
        let timbradoY = 38;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        doc.text(`Fecha de emisión: ${this.formatSatDate(comprobante.fecha)}`, 112, timbradoY);
        timbradoY += 4;
        doc.text(`Fecha de timbrado: ${this.formatSatDate(timbre.fechaTimbrado)}`, 112, timbradoY);
        timbradoY += 4;
        doc.text(`CSD del emisor: ${comprobante.noCertificado || '—'}`, 112, timbradoY);
        timbradoY += 4;
        doc.text(`CSD del SAT: ${timbre.noCertificadoSAT || '—'}`, 112, timbradoY);
        timbradoY += 4;

        // Línea divisoria
        const headerDividerY = Math.max(emisorY, timbradoY) + 2;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(10, headerDividerY, 206, headerDividerY);

        // --- 2. SECCIÓN RECEPTOR ---
        let recLeftY = headerDividerY + 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Receptor: ${receptor.nombre || '—'}`, 10, recLeftY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);

        recLeftY += 4;
        doc.text(`RFC: ${receptor.rfc || '—'}`, 10, recLeftY);
        recLeftY += 4;
        const splitRegRec = doc.splitTextToSize(`Régimen fiscal: ${regimenReceptorLabel}`, 95);
        doc.text(splitRegRec, 10, recLeftY);
        recLeftY += splitRegRec.length * 3.6;

        doc.text(`Exportación: ${exportacionLabel}`, 10, recLeftY);
        recLeftY += 4;
        doc.text(`Moneda: ${monedaLabel}`, 10, recLeftY);
        recLeftY += 4;
        if (comprobante.tipoCambio && comprobante.tipoCambio !== '1') {
            doc.text(`Tipo de cambio: ${comprobante.tipoCambio}`, 10, recLeftY);
            recLeftY += 4;
        }
        if (receptor.domicilio) {
            const splitDom = doc.splitTextToSize(`Domicilio: ${receptor.domicilio}`, 95);
            doc.text(splitDom, 10, recLeftY);
            recLeftY += splitDom.length * 3.6;
        }

        // Columna Derecha Receptor
        let recRightY = headerDividerY + 9;
        doc.text(`C.P.: ${receptor.domicilioFiscalReceptor || '—'}`, 112, recRightY);
        recRightY += 4;
        const splitUso = doc.splitTextToSize(`Uso de CFDI: ${usoCfdiLabel}`, 90);
        doc.text(splitUso, 112, recRightY);
        recRightY += splitUso.length * 3.6;

        doc.text(`Método de pago: ${metodoPagoLabel}`, 112, recRightY);
        recRightY += 4;
        const splitForma = doc.splitTextToSize(`Forma de pago: ${formaPagoLabel}`, 90);
        doc.text(splitForma, 112, recRightY);
        recRightY += splitForma.length * 3.6;

        if (comprobante.condicionesDePago) {
            const splitCond = doc.splitTextToSize(`Condiciones de pago: ${comprobante.condicionesDePago}`, 90);
            doc.text(splitCond, 112, recRightY);
            recRightY += splitCond.length * 3.6;
        }

        // --- 3. BARRA TITULAR "Factura" O "Complemento de Pagos" ---
        const bannerY = Math.max(recLeftY, recRightY) + 3;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, bannerY, 196, 5.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        const bannerTitle = comprobante.tipoDeComprobante === 'P' ? 'Complemento de Recepción de Pagos' :
                            (comprobante.tipoDeComprobante === 'E' ? 'Nota de Crédito' : 'Factura');
        doc.text(bannerTitle, 108, bannerY + 4, { align: 'center' });

        // --- 4. TABLA DE CONCEPTOS ---
        const conceptColumns = [
            "Cantidad",
            "Clave unidad\nSAT",
            "Código",
            "Clave\nProd/Servicio",
            "Descripción",
            "Precio Unitario",
            "Descuento",
            "Impuestos",
            "Importe"
        ];

        const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const conceptRows = conceptos.map((c: any) => [
            String(c.cantidad),
            `${c.claveUnidad || ''}\n${c.unidad || ''}`.trim(),
            c.noIdentificacion || '—',
            c.claveProdServ || '',
            c.descripcion || '',
            fmt(c.valorUnitario),
            c.descuento > 0 ? fmt(c.descuento) : '$0',
            c.impuestosDetalle || '—',
            fmt(c.importe)
        ]);

        autoTable(doc, {
            head: [conceptColumns],
            body: conceptRows,
            startY: bannerY + 6.5,
            margin: { left: 10, right: 10 },
            theme: 'grid',
            headStyles: {
                fillColor: [248, 250, 252],
                textColor: [15, 23, 42],
                fontStyle: 'bold',
                fontSize: 6.5,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.15,
                lineColor: [203, 213, 225]
            },
            styles: {
                fontSize: 6.5,
                cellPadding: 2,
                textColor: [30, 41, 59],
                lineWidth: 0.15,
                lineColor: [226, 232, 240]
            },
            columnStyles: {
                0: { cellWidth: 14, halign: 'center' },
                1: { cellWidth: 18, halign: 'center' },
                2: { cellWidth: 20, halign: 'left' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 'auto', halign: 'left' },
                5: { cellWidth: 20, halign: 'right' },
                6: { cellWidth: 16, halign: 'right' },
                7: { cellWidth: 30, halign: 'left' },
                8: { cellWidth: 20, halign: 'right' }
            }
        });

        let currentY = (doc as any).lastAutoTable.finalY + 4;

        // --- 5. TOTALES Y TOTAL CON LETRA ---
        if (currentY > 220) {
            doc.addPage();
            currentY = 15;
        }

        const totalLetras = this.numeroALetras(comprobante.total, comprobante.moneda);
        const lowerLetras = totalLetras.toLowerCase();
        const formattedLetras = lowerLetras.charAt(0).toUpperCase() + lowerLetras.slice(1).replace('m.n.', 'MXN');

        // Lado Izquierdo: Total con Letra y Comentarios
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text('Total con letra:', 10, currentY + 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const splitLetras = doc.splitTextToSize(formattedLetras, 115);
        doc.text(splitLetras, 10, currentY + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('Comentarios:', 10, currentY + 14);

        // Lado Derecho: Desglose de Totales
        const totalsX = 135;
        const totalsValX = 206;
        let totY = currentY + 3;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Subtotal', totalsX, totY);
        doc.text(fmt(comprobante.subTotal), totalsValX, totY, { align: 'right' });
        totY += 4;

        doc.text('Total de Descuentos', totalsX, totY);
        doc.text(comprobante.descuento > 0 ? fmt(comprobante.descuento) : '$0', totalsValX, totY, { align: 'right' });
        totY += 4;

        doc.text('Total de Impuestos Trasladados', totalsX, totY);
        doc.text(fmt(impuestos.totalTraslados), totalsValX, totY, { align: 'right' });
        totY += 4;

        doc.text('Total de Impuestos Retenidos', totalsX, totY);
        doc.text(fmt(impuestos.totalRetenciones), totalsValX, totY, { align: 'right' });
        totY += 4;

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(totalsX, totY, totalsValX, totY);
        totY += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Total', totalsX, totY);
        doc.text(fmt(comprobante.total), totalsValX, totY, { align: 'right' });

        currentY = Math.max(currentY + 20, totY + 5);

        // --- 6. DETALLE DE IMPUESTOS (SI HAY TRASLADOS O RETENCIONES) ---
        const allTaxRows: any[] = [];
        impuestos.traslados.forEach((t: any) => {
            allTaxRows.push([t.clave, t.impuesto, t.tipo, t.factor, t.tasaOCuota || '—', fmt(t.importe)]);
        });
        impuestos.retenciones.forEach((r: any) => {
            allTaxRows.push([r.clave, r.impuesto, r.tipo, r.factor, r.tasaOCuota || '—', fmt(r.importe)]);
        });

        if (allTaxRows.length > 0) {
            if (currentY > 215) {
                doc.addPage();
                currentY = 15;
            }

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(10, currentY, 196, 5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text('Detalle de impuestos', 108, currentY + 3.6, { align: 'center' });

            autoTable(doc, {
                head: [["Clave", "Impuesto", "Tipo", "Factor", "Tasa o Cuota", "Importe"]],
                body: allTaxRows,
                startY: currentY + 5.5,
                margin: { left: 10, right: 10 },
                theme: 'grid',
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    fontSize: 6.5,
                    halign: 'center',
                    lineWidth: 0.15,
                    lineColor: [203, 213, 225]
                },
                styles: {
                    fontSize: 6.5,
                    cellPadding: 1.8,
                    textColor: [30, 41, 59],
                    lineWidth: 0.15,
                    lineColor: [226, 232, 240]
                },
                columnStyles: {
                    0: { halign: 'center' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'right' }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 4;
        }

        // --- 7. DETALLE DE RECEPCIÓN DE PAGOS (SI APLICA) ---
        if (pagosDoctos.length > 0) {
            if (currentY > 215) {
                doc.addPage();
                currentY = 15;
            }

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(10, currentY, 196, 5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text('Documentos Relacionados al Pago', 108, currentY + 3.6, { align: 'center' });

            const pagosRows = pagosDoctos.map((p: any) => [
                [p.serie, p.folio].filter(Boolean).join(' ') || '—',
                p.uuid,
                p.numParcialidad,
                fmt(p.saldoAnterior),
                fmt(p.montoPagado),
                fmt(p.saldoInsoluto),
                p.moneda
            ]);

            autoTable(doc, {
                head: [["Serie/Folio", "UUID Factura Relacionada", "Parcialidad", "Saldo Anterior", "Monto Pagado", "Saldo Insoluto", "Moneda"]],
                body: pagosRows,
                startY: currentY + 5.5,
                margin: { left: 10, right: 10 },
                theme: 'grid',
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    fontSize: 6.5,
                    halign: 'center',
                    lineWidth: 0.15,
                    lineColor: [203, 213, 225]
                },
                styles: {
                    fontSize: 6.5,
                    cellPadding: 1.8,
                    textColor: [30, 41, 59],
                    lineWidth: 0.15,
                    lineColor: [226, 232, 240]
                },
                columnStyles: {
                    0: { halign: 'center' },
                    1: { halign: 'left' },
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'center' }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 4;
        }

        // --- 8. QR SAT Y SELLOS DIGITALES ---
        if (currentY > 210) {
            doc.addPage();
            currentY = 15;
        }

        // Generar QR Code
        const sello8 = (timbre.selloCFD || comprobante.sello || '').slice(-8);
        const satTotal = comprobante.total.toFixed(6);
        const satQrUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${timbre.uuid || ''}&re=${emisor.rfc || ''}&rr=${receptor.rfc || ''}&tt=${satTotal}&fe=${sello8}`;

        try {
            const qrDataUrl = await QRCode.toDataURL(satQrUrl, { margin: 1, width: 140 });
            doc.addImage(qrDataUrl, 'PNG', 10, currentY, 34, 34);
        } catch (qrErr) {
            console.warn('Error generando QR SAT:', qrErr);
            doc.setDrawColor(203, 213, 225);
            doc.rect(10, currentY, 34, 34);
        }

        // Sellos a la derecha del QR
        const stampsX = 48;
        const stampsWidth = 158;
        let stampsY = currentY + 1;

        // Cadena Original
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Cadena Original del complemento de certificación digital del SAT', stampsX, stampsY);
        stampsY += 3;

        const cadenaOriginal = `||${timbre.version}|${timbre.uuid}|${timbre.fechaTimbrado}|${timbre.rfcProvCertif}|${timbre.selloCFD}|${timbre.noCertificadoSAT}||`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(subTextColor[0], subTextColor[1], subTextColor[2]);
        const splitCadena = doc.splitTextToSize(cadenaOriginal, stampsWidth);
        doc.text(splitCadena, stampsX, stampsY);
        stampsY += splitCadena.length * 2.2 + 1.5;

        // Sello Emisor
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Sello digital del emisor', stampsX, stampsY);
        stampsY += 3;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(subTextColor[0], subTextColor[1], subTextColor[2]);
        const splitSelloEmisor = doc.splitTextToSize(timbre.selloCFD || comprobante.sello || '—', stampsWidth);
        doc.text(splitSelloEmisor, stampsX, stampsY);
        stampsY += splitSelloEmisor.length * 2.2 + 1.5;

        // Sello SAT
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Sello digital del SAT', stampsX, stampsY);
        stampsY += 3;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(subTextColor[0], subTextColor[1], subTextColor[2]);
        const splitSelloSat = doc.splitTextToSize(timbre.selloSAT || '—', stampsWidth);
        doc.text(splitSelloSat, stampsX, stampsY);

        // --- 9. PIE DE PÁGINA EN TODAS LAS PÁGINAS ---
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // Barra azul inferior
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(10, 268, 196, 4.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.8);
            doc.setTextColor(255, 255, 255);
            doc.text('Este documento es una representación impresa de un CFDI', 108, 271, { align: 'center' });

            // Número de página
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.8);
            doc.setTextColor(subTextColor[0], subTextColor[1], subTextColor[2]);
            doc.text(`Página ${i} de ${totalPages}`, 206, 275.5, { align: 'right' });
        }

        const fileName = `CFDI_${comprobante.serie || ''}${comprobante.folio || ''}_${(timbre.uuid || 'cfdi').substring(0, 8)}.pdf`;
        doc.setProperties({ title: fileName });

        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        if (targetWindow && !targetWindow.closed) {
            targetWindow.location.href = pdfUrl;
        } else {
            window.open(pdfUrl, '_blank');
        }

        return doc;
    }
}

