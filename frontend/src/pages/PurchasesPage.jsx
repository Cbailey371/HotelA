import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, FileText, Loader2, ShoppingCart, Building2, ChevronRight } from 'lucide-react';
import { providerService } from '../services/providerService';
import Modal from '../components/Modal';

const PurchasesPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Provider Selection State
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providers, setProviders] = useState([]);
    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [generatingOrder, setGeneratingOrder] = useState(false);

    // Form data (simplified for now)
    const [formData, setFormData] = useState({
        motivo: '',
        prioridad: 'NORMAL',
        items: [{ descripcion: '', cantidad: 1 }] // Simplified dynamic fields
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/purchases/requests');
            setRequests(res.data);
        } catch (error) {
            console.error("Error fetching requests", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Hardcoded solicitante_id for now (e.g., 1 or from auth context)
            const payload = {
                solicitante_id: 1,
                fecha_solicitud: new Date().toISOString().split('T')[0],
                motivo: formData.motivo,
                prioridad: formData.prioridad,
                detalles: formData.items.map(i => ({
                    descripcion_item: i.descripcion,
                    cantidad: parseInt(i.cantidad),
                    repuesto_id: null // Assuming text-based requests for MVP
                }))
            };
            await axios.post('/api/purchases/requests', payload);
            setShowModal(false);
            setFormData({ motivo: '', prioridad: 'NORMAL', items: [{ descripcion: '', cantidad: 1 }] });
            setIsDirty(false);
            fetchRequests();
        } catch (error) {
            console.error("Error creating request", error);
            alert("Error al crear la solicitud");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.put(`/api/purchases/requests/${id}/status`, { estado: newStatus });
            fetchRequests();
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest(prev => ({ ...prev, estado: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status", error);
            alert("Error al actualizar estado");
        }
    };

    const handleOpenGenerateOrder = async () => {
        try {
            setLoading(true); // Re-use loading or specific state
            const providersData = await providerService.getAll();
            setProviders(providersData);
            setShowProviderModal(true);
        } catch (error) {
            console.error("Error fetching providers", error);
            alert("No se pudo cargar la lista de proveedores");
        } finally {
            setLoading(false);
        }
    };

    const confirmGenerateOrder = async () => {
        if (!selectedProviderId) {
            alert("Por favor seleccione un proveedor");
            return;
        }

        setGeneratingOrder(true);
        try {
            await axios.post(`/api/purchases/orders/from-request/${selectedRequest.id}`, {
                proveedor_id: parseInt(selectedProviderId)
            });
            alert("Orden de Compra generada exitosamente");
            fetchRequests();
            setShowProviderModal(false);
            setShowDetailModal(false);
            setSelectedProviderId('');
        } catch (error) {
            console.error(error);
            alert("Error al generar OC: " + (error.response?.data || error.message));
        } finally {
            setGeneratingOrder(false);
        }
    };

    const fetchRequestDetails = async (id) => {
        try {
            const res = await axios.get(`/api/purchases/requests/${id}`);
            setSelectedRequest(res.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const addItemField = () => {
        setFormData({ ...formData, items: [...formData.items, { descripcion: '', cantidad: 1 }] });
        setIsDirty(true);
    };

    const removeItemField = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
        setIsDirty(true);
    };

    const filteredRequests = requests.filter(r => {
        const matchSearch = r.motivo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || r.estado === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDIENTE': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Pendiente</span>;
            case 'APROBADA': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Aprobada</span>;
            case 'RECHAZADA': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rechazada</span>;
            case 'PROCESADA': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Procesada (OC)</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Solicitudes de Compra</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona requerimientos y adquisiciones</p>
                </div>
                <button
                    onClick={() => {
                        setShowModal(true);
                        setIsDirty(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nueva Solicitud
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por motivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-9 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none flex-1"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="APROBADA">Aprobadas</option>
                        <option value="RECHAZADA">Rechazadas</option>
                        <option value="PROCESADA">Procesadas</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : (
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Motivo</th>
                                    <th className="px-6 py-4">Prioridad</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredRequests.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a]/50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{r.id}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{r.fecha_solicitud}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">{r.motivo}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${r.prioridad === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                {r.prioridad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(r.estado)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => fetchRequestDetails(r.id)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleCreateRequest}
                isDirty={isDirty}
                title="Nueva Solicitud de Compra"
            >
                <form onSubmit={handleCreateRequest} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Motivo / Justificación</label>
                        <textarea
                            required
                            value={formData.motivo}
                            onChange={(e) => {
                                setFormData({ ...formData, motivo: e.target.value });
                                setIsDirty(true);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                            rows="3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Prioridad</label>
                        <select
                            value={formData.prioridad}
                            onChange={(e) => {
                                setFormData({ ...formData, prioridad: e.target.value });
                                setIsDirty(true);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                        >
                            <option value="NORMAL">Normal</option>
                            <option value="URGENTE">Urgente</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Items Solicitados</label>
                            <button type="button" onClick={addItemField} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors">+ Agregar Item</button>
                        </div>
                        <div className="space-y-2">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Descripción del artículo..."
                                        value={item.descripcion}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].descripcion = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                            setIsDirty(true);
                                        }}
                                        className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                                        required
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Cant."
                                        value={item.cantidad}
                                        onChange={(e) => {
                                            const newItems = [...formData.items];
                                            newItems[index].cantidad = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                            setIsDirty(true);
                                        }}
                                        className="w-20 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                                        required
                                    />
                                    {index > 0 && (
                                        <button type="button" onClick={() => removeItemField(index)} className="text-red-400 hover:text-red-600 p-2"><XCircle className="w-5 h-5" /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail/Approval Modal */}
            {/* Detail/Approval Modal */}
            <Modal
                isOpen={showDetailModal && !!selectedRequest}
                onClose={() => setShowDetailModal(false)}
                title={`Solicitud #${selectedRequest?.id}`}
                width="max-w-3xl"
            >
                {selectedRequest && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-1">
                            {getStatusBadge(selectedRequest.estado)}
                            <p className="text-sm text-slate-500">Fecha: {selectedRequest.fecha_solicitud} | Prioridad: {selectedRequest.prioridad}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Motivo</h4>
                            <p className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg text-slate-600 dark:text-slate-400 text-sm border border-slate-100 dark:border-slate-800">
                                {selectedRequest.motivo}
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">Detalle de Items</h4>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-xs font-bold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Descripción</th>
                                            <th className="px-4 py-3 w-24 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedRequest.detalles && selectedRequest.detalles.map(d => (
                                            <tr key={d.id}>
                                                <td className="px-4 py-3">{d.descripcion_item || (`Repuesto ID: ${d.repuesto_id}`)}</td>
                                                <td className="px-4 py-3 text-right font-medium">{d.cantidad}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                            {selectedRequest.estado === 'PENDIENTE' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(selectedRequest.id, 'RECHAZADA')}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedRequest.id, 'APROBADA')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-500/20 transition-colors"
                                    >
                                        Aprobar Solicitud
                                    </button>
                                </>
                            )}
                            {selectedRequest.estado === 'APROBADA' && (
                                <button
                                    onClick={handleOpenGenerateOrder}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Generar Orden de Compra
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Provider Selection Modal */}
            <Modal
                isOpen={showProviderModal}
                onClose={() => setShowProviderModal(false)}
                title="Adjudicar Proveedor"
                width="max-w-md"
            >
                <div>
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Solicitud</p>
                        <p className="font-medium text-slate-800 dark:text-gray-300">#{selectedRequest?.id} - {selectedRequest?.motivo}</p>
                    </div>

                    <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Proveedor</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {providers.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-2 text-center">No hay proveedores registrados</p>
                        ) : (
                            providers.map(prov => (
                                <label
                                    key={prov.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedProviderId === prov.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="provider"
                                        value={prov.id}
                                        checked={selectedProviderId === prov.id}
                                        onChange={() => setSelectedProviderId(prov.id)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{prov.nombre}</div>
                                        <div className="text-xs text-slate-500">{prov.rut_o_ruc || 'Sin RUT'}</div>
                                    </div>
                                    {selectedProviderId === prov.id && <CheckCircle className="w-4 h-4 text-blue-600" />}
                                </label>
                            ))
                        )}
                    </div>
                </div>
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setShowProviderModal(false)}
                        className="px-4 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmGenerateOrder}
                        disabled={generatingOrder || !selectedProviderId}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {generatingOrder && <Loader2 className="w-4 h-4 animate-spin" />}
                        Generar OC
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default PurchasesPage;
