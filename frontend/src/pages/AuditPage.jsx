import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Shield, Search, Filter, History, User,
    Globe, Terminal, Database, ArrowRight
} from 'lucide-react';

const AuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await axios.get('/api/audit');
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const ActionBadge = ({ action }) => {
        const config = {
            CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
            UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
            DELETE: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
            DELETE_SOFT: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
            LOGIN: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${config[action] || "bg-slate-100 text-slate-600"}`}>
                {action}
            </span>
        );
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleString('es-ES', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const filtered = logs.filter(l =>
        l.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.tabla.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-[#0f172a] rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">AUDITORÍA DE SISTEMA</h2>
                        <p className="text-slate-500 text-sm font-medium">Trazabilidad completa de acciones y cambios</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar acción o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none w-64 focus:border-blue-500 transition-all font-medium"
                        />
                    </div>
                    <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                        <History className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Audit List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Acción / Fecha</th>
                                <th className="px-8 py-4">Usuario</th>
                                <th className="px-8 py-4">Entidad Afectada</th>
                                <th className="px-8 py-4">Detalles del Cambio</th>
                                <th className="px-8 py-4">Origen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20 animate-pulse font-bold text-slate-400">Recuperando registros de seguridad...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-slate-400">No se encontraron registros de auditoría.</td></tr>
                            ) : filtered.map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-[#0f172a]/30 transition-all">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <ActionBadge action={l.accion} />
                                            <span className="text-[10px] font-bold text-slate-400">{formatDate(l.fecha)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{l.usuario}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-black uppercase tracking-wider">
                                            <Database className="w-3.5 h-3.5 text-slate-300" />
                                            {l.tabla}
                                        </div>
                                        {l.registro_id && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-300">
                                                ID REGISTRO: <span className="text-blue-500">{l.registro_id}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="max-w-xs text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
                                            "{l.detalle || 'Sin detalles registrados'}"
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            <Globe className="w-3.5 h-3.5" />
                                            {l.ip || '---'}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-300 font-bold">
                                            <Terminal className="w-3 h-3" /> API_REST_V1
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;
