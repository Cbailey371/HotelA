import React, { useState, useEffect } from 'react';
import {
    Plus,
    Clock
} from 'lucide-react';
import {
    getScheduledReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    executeScheduledReport
} from '../services/reportsService';
import { getCategories } from '../services/assetConfigService';
import Modal from '../components/Modal';
import ReportSelection from '../components/reports/ReportSelection';
import ReportBuilder from '../components/reports/ReportBuilder';

const ReportsPage = () => {
    // View State: 'SELECTION' or 'BUILDER'
    const [viewState, setViewState] = useState('SELECTION');
    const [selectedReportType, setSelectedReportType] = useState(null);

    const [scheduledReports, setScheduledReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Scheduled Report Modal State
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
            const [scheduledRes, categoriesRes] = await Promise.all([
                getScheduledReports(),
                getCategories()
            ]);
            setScheduledReports(scheduledRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Navigation Handlers
    const handleSelectReport = (type) => {
        setSelectedReportType(type);
        setViewState('BUILDER');
    };

    const handleBackToSelection = () => {
        setViewState('SELECTION');
        setSelectedReportType(null);
    };

    // --- Scheduled Reports Logic ---

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

    // UI Helpers
    const getFrequencyColor = (freq) => {
        switch (freq?.toLowerCase()) {
            case 'semanal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'mensual': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'diario': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-12">

            {/* Main Interactive Section */}
            <section className="min-h-[500px]">
                {viewState === 'SELECTION' ? (
                    <ReportSelection onSelect={handleSelectReport} />
                ) : (
                    <ReportBuilder
                        reportType={selectedReportType}
                        onBack={handleBackToSelection}
                        categories={categories}
                    />
                )}
            </section>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-800"></div>

            {/* Scheduled Reports Section - Always Visible */}
            <section className="animate-fade-in-up delay-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reportes Programados</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Automatiza el envío de reportes a tu equipo.</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02]"
                    >
                        <Plus className="w-4 h-4" />
                        Programar Nuevo
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Frecuencia</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Destinatarios</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {scheduledReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            No hay reportes programados activos.
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
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate" title={report.destinatarios}>
                                                {report.destinatarios}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => openEditModal(report)} className="text-blue-500 hover:text-blue-700 text-xs font-bold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">Editar</button>
                                                    <button type="button" onClick={() => handleExecuteReport(report.id)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">Ejecutar</button>
                                                    <button type="button" onClick={() => handleDeleteReport(report.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Scheduled Report Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleSaveReport}
                isDirty={isDirty}
                title={isEditing ? 'Editar Reporte' : 'Programar Reporte'}
                width="max-w-lg"
            >
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre Reporte</label>
                        <input className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.nombre} onChange={e => { setNewReport({ ...newReport, nombre: e.target.value }); setIsDirty(true) }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                            <select className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.tipo_reporte} onChange={e => { setNewReport({ ...newReport, tipo_reporte: e.target.value }); setIsDirty(true) }}>
                                <option value="Inventario">Inventario</option>
                                <option value="PlanMantenimiento">Plan de Mantenimiento</option>
                                <option value="Mantenimiento">Mantenimiento (Ejecutado)</option>
                                <option value="Depreciación">Depreciación</option>
                                <option value="OrdenesCompra">Ordenes de Compra</option>
                                <option value="OrdenesTrabajo">Ordenes de Trabajo</option>
                                <option value="ProveedoresTecnicos">Proveedores</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Frecuencia</label>
                            <select className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.frecuencia} onChange={e => { setNewReport({ ...newReport, frecuencia: e.target.value }); setIsDirty(true) }}>
                                <option value="Semanal">Semanal</option>
                                <option value="Mensual">Mensual</option>
                                <option value="Diario">Diario</option>
                            </select>
                        </div>
                    </div>
                    {/* Dynamic Range */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rango Dinámico</label>
                        <select className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.dynamic_date_range} onChange={e => { setNewReport({ ...newReport, dynamic_date_range: e.target.value }); setIsDirty(true) }}>
                            <option value="">Ninguno</option>
                            <option value="last_7_days">Últimos 7 días</option>
                            <option value="last_30_days">Últimos 30 días</option>
                            <option value="current_month">Mes Actual</option>
                            <option value="previous_month">Mes Anterior</option>
                        </select>
                    </div>
                    {/* Time & Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.fecha_inicio} onChange={e => { setNewReport({ ...newReport, fecha_inicio: e.target.value }); setIsDirty(true) }} />
                        <input type="time" className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.hora_ejecucion} onChange={e => { setNewReport({ ...newReport, hora_ejecucion: e.target.value }); setIsDirty(true) }} />
                    </div>
                    <input type="text" placeholder="Emails (separados por coma)" className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 theme-input" value={newReport.destinatarios} onChange={e => { setNewReport({ ...newReport, destinatarios: e.target.value }); setIsDirty(true) }} />
                </form>
            </Modal>
        </div>
    );
};

export default ReportsPage;
