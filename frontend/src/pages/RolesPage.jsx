import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Shield, Loader2, Check } from 'lucide-react';

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        permisos: [] // List of IDs
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                axios.get('http://localhost:3000/api/roles'),
                axios.get('http://localhost:3000/api/permissions')
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        // Map permission codes back to IDs for the form (since frontend uses IDs for selection)
        // Wait, the GET roles endpoint returns Perm Codes (strings).
        // The GET permissions endpoint returns Objects with IDs and Codes.
        // We need to match them.
        const currentPermIds = role.permisos.map(code => {
            const p = permissions.find(p => p.codigo === code);
            return p ? p.id : null;
        }).filter(id => id !== null);

        setFormData({
            nombre: role.nombre,
            descripcion: role.descripcion || '',
            permisos: currentPermIds
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este rol? Los usuarios asignados podrían perder acceso.")) return;
        try {
            await axios.delete(`http://localhost:3000/api/roles/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar rol");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await axios.put(`http://localhost:3000/api/roles/${editingRole.id}`, formData);
            } else {
                await axios.post('http://localhost:3000/api/roles', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error al guardar rol");
        }
    };

    const togglePermission = (id) => {
        setFormData(prev => {
            const exists = prev.permisos.includes(id);
            if (exists) {
                return { ...prev, permisos: prev.permisos.filter(p => p !== id) };
            } else {
                return { ...prev, permisos: [...prev.permisos, id] };
            }
        });
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, p) => {
        const mod = p.modulo || 'General';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Roles y Permisos</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona los niveles de acceso al sistema</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRole(null);
                        setFormData({ nombre: '', descripcion: '', permisos: [] });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nuevo Rol
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(role)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{role.nombre}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">{role.descripcion || 'Sin descripción'}</p>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                <div className="text-xs font-bold uppercase text-slate-400 mb-2">Permisos ({role.permisos.length})</div>
                                <div className="flex flex-wrap gap-1">
                                    {role.permisos.slice(0, 5).map(perm => (
                                        <span key={perm} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                            {perm}
                                        </span>
                                    ))}
                                    {role.permisos.length > 5 && (
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                            +{role.permisos.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingRole ? 'Editar' : 'Crear'} Rol</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nombre del Rol</label>
                                        <input
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            placeholder="Ej. Jefe de Mantenimiento"
                                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Descripción</label>
                                        <input
                                            value={formData.descripcion}
                                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                            placeholder="Breve descripción de responsabilidades..."
                                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-3 block">Asignar Permisos</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => (
                                            <div key={module} className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 capitalize border-b border-slate-200 dark:border-slate-700 pb-2">{module}</h4>
                                                <div className="space-y-2">
                                                    {perms.map(p => (
                                                        <label key={p.id} className="flex items-start gap-3 cursor-pointer group">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.permisos.includes(p.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'}`}>
                                                                {formData.permisos.includes(p.id) && <Check className="w-3 h-3" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={formData.permisos.includes(p.id)}
                                                                onChange={() => togglePermission(p.id)}
                                                            />
                                                            <div className="text-sm">
                                                                <div className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{p.descripcion}</div>
                                                                <div className="text-xs text-slate-400 font-mono">{p.codigo}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 transition-colors">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20">Guardar Rol</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesPage;
