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

        const primaryColor = [30, 78, 140]; // Equivalent to #1e4e8c
        const textColor = [31, 45, 61]; // Equivalent to #1f2d3d

        // -- HEADER --
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');

        // Logo
        if (logo) {
            try {
                // Determine format from base64
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
                // Fallback circle if logo fails
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 22.5, 9, 'F');
            }
        } else {
            // Default Circle
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

        // WhatsApp/Phone Icons Container
        // High-Visibility Phone Icon
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(255, 255, 255);

        // WhatsApp Icon (Circle with notch)
        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';

        try {
            // Drawn using coordinate 39.5 for X, 25.8 for Y, sizing 3x3
            doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2);
        } catch (e) {
            console.error("Error al cargar icono manual:", e);
        }

        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(`476-135-7354`, 44.5, 28.5);

        // Email Icon (Vector)
        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27); // Envelope fold
        doc.line(76, 26, 74.5, 27);

        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE SERVICIO', 195, 24, { align: 'right' });

        // -- INFO ROWS --
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setDrawColor(204, 204, 204);

        // Row 1
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

        // Row 2
        doc.setFont('helvetica', 'bold');
        doc.text('Cliente:', 15, 56);
        doc.setFont('helvetica', 'normal');
        doc.text(String(client?.name || 'Público General'), 31, 56);
        doc.line(10, 60, 200, 60);

        // -- TABLE --
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
            headStyles: {
                fillColor: [30, 78, 140],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [31, 45, 61]
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' }
            }
        });

        // -- BOTTOM SECTION --
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0);

        // Observations (Left)
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

        // Totals (Right)
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, finalY, 70, 16);

        // Subtotal row
        doc.setFontSize(9);
        doc.text('Subtotal:', 135, finalY + 6);
        doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, finalY + 6, { align: 'right' });
        doc.line(130, finalY + 9, 200, finalY + 9);

        // Total row
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, finalY + 9, 70, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 135, finalY + 14);
        doc.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 195, finalY + 14, { align: 'right' });

        // Amount in letters
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CANTIDAD CON LETRA:', 10, finalY + 22);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.numeroALetras(total)}`, 45, finalY + 22);

        // -- BANK DATA --
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

        // -- FOOTER --
        doc.setDrawColor(204, 204, 204);
        doc.line(10, 275, 200, 275);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(footerText, 10, 280, { maxWidth: 190 });

        // Output
        if (autoOpen) {
            const fileName = `${sale.folio} - ${client.name}.pdf`;
            doc.setProperties({ title: fileName });
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);

            const pdfWindow = window.open("", "_blank");
            if (pdfWindow) {
                pdfWindow.document.write(`
                    <html>
                        <head>
                            <title>${fileName}</title>
                            <style>body { margin: 0; padding: 0; overflow: hidden; }</style>
                        </head>
                        <body>
                            <embed src="${url}" type="application/pdf" width="100%" height="100%">
                        </body>
                    </html>
                `);
                pdfWindow.document.close();
            }
        }

        return doc;
    }

    generatePolicyPdf(policy: any, records: any[], settings: any): jsPDF {
        const doc = new jsPDF();

        // Settings / Brand Data
        const companyName = settings.company_name || 'ROBERTO ROJAS SALDAÑA';
        const profession = settings.company_profession || 'Ingeniero en Sistemas Computacionales';
        const logo = settings.company_logo;
        const primaryColor = [30, 78, 140];
        const textColor = [31, 45, 61];
        const centerX = 105;

        // WhatsApp Icon Base64 (from generateSalePdf)
        const whatsappIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADgklEQVRYhaWXT4jVVRTHv/fHQwZ5yFOkxeBCRERCJGQIMxEZXEmkyCxcBJpEiDtFslUbCRciEiHiokBikhbhwj8guNFoKBUMTUpLZNBFNamVf94MM+OnxT0/3vF233u/+XU2v3fvOed7vvfce8+5L6iiAJK0RtJmSW9IWiGpJamQNCnpgaQbki5JOh9CeFQVu1/gBrALuEl1aQOjwKp++KFP8PWSTkh6NVE9lfSj4qoLSU1JSyUtt3EpM5I+l3QghPBX1UULEPAhMO1W9QQ4BqwDGl38FgM7gW+SjNwFVs8l+DHnPAucAF6pvIKIMwz85HAeA69XcTyUOG2eS+AEawA46fAeAit7OYwkxq/VDe4wBRx1uLeB+TnDRcCEGU0DGzJA2b2vQKIAvnIkjuSMjjiDjxLdctvPaeBoTRJN4J7hTwHLvLJFPOWY0byE/XVH7hnQqklim8M57hXvOcWexGmY/8r7NQkUwC3DeAwMlEVji30nJX2Z+OUO4o46BEIILySdtGFL0oaCWOPX2eRYpmJN1gnWQ866328WkgYlLbKJKxmHsWT8p2pmwORnSf/Y75WFpCVOOZ5x+EHSd258MYTwa93otg2/2XCwkOSLwouMgyQdcLoRYG1dAibP7Tu/UOxYpczLGCuEcFmxq0lSQ9IosPh/ECgL2kyhTjqkzlnIyV7F/ZOkZZIukDQou2ZvAwu6gdihH7ThH+WDo21380wv2sAKYo8oZRzY5PQHbf4h8AEwkMFY6vwPl5Nl/36Sc0oA1loR8XIO+DRTsMZJXkXAbqffVk7ud5MjvQiY/Srgl0zAnGxKfL+1+TblVgFL6Lx+vifuUz8STWIDa6cRnUwATeez3ulOpYBfOOXOvgw6foPEvb+fBL8FDDm7BnDVdLPAmhRotXPueRi7EGkQz8dW+xaJ/mOHP5oD2F4nAxXJ7bJVA/xO7n0JfG0GbWr2+wxmecDL4FPAcM6wSXxovJR+2989xKszp+cY8b6fc1mdBrZ3M/bpPwjsI16XWTd/24h0rZa24iHiM97fjr+Bt3I+wRxPS9pacXEzih3yhmIZn5K0ULE8D6lTZksZk/RuCOFON9YLyN/lCeAz4qn+xFYxF7lpmS2ygR0Bn/77xJK6kWTPjeg7wCniw3WWl+UZsYgdJv59q5TOAByy36clXbMHQ18h9oyWYmudlPSoqq+XfwGSWyAUtQxUyQAAAABJRU5ErkJggg==';

        // -- HEADER (Sales Style) --
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(10, 10, 190, 25, 'F');

        // Logo
        if (logo) {
            try {
                const format = logo.split(';')[0].split('/')[1].toUpperCase();
                doc.addImage(logo, format, 15, 12, 21, 21, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo:", e);
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

        // WhatsApp / Phone
        try {
            doc.addImage(whatsappIcon, 'PNG', 39.5, 25.8, 3.2, 3.2);
        } catch (e) { }
        doc.setFontSize(7);
        doc.text(`476-135-7354`, 44.5, 28.5);

        // Email Icon (Vector)
        doc.setFillColor(255, 255, 255);
        doc.rect(73, 26, 3, 2, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.1);
        doc.line(73, 26, 74.5, 27);
        doc.line(76, 26, 74.5, 27);
        doc.text(`iscroberto.rojas@gmail.com`, 77, 28);

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('PÓLIZA DE SERVICIO', 195, 24, { align: 'right' });

        // -- POLICY INFO --
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

        // -- SUMMARY CARDS --
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

            // Card background
            doc.setDrawColor(230, 230, 230);
            doc.setFillColor(255, 255, 255);
            doc.rect(x, startY, cardWidth, cardHeight, 'FD');

            // Icon background / Left border
            doc.setFillColor(card.color[0], card.color[1], card.color[2]);
            doc.rect(x, startY, 4, cardHeight, 'F');

            // Label
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.setFont('helvetica', 'normal');
            doc.text(card.label, x + 8, startY + 8);

            // Value
            doc.setFontSize(12);
            doc.setTextColor(card.color[0], card.color[1], card.color[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(card.value, x + 8, startY + 16);
        });

        // -- RECORDS TABLE --
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
            headStyles: {
                fillColor: [30, 78, 140],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                1: { cellWidth: 'auto' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'center' }
            }
        });

        // -- FOOTER --
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        if (policy.remaining_minutes <= 0) {
            doc.setFillColor(56, 142, 60);
            doc.rect(10, finalY, 190, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('PÓLIZA COMPLETADA - TOTALMENTE CONSUMIDA', centerX, finalY + 5.5, { align: 'center' });
        }

        // Output
        const fileName = `${policy.policy_number} - ${policy.client_name}.pdf`;
        doc.setProperties({ title: fileName });
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
            pdfWindow.document.write(`
                <html>
                    <head>
                        <title>${fileName}</title>
                        <style>body { margin: 0; padding: 0; overflow: hidden; }</style>
                    </head>
                    <body>
                        <embed src="${url}" type="application/pdf" width="100%" height="100%">
                    </body>
                </html>
            `);
            pdfWindow.document.close();
        }

        return doc;
    }
}

