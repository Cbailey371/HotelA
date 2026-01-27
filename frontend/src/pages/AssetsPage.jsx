import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Box, MapPin, Tag, Hash, Activity, Image as ImageIcon, Upload, Filter, X, Download } from 'lucide-react';
import { assetService } from '../services/assetService';
import { generateCode } from '../utils/codeGenerator';

const AssetsPage = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBrand, setFilterBrand] = useState('');

    // Form State
    const initialFormState = {
        codigo_equipo: '',
        nombre_equipo: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        ubicacion: '',
        categoria: '',
        estado: 'activo',
        imagen_url: '',
        tipo_activo: '',
        anio: '',
        color: '',
        numero_motor: '',
        numero_chasis: '',
        manual_pdf: '',
        cantidad: 1,
        ubicacion_detallada: '',
        fecha_instalacion: '',
        fecha_adquisicion: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/assets');
            setAssets(res.data);
        } catch (error) {
            console.error("Error fetching assets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('http://localhost:3000/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, imagen_url: res.data.url }));
        } catch (error) {
            console.error("Error uploading image", error);
            alert("Error al subir la imagen");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await assetService.getTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla_activos.csv';
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

        const uploadData = new FormData();
        uploadData.append('file', file);

        setLoading(true);
        try {
            await assetService.importCsv(uploadData);
            alert("Importación completada con éxito");
            fetchAssets();
        } catch (error) {
            console.error("Error importing CSV", error);
            alert("Error al importar CSV. Verifique el formato.");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingAsset(null);
        setFormData({
            ...initialFormState,
            codigo_equipo: generateCode('ACT-')
        });
        setShowModal(true);
    };

    const handleManualUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('http://localhost:3000/api/upload/manual', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({
                ...prev,
                manual_pdf: res.data.url,
                manual_name: res.data.original_name
            }));
            alert("Manual cargado correctamente");
        } catch (error) {
            console.error("Error uploading manual", error);
            alert("Error al subir el manual");
        } finally {
            setUploading(false);
        }
    };

    const openEditModal = (asset) => {
        setEditingAsset(asset);
        setFormData({
            codigo_equipo: asset.codigo,
            nombre_equipo: asset.nombre,
            marca: asset.marca || '',
            modelo: asset.modelo || '',
            numero_serie: asset.serie || '',
            ubicacion: asset.ubicacion || '',
            categoria: asset.categoria || '',
            estado: asset.estado || 'activo',
            imagen_url: asset.imagen_url || '',
            tipo_activo: asset.tipo_activo || '',
            anio: asset.anio || '',
            color: asset.color || '',
            numero_motor: asset.numero_motor || '',
            numero_chasis: asset.numero_chasis || '',
            manual_pdf: asset.manual_pdf || '',
            cantidad: asset.cantidad || 1,
            ubicacion_detallada: asset.ubicacion_detallada || '',
            fecha_instalacion: asset.fecha_instalacion || '',
            fecha_adquisicion: asset.fecha_adquisicion || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAsset) {
                await axios.put(`http://localhost:3000/api/assets/${editingAsset.id}`, formData);
            } else {
                await axios.post('http://localhost:3000/api/assets', formData);
            }
            setShowModal(false);
            fetchAssets();
        } catch (error) {
            console.error("Error saving asset", error);
            alert("Error al guardar el activo. Verifique los datos.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de dar de baja este activo?')) {
            try {
                await axios.delete(`http://localhost:3000/api/assets/${id}`);
                fetchAssets();
            } catch (error) {
                console.error("Error deleting asset", error);
            }
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch =
            asset.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.ubicacion && asset.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory ? asset.categoria === filterCategory : true;
        const matchesStatus = filterStatus ? asset.estado === filterStatus : true;
        const matchesBrand = filterBrand ? asset.marca === filterBrand : true;

        return matchesSearch && matchesCategory && matchesStatus && matchesBrand;
    });

    const uniqueBrands = [...new Set(assets.map(a => a.marca).filter(Boolean))].sort();

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterBrand('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inventario de Activos</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona equipos, maquinaria y mobiliario</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar activo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 w-full md:w-64 transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold uppercase tracking-tight" title="Descargar Plantilla CSV">
                            <Download className="w-4 h-4" />
                            <span>Plantilla</span>
                        </button>
                        <label className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold uppercase tracking-tight" title="Importar CSV">
                            <Upload className="w-4 h-4" />
                            <span>Importar CSV</span>
                            <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                        </label>
                        <button
                            onClick={openCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Activo
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
                    <Filter className="w-4 h-4" /> Filtros:
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todas las Categorías</option>
                    <option value="HVAC">Climatización (HVAC)</option>
                    <option value="ELECTRICO">Eléctrico</option>
                    <option value="PLOMERIA">Plomería</option>
                    <option value="MOBILIARIO">Mobiliario</option>
                    <option value="COMPUTO">Cómputo</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todos los Estados</option>
                    <option value="activo">Activo</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="baja">De Baja</option>
                </select>

                <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todas las Marcas</option>
                    {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>

                {(filterCategory || filterStatus || filterBrand || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" /> Limpiar Filtros
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Activo / Código</th>
                                <th className="px-6 py-4">Detalles Técnicos</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Cargando inventario...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No se encontraron activos.</td></tr>
                            ) : filteredAssets.map((asset) => (
                                <tr
                                    key={asset.id}
                                    onClick={(e) => {
                                        if (e.target.closest('button')) return;
                                        navigate(`/assets/${asset.id}`);
                                    }}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 group-hover:border-blue-400 transition-colors">
                                                {asset.imagen_url ? (
                                                    <img src={`http://localhost:3000${asset.imagen_url}`} alt={asset.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Box className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors underline decoration-transparent group-hover:decoration-blue-500/30">{asset.nombre}</div>
                                                <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                                    <Hash className="w-3 h-3" /> {asset.codigo}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-300">
                                            <span className="block font-medium">{asset.marca} {asset.modelo}</span>
                                            {asset.serie && <span className="text-xs text-slate-400">Serie: {asset.serie}</span>}
                                            {asset.categoria && <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">{asset.categoria}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {asset.ubicacion || 'Sin asignar'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${asset.estado === 'activo' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                            asset.estado === 'en_reparacion' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                                                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {asset.estado ? asset.estado.replace('_', ' ').toUpperCase() : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(asset)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                title="Dar de baja"
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingAsset ? 'Editar Activo' : 'Registrar Nuevo Activo'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="flex gap-6 flex-col md:flex-row">
                                {/* Image Upload Section */}
                                <div className="md:w-1/3 flex flex-col items-center">
                                    <div className="w-full aspect-square bg-slate-100 dark:bg-[#0f172a] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-500 transition-colors">
                                        {formData.imagen_url ? (
                                            <img src={`http://localhost:3000${formData.imagen_url}`} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <span className="text-xs text-slate-500 block">Subir Imagen</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-center">Click para subir foto (Max 5MB)</p>
                                </div>

                                {/* Fields */}
                                <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Código Interno *</label>
                                        <div className="relative">
                                            <input required name="codigo_equipo" value={formData.codigo_equipo} onChange={handleInputChange} placeholder="ej. ACT-001" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none pr-20" />
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, codigo_equipo: generateAssetCode() }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-300 transition-colors uppercase">Regenerar</button>
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Estado</label>
                                        <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                            <option value="activo">Activo</option>
                                            <option value="en_reparacion">En Reparación</option>
                                            <option value="baja">De Baja</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Nombre del Equipo *</label>
                                        <input required name="nombre_equipo" value={formData.nombre_equipo} onChange={handleInputChange} placeholder="ej. Aire Acondicionado Split" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Marca</label>
                                        <input name="marca" value={formData.marca} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Modelo</label>
                                        <input name="modelo" value={formData.modelo} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Número de Serie</label>
                                        <input name="numero_serie" value={formData.numero_serie} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Categoría</label>
                                        <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                            <option value="">Seleccionar...</option>
                                            <option value="HVAC">Climatización (HVAC)</option>
                                            <option value="ELECTRICO">Eléctrico</option>
                                            <option value="PLOMERIA">Plomería</option>
                                            <option value="MOBILIARIO">Mobiliario</option>
                                            <option value="COMPUTO">Cómputo</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Tipo Activo</label>
                                        <input name="tipo_activo" value={formData.tipo_activo} onChange={handleInputChange} placeholder="ej. Maquinaria Pesada" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Año</label>
                                        <input type="number" name="anio" value={formData.anio} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Color</label>
                                        <input name="color" value={formData.color} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Cantidad</label>
                                        <input type="number" name="cantidad" value={formData.cantidad} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">N° Motor</label>
                                        <input name="numero_motor" value={formData.numero_motor} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">N° Chasis</label>
                                        <input name="numero_chasis" value={formData.numero_chasis} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">F. Adquisición</label>
                                        <input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">F. Instalación</label>
                                        <input type="date" name="fecha_instalacion" value={formData.fecha_instalacion} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Ubicación Detallada</label>
                                        <input name="ubicacion_detallada" value={formData.ubicacion_detallada} onChange={handleInputChange} placeholder="ej. Ala Norte, Pasillo 4, Rack B" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Manual Técnico / Ficha</label>
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5">
                                            <label className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                                <Upload className="w-4 h-4" /> Subir Archivo
                                                <input type="file" onChange={handleManualUpload} className="hidden" />
                                            </label>
                                            <div className="flex-1 text-sm truncate text-slate-500 italic">
                                                {formData.manual_pdf ? (
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium not-italic">{formData.manual_name || formData.manual_pdf.split('/').pop()}</span>
                                                ) : 'PDF, Word, etc. (Máx 10MB)'}
                                            </div>
                                            {formData.manual_pdf && (
                                                <button type="button" onClick={() => setFormData(p => ({ ...p, manual_pdf: '', manual_name: '' }))} className="text-red-500 hover:text-red-600 p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/30 transition-all">Guardar Activo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetsPage;
