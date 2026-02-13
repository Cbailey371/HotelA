import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ArrowUpRight, ArrowDownRight, TrendingUp, Upload, Download, Plus, Search, Edit2, Trash2, MapPin, AlertCircle, History, Package, X, ZoomIn
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import api from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import MultiSelect from '../components/MultiSelect';
import { providerService } from '../services/providerService';
import { assetService } from '../services/assetService';

import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const InventoryPage = () => {
    const { user } = useAuth();
    const hasPermission = (perm) => user?.permisos?.includes(perm) || user?.role === 'SUPER-ADMIN';
    const canEditCritical = hasPermission('critical_fields_edit');

    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStock, setFilterStock] = useState('all');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Config Data
    const [brandsList, setBrandsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [providersList, setProvidersList] = useState([]);
    const [assetsList, setAssetsList] = useState([]);

    const initialForm = {
        nombre_repuesto: '',
        descripcion: '',
        categoria: 'Mecánico',
        marca: '',
        stock_actual: 0,
        stock_minimo: 1,
        unidad_medida: 'unidades',
        precio_unitario: 0.0,
        ubicacion_almacen: '',
        bodega_id: null,
        ubicacion_bodega_id: null,
        ubicacion_detallada: '',
        imagen_url: '',
        proveedor_id: '',
        fecha_vencimiento: '',
        compatibilidad: '',
        fecha_vencimiento: '',
        compatibilidad: '',
        estado: 'activo',
        sku: '',
        equipos_ids: []
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        fetchParts();
        fetchConfigData();
    }, []);

    const fetchConfigData = async () => {
        try {
            const [brandsRes, warehousesRes, providersRes, assetsRes] = await Promise.all([
                api.get('/settings/brands'),
                api.get('/settings/warehouses'),
                providerService.getAll(),
                assetService.getAll()
            ]);
            setBrandsList(brandsRes.data);
            setWarehousesList(warehousesRes.data);
            setProvidersList(providersRes.map(p => ({ id: p.id, nombre: p.nombre })));
            setAssetsList(assetsRes.map(a => ({ id: a.id, nombre: a.nombre, codigo: a.codigo })));
        };

        const fetchParts = async () => {
            try {
                const data = await inventoryService.getAll();
                setParts(data);
                setLoading(false);
            }
    };

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
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error downloading template", error);
            }
        };

        const handleCsvImport = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const uploadData = new FormData();
            uploadData.append('file', file);
            setLoading(true);
            try {
                await inventoryService.importCsv(uploadData);
                alert("Inventario importado correctamente");
                fetchParts();
            } catch (error) {
                alert("Error al importar CSV");
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
            setIsDirty(true);
        };

        const handleSubmit = async (e) => {
            if (e) e.preventDefault();
            try {
                // Sanitize data: convert empty strings to null for IDs
                const dataToSend = {
                    ...formData,
                    bodega_id: formData.bodega_id ? parseInt(formData.bodega_id) : null,
                    ubicacion_bodega_id: formData.ubicacion_bodega_id ? parseInt(formData.ubicacion_bodega_id) : null,
                    proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
                };

                let partId;
                if (editingPart) {
                    await inventoryService.update(editingPart.id, dataToSend);
                    partId = editingPart.id;
                } else {
                    const newPart = await inventoryService.create(dataToSend);
                    partId = newPart.id;
                }

                if (formData.imagen_file) {
                    const uploadData = new FormData();
                    uploadData.append('file', formData.imagen_file);
                    await inventoryService.uploadImage(partId, uploadData);
                }

                setShowModal(false);
                setIsDirty(false);
                fetchParts();
            } catch (error) {
                alert("Error al guardar: Verifique los datos ingresados.");
            }
        };

        const handleDelete = async (id) => {
            if (window.confirm('¿Está seguro de dar de baja este repuesto?')) {
                try {
                    await inventoryService.delete(id);
                    fetchParts();
                } catch (error) {
                    console.error("Error deleting", error);
                }
            }
        };

        const openHistoryModal = async (part) => {
            setEditingPart(part);
            setShowHistoryModal(true);
            setLoading(true);
            try {
                const data = await inventoryService.getHistory(part.id);
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history", error);
            } finally {
                setLoading(false);
            }
        };

        const openCreateModal = () => {
            setEditingPart(null);
            setFormData({
                ...initialForm,
            });
            setIsDirty(false);
            setShowModal(true);
        };

        const openEditModal = (part) => {
            setEditingPart(part);
            setFormData({
                nombre_repuesto: part.nombre,
                descripcion: part.descripcion || '',
                categoria: part.categoria || 'Mecánico',
                marca: part.marca || '',
                stock_actual: part.stock,
                stock_minimo: part.stock_minimo,
                unidad_medida: part.unidad,
                precio_unitario: part.precio,
                ubicacion_almacen: part.ubicacion || '',
                bodega_id: part.bodega_id || null,
                ubicacion_bodega_id: part.ubicacion_bodega_id || null,
                ubicacion_detallada: part.ubicacion_detallada || '',
                imagen: part.imagen,
                proveedor_id: part.proveedor_id || '',
                fecha_vencimiento: part.fecha_vencimiento || '',
                compatibilidad: part.compatibilidad || '',
                estado: part.estado || 'activo',
                sku: part.sku || '',
                equipos_ids: part.equipos ? part.equipos.map(e => e.id) : []
            });
            if (part.bodega_id) {
                fetchWarehouseLocations(part.bodega_id);
            } else {
                setWarehouseLocations([]);
            }
            setIsDirty(false);
            setShowModal(true);
        };

        const fetchWarehouseLocations = async (warehouseId) => {
            try {
                const response = await api.get(`/settings/warehouses/${warehouseId}/locations`);
                setWarehouseLocations(response.data);
            } catch (error) {
                console.error("Error fetching locations", error);
                setWarehouseLocations([]);
            }
        };

        const [warehouseLocations, setWarehouseLocations] = useState([]);

        const handleWarehouseChange = (e) => {
            const warehouseName = e.target.value;
            const warehouse = warehousesList.find(w => w.nombre === warehouseName);

            setFormData(prev => ({
                ...prev,
                ubicacion_almacen: warehouseName,
                bodega_id: warehouse ? warehouse.id : null,
                ubicacion_bodega_id: null
            }));
            setIsDirty(true);

            if (warehouse) {
                fetchWarehouseLocations(warehouse.id);
            } else {
                setWarehouseLocations([]);
            }
        };

        const filtered = parts.filter(p => {
            const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || p.categoria === filterCategory;
            const matchesLocation = filterLocation === '' || (p.ubicacion || '').includes(filterLocation);
            const matchesBrand = filterBrand === '' || (p.marca || '').toLowerCase().includes(filterBrand.toLowerCase());
            const matchesStock = filterStock === 'all' ||
                (filterStock === 'critical' && p.stock <= p.stock_minimo) ||
                (filterStock === 'ok' && p.stock > p.stock_minimo);
            const matchesStatus = filterStatus === '' || p.estado === filterStatus;
            return matchesSearch && matchesCategory && matchesStock && matchesLocation && matchesBrand && matchesStatus;
        });

        const uniqueLocations = [...new Set(parts.map(p => p.ubicacion).filter(Boolean))];
        const uniqueBrands = [...new Set(parts.map(p => p.marca).filter(Boolean))];

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


                {/* Inventory List */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 bg-slate-50/50 dark:bg-[#0f172a]/50">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar repuesto por nombre o categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none font-bold shadow-sm"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <option value="">Todas las Categorías</option>
                            <option value="Mecánico">Mecánico</option>
                            <option value="Eléctrico">Eléctrico</option>
                            <option value="Electrónico">Electrónico</option>
                            <option value="Plomería">Plomería</option>
                            <option value="Consumible">Consumible</option>
                        </select>
                        <select
                            value={filterStock}
                            onChange={(e) => setFilterStock(e.target.value)}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <option value="all">Todo el Stock</option>
                            <option value="ok">Stock OK</option>
                            <option value="critical">Stock Crítico</option>
                        </select>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <option value="">Todas las Ubicaciones</option>
                            {uniqueLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <option value="">Todas las Marcas</option>
                            {uniqueBrands.map(mark => (
                                <option key={mark} value={mark}>{mark}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                        >
                            <option value="">Todos los Estados</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Código / SKU</th>
                                <th className="px-6 py-4">Repuesto</th>
                                <th className="px-6 py-4">Categoría / Marca</th>
                                <th className="px-6 py-4">Stock Actual</th>
                                <th className="px-6 py-4">Precio Unit.</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Cargando almacén...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-400 font-medium">No se encontraron suministros.</td></tr>
                            ) : filtered.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (p.imagen) setPreviewImage(`${p.imagen}`);
                                                }}
                                                className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0 group-hover:border-blue-400 transition-colors ${p.imagen ? 'cursor-zoom-in' : ''}`}
                                            >
                                                {p.imagen ? (
                                                    <img src={`${p.imagen}`} alt={p.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                                    {p.codigo || 'N/A'}
                                                </span>
                                                {p.sku && <span className="text-[10px] text-slate-400 mt-1 font-mono">SKU: {p.sku}</span>}
                                            </div>
                                        </div>
                                    </td>
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
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${p.estado === 'activo' || !p.estado ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                            'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                            }`}>
                                            {(p.estado || 'activo').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openHistoryModal(p)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg text-blue-600" title="Ver Historial"><History className="w-4 h-4" /></button>
                                            <button onClick={() => openEditModal(p)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-red-500" title="Dar de baja"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal CRUD */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSubmit}
                    isDirty={isDirty}
                    title={editingPart ? 'Editar Repuesto' : 'Nuevo Repuesto'}
                    width="max-w-2xl"
                >
                    <div className="mb-4 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]/50 p-2 rounded-lg">
                        <span className="text-xs font-bold text-slate-500 uppercase">Información del Suministro</span>
                        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ficha de Suministro</div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Código Repuesto (Auto)</label>
                                <input disabled value="Generado al guardar" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none text-slate-400 cursor-not-allowed italic" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">SKU / Código Producto</label>
                                <input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU del Proveedor" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Nombre del Repuesto</label>
                                <input required name="nombre_repuesto" value={formData.nombre_repuesto} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Categoría</label>
                                <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none">
                                    <option value="Mecánico">Mecánico</option>
                                    <option value="Eléctrico">Eléctrico</option>
                                    <option value="Electrónico">Electrónico</option>
                                    <option value="Plomería">Plomería</option>
                                    <option value="Consumible">Consumible</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <SearchableSelect
                                    label="Marca / Fabricante"
                                    name="marca"
                                    placeholder="Seleccionar o escribir..."
                                    options={brandsList}
                                    value={formData.marca}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, marca: e.target.value }));
                                        setIsDirty(true);
                                    }}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Stock Actual</label>
                                <input type="number" name="stock_actual" value={formData.stock_actual} onChange={handleInputChange} disabled={!canEditCritical} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Stock Mínimo</label>
                                <input type="number" name="stock_minimo" value={formData.stock_minimo} onChange={handleInputChange} disabled={!canEditCritical} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Precio Unitario ($)</label>
                                <input type="number" step="0.01" name="precio_unitario" value={formData.precio_unitario} onChange={handleInputChange} disabled={!canEditCritical} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                            <div className="col-span-1">
                                <SearchableSelect
                                    label="Ubicación Almacén"
                                    name="ubicacion_almacen"
                                    placeholder="Seleccionar bodega..."
                                    options={warehousesList}
                                    value={formData.ubicacion_almacen}
                                    onChange={handleWarehouseChange}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Ubicación (Rack/Estante)</label>
                                <select
                                    name="ubicacion_bodega_id"
                                    value={formData.ubicacion_bodega_id || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, ubicacion_bodega_id: e.target.value ? parseInt(e.target.value) : null }));
                                        setIsDirty(true);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none disabled:opacity-50"
                                    disabled={!formData.bodega_id}
                                >
                                    <option value="">Seleccionar Ubicación...</option>
                                    {warehouseLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Ubicación Detallada (Bin/Caja)</label>
                                <input name="ubicacion_detallada" value={formData.ubicacion_detallada} onChange={handleInputChange} placeholder="ej. Nivel 3, Caja 4" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                            </div>
                            <div className="col-span-1">
                                <SearchableSelect
                                    label="Proveedor"
                                    name="proveedor_id"
                                    placeholder="Buscar Proveedor..."
                                    options={providersList}
                                    value={providersList.find(p => p.id === formData.proveedor_id)?.nombre || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, proveedor_id: e.target.id }));
                                        setIsDirty(true);
                                    }}
                                    allowCustom={false}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Estado</label>
                                <select name="estado" value={formData.estado} onChange={handleInputChange} disabled={!canEditCritical} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <MultiSelect
                                    label="Asociar a Activos (Equipos)"
                                    name="equipos_ids"
                                    placeholder="Seleccionar equipos..."
                                    options={assetsList}
                                    value={formData.equipos_ids}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Compatibilidad Modelos</label>
                                <input name="compatibilidad" value={formData.compatibilidad} onChange={handleInputChange} placeholder="ej. Modelo X, Modelo Y" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none" />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Imagen del Repuesto</label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors bg-slate-50 dark:bg-[#0f172a]">
                                {formData.imagen_preview || formData.imagen ? (
                                    <div className="p-4 flex flex-col items-center justify-center">
                                        <div
                                            onClick={() => {
                                                const imgUrl = formData.imagen_preview || `${formData.imagen}`;
                                                setPreviewImage(imgUrl);
                                            }}
                                            className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in group"
                                        >
                                            <img
                                                src={formData.imagen_preview || `${formData.imagen}`}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, imagen: null, imagen_file: null, imagen_preview: null }));
                                                    setIsDirty(true);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <label className="mt-3 cursor-pointer text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter">
                                            Cambiar Imagen
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            imagen_file: file,
                                                            imagen_preview: URL.createObjectURL(file)
                                                        }));
                                                        setIsDirty(true);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-2 p-8 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-500/5 hover:border-blue-400 group transition-all">
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                                        <div className="text-center">
                                            <span className="text-xs font-bold text-blue-600 block">Cargar Imagen</span>
                                            <span className="text-[10px] text-slate-400">PNG, JPG hasta 5MB</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        imagen_file: file,
                                                        imagen_preview: URL.createObjectURL(file)
                                                    }));
                                                    setIsDirty(true);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold uppercase text-[11px] tracking-widest hover:text-slate-800 transition-colors">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/30 transition-all">Guardar SKU</button>
                        </div>
                    </form>
                </Modal>

                {/* Modal Historial */}
                <Modal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                    isDirty={false}
                    title="Historial de Movimientos"
                    width="max-w-3xl"
                >
                    <div className="mb-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">{editingPart?.nombre} - {editingPart?.codigo}</p>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="pb-3 px-2">Fecha</th>
                                    <th className="pb-3 px-2">Activo / Equipo</th>
                                    <th className="pb-3 px-2">Cantidad</th>
                                    <th className="pb-3 px-2">Motivo / Técnico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {history.length === 0 ? (
                                    <tr><td colSpan="4" className="py-8 text-center text-slate-400 italic">Sin registros de uso.</td></tr>
                                ) : history.map((h) => (
                                    <tr key={h.id} className="text-sm">
                                        <td className="py-3 px-2 font-medium text-slate-500">{new Date(h.fecha).toLocaleDateString()}</td>
                                        <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{h.equipo}</td>
                                        <td className="py-3 px-2">
                                            <span className="bg-red-50 dark:bg-red-500/10 text-red-600 px-2 py-1 rounded font-black">-{h.cantidad}</span>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="font-bold text-slate-800 dark:text-white uppercase text-[10px]">{h.motivo}</div>
                                            <div className="text-[10px] text-slate-500">{h.tecnico}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-4 bg-slate-50 dark:bg-[#0f172a]/50 border-t border-slate-200 dark:border-slate-800 flex justify-end rounded-lg">
                        <button onClick={() => setShowHistoryModal(false)} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest">Cerrar</button>
                    </div>
                </Modal>

                {/* Image Preview Modal */}
                {previewImage && (
                    <div
                        className="fixed inset-0 bg-slate-900/90 dark:bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 cursor-zoom-out"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div
                            className="max-w-5xl max-h-[90vh] flex items-center justify-center relative shadow-2xl rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="max-w-full max-h-[90vh] object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default InventoryPage;
