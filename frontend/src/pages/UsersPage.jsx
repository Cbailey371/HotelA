import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Shield, Mail, User } from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        codigo_usuario: '',
        nombre: '',
        apellido: '',
        email: '',
        usuario: '',
        password: '',
        cargo: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('http://localhost:3000/api/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
            setError(error.response?.status === 403 ? "No tienes permisos para ver esta lista" : "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/users', formData);
            setShowModal(false);
            setFormData({ codigo_usuario: '', nombre: '', apellido: '', email: '', usuario: '', password: '', cargo: '' });
            fetchUsers();
        } catch (error) {
            console.error("Error creating user", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Usuarios del Sistema</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona el acceso y roles del personal</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ ...formData, codigo_usuario: generateCode('USR-') });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-4 h-4" /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol / Cargo</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-8 text-slate-500 font-medium">Cargando usuarios...</td></tr>
                        ) : error ? (
                            <tr><td colSpan="4" className="text-center py-8 text-red-500 font-medium">{error}</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-slate-500 italic">No hay usuarios registrados</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-white font-bold">
                                            {user.nombre[0]}{user.apellido[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-white">{user.nombre} {user.apellido}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-700 dark:text-slate-200">Usuario (Por defecto)</span>
                                        <span className="text-xs text-slate-500">{user.cargo || 'Sin cargo'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${user.estado === 'activo' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                        }`}>
                                        {user.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear Usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Crear Nuevo Usuario</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Código Usuario *</label>
                                    <div className="relative">
                                        <input required name="codigo_usuario" value={formData.codigo_usuario} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none pr-20" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, codigo_usuario: generateCode('USR-') }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors uppercase">Regenerar</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                                    <input required name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Apellido</label>
                                    <input required name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Email</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Usuario (Login)</label>
                                <input required name="usuario" value={formData.usuario} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Contraseña</label>
                                <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Cargo</label>
                                <input name="cargo" value={formData.cargo} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
