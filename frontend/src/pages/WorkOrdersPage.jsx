import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workOrderService } from '../services/workOrderService';
import { assetService } from '../services/assetService';
import { technicianService } from '../services/technicianService';
import { providerService } from '../services/providerService';
import {
    Plus, Filter, Clock, CheckCircle, AlertTriangle, User, Calendar,
    Settings, Printer, Search, MoreVertical, FileText, Briefcase,
    Building, ClipboardList, Info, Trash2, Edit, Link2Off, X, Mail,
    Upload, Loader2, Camera
} from 'lucide-react';
import Modal from '../components/Modal';
import { locationService } from '../services/locationService';
import { pdfGenerator } from '../utils/pdfGenerator';
import api from '../services/api';
import MaintenanceSelectorModal from '../components/MaintenanceSelectorModal';

const WorkOrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    // Data State
    const [orders, setOrders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [providers, setProviders] = useState([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState([]);
    const [pendingSchedules, setPendingSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMaintenanceSelector, setShowMaintenanceSelector] = useState(false);
    const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState([]); // New state for multi-select
    const [editingOrder, setEditingOrder] = useState(null);
    const [locations, setLocations] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    // Email Modal State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);
    const [targetEmail, setTargetEmail] = useState('');
    const [sendingEmail, setSendingEmail] = useState(null);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [finalComment, setFinalComment] = useState('');
    const [selectedOrderIdForComments, setSelectedOrderIdForComments] = useState(null);
    const [pendingStatus, setPendingStatus] = useState('');

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    // Asset Search States
    const [showAssetSearch, setShowAssetSearch] = useState(false);
    const [assetSearchQuery, setAssetSearchQuery] = useState('');
    const [assetCategoryFilter, setAssetCategoryFilter] = useState('');
    const [assetLocationFilter, setAssetLocationFilter] = useState('');
    const [showAdvancedAssetFilters, setShowAdvancedAssetFilters] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        codigo_ot: '',
        id_activo: '',
        id_tipo_mantenimiento: '',
        id_calendario: null,
        id_calendarios: [], // New field for multiple
        id_tecnico: '',
        id_proveedor: '',
        prioridad: 'media',
        tipo_ot: 'preventiva', // Default
        id_ubicacion: '',
        asunto: '',
        observaciones: '',
        costo_estimado: '',
        terminos_pago: '',
        foto_dano: null,
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            const [ordersData, assetsData, techsData, provsData, schedulesRes, mTypesRes, paymentTermsRes, locationsData] = await Promise.all([
                workOrderService.getAll(),
                assetService.getAll(),
                technicianService.getAll(),
                providerService.getAll(),
                api.get('/maintenance/pending-schedules'),
                api.get('/maintenance/types'),
                api.get('/settings/payment-terms'),
                locationService.getAll()
            ]);

            setOrders(ordersData.sort((a, b) => a.id_ot - b.id_ot));
            setAssets(assetsData);
            setTechnicians(techsData);
            setProviders(provsData);
            setMaintenanceTypes(mTypesRes.data);
            setPendingSchedules(schedulesRes.data);
            setLocations(locationsData);
            setPaymentTerms(paymentTermsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    const toggleMaintenanceSelection = (id) => {
        setSelectedMaintenanceIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleConfirmMaintenanceSelection = () => {
        if (selectedMaintenanceIds.length === 0) return;

        const selectedItems = pendingSchedules.filter(s => selectedMaintenanceIds.includes(s.id));
        const primary = selectedItems[0]; // Use first as primary for asset/type

        setFormData({
            ...formData,
            id_calendario: selectedItems.length === 1 ? primary.id : null,
            id_calendarios: selectedMaintenanceIds,
            id_activo: primary.equipo_id,
            id_tipo_mantenimiento: primary.tipo_mantenimiento_id,
            id_tecnico: primary.tecnico_id || '',
            id_proveedor: primary.proveedor_id || '',
            prioridad: primary.prioridad || 'media',
            observaciones: selectedItems.length === 1
                ? (primary.codigo ? `Plan de Mantenimiento: ${primary.codigo}` : `Plan de Mantenimiento ID: ${primary.id}`)
                : `Orden de Trabajo Múltiple (${selectedItems.length} mantenimientos vinculados).\nItems: ${selectedItems.map(s => s.codigo || s.id).join(', ')}`,
            costo_estimado: primary.costo_estimado || '',
            terminos_pago: primary.terminos_pago || ''
        });
        setIsDirty(true);
        setShowMaintenanceSelector(false);
    };

    const handleLoadFromMaintenance = (schedule) => {
        // Legacy single select support (if clicking row directly)
        toggleMaintenanceSelection(schedule.id);
    };

    const handleUnlink = async (order) => {
        if (!window.confirm("¿Seguro que deseas desvincular esta orden del plan de mantenimiento? Se convertirá en una orden correctiva independiente.")) return;

        try {
            await workOrderService.update(order.id_ot, {
                ...order,
                id_calendario: null,
                id_calendarios: []
            });
            fetchData();
        } catch (error) {
            alert("No se pudo desvincular la orden.");
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
            setFormData(prev => ({ ...prev, foto_dano: data.url }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        try {
            if (editingOrder) {
                await workOrderService.update(editingOrder.id_ot, {
                    ...formData,
                    id_activo: parseInt(formData.id_activo),
                    id_tipo_mantenimiento: parseInt(formData.id_tipo_mantenimiento),
                    id_tecnico: formData.id_tecnico ? parseInt(formData.id_tecnico) : null,
                    id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
                    costo_estimado: formData.costo_estimado !== '' ? parseFloat(formData.costo_estimado) : null,
                    foto_dano: formData.foto_dano
                });
            } else {
                await workOrderService.create({
                    ...formData,
                    id_activo: formData.tipo_ot === 'activo' ? parseInt(formData.id_activo) : null,
                    id_ubicacion: formData.tipo_ot === 'general' ? parseInt(formData.id_ubicacion) : null,
                    id_tipo_mantenimiento: parseInt(formData.id_tipo_mantenimiento),
                    id_tecnico: formData.id_tecnico ? parseInt(formData.id_tecnico) : null,
                    id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
                    id_calendario: formData.id_calendario,
                    id_calendarios: formData.id_calendarios,
                    prioridad: formData.prioridad,
                    observaciones: formData.observaciones,
                    asunto: formData.asunto,
                    tipo_ot: formData.tipo_ot,
                    costo_estimado: formData.costo_estimado !== '' ? parseFloat(formData.costo_estimado) : null,
                    foto_dano: formData.foto_dano
                });
            }
            setShowModal(false);
            setEditingOrder(null);
            setIsDirty(false);
            fetchData(true); // Silent refresh
        } catch (error) {
        }
    };

    const handleEdit = (order) => {
        setEditingOrder(order);

        // Hydrate multi-select state
        const linkedIds = order.mantenimientos ? order.mantenimientos.map(m => m.id) : [];
        if (order.id_calendario && !linkedIds.includes(order.id_calendario)) {
            linkedIds.push(order.id_calendario);
            // If legacy single ID is present but not in maintenances list, we might want to fetch it or just rely on existing list. 
            // But usually id_calendario is one of the maintenances if migrated correctly.
        }

        // Inject linked maintenances into pendingSchedules so they appear in the modal
        if (order.mantenimientos && order.mantenimientos.length > 0) {
            setPendingSchedules(prev => {
                const newSchedules = [...prev];
                order.mantenimientos.forEach(m => {
                    if (!newSchedules.find(s => s.id === m.id)) {
                        newSchedules.push(m);
                    }
                });
                return newSchedules.sort((a, b) => b.id - a.id);
            });
        }

        setSelectedMaintenanceIds(linkedIds);

        setFormData({
            codigo_ot: order.codigo_ot || '',
            id_activo: order.id_activo,
            id_tipo_mantenimiento: order.id_tipo_mantenimiento,
            id_calendario: order.id_calendario,
            id_calendarios: linkedIds,
            id_tecnico: order.id_tecnico || '',
            id_proveedor: order.id_proveedor || '',
            prioridad: order.prioridad || 'media',
            tipo_ot: order.tipo_ot || 'preventiva',
            id_ubicacion: order.id_ubicacion || '',
            asunto: order.asunto || '',
            observaciones: order.observaciones || '',
            costo_estimado: (order.costo_estimado !== null && order.costo_estimado !== undefined) ? order.costo_estimado.toString() : '',
            terminos_pago: order.terminos_pago || '',
            foto_dano: order.foto_dano
        });
        setShowModal(true);
        setIsDirty(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta orden de trabajo? Esta acción no se puede deshacer.')) {
            try {
                await workOrderService.delete(id);
                fetchData();
            } catch (error) {
                console.error("Error deleting order", error);
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'cerrada' || newStatus === 'cancelada') {
            setSelectedOrderIdForComments(id);
            setPendingStatus(newStatus);
            setFinalComment('');
            setShowCloseModal(true);
            return;
        }
        try {
            await workOrderService.updateStatus(id, newStatus);
            fetchData(true);
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const handleSaveCloseComment = async () => {
        if (!finalComment.trim()) {
            alert("Por favor ingrese un motivo.");
            return;
        }
        try {
            await workOrderService.closeOrder(selectedOrderIdForComments, finalComment, pendingStatus);
            setShowCloseModal(false);
            setFinalComment('');
            fetchData(true);
            alert(`Orden ${pendingStatus === 'cerrada' ? 'finalizada' : 'cancelada'} exitosamente`);
        } catch (error) {
            console.error("Error updating order status", error);
            alert("Error al actualizar el estado de la orden");
        }
    };


    const handleSendEmailClick = (order) => {
        setSelectedOrderForEmail(order);
        // Pre-populate with provider or technician email if available, otherwise empty
        // Logic: if external provider, maybe they have email. Internal tech, maybe. 
        // For now, leave empty or improve with data if available in the order object.
        setTargetEmail('');
        setShowEmailModal(true);
    };

    const handleConfirmSendEmail = async () => {
        if (!selectedOrderForEmail) return;
        if (!targetEmail) {
            alert('Por favor ingrese un correo electrónico');
            return;
        }

        setSendingEmail(selectedOrderForEmail.id_ot);
        try {
            // Generate PDF Blob
            const pdfBlob = await pdfGenerator.generateWorkOrderPDF(selectedOrderForEmail, true);

            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                try {
                    await workOrderService.sendEmail(selectedOrderForEmail.id_ot, {
                        pdf_base64: base64data,
                        email: targetEmail
                    });
                    alert('Orden de Trabajo enviada exitosamente');
                    setShowEmailModal(false);
                    setTargetEmail('');
                    setSelectedOrderForEmail(null);
                } catch (error) {
                    alert('Error al enviar el correo');
                } finally {
                    setSendingEmail(null);
                }
            };
        } catch (error) {
            console.error('Error generating PDF for email:', error);
            setSendingEmail(null);
            alert('Error generando el PDF para enviar');
        }
    };

    const StatusSelector = ({ order }) => {
        const styles = {
            'abierta': 'bg-blue-100 text-blue-700 border-blue-200',
            'en_ejecucion': 'bg-amber-100 text-amber-700 border-amber-200',
            'espera_repuestos': 'bg-orange-100 text-orange-700 border-orange-200',
            'cerrada': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'cancelada': 'bg-red-100 text-red-700 border-red-200'
        };

        const currentStyle = styles[order.estado] || 'bg-slate-100 text-slate-600 border-slate-200';

        return (
            <div className="relative inline-block">
                <select
                     value={order.estado}
                     onChange={(e) => handleStatusChange(order.id_ot, e.target.value)}
                     className={`appearance-none pl-3 pr-8 py-1 md:py-1.5 rounded-full text-xs md:text-[10px] font-black uppercase tracking-widest border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all sm:max-w-[120px] md:max-w-none truncate ${currentStyle}`}
                 >
                    <option value="abierta">Abierta</option>
                    <option value="en_ejecucion">En Ejecución</option>
                    <option value="espera_repuestos">Espera Rep.</option>
                    <option value="cerrada">Cerrada</option>
                    <option value="cancelada">Cancelada</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        );
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            'baja': 'text-slate-500 bg-slate-100',
            'media': 'text-blue-500 bg-blue-50',
            'alta': 'text-orange-500 bg-orange-50',
            'critica': 'text-red-600 bg-red-50'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${styles[priority] || 'text-slate-500'}`}>
                {priority}
            </span>
        );
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.codigo_ot?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.activo?.nombre_equipo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.observaciones?.toLowerCase().includes(searchTerm.toLowerCase()));

        // Skip closed/cancelled orders in the main view
        if (order.estado === 'cerrada' || order.estado === 'cancelada') {
            return false;
        }

        const matchesStatus = filterStatus === 'all' || order.estado === filterStatus;
        const matchesPriority = filterPriority === 'all' || order.prioridad === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-6">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">ÓRDENES DE TRABAJO</h2>
                        <p className="text-slate-500 text-sm font-medium">Gestión correctiva y preventiva</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingOrder(null);
                        setFormData({ codigo_ot: '', id_activo: '', id_tipo_mantenimiento: '', id_calendario: null, id_calendarios: [], id_tecnico: '', id_proveedor: '', prioridad: 'media', tipo_ot: 'preventiva', id_ubicacion: '', asunto: '', observaciones: '', costo_estimado: '', terminos_pago: '' });
                        setShowModal(true);
                        setIsDirty(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nueva Orden
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por código, activo u observaciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="abierta">Abierta</option>
                        <option value="en_ejecucion">En Ejecución</option>
                        <option value="espera_repuestos">Espera Repuestos</option>
                        <option value="cerrada">Cerrada</option>
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none"
                    >
                        <option value="all">Todas las Prioridades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                    </select>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Activo / Equipo</th>
                                <th className="px-6 py-4">Mantenimiento Org.</th>
                                <th className="px-6 py-4">Asunto</th>
                                <th className="px-6 py-4">Prioridad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Fecha Creación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-20 animate-pulse text-slate-400 font-bold">Cargando órdenes de trabajo...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-20">
                                        <div className="flex flex-col items-center opacity-50">
                                            <FileText className="w-12 h-12 mb-2 text-slate-300" />
                                            <span className="text-slate-500 font-bold">No se encontraron órdenes</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr 
                                    key={order.id_ot} 
                                    onClick={() => navigate(`/work-orders/${order.id_ot}`)}
                                    className="group hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {order.codigo_ot || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            {order.tipo_ot === 'general' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-600">
                                                        <Building className="w-4 h-4" />
                                                    </div>
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{order.nombre_ubicacion || 'Ubicación General'}</div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{order.activo?.nombre_equipo || 'Activo Desconocido'}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{order.activo?.codigo_administrativo || order.activo?.codigo_equipo || 'S/N'}</span>
                                                        {order.nombre_tipo_mantenimiento && (
                                                            <>
                                                                <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
                                                                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{order.nombre_tipo_mantenimiento}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {order.mantenimientos && order.mantenimientos.length > 0 ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                                    {order.mantenimientos.length > 1 ? `Vinculado (${order.mantenimientos.length})` : 'Vinculado'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500">
                                                    {order.mantenimientos.length > 1
                                                        ? 'Múltiples Items'
                                                        : (order.codigo_mantenimiento || `ID Mnt: ${order.id_calendario}`)
                                                    }
                                                </span>
                                                {order.mantenimientos.length > 1 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {order.mantenimientos.slice(0, 3).map(m => (
                                                            <span key={m.id} className="text-[9px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-100">
                                                                {m.codigo || m.id}
                                                            </span>
                                                        ))}
                                                        {order.mantenimientos.length > 3 && (
                                                            <span className="text-[9px] text-slate-400">+{order.mantenimientos.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : order.id_calendario ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Vinculado</span>
                                                <span className="text-xs font-bold text-slate-500">{order.codigo_mantenimiento || `ID Mnt: ${order.id_calendario}`}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">Correctivo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={order.asunto}>
                                        <div className="flex items-center gap-2">
                                            {order.foto_dano && (
                                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-50 dark:bg-indigo-900/30 rounded flex items-center justify-center text-indigo-500" title="Ver evidencia">
                                                    <Upload className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <span className="truncate">{order.asunto || <span className="text-slate-300 italic">Sin asunto</span>}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getPriorityBadge(order.prioridad)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusSelector order={order} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                        {order.nombre_tecnico && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                <User className="w-3 h-3" /> {order.nombre_tecnico}
                                            </div>
                                        )}
                                        {order.nombre_proveedor && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                <Building className="w-3 h-3" /> {order.nombre_proveedor}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(order)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Editar Orden"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            {(order.id_calendario || (order.mantenimientos && order.mantenimientos.length > 0)) && (
                                                <button
                                                    onClick={() => handleUnlink(order)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Desvincular Mantenimiento"
                                                >
                                                    <Link2Off className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); pdfGenerator.generateWorkOrderPDF(order); }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Imprimir PDF"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSendEmailClick(order); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Enviar por Correo"
                                                disabled={sendingEmail === order.id_ot}
                                            >
                                                {sendingEmail === order.id_ot ? (
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    navigate(`/work-orders/${order.id_ot}`);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(order.id_ot); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar Orden"
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

            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleCreate}
                isDirty={isDirty}
                title={editingOrder ? `Editar Orden: ${editingOrder.codigo_ot}` : 'Crear Orden de Trabajo'}
                width="max-w-xl"
                zIndex={50}
            >
                <div>
                    <div className="flex justify-between items-center mb-6">
                        {user?.permisos?.includes('work_orders_link_maintenance') && (
                            <button
                                type="button"
                                disabled={refreshing && pendingSchedules.length === 0}
                                onClick={() => setShowMaintenanceSelector(true)}
                                className={`${(refreshing && pendingSchedules.length === 0) ? 'opacity-50 cursor-wait' : ''} bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2`}
                            >
                                {refreshing ? (
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <ClipboardList className="w-4 h-4" />
                                )}
                                {formData.id_calendarios && formData.id_calendarios.length > 0 ? "Añadir más Planes" : "Cargar Mantenimiento"}
                            </button>
                        )}
                        {(formData.id_calendario || (formData.id_calendarios && formData.id_calendarios.length > 0)) && (
                            <div className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/30">
                                <CheckCircle className="w-4 h-4" />
                                {formData.id_calendarios && formData.id_calendarios.length > 1
                                    ? `Vinculado a ${formData.id_calendarios.length} Mantenimientos`
                                    : "Vinculado a Mantenimiento"}
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Orden de Trabajo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, tipo_ot: 'activo' });
                                            setIsDirty(true);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.tipo_ot !== 'general' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        Mantenimiento de Activo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, tipo_ot: 'general', id_activo: null });
                                            setIsDirty(true);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.tipo_ot === 'general' ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                    >
                                        Mantenimiento General
                                    </button>
                                </div>
                            </div>
                            {formData.tipo_ot === 'general' && (
                                <div className="space-y-4 mb-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ubicación / Área</label>
                                        <div className="relative">
                                            <div className="relative group">
                                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Escriba para buscar ubicación..."
                                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 pl-11 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                                    value={showLocationDropdown ? locationSearchQuery : (locations.find(l => l.id == formData.id_ubicacion)?.nombre || '')}
                                                    onChange={(e) => {
                                                        setLocationSearchQuery(e.target.value);
                                                        setShowLocationDropdown(true);
                                                    }}
                                                    onFocus={() => {
                                                        setShowLocationDropdown(true);
                                                        setLocationSearchQuery('');
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
                                                        className="absolute right-4 top-4 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {showLocationDropdown && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setShowLocationDropdown(false)}
                                                    ></div>
                                                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200 custom-scrollbar">
                                                        {locations
                                                            .filter(loc => loc.nombre.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                                                            .length === 0 ? (
                                                            <div className="p-4 text-center text-slate-400 text-xs font-bold">
                                                                No se encontraron ubicaciones
                                                            </div>
                                                        ) : (
                                                            locations
                                                                .filter(loc => loc.nombre.toLowerCase().includes(locationSearchQuery.toLowerCase()))
                                                                .map(loc => (
                                                                    <div
                                                                        key={loc.id}
                                                                        className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0 group"
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, id_ubicacion: loc.id });
                                                                            setIsDirty(true);
                                                                            setShowLocationDropdown(false);
                                                                            setLocationSearchQuery('');
                                                                        }}
                                                                    >
                                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                                                            {loc.nombre}
                                                                        </span>
                                                                        {formData.id_ubicacion == loc.id && (
                                                                            <CheckCircle className="w-4 h-4 text-indigo-500" />
                                                                        )}
                                                                    </div>
                                                                ))
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                                    Activo / Equipo {formData.tipo_ot === 'general' && <span className="text-slate-400 lowercase italic font-normal">(opcional)</span>}
                                </label>
                                <div className="relative group">
                                    <input
                                        readOnly
                                        required={formData.tipo_ot !== 'general'}
                                        type="text"
                                        placeholder="Haga clic para buscar equipo..."
                                        value={formData.id_activo ? assets.find(a => a.id == formData.id_activo)?.nombre_equipo : ''}
                                        onClick={() => {
                                            if (formData.id_calendario || (formData.id_calendarios && formData.id_calendarios.length > 0)) {
                                                alert("No puede cambiar el equipo de una Orden de Trabajo vinculada a un mantenimiento programado.");
                                                return;
                                            }
                                            setAssetSearchQuery('');
                                            setShowAssetSearch(true);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border-2 border-dashed border-slate-200 dark:border-slate-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-3.5 pl-10 text-sm font-bold outline-none cursor-pointer transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 italic"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                                    {formData.id_activo && (
                                        <div className="absolute right-4 top-4 flex items-center gap-2">
                                            <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                                ID: {assets.find(a => a.id == formData.id_activo)?.codigo_equipo || assets.find(a => a.id == formData.id_activo)?.codigo}
                                            </div>
                                            {formData.tipo_ot === 'general' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData({ ...formData, id_activo: '' });
                                                    }}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo de Mantenimiento</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    value={formData.id_tipo_mantenimiento}
                                    onChange={(e) => {
                                        setFormData({ ...formData, id_tipo_mantenimiento: e.target.value });
                                        setIsDirty(true);
                                    }}
                                >
                                    <option value="">Seleccionar tipo...</option>
                                    {maintenanceTypes.map(t => (
                                        <option key={t.id_tipo_mantenimiento} value={t.id_tipo_mantenimiento}>{t.nombre_tipo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Técnico Asignado (Interno)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.id_tecnico}
                                        onChange={(e) => {
                                            setFormData({ ...formData, id_tecnico: e.target.value });
                                            setIsDirty(true);
                                        }}
                                    >
                                        <option value="">No asignado</option>
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Proveedor (Externo)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.id_proveedor}
                                        onChange={(e) => {
                                            setFormData({ ...formData, id_proveedor: e.target.value });
                                            setIsDirty(true);
                                        }}
                                    >
                                        <option value="">No asignado</option>
                                        {providers.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Prioridad</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    value={formData.prioridad}
                                    onChange={(e) => {
                                        setFormData({ ...formData, prioridad: e.target.value });
                                        setIsDirty(true);
                                    }}
                                >
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                    <option value="critica">Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asunto</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    value={formData.asunto}
                                    onChange={(e) => {
                                        setFormData({ ...formData, asunto: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    placeholder="Resumen corto del incidente..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Observaciones / Detalles</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none min-h-[100px]"
                                    value={formData.observaciones}
                                    onChange={(e) => {
                                        setFormData({ ...formData, observaciones: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    placeholder="Describa el trabajo a realizar..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fotos del Daño / Evidencia</label>
                                
                                {!formData.foto_dano ? (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={uploading}
                                        />
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                            <div className={`p-4 rounded-full ${uploading ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500'} transition-all mb-4`}>
                                                {uploading ? (
                                                    <Loader2 className="w-8 h-8 animate-spin" />
                                                ) : (
                                                    <Camera className="w-8 h-8" />
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-white uppercase mb-2">Tocar para Cámara / Galería</p>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                    {uploading ? 'Subiendo imagen...' : 'Cargar foto del daño'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800 max-w-md mx-auto">
                                        <img 
                                            src={formData.foto_dano} 
                                            alt="Evidencia del daño" 
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, foto_dano: null });
                                                    setIsDirty(true);
                                                }}
                                                className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                                                title="Eliminar foto"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="p-2.5 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg">
                                                Foto cargada
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Costo Estimado ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.costo_estimado}
                                        onChange={(e) => {
                                            setFormData({ ...formData, costo_estimado: e.target.value });
                                            setIsDirty(true);
                                        }}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Términos de Pago</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.terminos_pago}
                                        onChange={(e) => {
                                            setFormData({ ...formData, terminos_pago: e.target.value });
                                            setIsDirty(true);
                                        }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {paymentTerms.map(pt => (
                                            <option key={pt.id} value={pt.nombre}>{pt.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
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

            {/* Email Confirmation Modal */}
            <Modal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSave={handleConfirmSendEmail}
                title="Enviar Orden por Correo"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Correo Destinatario</label>
                        <input
                            type="email"
                            className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-800 dark:text-slate-200"
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            placeholder="tecnico@ejemplo.com, proveedor@ejemplo.com"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Separe múltiples correos con comas. Ej: <em>ventas@proveedor.com, gerente@proveedor.com</em>
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Modal de Motivo de Cierre/Cancelación */}
            <Modal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onSave={handleSaveCloseComment}
                title={pendingStatus === 'cancelada' ? "Cancelar Orden" : "Finalizar Orden"}
                saveText={pendingStatus === 'cancelada' ? "Confirmar Cancelación" : "Confirmar Cierre"}
            >
                <div className="space-y-4 p-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                {pendingStatus === 'cancelada' ? "Atención: Cancelación de Orden" : "Atención: Cierre de Orden"}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                {pendingStatus === 'cancelada' 
                                    ? "Para cancelar esta orden, debe ingresar un motivo obligatorio explicando el porqué de la anulación."
                                    : "Para proceder al cierre, debe ingresar el comentario final o resolución de los trabajos técnicos."}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                            {pendingStatus === 'cancelada' ? "Motivo de Cancelación" : "Comentario Final"}
                        </label>
                        <textarea
                            autoFocus
                            required
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none min-h-[100px]"
                            value={finalComment}
                            onChange={(e) => setFinalComment(e.target.value)}
                            placeholder={pendingStatus === 'cancelada' ? "Ingresa el motivo de la cancelación..." : "Describe la solución o trabajos realizados..."}
                        />
                    </div>
                </div>
            </Modal>

            {/* Asset Search Modal */}
            {showAssetSearch && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <Search className="w-5 h-5 text-indigo-500" />
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
                                className={`p-2 rounded-lg transition-colors ${showAdvancedAssetFilters ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer group transition-all"
                                    onClick={() => {
                                        setFormData({ ...formData, id_activo: a.id });
                                        setIsDirty(true);
                                        setShowAssetSearch(false);
                                    }}
                                >
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {a.imagen_url ? (
                                            <img src={`${a.imagen_url}`} alt={a.nombre} className="w-full h-full object-cover" />
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
                                                <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase">{a.categoria}</span>
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

export default WorkOrdersPage;
