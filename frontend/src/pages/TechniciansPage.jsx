import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserPlus, UserCheck, UserX, Briefcase, HelpCircle } from 'lucide-react';
import { technicianService } from '../services/technicianService';
import { providerService } from '../services/providerService';
import Modal from '../components/Modal';

const TechniciansPage = () => {
    const [technicians, setTechnicians] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editingTech, setEditingTech] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormData = {
        nombre: '',
        apellido: '',
        especialidad: '',
        es_independiente: true,
        proveedor_id: null,
        telefono: '',
        email: '',
        costo_hora: 0,
        estado: 'activo'
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [techs, provs] = await Promise.all([
                technicianService.getAll(),
                providerService.getAll()
            ]);
            setTechnicians(techs);
            setProviders(provs);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name === 'es_independiente' && val === true) {
            setFormData(prev => ({ ...prev, [name]: val, proveedor_id: null }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }
        setIsDirty(true);
    };

    const openCreateModal = () => {
        setEditingTech(null);
        setFormData(initialFormData);
        setIsDirty(false);
        setShowModal(true);
    };

    const openEditModal = (tech) => {
        setEditingTech(tech);
        setFormData({
            ...tech,
            costo_hora: parseFloat(tech.costo_hora) || 0,
            proveedor_id: tech.proveedor_id || null
        });
        setIsDirty(false);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const payload = {
            ...formData,
            costo_hora: parseFloat(formData.costo_hora),
            proveedor_id: formData.es_independiente ? null : parseInt(formData.proveedor_id)
        };
        try {
            if (editingTech) {
                await technicianService.update(editingTech.id, payload);
            } else {
                await technicianService.create(payload);
            }
            setShowModal(false);
            setIsDirty(false);
            fetchData();
        } catch (error) {
            console.error("Error saving technician", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Inactivar técnico?')) {
            try {
                await technicianService.delete(id);
                fetchData();
            } catch (error) {
                console.error("Error deleting", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Equipo Técnico</h2>
                    <p className="text-slate-500 text-sm">Gestiona personal interno y externo</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Técnico
                    </button>
                </div>
            </div>

            {/* Filters Header */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, especialidad o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 pl-9 text-sm font-bold outline-none"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none"
                        onChange={(e) => {/* Add filter state later if needed, mostly handled by search for now */ }}
                    >
                        <option value="all">Todas las modalidades</option>
                        <option value="independent">Independiente</option>
                        <option value="provider">Proveedor</option>
                    </select>
                    <select
                        className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none"
                    >
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Código</th>
                                <th className="px-6 py-4">Técnico</th>
                                <th className="px-6 py-4">Modalidad</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4">Costo/Hora</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-10">Cargando...</td></tr>
                            ) : technicians.filter(t =>
                                t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                t.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (t.especialidad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (t.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((tech) => (
                                <tr key={tech.id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                            {tech.codigo || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tech.es_independiente ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white text-sm">{tech.nombre} {tech.apellido}</div>
                                                <div className="text-xs text-slate-500 uppercase">{tech.especialidad || 'General'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold ${tech.es_independiente ? 'text-amber-600' : 'text-indigo-600'}`}>
                                            {tech.es_independiente ? 'INDEPENDIENTE' : (providers.find(p => p.id === tech.proveedor_id)?.nombre || 'PROVEEDOR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            <div>{tech.email || '-'}</div>
                                            <div className="text-xs opacity-70">{tech.telefono || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 dark:text-slate-300">${tech.costo_hora}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${tech.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {tech.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(tech)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(tech.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
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
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={editingTech ? 'Editar Técnico' : 'Registro de Técnico'}
            >
                <form onSubmit={handleSubmit} className="p-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            {/* Code generation is now automatic in backend */}
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Código Técnico (Auto)</label>
                            <input disabled value="Generado al guardar" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-400 cursor-not-allowed italic" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Nombre</label>
                            <input required name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Apellido</label>
                            <input required name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input type="checkbox" name="es_independiente" checked={formData.es_independiente} onChange={handleInputChange} className="w-4 h-4" />
                        <span className="text-sm font-medium">Trabaja de forma Independiente</span>
                    </div>

                    {!formData.es_independiente && (
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Proveedor Asociado</label>
                            <select name="proveedor_id" value={formData.proveedor_id || ''} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none">
                                <option value="">Seleccionar Proveedor...</option>
                                {providers.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Especialidad</label>
                            <input name="especialidad" value={formData.especialidad || ''} onChange={handleInputChange} placeholder="ej. Electricista" className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Costo Hora ($)</label>
                            <input type="number" name="costo_hora" value={formData.costo_hora} onChange={handleInputChange} className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none" />
                        </div>
                    </div>

                </form>
            </Modal>
        </div>
    );
};

export default TechniciansPage;
