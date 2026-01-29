import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

/**
 * Generates a PDF with product labels.
 * @param {Array} items - List of items to print { nombre_repuesto, codigo_repuesto, ... }
 */
export const generateLabelsPDF = (items) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const labelsPerPage = 21; // 3 cols x 7 rows
    const rows = 7;
    const cols = 3;

    // Dimensions (A4: 210 x 297mm)
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;

    const labelWidth = (pageWidth - (margin * 2)) / cols; // ~63.3mm
    const labelHeight = (pageHeight - (margin * 2)) / rows; // ~39.5mm

    let col = 0;
    let row = 0;

    items.forEach((item, index) => {
        if (index > 0 && index % labelsPerPage === 0) {
            doc.addPage();
            col = 0;
            row = 0;
        }

        const x = margin + (col * labelWidth);
        const y = margin + (row * labelHeight);

        // Label Border (Optional, helpful for cutting)
        doc.setDrawColor(200);
        doc.rect(x + 1, y + 1, labelWidth - 2, labelHeight - 2);

        // Content
        const centerX = x + (labelWidth / 2);

        // Title (Truncate if too long)
        const name = item.nombre_repuesto || "Item Sin Nombre";
        const truncatedName = name.length > 25 ? name.substring(0, 25) + '...' : name;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(truncatedName, centerX, y + 6, { align: 'center' });

        // SKU
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(item.codigo_repuesto || 'N/A', centerX, y + 10, { align: 'center' });

        // Barcode
        if (item.codigo_repuesto) {
            try {
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, item.codigo_repuesto, {
                    format: "CODE128",
                    displayValue: false,
                    width: 2, // Width of lines
                    height: 30, // Height of barcode
                    margin: 0
                });
                const imgData = canvas.toDataURL('image/png');
                // Adjust barcode dimensions in PDF
                doc.addImage(imgData, 'PNG', centerX - 15, y + 12, 30, 15);
            } catch (e) {
                console.error("Error generating barcode", e);
                doc.text("(Error Barcode)", centerX, y + 20, { align: 'center' });
            }
        }

        // Footer (Brand or Info)
        doc.setFontSize(6);
        doc.text("Hotel A Inventory", centerX, y + labelHeight - 3, { align: 'center' });

        col++;
        if (col >= cols) {
            col = 0;
            row++;
        }
    });

    doc.save(`etiquetas_recepcion_${new Date().getTime()}.pdf`);
};
