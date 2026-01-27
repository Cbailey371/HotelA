import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowUpRight, ArrowDownRight, TrendingUp, Upload, Download
} from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';
import { inventoryService } from '../services/inventoryService';

const InventoryPage = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialForm = {
        codigo_repuesto: '',
        nombre_repuesto: '',
        descripcion: '',
        categoria: 'Mecánico',
        marca_compatible: '',
        stock_actual: 0,
        stock_minimo: 1,
        unidad_medida: 'unidades',
        precio_unitario: 0.0,
        ubicacion_almacen: ''
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchParts();
    }, []);

    const handleDownloadTemplate = async () => {
        try {
            const blob = await inventoryService.getTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla_inventario.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading template", error);
        }
    };

    const handleCsvImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);
        try {
            await inventoryService.importCsv(formData);
            alert("Inventario importado correctamente");
            fetchParts();
        } catch (error) {
            console.error("Error importing CSV", error);
            alert("Error al importar CSV");
        } finally {
            setLoading(false);
        }
    };

    const fetchParts = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/inventory');
            setParts(res.data);
        } catch (error) {
            console.error("Error fetching inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('stock') || name.includes('precio') ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPart) {
                await axios.put(`http://localhost:3000/api/inventory/${editingPart.id}`, formData);
            } else {
                await axios.post('http://localhost:3000/api/inventory', formData);
            }
            setShowModal(false);
            fetchParts();
        } catch (error) {
            console.error("Error saving part", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este repuesto del inventario?')) {
            try {
                await axios.delete(`http://localhost:3000/api/inventory/${id}`);
                fetchParts();
            } catch (error) {
                console.error("Error deleting", error);
            }
        }
    };

    const openCreateModal = () => {
        setEditingPart(null);
        setFormData({
            ...initialForm,
            codigo_repuesto: generateCode('REP-')
        });
        setShowModal(true);
    };

    const openEditModal = (part) => {
        setEditingPart(part);
        setFormData({
            codigo_repuesto: part.codigo || '',
            nombre_repuesto: part.nombre,
            descripcion: part.descripcion || '',
            categoria: part.categoria || 'Mecánico',
            marca_compatible: part.marca || '',
            stock_actual: part.stock,
            stock_minimo: part.stock_minimo,
            unidad_medida: part.unidad,
            precio_unitario: part.precio,
            ubicacion_almacen: part.ubicacion || ''
        });
        setShowModal(true);
    };

    const filtered = parts.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StockIndicator = ({ stock, min }) => {
        const isLow = stock <= min;
        return (
            <div className={`flex items-center gap-2 font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {isLow ? <AlertCircle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {stock}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inventario de Repuestos</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Control de stock y suministros técnicos</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Categoría o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64"
                        />
                    </div>

                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold uppercase tracking-tight" title="Descargar Plantilla CSV">
                        <Download className="w-4 h-4" />
                        <span>Plantilla</span>
                    </button>
                    <label className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold uppercase tracking-tight" title="Importar CSV">
                        <Upload className="w-4 h-4" />
                        <span>Importar CSV</span>
                        <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                    </label>

                    <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4" /> Nuevo Repuesto
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total SKU</div>
                    <div className="text-2xl font-black">{parts.length}</div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">Stock Crítico</div>
                    <div className="text-2xl font-black text-red-500">{parts.filter(p => p.stock <= p.stock_minimo).length}</div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Valor Inventario</div>
                    <div className="text-2xl font-black text-slate-700 dark:text-slate-200">
                        ${parts.reduce((acc, p) => acc + (p.stock * p.precio), 0).toLocaleString()}
                    </div>
                </div>
                <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Último Ingreso</div>
                    <div className="text-lg font-bold">Correa Industrial A4</div>
                </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Repuesto</th>
                            <th className="px-6 py-4">Categoría / Marca</th>
                            <th className="px-6 py-4">Stock Actual</th>
                            <th className="px-6 py-4">Precio Unit.</th>
                            <th className="px-6 py-4">Ubicación</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8">Cargando almacén...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-8 text-slate-400 font-medium">No se encontraron suministros.</td></tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white underline decoration-blue-500/20 underline-offset-4">{p.nombre}</td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-medium text-slate-500 uppercase">{p.categoria}</div>
                                    <div className="text-sm text-slate-800 dark:text-slate-200">{p.marca || 'Genérico'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <StockIndicator stock={p.stock} min={p.stock_minimo} />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Mín: {p.stock_minimo} {p.unidad}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                                    ${p.precio.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <MapPin className="w-3 h-3 text-red-400" />
                                        {p.ubicacion || 'ALM-GRAL'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(p)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal CRUD */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]/50">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingPart ? 'Editar' : 'Nuevo'} Repuesto</h3>
                            <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ficha de Suministro</div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Código Repuesto *</label>
                                    <div className="relative">
                                        <input required name="codigo_repuesto" value={formData.codigo_repuesto} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors pr-20" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, codigo_repuesto: generateCode('REP-') }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-300 transition-colors uppercase">Regenerar</button>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nombre del Repuesto</label>
                                    <input required name="nombre_repuesto" value={formData.nombre_repuesto} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Categoría</label>
                                    <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none">
                                        <option value="Mecánico">Mecánico</option>
                                        <option value="Eléctrico">Eléctrico</option>
                                        <option value="Electrónico">Electrónico</option>
                                        <option value="Plomería">Plomería</option>
                                        <option value="Consumible">Consumible</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Marca / Fabricante</label>
                                    <input name="marca_compatible" value={formData.marca_compatible} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Stock Actual</label>
                                    <input type="number" name="stock_actual" value={formData.stock_actual} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Stock Mínimo</label>
                                    <input type="number" name="stock_minimo" value={formData.stock_minimo} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Precio Unitario ($)</label>
                                    <input type="number" step="0.01" name="precio_unitario" value={formData.precio_unitario} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Ubicación Almacén</label>
                                    <input name="ubicacion_almacen" value={formData.ubicacion_almacen} onChange={handleInputChange} placeholder="ej. RACK-B1" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold uppercase text-[11px] tracking-widest hover:text-slate-800 transition-colors">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/30 transition-all">Guardar SKU</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
