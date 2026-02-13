import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Package, ArrowLeft, Archive, Check, AlertCircle, Scan, MapPin,
    Save, ChevronRight, Truck, Calendar, Printer, Box, FileText, ShoppingCart
} from 'lucide-react';
import api from '../services/api';

const InvoiceReceivingPage = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Config Lists
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        fetchInvoiceData();
        fetchConfigData();
    }, [invoiceId]);

    const fetchInvoiceData = async () => {
        try {
            const res = await api.get('/purchases/invoices');
            const currentInvoice = res.data.find(inv => inv.id === parseInt(invoiceId));
            setInvoice(currentInvoice);

            // Fetch details (We need a way to get details of one invoice)
            // Currently backend get_invoices returns all, but create_invoice returns details.
            // I should have a GET /purchases/invoices/{id} in backend.
            // Let's assume I'll add it or I'll just fetch all and find (but all doesn't have details in current DTO).
            // WAIT, I need to add GET /purchases/invoices/{id} to backend!

            const detailRes = await api.get(`/purchases/invoices/${invoiceId}`); // I'll add this endpoint
            setItems(detailRes.data.detalles.map(it => ({
                ...it,
                cantidad_recibir: it.cantidad, // Default to full invoice quantity
                bodega_id_selected: '',
                ubicacion_id_selected: ''
            })));
        } catch (error) {
            console.error("Error fetching invoice", error);
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
            if (item.id === id_detalle) {
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
            if (item.id === id_detalle) {
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
            if (item.id === id_detalle) {
                return { ...item, ubicacion_id_selected: locationId };
            }
            return item;
        }));
    };

    const handleSubmit = async () => {
        if (!confirm("¿Confirmar recepción de mercancía seleccionada? Esto actualizará el inventario.")) return;

        setSubmitting(true);
        try {
            const payload = {
                items: items
                    .filter(i => i.cantidad_recibir > 0)
                    .map(i => ({
                        id_detalle: i.id,
                        cantidad_recibir: parseInt(i.cantidad_recibir),
                        bodega_id: i.bodega_id_selected ? parseInt(i.bodega_id_selected) : null,
                        ubicacion_bodega_id: i.ubicacion_id_selected ? parseInt(i.ubicacion_id_selected) : null
                    }))
            };

            await api.post(`/purchases/invoices/${invoiceId}/receive`, payload);
            alert("Recepción procesada correctamente.");
            navigate('/purchases/invoices');
        } catch (error) {
            console.error("Error submitting reception", error);
            alert("Error al procesar recepción: " + (error.response?.data || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 min-h-screen font-bold uppercase tracking-widest text-slate-400">Cargando factura...</div>;
    if (!invoice) return <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 min-h-screen">Factura no encontrada</div>;

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
                                    Recibir Factura
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                                        {invoice.numero_factura}
                                    </span>
                                    <span className="text-slate-400 font-bold ml-2">
                                        {invoice.nombre_proveedor || `Prov ID: ${invoice.id_proveedor}`}
                                    </span>
                                </h1>
                                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-0.5 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1 font-bold"><ShoppingCart className="w-3 h-3 text-blue-500" /> OC: {invoice.id_orden_compra}</span>
                                    <span className="flex items-center gap-1 font-bold"><Calendar className="w-3 h-3 text-blue-500" /> Emisión: {new Date(invoice.fecha_emision).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || items.filter(i => i.cantidad_recibir > 0).length === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                            >
                                <Check className="w-5 h-5" /> Finalizar Recepción
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-3">
                        <div className="col-span-5">Repuesto / Item de Factura</div>
                        <div className="col-span-1 text-center">Facturado</div>
                        <div className="col-span-2 text-center">Ingresar Ahora</div>
                        <div className="col-span-4 pl-4 text-left">Destino (Bodega / Ubicación)</div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {items.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="col-span-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                        <Package className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{item.nombre_repuesto || `Repuesto #${item.id_repuesto}`}</div>
                                        <div className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded inline-block mt-1">ID: {item.id_repuesto}</div>
                                    </div>
                                </div>

                                <div className="col-span-1 text-center text-lg font-black text-slate-700 dark:text-slate-300">
                                    {item.cantidad}
                                </div>

                                <div className="col-span-2 flex justify-center px-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.cantidad}
                                        value={item.cantidad_recibir}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="w-24 px-3 py-2.5 text-center font-black text-xl border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-blue-600"
                                    />
                                </div>

                                <div className="col-span-4 pl-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Box className="w-4 h-4 text-slate-300" />
                                        <select
                                            className="flex-1 text-xs font-bold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
                                            value={item.bodega_id_selected}
                                            onChange={(e) => handleWarehouseChange(item.id, e.target.value)}
                                        >
                                            <option value="">Seleccionar Bodega...</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
                                        <MapPin className="w-4 h-4 text-slate-300" />
                                        <select
                                            className="flex-1 text-xs font-bold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 disabled:opacity-50"
                                            value={item.ubicacion_id_selected}
                                            onChange={(e) => handleLocationChange(item.id, e.target.value)}
                                            disabled={!item.bodega_id_selected}
                                        >
                                            <option value="">Seleccionar Ubicación...</option>
                                            {(item.available_locations || []).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                        <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Importante</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 font-medium leading-relaxed">
                            Al finalizar la recepción, los repuestos se sumarán al stock actual de las bodegas seleccionadas.
                            Este proceso generará movimientos de inventario de tipo <strong>ENTRADA POR FACTURA</strong> y actualizará el saldo pendiente de la Orden de Compra original.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceReceivingPage;
