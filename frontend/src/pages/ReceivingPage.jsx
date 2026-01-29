import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package, ArrowLeft, Archive, Check, AlertCircle, Scan, MapPin,
    Save, ChevronRight, Truck, Calendar, Printer, Box
} from 'lucide-react';
import api from '../services/api';
import BarcodeScanner from '../components/BarcodeScanner';
import { generateLabelsPDF } from '../utils/labelPrinter';

const ReceivingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    // Config Lists
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        fetchOrderData();
        fetchConfigData();
    }, [orderId]);

    const fetchOrderData = async () => {
        try {
            const res = await api.get(`/purchases/orders/${orderId}`);
            setOrder(res.data);

            // Transform items to include receiving state
            const initialItems = res.data.items.map(item => ({
                ...item,
                cantidad_recibir: 0, // Input field
                bodega_id_selected: '', // Select
                ubicacion_id_selected: '', // Select
                // Calculated fields
                // Use updated field or calculation if backend doesn't send it yet (but we updated backend)
                // If backend dto doesn't have quantità_recibida, we might need to update dto in backend controller too for get_order_by_id?
                // Wait, I didn't update OrderDetailWithPartDto in get_order_by_id!
                // Ah, let's assume we can fetch it or I need to update backend GET too.
                // Step 8910 updated receive endpoint but did I update GET DTO?
                // Checking Step 8857 (original file). get_order_by_id returns OrderWithDetailsDto -> OrderDetailWithPartDto.
                // OrderDetailWithPartDto struct (lines 69-77) DOES NOT have cantidad_recibida.
                // I need to update backend GET DTO!
                pendiente: item.cantidad - (item.cantidad_recibida || 0)
            }));
            setItems(initialItems);
        } catch (error) {
            console.error("Error fetching order", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfigData = async () => {
        try {
            const res = await api.get('/settings/warehouses');
            setWarehouses(res.data);
        } catch (error) {
            console.error("Error config", error);
        }
    };

    const handleQuantityChange = (id_detalle, val) => {
        setItems(prev => prev.map(item => {
            if (item.id_detalle === id_detalle) {
                const numVal = parseInt(val) || 0;
                return { ...item, cantidad_recibir: numVal };
            }
            return item;
        }));
    };

    const handleWarehouseChange = async (id_detalle, warehouseId) => {
        let whLocations = [];
        if (warehouseId) {
            try {
                const res = await api.get(`/settings/warehouses/${warehouseId}/locations`);
                whLocations = res.data;
            } catch (e) { console.error(e); }
        }

        setItems(prev => prev.map(item => {
            if (item.id_detalle === id_detalle) {
                return {
                    ...item,
                    bodega_id_selected: warehouseId,
                    available_locations: whLocations,
                    ubicacion_id_selected: ''
                };
            }
            return item;
        }));
    };

    const handleLocationChange = (id_detalle, locationId) => {
        setItems(prev => prev.map(item => {
            if (item.id_detalle === id_detalle) {
                return { ...item, ubicacion_id_selected: locationId };
            }
            return item;
        }));
    };

    const handleScan = (code) => {
        // Find item by code (exact match)
        const itemIndex = items.findIndex(i => i.codigo_repuesto === code);

        if (itemIndex !== -1) {
            const item = items[itemIndex];
            const pendiente = item.pendiente;

            if (item.cantidad_recibir < pendiente) {
                // Increment
                handleQuantityChange(item.id_detalle, item.cantidad_recibir + 1);
                // Optional: Feedback (Toast or Sound)
                // For now, let's close scanner to show result or keep open? 
                // Keep open for bulk scanning is better.
                // Just highlight maybe?

                // Play a generic system beep if possible (browsers block this usually without interaction)
                // Simplified feedback:
                /* alert(`Escaneado: ${item.nombre_repuesto}`); // Too intrusive */
            } else {
                alert(`El item ${item.nombre_repuesto} ya está completo en esta recepción.`);
            }
        } else {
            alert(`Código no encontrado en esta orden: ${code}`);
        }
    };

    const handlePrintLabels = () => {
        // Print all items in order
        generateLabelsPDF(items);
    };

    const handleSubmit = async () => {
        if (!confirm("¿Confirmar recepción de mercancía seleccionada? Esto actualizará el inventario.")) return;

        setSubmitting(true);
        try {
            const payload = {
                items: items
                    .filter(i => i.cantidad_recibir > 0)
                    .map(i => ({
                        id_detalle: i.id_detalle,
                        cantidad_recibir: i.cantidad_recibir,
                        bodega_id: i.bodega_id_selected ? parseInt(i.bodega_id_selected) : null,
                        ubicacion_bodega_id: i.ubicacion_id_selected ? parseInt(i.ubicacion_id_selected) : null
                    }))
            };

            await api.post(`/purchases/orders/${orderId}/receive`, payload);
            alert("Recepción procesada correctamente.");
            navigate('/purchases');
        } catch (error) {
            console.error("Error submitting reception", error);
            alert("Error al procesar recepción: " + (error.response?.data || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-slate-50 min-h-screen">Cargando orden...</div>;
    if (!order) return <div className="p-8 text-center bg-slate-50 min-h-screen">Orden no encontrada</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    Recepción de Mercancía
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                                        {order.codigo_compra || `OC-${order.id_orden_compra}`}
                                    </span>
                                </h1>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Proveedor ID: {order.id_proveedor}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Solicitado: {order.fecha_solicitud ? new Date(order.fecha_solicitud).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrintLabels}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                <Printer className="w-4 h-4" /> Etiquetas
                            </button>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-blue-500/20"
                            >
                                <Scan className="w-4 h-4" /> Escanear Código
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
                    <div className="p-1 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-wider text-slate-400 px-6 py-2">
                        <div className="col-span-4">Producto / SKU</div>
                        <div className="col-span-1 text-center">Pedido</div>
                        <div className="col-span-1 text-center">Recibido</div>
                        <div className="col-span-1 text-center">Pendiente</div>
                        <div className="col-span-2 text-center">Ingresar Ahora</div>
                        <div className="col-span-3 text-left pl-4">Destino (Bodega / Ubicación)</div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item) => {
                            const itemRecibido = item.cantidad_recibida || 0; // Now accurate from backend
                            // Recalculate pendiente dynamically based on input? No, based on committed.
                            const pendienteReal = item.cantidad - itemRecibido;
                            const isComplete = pendienteReal <= 0;

                            return (
                                <div key={item.id_detalle} className={`grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${isComplete ? 'opacity-60 grayscale' : ''}`}>

                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                                            <Package className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.nombre_repuesto || `Item #${item.id_repuesto}`}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{item.codigo_repuesto || 'SIN-CODIGO'}</div>
                                        </div>
                                    </div>

                                    <div className="col-span-1 text-center text-sm font-medium text-slate-600">{item.cantidad}</div>
                                    <div className="col-span-1 text-center text-sm font-medium text-slate-600">{itemRecibido}</div>
                                    <div className="col-span-1 text-center">
                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {isComplete ? <Check className="w-3 h-3 mr-1" /> : null}
                                            {pendienteReal}
                                        </span>
                                    </div>

                                    <div className="col-span-2 flex justify-center">
                                        {!isComplete && (
                                            <input
                                                type="number"
                                                min="0"
                                                max={pendienteReal}
                                                value={item.cantidad_recibir || ''}
                                                onChange={(e) => handleQuantityChange(item.id_detalle, e.target.value)}
                                                className={`w-24 px-3 py-2 text-center font-bold text-lg border-2 rounded-xl outline-none transition-all ${item.cantidad_recibir > 0 ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                                                placeholder="0"
                                            />
                                        )}
                                        {isComplete && <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Completado</span>}
                                    </div>

                                    <div className="col-span-3 space-y-2">
                                        {!isComplete && (
                                            <>
                                                <select
                                                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500"
                                                    value={item.bodega_id_selected}
                                                    onChange={(e) => handleWarehouseChange(item.id_detalle, e.target.value)}
                                                >
                                                    <option value="">Bodega...</option>
                                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                                </select>

                                                <select
                                                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 disabled:opacity-50"
                                                    value={item.ubicacion_id_selected}
                                                    onChange={(e) => handleLocationChange(item.id_detalle, e.target.value)}
                                                    disabled={!item.bodega_id_selected}
                                                >
                                                    <option value="">Ubicación...</option>
                                                    {(item.available_locations || []).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 p-4 z-40">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            Items a recibir: <strong className="text-slate-800 dark:text-white">{items.filter(i => i.cantidad_recibir > 0).length}</strong>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-6 py-2.5 text-slate-600 font-bold text-sm hover:underline">Guardar Borrador</button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || items.filter(i => i.cantidad_recibir > 0).length === 0}
                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                            >
                                {submitting ? 'Procesando...' : (
                                    <>
                                        <Check className="w-5 h-5" /> Finalizar Recepción
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default ReceivingPage;
