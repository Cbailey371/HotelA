import React, { useState, useEffect } from 'react';
import holidaysService from '../services/holidays';
import { Calendar, Plus, Trash2, Edit, Save, X, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';

const HolidaysPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({
        fecha: '',
        descripcion: '',
        es_fijo: true
    });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, [year]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await holidaysService.getAll(year);
            setHolidays(res.data);
        } catch (error) {
            console.error("Error fetching holidays", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm(`¿Cargar feriados automáticos para el año ${year}?`)) return;
        try {
            await holidaysService.seed(year);
            fetchHolidays();
            alert('Feriados cargados exitosamente');
        } catch (error) {
            console.error("Error seeding holidays", error);
            alert('Error al cargar feriados');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este feriado?')) return;
        try {
            await holidaysService.delete(id);
            fetchHolidays();
            alert('Feriado eliminado');
        } catch (error) {
            console.error("Error deleting", error);
            alert('Error al eliminar');
        }
    };

    const handleEdit = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({
            fecha: holiday.fecha,
            descripcion: holiday.descripcion,
            es_fijo: holiday.es_fijo
        });
        setIsDirty(false);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingHoliday(null);
        setFormData({
            fecha: '',
            descripcion: '',
            es_fijo: true
        });
        setIsDirty(false);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHoliday) {
                await holidaysService.update(editingHoliday.id, formData);
                alert('Feriado actualizado');
            } else {
                await holidaysService.create(formData);
                alert('Feriado creado');
            }
            setShowModal(false);
            fetchHolidays();
        } catch (error) {
            console.error("Error saving holiday", error);
            alert('Error al guardar');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">FERIADOS NACIONALES</h2>
                        <p className="text-slate-500 text-sm font-medium">Gestión de días no laborables {year}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 uppercase">Año:</span>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                            {[year - 1, year, year + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleSeed}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                        title="Cargar Feriados Automáticos"
                    >
                        <RefreshCw className="w-4 h-4" /> Auto
                    </button>
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Feriado
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Descripción</th>
                                <th className="px-8 py-4">Tipo</th>
                                <th className="px-8 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-10 animate-pulse text-sm font-bold text-slate-400">Cargando...</td></tr>
                            ) : holidays.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold">No hay feriados registrados para {year}.</td></tr>
                            ) : holidays.map((h) => (
                                <tr key={h.id} className="group hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all">
                                    <td className="px-8 py-4 font-bold text-slate-700 dark:text-slate-200">
                                        {h.fecha}
                                    </td>
                                    <td className="px-8 py-4 font-medium text-slate-600 dark:text-slate-300">
                                        {h.descripcion}
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${h.es_fijo ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {h.es_fijo ? 'Fijo' : 'Variable'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(h)}
                                                className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(h.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={editingHoliday ? 'Editar Feriado' : 'Nuevo Feriado'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
                        <input
                            type="date"
                            name="fecha"
                            required
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                        <input
                            type="text"
                            name="descripcion"
                            required
                            value={formData.descripcion}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <input
                            type="checkbox"
                            name="es_fijo"
                            id="es_fijo"
                            checked={formData.es_fijo}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor="es_fijo" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Es Feriado Fijo (Recurrente)</label>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HolidaysPage;
