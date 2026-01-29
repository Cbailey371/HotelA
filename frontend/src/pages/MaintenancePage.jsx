import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart3, Activity, Briefcase, Calendar, Plus, Clock, CheckCircle, Wrench, Filter, Settings, Play, ChevronRight, X, ClipboardList, Search, Trash2
} from 'lucide-react';
import Modal from '../components/Modal';

const MaintenancePage = () => {
    const [schedules, setSchedules] = useState([]);
    const [techs, setTechs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [types, setTypes] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [providers, setProviders] = useState([]);
    const [users, setUsers] = useState([]);
    const [inventory, setInventory] = useState([]); // New state
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [maintenanceParts, setMaintenanceParts] = useState([]); // New state for parts
    const [showPartSearch, setShowPartSearch] = useState(false);
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [selectedPart, setSelectedPart] = useState(null); // New state for input
    const [partCategoryFilter, setPartCategoryFilter] = useState('');
    const [partStockFilter, setPartStockFilter] = useState('all');
    const [partPriceMax, setPartPriceMax] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Main List Filters
    const [scheduleSearch, setScheduleSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Asset Search States
    const [showAssetSearch, setShowAssetSearch] = useState(false);
    const [assetSearchQuery, setAssetSearchQuery] = useState('');
    const [assetCategoryFilter, setAssetCategoryFilter] = useState('');
    const [assetLocationFilter, setAssetLocationFilter] = useState('');
    const [showAdvancedAssetFilters, setShowAdvancedAssetFilters] = useState(false);

    const [scheduleForm, setScheduleForm] = useState({
        equipo_id: '',
        tipo_mantenimiento_id: '',
        frecuencia: 'Mensual',
        fecha_programada: '',
        responsable_id: '',
        observaciones: '',
        prioridad: 'media',
        costo_estimado: 0,
        dias_anticipacion: 0,
        proveedor_id: '',
        tecnico_id: '',
        tarea_tipo_id: '',
        recurrente: false,
        responsable_interno_email: ''
    });

    const [executeForm, setExecuteForm] = useState({
        fecha_ejecucion: new Date().toISOString().split('T')[0],
        tecnico_id: '',
        observaciones: '',
        horas_trabajo: 1,
        costo_mano_obra: 0
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [sRes, tRes, aRes, tyRes, pRes, ttRes, iRes, uRes] = await Promise.all([
                api.get('/maintenance/schedule'),
                api.get('/technicians'),
                api.get('/assets'),
                api.get('/maintenance/types'),
                api.get('/providers'),
                api.get('/asset-config/maintenance-tasks'),
                api.get('/inventory'), // Correct endpoint for parts
                api.get('/users')
            ]);
            setSchedules(sRes.data);
            setTechs(tRes.data);
            setAssets(aRes.data);
            setTypes(tyRes.data);
            setProviders(pRes.data);
            setTaskTypes(ttRes.data || []);
            setInventory(iRes?.data || []); // New state
            setUsers(uRes?.data || []);
        } catch (error) {
            console.error("Error loading maintenance data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleChange = (field, value) => {
        setScheduleForm(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleExecuteChange = (field, value) => {
        setExecuteForm(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleAddPart = async (partId, qty) => {
        const part = inventory.find(p => p.id == partId);
        if (!part) return;

        if (editingId) {
            // If editing, save to DB immediately
            try {
                await api.post(`/maintenance/schedule/${editingId}/parts`, {
                    repuesto_id: parseInt(partId),
                    cantidad: qty
                });
                fetchMaintenanceParts(editingId);
            } catch (error) {
                console.error("Error adding part", error);
                alert("Error al agregar repuesto");
            }
        } else {
            // If creating, add to local state
            setMaintenanceParts(prev => {
                const existing = prev.find(p => p.repuesto_id == partId);
                if (existing) {
                    return prev.map(p => p.repuesto_id == partId ? { ...p, cantidad_estimada: qty } : p);
                }
                return [...prev, {
                    repuesto_id: part.id,
                    nombre: part.nombre,
                    cantidad_estimada: qty,
                    stock_actual: part.stock,
                    costo_estimado: part.precio
                }];
            });
            setIsDirty(true);
        }
    };

    const handleRemovePart = async (partId, repuestoId) => {
        if (editingId) {
            try {
                // Here partId is the link ID (mantenimiento_repuestos.id)
                await api.delete(`/maintenance/schedule/parts/${partId}`);
                fetchMaintenanceParts(editingId);
            } catch (error) {
                console.error("Error removing part", error);
            }
        } else {
            setMaintenanceParts(prev => prev.filter(p => p.repuesto_id != repuestoId));
            setIsDirty(true);
        }
    };

    const fetchMaintenanceParts = async (scheduleId) => {
        try {
            const res = await api.get(`/maintenance/schedule/${scheduleId}/parts`);
            setMaintenanceParts(res.data);
        } catch (error) {
            console.error("Error loading parts", error);
        }
    };

    const handleScheduleSubmit = async (e) => {
        if (e) e.preventDefault();
        const sanitizedData = { ...scheduleForm };
        // Sanitize IDs
        ['equipo_id', 'tipo_mantenimiento_id', 'responsable_id', 'proveedor_id', 'tecnico_id', 'tarea_tipo_id'].forEach(field => {
            if (sanitizedData[field] === '') sanitizedData[field] = null;
            else if (sanitizedData[field] !== null) sanitizedData[field] = parseInt(sanitizedData[field]);
        });

        // Sanitize numeric fields
        ['costo_estimado', 'dias_anticipacion'].forEach(field => {
            if (sanitizedData[field] === '') sanitizedData[field] = null;
            else if (sanitizedData[field] !== null) sanitizedData[field] = parseFloat(sanitizedData[field]);
        });

        try {
            if (editingId) {
                await api.put(`/maintenance/schedule/${editingId}`, sanitizedData);
                alert('Plan actualizado exitosamente');
            } else {
                const res = await api.post('/maintenance/schedule', sanitizedData);
                const newId = res.data;

                // Save parts for new schedule
                for (const part of maintenanceParts) {
                    await api.post(`/maintenance/schedule/${newId}/parts`, {
                        repuesto_id: part.repuesto_id,
                        cantidad: part.cantidad_estimada
                    });
                }

                alert('Plan creado exitosamente');
            }
            setShowScheduleModal(false);
            setIsDirty(false);
            fetchAllData();
        } catch (error) {
            console.error("Error scheduling maintenance:", error.response?.data || error.message);
            alert('Error al guardar el plan');
        }
    };

    const handleExecuteSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.post(`/maintenance/execute/${selectedSchedule.id}`, executeForm);
            setShowExecuteModal(false);
            setIsDirty(false);
            fetchAllData();
        } catch (error) { console.error(error); }
    };

    const handleCreateWorkOrder = async (schedule) => {
        if (!confirm('¿Generar Orden de Trabajo para este mantenimiento?')) return;
        try {
            const payload = {
                id_calendario: schedule.id,
                id_activo: schedule.equipo_id,
                id_tipo_mantenimiento: schedule.tipo_mantenimiento_id,
                id_tecnico: schedule.tecnico_id,
                id_proveedor: schedule.proveedor_id,
                fecha_programada: schedule.fecha || new Date().toISOString().split('T')[0],
                prioridad: schedule.prioridad,
                observaciones: schedule.codigo ? `Plan de Mantenimiento: ${schedule.codigo}` : `Plan de Mantenimiento ID: ${schedule.id}`
            };
            await api.post('/work-orders', payload);
            alert('Orden de Trabajo generada exitosamente');
            fetchAllData();
        } catch (error) {
            console.error("Error creating work order:", error);
            alert('Error al crear la orden de trabajo');
        }
    };


    const updateScheduleStatus = async (id, newStatus) => {
        try {
            await api.put(`/maintenance/schedule/${id}`, { estado: newStatus });
            fetchAllData();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        }
    };


    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de eliminar este mantenimiento? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/maintenance/schedule/${id}`);
            alert('Mantenimiento eliminado exitosamente');
            fetchAllData();
        } catch (error) {
            console.error("Error deleting maintenance:", error);
            alert('Error al eliminar el mantenimiento');
        }
    };


    const openScheduleModal = async (schedule = null) => {
        if (schedule) {
            setEditingId(schedule.id);
            setScheduleForm({
                equipo_id: schedule.equipo_id,
                tipo_mantenimiento_id: schedule.tipo_mantenimiento_id,
                frecuencia: schedule.frecuencia || 'Mensual',
                fecha_programada: schedule.fecha ? new Date(schedule.fecha).toISOString().split('T')[0] : '',
                responsable_id: schedule.responsable_id || '',
                observaciones: schedule.observaciones || '',
                prioridad: schedule.prioridad || 'media',
                costo_estimado: schedule.costo_estimado || 0,
                dias_anticipacion: schedule.dias_anticipacion || 0,
                proveedor_id: schedule.proveedor_id || '',
                tecnico_id: schedule.tecnico_id || '',
                tarea_tipo_id: schedule.tarea_tipo_id || '',
                recurrente: schedule.recurrente || false,
                responsable_interno_email: schedule.responsable_interno_email || '',
                estado: schedule.estado
            });
            await fetchMaintenanceParts(schedule.id);
        } else {
            setEditingId(null);
            setMaintenanceParts([]); // Clear parts for new schedule
            setSelectedPart(null); // Reset selection
            setScheduleForm({
                equipo_id: '',
                tipo_mantenimiento_id: types[0]?.id_tipo_mantenimiento || '',
                frecuencia: 'Mensual',
                fecha_programada: '',
                responsable_id: '',
                observaciones: '',
                prioridad: 'media',
                costo_estimado: 0,
                dias_anticipacion: 0,
                proveedor_id: '',
                tecnico_id: '',
                tarea_tipo_id: '',
                recurrente: false,
                responsable_interno_email: '',
                estado: 'programado'
            });
        }
        setIsDirty(false);
        setShowScheduleModal(true);
    };

    const openExecuteModal = (schedule) => {
        setSelectedSchedule(schedule);
        setExecuteForm({
            fecha_ejecucion: new Date().toISOString().split('T')[0],
            tecnico_id: '',
            observaciones: '',
            horas_trabajo: 1,
            costo_mano_obra: 0
        });
        setIsDirty(false);
        setShowExecuteModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">PLAN DE MANTENIMIENTO</h2>
                        <p className="text-slate-500 text-sm font-medium">Cronograma de servicios {new Date().getFullYear()}</p>
                    </div>
                </div>
                <button
                    onClick={() => openScheduleModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Programar Servicio
                </button>
            </div>


            {/* Schedule List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-0">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Próximas Actividades</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar equipo o servicio..."
                                value={scheduleSearch}
                                onChange={(e) => setScheduleSearch(e.target.value)}
                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-9 text-sm font-bold outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="programado">Programado</option>
                            <option value="completado">Completado</option>
                            <option value="atrasado">Atrasado</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none"
                        >
                            <option value="all">Todas las prioridades</option>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Código</th>
                                <th className="px-8 py-4">Equipo / Activo</th>
                                <th className="px-8 py-4">Servicio</th>
                                <th className="px-8 py-4">Fecha Programada</th>
                                <th className="px-8 py-4">Prioridad / Estado</th>
                                <th className="px-8 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-20 animate-pulse font-bold text-slate-400">Consultando base de mantenimiento...</td></tr>
                            ) : schedules.filter(s => {
                                const matchesSearch = (s.equipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                                    (s.tipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                                    (s.codigo || '').toLowerCase().includes(scheduleSearch.toLowerCase());
                                const matchesStatus = statusFilter === 'all' || s.estado === statusFilter;
                                const matchesPriority = priorityFilter === 'all' || (s.prioridad || '').toLowerCase() === priorityFilter;
                                return matchesSearch && matchesStatus && matchesPriority;
                            }).length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">No se encontraron servicios que coincidan con los filtros.</td></tr>
                            ) : schedules.filter(s => {
                                const matchesSearch = (s.equipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                                    (s.tipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
                                    (s.codigo || '').toLowerCase().includes(scheduleSearch.toLowerCase());
                                const matchesStatus = statusFilter === 'all' || s.estado === statusFilter;
                                const matchesPriority = priorityFilter === 'all' || (s.prioridad || '').toLowerCase() === priorityFilter;
                                return matchesSearch && matchesStatus && matchesPriority;
                            }).map((s) => (
                                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-black text-slate-400 mb-0.5 uppercase tracking-wider">{s.codigo || 'N/A'}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">

                                            <div className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{s.equipo}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-black text-blue-600 mb-0.5 uppercase tracking-wider">{s.tipo}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Preventivo Semestral</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                            <Calendar className="w-4 h-4 text-blue-400" />
                                            {s.fecha || 'Sin fecha'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <select
                                            value={s.estado || 'programado'}
                                            onChange={(e) => updateScheduleStatus(s.id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer transition-all border-none ${s.estado === 'completado'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : s.estado === 'cancelado'
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                                    : s.estado === 'en proceso'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                                }`}
                                        >
                                            <option value="programado" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Programado</option>
                                            <option value="en proceso" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">En Proceso</option>
                                            <option value="completado" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Completado</option>
                                            <option value="cancelado" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Cancelado</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openScheduleModal(s)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>

                                            {s.estado === 'programado' && !s.tiene_ot && (
                                                <button
                                                    onClick={() => handleCreateWorkOrder(s)}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 p-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                                                    title="Crear Orden de Trabajo"
                                                >
                                                    <ClipboardList className="w-4 h-4" />
                                                </button>
                                            )}

                                            {s.tiene_ot && (
                                                <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 p-2 rounded-lg border border-purple-200 dark:border-purple-800 cursor-help" title="Con Orden de Trabajo">
                                                    <ClipboardList className="w-4 h-4" />
                                                </span>
                                            )}

                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Programar */}
            {/* Modal Programar */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSave={handleScheduleSubmit}
                isDirty={isDirty}
                title={editingId ? `Editar Servicio - ${schedules.find(s => s.id === editingId)?.codigo}` : 'Programar Nuevo Servicio'}
            >
                <form onSubmit={handleScheduleSubmit} className="p-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Prioridad</label>
                            <select
                                value={scheduleForm.prioridad}
                                onChange={(e) => handleScheduleChange('prioridad', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Estado</label>
                            <select
                                value={scheduleForm.estado || 'programado'}
                                onChange={(e) => handleScheduleChange('estado', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="borrador">Borrador</option>
                                <option value="programado">Programado</option>
                                <option value="en_ejecucion">En Ejecución</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Equipo a Intervenir</label>
                            <div className="relative group">
                                <input
                                    readOnly
                                    required
                                    type="text"
                                    placeholder="Haga clic para buscar equipo..."
                                    value={scheduleForm.equipo_id ? assets.find(a => a.id == scheduleForm.equipo_id)?.nombre : ''}
                                    onClick={() => {
                                        setAssetSearchQuery('');
                                        setAssetCategoryFilter('');
                                        setAssetLocationFilter('');
                                        setShowAssetSearch(true);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border-2 border-dashed border-slate-200 dark:border-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-3.5 pl-10 text-sm font-bold outline-none cursor-pointer transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 italic"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-hover:text-blue-500 transition-colors pointer-events-none" />
                                {scheduleForm.equipo_id && (
                                    <div className="absolute right-4 top-4 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                        ID: {assets.find(a => a.id == scheduleForm.equipo_id)?.codigo}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Tarea (Específico)</label>
                            <select
                                value={scheduleForm.tarea_tipo_id}
                                onChange={(e) => handleScheduleChange('tarea_tipo_id', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="">Ninguna...</option>
                                {taskTypes.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha Planeada</label>
                            <input
                                required
                                type="date"
                                value={scheduleForm.fecha_programada}
                                onChange={(e) => handleScheduleChange('fecha_programada', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo Estimado ($)</label>
                            <input
                                type="number"
                                value={scheduleForm.costo_estimado}
                                onChange={(e) => handleScheduleChange('costo_estimado', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Días Anticipación</label>
                            <input
                                type="number"
                                value={scheduleForm.dias_anticipacion}
                                onChange={(e) => handleScheduleChange('dias_anticipacion', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Proveedor (Opcional)</label>
                            <select
                                value={scheduleForm.proveedor_id}
                                onChange={(e) => handleScheduleChange('proveedor_id', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="">Ninguno / Interno</option>
                                {Array.isArray(providers) && providers.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico (Opcional)</label>
                            <select
                                value={scheduleForm.tecnico_id}
                                onChange={(e) => handleScheduleChange('tecnico_id', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="">Seleccionar luego...</option>
                                {techs.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Responsable Interno (Email o Usuario)</label>
                            <div className="flex gap-2">
                                <select
                                    value={scheduleForm.responsable_id}
                                    onChange={(e) => {
                                        handleScheduleChange('responsable_id', e.target.value);
                                        handleScheduleChange('responsable_interno_email', '');
                                    }}
                                    className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                >
                                    <option value="">Opcional: Seleccione usuario...</option>
                                    {Array.isArray(users) && users.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                                </select>
                                <input
                                    type="email"
                                    placeholder="O escriba un email..."
                                    value={scheduleForm.responsable_interno_email}
                                    onChange={(e) => {
                                        handleScheduleChange('responsable_interno_email', e.target.value);
                                        handleScheduleChange('responsable_id', '');
                                    }}
                                    className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                />
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <input
                                type="checkbox"
                                id="recurrente"
                                checked={scheduleForm.recurrente}
                                onChange={(e) => handleScheduleChange('recurrente', e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="recurrente" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                Servicio Recurrente
                                <span className="block text-[10px] font-medium text-slate-500">Se reprogramará automáticamente según la frecuencia</span>
                            </label>
                        </div>

                        <div className="col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Frecuencia</label>
                                <select
                                    value={scheduleForm.frecuencia}
                                    onChange={(e) => handleScheduleChange('frecuencia', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                >
                                    {['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'].map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Spare Parts Section */}
                        <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <div className="mb-4">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-blue-500" />
                                    Repuestos Requeridos
                                </h4>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <input
                                        readOnly
                                        type="text"
                                        placeholder="Seleccione repuesto..."
                                        value={selectedPart ? `${selectedPart.nombre} (Stock: ${selectedPart.stock})` : ''}
                                        onClick={() => {
                                            setPartSearchQuery('');
                                            setPartCategoryFilter('');
                                            setPartStockFilter('all');
                                            setPartPriceMax('');
                                            setShowPartSearch(true);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border-2 border-dashed border-slate-300 dark:border-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-3 pl-9 text-sm font-bold outline-none cursor-pointer transition-all text-blue-600 dark:text-blue-400 placeholder:text-slate-400 italic"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                                </div>
                                <input
                                    id="partQty"
                                    type="number"
                                    placeholder="Cant."
                                    defaultValue={1}
                                    className="w-20 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm font-bold outline-none font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const qtyInput = document.getElementById('partQty');
                                        const qty = parseFloat(qtyInput.value);

                                        if (!selectedPart || !qty) {
                                            alert("Por favor seleccione un repuesto del buscador");
                                            return;
                                        }

                                        handleAddPart(selectedPart.id, qty);
                                        setSelectedPart(null);
                                        qtyInput.value = 1;
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {maintenanceParts.length > 0 && (
                                <div className="bg-slate-50 dark:bg-[#0f172a]/50 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 font-bold">
                                            <tr>
                                                <th className="p-3">Repuesto</th>
                                                <th className="p-3 text-center">Cant.</th>
                                                <th className="p-3 text-center">Stock</th>
                                                <th className="p-3 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {maintenanceParts.map(mp => (
                                                <tr key={mp.repuesto_id || mp.id}>
                                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                                        {mp.nombre}
                                                    </td>
                                                    <td className="p-3 text-center font-bold">
                                                        {mp.cantidad_estimada}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mp.stock_actual >= mp.cantidad_estimada
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {mp.stock_actual}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePart(mp.id, mp.repuesto_id)}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Observaciones del Plan</label>
                            <textarea
                                rows="3"
                                value={scheduleForm.observaciones}
                                onChange={(e) => handleScheduleChange('observaciones', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/30 transition-all">Guardar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Ejecutar (Mismo estilo) */}
            <Modal
                isOpen={showExecuteModal}
                onClose={() => setShowExecuteModal(false)}
                onSave={handleExecuteSubmit}
                isDirty={isDirty}
                title="Registrar Ejecución Técnica"
            >
                <form onSubmit={handleExecuteSubmit} className="p-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico Ejecutor *</label>
                            <select
                                required
                                value={executeForm.tecnico_id}
                                onChange={(e) => handleExecuteChange('tecnico_id', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            >
                                <option value="">Seleccionar responsable...</option>
                                {techs.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Horas de Trabajo</label>
                            <input type="number" step="0.5" value={executeForm.horas_trabajo} onChange={(e) => handleExecuteChange('horas_trabajo', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo M.O. ($)</label>
                            <input type="number" value={executeForm.costo_mano_obra} onChange={(e) => handleExecuteChange('costo_mano_obra', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hallazgos y Observaciones</label>
                            <textarea rows="3" value={executeForm.observaciones} onChange={(e) => handleExecuteChange('observaciones', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" placeholder="Describa el trabajo realizado..."></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowExecuteModal(false)} className="px-6 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">Cancelar</button>
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/30 transition-all">Completar Orden</button>
                    </div>
                </form>
            </Modal>

            {showPartSearch && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar repuesto por nombre o código..."
                                value={partSearchQuery}
                                onChange={(e) => setPartSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-slate-300 dark:text-white"
                            />
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`p-2 rounded-lg transition-colors ${showAdvancedFilters ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                                title="Filtros avanzados"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button onClick={() => setShowPartSearch(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {showAdvancedFilters && (
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoría</label>
                                    <select
                                        value={partCategoryFilter}
                                        onChange={(e) => setPartCategoryFilter(e.target.value)}
                                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold outline-none"
                                    >
                                        <option value="">Todas</option>
                                        {[...new Set(inventory.map(p => p.categoria).filter(Boolean))].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</label>
                                    <select
                                        value={partStockFilter}
                                        onChange={(e) => setPartStockFilter(e.target.value)}
                                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold outline-none"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="in-stock">Disponible</option>
                                        <option value="out-of-stock">Agotado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Máx ($)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Max..."
                                            value={partPriceMax}
                                            onChange={(e) => setPartPriceMax(e.target.value)}
                                            className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPartCategoryFilter('');
                                                setPartStockFilter('all');
                                                setPartPriceMax('');
                                            }}
                                            className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto p-4 space-y-2">
                            {inventory.filter(p => {
                                const matchesSearch = (p.nombre || '').toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                                    (p.codigo || '').toLowerCase().includes(partSearchQuery.toLowerCase());
                                const matchesCategory = !partCategoryFilter || p.categoria === partCategoryFilter;
                                const matchesStock = partStockFilter === 'all' ||
                                    (partStockFilter === 'in-stock' && p.stock > 0) ||
                                    (partStockFilter === 'out-of-stock' && p.stock <= 0);
                                const matchesPrice = !partPriceMax || p.precio <= parseFloat(partPriceMax);

                                return matchesSearch && matchesCategory && matchesStock && matchesPrice;
                            }).map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer group transition-all"
                                    onClick={() => {
                                        setSelectedPart(p);
                                        setShowPartSearch(false);
                                    }}
                                >
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {p.imagen ? (
                                            <img src={`http://localhost:3000${p.imagen}`} alt={p.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <Settings className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.nombre}</h5>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                EST: {p.stock}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{p.codigo || 'S/C'}</span>
                                            <p className="text-xs text-slate-400 truncate">{p.descripcion || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">${p.precio}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">P/V</p>
                                    </div>
                                </div>
                            ))}
                            {inventory.filter(p => {
                                const matchesSearch = (p.nombre || '').toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                                    (p.codigo || '').toLowerCase().includes(partSearchQuery.toLowerCase());
                                const matchesCategory = !partCategoryFilter || p.categoria === partCategoryFilter;
                                const matchesStock = partStockFilter === 'all' ||
                                    (partStockFilter === 'in-stock' && p.stock > 0) ||
                                    (partStockFilter === 'out-of-stock' && p.stock <= 0);
                                const matchesPrice = !partPriceMax || p.precio <= parseFloat(partPriceMax);

                                return matchesSearch && matchesCategory && matchesStock && matchesPrice;
                            }).length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-400">
                                        <p>No se encontraron repuestos</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Search Modal */}
            {showAssetSearch && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <Search className="w-5 h-5 text-blue-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar equipo por nombre o código..."
                                value={assetSearchQuery}
                                onChange={(e) => setAssetSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-base font-bold outline-none placeholder:text-slate-400 dark:text-white"
                            />
                            <button
                                onClick={() => setShowAdvancedAssetFilters(!showAdvancedAssetFilters)}
                                className={`p-2 rounded-lg transition-colors ${showAdvancedAssetFilters ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                title="Filtros avanzados"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button onClick={() => setShowAssetSearch(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {showAdvancedAssetFilters && (
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Categoría</label>
                                    <select
                                        value={assetCategoryFilter}
                                        onChange={(e) => setAssetCategoryFilter(e.target.value)}
                                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold outline-none"
                                    >
                                        <option value="">Todas las categorías</option>
                                        {[...new Set(assets.map(a => a.categoria).filter(Boolean))].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ubicación</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={assetLocationFilter}
                                            onChange={(e) => setAssetLocationFilter(e.target.value)}
                                            className="flex-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold outline-none"
                                        >
                                            <option value="">Todas las ubicaciones</option>
                                            {[...new Set(assets.map(a => a.ubicacion).filter(Boolean))].map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAssetCategoryFilter('');
                                                setAssetLocationFilter('');
                                            }}
                                            className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto p-2 space-y-1">
                            {assets.filter(a => {
                                const matchesSearch = (a.nombre || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                    (a.codigo || '').toLowerCase().includes(assetSearchQuery.toLowerCase());
                                const matchesCategory = !assetCategoryFilter || a.categoria === assetCategoryFilter;
                                const matchesLocation = !assetLocationFilter || a.ubicacion === assetLocationFilter;
                                return matchesSearch && matchesCategory && matchesLocation;
                            }).map(a => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group transition-all"
                                    onClick={() => {
                                        setScheduleForm({ ...scheduleForm, equipo_id: a.id });
                                        setShowAssetSearch(false);
                                    }}
                                >
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {a.imagen_url ? (
                                            <img src={`http://localhost:3000${a.imagen_url}`} alt={a.nombre} className="w-full h-full object-cover" />
                                        ) : (
                                            <Settings className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{a.nombre}</span>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                {a.codigo}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {a.categoria && (
                                                <span className="text-[9px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded uppercase">{a.categoria}</span>
                                            )}
                                            {a.ubicacion && (
                                                <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded uppercase">{a.ubicacion}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {assets.filter(a => {
                                const matchesSearch = (a.nombre || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                    (a.codigo || '').toLowerCase().includes(assetSearchQuery.toLowerCase());
                                const matchesCategory = !assetCategoryFilter || a.categoria === assetCategoryFilter;
                                const matchesLocation = !assetLocationFilter || a.ubicacion === assetLocationFilter;
                                return matchesSearch && matchesCategory && matchesLocation;
                            }).length === 0 && (
                                    <div className="py-10 text-center text-slate-400">
                                        <p className="font-bold">No se encontraron equipos</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenancePage;
