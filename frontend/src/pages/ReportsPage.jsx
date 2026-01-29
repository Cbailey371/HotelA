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
    Pencil
} from 'lucide-react';
import {
    getInventoryStatus,
    getMaintenanceRoi,
    getAssetDepreciation,
    getScheduledReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport
} from '../services/reportsService';
import Modal from '../components/Modal';

const ReportsPage = () => {
    const [filters, setFilters] = useState({
        category: '',
        dateRange: 'last30',
        department: ''
    });

    const [stats, setStats] = useState({
        inventory: null,
        roi: null,
        depreciation: null
    });

    const [scheduledReports, setScheduledReports] = useState([]);
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
        indefinido: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Pass category filter to inventory status
            const filterParams = {};
            if (filters.category) filterParams.category = filters.category;

            const [inventoryRes, roiRes, depreciationRes, scheduledRes] = await Promise.all([
                getInventoryStatus(filterParams),
                getMaintenanceRoi(),
                getAssetDepreciation(),
                getScheduledReports()
            ]);
            setStats({
                inventory: inventoryRes.data,
                roi: roiRes.data,
                depreciation: depreciationRes.data
            });
            setScheduledReports(scheduledRes.data);
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        // Trigger fetch with current filters
        fetchData();
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
            indefinido: true
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
            hora_ejecucion: report.hora_ejecucion.substring(0, 5), // '08:00:00' -> '08:00'
            indefinido: !report.fecha_fin
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
                hora_ejecucion: newReport.hora_ejecucion + ":00" // Ensure time format
            };

            // Remove auxiliary field
            delete payload.indefinido;

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

    const getFrequencyColor = (freq) => {
        switch (freq.toLowerCase()) {
            case 'semanal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'mensual': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'diario': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Generador de Reportes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Genere, programe y analice los datos de sus activos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                        CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                        XLS
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Reporte
                    </button>
                </div>
            </header>

            {/* Metrics Stats */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Métricas Clave</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Inventory */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
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
                            {stats.inventory && stats.inventory.low_stock_count > 0 && (
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-3 h-3" />
                                    {stats.inventory.low_stock_count} con stock bajo
                                </p>
                            )}
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
                            <div className="text-xs font-medium text-slate-400 mt-2">
                                {stats.roi ? `Top ${stats.roi.length} activos analizados` : 'Analizando...'}
                            </div>
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
                            <p className="text-xs text-slate-400 mt-2">
                                De un valor inicial de {stats.depreciation ? formatCurrency(stats.depreciation.total_purchase_value) : '...'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Report Builder */}
            <section className="bg-white dark:bg-[#1e293b] p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Constructor de Reportes</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-end">
                    <div className="w-full lg:w-1/4 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                        <select
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">Todas las Categorías</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Software">Software</option>
                            <option value="Mobiliario">Mobiliario</option>
                            <option value="Vehículos">Vehículos</option>
                            <option value="Maquinaria">Maquinaria</option>
                        </select>
                    </div>

                    <div className="w-full lg:w-1/4 space-y-2">
                        {/* Other filters can be updated later if backend supports them */}
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rango de Fechas</label>
                        <select
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                        >
                            <option value="last30">Últimos 30 Días</option>
                            <option value="thisQuarter">Este Año</option>
                            <option value="all">Todo el Historial</option>
                        </select>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <button
                            onClick={handleApplyFilters}
                            className="h-12 px-6 flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
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
