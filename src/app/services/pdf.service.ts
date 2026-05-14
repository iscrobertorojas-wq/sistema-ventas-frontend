import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    // Custom number to text converter for Spanish
    private numeroALetras(num: number): string {
        const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        if (num === 0) return 'CERO PESOS 00/100 M.N.';

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

        return resultado.trim() + ` PESOS ${centavos.toString().padStart(2, '0')}/100 M.N.`;
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
        const bankCard = settings.bank_card || '4152 3141 8750 3829';
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
        doc.text(String(policy.policy_number), 35, 46);
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

        const cardWidth = 44;
        const cardHeight = 22;
        const startY = 65;
        const gap = 4;
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
            const x = 15 + (cardWidth + gap) * i;
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

        const tableColumn = ["Fecha", "Descripción", "Inicio", "Fin", "Duración", "Tipo"];
        const tableRows = records.map(r => [
            new Date(r.service_date).toLocaleDateString('es-MX'),
            r.description,
            r.start_time.substring(0, 5),
            r.end_time.substring(0, 5),
            formatMinutes(r.duration_minutes),
            r.service_type
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + cardHeight + 10,
            theme: 'grid',
            headStyles: { fillColor: [30, 78, 140], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 1: { cellWidth: 'auto' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' } }
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

    generateQuotationPdf(quotation: any, items: any[], client: any, settings: any, autoOpen: boolean = true): jsPDF {
        const doc = new jsPDF();
        
        const ivaMode = quotation.iva_mode || 'none';
        const subtotalItems = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
        const hasDiscount = items.some((item: any) => item.discount > 0);
        
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const bankName = settings.bank_name || 'BBVA';
        const bankCard = settings.bank_card || '4152 3141 8750 3829';
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
        doc.text(`${this.numeroALetras(totalDisplay)}`, 45, lettersY);

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
}
