import React, { useState, useEffect } from 'react';
import { workOrderService } from '../services/workOrderService';
import { assetService } from '../services/assetService';
import { technicianService } from '../services/technicianService';
import {
    Plus, Filter, Clock, CheckCircle, AlertTriangle, User, Calendar,
    Settings, Printer, Search, MoreVertical, FileText, Briefcase
} from 'lucide-react';
import { pdfGenerator } from '../utils/pdfGenerator';

const WorkOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        codigo_ot: '',
        id_activo: '',
        prioridad: 'media',
        id_tecnico: '',
        observaciones: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersResponse, assetsData] = await Promise.all([
                workOrderService.getAll(),
                assetService.getAll()
            ]);

            // Fix Data Mapping: API returns [[order, asset], ...]
            const formattedOrders = Array.isArray(ordersResponse)
                ? ordersResponse.map(item => {
                    if (Array.isArray(item)) {
                        const [order, asset] = item;
                        return { ...order, activo: asset };
                    }
                    return item;
                })
                : [];

            setOrders(formattedOrders);
            setAssets(assetsData);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await workOrderService.create({
                ...formData,
                id_activo: parseInt(formData.id_activo),
                id_tecnico: formData.id_tecnico ? parseInt(formData.id_tecnico) : null
            });
            setShowModal(false);
            fetchData();
            setFormData({ codigo_ot: '', id_activo: '', prioridad: 'media', id_tecnico: '', observaciones: '' });
        } catch (error) {
            console.error("Error creating order", error);
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

    const getStatusBadge = (status) => {
        const styles = {
            'abierta': 'bg-blue-100 text-blue-700 border-blue-200',
            'en_ejecucion': 'bg-amber-100 text-amber-700 border-amber-200',
            'espera_repuestos': 'bg-orange-100 text-orange-700 border-orange-200',
            'cerrada': 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
        const labels = {
            'abierta': 'Abierta',
            'en_ejecucion': 'En Ejecución',
            'espera_repuestos': 'Espera Rep.',
            'cerrada': 'Cerrada'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {labels[status] || status}
            </span>
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
                    onClick={() => setShowModal(true)}
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
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{order.activo?.nombre_equipo || 'Activo Desconocido'}</div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{order.activo?.codigo_administrativo || order.activo?.codigo_equipo || 'S/N'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getPriorityBadge(order.prioridad)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(order.estado)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {order.estado === 'abierta' && (
                                                <button
                                                    onClick={() => handleStatusChange(order.id_ot, 'en_ejecucion')}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Iniciar Ejecución"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            )}
                                            {order.estado === 'en_ejecucion' && (
                                                <button
                                                    onClick={() => handleStatusChange(order.id_ot, 'cerrada')}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Finalizar"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => pdfGenerator.generateWorkOrderPDF(order)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Imprimir PDF"
                                            >
                                                <Printer className="w-4 h-4" />
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
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 scale-in-center">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-indigo-600">
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Crear Orden de Trabajo</h3>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Activo / Equipo</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.id_activo}
                                        onChange={(e) => setFormData({ ...formData, id_activo: e.target.value })}
                                    >
                                        <option value="">Seleccionar activo...</option>
                                        {assets.map(a => (
                                            <option key={a.id_equipo} value={a.id_equipo}>{a.nombre_equipo} ({a.codigo_equipo})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Prioridad</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm font-bold outline-none"
                                        value={formData.prioridad}
                                        onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        placeholder="Describa el trabajo a realizar..."
                                    />
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/30 transition-all"
                                >
                                    Guardar Orden
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrdersPage;

