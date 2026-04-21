import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowLeft, Calendar, Clock, CheckCircle, AlertTriangle, User, 
    Settings, Printer, FileText, Building, ClipboardList, Info, 
    Trash2, Edit, X, Mail, Upload, Loader2, MessageSquare, 
    Maximize2, ExternalLink, MapPin, Tag, Wrench, Activity,
    Play, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

const MaintenanceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [maintenanceParts, setMaintenanceParts] = useState([]);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Techs and Assets for modals/context
    const [techs, setTechs] = useState([]);
    const [assets, setAssets] = useState([]);
    const [providers, setProviders] = useState([]);

    const [executeForm, setExecuteForm] = useState({
        fecha_ejecucion: new Date().toISOString().split('T')[0],
        tecnico_id: '',
        observaciones: '',
        horas_trabajo: 1,
        costo_mano_obra: 0
    });

    const canEdit = !['SOLICITANTE', 'LIMPIEZA', 'RECEPCION'].includes(user?.role?.toUpperCase());

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const [sRes, pRes, tRes, aRes, provRes] = await Promise.all([
                api.get(`/maintenance/schedule/${id}`),
                api.get(`/maintenance/schedule/${id}/parts`),
                api.get('/technicians'),
                api.get('/assets'),
                api.get('/providers')
            ]);
            
            setSchedule(sRes.data);
            setMaintenanceParts(pRes.data);
            setTechs(tRes.data);
            setAssets(aRes.data);
            setProviders(provRes.data);
            
            if (sRes.data.tecnico_id) {
                setExecuteForm(prev => ({ ...prev, tecnico_id: sRes.data.tecnico_id }));
            }
        } catch (err) {
            console.error("Error fetching maintenance detail:", err);
            setError("No se pudo cargar la información del mantenimiento.");
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        try {
            setIsSaving(true);
            const res = await api.post(`/maintenance/execute/${id}`, executeForm);
            alert(res.data); // "Mantenimiento completado..."
            setShowExecuteModal(false);
            fetchDetail();
        } catch (error) {
            console.error("Error executing:", error);
            alert("Error al ejecutar mantenimiento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Está seguro de eliminar este plan de mantenimiento?')) return;
        try {
            await api.delete(`/maintenance/schedule/${id}`);
            alert('Mantenimiento eliminado exitosamente');
            navigate('/maintenance');
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0f172a]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (error || !schedule) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-8">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate('/maintenance')} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors mb-6 font-bold uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="w-4 h-4" /> Volver a la lista
                    </button>
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{error || "Registro no encontrado"}</h2>
                        <p className="text-slate-500 dark:text-slate-400">El mantenimiento solicitado no existe o ha sido eliminado.</p>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completado': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
            case 'programado': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
            case 'cancelado': return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
            default: return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'critica': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
            case 'alta': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
            case 'media': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
            default: return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header/Nav */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/maintenance')} 
                            className="p-3 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 hover:border-blue-500/50 transition-all shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${getStatusColor(schedule.estado)}`}>
                                    {schedule.estado?.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${getPriorityColor(schedule.prioridad)}`}>
                                    Prioridad {schedule.prioridad}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                {schedule.codigo || `MNT-${schedule.id}`}
                                <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
                                <span className="text-blue-500">{schedule.tipo?.toUpperCase()}</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => window.print()}
                            className="flex-1 sm:flex-none bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:text-blue-500 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Imprimir
                        </button>
                        
                        {schedule.estado === 'programado' && canEdit && (
                            <button 
                                onClick={() => setShowExecuteModal(true)}
                                className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" /> Ejecutar Mantenimiento
                            </button>
                        )}

                        {canEdit && (
                            <button 
                                onClick={handleDelete}
                                className="p-3 bg-white dark:bg-[#1e293b] text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                                title="Eliminar Mantenimiento"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Details & Asset */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Summary Card */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0f172a]/20">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Información del Plan</label>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4">{schedule.asunto || "Mantenimiento Programado"}</h2>
                                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                        {schedule.observaciones || <span className="italic text-slate-400">Sin observaciones adicionales.</span>}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Frecuencia</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        {schedule.recurrente ? schedule.frecuencia : 'Evento Único'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Próxima Fecha</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {schedule.fecha || 'Sin fecha'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Costo Est.</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        ${schedule.costo_estimado || '0.00'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Anticipación</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        {schedule.dias_anticipacion || 0} días
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Asset Information */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            <div className="w-full md:w-64 aspect-square md:aspect-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                                {assets.find(a => a.id == schedule.equipo_id)?.imagen_url ? (
                                    <img src={assets.find(a => a.id == schedule.equipo_id).imagen_url} className="w-full h-full object-cover" alt="Equipo" />
                                ) : (
                                    <Settings className="w-16 h-16 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 p-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Equipo / Activo Vinculado</label>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                                        {schedule.equipo || "Activo Desconocido"}
                                    </h3>
                                    <Link to={`/assets/${schedule.equipo_id}`} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl hover:bg-blue-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        Ver Activo <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Código Administrativo</span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{assets.find(a => a.id == schedule.equipo_id)?.codigo_administrativo || 'S/N'}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ubicación</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{assets.find(a => a.id == schedule.equipo_id)?.ubicacion || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Linked Work Order */}
                        {schedule.tiene_ot && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-purple-200 dark:border-purple-800 shadow-lg shadow-purple-500/5 p-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-2xl">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">Orden de Trabajo Generada</label>
                                        <h4 className="text-xl font-black text-slate-800 dark:text-white">{schedule.codigo_ot}</h4>
                                    </div>
                                </div>
                                <Link 
                                    to={`/work-orders/${schedule.orden_trabajo_id}`} 
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2"
                                >
                                    Ver Orden <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Providers & Parts */}
                    <div className="space-y-8">
                        
                        {/* Responsible Context */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Técnico Asignado</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {techs.find(t => t.id == schedule.tecnico_id)?.nombre || "No asignado"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Empresa / Proveedor</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {schedule.proveedor_nombre || "Atención Interna"}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Responsable Interno</span>
                                    <span className="text-slate-200">{schedule.responsable}</span>
                                </div>
                            </div>
                        </div>

                        {/* Planned Parts */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Repuestos / Insumos Planificados</label>
                            
                            {maintenanceParts.length > 0 ? (
                                <div className="space-y-3">
                                    {maintenanceParts.map(part => (
                                        <div key={part.id} className="p-4 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-slate-800 dark:text-white">{part.nombre}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase">{part.codigo}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-blue-500">{part.cantidad_estimada} <span className="text-[10px] text-slate-400">cant.</span></div>
                                                <div className="text-[9px] font-black text-emerald-500">${part.costo_estimado}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                    <Wrench className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin repuestos planificados</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Ejecución */}
            <Modal
                isOpen={showExecuteModal}
                onClose={() => setShowExecuteModal(false)}
                onSave={handleExecute}
                title="Ejecutar Mantenimiento"
                saveText="Confirmar Ejecución"
                isSaving={isSaving}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha de Ejecución</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                value={executeForm.fecha_ejecucion}
                                onChange={(e) => setExecuteForm({...executeForm, fecha_ejecucion: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico</label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                value={executeForm.tecnico_id}
                                onChange={(e) => setExecuteForm({...executeForm, tecnico_id: e.target.value})}
                            >
                                <option value="">Seleccionar...</option>
                                {techs.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Horas de Trabajo</label>
                            <input 
                                type="number"
                                step="0.5"
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                value={executeForm.horas_trabajo}
                                onChange={(e) => setExecuteForm({...executeForm, horas_trabajo: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo Mano de Obra</label>
                            <input 
                                type="number"
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                value={executeForm.costo_mano_obra}
                                onChange={(e) => setExecuteForm({...executeForm, costo_mano_obra: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Observaciones Finales</label>
                        <textarea 
                            rows="3"
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none resize-none"
                            placeholder="Describa el trabajo realizado..."
                            value={executeForm.observaciones}
                            onChange={(e) => setExecuteForm({...executeForm, observaciones: e.target.value})}
                        ></textarea>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MaintenanceDetailPage;
