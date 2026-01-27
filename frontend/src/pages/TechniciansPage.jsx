import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, UserPlus, UserCheck, UserX, Briefcase, HelpCircle } from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';

const TechniciansPage = () => {
    const [technicians, setTechnicians] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTech, setEditingTech] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormData = {
        codigo_tecnico: '',
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
            const [techRes, provRes] = await Promise.all([
                axios.get('http://localhost:3000/api/technicians'),
                axios.get('http://localhost:3000/api/providers')
            ]);
            setTechnicians(techRes.data);
            setProviders(provRes.data);
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
    };

    const openCreateModal = () => {
        setEditingTech(null);
        setFormData({
            ...initialFormData,
            codigo_tecnico: generateCode('TEC-')
        });
        setShowModal(true);
    };

    const openEditModal = (tech) => {
        setEditingTech(tech);
        setFormData({
            ...tech,
            codigo_tecnico: tech.codigo || '',
            costo_hora: parseFloat(tech.costo_hora) || 0,
            proveedor_id: tech.proveedor_id || null
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            costo_hora: parseFloat(formData.costo_hora),
            proveedor_id: formData.es_independiente ? null : parseInt(formData.proveedor_id)
        };
        try {
            if (editingTech) {
                await axios.put(`http://localhost:3000/api/technicians/${editingTech.id}`, payload);
            } else {
                await axios.post('http://localhost:3000/api/technicians', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error("Error saving technician", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Inactivar técnico?')) {
            try {
                await axios.delete(`http://localhost:3000/api/technicians/${id}`);
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <p className="col-span-full text-center py-10">Cargando equipo...</p>
                ) : technicians.map((tech) => (
                    <div key={tech.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${tech.es_independiente ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{tech.nombre} {tech.apellido}</h4>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">{tech.especialidad || 'General'}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEditModal(tech)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(tech.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Modalidad:</span>
                                <span className={`font-medium ${tech.es_independiente ? 'text-amber-600' : 'text-indigo-600'}`}>
                                    {tech.es_independiente ? 'Independiente' : providers.find(p => p.id === tech.proveedor_id)?.nombre || 'Proveedor Externo'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Costo Hora:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">${tech.costo_hora}</span>
                            </div>
                        </div>

                        <div className={`text-center py-1 rounded-lg text-xs font-bold uppercase ${tech.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {tech.estado}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold">{editingTech ? 'Editar' : 'Registro de'} Técnico</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Código Técnico *</label>
                                    <div className="relative">
                                        <input required name="codigo_tecnico" value={formData.codigo_tecnico} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none pr-20" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, codigo_tecnico: generateCode('TEC-') }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-300 transition-colors uppercase">Regenerar</button>
                                    </div>
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

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2">Cancelar</button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechniciansPage;
