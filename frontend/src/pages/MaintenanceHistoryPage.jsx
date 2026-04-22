import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    BarChart3, Activity, Briefcase, Calendar, Plus, Clock, CheckCircle, Wrench, Filter, Settings, Play, ChevronRight, X, ClipboardList, Search, Trash2, Archive
} from 'lucide-react';
import Modal from '../components/Modal';
import RecordLimitSelector from '../components/RecordLimitSelector';

const MaintenanceHistoryPage = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [techs, setTechs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [types, setTypes] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [providers, setProviders] = useState([]);
    const [users, setUsers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [maintenanceParts, setMaintenanceParts] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    // Main List Filters
    const [scheduleSearch, setScheduleSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // In history, "all" means completed or cancelled
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [limit, setLimit] = useState(20);

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
                api.get('/inventory'),
                api.get('/users')
            ]);
            setSchedules(sRes.data);
            setTechs(tRes.data);
            setAssets(aRes.data);
            setTypes(tyRes.data);
            setProviders(pRes.data);
            setTaskTypes(ttRes.data || []);
            setInventory(iRes?.data || []);
            setUsers(uRes?.data || []);
        } catch (error) {
            console.error("Error fetching history data", error);
        } finally {
            setLoading(false);
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
        if (!confirm('¿Está seguro de eliminar este registro histórico?')) return;
        try {
            await api.delete(`/maintenance/schedule/${id}`);
            alert('Registro eliminado');
            fetchAllData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const openViewModal = async (schedule) => {
        setEditingId(schedule.id);
        
        // Parse time from observations
        let obs = schedule.observaciones || '';
        let hora = '08';
        let minutos = '00';
        let periodo = 'AM';

        const timeMatch = obs.match(/\[Hora: (\d{2}):(\d{2}) (AM|PM)\]/);
        if (timeMatch) {
            hora = timeMatch[1];
            minutos = timeMatch[2];
            periodo = timeMatch[3];
            obs = obs.replace(timeMatch[0], '').trim();
        }

        // We only show, don't allow complex edits in history usually, 
        // but we'll keep the same form for simplicity/consistency
        setSelectedSchedule(schedule);
        // Load parts
        try {
            const res = await api.get(`/maintenance/schedule/${schedule.id}/parts`);
            setMaintenanceParts(res.data);
        } catch (e) {}
        
        setShowScheduleModal(true);
    };

    // Filter schedules for History (Completed or Cancelled)
    const historySchedules = schedules.filter(s => 
        s.estado === 'completado' || s.estado === 'cancelado'
    );

    const filteredSchedules = historySchedules.filter(s => {
        const matchesSearch = (s.equipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
            (s.tipo || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
            (s.asunto || '').toLowerCase().includes(scheduleSearch.toLowerCase()) ||
            (s.codigo || '').toLowerCase().includes(scheduleSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.estado === statusFilter;
        const matchesPriority = priorityFilter === 'all' || (s.prioridad || '').toLowerCase() === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-500/10 rounded-xl flex items-center justify-center text-slate-600">
                        <Archive className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight text-uppercase">HISTORIAL DE MANTENIMIENTO</h2>
                        <p className="text-slate-500 text-sm font-medium">Registros finalizados y cancelados</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar en historial..."
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
                            <option value="all">Todos los finalizados</option>
                            <option value="completado">Completados</option>
                            <option value="cancelado">Cancelados</option>
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
                        <RecordLimitSelector limit={limit} onChange={setLimit} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Código</th>
                                <th className="px-8 py-4">Asunto / Título</th>
                                <th className="px-8 py-4">Equipo / Activo</th>
                                <th className="px-8 py-4">Servicio</th>
                                <th className="px-8 py-4">Fecha Programada</th>
                                <th className="px-8 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-20 animate-pulse font-bold text-slate-400">Consultando historial...</td></tr>
                            ) : filteredSchedules.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-20 text-slate-400 font-bold">No hay registros en el historial con estos filtros.</td></tr>
                            ) : filteredSchedules.slice(0, limit).map((s) => (
                                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-black text-slate-400 mb-0.5 uppercase tracking-wider">{s.codigo || 'N/A'}</div>
                                    </td>
                                    <td className="px-8 py-5 relative group/asunto overflow-visible">
                                        <div 
                                            onClick={() => navigate(`/maintenance/${s.id}`)}
                                            className="font-bold text-blue-600 dark:text-blue-400 text-sm tracking-tight cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 border-b border-dotted border-blue-400/30 w-fit transition-colors"
                                        >
                                            {s.asunto || 'Sin asunto'}
                                        </div>
                                        
                                        {/* Tooltip Detallado (Mismo diseño que el calendario y planes activos) */}
                                        <div className="absolute z-[100] invisible group-hover/asunto:visible opacity-0 group-hover/asunto:opacity-100 transition-all duration-200 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-72 pointer-events-none left-0 bottom-full mb-3 whitespace-normal translate-x-4">
                                            <div className="space-y-3">
                                                <div className="border-b border-white/10 pb-2">
                                                    <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">ASUNTO</div>
                                                    <div className="text-xs font-bold leading-tight">{s.asunto || 'Sin asunto definido'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">ACTIVO / EQUIPO</div>
                                                    <div className="text-xs font-bold">{s.equipo}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">CÓDIGO MNT</div>
                                                        <div className="text-xs font-bold text-slate-300">{s.codigo || 'N/A'}</div>
                                                    </div>
                                                    {s.codigo_ot && (
                                                        <div>
                                                            <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase mb-0.5">ORDEN TRABAJO</div>
                                                            <div className="text-xs font-bold text-purple-200">{s.codigo_ot}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">PROVEEDOR</div>
                                                    <div className="text-xs font-bold text-slate-300">{s.proveedor_nombre || 'Mantenimiento Interno'}</div>
                                                </div>
                                                <div className="pt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                        s.prioridad?.toLowerCase() === 'alta' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                                        s.prioridad?.toLowerCase() === 'media' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    }`}>
                                                        Prioridad {s.prioridad || 'Media'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-900"></div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{s.equipo}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-black text-blue-600 mb-0.5 uppercase tracking-wider">{s.tipo}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{s.recurrente ? s.frecuencia : 'Evento Único'}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                            <Calendar className="w-4 h-4 text-blue-400" />
                                            {s.fecha || 'Sin fecha'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <select
                                            value={s.estado}
                                            onChange={(e) => updateScheduleStatus(s.id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter outline-none cursor-pointer transition-all border-none ${
                                                s.estado === 'completado'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : s.estado === 'cancelado'
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                                            }`}
                                        >
                                            <option value="programado">Restaurar a Programado</option>
                                            <option value="completado">Completado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openViewModal(s)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                title="Eliminar del historial"
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

            {/* View Details Modal (Simplificado para historial) */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title={`Detalles de Mantenimiento Histórico - ${selectedSchedule?.codigo || ''}`}
                showSave={false}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Equipo</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{selectedSchedule?.equipo}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Servicio</p>
                            <p className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800">{selectedSchedule?.tipo}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{selectedSchedule?.fecha}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                            <p className={`text-sm font-black p-3 rounded-xl border uppercase ${
                                selectedSchedule?.estado === 'completado' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                                {selectedSchedule?.estado}
                            </p>
                        </div>
                    </div>

                    {maintenanceParts.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Wrench className="w-3 h-3" /> Repuestos Utilizados
                            </p>
                            <div className="bg-slate-50 dark:bg-[#0f172a]/50 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                                        <tr>
                                            <th className="p-3">Repuesto</th>
                                            <th className="p-3 text-center">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {maintenanceParts.map(mp => (
                                            <tr key={mp.id}>
                                                <td className="p-3 font-medium">{mp.nombre}</td>
                                                <td className="p-3 text-center font-bold text-blue-600">{mp.cantidad_estimada}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observaciones Finales</p>
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm italic text-slate-600 dark:text-slate-400">
                            {selectedSchedule?.observaciones || 'Sin observaciones registradas.'}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MaintenanceHistoryPage;
