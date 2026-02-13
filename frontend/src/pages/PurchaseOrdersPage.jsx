import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { purchaseQuotes } from '../services/api';
import {
    Plus, Search, FileText, ChevronLeft, Calendar,
    Truck, DollarSign, Package, Trash2, Save, X, Edit, Download, MoreVertical, CheckCircle, AlertCircle,
    Mail, Loader
} from 'lucide-react';
import Modal from '../components/Modal';
import { pdfGenerator } from '../utils/pdfGenerator';
import { purchaseService } from '../services/purchaseService';
import { providerService } from '../services/providerService';
import { inventoryService } from '../services/inventoryService';
import { paymentTermsService } from '../services/paymentTermsService';
import InvoiceForm from './InvoiceForm';

const PurchaseOrdersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Form State
    const [providers, setProviders] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [paymentTermsList, setPaymentTermsList] = useState([]);
    const [formData, setFormData] = useState({
        proveedor_id: '',
        fecha_entrega: '',
        terminos_pago: '',
        notas: '',
        items: []
    });

    // Modal State - Parts
    const [showPartModal, setShowPartModal] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    // Modal State - Providers
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providerSearch, setProviderSearch] = useState('');

    // Modal State - Invoices
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

    useEffect(() => {
        fetchOrders();
        checkQuotationConversion();
    }, [location.state]);

    const checkQuotationConversion = async () => {
        if (location.state?.fromQuoteId) {
            const quoteId = location.state.fromQuoteId;
            try {
                setLoading(true);
                // Clear state to avoid re-triggering
                navigate(location.pathname, { replace: true, state: {} });

                const { pData, invData, termsData } = await loadFormData();
                const quoteRes = await purchaseQuotes.getById(quoteId);
                const quote = quoteRes.data;

                setFormData({
                    proveedor_id: quote.proveedor_id?.toString() || '',
                    fecha_entrega: '',
                    terminos_pago: '',
                    notes: `Convertido de cotización ${quote.codigo}`,
                    items: quote.detalles.map(it => ({
                        repuesto_id: it.id_repuesto?.toString() || '',
                        repuesto_nombre: it.nombre_repuesto,
                        cantidad: it.cantidad,
                        costo_unitario: it.precio_unitario || 0,
                        impuesto: 7 // Default tax
                    }))
                });

                // Auto-set payment terms if provider found
                const provider = pData.find(p => p.id === quote.proveedor_id);
                if (provider?.metodos_pago_aceptados) {
                    setFormData(prev => ({ ...prev, terminos_pago: provider.metodos_pago_aceptados }));
                }

                setIsEditing(false);
                setCurrentOrderId(null);
                setShowForm(true);
                setIsDirty(true);
            } catch (error) {
                alert("Error al cargar datos de la cotización");
            } finally {
                setLoading(false);
            }
        }
    };

    const fetchOrders = async () => {
        try {
            const data = await purchaseService.getAll();
            setOrders(data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const loadFormData = async () => {
        try {
            const [pData, invData, termsData] = await Promise.all([
                providerService.getAll(),
                inventoryService.getAll(),
                paymentTermsService.getAll()
            ]);
            setProviders(pData);
            setAvailableParts(invData);
            setPaymentTermsList(termsData);
            return { pData, invData, termsData };
        } catch (error) {
            console.error("Error loading form dependencies", error);
            return { pData: [], invData: [] };
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            proveedor_id: '',
            fecha_entrega: '',
            terminos_pago: '',
            notas: '',
            items: []
        });
        setIsEditing(false);
        setCurrentOrderId(null);
        loadFormData();
        setShowForm(true);
        setIsDirty(false);
    };

    const handleEdit = async (order) => {
        try {
            setLoading(true);
            const { pData, invData, termsData } = await loadFormData();
            const orderDetail = await purchaseService.getById(order.id_orden_compra);

            setFormData({
                proveedor_id: orderDetail.id_proveedor?.toString() || '',
                fecha_entrega: orderDetail.fecha_entrega || '',
                terminos_pago: orderDetail.terminos_pago || '',
                notas: orderDetail.notas || '',
                items: orderDetail.items.map(it => ({
                    repuesto_id: it.id_repuesto.toString(),
                    repuesto_nombre: it.nombre_repuesto,
                    cantidad: it.cantidad,
                    costo_unitario: it.costo_unitario || 0,
                    impuesto: 0 // We might need to store tax per item in schema later
                }))
            });

            setIsEditing(true);
            setCurrentOrderId(order.id_orden_compra);
            setShowForm(true);
            setIsDirty(false);
        } catch (error) {
            console.error("Error loading order for edit", error);
            alert("Error al cargar la orden para editar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta orden de compra?")) {
            try {
                await purchaseService.delete(id);
                fetchOrders();
            } catch (error) {
                console.error("Error deleting order", error);
                alert("Error al eliminar la orden");
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await purchaseService.updateStatus(id, newStatus);
            fetchOrders();
        } catch (error) {
            console.error("Error updating status", error);
            alert("Error al actualizar el estado");
        }
    };

    const handleDownloadPDF = async (order) => {
        try {
            const orderDetail = await purchaseService.getById(order.id_orden_compra);
            const provider = providers.find(p => p.id === orderDetail.id_proveedor);
            await pdfGenerator.generatePurchaseOrderPDF(orderDetail, orderDetail.items, provider);
        } catch (error) {
            console.error("Error generating PDF", error);
            alert("Error al generar el PDF");
        }
    };

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedOrderForEmail, setSelectedOrderForEmail] = useState(null);
    const [targetEmail, setTargetEmail] = useState('');
    const [sendingEmailId, setSendingEmailId] = useState(null);

    const handleSendEmailClick = async (order) => {
        try {
            const orderDetail = await purchaseService.getById(order.id_orden_compra);
            const provider = providers.find(p => p.id === orderDetail.id_proveedor);
            setSelectedOrderForEmail(orderDetail);
            setTargetEmail(provider?.email || '');
            setShowEmailModal(true);
        } catch (error) {
            console.error("Error loading order for email", error);
        }
    };

    const handleConfirmSendEmail = async () => {
        if (!selectedOrderForEmail) return;

        setShowEmailModal(false);
        setSendingEmailId(selectedOrderForEmail.id_orden_compra);

        try {
            const orderDetail = selectedOrderForEmail;
            const provider = providers.find(p => p.id === orderDetail.id_proveedor);

            // Generate PDF Blob
            const pdfBlob = await pdfGenerator.generatePurchaseOrderPDF(orderDetail, orderDetail.items, provider, true); // true = return blob

            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];

                try {
                    await purchaseService.sendEmail(orderDetail.id_orden_compra, {
                        pdf_base64: base64data,
                        email: targetEmail
                    });
                    alert('Correo enviado exitosamente (con copia a su correo)');
                    fetchOrders();
                } catch (error) {
                    console.error('Error sending email:', error);
                    alert('Error al enviar el correo');
                } finally {
                    setSendingEmailId(null);
                    setSelectedOrderForEmail(null);
                }
            };
        } catch (error) {
            console.error('Error generating PDF for email:', error);
            setSendingEmailId(null);
            alert('Error generando el PDF para enviar');
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { repuesto_id: '', repuesto_nombre: '', cantidad: 1, costo_unitario: 0, impuesto: 7 }]
        }));
        setIsDirty(true);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData(prev => ({ ...prev, items: newItems }));
        setIsDirty(true);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
        setIsDirty(true);
    };

    const handleOpenPartModal = (index) => {
        setActiveItemIndex(index);
        setModalSearch('');
        setShowPartModal(true);
    };

    const handleSelectPart = (part) => {
        const newItems = [...formData.items];
        newItems[activeItemIndex] = {
            ...newItems[activeItemIndex],
            repuesto_id: part.id.toString(),
            repuesto_nombre: part.nombre,
            costo_unitario: part.precio || 0
        };
        setFormData(prev => ({ ...prev, items: newItems }));
        setIsDirty(true);
        setShowPartModal(false);
    };

    const filteredParts = availableParts.filter(p =>
        p.nombre.toLowerCase().includes(modalSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(modalSearch.toLowerCase())
    );

    const filteredProviders = providers.filter(p =>
        p.nombre.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.nit?.toLowerCase().includes(providerSearch.toLowerCase())
    );

    const handleSelectProvider = (provider) => {
        setFormData({
            ...formData,
            proveedor_id: provider.id.toString(),
            terminos_pago: provider.metodos_pago_aceptados || formData.terminos_pago
        });
        setIsDirty(true);
        setShowProviderModal(false);
    };

    const getSelectedProviderName = () => {
        const provider = providers.find(p => p.id.toString() === formData.proveedor_id);
        return provider ? provider.nombre : 'Seleccionar Proveedor...';
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((acc, item) => acc + (parseFloat(item.cantidad) * parseFloat(item.costo_unitario)), 0);
        const impuestos = formData.items.reduce((acc, item) => {
            const itemSubtotal = parseFloat(item.cantidad) * parseFloat(item.costo_unitario);
            const itemTax = itemSubtotal * (parseFloat(item.impuesto || 0) / 100);
            return acc + itemTax;
        }, 0);
        const total = subtotal + impuestos;
        return { subtotal, impuestos, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { subtotal, impuestos, total } = calculateTotals();
        const payload = {
            ...formData,
            proveedor_id: parseInt(formData.proveedor_id),
            fecha_entrega: formData.fecha_entrega || null, // Handle empty string for date
            items: formData.items.map(it => ({
                repuesto_id: parseInt(it.repuesto_id),
                cantidad: parseInt(it.cantidad),
                costo_unitario: parseFloat(it.costo_unitario),
                impuesto: parseFloat(it.impuesto) || 0
            })),
            subtotal,
            impuestos,
            total
        };

        try {
            if (isEditing) {
                await purchaseService.update(currentOrderId, payload);
            } else {
                await purchaseService.create(payload);
            }
            setFormData({ proveedor_id: '', fecha_entrega: '', terminos_pago: '', notas: '', items: [] });
            setShowForm(false);
            setIsDirty(false);
            fetchOrders();
        } catch (error) {
            console.error("Error saving order", error);
            alert(`Error al ${isEditing ? 'actualizar' : 'crear'} la orden de compra`);
        }
    };

    // Calculate totals for display
    const { subtotal, impuestos, total } = calculateTotals();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Órdenes de Compra</h2>
                    <p className="text-slate-500 text-sm">Gestiona suministros y repuestos</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar orden..."
                            className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none"
                        />
                    </div>
                    <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nueva Orden
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Proveedor</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-8">No hay órdenes registradas</td></tr>
                        ) : orders.map((o) => (
                            <tr key={o.id_orden_compra} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-mono font-bold text-blue-600">{o.codigo_compra}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                    {o.nombre_proveedor || (o.id_proveedor ? `Proveedor #${o.id_proveedor}` : 'N/A')}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{o.fecha_solicitud || 'N/A'}</td>
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">${parseFloat(o.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={o.estado}
                                        onChange={(e) => handleStatusChange(o.id_orden_compra, e.target.value)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase outline-none border-none cursor-pointer ${o.estado === 'RECIBIDA' ? 'bg-green-100 text-green-700' :
                                            o.estado === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                                o.estado === 'APROBADA' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        <option value="PENDIENTE">PENDIENTE</option>
                                        <option value="APROBADA">APROBADA</option>
                                        <option value="ENVIADA">ENVIADA</option>
                                        <option value="RECIBIDA">RECIBIDA</option>
                                        <option value="CANCELADA">CANCELADA</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {o.estado !== 'CANCELADA' && (
                                            <button
                                                onClick={() => navigate(`/purchases/receive/${o.id_orden_compra}`)}
                                                title="Recibir Mercancía"
                                                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg text-green-600 transition-colors"
                                            >
                                                <Package className="w-4 h-4" />
                                            </button>
                                        )}
                                        {(o.estado === 'APROBADA' || o.estado === 'ENVIADA') && (
                                            <button
                                                onClick={() => {
                                                    setSelectedOrderForInvoice(o.id_orden_compra);
                                                    setShowInvoiceForm(true);
                                                }}
                                                title="Registrar Factura"
                                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg text-blue-600 transition-colors"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownloadPDF(o)}
                                            title="Descargar PDF"
                                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg text-blue-500 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleSendEmailClick(o)}
                                            disabled={sendingEmailId === o.id_orden_compra}
                                            className={`p-2 rounded-lg transition-colors ${sendingEmailId === o.id_orden_compra ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                            title="Enviar por Correo"
                                        >
                                            {sendingEmailId === o.id_orden_compra ? <Loader className="animate-spin w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(o)}
                                            title="Editar Orden"
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(o.id_orden_compra)}
                                            title="Eliminar Orden"
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-red-500 transition-colors"
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

            {/* Main Form Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
                width="max-w-7xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información General */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Información General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Código</label>
                                <input disabled className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-400" placeholder="(Generado al guardar)" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Proveedor</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProviderSearch('');
                                        setShowProviderModal(true);
                                    }}
                                    className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex justify-between items-center hover:border-blue-400 transition-colors text-left"
                                >
                                    <span className={formData.proveedor_id ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                                        {getSelectedProviderName()}
                                    </span>
                                    <Search className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Fecha Emisión</label>
                                <input disabled value={new Date().toLocaleDateString()} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Fecha Entrega</label>
                                <input
                                    type="date"
                                    value={formData.fecha_entrega}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fecha_entrega: e.target.value });
                                        setIsDirty(true);
                                    }}
                                    className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Términos de Pago</label>
                            <select
                                value={formData.terminos_pago}
                                onChange={(e) => {
                                    setFormData({ ...formData, terminos_pago: e.target.value });
                                    setIsDirty(true);
                                }}
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none max-w-md font-bold"
                            >
                                <option value="">Seleccionar...</option>
                                {paymentTermsList.map(term => (
                                    <option key={term.id} value={term.nombre}>{term.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Items
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" /> Agregar Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="pb-3 pr-4">Producto / Repuesto</th>
                                        <th className="pb-3 px-4 w-32">Cantidad</th>
                                        <th className="pb-3 px-4 w-40">Costo Unit.</th>
                                        <th className="pb-3 px-4 w-40">Impuesto</th>
                                        <th className="pb-3 pl-4 w-40 text-right">Subtotal</th>
                                        <th className="pb-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {formData.items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">No hay items agregados</td>
                                        </tr>
                                    ) : formData.items.map((item, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="py-3 pr-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPartModal(idx)}
                                                    className="w-full text-left bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex justify-between items-center hover:border-blue-400 transition-colors"
                                                >
                                                    <span className={item.repuesto_nombre ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                                                        {item.repuesto_nombre ? `${item.repuesto_nombre} (${availableParts.find(p => p.id.toString() === item.repuesto_id)?.codigo || ''})` : 'Seleccionar Repuesto...'}
                                                    </span>
                                                    <Search className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.cantidad}
                                                    onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-center"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.costo_unitario}
                                                        onChange={(e) => handleItemChange(idx, 'costo_unitario', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 pl-5 text-right"
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="relative">
                                                    <select
                                                        value={item.impuesto}
                                                        onChange={(e) => handleItemChange(idx, 'impuesto', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-center outline-none focus:border-blue-500"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="7">7%</option>
                                                        <option value="10">10%</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="py-3 pl-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                                ${(item.cantidad * item.costo_unitario * (1 + (parseFloat(item.impuesto) || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resumen y Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-2">Notas</label>
                            <textarea
                                value={formData.notas}
                                onChange={(e) => {
                                    setFormData({ ...formData, notas: e.target.value });
                                    setIsDirty(true);
                                }}
                                className="w-full h-32 bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none resize-none"
                                placeholder="Notas internas o instrucciones..."
                            />
                        </div>
                        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Impuestos:</span>
                                    <span>${impuestos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                                <div className="flex justify-between text-xl font-black">
                                    <span>Total:</span>
                                    <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Part Selection Modal */}
            <Modal
                isOpen={showPartModal}
                onClose={() => setShowPartModal(false)}
                title="Seleccionar Repuesto"
                zIndex={60}
            >
                <div className="flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar repuesto por nombre o código..."
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredParts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No se encontraron resultados para "{modalSearch}"
                            </div>
                        ) : (
                            filteredParts.map(part => (
                                <button
                                    key={part.id}
                                    onClick={() => handleSelectPart(part)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            {part.imagen ? (
                                                <img src={`${part.imagen}`} alt="" className="w-10 h-10 object-cover rounded shadow-sm" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{part.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{part.codigo}</span>
                                                <span className="text-xs text-slate-400 truncate max-w-[200px]">{part.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${part.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            EST: {part.stock}
                                        </span>
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                            ${parseFloat(part.precio || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal ml-0.5">P/V</span>
                                        </span>
                                    </div>
                                </button>
                            )
                            ))}
                    </div>
                </div>
            </Modal>

            {/* Provider Selection Modal */}
            <Modal
                isOpen={showProviderModal}
                onClose={() => setShowProviderModal(false)}
                title="Seleccionar Proveedor"
                zIndex={60}
            >
                <div className="flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar proveedor por nombre o NIT..."
                            value={providerSearch}
                            onChange={(e) => setProviderSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredProviders.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No se encontraron resultados para "{providerSearch}"
                            </div>
                        ) : (
                            filteredProviders.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            <Truck className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{provider.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">NIT: {provider.nit}</span>
                                                <span className="text-xs text-slate-400">{provider.correo}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-400 rotate-180 transition-colors" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            <InvoiceForm
                isOpen={showInvoiceForm}
                initialOrderId={selectedOrderForInvoice}
                onClose={() => {
                    setShowInvoiceForm(false);
                    setSelectedOrderForInvoice(null);
                }}
                onSuccess={fetchOrders}
            />

            {/* Email Confirmation Modal */}
            <Modal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSave={handleConfirmSendEmail}
                title="Confirmar Envío de Orden de Compra"
            >
                <div className="p-4 space-y-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Se enviará la orden de compra <strong>{selectedOrderForEmail?.codigo_compra}</strong>.
                        <br />
                        Por favor, verifique el correo del destinatario:
                    </p>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Correo del Proveedor</label>
                        <input
                            type="email"
                            className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-800 dark:text-slate-200"
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            placeholder="ejemplo@proveedor.com"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Se enviará una copia automática a su dirección de correo.
                        </p>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default PurchaseOrdersPage;
