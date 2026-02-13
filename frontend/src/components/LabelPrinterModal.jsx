import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Minus, Plus, FileText } from 'lucide-react';
import JsBarcode from 'jsbarcode';

const LabelPrinterModal = ({ isOpen, onClose, items = [] }) => {
    // Items expected format: { nombre_repuesto, codigo_repuesto, sku, cantidad }
    const [printItems, setPrintItems] = useState([]);

    useEffect(() => {
        if (isOpen && items.length > 0) {
            // Initialize with items and default quantities
            setPrintItems(items.map(i => ({
                ...i,
                printQty: i.cantidad || 1
            })));
        }
    }, [isOpen, items]);

    useEffect(() => {
        if (isOpen && printItems.length > 0) {
            // Generate barcodes after render
            printItems.forEach((item, idx) => {
                const canvasId = `barcode-${idx}`;
                const canvas = document.getElementById(canvasId);
                if (canvas && (item.sku || item.codigo_repuesto)) {
                    try {
                        JsBarcode(canvas, item.sku || item.codigo_repuesto, {
                            format: "CODE128",
                            width: 1.5,
                            height: 40,
                            displayValue: true,
                            fontSize: 12,
                            margin: 0
                        });
                    } catch (e) {
                        console.error("Barcode generation error", e);
                    }
                }
            });
        }
    }, [printItems, isOpen]);

    const handleQtyChange = (idx, delta) => {
        setPrintItems(prev => prev.map((item, i) => {
            if (i === idx) {
                const newQty = Math.max(0, item.printQty + delta);
                return { ...item, printQty: newQty };
            }
            return item;
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] print:p-0 print:bg-white print:static print:block">
            {/* Modal Content (Screen Only) */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col print:hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Printer className="w-5 h-5" /> Imprimir Etiquetas
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-4">
                        {printItems.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{item.nombre_repuesto || item.nombre}</h3>
                                        <p className="text-xs font-mono text-slate-500">{item.sku || item.codigo_repuesto || item.codigo || 'SIN-CODIGO'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Preview Canvas (Hidden but used for print generation logic if needed, actually we use the map below for print layout) */}
                                    <canvas id={`barcode-preview-${idx}`} className="hidden"></canvas>

                                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                                        <button
                                            onClick={() => handleQtyChange(idx, -1)}
                                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm disabled:opacity-50 transition-all"
                                            disabled={item.printQty <= 0}
                                        >
                                            <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        </button>
                                        <span className="w-8 text-center font-bold text-sm text-slate-800 dark:text-white">{item.printQty}</span>
                                        <button
                                            onClick={() => handleQtyChange(idx, 1)}
                                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm transition-all"
                                        >
                                            <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:underline">Cancelar</button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Imprimir {printItems.reduce((acc, i) => acc + i.printQty, 0)} Etiquetas
                    </button>
                </div>
            </div>

            {/* Print Layout (Only Visible when Printing) */}
            <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-4 w-full h-full bg-white absolute top-0 left-0 z-[200]">
                {printItems.flatMap((item, itemIdx) =>
                    Array.from({ length: item.printQty }).map((_, qtyIdx) => (
                        <div key={`${itemIdx}-${qtyIdx}`} className="break-inside-avoid border border-black p-2 flex flex-col items-center justify-center text-center h-[100px] w-[200px] overflow-hidden">
                            <h4 className="text-[10px] font-bold truncate w-full mb-1">{item.nombre_repuesto || item.nombre}</h4>
                            <canvas
                                id={`barcode-${itemIdx}-${qtyIdx}`}
                                ref={el => {
                                    if (el && (item.sku || item.codigo_repuesto)) {
                                        try {
                                            JsBarcode(el, item.sku || item.codigo_repuesto, {
                                                format: "CODE128",
                                                width: 1.5,
                                                height: 30,
                                                displayValue: true,
                                                fontSize: 10,
                                                marginTop: 2,
                                                marginBottom: 2
                                            });
                                        } catch (e) { }
                                    }
                                }}
                            ></canvas>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:grid, .print\\:grid * {
                        visibility: visible;
                    }
                    .print\\:grid {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default LabelPrinterModal;
