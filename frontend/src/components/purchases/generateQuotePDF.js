import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/andros_logo.png';

export const generateQuotePDF = (quote, provider, returnBlob = false) => {
    const doc = new jsPDF();

    // Logo
    try {
        doc.addImage(logo, 'PNG', 14, 10, 30, 30);
    } catch (e) {
        console.warn("Logo load failed", e);
    }

    // Company Info (Right side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Andros Asset Management', 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 12345678-9', 195, 25, { align: 'right' }); // Replace with actual company info if available
    doc.text('Dirección: Calle 50, Panamá', 195, 30, { align: 'right' });
    doc.text('Tel: +507 200-0000', 195, 35, { align: 'right' });

    // Header Title
    doc.setFontSize(22);
    doc.text('Solicitud de Cotización', 14, 50);

    doc.setFontSize(12);
    doc.text(`Código: ${quote.codigo || 'BORRADOR'}`, 14, 60);
    doc.text(`Fecha: ${quote.fecha_solicitud}`, 14, 66);

    // Provider Info box
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 75, 180, 40, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos del Proveedor:', 16, 82);

    doc.setFont('helvetica', 'normal');
    const providerName = provider?.nombre || (typeof quote.nombre_proveedor === 'string' ? quote.nombre_proveedor : 'N/A');
    doc.text(`Nombre: ${providerName}`, 16, 90);
    doc.text(`NIT/RUC: ${provider?.nit || provider?.rut_o_ruc || 'N/A'}`, 16, 96);
    doc.text(`Dirección: ${provider?.direccion || 'N/A'}`, 16, 102);
    doc.text(`Teléfono: ${provider?.telefono || 'N/A'}`, 16, 108);
    doc.text(`Email: ${provider?.email || 'N/A'}`, 100, 96);

    // Note
    let finalY = 120;
    if (quote.observaciones) {
        doc.text(`Observaciones: ${quote.observaciones}`, 14, 125);
        finalY = 135;
    }

    // Items Table
    const tableColumn = ["Repuesto", "Código", "Cantidad"];
    const tableRows = [];

    quote.detalles.forEach(item => {
        const itemData = [
            item.nombre_repuesto || `Repuesto #${item.repuesto_id}`,
            item.codigo_repuesto || '-',
            item.cantidad,
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: finalY,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Generado por Sistema de Gestión HotelA', 14, doc.internal.pageSize.height - 10);
        doc.text('Página ' + i + ' de ' + pageCount, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
    }

    if (returnBlob) {
        return doc.output('blob');
    } else {
        doc.save(`RFQ-${quote.codigo || 'draft'}.pdf`);
    }
};
