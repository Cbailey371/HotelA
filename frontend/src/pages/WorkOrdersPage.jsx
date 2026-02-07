import React, { useState, useEffect } from 'react';
import { workOrderService } from '../services/workOrderService';
import { assetService } from '../services/assetService';
import { technicianService } from '../services/technicianService';
import { providerService } from '../services/providerService';
import {
    Plus, Filter, Clock, CheckCircle, AlertTriangle, User, Calendar,
    Settings, Printer, Search, MoreVertical, FileText, Briefcase,
    Building, ClipboardList, Info, Trash2, Edit, Link2Off, X
} from 'lucide-react';
import Modal from '../components/Modal';
import { pdfGenerator } from '../utils/pdfGenerator';
import api from '../services/api';

const WorkOrdersPage = () => {
    // Data State
    const [orders, setOrders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [providers, setProviders] = useState([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState([]);
    const [pendingSchedules, setPendingSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMaintenanceSelector, setShowMaintenanceSelector] = useState(false);
    const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState([]); // New state for multi-select
    const [editingOrder, setEditingOrder] = useState(null);
    const [paymentTerms, setPaymentTerms] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

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
        observaciones: '',
        costo_estimado: '',
        terminos_pago: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersData, assetsData, techsData, provsData, schedulesRes, mTypesRes, paymentTermsRes] = await Promise.all([
                workOrderService.getAll(),
                assetService.getAll(),
                technicianService.getAll(),
                providerService.getAll(),
                api.get('/maintenance/schedule'),
                api.get('/maintenance/types'),
                api.get('/settings/payment-terms')
            ]);

            setOrders(ordersData.sort((a, b) => a.id_ot - b.id_ot));
            setAssets(assetsData);
            setTechnicians(techsData);
            setProviders(provsData);
            setMaintenanceTypes(mTypesRes.data);
            setPendingSchedules(schedulesRes.data.filter(s => s.estado === 'programado' && !s.tiene_ot));
            setPaymentTerms(paymentTermsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
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
            console.error("Error unlinking work order", error);
            alert("No se pudo desvincular la orden.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (editingOrder) {
                await workOrderService.update(editingOrder.id_ot, {
                    ...formData,
                    id_activo: parseInt(formData.id_activo),
                    id_tipo_mantenimiento: parseInt(formData.id_tipo_mantenimiento),
                    id_tecnico: formData.id_tecnico ? parseInt(formData.id_tecnico) : null,
                    id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
                    costo_estimado: formData.costo_estimado !== '' ? parseFloat(formData.costo_estimado) : null
                });
            } else {
                await workOrderService.create({
                    ...formData,
                    id_activo: parseInt(formData.id_activo),
                    id_tipo_mantenimiento: parseInt(formData.id_tipo_mantenimiento),
                    id_tecnico: formData.id_tecnico ? parseInt(formData.id_tecnico) : null,
                    id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
                    id_calendario: formData.id_calendario, // Can be null if using id_calendarios
                    id_calendarios: formData.id_calendarios, // Include multiple
                    costo_estimado: formData.costo_estimado !== '' ? parseFloat(formData.costo_estimado) : null
                });
            }
            setShowModal(false);
            setEditingOrder(null);
            setIsDirty(false);
            fetchData();
        } catch (error) {
            console.error("Error saving order", error);
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
            observaciones: order.observaciones || '',
            costo_estimado: (order.costo_estimado !== null && order.costo_estimado !== undefined) ? order.costo_estimado.toString() : '',
            terminos_pago: order.terminos_pago || ''
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
        try {
            await workOrderService.updateStatus(id, newStatus);
            fetchData();
        } catch (error) {
            console.error("Error updating status", error);
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
                    className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${currentStyle}`}
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
                        setFormData({ codigo_ot: '', id_activo: '', id_tipo_mantenimiento: '', id_calendario: null, id_tecnico: '', id_proveedor: '', prioridad: 'media', observaciones: '', costo_estimado: '', terminos_pago: '' });
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
                                <tr key={order.id_ot} className="group hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {order.codigo_ot || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
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
                                                onClick={() => pdfGenerator.generateWorkOrderPDF(order)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Imprimir PDF"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(order.id_ot)}
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
                        {(!formData.id_calendario && (!formData.id_calendarios || formData.id_calendarios.length === 0)) && pendingSchedules.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowMaintenanceSelector(true)}
                                className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <ClipboardList className="w-4 h-4" /> Cargar Mantenimiento
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Activo / Equipo</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                    value={formData.id_activo}
                                    onChange={(e) => {
                                        setFormData({ ...formData, id_activo: e.target.value });
                                        setIsDirty(true);
                                    }}
                                >
                                    <option value="">Seleccionar activo...</option>
                                    {assets.map(a => (
                                        <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                                    ))}
                                </select>
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
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-800 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`${editingOrder ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/30 transition-all`}
                            >
                                {editingOrder ? 'Actualizar Orden' : 'Guardar Orden'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Maintenance Selector Modal */}
            <Modal
                isOpen={showMaintenanceSelector}
                onClose={() => setShowMaintenanceSelector(false)}
                title="Mantenimientos Programados"
                zIndex={60}
            >
                <div className="flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-sm font-bold text-slate-500">
                            {selectedMaintenanceIds.length === 0
                                ? "Seleccione uno o más mantenimientos"
                                : `${selectedMaintenanceIds.length} seleccionados`}
                        </span>
                        {selectedMaintenanceIds.length > 0 && (
                            <button
                                onClick={handleConfirmMaintenanceSelection}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Cargar Selección
                            </button>
                        )}
                    </div>
                    <div className="p-4 overflow-y-auto flex-1">
                        {pendingSchedules.length === 0 ? (
                            <div className="text-center py-12 opacity-50">
                                <Info className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="font-bold text-slate-500">No hay mantenimientos pendientes de OT</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingSchedules.map(s => {
                                    const isSelected = selectedMaintenanceIds.includes(s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            onClick={() => toggleMaintenanceSelection(s.id)}
                                            className={`w-full text-left p-4 rounded-2xl border cursor-pointer group transition-all relative
                                                ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 hover:bg-white dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className="absolute top-4 right-4">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                                                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-start mb-2 pr-8">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.codigo || `MANT-${s.id}`}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.fecha}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{s.equipo}</h4>
                                            <p className="text-xs text-slate-500 font-medium mb-3">{s.tipo}</p>
                                            <div className="flex gap-4">
                                                {s.tecnico_id && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                        <User className="w-3.5 h-3.5" /> Técnico Asignado
                                                    </div>
                                                )}
                                                {s.proveedor_id && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                        <Building className="w-3.5 h-3.5" /> Proveedor Asignado
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkOrdersPage;

