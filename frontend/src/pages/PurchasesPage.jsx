import React, { useState, useEffect } from 'react';
import { purchaseService } from '../services/purchaseService';
import { providerService } from '../services/providerService'; // Assuming this exists or generic
import { inventoryService } from '../services/inventoryService'; // To pick parts
import { pdfGenerator } from '../utils/pdfGenerator';
import { Plus, Printer, ShoppingCart, Loader2 } from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';

const PurchasesPage = () => {
    const [purchases, setPurchases] = useState([]);
    const [providers, setProviders] = useState([]);
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Create Form State
    const [formData, setFormData] = useState({
        codigo_compra: '',
        id_proveedor: '',
        detalles: [] // { id_repuesto, cantidad, costo_unitario }
    });

    // Detailed Item State for Form
    const [currentItem, setCurrentItem] = useState({ id_repuesto: '', cantidad: 1, costo_unitario: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, provData, partsData] = await Promise.all([
                purchaseService.getAll(),
                providerService.getAll(),
                inventoryService.getAll()
            ]);
            setPurchases(pData);
            setProviders(provData);
            setParts(partsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!currentItem.id_repuesto) return;
        setFormData({
            ...formData,
            detalles: [...formData.detalles, { ...currentItem, id_repuesto: parseInt(currentItem.id_repuesto) }]
        });
        setCurrentItem({ id_repuesto: '', cantidad: 1, costo_unitario: 0 });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await purchaseService.create({
                ...formData,
                id_proveedor: parseInt(formData.id_proveedor),
                detalles: formData.detalles
            });
            setShowModal(false);
            fetchData();
            setFormData({ codigo_compra: '', id_proveedor: '', detalles: [] });
        } catch (error) {
            console.error("Error creating purchase", error);
        }
    };

    const handlePrint = (purchase) => {
        // Hydrate details with part names for PDF
        const hydratedDetails = purchase.details.map(d => {
            const part = parts.find(p => p.id_repuesto === d.id_repuesto);
            return { ...d, repuesto: part };
        });
        const provider = providers.find(p => p.id_proveedor === purchase.order.id_proveedor);

        pdfGenerator.generatePurchaseOrderPDF(purchase.order, hydratedDetails, provider);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Compra</h1>
                    <p className="text-slate-500 mt-1">Gestión de órdenes de compra y reabastecimiento</p>
                </div>
                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, detalles: [] }));
                        // setFormData(prev => ({ ...prev, codigo_compra: generateCode('OC-') })); // Removed: Auto-generated in backend
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    <Plus size={20} />
                    Nueva Solicitud
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {purchases.map(({ order, details }) => {
                        const provider = providers.find(p => p.id_proveedor === order.id_proveedor);
                        const total = details.reduce((acc, d) => acc + (d.cantidad * d.costo_unitario), 0);

                        return (
                            <div key={order.id_orden_compra} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-800">{order.codigo_compra || `OC #${order.id_orden_compra}`}</h3>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs uppercase font-bold">
                                            {order.estado}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Proveedor: <span className="font-medium text-slate-700">{provider?.nombre_empresa || 'Desconocido'}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {details.length} item(s) • Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handlePrint({ order, details })}
                                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-slate-200"
                                >
                                    <Printer size={18} />
                                    <span className="text-sm font-medium">PDF</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                        <h2 className="text-xl font-bold mb-4">Nueva Orden de Compra</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                {/* Code generation is now automatic in backend */}
                                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Compra (Auto)</label>
                                <input disabled value="Generado al guardar" className="w-full border rounded-lg px-3 py-2 bg-slate-100 text-slate-400 italic cursor-not-allowed" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                <select
                                    required
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.id_proveedor}
                                    onChange={(e) => setFormData({ ...formData, id_proveedor: e.target.value })}
                                >
                                    <option value="">Seleccionar Proveedor</option>
                                    {providers.map(p => (
                                        <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Agregar Item</h4>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-grow border rounded px-2 py-1 text-sm"
                                        value={currentItem.id_repuesto}
                                        onChange={(e) => setCurrentItem({ ...currentItem, id_repuesto: e.target.value })}
                                    >
                                        <option value="">Repuesto...</option>
                                        {parts.map(p => (
                                            <option key={p.id_repuesto} value={p.id_repuesto}>{p.nombre_repuesto}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Cant."
                                        className="w-20 border rounded px-2 py-1 text-sm"
                                        value={currentItem.cantidad}
                                        onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Costo"
                                        className="w-24 border rounded px-2 py-1 text-sm"
                                        value={currentItem.costo_unitario}
                                        onChange={(e) => setCurrentItem({ ...currentItem, costo_unitario: parseFloat(e.target.value) })}
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6 max-h-40 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-left">
                                        <tr><th className="p-2">Item</th><th className="p-2">Cant</th><th className="p-2">Costo</th></tr>
                                    </thead>
                                    <tbody>
                                        {formData.detalles.map((d, i) => {
                                            const part = parts.find(p => p.id_repuesto === d.id_repuesto);
                                            return (
                                                <tr key={i} className="border-b">
                                                    <td className="p-2">{part?.nombre_repuesto}</td>
                                                    <td className="p-2">{d.cantidad}</td>
                                                    <td className="p-2">${d.costo_unitario}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {formData.detalles.length === 0 && <p className="text-center text-slate-400 py-4 italic">No hay items agregados</p>}
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded py-2 hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="flex-1 bg-emerald-600 text-white rounded py-2 hover:bg-emerald-700">Generar Orden</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;
