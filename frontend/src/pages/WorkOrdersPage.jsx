import React, { useState, useEffect } from 'react';
import { workOrderService } from '../services/workOrderService';
import { assetService } from '../services/assetService';
import { technicianService } from '../services/technicianService'; // Assuming this exists or I'll create generic fetch
import { Link } from 'react-router-dom';
import { Plus, Filter, Clock, CheckCircle, AlertTriangle, User, Calendar, Settings, Printer } from 'lucide-react';
import { pdfGenerator } from '../utils/pdfGenerator';
import { generateCode } from '../utils/codeGenerator';

const WorkOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

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
            const [ordersData, assetsData] = await Promise.all([
                workOrderService.getAll(),
                assetService.getAll()
            ]);
            setOrders(ordersData);
            setAssets(assetsData);
            // Mock technicians if service doesn't exist yet, or fetch if it does
            // const techs = await technicianService.getAll(); 
            // setTechnicians(techs); 
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'abierta': return 'bg-blue-100 text-blue-800';
            case 'en_ejecucion': return 'bg-yellow-100 text-yellow-800';
            case 'espera_repuestos': return 'bg-red-100 text-red-800';
            case 'cerrada': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.estado === filterStatus);

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Órdenes de Trabajo</h1>
                    <p className="text-slate-500 mt-1">Gestión y seguimiento de mantenimiento correctivo y preventivo</p>
                </div>
                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, codigo_ot: generateCode('OT-') }));
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    <Plus size={20} />
                    Nueva Orden
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'abierta', 'en_ejecucion', 'espera_repuestos', 'cerrada'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filterStatus === status
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {status.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Kanban / List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map(order => (
                    <div key={order.id_ot} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(order.estado)}`}>
                                {order.estado?.replace('_', ' ')}
                            </span>
                            <span className={`text-xs font-bold uppercase ${order.prioridad === 'critica' ? 'text-red-500' :
                                order.prioridad === 'alta' ? 'text-orange-500' : 'text-slate-400'
                                }`}>
                                {order.prioridad}
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-800 mb-1">
                            {order.activo?.nombre_equipo || `Activo #${order.id_activo}`}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                            {order.observaciones || "Sin observaciones"}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                            {order.tecnico && (
                                <div className="flex items-center gap-1">
                                    <User size={14} />
                                    <span>Técnico #{order.id_tecnico}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                            {order.estado === 'abierta' && (
                                <button
                                    onClick={() => handleStatusChange(order.id_ot, 'en_ejecucion')}
                                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded text-sm font-medium transition-colors"
                                >
                                    Iniciar
                                </button>
                            )}
                            {order.estado === 'en_ejecucion' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(order.id_ot, 'espera_repuestos')}
                                        className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 py-1.5 rounded text-sm font-medium transition-colors"
                                    >
                                        Pausar
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(order.id_ot, 'cerrada')}
                                        className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 py-1.5 rounded text-sm font-medium transition-colors"
                                    >
                                        Finalizar
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => pdfGenerator.generateWorkOrderPDF(order)}
                                className="bg-white text-slate-500 hover:text-blue-600 border border-slate-200 px-3 rounded hover:bg-slate-50 transition-colors"
                                title="Descargar PDF"
                            >
                                <Printer size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Todo al día</h3>
                    <p className="text-slate-500">No hay órdenes de trabajo pendientes.</p>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Nueva Orden</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código Orden *</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 text-sm pr-20"
                                            value={formData.codigo_ot}
                                            onChange={(e) => setFormData({ ...formData, codigo_ot: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, codigo_ot: generateCode('OT-') }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors uppercase">Regenerar</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Activo</label>
                                    <select
                                        required
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={formData.id_activo}
                                        onChange={(e) => setFormData({ ...formData, id_activo: e.target.value })}
                                    >
                                        <option value="">Seleccionar Activo</option>
                                        {assets.map(a => (
                                            <option key={a.id_equipo} value={a.id_equipo}>{a.nombre_equipo}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Detalles / Observaciones</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 text-sm h-24"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Crear Orden
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
