import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Settings, Wrench, Package, Calendar, MapPin,
    ShieldCheck, Activity, Hash, Clock, AlertTriangle, FileText,
    ChevronRight, ExternalLink
} from 'lucide-react';

const AssetDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        fetchAssetDetail();
    }, [id]);

    const fetchAssetDetail = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/assets/${id}`);
            setAsset(res.data);
        } catch (error) {
            console.error("Error fetching asset details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!asset) return <div className="p-8 text-center text-slate-500">Activo no encontrado.</div>;

    const StatusBadge = ({ status }) => {
        const config = {
            activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
            en_reparacion: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
            baja: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config[status] || config.baja}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al Inventario
                </button>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <FileText className="w-4 h-4" /> Generar Ficha
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col lg:flex-row">
                <div className="lg:w-1/3 aspect-square lg:aspect-auto bg-slate-50 dark:bg-[#0f172a] relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
                    {asset.imagen_url ? (
                        <img
                            src={`http://localhost:3000${asset.imagen_url}`}
                            alt={asset.nombre}
                            className="w-full h-full object-contain rounded-xl shadow-2xl"
                        />
                    ) : (
                        <div className="text-center space-y-4">
                            <Package className="w-20 h-20 text-slate-200 dark:text-slate-700 mx-auto" />
                            <p className="text-slate-400 text-sm italic font-medium">Sin fotografía técnica</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-8 lg:p-10 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={asset.estado} />
                            {asset.categoria && <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">{asset.categoria}</span>}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{asset.nombre}</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                            <Hash className="w-4 h-4" /> {asset.codigo}
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                        {asset.descripcion || "Este activo no cuenta con una descripción detallada registrada actualmente en el sistema."}
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Marca</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.marca || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Modelo</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.modelo || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° de Serie</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.serie || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubicación</span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                {asset.ubicacion || 'N/A'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Año / Cant</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.anio || '---'} / {asset.cantidad || 1}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Color</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.color || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° Motor</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.numero_motor || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° Chasis</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.numero_chasis || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">F. Instalación</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.fecha_instalacion || '---'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubic. Detallada</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{asset.ubicacion_detallada || '---'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="w-6 h-6 opacity-30" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Salud del Activo</span>
                    </div>
                    <div className="text-2xl font-black">94.2%</div>
                    <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-wider">Disponibilidad Operativa Anual</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <Wrench className="w-6 h-6 text-blue-500 opacity-30" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mantenimientos</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{asset.historial?.length || 0}</div>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Registrados en bitácora</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <Clock className="w-6 h-6 text-blue-500 opacity-30" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Próximo Servicio</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">12 Mar 2026</div>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Preventivo Programado</p>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex border-b border-slate-100 dark:border-slate-800 p-2">
                    {[
                        { id: 'history', label: 'Historial', icon: Clock },
                        { id: 'parts', label: 'Repuestos', icon: Package },
                        { id: 'docs', label: 'Manuales', icon: FileText }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            {asset.historial?.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">Sin registros de mantenimiento.</div>
                            ) : (
                                <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                                    {asset.historial.map((item, idx) => (
                                        <div key={idx} className="relative pl-10 group">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-[#1e293b] border-2 border-blue-500 z-10 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                                    <div>
                                                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{item.fecha}</span>
                                                        <h4 className="font-bold text-slate-800 dark:text-white mt-1">Mantenimiento Ejecutado</h4>
                                                    </div>
                                                    <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Responsable</span>
                                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            {item.tecnico}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{item.observaciones || item.tarea}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'parts' && (
                        <div className="space-y-4">
                            {asset.repuestos?.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">Este activo no ha requerido repuestos aún.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {asset.repuestos.map((r, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-bold text-slate-800 dark:text-white">{r.nombre}</h5>
                                                <div className="flex items-center gap-3 mt-1 underline decoration-blue-500/30 text-xs font-medium text-slate-500">
                                                    <span>Cant: {r.cantidad}</span>
                                                    <span>Uso: {r.fecha}</span>
                                                </div>
                                            </div>
                                            <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Documentación Técnica Pendiente</h3>
                            <p className="text-sm text-slate-500 max-w-sm">No hay manuales de usuario o diagramas eléctricos cargados para este equipo.</p>
                            <button className="bg-blue-600/10 text-blue-600 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all">Subir PDF</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetDetailPage;
