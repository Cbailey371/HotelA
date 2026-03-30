import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workOrderService } from '../services/workOrderService';
import { locationService } from '../services/locationService';
import { 
    Plus, 
    ClipboardList, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Camera, 
    MapPin, 
    MessageSquare,
    ChevronRight,
    Loader2,
    Search,
    Filter,
    X,
    Building,
    CheckCircle,
    Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetService } from '../services/assetService';

const RequestPortal = () => {
    const { user } = useAuth();
    const [myOrders, setMyOrders] = useState([]);
    const [locations, setLocations] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    
    // Asset Search States
    const [showAssetSearch, setShowAssetSearch] = useState(false);
    const [assetSearchQuery, setAssetSearchQuery] = useState('');
    
    // Location Search States
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        asunto: '',
        id_ubicacion: '',
        prioridad: 'Media',
        observaciones: '',
        foto_dano: '',
        tipo_ot: 'general',
        id_tipo_mantenimiento: 1, // Default General
        id_activo: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orders, locs, asts] = await Promise.all([
                workOrderService.getAll(),
                locationService.getAll(),
                assetService.getAll()
            ]);
            setMyOrders(orders);
            setLocations(locs);
            setAssets(asts);
        } catch (error) {
            console.error("Error fetching portal data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

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
            setFormData(prev => ({ ...prev, foto_dano: data.url }));
        } catch (error) {
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await workOrderService.create({
                ...formData,
                id_ubicacion: formData.id_ubicacion ? parseInt(formData.id_ubicacion) : null,
                id_activo: formData.id_activo ? parseInt(formData.id_activo) : null,
                id_tipo_mantenimiento: parseInt(formData.id_tipo_mantenimiento)
            });
            setShowNewModal(false);
            setFormData({
                asunto: '',
                id_ubicacion: '',
                prioridad: 'Media',
                observaciones: '',
                foto_dano: '',
                tipo_ot: 'general',
                id_tipo_mantenimiento: 1,
                id_activo: null
            });
            fetchData();
        } catch (error) {
            alert("Error al crear la solicitud");
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'abierta': 
            case 'pendiente': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'en proceso': 
            case 'en_proceso': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            case 'cerrada':
            case 'finalizado': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'cancelada': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
                        ¡Hola, {user?.nombre}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md font-medium opacity-90">
                        Bienvenido al portal de mantenimiento. ¿Tienes algún problema que reportar hoy?
                    </p>
                    
                    <button 
                        onClick={() => setShowNewModal(true)}
                        className="mt-8 bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 hover:shadow-xl active:scale-95 group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        Reportar Nuevo Daño
                    </button>
                </div>
                
                {/* Decorative circles */}
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-500" />
                            Mis Solicitudes Recientes
                        </h2>
                        
                        <div className="flex flex-1 max-w-md gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar solicitudes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="abierta">Abierta</option>
                                <option value="en_proceso">En Proceso</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-500 font-bold">Cargando solicitudes...</p>
                        </div>
                    ) : myOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                             <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Sin solicitudes</h3>
                            <p className="text-sm text-slate-500 mt-1">No hay reportes que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {myOrders
                                .filter(order => {
                                    const matchesSearch = (order.asunto || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                        (order.codigo_ot || '').toLowerCase().includes(searchTerm.toLowerCase());
                                    
                                    // Primary filter: Only show active orders in the portal (non-closed/non-cancelled)
                                    // unless a specific status is filtered (which currently only allows active ones anyway)
                                    const isClosed = order.estado === 'cerrada' || order.estado === 'cancelada' || order.estado === 'finalizado';
                                    if (isClosed && filterStatus === 'all') return false;

                                    const matchesStatus = filterStatus === 'all' || order.estado === filterStatus;
                                    return matchesSearch && matchesStatus;
                                })
                                .map((order) => (
                                <Link 
                                    key={order.id_ot} 
                                    to={`/work-orders/${order.id_ot}`}
                                    className="group bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusStyle(order.estado)}`}>
                                        {order.estado?.toLowerCase() === 'finalizado' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.codigo_ot}</span>
                                            <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-tighter ${getStatusStyle(order.estado)}`}>
                                                {order.estado}
                                            </span>
                                            {order.prioridad === 'Crítica' && (
                                                <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Urgente</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate group-hover:text-blue-600 transition-colors">
                                            {order.asunto || 'Sin Asunto'}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                                <MapPin className="w-3 h-3 text-blue-500" />
                                                {order.nombre_ubicacion || 'General'}
                                            </p>
                                            {order.nombre_tipo_mantenimiento && (
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-widest">
                                                    <Wrench className="w-3 h-3" />
                                                    {order.nombre_tipo_mantenimiento}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Info/Tips */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            ¿Cómo reportar correctamente?
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { title: 'Sé específico', desc: 'Indica exactamente qué no funciona.' },
                                { title: 'Ubicación exacta', desc: 'Asegúrate de marcar el cuarto o área correcta.' },
                                { title: 'Usa fotos', desc: 'Una imagen ayuda al técnico a traer las herramientas adecuadas.' }
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{tip.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{tip.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-900 dark:bg-blue-600 p-6 rounded-3xl text-white">
                        <h3 className="font-bold mb-2">Soporte Técnico</h3>
                        <p className="text-sm text-slate-400 dark:text-blue-100">Si el daño es una emergencia crítica, por favor comunícate directamente con la extensión 100.</p>
                    </div>
                </div>
            </div>
            {/* New Request Modal */}
            {showNewModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-500" />
                                Nueva Solicitud
                            </h2>
                            <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">¿Qué sucede? (Asunto)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.asunto}
                                    onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                                    placeholder="Ej: Fuga de agua en el baño, Aire no enfría..."
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tipo de Problema</label>
                                    <select 
                                        required
                                        value={formData.id_tipo_mantenimiento}
                                        onChange={(e) => setFormData({...formData, id_tipo_mantenimiento: e.target.value})}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-800 dark:text-white"
                                    >
                                        <option value="1">Mantenimiento General</option>
                                        <option value="3">Reparación / Correctivo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Prioridad</label>
                                    <select 
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-800 dark:text-white"
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Crítica">Crítica</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ubicación / Área</label>
                                <div className="relative">
                                    <div className="relative group">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Buscar ubicación..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 pl-11 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer text-slate-800 dark:text-white"
                                            value={showLocationDropdown ? locationSearchQuery : (locations.find(l => l.id == formData.id_ubicacion)?.nombre || '')}
                                            onChange={(e) => {
                                                setLocationSearchQuery(e.target.value);
                                                setShowLocationDropdown(true);
                                            }}
                                            onFocus={() => {
                                                setShowLocationDropdown(true);
                                            }}
                                            required
                                        />
                                        {formData.id_ubicacion && !showLocationDropdown && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, id_ubicacion: '' });
                                                    setLocationSearchQuery('');
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {showLocationDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowLocationDropdown(false)}></div>
                                            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200 custom-scrollbar">
                                                {locations
                                                    .filter(loc => loc.nombre.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                                                    .length === 0 ? (
                                                    <div className="p-4 text-center text-slate-400 text-xs font-bold">No se encontraron ubicaciones</div>
                                                ) : (
                                                    locations
                                                        .filter(loc => loc.nombre.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                                                        .map(loc => (
                                                            <div
                                                                key={loc.id}
                                                                className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0 group"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, id_ubicacion: loc.id });
                                                                    setShowLocationDropdown(false);
                                                                    setLocationSearchQuery('');
                                                                }}
                                                            >
                                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{loc.nombre}</span>
                                                                {formData.id_ubicacion == loc.id && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Equipo / Activo <span className="lowercase font-normal italic">(Opcional)</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        readOnly
                                        type="text"
                                        placeholder="Clic para asociar un equipo..."
                                        value={formData.id_activo ? (assets.find(a => (a.id == formData.id_activo || a.id_equipo == formData.id_activo))?.nombre_equipo || assets.find(a => (a.id == formData.id_activo || a.id_equipo == formData.id_activo))?.nombre || '') : ''}
                                        onClick={() => {
                                            setAssetSearchQuery('');
                                            setShowAssetSearch(true);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 rounded-2xl p-3 pl-11 text-sm font-bold outline-none cursor-pointer transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 italic"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors pointer-events-none" />
                                    {formData.id_activo && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData({ ...formData, id_activo: null });
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Detalles Adicionales</label>
                                <textarea 
                                    rows="3"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                    placeholder="Explica brevemente qué necesitas..."
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-800 dark:text-white resize-none"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Foto de la Evidencia</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-2xl hover:border-blue-500 transition-colors group cursor-pointer relative overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
                                    {formData.foto_dano ? (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                                            <img src={formData.foto_dano} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-xs font-bold">Cambiar imagen</p>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-center">
                                            {uploading ? (
                                                <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                                            ) : (
                                                <Camera className="mx-auto h-12 w-12 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            )}
                                            <div className="flex text-sm text-slate-500">
                                                <span>Subir una foto (Opcional)</span>
                                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Formatos: JPG, PNG</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 active:scale-95"
                                >
                                    Enviar Reporte
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Asset Search Modal */}
            {showAssetSearch && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <Search className="w-5 h-5 text-blue-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar equipo..."
                                value={assetSearchQuery}
                                onChange={(e) => setAssetSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400 dark:text-white"
                            />
                            <button onClick={() => setShowAssetSearch(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-2 space-y-1 custom-scrollbar">
                            {assets.filter(a => 
                                (a.nombre_equipo || a.nombre || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                (a.codigo_equipo || a.codigo || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                (a.codigo_administrativo || '').toLowerCase().includes(assetSearchQuery.toLowerCase())
                            ).length === 0 ? (
                                <div className="py-10 text-center text-slate-400 text-xs font-bold">No se encontraron equipos</div>
                            ) : (
                                assets.filter(a => 
                                    (a.nombre_equipo || a.nombre || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                    (a.codigo_equipo || a.codigo || '').toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                                    (a.codigo_administrativo || '').toLowerCase().includes(assetSearchQuery.toLowerCase())
                                ).map(a => (
                                    <div
                                        key={a.id}
                                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group transition-all"
                                        onClick={() => {
                                            setFormData({ ...formData, id_activo: a.id });
                                            setShowAssetSearch(false);
                                        }}
                                    >
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            {a.imagen_url ? (
                                                <img src={a.imagen_url} alt={a.nombre_equipo} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Building className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{a.nombre_equipo || a.nombre}</p>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{a.codigo_equipo || a.codigo || a.codigo_administrativo || 'S/N'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestPortal;
