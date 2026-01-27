import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to format currency
const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
};

export const pdfGenerator = {
    // --- Work Order PDF ---
    generateWorkOrderPDF: (workOrder) => {
        const doc = new jsPDF();
        const primaryColor = [41, 128, 185]; // Blue

        // Header
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.text('ORDEN DE TRABAJO', 105, 20, null, 'center');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`OT #: ${workOrder.id_ot}`, 14, 30);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 30);

        // Asset Info
        doc.autoTable({
            startY: 40,
            head: [['INFORMACIÓN DEL ACTIVO']],
            body: [
                [`Equipo: ${workOrder.activo?.nombre_equipo || 'N/A'}`],
                [`Código: ${workOrder.activo?.codigo_equipo || 'N/A'}`],
                [`Ubicación: ${workOrder.activo?.ubicacion || 'N/A'}`],
            ],
            headStyles: { fillColor: primaryColor },
        });

        // Instructions / Task Info
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['DETALLE DEL TRABAJO']],
            body: [
                [`Prioridad: ${workOrder.prioridad?.toUpperCase() || 'NORMAL'}`],
                [`Técnico Asignado: ${workOrder.tecnico ? `Técnico #${workOrder.id_tecnico}` : 'Sin asignar'}`],
                [`Descripción: ${workOrder.observaciones || 'Sin observaciones'}`],
            ],
            headStyles: { fillColor: [44, 62, 80] }, // Darker
        });

        // Space for execution notes
        doc.text('Notas de Ejecución / Repuestos Usados:', 14, doc.lastAutoTable.finalY + 20);
        doc.rect(14, doc.lastAutoTable.finalY + 25, 182, 40);

        // Signatures
        const finalY = doc.lastAutoTable.finalY + 80;
        doc.line(14, finalY, 80, finalY);
        doc.text('Firma Técnico', 14, finalY + 5);

        doc.line(116, finalY, 182, finalY);
        doc.text('Firma Supervisor', 116, finalY + 5);

        doc.save(`OT_${workOrder.id_ot}_${new Date().toISOString().split('T')[0]}.pdf`);
    },

    // --- Purchase Order PDF ---
    generatePurchaseOrderPDF: (purchaseOrder, details, provider) => {
        const doc = new jsPDF();
        const primaryColor = [39, 174, 96]; // Green

        // Header
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.text('ORDEN DE COMPRA', 105, 20, null, 'center');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`OC #: ${purchaseOrder.id_orden_compra}`, 14, 30);
        doc.text(`Fecha Solicitud: ${purchaseOrder.fecha_solicitud || new Date().toLocaleDateString()}`, 160, 30);

        // Provider Info
        doc.autoTable({
            startY: 40,
            head: [['DATOS DEL PROVEEDOR']],
            body: [
                [`Proveedor: ${provider?.nombre_empresa || 'Proveedor General'}`],
                [`Contacto: ${provider?.nombre_contacto || ''}`],
                [`Email: ${provider?.email || ''}`],
            ],
            headStyles: { fillColor: primaryColor },
        });

        // Details Table
        const tableRows = details.map(item => [
            item.repuesto?.nombre_repuesto || `Repuesto #${item.id_repuesto}`,
            item.cantidad,
            formatMoney(item.costo_unitario || 0),
            formatMoney((item.cantidad * (item.costo_unitario || 0)))
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Item / Repuesto', 'Cant.', 'Costo Unit.', 'Total']],
            body: tableRows,
            foot: [[
                '', '', 'TOTAL:',
                formatMoney(details.reduce((acc, curr) => acc + (curr.cantidad * (curr.costo_unitario || 0)), 0))
            ]],
            headStyles: { fillColor: [44, 62, 80] },
        });

        // Notes
        doc.text('Condiciones de Compra:', 14, doc.lastAutoTable.finalY + 15);
        doc.setFontSize(9);
        doc.text('1. Los precios deben incluir IVA si aplica.', 14, doc.lastAutoTable.finalY + 22);
        doc.text('2. Fecha de entrega estimada: Inmediata.', 14, doc.lastAutoTable.finalY + 27);

        // Signature
        const finalY = doc.lastAutoTable.finalY + 50;
        doc.line(14, finalY, 80, finalY);
        doc.text('Autorizado Por', 14, finalY + 5);

        doc.save(`OC_${purchaseOrder.id_orden_compra}.pdf`);
    }
};
