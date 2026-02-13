import React, { useState, useEffect } from 'react';
import {
    X, Search, Plus, Trash2, Save, FileText,
    ShoppingCart, Truck, Calendar, Tag, DollarSign, Warehouse, MapPin, Box, Scan, Printer
} from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';
import BarcodeScanner from '../components/BarcodeScanner';
import LabelPrinterModal from '../components/LabelPrinterModal';

const InvoiceForm = ({ isOpen, onClose, onSuccess, initialOrderId, initialDetails }) => {
    const [orders, setOrders] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id_orden_compra: '',
        id_proveedor: '',
        numero_factura: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        notas: '',
        detalles: []
    });

    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [parts, setParts] = useState([]);
    const [showPartModal, setShowPartModal] = useState(false);
    const [partSearch, setPartSearch] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showLabelModal, setShowLabelModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOrders();
            fetchProviders();
            fetchStorageData();
            fetchParts();
            if (initialOrderId) {
                handleLoadInitialOrder(initialOrderId);
            } else if (initialDetails) {
                setFormData({
                    ...formData,
                    id_orden_compra: initialDetails.id_orden_compra || '',
                    id_proveedor: initialDetails.id_proveedor || '',
                    detalles: initialDetails.items.map(it => ({
                        id_repuesto: it.id_repuesto,
                        nombre_repuesto: it.nombre_repuesto,
                        id_detalle_oc: it.id_detalle_oc,
                        cantidad: it.cantidad,
                        costo_unitario: it.costo_unitario || 0,
                        bodega_id: it.bodega_id || '',
                        ubicacion_bodega_id: it.ubicacion_bodega_id || '',
                        available_locations: it.available_locations || []
                    }))
                });
            }
        } else {
            // Reset form on close
            setFormData({
                id_orden_compra: '',
                id_proveedor: '',
                numero_factura: '',
                fecha_emision: new Date().toISOString().split('T')[0],
                notas: '',
                detalles: []
            });
        }
    }, [isOpen, initialOrderId]);

    const handleLoadInitialOrder = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/purchases/orders/${id}`);
            handleSelectOrder(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchStorageData = async () => {
        try {
            const res = await api.get('/settings/warehouses');
            setWarehouses(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchParts = async () => {
        try {
            const res = await api.get('/inventory');
            setParts(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/purchases/orders');
            // Filter only approved/sent orders that haven't been fully received yet
            setOrders(res.data.filter(o => o.estado !== 'CANCELADA' && o.estado !== 'RECIBIDA'));
        } catch (e) { console.error(e); }
    };

    const fetchProviders = async () => {
        try {
            const res = await api.get('/providers');
            setProviders(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSelectOrder = async (order) => {
        setLoading(true);
        try {
            const res = await api.get(`/purchases/orders/${order.id_orden_compra || order.id}`);
            const orderDetail = res.data;

            setFormData({
                ...formData,
                id_orden_compra: orderDetail.id_orden_compra,
                id_proveedor: orderDetail.id_proveedor,
                detalles: orderDetail.items.map(it => ({
                    id_repuesto: it.id_repuesto,
                    nombre_repuesto: it.nombre_repuesto,
                    id_detalle_oc: it.id_detalle,
                    cantidad: it.cantidad - (it.cantidad_recibida || 0),
                    costo_unitario: it.costo_unitario || 0,
                    bodega_id: '',
                    ubicacion_bodega_id: '',
                    available_locations: []
                }))
            });
            setShowOrderModal(false);
        } catch (e) {
            console.error(e);
            alert("Error al cargar detalles de la orden");
        } finally {
            setLoading(false);
        }
    };

    const handleWarehouseChange = async (idx, warehouseId) => {
        let whLocations = [];
        if (warehouseId) {
            try {
                const res = await api.get(`/settings/warehouses/${warehouseId}/locations`);
                whLocations = res.data;
            } catch (e) { console.error(e); }
        }

        const newDets = [...formData.detalles];
        newDets[idx] = {
            ...newDets[idx],
            bodega_id: warehouseId,
            available_locations: whLocations,
            ubicacion_bodega_id: ''
        };
        setFormData({ ...formData, detalles: newDets });
    };

    const handleSelectPart = (part) => {
        setFormData({
            ...formData,
            detalles: [...formData.detalles, {
                id_repuesto: part.id || part.id_repuesto,
                nombre_repuesto: part.nombre || part.nombre_repuesto,
                codigo_repuesto: part.codigo,
                sku: part.sku,
                id_detalle_oc: null,
                cantidad: 1,
                costo_unitario: part.costo_promedio || part.precio || 0,
                bodega_id: '',
                ubicacion_bodega_id: '',
                available_locations: []
            }]
        });
        setShowPartModal(false);
    };

    const handleScan = (code) => {
        // Search in parts list
        const part = parts.find(p => p.sku === code || p.codigo === code);

        if (part) {
            // Check if already in details
            const existingIdx = formData.detalles.findIndex(d => d.id_repuesto === part.id);

            if (existingIdx >= 0) {
                // Increment quantity
                const newDets = [...formData.detalles];
                newDets[existingIdx].cantidad += 1;
                setFormData({ ...formData, detalles: newDets });
                // alert(`Cantidad incrementada: ${part.nombre}`);
            } else {
                // Add new item
                handleSelectPart(part);
            }
        } else {
            alert(`Producto no encontrado con código: ${code}`);
        }
    };

    const calculateTotals = () => {
        const subtotal = formData.detalles.reduce((acc, it) => acc + (it.cantidad * it.costo_unitario), 0);
        const impuestos = subtotal * 0.07;
        const total = subtotal + impuestos;
        return { subtotal, impuestos, total };
    };

    const { subtotal, impuestos, total } = calculateTotals();

    const filteredOrders = (orders || []).filter(o =>
        o.codigo_compra?.toLowerCase().includes(orderSearch.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.id_proveedor || !formData.numero_factura || formData.detalles.length === 0) {
            alert("Por favor complete los campos obligatorios (Proveedor, Factura y al menos un item)");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                id_orden_compra: formData.id_orden_compra ? parseInt(formData.id_orden_compra) : null,
                id_proveedor: parseInt(formData.id_proveedor),
                subtotal,
                impuestos,
                total,
                detalles: formData.detalles.map(d => ({
                    id_repuesto: d.id_repuesto,
                    id_detalle_oc: d.id_detalle_oc,
                    cantidad: parseInt(d.cantidad),
                    costo_unitario: parseFloat(d.costo_unitario),
                    bodega_id: d.bodega_id ? parseInt(d.bodega_id) : null,
                    ubicacion_bodega_id: d.ubicacion_bodega_id ? parseInt(d.ubicacion_bodega_id) : null
                }))
            };

            await api.post('/purchases/invoices', payload);
            alert("Factura registrada correctamente");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al registrar factura: " + (error.response?.data || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Registrar Factura de Proveedor"
                width="max-w-5xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Selección de OC */}
                        <div className="col-span-1 md:col-span-3 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" /> Origen de la Compra
                                </h3>
                                {!formData.id_orden_compra && (
                                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase tracking-widest">
                                        Registro Independiente (Sin OC)
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowOrderModal(true)}
                                            className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 flex justify-between items-center hover:border-blue-500 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-600">
                                                    <ShoppingCart className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400">Vincular Orden...</div>
                                                    <div className="font-black text-slate-700 dark:text-slate-200">
                                                        {formData.id_orden_compra ?
                                                            orders.find(o => o.id_orden_compra === formData.id_orden_compra)?.codigo_compra || `OC #${formData.id_orden_compra}`
                                                            : 'Buscar Orden de Compra...'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Search className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                                        </button>
                                        {formData.id_orden_compra && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, id_orden_compra: '', detalles: [] })}
                                                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 transition-all"
                                                title="Quitar vinculación con OC"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Proveedor *</label>
                                    <select
                                        required
                                        value={formData.id_proveedor}
                                        onChange={(e) => setFormData({ ...formData, id_proveedor: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 font-bold"
                                    >
                                        <option value="">Seleccionar Proveedor...</option>
                                        {providers.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Número de Factura *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.numero_factura}
                                        onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                                        placeholder="Ej: FAC-00123"
                                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="w-full md:w-40">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha Emisión</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_emision}
                                        onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="col-span-1 md:col-span-3 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Detalle de Items a Facturar
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Repuesto</th>
                                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-24">Cant.</th>
                                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right w-32">Costo Unit.</th>
                                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider pl-4 w-64">Suministrar a Estructura (Bodega / Ubic.)</th>
                                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right w-32">Subtotal</th>
                                            <th className="pb-3 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {formData.detalles.length === 0 ? (
                                            <tr><td colSpan="6" className="py-8 text-center text-slate-400 italic font-medium">No hay items cargados. Haz clic en "Agregar Repuesto" para suministros sin orden.</td></tr>
                                        ) : formData.detalles.map((it, idx) => (
                                            <tr key={idx} className="group border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{it.nombre_repuesto || `Item #${it.id_repuesto}`}</div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{it.id_detalle_oc ? `Vínculo OC Detalle #${it.id_detalle_oc}` : 'Sin vínculo a OC'}</div>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <input
                                                        type="number"
                                                        value={it.cantidad}
                                                        onChange={(e) => {
                                                            const newDets = [...formData.detalles];
                                                            newDets[idx].cantidad = e.target.value;
                                                            setFormData({ ...formData, detalles: newDets });
                                                        }}
                                                        className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center font-bold text-sm"
                                                    />
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="text-slate-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={it.costo_unitario}
                                                            onChange={(e) => {
                                                                const newDets = [...formData.detalles];
                                                                newDets[idx].costo_unitario = e.target.value;
                                                                setFormData({ ...formData, detalles: newDets });
                                                            }}
                                                            className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-right font-bold text-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-4 pl-4">
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[10px] font-bold outline-none focus:border-blue-500"
                                                            value={it.bodega_id}
                                                            onChange={(e) => handleWarehouseChange(idx, e.target.value)}
                                                        >
                                                            <option value="">Bodega (Opcional)...</option>
                                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                                        </select>
                                                        <select
                                                            disabled={!it.bodega_id}
                                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-[10px] font-bold outline-none focus:border-blue-500 disabled:opacity-30"
                                                            value={it.ubicacion_bodega_id}
                                                            onChange={(e) => {
                                                                const newDets = [...formData.detalles];
                                                                newDets[idx].ubicacion_bodega_id = e.target.value;
                                                                setFormData({ ...formData, detalles: newDets });
                                                            }}
                                                        >
                                                            <option value="">Ubicación...</option>
                                                            {(it.available_locations || []).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right font-black text-slate-800 dark:text-white text-sm">
                                                    $ {(it.cantidad * it.costo_unitario).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4 text-right pr-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newDets = formData.detalles.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, detalles: newDets });
                                                        }}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-start">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPartSearch('');
                                        setShowPartModal(true);
                                    }}
                                    className="bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-800"
                                >
                                    <Plus className="w-4 h-4" /> Agregar Repuesto (Manual)
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Notas adicionales</label>
                            <textarea
                                value={formData.notas}
                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 resize-none text-sm"
                                placeholder="Notas internas o discrepancias observadas..."
                            />
                        </div>
                        <div className="col-span-1 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center gap-3">
                            <div className="flex justify-between text-sm text-slate-500 font-bold">
                                <span>Subtotal:</span>
                                <span>$ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500 font-bold">
                                <span>ITBMS (7%):</span>
                                <span>$ {impuestos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                            <div className="flex justify-between text-xl font-black text-slate-800 dark:text-white">
                                <span>TOTAL:</span>
                                <span className="text-blue-600">$ {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || formData.detalles.length === 0}
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                            >
                                {submitting ? 'Registrando...' : (
                                    <>
                                        <Save className="w-5 h-5" /> {formData.detalles.some(d => d.bodega_id) ? 'Guardar y Recibir' : 'Guardar Factura'}
                                    </>
                                )}
                            </button>

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLabelModal(true)}
                                    disabled={formData.detalles.length === 0}
                                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Printer className="w-4 h-4" /> Etiquetas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowScanner(true)}
                                    className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                                >
                                    <Scan className="w-4 h-4" /> Escanear
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Order Selection Modal */}
            <Modal
                isOpen={showOrderModal}
                onClose={() => setShowOrderModal(false)}
                title="Seleccionar Orden de Compra"
                zIndex={70}
            >
                <div className="flex flex-col h-[60vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar OC por código..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg font-bold"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando órdenes...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 italic font-bold">No se encontraron órdenes aprobadas</div>
                        ) : filteredOrders.map(order => (
                            <button
                                key={order.id_orden_compra}
                                onClick={() => handleSelectOrder(order)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-blue-500">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-tight">{order.codigo_compra}</h4>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-widest">{order.estado}</span>
                                            <span className="text-xs text-slate-500 font-bold">
                                                {new Date(order.fecha_solicitud).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-800 dark:text-white">$ {parseFloat(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{order.nombre_proveedor || `Prov ID: ${order.id_proveedor}`}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Part Selection Modal */}
            <Modal
                isOpen={showPartModal}
                onClose={() => setShowPartModal(false)}
                title="Seleccionar Repuesto / Suministro"
                zIndex={70}
            >
                <div className="flex flex-col h-[60vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={partSearch}
                            onChange={(e) => setPartSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg font-bold"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {parts.filter(p => p.nombre.toLowerCase().includes(partSearch.toLowerCase()) || p.codigo.toLowerCase().includes(partSearch.toLowerCase())).map(part => (
                            <button
                                key={part.id}
                                onClick={() => handleSelectPart(part)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">{part.nombre}</h4>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{part.codigo}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-800 dark:text-white">$ {parseFloat(part.costo_promedio || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock: {part.stock_actual || 0}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Barcode Scanner */}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Label Printer Modal */}
            <LabelPrinterModal
                isOpen={showLabelModal}
                onClose={() => setShowLabelModal(false)}
                items={formData.detalles}
            />
        </>
    );
};

export default InvoiceForm;
