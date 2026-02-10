import React, { useState, useEffect } from 'react';
import { Save, Mail, Server, Shield, Send, Plus, Trash2, Tag, Box, LayoutGrid, MapPin, ClipboardList, Building, Image as ImageIcon, CreditCard, ArrowDownRight, X, Pencil } from 'lucide-react';
import api from '../services/api';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('smtp');
    const [message, setMessage] = useState({ type: '', text: '' });

    // SMTP State
    const [smtpSettings, setSmtpSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from_email: ''
    });
    const [smtpLoading, setSmtpLoading] = useState(true);
    const [smtpSaving, setSmtpSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    // Asset Config State
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);
    // New States
    const [brands, setBrands] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [warehouseLocations, setWarehouseLocations] = useState([]);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationDesc, setNewLocationDesc] = useState('');

    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemDias, setNewItemDias] = useState(0);
    // For Warehouses
    const [newItemLocation, setNewItemLocation] = useState('');
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [editingConfigItem, setEditingConfigItem] = useState(null);
    const [editingPaymentTerm, setEditingPaymentTerm] = useState(null);

    const [configLoading, setConfigLoading] = useState(false);

    // Company State
    const [companySettings, setCompanySettings] = useState({
        logo: '',
        nombre_comercial: '',
        razon_social: '',
        ruc: '',
        dv: '',
        telefono: '',
        correo: '',
        direccion: '',
        ciudad: ''
    });
    const [companyLoading, setCompanyLoading] = useState(true);
    const [companySaving, setCompanySaving] = useState(false);

    // Backup State
    const [backupLoading, setBackupLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'smtp') fetchSmtpSettings();
        if (activeTab === 'company') fetchCompanySettings();
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'types') fetchTypes();
        if (activeTab === 'locations') fetchLocations();
        if (activeTab === 'tasks') fetchTaskTypes();
        if (activeTab === 'payment-terms') fetchPaymentTerms();
        if (activeTab === 'brands') fetchBrands();
        if (activeTab === 'warehouses') fetchWarehouses();
        if (activeTab === 'tasks') fetchTaskTypes();
        if (activeTab === 'payment-terms') fetchPaymentTerms();
        if (activeTab === 'brands') fetchBrands();
        if (activeTab === 'warehouses') fetchWarehouses();
        setMessage({ type: '', text: '' });
    }, [activeTab]);

    // API Calls
    const fetchSmtpSettings = async () => {
        setSmtpLoading(true);
        try {
            const res = await api.get('/settings/smtp');
            setSmtpSettings(res.data);
        } catch (error) {
            console.error("Error loading SMTP settings", error);
            setMessage({ type: 'error', text: 'Error cargando configuración SMTP' });
        } finally {
            setSmtpLoading(false);
        }
    };

    const fetchCompanySettings = async () => {
        setCompanyLoading(true);
        try {
            const res = await api.get('/settings/company');
            if (res.data) setCompanySettings(res.data);
        } catch (error) {
            console.error("Error loading company settings", error);
            setMessage({ type: 'error', text: 'Error cargando configuración de empresa' });
        } finally {
            setCompanyLoading(false);
        }
    };

    const fetchCategories = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/asset-config/categories');
            setCategories(res.data);
        } catch (error) {
            console.error("Error loading categories", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchTypes = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/asset-config/types');
            setTypes(res.data);
        } catch (error) {
            console.error("Error loading types", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchLocations = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/asset-config/locations');
            setLocations(res.data);
        } catch (error) {
            console.error("Error loading locations", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchTaskTypes = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/asset-config/maintenance-tasks');
            setTaskTypes(res.data);
        } catch (error) {
            console.error("Error loading task types", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchPaymentTerms = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/settings/payment-terms');
            setPaymentTerms(res.data);
        } catch (error) {
            console.error("Error loading payment terms", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchBrands = async () => {
        setConfigLoading(true);
        try {
            const res = await api.get('/settings/brands');
            setBrands(res.data);
        } catch (error) {
            console.error("Error loading brands", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        setConfigLoading(true);
        try {
            const response = await api.get('/settings/warehouses');
            setWarehouses(response.data);
        } catch (error) {
            console.error("Error fetching warehouses", error);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchWarehouseLocations = async (warehouseId) => {
        try {
            const response = await api.get(`/settings/warehouses/${warehouseId}/locations`);
            setWarehouseLocations(response.data);
        } catch (error) {
            console.error("Error fetching locations", error);
        }
    };

    const handleCreateLocation = async (e) => {
        e.preventDefault();
        try {
            if (editingLocation) {
                await api.put(`/settings/warehouses/locations/${editingLocation.id}`, {
                    nombre: newLocationName,
                    descripcion: newLocationDesc
                });
                setMessage({ type: 'success', text: 'Ubicación actualizada correctamente' });
                setEditingLocation(null);
            } else {
                await api.post(`/settings/warehouses/${selectedWarehouse.id}/locations`, {
                    nombre: newLocationName,
                    descripcion: newLocationDesc
                });
                setMessage({ type: 'success', text: 'Ubicación agregada correctamente' });
            }

            setNewLocationName('');
            setNewLocationDesc('');
            fetchWarehouseLocations(selectedWarehouse.id);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error saving location", error);
            setMessage({ type: 'error', text: 'Error al guardar ubicación' });
        }
    };

    const startEditLocation = (loc) => {
        setEditingLocation(loc);
        setNewLocationName(loc.nombre);
        setNewLocationDesc(loc.descripcion || '');
    };

    const cancelEditLocation = () => {
        setEditingLocation(null);
        setNewLocationName('');
        setNewLocationDesc('');
    };

    const handleDeleteLocation = async (locationId) => {
        if (!window.confirm('¿Eliminar esta ubicación?')) return;
        try {
            await api.delete(`/settings/warehouses/locations/${locationId}`);
            fetchWarehouseLocations(selectedWarehouse.id);
            setMessage({ type: 'success', text: 'Ubicación eliminada' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error deleting location", error);
            setMessage({ type: 'error', text: 'Error al eliminar ubicación' });
        }
    };

    // Actions
    const handleSmtpChange = (e) => {
        const { name, value } = e.target;
        setSmtpSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSmtpSave = async (e) => {
        e.preventDefault();
        setSmtpSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/settings/smtp', smtpSettings);
            setMessage({ type: 'success', text: 'Configuración SMTP guardada correctamente' });
        } catch (error) {
            console.error("Error saving SMTP settings", error);
            setMessage({ type: 'error', text: 'Error guardando configuración SMTP' });
        } finally {
            setSmtpSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Ingresa un email para la prueba' });
            return;
        }
        setTesting(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/settings/smtp/test', { to: testEmail });
            setMessage({ type: 'success', text: 'Email de prueba enviado con éxito' });
        } catch (error) {
            console.error("Error sending test email", error);
            setMessage({ type: 'error', text: error.response?.data || 'Error enviando prueba.' });
        } finally {
            setTesting(false);
        }
    };

    const handleCompanyChange = (e) => {
        const { name, value } = e.target;
        setCompanySettings(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanySave = async (e) => {
        e.preventDefault();
        setCompanySaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/settings/company', companySettings);
            setMessage({ type: 'success', text: 'Configuración de empresa guardada correctamente' });
        } catch (error) {
            console.error("Error saving company settings", error);
            setMessage({ type: 'error', text: 'Error guardando configuración de empresa' });
        } finally {
            setCompanySaving(false);
        }
    };

    const handleCreateConfigItem = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        if (activeTab === 'payment-terms') {
            try {
                if (editingPaymentTerm) {
                    await api.put(`/settings/payment-terms/${editingPaymentTerm.id}`, {
                        nombre: newItemName,
                        dias: parseInt(newItemDias) || 0
                    });
                    setMessage({ type: 'success', text: 'Término de pago actualizado' });
                    setEditingPaymentTerm(null);
                } else {
                    await api.post('/settings/payment-terms', {
                        nombre: newItemName,
                        dias: parseInt(newItemDias) || 0
                    });
                    setMessage({ type: 'success', text: 'Término de pago creado' });
                }
                setNewItemName('');
                setNewItemDias(0);
                fetchPaymentTerms();
            } catch (error) {
                console.error("Error saving payment term", error);
                setMessage({ type: 'error', text: 'Error guardando término de pago' });
            }
            return;
        }

        if (activeTab === 'brands') {
            try {
                if (editingConfigItem) {
                    await api.put(`/settings/brands/${editingConfigItem.id}`, {
                        nombre: newItemName,
                        descripcion: newItemDesc
                    });
                    setMessage({ type: 'success', text: 'Marca actualizada correctamente' });
                    setEditingConfigItem(null);
                } else {
                    await api.post('/settings/brands', {
                        nombre: newItemName,
                        descripcion: newItemDesc
                    });
                    setMessage({ type: 'success', text: 'Marca creada correctamente' });
                }
                setNewItemName('');
                setNewItemDesc('');
                fetchBrands();
            } catch (error) {
                console.error("Error saving brand", error);
                setMessage({ type: 'error', text: 'Error guardando marca' });
            }
            return;
        }

        if (activeTab === 'warehouses') {
            try {
                if (editingWarehouse) {
                    await api.put(`/settings/warehouses/${editingWarehouse.id}`, {
                        nombre: newItemName,
                        ubicacion: newItemLocation,
                        descripcion: newItemDesc
                    });
                    setMessage({ type: 'success', text: 'Bodega actualizada correctamente' });
                    setEditingWarehouse(null);
                } else {
                    await api.post('/settings/warehouses', {
                        nombre: newItemName,
                        ubicacion: newItemLocation,
                        descripcion: newItemDesc
                    });
                    setMessage({ type: 'success', text: 'Bodega creada correctamente' });
                }

                setNewItemName('');
                setNewItemLocation('');
                setNewItemDesc('');
                fetchWarehouses();
            } catch (error) {
                console.error("Error saving warehouse", error);
                setMessage({ type: 'error', text: 'Error guardando bodega' });
            }
            return;
        }

        const endpoint = activeTab === 'categories' ? 'categories' : (activeTab === 'types' ? 'types' : (activeTab === 'locations' ? 'locations' : 'maintenance-tasks'));
        try {
            if (editingConfigItem) {
                await api.put(`/asset-config/${endpoint}/${editingConfigItem.id}`, {
                    nombre: newItemName,
                    descripcion: newItemDesc
                });
                setMessage({ type: 'success', text: 'Elemento actualizado correctamente' });
                setEditingConfigItem(null);
            } else {
                await api.post(`/asset-config/${endpoint}`, {
                    nombre: newItemName,
                    descripcion: newItemDesc
                });
                setMessage({ type: 'success', text: 'Elemento creado correctamente' });
            }

            setNewItemName('');
            setNewItemDesc('');

            if (activeTab === 'categories') fetchCategories();
            else if (activeTab === 'types') fetchTypes();
            else if (activeTab === 'locations') fetchLocations();
            else fetchTaskTypes();
        } catch (error) {
            console.error("Error saving item", error);
            setMessage({ type: 'error', text: 'Error guardando elemento' });
        }
    };

    const handleDeleteConfigItem = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este elemento?')) return;

        if (activeTab === 'payment-terms') {
            try {
                await api.delete(`/settings/payment-terms/${id}`);
                setMessage({ type: 'success', text: 'Término de pago eliminado' });
                fetchPaymentTerms();
            } catch (error) {
                console.error("Error deleting payment term", error);
                setMessage({ type: 'error', text: 'Error eliminando término de pago' });
            }
            return;
        }

        const endpoint = activeTab === 'categories' ? 'categories' : (activeTab === 'types' ? 'types' : (activeTab === 'locations' ? 'locations' : 'maintenance-tasks'));
        try {
            await api.delete(`/asset-config/${endpoint}/${id}`);
            setMessage({ type: 'success', text: 'Elemento eliminado correctamente' });

            if (activeTab === 'categories') fetchCategories();
            else if (activeTab === 'types') fetchTypes();
            else if (activeTab === 'locations') fetchLocations();
            else fetchTaskTypes();
        } catch (error) {
            console.error("Error deleting item", error);
            setMessage({ type: 'error', text: 'Error eliminando elemento' });
        }
    };

    // Backup Handlers
    const handleDownloadBackup = async () => {
        setBackupLoading(true);
        try {
            // Add timestamp to bypass PWA/Service Worker cache
            const response = await api.get(`/backup/export?t=${new Date().getTime()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            // Fallback to frontend generated filename if header makes it difficult
            const date = new Date();
            const timestamp = date.getFullYear() +
                String(date.getMonth() + 1).padStart(2, '0') +
                String(date.getDate()).padStart(2, '0') + '_' +
                String(date.getHours()).padStart(2, '0') +
                String(date.getMinutes()).padStart(2, '0') +
                String(date.getSeconds()).padStart(2, '0');

            // Prefer header if valid, but ensure fallback is robust
            let filename = `backup_hotela_${timestamp}.json`;

            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2 && filenameMatch[1].endsWith('.json')) {
                    filename = filenameMatch[1];
                }
            }

            console.log("Using filename for download:", filename);
            link.style.display = 'none';
            link.setAttribute('download', filename);
            document.body.appendChild(link);

            // Dispatch click event for better browser compatibility
            link.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            setMessage({ type: 'success', text: 'Respaldo descargado correctamente' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al descargar respaldo' });
        } finally {
            setBackupLoading(false);
        }
    };

    const handleImportBackup = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm("ATENCIÓN: Esta acción sobrescribirá los datos existentes que coincidan con los IDs del respaldo. ¿Deseas continuar?")) {
            event.target.value = null;
            return;
        }

        setBackupLoading(true);
        setMessage({ type: '', text: '' });
        const formData = new FormData();
        formData.append('backup_file', file);

        try {
            const response = await api.post('/backup/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: typeof response.data === 'string' ? response.data : 'Restauración completada' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al importar respaldo' });
        } finally {
            setBackupLoading(false);
            event.target.value = null;
        }
    };

    const renderBackupTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <ArrowDownRight className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 dark:text-white">Exportar Respaldo</h3>
                            <p className="text-xs text-slate-500">Descarga una copia de seguridad de tus datos.</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Este archivo JSON contiene: Activos, Inventario, Proveedores y Técnicos.
                    </p>
                    <button
                        onClick={handleDownloadBackup}
                        disabled={backupLoading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {backupLoading ? 'Procesando...' : <><ArrowDownRight className="w-4 h-4" /> Descargar Respaldo JSON</>}
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700 dark:text-white">Restaurar Datos</h3>
                            <p className="text-xs text-slate-500">Importa datos desde un archivo de respaldo.</p>
                        </div>
                    </div>
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                        <p className="text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                            <Shield className="w-4 h-4 shrink-0" />
                            <span><strong>Precaución:</strong> Al importar, los registros existentes con el mismo ID serán actualizados. Los nuevos se insertarán.</span>
                        </p>
                    </div>
                    <label className={`w-full py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${backupLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {backupLoading ? 'Subiendo...' : <><Plus className="w-4 h-4" /> Seleccionar Archivo JSON</>}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportBackup}
                            disabled={backupLoading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );

    // Components
    const renderCompanyTab = () => (
        <form onSubmit={handleCompanySave} className="space-y-6">
            <div className="flex items-start gap-8">
                {/* Logo Section */}
                <div className="w-48 space-y-4 text-center">
                    <div className="relative group">
                        <div className="w-40 h-40 mx-auto rounded-2xl bg-slate-50 dark:bg-[#0f172a] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                            {companySettings.logo ? (
                                <img src={companySettings.logo} alt="Logo Empresa" className="w-full h-full object-contain" />
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 mb-2" />
                                    <span className="text-[10px] uppercase font-black">Sin Logo</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">URL del Logo</label>
                        <input
                            type="text"
                            name="logo"
                            value={companySettings.logo || ''}
                            onChange={handleCompanyChange}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Info Fields */}
                <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nombre Comercial</label>
                            <input
                                type="text"
                                name="nombre_comercial"
                                value={companySettings.nombre_comercial}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Razón Social</label>
                            <input
                                type="text"
                                name="razon_social"
                                value={companySettings.razon_social}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">RUC</label>
                            <input
                                type="text"
                                name="ruc"
                                value={companySettings.ruc}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">DV</label>
                            <input
                                type="text"
                                name="dv"
                                value={companySettings.dv}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                            <input
                                type="text"
                                name="telefono"
                                value={companySettings.telefono}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                name="correo"
                                value={companySettings.correo}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Ciudad</label>
                            <input
                                type="text"
                                name="ciudad"
                                value={companySettings.ciudad}
                                onChange={handleCompanyChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Dirección Completa</label>
                            <textarea
                                name="direccion"
                                value={companySettings.direccion}
                                onChange={handleCompanyChange}
                                required
                                rows="3"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                    type="submit"
                    disabled={companySaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {companySaving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Información</>}
                </button>
            </div>
        </form>
    );

    const renderSmtpTab = () => (
        <form onSubmit={handleSmtpSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Servidor SMTP (Host)</label>
                    <div className="relative">
                        <Server className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="smtp_host"
                            value={smtpSettings.smtp_host}
                            onChange={handleSmtpChange}
                            placeholder="smtp.gmail.com"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Puerto</label>
                    <input
                        type="text"
                        name="smtp_port"
                        value={smtpSettings.smtp_port}
                        onChange={handleSmtpChange}
                        placeholder="587"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Usuario SMTP</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="smtp_user"
                            value={smtpSettings.smtp_user}
                            onChange={handleSmtpChange}
                            placeholder="tu-email@dominio.com"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña SMTP</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="password"
                            name="smtp_password"
                            value={smtpSettings.smtp_password}
                            onChange={handleSmtpChange}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Remitente (From)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            name="smtp_from_email"
                            value={smtpSettings.smtp_from_email}
                            onChange={handleSmtpChange}
                            placeholder="no-reply@dominio.com (Opcional)"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-4 items-center">
                    <input
                        type="email"
                        placeholder="Email para prueba..."
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-64 outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testing || !testEmail}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {testing ? 'Enviando...' : <><Send className="w-4 h-4" /> Probar Envío</>}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={smtpSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {smtpSaving ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Configuración</>}
                </button>
            </div>
        </form>
    );

    const renderConfigTable = (items, entityName) => (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase">
                        {editingConfigItem ? `Editar ${entityName}` : `Agregar ${entityName}`}
                    </h3>
                    {editingConfigItem && (
                        <button
                            onClick={() => {
                                setEditingConfigItem(null);
                                setNewItemName('');
                                setNewItemDesc('');
                            }}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Cancelar Edición
                        </button>
                    )}
                </div>
                <form onSubmit={handleCreateConfigItem} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                            placeholder={`Nombre de ${entityName}`}
                            required
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Descripción (Opcional)</label>
                        <input
                            type="text"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                            placeholder="Breve descripción..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newItemName.trim()}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px] disabled:opacity-50 disabled:cursor-not-allowed ${editingConfigItem ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {editingConfigItem ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingConfigItem ? 'Actualizar' : 'Agregar'}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {configLoading ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-500">Cargando...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-500">No hay elementos registrados.</td></tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{item.nombre}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{item.descripcion || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            setEditingConfigItem(item);
                                            setNewItemName(item.nombre);
                                            setNewItemDesc(item.descripcion || '');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="text-slate-400 hover:text-amber-500 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors mr-1"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteConfigItem(item.id)}
                                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const startEditWarehouse = (item) => {
        setEditingWarehouse(item);
        setNewItemName(item.nombre);
        setNewItemLocation(item.ubicacion || '');
        setNewItemDesc(item.descripcion || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditWarehouse = () => {
        setEditingWarehouse(null);
        setNewItemName('');
        setNewItemLocation('');
        setNewItemDesc('');
    };

    const renderWarehousesTable = () => (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase">
                        {editingWarehouse ? 'Editar Bodega' : 'Agregar Bodega'}
                    </h3>
                    {editingWarehouse && (
                        <button onClick={cancelEditWarehouse} className="text-xs text-red-500 hover:underline">Cancelar Edición</button>
                    )}
                </div>
                <form onSubmit={handleCreateConfigItem} className="flex gap-4 items-end">
                    <div className="flex-[2]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 font-bold"
                            placeholder="Nombre Bodega"
                            required
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ubicación</label>
                        <input
                            type="text"
                            value={newItemLocation}
                            onChange={(e) => setNewItemLocation(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                            placeholder="Dirección física..."
                            required
                        />
                    </div>
                    <div className="flex-[3]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
                        <input
                            type="text"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                            placeholder="Opcional..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newItemName.trim()}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px] disabled:opacity-50 ${editingWarehouse ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {editingWarehouse ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingWarehouse ? 'Actualizar' : 'Agregar'}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Ubicación</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {configLoading ? (
                            <tr><td colSpan="4" className="text-center py-8 text-slate-500">Cargando...</td></tr>
                        ) : warehouses.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-slate-500">No hay bodegas registradas.</td></tr>
                        ) : warehouses.map((item) => (
                            <React.Fragment key={item.id}>
                                <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedWarehouse?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{item.nombre}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{item.ubicacion}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{item.descripcion || '-'}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => startEditWarehouse(item)}
                                            className="text-slate-400 hover:text-amber-500 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                            title="Editar Bodega"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedWarehouse?.id === item.id) {
                                                    setSelectedWarehouse(null);
                                                } else {
                                                    setSelectedWarehouse(item);
                                                    fetchWarehouseLocations(item.id);
                                                    cancelEditLocation();
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-bold uppercase ${selectedWarehouse?.id === item.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                            title="Gestionar Ubicaciones"
                                        >
                                            <MapPin className="w-4 h-4" /> Ubicaciones
                                        </button>
                                        <button
                                            onClick={() => handleDeleteConfigItem(item.id)}
                                            className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                                {selectedWarehouse?.id === item.id && (
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 ml-8">
                                                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                                                    <ArrowDownRight className="w-4 h-4" />
                                                    Ubicaciones en {item.nombre}
                                                </h4>

                                                <form onSubmit={handleCreateLocation} className="flex gap-3 mb-4 items-end">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                            {editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newLocationName}
                                                            onChange={(e) => setNewLocationName(e.target.value)}
                                                            className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs outline-none focus:border-blue-500 font-bold ${editingLocation ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200 dark:border-slate-600'}`}
                                                            placeholder="Nombre Ubicación (ej: Rack A1)"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={newLocationDesc}
                                                            onChange={(e) => setNewLocationDesc(e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-blue-500"
                                                            placeholder="Descripción (opcional)"
                                                        />
                                                    </div>
                                                    <button type="submit" className={`text-white px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors h-[34px] ${editingLocation ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
                                                        {editingLocation ? 'Actualizar' : 'Agregar'}
                                                    </button>
                                                    {editingLocation && (
                                                        <button type="button" onClick={cancelEditLocation} className="text-slate-400 hover:text-red-500 px-2 py-2">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </form>

                                                <div className="space-y-1">
                                                    {warehouseLocations.length === 0 ? (
                                                        <div className="text-center py-4 text-xs text-slate-400 italic">No hay ubicaciones creadas.</div>
                                                    ) : warehouseLocations.map(loc => (
                                                        <div key={loc.id} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-100 group">
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{loc.nombre}</div>
                                                                {loc.descripcion && <div className="text-[10px] text-slate-400">{loc.descripcion}</div>}
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => startEditLocation(loc)} className="text-slate-400 hover:text-amber-500 p-1">
                                                                    <Pencil className="w-3 h-3" />
                                                                </button>
                                                                <button onClick={() => handleDeleteLocation(loc.id)} className="text-slate-400 hover:text-red-500 p-1">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración del Sistema</h2>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'company' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Building className="w-4 h-4" /> Empresa
                </button>
                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'smtp' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Mail className="w-4 h-4" /> SMTP / Correo
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Categorías de Activos
                </button>
                <button
                    onClick={() => setActiveTab('locations')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'locations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <MapPin className="w-4 h-4" /> Ubicación de Activo
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'types' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Tag className="w-4 h-4" /> Tipos de Activos
                </button>
                <button
                    onClick={() => setActiveTab('payment-terms')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'payment-terms' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <CreditCard className="w-4 h-4" /> Términos de Pago
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'brands' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Tag className="w-4 h-4" /> Marcas
                </button>
                <button
                    onClick={() => setActiveTab('warehouses')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'warehouses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Box className="w-4 h-4" /> Bodegas y Ubicaciones
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <ClipboardList className="w-4 h-4" /> Tipos de Tarea
                </button>
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'backup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Shield className="w-4 h-4" /> Respaldo y Restauración
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {activeTab === 'company' && renderCompanyTab()}
                {activeTab === 'smtp' && renderSmtpTab()}
                {activeTab === 'categories' && renderConfigTable(categories, 'Categoría')}
                {activeTab === 'locations' && renderConfigTable(locations, 'Ubicación')}
                {activeTab === 'types' && renderConfigTable(types, 'Tipo de Activo')}
                {activeTab === 'payment-terms' && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase">
                                    {editingPaymentTerm ? 'Editar Término de Pago' : 'Agregar Término de Pago'}
                                </h3>
                                {editingPaymentTerm && (
                                    <button
                                        onClick={() => {
                                            setEditingPaymentTerm(null);
                                            setNewItemName('');
                                            setNewItemDias(0);
                                        }}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Cancelar Edición
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleCreateConfigItem} className="flex gap-4 items-end">
                                <div className="flex-[2]">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 font-bold"
                                        placeholder="Ej: Crédito 30 días"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Días de Crédito</label>
                                    <input
                                        type="number"
                                        value={newItemDias}
                                        onChange={(e) => setNewItemDias(e.target.value)}
                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500"
                                        placeholder="0"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newItemName.trim()}
                                    className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px] disabled:opacity-50 ${editingPaymentTerm ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {editingPaymentTerm ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingPaymentTerm ? 'Actualizar' : 'Agregar'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Término</th>
                                        <th className="px-6 py-4">Días</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {configLoading ? (
                                        <tr><td colSpan="3" className="text-center py-8 text-slate-500">Cargando...</td></tr>
                                    ) : paymentTerms.length === 0 ? (
                                        <tr><td colSpan="3" className="text-center py-8 text-slate-500">No hay términos registrados.</td></tr>
                                    ) : paymentTerms.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white uppercase tracking-tight">{item.nombre}</td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{item.dias} {item.dias === 1 ? 'día' : 'días'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setEditingPaymentTerm(item);
                                                        setNewItemName(item.nombre);
                                                        setNewItemDias(item.dias);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="text-slate-400 hover:text-amber-500 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors mr-1"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteConfigItem(item.id)}
                                                    className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'brands' && renderConfigTable(brands, 'Marca')}
                {activeTab === 'warehouses' && renderWarehousesTable()}
                {activeTab === 'tasks' && renderConfigTable(taskTypes, 'Tipo de Tarea')}
                {activeTab === 'backup' && renderBackupTab()}
            </div>
        </div>
    );
};

export default SettingsPage;
