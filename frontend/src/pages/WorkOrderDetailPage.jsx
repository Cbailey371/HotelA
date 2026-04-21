import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowLeft, Calendar, Clock, CheckCircle, AlertTriangle, User, 
    Settings, Printer, FileText, Building, ClipboardList, Info, 
    Trash2, Edit, X, Mail, Upload, Loader2, MessageSquare, 
    Maximize2, ExternalLink, MapPin, Tag
} from 'lucide-react';
import { workOrderService } from '../services/workOrderService';
import { assetService } from '../services/assetService';
import { technicianService } from '../services/technicianService';
import { providerService } from '../services/providerService';
import { locationService } from '../services/locationService';
import api from '../services/api';
import Modal from '../components/Modal';
import MaintenanceSelectorModal from '../components/MaintenanceSelectorModal';

const WorkOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [assets, setAssets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [providers, setProviders] = useState([]);
    const [locations, setLocations] = useState([]);
    const [comments, setComments] = useState([]);
    const canEdit = !['SOLICITANTE', 'LIMPIEZA', 'RECEPCION'].includes(user?.role?.toUpperCase());
    const canUploadPhoto = canEdit || ['RECEPCION', 'LIMPIEZA'].includes(user?.role?.toUpperCase());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [finalComment, setFinalComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showMaintenanceSelector, setShowMaintenanceSelector] = useState(false);
    const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState([]);
    const [pendingSchedules, setPendingSchedules] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        if (id) {
            fetchOrderDetail();
            fetchPendingSchedules();
        }
    }, [id]);

    const fetchPendingSchedules = async () => {
        try {
            setRefreshing(true);
            const res = await api.get('/maintenance/pending-schedules');
            setPendingSchedules(res.data);
        } catch (error) {
            console.error("Error fetching pending schedules", error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchOrderDetail = async () => {
        try {
            setLoading(true);
            const [orderData, assetsData, techsData, provsData, locationsData, commentsData, termsData] = await Promise.all([
                workOrderService.getById(id),
                assetService.getAll().catch(() => []),
                technicianService.getAll().catch(() => []),
                providerService.getAll().catch(() => []),
                locationService.getAll().catch(() => []),
                api.get(`/work-orders/${id}/comments`).then(res => res.data).catch(() => []),
                api.get('/settings/payment-terms').then(res => res.data).catch(() => [])
            ]);
            
            setOrder(orderData);
            setAssets(assetsData);
            setTechnicians(techsData);
            setProviders(provsData);
            setLocations(locationsData);
            setComments(commentsData);
            setPaymentTerms(termsData);
        } catch (err) {
            console.error("Error fetching order detail:", err);
            setError("No se pudo cargar la información de la orden de trabajo.");
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (text) => {
        if (!text.trim()) return;
        try {
            await api.post(`/work-orders/${id}/comments`, { comentario: text });
            const res = await api.get(`/work-orders/${id}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error("Error posting comment", error);
        }
    };

    const handleSaveClose = async () => {
        if (!finalComment.trim()) {
            alert("Por favor ingrese un motivo o comentario final para cerrar la orden.");
            return;
        }
        try {
            setIsSaving(true);
            // Si el usuario no es admin/técnico (canEdit = false), el estado es 'cancelada'
            const targetStatus = canEdit ? 'cerrada' : 'cancelada';
            await workOrderService.closeOrder(id, finalComment, targetStatus);
            setShowCloseModal(false);
            setFinalComment('');
            fetchOrderDetail();
            alert(`Orden de trabajo ${targetStatus === 'cerrada' ? 'cerrada' : 'cancelada'} exitosamente`);
        } catch (error) {
            console.error("Error closing order", error);
            alert("Error al cerrar la orden de trabajo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten imágenes');
            return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            setUploading(true);
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataUpload
            });

            if (!response.ok) throw new Error('Error al subir imagen');
            const data = await response.json();
            
            // Allow multiple photos by comma-separating them
            const currentPhotos = order.foto_dano ? order.foto_dano.split(',').filter(p => p.trim() !== '') : [];
            const newPhotos = [...currentPhotos, data.url].join(',');
            
            await workOrderService.update(id, { 
                ...order, 
                foto_dano: newPhotos,
                // Ensure numeric fields are correctly typed
                id_activo: order.id_activo ? parseInt(order.id_activo) : null,
                id_tecnico: order.id_tecnico ? parseInt(order.id_tecnico) : null,
                id_proveedor: order.id_proveedor ? parseInt(order.id_proveedor) : null,
                id_ubicacion: order.id_ubicacion ? parseInt(order.id_ubicacion) : null,
                id_tipo_mantenimiento: order.id_tipo_mantenimiento ? parseInt(order.id_tipo_mantenimiento) : null,
                costo_estimado: order.costo_estimado ? parseFloat(order.costo_estimado) : null
            });
            
            fetchOrderDetail();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenEditModal = () => {
        setEditFormData({
            asunto: order.asunto || '',
            prioridad: order.prioridad || 'media',
            id_tecnico: order.id_tecnico || '',
            id_proveedor: order.id_proveedor || '',
            id_activo: order.id_activo || '',
            costo_estimado: order.costo_estimado || 0,
            terminos_pago: order.terminos_pago || '',
            observaciones: order.observaciones || '',
            id_calendarios: order.id_calendarios || []
        });
        setSelectedMaintenanceIds(order.id_calendarios || []);
        setShowEditModal(true);
    };

    const toggleMaintenanceSelection = (id) => {
        setSelectedMaintenanceIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirmMaintenanceSelection = () => {
        setEditFormData(prev => ({
            ...prev,
            id_calendarios: selectedMaintenanceIds
        }));
        setShowMaintenanceSelector(false);
    };

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true);
            await workOrderService.update(id, {
                ...order,
                ...editFormData,
                id_tecnico: editFormData.id_tecnico ? parseInt(editFormData.id_tecnico) : null,
                id_proveedor: editFormData.id_proveedor ? parseInt(editFormData.id_proveedor) : null,
                costo_estimado: parseFloat(editFormData.costo_estimado) || 0,
                id_calendarios: editFormData.id_calendarios || []
            });
            setShowEditModal(false);
            fetchOrderDetail();
        } catch (error) {
            console.error("Error updating order", error);
            alert("Error al actualizar la orden de trabajo");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0f172a]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Cargando detalles de OT...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-8">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate('/work-orders')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 transition-colors mb-6 font-bold uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="w-4 h-4" /> Volver a la lista
                    </button>
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{error || "Orden de trabajo no encontrada"}</h2>
                        <p className="text-slate-500 dark:text-slate-400">Es posible que la orden haya sido eliminada o no tenga permisos para verla.</p>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'cerrada': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
            case 'en_proceso': return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
            case 'pendiente': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
            default: return 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critica': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
            case 'alta': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
            case 'media': return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
            default: return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-[#0f172a] p-4 lg:p-8">
            <style>
                {`
                @media print {
                    .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                    .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .bg-slate-50\\/50, .dark\\:bg-\\[\\#0f172a\\] { background: white !important; }
                    .shadow-sm, .shadow-lg { box-shadow: none !important; }
                    .rounded-3xl, .rounded-2xl { border-radius: 12px !important; }
                    .border { border: 1px solid #e2e8f0 !important; }
                    .bg-white, .dark\\:bg-\\[\\#1e293b\\] { background: white !important; }
                    h1, h2, p, span, label { color: black !important; }
                    .bg-indigo-50, .dark\\:bg-indigo-900\\/30 { background: #f0f7ff !important; }
                    .text-indigo-500, .text-slate-500 { color: #4338ca !important; }
                }
                `}
            </style>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header/Nav */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/work-orders')} 
                            className="p-3 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 hover:border-indigo-500/50 transition-all shadow-sm group print:hidden"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${getStatusColor(order.estado)}`}>
                                    {order.estado?.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${getPriorityColor(order.prioridad)}`}>
                                    Prioridad {order.prioridad}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                OT: {order.codigo_ot}
                                <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>
                                <span className="text-indigo-500">{order.tipo_ot?.toUpperCase()}</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 print:hidden">
                        <button 
                            onClick={() => window.print()}
                            className="flex-1 sm:flex-none bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:text-indigo-500 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Imprimir
                        </button>
                        
                        {order.estado !== 'cerrada' && (canEdit || !canEdit) && (
                            <button 
                                onClick={() => setShowCloseModal(true)}
                                className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> {!canEdit ? 'Cancelar / Cerrar Solicitud' : 'Finalizar OT'}
                            </button>
                        )}
                        
                        {canEdit && (
                            <button 
                                onClick={handleOpenEditModal}
                                className="p-3 bg-white dark:bg-[#1e293b] text-slate-400 hover:text-indigo-500 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                            >
                                <Edit className="w-5 h-5" />
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Información General</label>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-4">{order.asunto || "Sin Asunto"}</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    {order.observaciones || <span className="italic text-slate-400">Sin observaciones adicionales.</span>}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha Creación</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        {new Date(order.fecha_creacion).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Técnico</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <User className="w-4 h-4 text-indigo-500" />
                                        {technicians.find(t => t.id == order.id_tecnico)?.nombre || "No asignado"}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Costo Estimado</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                        ${order.costo_estimado || '0.00'}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ubicación / Área</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-indigo-500" />
                                        {locations.find(l => l.id == order.id_ubicacion)?.nombre || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Asset Information */}
                        {order.id_activo && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row">
                                <div className="w-full md:w-64 aspect-square md:aspect-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                                    {assets.find(a => a.id == order.id_activo)?.imagen_url ? (
                                        <img src={assets.find(a => a.id == order.id_activo).imagen_url} className="w-full h-full object-cover" alt="Equipo" />
                                    ) : (
                                        <Settings className="w-16 h-16 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 p-8">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Equipo / Activo Vinculado</label>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                                            {assets.find(a => a.id == order.id_activo)?.nombre_equipo || "Activo Desconocido"}
                                        </h3>
                                        {user?.permisos?.includes('assets_view') ? (
                                            <Link to={`/assets/${order.id_activo}`} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-all" title="Ver detalle del activo">
                                                <ExternalLink className="w-5 h-5" />
                                            </Link>
                                        ) : (
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-xl cursor-not-allowed" title="No tiene permisos para ver detalles del activo">
                                                <X className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Código</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{assets.find(a => a.id == order.id_activo)?.codigo_administrativo || assets.find(a => a.id == order.id_activo)?.codigo_equipo || 'S/N'}</span>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoría</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{assets.find(a => a.id == order.id_activo)?.categoria || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mantenimientos Vinculados (Multi-Plan) */}
                        {order.id_calendarios && order.id_calendarios.length > 0 && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Planes de Mantenimiento Vinculados</label>
                                <div className="space-y-3">
                                    {(order.mantenimientos_vinc_detalles || []).map((m, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a]/50 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl">
                                                    <ClipboardList className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em] block mb-0.5">Mantenimiento {m.tipo || 'Programado'}</span>
                                                    <h4 className="font-bold text-slate-800 dark:text-white">
                                                        {m.equipo || 'Activo'} {m.asunto ? `- ${m.asunto}` : `- ${m.tipo || 'Preventivo'}`}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" /> {m.fecha || 'Sin fecha'}
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{m.codigo || `MANT-${m.id || idx}`}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link 
                                                to={`/maintenance/${m.id}`} 
                                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                title="Ver Detalle de Mantenimiento"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evidence Photos */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Evidencia del Daño / Fotos</label>
                                    {!order.foto_dano && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No hay fotos cargadas</span>}
                                </div>
                                {canUploadPhoto && (
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {uploading ? 'Subiendo...' : 'Añadir Foto'}
                                    </button>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileUpload} 
                                />
                            </div>
                            
                            {order.foto_dano ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {order.foto_dano.split(',').filter(p => p.trim() !== '').map((photo, index) => (
                                        <div key={index} className="relative group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                            <img 
                                                src={photo} 
                                                alt={`Evidencia ${index + 1}`} 
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" 
                                                onClick={() => window.open(photo, '_blank')}
                                            />
                                            <div className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-3xl p-12 text-center opacity-40">
                                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="font-bold text-slate-400">Sin archivo de imagen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Timeline & Comments */}
                    <div className="space-y-8">
                        
                        {/* Status timeline */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-6">Historial de Actualizaciones</label>
                            
                            <div className="relative pl-6 space-y-8 pb-4">
                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                                
                                {/* Final Resolution if exists */}
                                {order.comentario_final && (
                                    <div className="relative">
                                        <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-[#1e293b] shadow-sm z-10"></div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Resolución Final</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-emerald-100 italic leading-relaxed">
                                                "{order.comentario_final}"
                                            </p>
                                            <div className="mt-3 text-[9px] font-black text-emerald-600/50 uppercase">Finalizada el {new Date(order.fecha_cierre).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Comments list */}
                                {comments.map((c, i) => (
                                    <div key={c.id_comentario} className="relative">
                                        <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white dark:border-[#1e293b] shadow-sm"></div>
                                        <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.nombre_usuario}</span>
                                                <span className="text-[9px] font-bold text-indigo-500">{new Date(c.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {c.comentario}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Initial creation */}
                                <div className="relative">
                                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-slate-300 border-4 border-white dark:border-[#1e293b] shadow-sm"></div>
                                    <div className="p-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Creada la Orden</span>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(order.fecha_creacion).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Comment Input */}
                            {order.estado !== 'cerrada' && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col gap-3">
                                        <textarea 
                                            id="comment-input"
                                            rows="3"
                                            placeholder="Añadir una nota o actualización..."
                                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                        ></textarea>
                                        <button 
                                            onClick={() => {
                                                const input = document.getElementById('comment-input');
                                                handlePostComment(input.value);
                                                input.value = '';
                                            }}
                                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Enviar Comentario
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Info Cards */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Empresa / Proveedor</label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <Building className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {providers.find(p => p.id == order.id_proveedor)?.nombre || "Atención Interna"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Términos de Pago</label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <Tag className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{order.terminos_pago || "No especificado"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Cierre */}
            <Modal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onSave={handleSaveClose}
                title={!canEdit ? "Cancelar / Cerrar Solicitud" : "Finalizar Orden de Trabajo"}
                saveText={!canEdit ? "Confirmar Cancelación" : "Confirmar Cierre"}
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                {!canEdit ? "Confirmación de Cancelación" : "Confirmación de Cierre"}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                {!canEdit 
                                    ? "Para cancelar esta solicitud por error u otro motivo, debe ingresar una explicación obligatoria." 
                                    : "Para cerrar esta orden de forma definitiva, debe ingresar un resumen de los trabajos realizados."}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                            {!canEdit ? "Motivo de Cancelación / Cierre" : "Comentario Final / Resolución"}
                        </label>
                        <textarea
                            required
                            autoFocus
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none min-h-[120px]"
                            value={finalComment}
                            onChange={(e) => setFinalComment(e.target.value)}
                            placeholder={!canEdit 
                                ? "Explique por qué se cierra o cancela el caso por error..." 
                                : "Describa la solución técnica, repuestos utilizados o cualquier detalle relevante del cierre..."}
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Orden de Trabajo"
                zIndex={50}
            >
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Asunto</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={editFormData.asunto}
                                onChange={(e) => setEditFormData({...editFormData, asunto: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prioridad</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
                                    value={editFormData.prioridad}
                                    onChange={(e) => setEditFormData({...editFormData, prioridad: e.target.value})}
                                >
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                    <option value="critica">Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Técnico Asignado</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
                                    value={editFormData.id_tecnico}
                                    onChange={(e) => setEditFormData({...editFormData, id_tecnico: e.target.value})}
                                >
                                    <option value="">No asignado</option>
                                    {technicians.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Proveedor</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
                                    value={editFormData.id_proveedor}
                                    onChange={(e) => setEditFormData({...editFormData, id_proveedor: e.target.value})}
                                >
                                    <option value="">Interno / Ninguno</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Costo Estimado</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                                    value={editFormData.costo_estimado}
                                    onChange={(e) => setEditFormData({...editFormData, costo_estimado: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Términos de Pago</label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
                                value={editFormData.terminos_pago}
                                onChange={(e) => setEditFormData({...editFormData, terminos_pago: e.target.value})}
                            >
                                <option value="">Seleccionar...</option>
                                {paymentTerms.map(pt => (
                                    <option key={pt.id} value={pt.nombre}>{pt.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mantenimiento Vinculado</label>
                            {user?.permisos?.includes('work_orders_link_maintenance') && (
                                <button
                                    type="button"
                                    onClick={() => setShowMaintenanceSelector(true)}
                                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all mb-3
                                        ${editFormData.id_calendarios && editFormData.id_calendarios.length > 0 
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] text-slate-500 hover:border-indigo-500/50 hover:text-indigo-500'}`}
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    {editFormData.id_calendarios && editFormData.id_calendarios.length > 0 
                                        ? `${editFormData.id_calendarios.length} Planes Vinculados (Añadir más)` 
                                        : "Cargar Mantenimiento"}
                                </button>
                            )}
                            {editFormData.id_calendarios && editFormData.id_calendarios.length > 0 && (
                                <div className="space-y-1.5">
                                    {editFormData.id_calendarios.map(id => {
                                        const plan = pendingSchedules.find(s => s.id === id);
                                        return (
                                            <div key={id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#0f172a] rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                <span>{plan ? `${plan.codigo || `MANT-${id}`} - ${plan.equipo}` : `ID: ${id}`}</span>
                                                <button 
                                                    onClick={() => toggleMaintenanceSelection(id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Observaciones / Detalles</label>
                            <textarea 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none min-h-[100px]"
                                value={editFormData.observaciones}
                                onChange={(e) => setEditFormData({...editFormData, observaciones: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Maintenance Selector Modal */}
            <MaintenanceSelectorModal
                isOpen={showMaintenanceSelector}
                onClose={() => setShowMaintenanceSelector(false)}
                pendingSchedules={pendingSchedules}
                selectedIds={selectedMaintenanceIds}
                onToggle={toggleMaintenanceSelection}
                onConfirm={handleConfirmMaintenanceSelection}
                refreshing={refreshing}
            />
        </div>
    );
};

export default WorkOrderDetailPage;
