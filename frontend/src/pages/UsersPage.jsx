import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Shield, Mail, User } from 'lucide-react';
import { generateCode } from '../utils/codeGenerator';
import Modal from '../components/Modal';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null); // Added missing state
    const [isDirty, setIsDirty] = useState(false);
    const [formData, setFormData] = useState({
        codigo_usuario: '',
        nombre: '',
        apellido: '',
        email: '',
        usuario: '',
        password: '',
        cargo: '',
        role_id: '',
        estado: 'activo'
    });

    const [roles, setRoles] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            setError(error.response?.status === 403 ? "No tienes permisos para ver esta lista" : "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setFormData({
            codigo_usuario: user.codigo || '',
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            usuario: user.usuario,
            password: '', // Password stays empty unless changed
            cargo: user.cargo || '',
            role_id: user.rol_id || '',
            estado: user.estado || 'activo'
        });
        setShowModal(true);
        setIsDirty(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            alert("Error al eliminar usuario");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';
            const payload = {
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                usuario: user.usuario,
                password: "",
                cargo: user.cargo,
                codigo_usuario: user.codigo,
                role_id: user.rol_id,
                estado: newStatus
            };

            await api.put(`/users/${user.id}`, payload);
            fetchUsers();
        } catch (error) {
            alert("Error al cambiar estado");
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const payload = {
                ...formData,
                role_id: formData.role_id ? parseInt(formData.role_id) : null
            };

            if (editingId) {
                await api.put(`/users/${editingId}`, payload);
            } else {
                await api.post('/users', payload);
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            alert("Error al guardar usuario");
        }
    };

    const resetForm = () => {
        setFormData({ codigo_usuario: '', nombre: '', apellido: '', email: '', usuario: '', password: '', cargo: '', role_id: '', estado: 'activo' });
        setEditingId(null);
        setIsDirty(false);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.cargo || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole ? (user.rol_id === parseInt(filterRole)) : true;
        const matchesStatus = filterStatus ? (user.estado === filterStatus) : true;

        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Usuarios del Sistema</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona el acceso y roles del personal</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                    <Plus className="w-4 h-4" /> Nuevo Usuario
                </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-300"
                    >
                        <option value="">Todos los Roles</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-300"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Código</th>
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
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-500 italic">No se encontraron usuarios</td></tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                        {user.codigo || 'N/A'}
                                    </span>
                                </td>
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
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{user.rol_nombre || 'Sin Rol'}</span>
                                        <span className="text-xs text-slate-500">{user.cargo || 'Sin cargo'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleStatus(user)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.estado === 'activo'
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400'
                                            }`}
                                    >
                                        {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                            title="Editar Usuario"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                            title="Eliminar Usuario"
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

            {/* Modal Crear/Editar Usuario */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSubmit}
                isDirty={isDirty}
                title={editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Code generation is now automatic in backend */}
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
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                            Contraseña {editingId && "(Dejar en blanco para no cambiar)"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                required={!editingId}
                                type="text" // Changed to text to see the generated password, or keep password and add show/hide? Usually generated passwords need to be seen.
                                // Actually, let's keep it simple: input type="text" if generated? Or just toggle visibility.
                                // The user wants to generate it.
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder={editingId ? "********" : ""}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
                                    let pass = "";
                                    for (let i = 0; i < 12; i++) {
                                        pass += charset.charAt(Math.floor(Math.random() * charset.length));
                                    }
                                    setFormData(prev => ({ ...prev, password: pass }));
                                    setIsDirty(true);
                                }}
                                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title="Generar Contraseña Segura"
                            >
                                <Shield className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Rol Asignado</label>
                        <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                        >
                            <option value="">Seleccionar Rol...</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Cargo</label>
                        <input name="cargo" value={formData.cargo} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none" />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsersPage;
