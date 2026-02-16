import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Box, MapPin, Filter, X, Download, ZoomIn, Upload } from 'lucide-react';
import { assetService } from '../services/assetService';
import AssetFormModal from '../components/AssetFormModal';
import BulkImportModal from '../components/BulkImportModal';

const AssetsPage = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    // Config Data (kept for filters)
    const [categoriesList, setCategoriesList] = useState([]);
    const [typesList, setTypesList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    useEffect(() => {
        fetchAssets();
        fetchConfig();
    }, []);

    const fetchAssets = async () => {
        try {
            const res = await axios.get('/api/assets');
            setAssets(res.data);
        } catch (error) {
            console.error("Error fetching assets", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const [catsRes, typesRes, locsRes] = await Promise.all([
                axios.get('/api/asset-config/categories', { withCredentials: true }),
                axios.get('/api/asset-config/types', { withCredentials: true }),
                axios.get('/api/asset-config/locations', { withCredentials: true })
            ]);
            setCategoriesList(catsRes.data);
            setTypesList(typesRes.data);
            setLocationsList(locsRes.data);
        } catch (error) {
            console.error("Error fetching config", error);
        }
    };

    const handleDownloadTemplateCreate = async () => {
        try {
            const blob = await assetService.getTemplateCreate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla_activos_nuevos.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error downloading template", error);
        }
    };

    const handleDownloadTemplateUpdate = async () => {
        try {
            const blob = await assetService.getTemplateUpdate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plantilla_activos_actualizar.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Error downloading template", error);
        }
    };

    const handleImportCreate = async (formData) => {
        await assetService.importCreate(formData);
        fetchAssets();
    };

    const handleImportUpdate = async (formData) => {
        await assetService.importUpdate(formData);
        fetchAssets();
    };

    const openCreateModal = () => {
        setEditingAsset(null);
        setShowModal(true);
    };

    const openEditModal = (asset) => {
        setEditingAsset(asset);
        setShowModal(true);
    };

    const handleSaved = () => {
        fetchAssets();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de dar de baja este activo?')) {
            try {
                await axios.delete(`/api/assets/${id}`);
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
            (asset.codigo_administrativo && asset.codigo_administrativo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.ubicacion && asset.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory ? asset.categoria === filterCategory : true;
        const matchesStatus = filterStatus ? asset.estado === filterStatus : true;
        const matchesBrand = filterBrand ? asset.marca === filterBrand : true;
        const matchesLocation = filterLocation ? asset.ubicacion === filterLocation : true;

        return matchesSearch && matchesCategory && matchesStatus && matchesBrand && matchesLocation;
    });

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterBrand('');
        setFilterLocation('');
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
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold uppercase tracking-tight"
                            title="Importar CSV"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Importar</span>
                        </button>
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
                    {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                </select>

                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todas las Ubicaciones</option>
                    {locationsList.map(loc => (
                        <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todos los Estados</option>
                    <option value="activo">Activo</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="baja">De Baja</option>
                </select>

                {(filterCategory || filterStatus || filterBrand || filterLocation || searchTerm) && (
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
                                <th className="px-6 py-4">Activo</th>
                                <th className="px-6 py-4">Cód. Admin</th>
                                <th className="px-6 py-4">Cód. Interno</th>
                                <th className="px-6 py-4">Detalles Técnicos</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8 text-slate-500">Cargando inventario...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No se encontraron activos.</td></tr>
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
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (asset.imagen_url) setPreviewImage(`${asset.imagen_url}`);
                                                }}
                                                className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 group-hover:border-blue-400 transition-colors ${asset.imagen_url ? 'cursor-zoom-in' : ''}`}
                                            >
                                                {asset.imagen_url ? (
                                                    <img src={`${asset.imagen_url}`} alt={asset.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Box className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors underline decoration-transparent group-hover:decoration-blue-500/30">{asset.nombre}</div>
                                                <div className="text-xs text-slate-500">{asset.tipo_activo || 'Activo'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {asset.codigo_administrativo ? (
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{asset.codigo_administrativo}</span>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">--</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                            {asset.codigo}
                                        </span>
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
                                                asset.estado === 'inactivo' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
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

            {/* Asset Form Modal */}
            <AssetFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSaved={handleSaved}
                assetId={editingAsset ? editingAsset.id : null}
            />

            {/* Bulk Import Modal */}
            <BulkImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Importación Masiva de Activos"
                entityName="activos"
                onDownloadTemplateCreate={handleDownloadTemplateCreate}
                onDownloadTemplateUpdate={handleDownloadTemplateUpdate}
                onImportCreate={handleImportCreate}
                onImportUpdate={handleImportUpdate}
            />

            {/* Image Preview Modal (Only for Table viewing) */}
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

export default AssetsPage;
