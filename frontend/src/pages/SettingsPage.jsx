import React, { useState, useEffect } from 'react';
import { Save, Mail, Server, Shield, Send, Plus, Trash2, Tag, Box, LayoutGrid, MapPin, ClipboardList, Building, Image as ImageIcon } from 'lucide-react';
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
    const [newItemName, setNewItemName] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
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

    useEffect(() => {
        if (activeTab === 'smtp') fetchSmtpSettings();
        if (activeTab === 'company') fetchCompanySettings();
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'types') fetchTypes();
        if (activeTab === 'locations') fetchLocations();
        if (activeTab === 'tasks') fetchTaskTypes();
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

        const endpoint = activeTab === 'categories' ? 'categories' : (activeTab === 'types' ? 'types' : (activeTab === 'locations' ? 'locations' : 'maintenance-tasks'));
        try {
            await api.post(`/asset-config/${endpoint}`, {
                nombre: newItemName,
                descripcion: newItemDesc
            });

            setNewItemName('');
            setNewItemDesc('');
            setMessage({ type: 'success', text: 'Elemento creado correctamente' });

            if (activeTab === 'categories') fetchCategories();
            else if (activeTab === 'types') fetchTypes();
            else if (activeTab === 'locations') fetchLocations();
            else fetchTaskTypes();
        } catch (error) {
            console.error("Error creating item", error);
            setMessage({ type: 'error', text: 'Error creando elemento' });
        }
    };

    const handleDeleteConfigItem = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este elemento?')) return;

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
                <h3 className="text-sm font-bold text-slate-700 dark:text-white uppercase mb-4">Agregar {entityName}</h3>
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 h-[38px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" /> Agregar
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

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración del Sistema</h2>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('smtp')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'smtp' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <Mail className="w-4 h-4" /> SMTP / Correo
                </button>
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'company' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <Building className="w-4 h-4" /> Empresa
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'categories' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Categorías de Activos
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'types' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <Tag className="w-4 h-4" /> Tipos de Activos
                </button>
                <button
                    onClick={() => setActiveTab('locations')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'locations' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <MapPin className="w-4 h-4" /> Ubicaciones
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'tasks' ? 'bg-white dark:bg-[#1e293b] text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <ClipboardList className="w-4 h-4" /> Tipos de Tarea
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {activeTab === 'smtp' && renderSmtpTab()}
                {activeTab === 'company' && renderCompanyTab()}
                {activeTab === 'categories' && renderConfigTable(categories, 'Categoría')}
                {activeTab === 'types' && renderConfigTable(types, 'Tipo de Activo')}
                {activeTab === 'locations' && renderConfigTable(locations, 'Ubicación')}
                {activeTab === 'tasks' && renderConfigTable(taskTypes, 'Tipo de Tarea')}
            </div>
        </div>
    );
};

export default SettingsPage;
