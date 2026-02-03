import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ZoomIn, Image as ImageIcon, Upload, FileText, X } from 'lucide-react';
import Modal from './Modal';
import DatePicker from './DatePicker';

const AssetFormModal = ({ isOpen, onClose, onSaved, assetId, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    // Track the ID of the asset being edited
    const [editingId, setEditingId] = useState(null);

    // Config Lists
    const [categoriesList, setCategoriesList] = useState([]);
    const [typesList, setTypesList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);
    const [brandsList, setBrandsList] = useState([]);

    const initialFormState = {
        codigo_equipo: '',
        codigo_administrativo: '',
        nombre_equipo: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        ubicacion: '',
        categoria: '',
        estado: 'activo',
        imagen_url: null,
        tipo_activo: '',
        anio: '',
        color: '',
        numero_motor: '',
        numero_chasis: '',
        manual_pdf: null,
        documentos: [],
        cantidad: 1,
        ubicacion_detallada: '',
        fecha_instalacion: '',
        fecha_adquisicion: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
            if (assetId) {
                setEditingId(assetId);
                fetchAssetDetails(assetId);
            } else if (initialData) {
                setEditingId(initialData.id);
                populateForm(initialData);
            } else {
                setEditingId(null);
                setFormData(initialFormState);
            }
            setIsDirty(false);
        }
    }, [isOpen, assetId, initialData]);

    const fetchAssetDetails = async (id) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/assets/${id}`);
            populateForm(res.data);
        } catch (error) {
            console.error("Error loading asset", error);
            alert("Error al cargar detalles del activo");
        } finally {
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const [catsRes, typesRes, locsRes, brandsRes] = await Promise.all([
                axios.get('/api/asset-config/categories'),
                axios.get('/api/asset-config/types'),
                axios.get('/api/asset-config/locations'),
                axios.get('/api/settings/brands')
            ]);
            setCategoriesList(catsRes.data);
            setTypesList(typesRes.data);
            setLocationsList(locsRes.data);
            setBrandsList(brandsRes.data);
        } catch (error) {
            console.error("Error fetching config", error);
        }
    };

    const populateForm = (asset) => {
        if (asset.id) setEditingId(asset.id);

        setFormData({
            ...initialFormState,
            codigo_equipo: asset.codigo,
            codigo_administrativo: asset.codigo_administrativo || '',
            nombre_equipo: asset.nombre,
            marca: asset.marca || '',
            modelo: asset.modelo || '',
            numero_serie: asset.serie || '',
            ubicacion: asset.ubicacion || '',
            categoria: asset.categoria || '',
            estado: asset.estado || 'activo',
            imagen_url: asset.imagen_url || null,
            tipo_activo: asset.tipo_activo || '',
            anio: asset.anio || '',
            color: asset.color || '',
            numero_motor: asset.numero_motor || '',
            numero_chasis: asset.numero_chasis || '',
            manual_pdf: asset.manual_pdf || null,
            cantidad: asset.cantidad || 1,
            ubicacion_detallada: asset.ubicacion_detallada || '',
            fecha_instalacion: asset.fecha_instalacion ? asset.fecha_instalacion.split('T')[0] : '',
            fecha_adquisicion: asset.fecha_adquisicion ? asset.fecha_adquisicion.split('T')[0] : '',
            documentos: asset.documentos || []
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, imagen_url: res.data.url }));
            setIsDirty(true);
        } catch (error) {
            console.error("Error uploading image", error);
            alert("Error al subir la imagen");
        } finally {
            setUploading(false);
        }
    };

    const handleManualUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await axios.post('/api/upload/manual', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newDoc = {
                nombre_archivo: res.data.original_name,
                url_archivo: res.data.url
            };

            if (editingId) {
                // If editing, save immediately to backend
                const docRes = await axios.post(`/api/assets/${editingId}/documents`, newDoc);
                setFormData(prev => ({
                    ...prev,
                    documentos: [...prev.documentos, docRes.data]
                }));
            } else {
                // If creating, just add to local state
                setFormData(prev => ({
                    ...prev,
                    documentos: [...prev.documentos, newDoc]
                }));
            }
            setIsDirty(true);
        } catch (error) {
            console.error("Error uploading manual", error);
            alert("Error al subir el manual");
        }
    };

    const handleDeleteDocument = async (doc) => {
        if (!window.confirm(`¿Eliminar el documento "${doc.nombre_archivo}"?`)) return;

        try {
            if (doc.id) {
                await axios.delete(`/api/assets/documents/${doc.id}`);
            }
            setFormData(prev => ({
                ...prev,
                documentos: prev.documentos.filter(d => d.url_archivo !== doc.url_archivo)
            }));
            setIsDirty(true);
        } catch (error) {
            console.error("Error deleting document", error);
            alert("Error al eliminar el documento.");
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        const sanitizedData = { ...formData };
        const optionalFields = [
            'codigo_administrativo', 'descripcion', 'categoria', 'marca', 'modelo',
            'numero_serie', 'ubicacion', 'area_responsable', 'tipo_activo', 'color',
            'numero_motor', 'numero_chasis', 'manual_pdf', 'ubicacion_detallada', 'imagen_url'
        ];

        optionalFields.forEach(field => {
            if (sanitizedData[field] === '') sanitizedData[field] = null;
        });

        if (sanitizedData.anio === '') sanitizedData.anio = null;
        else if (sanitizedData.anio !== null) sanitizedData.anio = parseInt(sanitizedData.anio);

        if (sanitizedData.cantidad === '') sanitizedData.cantidad = null;
        else if (sanitizedData.cantidad !== null) sanitizedData.cantidad = parseInt(sanitizedData.cantidad);

        if (sanitizedData.fecha_instalacion === '') sanitizedData.fecha_instalacion = null;
        if (sanitizedData.fecha_adquisicion === '') sanitizedData.fecha_adquisicion = null;

        try {
            if (editingId) {
                await axios.put(`/api/assets/${editingId}`, sanitizedData);
            } else {
                await axios.post('/api/assets', sanitizedData);
            }
            setIsDirty(false);
            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error("Error saving asset", error);
            const backendMsg = error.response?.data;
            alert(`Error al guardar el activo: ${typeof backendMsg === 'string' ? backendMsg : 'Verifique los datos.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={editingId ? 'Editar Activo' : 'Registrar Nuevo Activo'}
                width="max-w-3xl"
            >
                <form onSubmit={handleSubmit} className="p-0 space-y-6">
                    <div className="flex gap-6 flex-col md:flex-row">
                        {/* Image Upload Section */}
                        <div className="md:w-1/3 flex flex-col items-center">
                            <div
                                onClick={() => {
                                    if (formData.imagen_url) setPreviewImage(`${formData.imagen_url}`);
                                }}
                                className={`w-full aspect-square bg-slate-100 dark:bg-[#0f172a] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative group transition-colors ${formData.imagen_url ? 'cursor-zoom-in border-solid hover:border-blue-500' : 'cursor-pointer hover:border-blue-500'}`}
                            >
                                {formData.imagen_url ? (
                                    <>
                                        <img src={`${formData.imagen_url}`} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                        <span className="text-xs text-slate-500 block">Subir Imagen</span>
                                    </div>
                                )}
                                {!formData.imagen_url && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={uploading}
                                    />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            {formData.imagen_url && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById('edit-image-input-modal').click();
                                    }}
                                    className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                                >
                                    Cambiar imagen
                                </button>
                            )}
                            <input
                                id="edit-image-input-modal"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">Click para ampliar o subir foto</p>
                        </div>

                        {/* Fields */}
                        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Código Activo (Manual)</label>
                                <input name="codigo_administrativo" value={formData.codigo_administrativo} onChange={handleInputChange} placeholder="ej. FIN-1234" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Código Interno (Auto)</label>
                                <input disabled value={formData.codigo_equipo || "Generado al guardar"} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-400 italic cursor-not-allowed outline-none" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Estado</label>
                                <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                    <option value="activo">Activo</option>
                                    <option value="en_reparacion">En Reparación</option>
                                    <option value="inactivo">Inactivo</option>
                                    <option value="baja">De Baja</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Nombre del Equipo *</label>
                                <input required name="nombre_equipo" value={formData.nombre_equipo} onChange={handleInputChange} placeholder="ej. Aire Acondicionado Split" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Marca</label>
                                <select name="marca" value={formData.marca} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                    <option value="">Seleccionar...</option>
                                    {brandsList.map(item => (
                                        <option key={item.id} value={item.nombre}>{item.nombre}</option>
                                    ))}
                                </select>
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
                                    {categoriesList.map(cat => (
                                        <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Ubicación</label>
                                <select name="ubicacion" value={formData.ubicacion} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                    <option value="">Seleccionar...</option>
                                    {locationsList.map(loc => (
                                        <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Tipo Activo</label>
                                <select name="tipo_activo" value={formData.tipo_activo} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none">
                                    <option value="">Seleccionar...</option>
                                    {typesList.map(t => (
                                        <option key={t.id} value={t.nombre}>{t.nombre}</option>
                                    ))}
                                </select>
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
                                <DatePicker
                                    label="F. Adquisición"
                                    name="fecha_adquisicion"
                                    value={formData.fecha_adquisicion}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-span-1">
                                <DatePicker
                                    label="F. Instalación"
                                    name="fecha_instalacion"
                                    value={formData.fecha_instalacion}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Ubicación Detallada</label>
                                <input name="ubicacion_detallada" value={formData.ubicacion_detallada} onChange={handleInputChange} placeholder="ej. Ala Norte, Pasillo 4, Rack B" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">Manuales Técnicos / Fichas</label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5">
                                        <label className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
                                            <Upload className="w-4 h-4" /> Agregar Manual
                                            <input type="file" onChange={handleManualUpload} className="hidden" />
                                        </label>
                                        <span className="text-xs text-slate-400 font-medium italic">Puedes subir múltiples archivos (PDF, DOCX, Imágenes)</span>
                                    </div>

                                    {formData.documentos && formData.documentos.length > 0 && (
                                        <div className="grid grid-cols-1 gap-2">
                                            {formData.documentos.map((doc, idx) => (
                                                <div key={doc.id || idx} className="flex items-center justify-between bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl group transition-all hover:border-blue-400/50">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <a
                                                            href={`${doc.url_archivo}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 truncate max-w-[200px]"
                                                        >
                                                            {doc.nombre_archivo}
                                                        </a>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDocument(doc)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : null}
                            Guardar Activo
                        </button>
                    </div>
                </form>
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
        </>
    );
};

export default AssetFormModal;
