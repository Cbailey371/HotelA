import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart3, Activity, Briefcase
} from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';

const MaintenancePage = () => {
    const [schedules, setSchedules] = useState([]);
    const [techs, setTechs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [types, setTypes] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const [scheduleForm, setScheduleForm] = useState({
        equipo_id: '',
        tipo_mantenimiento_id: '',
        frecuencia: 'Mensual',
        fecha_programada: '',
        responsable_id: '',
        observaciones: '',
        codigo_mantenimiento: '',
        prioridad: 'media',
        costo_estimado: 0,
        dias_anticipacion: 0,
        proveedor_id: '',
        tecnico_id: ''
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
            const [sRes, tRes, aRes, tyRes, pRes] = await Promise.all([
                axios.get('http://localhost:3000/api/maintenance/schedule'),
                axios.get('http://localhost:3000/api/technicians'),
                axios.get('http://localhost:3000/api/assets'),
                axios.get('http://localhost:3000/api/maintenance/types'),
                axios.get('http://localhost:3000/api/providers')
            ]);
            setSchedules(sRes.data);
            setTechs(tRes.data);
            setAssets(aRes.data);
            setTypes(tyRes.data);
            setProviders(pRes.data);
        } catch (error) {
            console.error("Error loading maintenance data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/maintenance/schedule', scheduleForm);
            setShowScheduleModal(false);
            fetchAllData();
        } catch (error) { console.error(error); }
    };

    const handleExecuteSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`http://localhost:3000/api/maintenance/execute/${selectedSchedule.id}`, executeForm);
            setShowExecuteModal(false);
            fetchAllData();
        } catch (error) { console.error(error); }
    };

    const openScheduleModal = () => {
        setScheduleForm({
            equipo_id: '',
            tipo_mantenimiento_id: types[0]?.id_tipo_mantenimiento || '',
            frecuencia: 'Mensual',
            fecha_programada: '',
            responsable_id: '',
            observaciones: '',
            codigo_mantenimiento: generateCode('MNT-'),
            prioridad: 'media',
            costo_estimado: 0,
            dias_anticipacion: 0,
            proveedor_id: '',
            tecnico_id: ''
        });
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
                    onClick={openScheduleModal}
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
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <Settings className="w-5 h-5" />
                                            </div>
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
                                        {s.estado === 'programado' && (
                                            <button
                                                onClick={() => openExecuteModal(s)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 ml-auto"
                                            >
                                                <Play className="w-3 h-3 fill-current" /> Ejecutar
                                            </button>
                                        )}
                                        {s.estado === 'completado' && (
                                            <button className="text-slate-400 hover:text-blue-500 p-2 ml-auto block">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        )}
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
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 scale-in-center">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Programar Nuevo Servicio</h3>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Código Mantenimiento</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={scheduleForm.codigo_mantenimiento}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, codigo_mantenimiento: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none pr-20"
                                            placeholder="ej. MNT-XXXX"
                                        />
                                        <button type="button" onClick={() => setScheduleForm(prev => ({ ...prev, codigo_mantenimiento: generateCode('MNT-') }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-300 transition-colors uppercase">Regenerar</button>
                                    </div>
                                </div>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Tarea</label>
                                    <select
                                        value={scheduleForm.tipo_mantenimiento_id}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, tipo_mantenimiento_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    >
                                        {types.map(t => <option key={t.id_tipo_mantenimiento} value={t.id_tipo_mantenimiento}>{t.nombre_tipo}</option>)}
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
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ejecutar (Mismo estilo) */}
            {showExecuteModal && (
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
            )}
        </div>
    );
};

export default MaintenancePage;
