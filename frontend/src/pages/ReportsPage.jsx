import React, { useState, useEffect } from 'react';
import {
    FileText,
    BarChart,
    TrendingDown,
    Download,
    Plus,
    Filter,
    MoreVertical,
    Calendar,
    Users,
    ClipboardList,
    DollarSign,
    File,
    X,
    Check,
    AlertCircle,
    Pencil,
    Search,
    Play
} from 'lucide-react';
import {
    getInventoryStatus,
    getMaintenanceRoi,
    getAssetDepreciation,
    getScheduledReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    executeScheduledReport,
    generateReport
} from '../services/reportsService';
import { getCategories } from '../services/assetConfigService';
import Modal from '../components/Modal';

const ReportsPage = () => {
    const [filters, setFilters] = useState({
        category: '',
        dateRange: 'last30',
        reportType: 'Inventario'
    });

    const [stats, setStats] = useState({
        inventory: null,
        roi: null,
        depreciation: null
    });

    const [scheduledReports, setScheduledReports] = useState([]);
    const [generatedData, setGeneratedData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // New state for dynamic data and filtering
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentReportId, setCurrentReportId] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const [newReport, setNewReport] = useState({
        nombre: '',
        tipo_reporte: 'Inventario',
        frecuencia: 'Semanal',
        destinatarios: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        hora_ejecucion: '08:00',
        indefinido: true,
        dynamic_date_range: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const filterParams = {};
            if (filters.category) filterParams.category = filters.category;

            const [inventoryRes, roiRes, depreciationRes, scheduledRes, categoriesRes] = await Promise.all([
                getInventoryStatus(filterParams),
                getMaintenanceRoi(),
                getAssetDepreciation(),
                getScheduledReports(),
                getCategories()
            ]);
            setStats({
                inventory: inventoryRes.data,
                roi: roiRes.data,
                depreciation: depreciationRes.data
            });
            setScheduledReports(scheduledRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setNewReport({
            nombre: '',
            tipo_reporte: 'Inventario',
            frecuencia: 'Semanal',
            destinatarios: '',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: '',
            hora_ejecucion: '08:00',
            indefinido: true,
            dynamic_date_range: ''
        });
        setIsEditing(false);
        setCurrentReportId(null);
        setIsDirty(false);
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (report) => {
        setNewReport({
            nombre: report.nombre,
            tipo_reporte: report.tipo_reporte,
            frecuencia: report.frecuencia,
            destinatarios: report.destinatarios || '',
            fecha_inicio: report.fecha_inicio,
            fecha_fin: report.fecha_fin || '',
            hora_ejecucion: report.hora_ejecucion ? report.hora_ejecucion.substring(0, 5) : '08:00',
            indefinido: !report.fecha_fin,
            dynamic_date_range: report.filtros?.dynamic_date_range || ''
        });
        setIsEditing(true);
        setCurrentReportId(report.id);
        setIsDirty(false);
        setShowCreateModal(true);
    };

    const handleSaveReport = async (e) => {
        if (e) e.preventDefault();
        try {
            const payload = {
                ...newReport,
                fecha_fin: newReport.indefinido ? null : newReport.fecha_fin,
                hora_ejecucion: newReport.hora_ejecucion + ":00",
                filtros: {
                    dynamic_date_range: newReport.dynamic_date_range
                }
            };
            delete payload.indefinido;
            delete payload.dynamic_date_range;

            if (isEditing) {
                await updateScheduledReport(currentReportId, payload);
            } else {
                await createScheduledReport(payload);
            }

            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving report:", error);
        }
    };

    const handleDeleteReport = async (id) => {
        if (window.confirm("¿Está seguro de eliminar este reporte programado?")) {
            try {
                await deleteScheduledReport(id);
                setScheduledReports(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                console.error("Error deleting report:", error);
            }
        }
    };

    const handleExecuteReport = async (id) => {
        if (window.confirm("¿Desea ejecutar este reporte ahora y enviarlo a los destinatarios?")) {
            try {
                await executeScheduledReport(id);
                alert("Reporte ejecutado y enviado correctamente.");
            } catch (error) {
                console.error("Error executing report:", error);
                alert("Error al ejecutar el reporte.");
            }
        }
    };

    const getFrequencyColor = (freq) => {
        switch (freq?.toLowerCase()) {
            case 'semanal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'mensual': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'diario': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
    };


    // New state for filters
    const [dateFilterField, setDateFilterField] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const getDateOptions = (type) => {
        switch (type) {
            case 'Inventario': return [
                { value: 'fecha_ultima_compra', label: 'Fecha Última Compra' },
                { value: 'fecha_vencimiento', label: 'Fecha Vencimiento' }
            ];
            case 'Mantenimiento': return [
                { value: 'fecha_ejecucion', label: 'Fecha Ejecución' },
                { value: 'created_at', label: 'Fecha Creación' }
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
            default: return [];
        }
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setGeneratedData(null);
        try {
            const filtersPayload = {
                category: filters.category,
                // Add date range filters
                date_field: dateFilterField,
                start_date: startDate,
                end_date: endDate
            };

            const res = await generateReport({
                report_type: filters.reportType,
                filters: filtersPayload
            });
            setGeneratedData(res.data);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Error al generar el reporte");
        } finally {
            setIsGenerating(false);
        }
    };

    // Reset date filters when report type changes
    useEffect(() => {
        setDateFilterField('');
        setStartDate('');
        setEndDate('');
    }, [filters.reportType]);

    const handleExport = (format) => {
        if (!generatedData || generatedData.length === 0) return;

        if (format === 'csv') {
            const headers = Object.keys(generatedData[0]).join(',');
            const rows = generatedData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
            const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `reporte_${filters.reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'xls') {
            let tableHTML = '<table border="1"><thead><tr>';
            Object.keys(generatedData[0]).forEach(key => { tableHTML += `<th>${key}</th>`; });
            tableHTML += '</tr></thead><tbody>';
            generatedData.forEach(row => {
                tableHTML += '<tr>';
                Object.values(row).forEach(val => { tableHTML += `<td>${val}</td>`; });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';

            const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${filters.reportType.toLowerCase()}.xls`;
            a.click();
        }
    };

    // Filter logic
    const filteredData = generatedData ? generatedData.filter(row => {
        if (!searchTerm) return true;
        return Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }) : null;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header ... */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Generador de Reportes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Genere, programe y analice los datos de sus activos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Reporte Programado
                    </button>
                </div>
            </header>

            {/* Metrics ... */}
            <section>
                {/* ... (Metrics section remains unchanged) ... */}
                {/* Re-render stats section to keep context if needed, but for replace_file I must be precise or include it. 
                     Since I am not changing Metrics, I will try to target "Custom Report Builder" specifically or replace the whole section structure carefully.
                     Given the large file and chunk replacement, I will assume the previous sections are fine and focus on the Builder.
                 */}
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Métricas Clave</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Inventory */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        {/* ... content ... */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">Repuestos</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Estado de Inventario</h3>
                        <div className="space-y-1">
                            <p className="text-2xl font-black text-slate-800 dark:text-white">
                                {stats.inventory ? formatCurrency(stats.inventory.total_value) : 'Cargando...'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {stats.inventory ? `${stats.inventory.total_items} ítems en total` : '...'}
                            </p>
                        </div>
                    </div>
                    {/* ROI */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">Activos</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Análisis ROI</h3>
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                                Activos más costosos de mantener.
                            </p>
                        </div>
                    </div>
                    {/* Depreciation */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">Financiero</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Depreciación Total</h3>
                        <div className="space-y-1">
                            <p className="text-2xl font-black text-slate-800 dark:text-white">
                                {stats.depreciation ? formatCurrency(stats.depreciation.total_depreciation) : 'Cargando...'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Report Builder */}
            <section className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Constructor de Reportes</h2>
                    {generatedData && (
                        <div className="flex gap-2">
                            <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                <Download className="w-3 h-3" /> CSV
                            </button>
                            <button onClick={() => handleExport('xls')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                <Download className="w-3 h-3" /> XLS
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="w-full lg:w-1/4 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Reporte</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={filters.reportType}
                                onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                            >
                                <option value="Inventario">Inventario</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Depreciación">Depreciación</option>
                                <option value="OrdenesCompra">Ordenes de Compra</option>
                                <option value="OrdenesTrabajo">Ordenes de Trabajo</option>
                                <option value="ProveedoresTecnicos">Proveedores y Técnicos</option>
                            </select>
                        </div>

                        <div className="w-full lg:w-1/4 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría (Opcional)</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filtering */}
                        <div className="w-full lg:w-1/4 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar por Fecha</label>
                            <select
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={dateFilterField}
                                onChange={(e) => setDateFilterField(e.target.value)}
                            >
                                <option value="">Sin Filtro de Fecha</option>
                                {getDateOptions(filters.reportType).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Range Inputs (Conditional) */}
                    {dateFilterField && (
                        <div className="flex flex-col lg:flex-row gap-4 animate-fade-in p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="w-full lg:w-1/2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                                <input
                                    type="date"
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="w-full lg:w-1/2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</label>
                                <input
                                    type="date"
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isGenerating}
                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    <span>Generar Reporte</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Table */}
                {filteredData && (
                    <div className="mt-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Resultados ({filteredData.length})
                            </h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Filtrar resultados..."
                                    className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
                                    <tr>
                                        {filteredData.length > 0 && Object.keys(filteredData[0]).map((key) => (
                                            <th key={key} scope="col" className="px-6 py-3 whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, index) => (
                                        <tr key={index} className="bg-white border-b dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            {Object.values(row).map((val, i) => (
                                                <td key={i} className="px-6 py-4 whitespace-nowrap">
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {/* Scheduled Reports Table */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reportes Programados</h2>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Frecuencia</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Próxima Ejecución</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Destinatarios</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {scheduledReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                            No hay reportes programados.
                                        </td>
                                    </tr>
                                ) : (
                                    scheduledReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                {report.nombre}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {report.tipo_reporte}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getFrequencyColor(report.frecuencia)}`}>
                                                    {report.frecuencia}
                                                </span>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    {report.hora_ejecucion ? report.hora_ejecucion.substring(0, 5) : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {report.fecha_fin ? `Hasta ${report.fecha_fin}` : 'Indefinido'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate" title={report.destinatarios}>
                                                {report.destinatarios}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(report)}
                                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleExecuteReport(report.id)}
                                                    className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Ejecutar Ahora"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReport(report.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Create/Edit Report Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleSaveReport} // Now safe to call without event if we allow optional event
                isDirty={isDirty}
                title={isEditing ? 'Editar Reporte' : 'Programar Reporte'}
                width="max-w-lg"
            >
                <form id="report-form" onSubmit={(e) => handleSaveReport(e)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre del Reporte</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                            value={newReport.nombre}
                            onChange={e => { setNewReport({ ...newReport, nombre: e.target.value }); setIsDirty(true); }}
                            placeholder="Ej. Inventario Mensual"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                value={newReport.tipo_reporte}
                                onChange={e => { setNewReport({ ...newReport, tipo_reporte: e.target.value }); setIsDirty(true); }}
                            >
                                <option value="Inventario">Inventario</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Depreciación">Depreciación</option>
                                <option value="OrdenesCompra">Ordenes de Compra</option>
                                <option value="OrdenesTrabajo">Ordenes de Trabajo</option>
                                <option value="ProveedoresTecnicos">Proveedores y Técnicos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Frecuencia</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                value={newReport.frecuencia}
                                onChange={e => { setNewReport({ ...newReport, frecuencia: e.target.value }); setIsDirty(true); }}
                            >
                                <option value="Diario">Diario</option>
                                <option value="Semanal">Semanal</option>
                                <option value="Mensual">Mensual</option>
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Filters Section */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rango de Datos Dinámico</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                            value={newReport.dynamic_date_range || ''}
                            onChange={e => { setNewReport({ ...newReport, dynamic_date_range: e.target.value }); setIsDirty(true); }}
                        >
                            <option value="">Sin Filtro Dinámico (Usar Todos)</option>
                            <option value="last_7_days">Últimos 7 días</option>
                            <option value="last_30_days">Últimos 30 días</option>
                            <option value="current_month">Mes Actual</option>
                            <option value="previous_month">Mes Anterior</option>
                            <option value="current_year">Año Actual</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Este filtro se aplicará automáticamente en cada ejecución.</p>
                    </div>

                    {/* Scheduling Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha Inicio</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                value={newReport.fecha_inicio}
                                onChange={e => { setNewReport({ ...newReport, fecha_inicio: e.target.value }); setIsDirty(true); }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hora Ejecución</label>
                            <input
                                type="time"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                value={newReport.hora_ejecucion}
                                onChange={e => { setNewReport({ ...newReport, hora_ejecucion: e.target.value }); setIsDirty(true); }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Fecha Fin</label>
                            <label className="flex items-center space-x-2 text-xs text-slate-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newReport.indefinido}
                                    onChange={e => { setNewReport({ ...newReport, indefinido: e.target.checked }); setIsDirty(true); }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Indefinido</span>
                            </label>
                        </div>
                        {!newReport.indefinido && (
                            <input
                                type="date"
                                required={!newReport.indefinido}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                                value={newReport.fecha_fin}
                                onChange={e => { setNewReport({ ...newReport, fecha_fin: e.target.value }); setIsDirty(true); }}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Destinatarios (Emails separados por coma)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all theme-input"
                            value={newReport.destinatarios}
                            onChange={e => { setNewReport({ ...newReport, destinatarios: e.target.value }); setIsDirty(true); }}
                            placeholder="admin@hotel.com, gerente@hotel.com"
                        />
                    </div>

                    <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98]">
                        {isEditing ? 'Actualizar Programación' : 'Guardar Programación'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default ReportsPage;
