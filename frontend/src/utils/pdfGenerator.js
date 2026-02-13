import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

// Helper to format currency
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
};

export const pdfGenerator = {
    // --- Work Order PDF ---
    generateWorkOrderPDF: async (workOrder, returnBlob = false) => {
        const doc = new jsPDF();
        const primaryColor = [41, 128, 185]; // Blue

        let company = null;
        try {
            const res = await api.get('/settings/company');
            company = res.data;
        } catch (e) {
            console.error("Could not fetch company settings for PDF", e);
        }

        // --- Header / Company Info ---
        if (company && company.logo) {
            try {
                // Determine format
                const format = company.logo.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                doc.addImage(company.logo, format, 14, 15, 30, 30);
            } catch (e) {
                console.error("Error adding logo to PDF", e);
                doc.setFontSize(10);
                doc.text('LOGO', 20, 30);
            }
        }

        doc.setFontSize(18);
        doc.setTextColor(...primaryColor);
        doc.text(company?.nombre_comercial || 'ORDEN DE TRABAJO', 105, 25, null, 'center');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(company?.razon_social || '', 105, 32, null, 'center');
        doc.text(`${company?.ruc ? `RUC: ${company.ruc}-${company.dv}` : ''}`, 105, 37, null, 'center');
        doc.text(`${company?.direccion || ''} - ${company?.ciudad || ''}`, 105, 42, null, 'center');
        doc.text(`Tel: ${company?.telefono || ''} | ${company?.correo || ''}`, 105, 49, null, 'center');

        doc.setDrawColor(200);
        doc.line(14, 55, 196, 55);

        // OT Number and Date
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'bold');
        doc.text(`OT #: ${workOrder.codigo_ot || workOrder.id_ot}`, 14, 65);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 160, 65);

        // Maintenance List (Multiple) vs Single Asset (Legacy)
        if (workOrder.mantenimientos && workOrder.mantenimientos.length > 0) {
            const tableRows = workOrder.mantenimientos.map(m => [
                m.id,
                m.equipo || 'N/A',
                m.tipo || 'Mantenimiento',
                m.fecha || 'N/A'
            ]);

            autoTable(doc, {
                startY: 68,
                head: [['ID', 'EQUIPO / ACTIVO', 'TIPO SERVICIO', 'FECHA PROG.']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 30 }
                }
            });
        } else {
            // Legacy Single Asset View
            autoTable(doc, {
                startY: 68,
                head: [['INFORMACIÓN DEL ACTIVO / EQUIPO']],
                body: [
                    [`Equipo: ${workOrder.activo?.nombre_equipo || 'N/A'}`],
                    [`Marca/Modelo: ${workOrder.activo?.marca || 'N/A'} - ${workOrder.activo?.modelo || 'N/A'}`],
                    [`Serie: ${workOrder.activo?.numero_serie || 'N/A'}`],
                    [`Ubicación: ${workOrder.activo?.ubicacion || 'N/A'}`],
                    [`Código Admin: ${workOrder.activo?.codigo_administrativo || workOrder.activo?.codigo_equipo || 'N/A'}`],
                ],
                theme: 'striped',
                headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });
        }

        // Responsable Info
        const responsableTableY = doc.lastAutoTable.finalY + 8;
        autoTable(doc, {
            startY: responsableTableY,
            head: [['RESPONSABLE ASIGNADO']],
            body: [
                [`Dirigido a: ${workOrder.nombre_tecnico ? `TÉCNICO: ${workOrder.nombre_tecnico}` : (workOrder.nombre_proveedor ? `PROVEEDOR: ${workOrder.nombre_proveedor}` : 'PERSONAL INTERNO')}`],
                [`Prioridad: ${workOrder.prioridad?.toUpperCase() || 'NORMAL'}`],
                [`Fecha Programada: ${workOrder.id_calendario ? 'Ver Cronograma' : 'Inmediata'}`],
                [`Condición de Pago: ${workOrder.terminos_pago || 'N/A'}`],
                [`Presupuesto Estimado: ${formatMoney(workOrder.mantenimiento_costo_estimado !== null && workOrder.mantenimiento_costo_estimado !== undefined ? workOrder.mantenimiento_costo_estimado : (workOrder.costo_estimado || 0))}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 9 }
        });

        // Instructions
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPCIÓN DEL TRABAJO / OBSERVACIONES:', 14, doc.lastAutoTable.finalY + 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitObs = doc.splitTextToSize(workOrder.observaciones || 'Realizar mantenimiento según protocolo estándar.', 182);
        doc.text(splitObs, 14, doc.lastAutoTable.finalY + 18);

        // Space for execution notes
        const boxY = doc.lastAutoTable.finalY + 35;
        doc.setFont('helvetica', 'bold');
        doc.text('REPORTE DE EJECUCIÓN (Llenado por el Técnico):', 14, boxY - 3);
        doc.rect(14, boxY, 182, 50);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Describa repuestos usados, hallazgos y tiempo real de ejecución.', 16, boxY + 5);

        // Signatures
        const finalY = boxY + 75;
        doc.setTextColor(0);
        doc.line(14, finalY, 80, finalY);
        doc.text('Firma Técnico / Proveedor', 14, finalY + 5);

        doc.line(116, finalY, 182, finalY);
        doc.text('Recibido Conforme (Supervisor)', 116, finalY + 5);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Este documento es una orden oficial de trabajo. Por favor adjunte este reporte a la factura si aplica.', 105, 285, null, 'center');

        if (returnBlob) {
            return doc.output('blob');
        }
        doc.save(`OT_${workOrder.codigo_ot || workOrder.id_ot}.pdf`);
    },

    // --- Purchase Order PDF ---
    generatePurchaseOrderPDF: async (purchaseOrder, details, provider) => {
        const doc = new jsPDF();
        const primaryColor = [41, 128, 185]; // Professional Blue

        let company = null;
        try {
            const res = await api.get('/settings/company');
            company = res.data;
        } catch (e) {
            console.error("Could not fetch company settings for PDF", e);
        }

        // --- Header / Company Info ---
        if (company && company.logo) {
            try {
                const format = company.logo.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                doc.addImage(company.logo, format, 14, 15, 25, 25);
            } catch (e) {
                console.error("Error adding logo:", e);
            }
        }

        doc.setFontSize(18);
        doc.setTextColor(...primaryColor);
        doc.text('ORDEN DE COMPRA', 196, 25, null, 'right');

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'bold');
        doc.text(company?.nombre_comercial || 'HotelA Management', 14, 45);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`${company?.razon_social || ''}`, 14, 50);
        doc.text(`${company?.ruc ? `NIT/RUC: ${company.ruc}-${company.dv}` : ''}`, 14, 55);
        doc.text(`${company?.direccion || ''}`, 14, 60);
        doc.text(`Tel: ${company?.telefono || ''} | ${company?.correo || ''}`, 14, 68);

        // OC Number and Dates
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(14, 75, 196, 75);

        doc.setTextColor(40);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`NÚMERO DE ORDEN: ${purchaseOrder.codigo_compra || purchaseOrder.id_orden_compra}`, 14, 85);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha Emisión: ${purchaseOrder.fecha_solicitud || new Date().toLocaleDateString()}`, 140, 85);
        doc.text(`Fecha Entrega: ${purchaseOrder.fecha_entrega || 'N/A'}`, 140, 90);

        // Provider Section
        autoTable(doc, {
            startY: 98,
            head: [['DATOS DEL PROVEEDOR']],
            body: [
                [`Proveedor: ${provider?.nombre || 'General'}`],
                [`NIT/RUC: ${provider?.nit || 'N/A'}`],
                [`Dirección: ${provider?.direccion || 'N/A'}`],
                [`Teléfono: ${provider?.telefono || 'N/A'}`],
                [`E-mail: ${provider?.correo || 'N/A'}`],
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 }
        });

        // Details Table
        const tableRows = details.map(item => [
            item.codigo_repuesto || '-',
            item.nombre_repuesto || `Repuesto #${item.id_repuesto}`,
            item.cantidad,
            formatMoney(item.costo_unitario || 0),
            formatMoney((item.cantidad * (item.costo_unitario || 0)))
        ]);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Código', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });

        // Totals Section
        const finalY = doc.lastAutoTable.finalY + 10;
        const subtotal = purchaseOrder.subtotal || details.reduce((acc, curr) => acc + (curr.cantidad * (curr.costo_unitario || 0)), 0);
        const impuestos = purchaseOrder.impuestos || 0;
        const total = purchaseOrder.total || (subtotal + impuestos);

        doc.setFontSize(9);
        doc.setTextColor(40);
        doc.text('SUBTOTAL:', 140, finalY);
        doc.text(formatMoney(subtotal), 196, finalY, null, 'right');

        doc.text('IMPUESTOS:', 140, finalY + 5);
        doc.text(formatMoney(impuestos), 196, finalY + 5, null, 'right');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text('TOTAL:', 140, finalY + 12);
        doc.text(formatMoney(total), 196, finalY + 12, null, 'right');

        // Payment and Notes
        doc.setFontSize(9);
        doc.setTextColor(40);
        doc.setFont('helvetica', 'bold');
        doc.text('TÉRMINOS Y NOTAS:', 14, finalY + 25);
        doc.setFont('helvetica', 'normal');
        doc.text(`Términos de Pago: ${purchaseOrder.terminos_pago || 'Contado'}`, 14, finalY + 30);

        if (purchaseOrder.notas) {
            const splitNotes = doc.splitTextToSize(`Notas: ${purchaseOrder.notas}`, 120);
            doc.text(splitNotes, 14, finalY + 35);
        }

        // Signatures
        const sigY = 250;
        doc.setDrawColor(200);
        doc.line(14, sigY, 80, sigY);
        doc.text('Solicitado Por', 14, sigY + 5);

        doc.line(116, sigY, 182, sigY);
        doc.text('Autorización / Compras', 116, sigY + 5);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Este documento es una representación física de una orden de compra digital generada por el sistema.', 105, 285, null, 'center');

        doc.save(`OC_${purchaseOrder.codigo_compra || purchaseOrder.id_orden_compra}.pdf`);
    }
};
