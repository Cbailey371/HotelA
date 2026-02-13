import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Search, Filter, ArrowUpRight, CheckCircle2,
    Clock, AlertCircle, ShoppingCart, Truck, Calendar, ChevronRight, Trash2
} from 'lucide-react';
import api from '../services/api';
import { purchaseInvoicesService } from '../services/purchaseInvoicesService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import InvoiceForm from './InvoiceForm';

const PurchasesInvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const data = await purchaseInvoicesService.getAll();
            setInvoices(data);
        } catch (error) {
            console.error("Error fetching invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (inv) => {
        const isReceived = inv.estado === 'RECIBIDA';
        const confirmMessage = isReceived
            ? "⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\nEsta factura ya fue RECIBIDA y el stock ingresado.\n\nAl eliminarla:\n1. Se REVERTIRÁ el stock de todos los artículos (se restará lo ingresado).\n2. Se actualizará la Orden de Compra asociada (si tiene).\n3. Se generará un movimiento de 'ANULACION_FACTURA'.\n\n¿Estás SEGURO de continuar?"
            : "¿Estás seguro de eliminar esta factura permanentemente?";

        if (!window.confirm(confirmMessage)) return;

        try {
            await purchaseInvoicesService.delete(inv.id);
            fetchInvoices(); // Refresh list
        } catch (error) {
            console.error("Error deleting invoice", error);
            alert(error.response?.data || "Error al eliminar la factura");
        }
    };

    const handleEdit = async (inv) => {
        const newNotes = prompt("Editar Notas Internas:", inv.notas || "");
        if (newNotes !== null && newNotes !== inv.notas) {
            try {
                await purchaseInvoicesService.update(inv.id, { notas: newNotes });
                fetchInvoices();
            } catch (error) {
                console.error("Error updating invoice", error);
                alert("Error al actualizar la factura");
            }
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.numero_factura.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RECIBIDA': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDIENTE': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'ANULADA': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Facturas de Compra</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Registro y control de recepción de mercancía</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus className="w-4 h-4" /> Registrar Factura
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">{invoices.filter(i => i.estado === 'PENDIENTE').length}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendientes de Recibo</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/10 rounded-lg flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">{invoices.filter(i => i.estado === 'RECIBIDA').length}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recibidas Totalmente</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white">{invoices.length}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Facturas</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por número de factura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Factura / OC</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Proveedor</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha Emisión</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Total</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold">Cargando facturas...</td></tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">No se encontraron facturas.</td></tr>
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{inv.numero_factura}</span>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                                                <ShoppingCart className="w-3 h-3" />
                                                ID OC: {inv.id_orden_compra}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                            <Truck className="w-4 h-4 text-blue-500" />
                                            {inv.nombre_proveedor || `Proveedor #${inv.id_proveedor}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(inv.fecha_emision).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-slate-800 dark:text-white">$ {parseFloat(inv.total).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(inv.estado)}`}>
                                            {inv.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.estado === 'RECIBIDA' && (
                                            <div className="text-xs font-bold text-slate-400 flex items-center gap-1 justify-end mb-2">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Stock Actualizado
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-2">
                                            {inv.estado === 'PENDIENTE' && (
                                                <button
                                                    onClick={() => navigate(`/purchases/invoices/receive/${inv.id}`)}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-green-600/20 flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Recibir
                                                </button>
                                            )}

                                            {/* SUPER-ADMIN Actions */}
                                            {user?.role === 'SUPER-ADMIN' && (
                                                <>
                                                    {(inv.estado === 'PENDIENTE' || inv.estado === 'RECIBIDA') && (
                                                        <button
                                                            onClick={() => handleEdit(inv)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                            title="Editar Notas"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(inv)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                        title={inv.estado === 'RECIBIDA' ? "Revertir y Eliminar" : "Eliminar"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <InvoiceForm
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={fetchInvoices}
            />
        </div>
    );
};

export default PurchasesInvoicesPage;
