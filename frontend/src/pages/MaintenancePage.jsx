import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart3, Activity, Briefcase, Calendar, Plus, Clock, CheckCircle, Wrench, Filter, Settings, Play, ChevronRight, X, ClipboardList, Search
} from 'lucide-react';

const MaintenancePage = () => {
    const [schedules, setSchedules] = useState([]);
    const [techs, setTechs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [types, setTypes] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [providers, setProviders] = useState([]);
    const [inventory, setInventory] = useState([]); // New state
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [maintenanceParts, setMaintenanceParts] = useState([]); // New state for parts
    const [showPartSearch, setShowPartSearch] = useState(false);
    const [partSearchQuery, setPartSearchQuery] = useState('');

    const [scheduleForm, setScheduleForm] = useState({
        equipo_id: '',
        tipo_mantenimiento_id: '',
        frecuencia: 'Mensual',
        fecha_programada: '',
        responsable_id: '',
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
            const [sRes, tRes, aRes, tyRes, pRes, ttRes, iRes] = await Promise.all([
                api.get('/maintenance/schedule'),
                api.get('/technicians'),
                api.get('/assets'),
                api.get('/maintenance/types'),
                api.get('/providers'),
                api.get('/asset-config/maintenance-tasks'),
                api.get('/inventory') // Correct endpoint for parts
            ]);
            setSchedules(sRes.data);
            setTechs(tRes.data);
            setAssets(aRes.data);
            setTypes(tyRes.data);
            setProviders(pRes.data);
            setTaskTypes(ttRes.data || []);
            setInventory(iRes?.data || []); // New state
        } catch (error) {
            console.error("Error loading maintenance data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPart = async (partId, qty) => {
        const part = inventory.find(p => p.id_repuesto == partId);
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
                    repuesto_id: part.id_repuesto,
                    nombre: part.nombre_repuesto,
                    cantidad_estimada: qty,
                    stock_actual: part.stock_actual,
                    costo_estimado: part.costo_unitario
                }];
            });
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
        e.preventDefault();
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
            fetchAllData();
        } catch (error) {
            console.error("Error scheduling maintenance:", error.response?.data || error.message);
            alert('Error al guardar el plan');
        }
    };

    const handleExecuteSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/maintenance/execute/${selectedSchedule.id}`, executeForm);
            setShowExecuteModal(false);
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
                fecha_programada: schedule.fecha || new Date().toISOString().split('T')[0],
                prioridad: schedule.prioridad,
                observaciones: `Generado desde Plan de Mantenimiento (ID: ${schedule.id})`
            };
            await api.post('/work-orders', payload);
            alert('Orden de Trabajo generada exitosamente');
            fetchAllData();
        } catch (error) {
            console.error("Error creating work order:", error);
            alert('Error al crear la orden de trabajo');
        }
    };


    const openScheduleModal = async (schedule = null) => {
        if (schedule) {
            setEditingId(schedule.id);
            setScheduleForm({
                equipo_id: schedule.equipo_id,
                tipo_mantenimiento_id: schedule.tipo_mantenimiento_id,
                frecuencia: 'Mensual', // This might need to be fetched if available in DTO
                fecha_programada: schedule.fecha ? new Date(schedule.fecha).toISOString().split('T')[0] : '',
                responsable_id: '', // Logic to map name back to ID might be complex, leaving empty or need ID in DTO
                observaciones: '', // Need observations in DTO
                prioridad: schedule.prioridad,
                costo_estimado: 0,
                dias_anticipacion: 0,
                proveedor_id: '',
                tecnico_id: '',
                tarea_tipo_id: '',
                recurrente: false,
                responsable_interno_email: schedule.responsable,
                estado: schedule.estado
            });
            await fetchMaintenanceParts(schedule.id);
        } else {
            setEditingId(null);
            setMaintenanceParts([]); // Clear parts for new schedule
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

            {/* Dashboard Mini Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                        <Clock className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pendientes</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">{schedules.filter(s => s.estado === 'programado').length}</div>
                    <div className="mt-2 text-[10px] font-bold text-amber-500 uppercase tracking-tighter flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Requieren atención técnica
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Completados</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">{schedules.filter(s => s.estado === 'completado').length}</div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Meta mensual 85%
                    </div>
                </div>
                <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between mb-3 opacity-60">
                        <Briefcase className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Órdenes Hoy</span>
                    </div>
                    <div className="text-3xl font-black">2</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-tighter opacity-80">Ruta crítica activa</div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3 text-slate-400">
                        <Wrench className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Técnicos</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">{techs.filter(t => t.estado === 'activo').length}</div>
                    <div className="mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Disponibles en planta</div>
                </div>
            </div>

            {/* Schedule List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Próximas Actividades</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
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
                                <tr><td colSpan="5" className="text-center py-20 animate-pulse">Consultando base de mantenimiento...</td></tr>
                            ) : schedules.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-slate-400">No hay servicios programados.</td></tr>
                            ) : schedules.map((s) => (
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
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${s.estado === 'completado'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                            }`}>
                                            {s.estado}
                                        </span>
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Programar */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 scale-in-center flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50 flex-shrink-0">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                                {editingId ? 'Editar Servicio' : 'Programar Nuevo Servicio'}
                            </h3>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Prioridad</label>
                                    <select
                                        value={scheduleForm.prioridad}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, prioridad: e.target.value })}
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
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, estado: e.target.value })}
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
                                    <select
                                        required
                                        value={scheduleForm.equipo_id}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, equipo_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Seleccione equipo...</option>
                                        {assets.map(a => <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Tarea (Específico)</label>
                                    <select
                                        value={scheduleForm.tarea_tipo_id}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, tarea_tipo_id: e.target.value })}
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
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, fecha_programada: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo Estimado ($)</label>
                                    <input
                                        type="number"
                                        value={scheduleForm.costo_estimado}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, costo_estimado: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Días Anticipación</label>
                                    <input
                                        type="number"
                                        value={scheduleForm.dias_anticipacion}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, dias_anticipacion: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Proveedor (Opcional)</label>
                                    <select
                                        value={scheduleForm.proveedor_id}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, proveedor_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    >
                                        <option value="">Ninguno / Interno</option>
                                        {Array.isArray(providers) && providers.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico (Opcional)</label>
                                    <select
                                        value={scheduleForm.tecnico_id}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, tecnico_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    >
                                        <option value="">Seleccionar luego...</option>
                                        {techs.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Responsable Interno (Email o Usuario)</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={scheduleForm.responsable_id}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, responsable_id: e.target.value, responsable_interno_email: '' })}
                                            className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        >
                                            <option value="">Opcional: Seleccione usuario...</option>
                                            {Array.isArray(techs) && techs.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                                        </select>
                                        <input
                                            type="email"
                                            placeholder="O escriba un email..."
                                            value={scheduleForm.responsable_interno_email}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, responsable_interno_email: e.target.value, responsable_id: '' })}
                                            className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <input
                                        type="checkbox"
                                        id="recurrente"
                                        checked={scheduleForm.recurrente}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, recurrente: e.target.checked })}
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
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, frecuencia: e.target.value })}
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
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <Wrench className="w-4 h-4 text-blue-500" />
                                            Repuestos Requeridos
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowPartSearch(true)}
                                            className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                        >
                                            <Search className="w-3 h-3" />
                                            Buscar en Inventario
                                        </button>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <div className="relative flex-1">
                                            <select
                                                id="partSelect"
                                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2 pl-9 text-sm font-bold outline-none appearance-none"
                                            >
                                                <option value="">Seleccione repuesto...</option>
                                                {inventory.map(p => (
                                                    <option key={p.id_repuesto} value={p.id_repuesto}>
                                                        {p.nombre_repuesto} (Stock: {p.stock_actual})
                                                    </option>
                                                ))}
                                            </select>
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                                        </div>
                                        <input
                                            id="partQty"
                                            type="number"
                                            placeholder="Cant."
                                            className="w-20 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-sm font-bold outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const select = document.getElementById('partSelect');
                                                const qtyInput = document.getElementById('partQty');
                                                const partId = select.value;
                                                const qty = parseFloat(qtyInput.value);

                                                if (!partId || !qty) return;

                                                handleAddPart(partId, qty);

                                                qtyInput.value = '';
                                                select.value = '';
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
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
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, observaciones: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-6 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/30 transition-all">Programar</button>
                            </div>
                        </form >
                    </div >
                </div >
            )}

            {/* Modal Ejecutar (Mismo estilo) */}
            {
                showExecuteModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-600">
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Registrar Ejecución Técnica</h3>
                                <p className="text-blue-100 text-xs mt-1 font-bold italic truncate">Orden p/ {selectedSchedule?.equipo}</p>
                            </div>
                            <form onSubmit={handleExecuteSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico Ejecutor *</label>
                                        <select
                                            required
                                            value={executeForm.tecnico_id}
                                            onChange={(e) => setExecuteForm({ ...executeForm, tecnico_id: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        >
                                            <option value="">Seleccionar responsable...</option>
                                            {techs.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Horas de Trabajo</label>
                                        <input type="number" step="0.5" value={executeForm.horas_trabajo} onChange={(e) => setExecuteForm({ ...executeForm, horas_trabajo: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo M.O. ($)</label>
                                        <input type="number" value={executeForm.costo_mano_obra} onChange={(e) => setExecuteForm({ ...executeForm, costo_mano_obra: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hallazgos y Observaciones</label>
                                        <textarea rows="3" value={executeForm.observaciones} onChange={(e) => setExecuteForm({ ...executeForm, observaciones: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none" placeholder="Describa el trabajo realizado..."></textarea>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowExecuteModal(false)} className="px-6 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all">Cancelar</button>
                                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/30 transition-all">Completar Orden</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showPartSearch && (
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
                                <button onClick={() => setShowPartSearch(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {inventory.filter(p =>
                                    p.nombre_repuesto.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
                                    (p.codigo_repuesto && p.codigo_repuesto.toLowerCase().includes(partSearchQuery.toLowerCase()))
                                ).map(p => (
                                    <div key={p.id_repuesto} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 cursor-pointer group transition-all"
                                        onClick={() => {
                                            const select = document.getElementById('partSelect');
                                            if (select) select.value = p.id_repuesto;
                                            setShowPartSearch(false);
                                        }}
                                    >
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                            {p.imagen ? (
                                                <img src={`http://localhost:3000${p.imagen}`} alt={p.nombre_repuesto} className="w-full h-full object-cover" />
                                            ) : (
                                                <Settings className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h5 className="font-bold text-slate-700 dark:text-slate-200 truncate">{p.nombre_repuesto}</h5>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock_actual > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    Stock: {p.stock_actual}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">{p.codigo_repuesto || 'S/C'}</p>
                                            <p className="text-xs text-slate-400 truncate">{p.descripcion || 'Sin descripción'}</p>
                                        </div>
                                    </div>
                                ))}
                                {inventory.filter(p => p.nombre_repuesto.toLowerCase().includes(partSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-400">
                                        <p>No se encontraron repuestos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MaintenancePage;
