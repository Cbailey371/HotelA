import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Download,
    Filter,
    Search,
    Layout,
    CheckSquare,
    Calendar,
    RefreshCw,
    PlusCircle,
    Trash2
} from 'lucide-react';
import { generateReport } from '../../services/reportsService';

const ReportBuilder = ({ reportType, onBack, categories }) => {
    // Report Config
    const REPORT_COLUMNS = {
        'Inventario': ['SKU', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Costo Unitario', 'Ubicación', 'Fecha Última Compra', 'Fecha Vencimiento'],
        'Activos': ['Código', 'Nombre', 'Marca', 'Modelo', 'Serie', 'Categoría', 'Ubicación', 'Estado', 'Fecha Compra'],
        'Mantenimiento': ['ID', 'Fecha Ejecución', 'Fecha Inicio', 'Fecha Fin', 'Técnico', 'Descripción', 'Resultado', 'Costo Total', 'Observaciones', 'Fecha Creación'],
        'PlanMantenimiento': ['ID', 'Activo', 'Fecha Programada', 'Próxima Fecha', 'Frecuencia', 'Estado', 'Prioridad', 'Costo Estimado', 'Observaciones'],
        'Depreciación': ['Activo', 'Modelo', 'Serie', 'Fecha Compra', 'Fin Vida Útil', 'Valor Compra', 'Valor Actual', 'Depreciación Acumulada'],
        'OrdenesCompra': ['Código', 'Estado', 'Fecha Solicitud', 'Fecha Entrega', 'Recepción', 'Total', 'Notas', 'Creado'],
        'SolicitudesCotizacion': ['ID', 'Título', 'Fecha Solicitud', 'Estado', 'Prioridad', 'Solicitante', 'Fecha Creación'],
        'FacturasCompra': ['N° Factura', 'Proveedor', 'Fecha Emisión', 'Fecha Vencimiento', 'Monto Total', 'Estado Pago', 'Notas', 'Fecha Recepción'],
        'OrdenesTrabajo': ['Código', 'Prioridad', 'Estado', 'Costo Estimado', 'Activo ID', 'Fecha Inicio Real', 'Creado', 'Observaciones'],
        'ProveedoresTecnicos': ['Tipo', 'Nombre', 'Identificador', 'Email', 'Teléfono', 'Estado', 'Creado'],
        'SugeridoCompra': ['SKU', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Sugerido a Comprar', 'Costo Promedio']
    };

    const [selectedColumns, setSelectedColumns] = useState({});
    const [conditions, setConditions] = useState([]);

    const [generatedData, setGeneratedData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize columns
    useEffect(() => {
        if (reportType && REPORT_COLUMNS[reportType]) {
            const cols = {};
            REPORT_COLUMNS[reportType].forEach(col => cols[col] = true);
            setSelectedColumns(cols);
        }
    }, [reportType]);

    const getDateOptions = (type) => {
        switch (type) {
            case 'Inventario': return [
                { value: 'fecha_ultima_compra', label: 'Fecha Última Compra' },
                { value: 'fecha_vencimiento', label: 'Fecha Vencimiento' }
            ];
            case 'Activos': return [
                { value: 'fecha_adquisicion', label: 'Fecha Compra' }
            ];
            case 'SolicitudesCotizacion': return [
                { value: 'fecha_solicitud', label: 'Fecha Solicitud' },
                { value: 'created_at', label: 'Fecha Creación' }
            ];
            case 'FacturasCompra': return [
                { value: 'fecha_emision', label: 'Fecha Emisión' },
                { value: 'fecha_vencimiento', label: 'Fecha Vencimiento' }
            ];
            case 'Mantenimiento': return [
                { value: 'fecha_ejecucion', label: 'Fecha Ejecución' },
                { value: 'created_at', label: 'Fecha Creación' }
            ];
            case 'PlanMantenimiento': return [
                { value: 'fecha_programada', label: 'Fecha Programada' }
            ];
            case 'OrdenesCompra': return [
                { value: 'fecha_solicitud', label: 'Fecha Solicitud' },
                { value: 'fecha_entrega', label: 'Fecha Entrega' },
                { value: 'created_at', label: 'Fecha Creación' }
            ];
            case 'OrdenesTrabajo': return [
                { value: 'created_at', label: 'Fecha Creación' },
                { value: 'fecha_inicio_real', label: 'Fecha Inicio Real' }
            ];
            case 'ProveedoresTecnicos': return [
                { value: 'created_at', label: 'Fecha Creación' }
            ];
            case 'Depreciación': return [
                { value: 'fecha_adquisicion', label: 'Fecha Adquisición' }
            ];
            case 'SugeridoCompra': return [
                { value: 'fecha_ultima_compra', label: 'Fecha Última Compra' }
            ];
            default: return [];
        }
    };

    const addCondition = () => {
        setConditions([...conditions, { id: Date.now(), field: '', operator: 'eq', value: '' }]);
    };

    const removeCondition = (id) => {
        setConditions(conditions.filter(c => c.id !== id));
    };

    const updateCondition = (id, key, val) => {
        setConditions(conditions.map(c => c.id === id ? { ...c, [key]: val } : c));
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await generateReport({
                report_type: reportType,
                filters: { conditions }
            });
            setGeneratedData(response.data);
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleColumn = (col) => {
        setSelectedColumns(prev => ({
            ...prev,
            [col]: !prev[col]
        }));
    };

    const handleExport = (format) => {
        if (!generatedData.length) return;

        if (!generatedData.length) return;

        const dateStr = new Date().toISOString().split('T')[0];
        const fileNameBase = `${reportType.replace(/\s+/g, '_')}_${dateStr}`;
        const activeCols = Object.keys(selectedColumns).filter(k => selectedColumns[k]);

        if (format === 'csv') {
            const headers = activeCols.join(',');
            const rows = generatedData.map(row =>
                activeCols.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
            ).join('\n');

            const csvContent = `${headers}\n${rows}`;
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${fileNameBase}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } else if (format === 'xls') {
            let tableHTML = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            tableHTML += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
            tableHTML += '<body><table border="1"><thead><tr>';
            activeCols.forEach(key => { tableHTML += `<th style="background-color: #f1f5f9; font-weight: bold;">${key}</th>`; });
            tableHTML += '</tr></thead><tbody>';
            generatedData.forEach(row => {
                tableHTML += '<tr>';
                activeCols.forEach(key => { tableHTML += `<td>${row[key] || ''}</td>`; });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table></body></html>';

            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), tableHTML], { type: 'application/vnd.ms-excel' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileNameBase}.xls`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        }
    };

    // Filter data client-side
    const displayData = generatedData.filter(row => {
        if (!searchTerm) return true;
        return Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Constructor de Reportes</h1>
                    <p className="text-slate-500 dark:text-slate-400">Reporte: <span className="font-bold text-blue-600 dark:text-blue-400">{reportType}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full overflow-y-auto max-h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-500" />
                                <h2 className="font-bold text-slate-800 dark:text-white">Filtros Avanzados</h2>
                            </div>
                            <button
                                onClick={addCondition}
                                className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Agregar Filtro"
                            >
                                <PlusCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {conditions.map((condition) => (
                                <div key={condition.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 relative group animate-fade-in">
                                    <button
                                        onClick={() => removeCondition(condition.id)}
                                        className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-800 text-red-500 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="space-y-3">
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                            value={condition.field}
                                            onChange={e => updateCondition(condition.id, 'field', e.target.value)}
                                        >
                                            <option value="">Seleccionar Campo...</option>
                                            {REPORT_COLUMNS[reportType].map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>

                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                                value={condition.operator}
                                                onChange={e => updateCondition(condition.id, 'operator', e.target.value)}
                                            >
                                                <option value="eq">Igual a</option>
                                                <option value="neq">Diferente de</option>
                                                <option value="contains">Contiene</option>
                                                <option value="gt">Mayor que</option>
                                                <option value="lt">Menor que</option>
                                            </select>
                                            <input
                                                type={condition.field.toLowerCase().includes('fecha') ? 'date' : 'text'}
                                                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                                placeholder="Valor..."
                                                value={condition.value}
                                                onChange={e => updateCondition(condition.id, 'value', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || (conditions.length > 0 && conditions.some(c => !c.field))}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:grayscale"
                            >
                                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Generar / Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Right: Columns Selection */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Layout className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-bold text-slate-800 dark:text-white">Columnas Seleccionadas</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[300px] lg:max-h-full">
                            {REPORT_COLUMNS[reportType] && REPORT_COLUMNS[reportType].map(col => (
                                <button
                                    key={col}
                                    onClick={() => toggleColumn(col)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                                        ${selectedColumns[col]
                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                    `}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedColumns[col] ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`}>
                                        {selectedColumns[col] && <CheckSquare className="w-3 h-3 text-white" />}
                                    </div>
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: Results Table (Full Width) */}
                <div className="lg:col-span-12">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 gap-4">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300">
                                Resultados ({displayData.length})
                            </h3>
                            <div className="flex w-full sm:w-auto gap-2">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar en resultados..."
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => handleExport('xls')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors">
                                    <Download className="w-3 h-3" /> Excel
                                </button>
                                <button onClick={() => handleExport('csv')} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors">
                                    <Download className="w-3 h-3" /> CSV
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto p-4">
                            {displayData.length > 0 ? (
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            {Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(col => (
                                                <th key={col} className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.map((row, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                {Object.keys(selectedColumns).filter(k => selectedColumns[k]).map(col => (
                                                    <td key={`${idx}-${col}`} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                        {row[col]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Genera el reporte para ver los resultados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportBuilder;
