import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft, Settings, Wrench, Package, Calendar, MapPin,
    ShieldCheck, Activity, Hash, Clock, AlertTriangle, FileText,
    ChevronRight, ExternalLink, Upload, Download, Edit2, Info, QrCode, Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'react-qr-code';
import AssetFormModal from '../components/AssetFormModal';

const AssetDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [uploading, setUploading] = useState(false);
    const [standardComponents, setStandardComponents] = useState([]);

    // Actions State
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchAssetDetail();
        fetchStandardComponents();
    }, [id]);

    const fetchStandardComponents = async () => {
        try {
            const res = await api.get('/asset-config/standard-components');
            setStandardComponents(res.data);
        } catch (error) {
            console.error("Error fetching standard components", error);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchAssetDetail = async () => {
        try {
            const res = await api.get(`/assets/${id}`);
            setAsset(res.data);
        } catch (error) {
            console.error("Error fetching asset details", error);
            if (error.response?.status === 403) {
                setIsUnauthorized(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateHealth = () => {
        if (!asset || !asset.historial) return 100;
        const maintenanceCount = asset.historial.length;
        // Simple heuristic: 100% - 2% per maintenance event, capped at 0%
        return Math.max(0, 100 - (maintenanceCount * 2)).toFixed(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleGeneratePDF = () => {
        setShowMenu(false);
        const doc = new jsPDF();

        // Header
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(asset.nombre, 14, 25);
        doc.setFontSize(12);
        doc.text(`Código: ${asset.codigo}`, 14, 32);

        // Metadata
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);

        // Find last maintenance
        const lastMaintenance = asset.historial && asset.historial.length > 0
            ? asset.historial[0]
            : null;

        const details = [
            ['Marca', asset.marca || '---', 'Modelo', asset.modelo || '---'],
            ['Serie', asset.serie || '---', 'Ubicación', asset.ubicacion || '---'],
            ['Año', asset.anio?.toString() || '---', 'Color', asset.color || '---'],
            ['Motor', asset.numero_motor || '---', 'Chasis', asset.numero_chasis || '---'],
            ['Instalación', asset.fecha_instalacion || '---', 'Estado', asset.estado || '---'],
            ['Último Mantenimiento', lastMaintenance ? `${lastMaintenance.fecha} (${lastMaintenance.tecnico})` : 'Sin registros']
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Atributo', 'Valor', 'Atributo', 'Valor']],
            body: details,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Maintenance History
        if (asset.historial && asset.historial.length > 0) {
            doc.text("Historial de Mantenimiento", 14, doc.lastAutoTable.finalY + 15);

            const historyRows = asset.historial.map(h => [
                h.fecha,
                h.tecnico,
                h.tarea || h.observaciones
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Fecha', 'Técnico', 'Tarea/Observaciones']],
                body: historyRows,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] }
            });
        }

        // Spare Parts
        if (asset.repuestos && asset.repuestos.length > 0) {
            doc.text("Repuestos Utilizados", 14, doc.lastAutoTable.finalY + 15);

            const partsRows = asset.repuestos.map(r => [
                r.fecha,
                r.nombre,
                r.cantidad
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Fecha', 'Repuesto', 'Cantidad']],
                body: partsRows,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] }
            });
        }

        doc.save(`Ficha_Tecnica_${asset.codigo}.pdf`);
    };

    const handleUploadManual = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload file
            const uploadRes = await api.post('/upload/manual', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Link to asset
            await api.post(`/assets/${id}/documents`, {
                nombre_archivo: file.name,
                url_archivo: uploadRes.data.url
            });

            // 3. Refresh list
            fetchAssetDetail();
        } catch (error) {
            console.error("Error uploading manual", error);
            alert("Error al subir el manual");
        } finally {
            setUploading(false);
        }
    };

    const handlePrintLabel = () => {
        const content = document.getElementById('printable-qr');
        if (!content) return;

        const win = window.open('', '', 'height=600,width=600');
        win.document.write('<html><head><title>Etiqueta de Activo</title>');
        win.document.write('<style>');
        win.document.write(`
            @media print {
                @page { margin: 0; size: auto; }
                body { margin: 10px; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-col; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .label-container { 
                text-align: center; 
                border: 2px solid #000; 
                padding: 20px; 
                border-radius: 12px; 
                max-width: 300px;
                width: 100%;
                background: white;
            }
            .header { font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
            .code { font-size: 16px; font-weight: 900; margin-top: 15px; font-family: monospace; letter-spacing: 1px; color: #0f172a; }
            .admin-code { font-size: 14px; font-weight: 700; margin-top: 4px; color: #475569; }
            .name { font-size: 12px; margin-top: 8px; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #334155; }
        `);
        win.document.write('</style></head><body>');
        win.document.write(content.outerHTML);
        win.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
        win.document.write('</body></html>');
        win.document.close();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (isUnauthorized) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="inline-flex p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 mb-8 animate-in zoom-in-95 duration-500">
                    <Lock className="w-16 h-16 text-amber-500" />
                </div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Acceso Restringido</h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                    No tiene permisos para ver los detalles técnicos de este activo. Si considera que esto es un error, contacte con el administrador.
                </p>
                <button 
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-500/20"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver atrás
                </button>
            </div>
        );
    }

    if (!asset) return (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <div className="inline-flex p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-8">
                <AlertTriangle className="w-16 h-16 text-slate-300" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Activo no encontrado</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                El equipo que está intentando consultar no existe en nuestro inventario actual o ha sido dado de baja.
            </p>
            <button 
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-500/20"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al Inventario
            </button>
        </div>
    );

    const StatusBadge = ({ status }) => {
        const config = {
            activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
            en_reparacion: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
            baja: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config[status] || config.baja}`}>
                {status?.replace('_', ' ') || 'N/A'}
            </span>
        );
    };

    const isRoom = () => {
        if (!asset) return false;
        const tipo = asset.tipo_activo?.toLowerCase() || '';
        const cat = asset.categoria?.toLowerCase() || '';
        return tipo === 'habitacion' || tipo === 'habitación' || cat === 'habitaciones';
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
                <div className="flex gap-2 relative">


                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-lg transition-colors ${showMenu ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar Activo
                                </button>
                                <button
                                    onClick={handleGeneratePDF}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Generar Ficha Técnica
                                </button>
                                <button
                                    onClick={() => {
                                        setShowQRModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                    <QrCode className="w-4 h-4" /> Imprimir Etiqueta QR
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col lg:flex-row">
                <div className="lg:w-1/3 aspect-square lg:aspect-auto bg-slate-50 dark:bg-[#0f172a] relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
                    {asset.imagen_url ? (
                        <img
                            src={`${asset.imagen_url}`}
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
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Marca</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.marca || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Modelo</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.modelo || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° de Serie</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.serie || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubicación</span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 break-words break-all">
                                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>{asset.ubicacion || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Año / Cant</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.anio || '---'} / {asset.cantidad || 1}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Color</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.color || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° Motor</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.numero_motor || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">N° Chasis</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.numero_chasis || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">F. Instalación</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words break-all">{asset.fecha_instalacion || '---'}</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubic. Detallada</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs break-words break-all">{asset.ubicacion_detallada || '---'}</span>
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
                    <div className="text-2xl font-black">{calculateHealth()}%</div>
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
                    <div className="text-2xl font-black text-slate-800 dark:text-white">{asset.proximo_servicio ? formatDate(asset.proximo_servicio) : 'No programado'}</div>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Preventivo Programado</p>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex border-b border-slate-100 dark:border-slate-800 p-2">
                    {[
                        { id: 'info', label: 'Detalles' },
                        { id: 'history', label: 'Historial', icon: Clock },
                        { id: 'parts', label: 'Repuestos', icon: Package },
                        { id: 'docs', label: 'Manuales', icon: FileText },
                        ...(isRoom() ? [{ id: 'components', label: 'Componentes', icon: Package }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.icon && <tab.icon className="w-4 h-4" />} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'info' && (
                        <div className="text-slate-600 dark:text-slate-400 min-h-[200px] flex items-center justify-center italic">
                            Seleccione una pestaña para ver más información.
                        </div>
                    )}

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
                        <div className="space-y-6">
                            {/* Upload Area */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-2xl p-8 text-center hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={handleUploadManual}
                                    accept=".pdf,.doc,.docx"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                        <h4 className="font-bold text-slate-700 dark:text-blue-100">Subir Manual o Documento</h4>
                                        <p className="text-xs text-slate-400 mt-1">PDF, Word (Max 10MB)</p>
                                    </>
                                )}
                            </div>

                            {/* Documents List */}
                            {asset.documentos?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                                    <AlertTriangle className="w-12 h-12 text-amber-500/20 mb-3" />
                                    No hay documentos cargados.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {asset.documentos.map((doc) => (
                                        <div key={doc.id} className="group relative bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <a
                                                    href={doc.url_archivo}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2" title={doc.nombre_archivo}>
                                                {doc.nombre_archivo}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 mt-2">
                                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Fecha desconocida'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'components' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {standardComponents.map(comp => {
                                    const isLinked = asset.componentes_vinculados?.includes(comp.id);
                                    return (
                                        <div 
                                            key={comp.id} 
                                            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                                                isLinked 
                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' 
                                                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                isLinked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {isLinked ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className={`font-bold text-sm ${isLinked ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                                    {comp.nombre}
                                                </h5>
                                                {isLinked ? (
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Presente</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">Auditando</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {standardComponents.length === 0 && (
                                <div className="text-center py-12 text-slate-400 italic">
                                    No hay componentes estándar configurados.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AssetFormModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSaved={fetchAssetDetail}
                initialData={asset}
            />

            {/* QR Code Modal for Printing */}
            {
                showQRModal && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Etiqueta de Activo</h3>
                            <p className="text-slate-500 text-sm mb-6">Escanee este código para acceder a la ficha técnica.</p>

                            <div className="flex justify-center mb-8">
                                <div id="printable-qr" className="label-container bg-white p-6 rounded-xl border-2 border-slate-900 inline-block">
                                    <div className="header text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-900">Propiedad de HotelA</div>
                                    <div className="bg-white inline-block">
                                        <QRCode
                                            value={`${window.location.origin}/assets/${asset.id_equipo || id}`}
                                            size={140}
                                            level="H"
                                        />
                                    </div>
                                    <div className="code text-lg font-black mt-4 font-mono text-slate-900">{asset.codigo}</div>
                                    {asset.codigo_administrativo && (
                                        <div className="admin-code text-sm font-bold mt-1 text-slate-600">{asset.codigo_administrativo}</div>
                                    )}
                                    <div className="name text-xs font-bold mt-2 max-w-[200px] truncate mx-auto text-slate-700">{asset.nombre}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="px-4 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePrintLabel}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                                >
                                    <QrCode className="w-5 h-5" />
                                    Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AssetDetailPage;
