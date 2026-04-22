import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { providerService } from '../services/providerService';
import { paymentTermsService } from '../services/paymentTermsService';

import Modal from '../components/Modal';
import RecordLimitSelector from '../components/RecordLimitSelector';

const ProvidersPage = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentTermsList, setPaymentTermsList] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const [limit, setLimit] = useState(20);

    const initialFormData = {
        nombre_proveedor: '',
        tipo_proveedor: 'repuestos',
        contacto_nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        pais: 'México',
        ciudad: '',
        rut_o_ruc: '',
        dv: '',
        sitio_web: '',
        metodos_pago_aceptados: '',
        observaciones: '',
        estado: 'activo'
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchProviders();
        fetchPaymentTerms();
    }, []);

    const fetchPaymentTerms = async () => {
        try {
            const data = await paymentTermsService.getAll();
            setPaymentTermsList(data);
        } catch (error) {
            console.error("Error fetching payment terms", error);
        }
    };

    const fetchProviders = async () => {
        try {
            const data = await providerService.getAll();
            setProviders(data);
        } catch (error) {
            console.error("Error fetching providers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const openCreateModal = () => {
        setEditingProvider(null);
        setFormData(initialFormData);
        setIsDirty(false);
        setShowModal(true);
    };

    const openEditModal = (provider) => {
        setEditingProvider(provider);
        setFormData({
            nombre_proveedor: provider.nombre,
            tipo_proveedor: provider.tipo || 'repuestos',
            contacto_nombre: provider.contacto || '',
            telefono: provider.telefono || '',
            email: provider.email || '',
            direccion: provider.direccion || '',
            pais: 'México',
            ciudad: provider.ciudad || '',
            rut_o_ruc: provider.rut_o_ruc || '',
            dv: provider.dv || '',
            sitio_web: provider.sitio_web || '',
            metodos_pago_aceptados: provider.metodos_pago_aceptados || '',
            observaciones: provider.observaciones || '',
            estado: provider.estado || 'activo'
        });
        setIsDirty(false);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            if (editingProvider) {
                await providerService.update(editingProvider.id, formData);
            } else {
                await providerService.create(formData);
            }
            setShowModal(false);
            setIsDirty(false);
            fetchProviders();
        } catch (error) {
            console.error("Error saving provider", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar este proveedor?')) {
            try {
                await providerService.delete(id);
                fetchProviders();
            } catch (error) {
                console.error("Error deleting provider", error);
            }
        }
    };

    const filtered = providers.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Proveedores</h2>
                    <p className="text-slate-500 text-sm">Administra suministros y servicios externos</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Proveedor
                    </button>
                </div>
                <div className="flex items-center ml-auto md:ml-0">
                    <RecordLimitSelector limit={limit} onChange={setLimit} />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Cargando...</td></tr>
                            ) : filtered.slice(0, limit).map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                            {p.codigo || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{p.nombre}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 text-xs rounded uppercase font-bold">
                                            {p.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <div>{p.contacto}</div>
                                        <div className="flex gap-2 mt-1">
                                            {p.telefono && <Phone className="w-3 h-3" />}
                                            {p.email && <Mail className="w-3 h-3" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {p.direccion || 'N/A'}
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
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                width="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Code generation is now automatic in backend */}
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Nombre Empresa</label>
                            <input required name="nombre_proveedor" value={formData.nombre_proveedor} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                        <div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">NIT / RUC</label>
                                    <input name="rut_o_ruc" value={formData.rut_o_ruc} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" placeholder="Ej: 12.345.678" />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">DV</label>
                                    <input name="dv" value={formData.dv} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-center" placeholder="000" maxLength="3" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Tipo</label>
                            <select name="tipo_proveedor" value={formData.tipo_proveedor} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none">
                                <option value="repuestos">Repuestos</option>
                                <option value="mano_obra">Mano de Obra</option>
                                <option value="ambos">Mixto (Ambos)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Contacto</label>
                            <input name="contacto_nombre" value={formData.contacto_nombre} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" placeholder="Nombre Contacto" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Sitio Web</label>
                            <input name="sitio_web" value={formData.sitio_web} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" placeholder="https://..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Términos de Pago</label>
                            <select
                                name="metodos_pago_aceptados"
                                value={formData.metodos_pago_aceptados}
                                onChange={handleInputChange}
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none font-bold"
                            >
                                <option value="">Seleccionar...</option>
                                {paymentTermsList.map(term => (
                                    <option key={term.id} value={term.nombre}>{term.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Email</label>
                            <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Dirección</label>
                        <input name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Ciudad</label>
                            <input name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">País</label>
                            <input name="pais" value={formData.pais} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Observaciones</label>
                        <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none h-20 resize-none" />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProvidersPage;
