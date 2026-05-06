import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowLeft, Calendar, Clock, CheckCircle, AlertTriangle, User, 
    Settings, FileText, Building, ClipboardList, Info, 
    Trash2, Edit, X, Mail, Upload, Loader2, MessageSquare, 
    Maximize2, ExternalLink, MapPin, Tag, Wrench, Activity,
    Play, ChevronRight, Plus, Filter, Search
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import WorkOrderSelectorModal from '../components/WorkOrderSelectorModal';

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

    // Edit Schedule Modal States
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        equipo_id: '',
        tipo_mantenimiento_id: 1,
        fecha_programada: '',
        prioridad: 'media',
        responsable_id: '',
        responsable_interno_email: '',
        asunto: '',
        estado: 'programado',
        costo_estimado: 0,
        dias_anticipacion: 3,
        tarea_tipo_id: '',
        recurrente: false,
        frecuencia: 'Mensual',
        observaciones: '',
        id_ots: []
    });

    const [isWOModalOpen, setIsWOModalOpen] = useState(false);

    const handleToggleWO = (woId) => {
        const currentIds = scheduleForm.id_ots || [];
        const newIds = currentIds.includes(woId)
            ? currentIds.filter(id => id !== woId)
            : [...currentIds, woId];
        handleScheduleChange('id_ots', newIds);
    };

    // Masters for edit modal
    const [taskTypes, setTaskTypes] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [users, setUsers] = useState([]);
    const [workOrders, setWorkOrders] = useState([]);

    // Search and filters for edit modal
    const [showAssetSearch, setShowAssetSearch] = useState(false);
    const [assetSearchQuery, setAssetSearchQuery] = useState('');
    const [showAdvancedAssetFilters, setShowAdvancedAssetFilters] = useState(false);
    const [assetCategoryFilter, setAssetCategoryFilter] = useState('');
    const [assetLocationFilter, setAssetLocationFilter] = useState('');

    const [showPartSearch, setShowPartSearch] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [partCategoryFilter, setPartCategoryFilter] = useState('');
    const [partStockFilter, setPartStockFilter] = useState('all');
    const [partPriceMax, setPartPriceMax] = useState('');

    const [isDirty, setIsDirty] = useState(false);

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
            setError("No se pudo cargar la información del mantenimiento. El mantenimiento solicitado no existe o ha sido eliminado.");
        } finally {
            setLoading(false);
        }
    };

    const fetchEditMasters = async () => {
        try {
            const [usersRes, ttRes, invRes, woRes] = await Promise.all([
                api.get('/users/all').catch(() => ({ data: [] })),
                api.get('/maintenance/task-types').catch(() => ({ data: [] })),
                api.get('/inventory').catch(() => ({ data: [] })),
                api.get('/work-orders').catch(() => ({ data: [] }))
            ]);
            
            setUsers(usersRes.data);
            setTaskTypes(ttRes.data);
            setInventory(invRes.data);
            setWorkOrders(woRes.data);
        } catch (error) {
            console.error("Error loading edit masters:", error);
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

    const openEditScheduleModal = () => {
        if (!schedule) return;
        
        fetchEditMasters();
        
        let hora = '08', minutos = '00', periodo = 'AM';
        const rawDate = schedule.fecha; // "YYYY-MM-DD" or similar

        setScheduleForm({
            equipo_id: schedule.equipo_id || '',
            tipo_mantenimiento_id: schedule.tipo_mantenimiento_id || 1,
            fecha_programada: schedule.fecha || '',
            prioridad: schedule.prioridad?.toLowerCase() || 'media',
            responsable_id: schedule.responsable_id || '',
            responsable_interno_email: schedule.responsable_interno_email || '',
            asunto: schedule.asunto || '',
            id_ots: schedule.ots_vinculadas?.map(ot => ot.id) || [],
            estado: schedule.estado,
            costo_estimado: schedule.costo_estimado || 0,
            dias_anticipacion: schedule.dias_anticipacion || 3,
            tarea_tipo_id: schedule.tarea_tipo_id || '',
            recurrente: schedule.recurrente || false,
            frecuencia: schedule.frecuencia || 'Mensual',
            observaciones: schedule.observaciones || '',
            hora, minutos, periodo
        });
        setIsDirty(false);
        setShowScheduleModal(true);
    };

    const handleScheduleChange = (field, value) => {
        setScheduleForm(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleScheduleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        const sanitizedData = {
            ...scheduleForm,
            equipo_id: parseInt(scheduleForm.equipo_id),
            tipo_mantenimiento_id: parseInt(scheduleForm.tipo_mantenimiento_id),
            responsable_id: scheduleForm.responsable_id ? parseInt(scheduleForm.responsable_id) : null,
            tarea_tipo_id: scheduleForm.tarea_tipo_id ? parseInt(scheduleForm.tarea_tipo_id) : null,
            costo_estimado: parseFloat(scheduleForm.costo_estimado)
        };

        // Auto-include selected user's email in responsable_interno_email
        if (sanitizedData.responsable_id) {
            const selectedUser = users.find(u => u.id === sanitizedData.responsable_id);
            if (selectedUser && selectedUser.email) {
                let currentEmails = sanitizedData.responsable_interno_email || '';
                if (!currentEmails.includes(selectedUser.email)) {
                    sanitizedData.responsable_interno_email = currentEmails 
                        ? `${selectedUser.email}, ${currentEmails}` 
                        : selectedUser.email;
                }
            }
        }

        try {
            await api.put(`/maintenance/schedule/${id}`, sanitizedData);
            alert('Plan actualizado exitosamente');
            setShowScheduleModal(false);
            setIsDirty(false);
            fetchDetail();
        } catch (error) {
            console.error("Error updating schedule:", error);
            alert('Error al actualizar el plan');
        }
    };

    const handleAddPart = async (repuestoId, cantidad) => {
        try {
            await api.post(`/maintenance/schedule/${id}/parts`, {
                repuesto_id: repuestoId,
                cantidad: cantidad
            });
            fetchDetail();
        } catch (error) {
            alert("Error al añadir repuesto");
        }
    };

    const handleRemovePart = async (partId, repuestoId) => {
        try {
            await api.delete(`/maintenance/schedule/${id}/parts/${repuestoId}`);
            fetchDetail();
        } catch (error) {
            alert("Error al eliminar repuesto");
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

                        
                        {schedule.estado === 'programado' && canEdit && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => navigate('/work-orders', { state: { prefillFromMaintenance: schedule.id } })}
                                    className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Crear OT
                                </button>
                                <button 
                                    onClick={() => setShowExecuteModal(true)}
                                    className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" /> Ejecutar Mantenimiento
                                </button>
                            </div>
                        )}

                        {canEdit && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={openEditScheduleModal}
                                    className="p-3 bg-white dark:bg-[#1e293b] text-blue-500 hover:text-blue-600 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                                    title="Editar Mantenimiento"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="p-3 bg-white dark:bg-[#1e293b] text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                                    title="Eliminar Mantenimiento"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
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

                        {/* Linked Work Orders */}
                        {schedule.ots_vinculadas && schedule.ots_vinculadas.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Órdenes de Trabajo Asociadas</label>
                                {schedule.ots_vinculadas.map(ot => (
                                    <div key={ot.id} className="bg-white dark:bg-[#1e293b] rounded-3xl border border-purple-200 dark:border-purple-800 shadow-lg shadow-purple-500/5 p-6 flex items-center justify-between border-l-4 border-l-purple-500">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-2xl">
                                                <ClipboardList className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest block mb-0.5">OT-COD</label>
                                                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">{ot.codigo}</h4>
                                            </div>
                                        </div>
                                        <Link 
                                            to={`/work-orders/${ot.id}`} 
                                            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2"
                                        >
                                            Ver Detalles <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                ))}
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

            {/* Edit Maintenance Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSave={handleScheduleSubmit}
                isDirty={isDirty}
                title="Editar Plan de Mantenimiento"
            >
                <form onSubmit={handleScheduleSubmit} className="p-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asunto del Servicio / Título</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej: Mantenimiento Preventivo Trimestral"
                                value={scheduleForm.asunto}
                                onChange={(e) => handleScheduleChange('asunto', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                            />
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
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">RESPONSABLE INTERNO (EMAIL O USUARIO)</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <select
                                        value={scheduleForm.responsable_id || ''}
                                        onChange={(e) => handleScheduleChange('responsable_id', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="">Ninguno</option>
                                        {Array.isArray(users) && users.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="O escriba un email..."
                                        value={scheduleForm.responsable_interno_email || ''}
                                        onChange={(e) => handleScheduleChange('responsable_interno_email', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                Puede seleccionar un usuario y/o escribir uno o varios correos separados por coma.
                                <br />
                                <strong>Ejemplo:</strong> mantenimiento@hotel.com, supervisor@hotel.com
                            </p>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Vincular OTs Existentes</label>
                            <button
                                type="button"
                                onClick={() => setIsWOModalOpen(true)}
                                className="w-full flex items-center justify-between bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none hover:border-indigo-400 transition-all text-left"
                            >
                                <span className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-indigo-500" />
                                    {scheduleForm.id_ots?.length > 0 
                                        ? `${scheduleForm.id_ots.length} OTs vinculadas` 
                                        : "Seleccionar OTs..."}
                                </span>
                                <Plus className="w-4 h-4 text-slate-400" />
                            </button>
                            {scheduleForm.id_ots?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {scheduleForm.id_ots.map(id => {
                                        const wo = workOrders.find(w => w.id_ot === id);
                                        if (!wo) return null;
                                        return (
                                            <span key={id} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-800">
                                                {wo.codigo_ot || `OT-${id}`}
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleWO(id);
                                                    }}
                                                    className="hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
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
                                        if (!selectedPart || !qty) return;
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
                                                <th className="p-3 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {maintenanceParts.map(mp => (
                                                <tr key={mp.repuesto_id || mp.id}>
                                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{mp.nombre}</td>
                                                    <td className="p-3 text-center font-bold">{mp.cantidad_estimada}</td>
                                                    <td className="p-3 text-right">
                                                        <button type="button" onClick={() => handleRemovePart(mp.id, mp.repuesto_id)} className="text-red-500 hover:text-red-600">
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
                </form>
            </Modal>

            {/* Asset Search Modal */}
            {showAssetSearch && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Search className="w-5 h-5 text-blue-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar equipo..."
                                value={assetSearchQuery}
                                onChange={(e) => setAssetSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-base font-bold outline-none placeholder:text-slate-400 dark:text-white"
                            />
                            <button onClick={() => setShowAssetSearch(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-1">
                            {assets.filter(a => (a.nombre || '').toLowerCase().includes(assetSearchQuery.toLowerCase())).map(a => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all"
                                    onClick={() => {
                                        setScheduleForm({ ...scheduleForm, equipo_id: a.id });
                                        setShowAssetSearch(false);
                                    }}
                                >
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{a.nombre}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">{a.codigo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Part Search Modal */}
            {showPartSearch && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar repuesto..."
                                value={partSearchQuery}
                                onChange={(e) => setPartSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-lg font-bold outline-none dark:text-white"
                            />
                            <button onClick={() => setShowPartSearch(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-2">
                            {inventory.filter(p => (p.nombre || '').toLowerCase().includes(partSearchQuery.toLowerCase())).map(p => (
                                <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 cursor-pointer transition-all"
                                    onClick={() => {
                                        setSelectedPart(p);
                                        setShowPartSearch(false);
                                    }}
                                >
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{p.nombre}</p>
                                        <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <WorkOrderSelectorModal 
                isOpen={isWOModalOpen}
                onClose={() => setIsWOModalOpen(false)}
                workOrders={workOrders.filter(wo => !scheduleForm.equipo_id || wo.id_activo === parseInt(scheduleForm.equipo_id))}
                selectedIds={scheduleForm.id_ots || []}
                onToggle={handleToggleWO}
                onConfirm={() => setIsWOModalOpen(false)}
            />
        </div>
    );
};

export default MaintenanceDetailPage;
