import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Wrench, AlertTriangle, TrendingUp, Search, Calendar, DollarSign, Activity } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color, accentColor, bgLight, loading }) => (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition-all shadow-sm group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                {loading ? (
                    <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                ) : (
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
                )}
            </div>
            <div className={`p-3 rounded-xl ${bgLight} dark:${color} bg-opacity-20 dark:bg-opacity-20 transition-transform group-hover:scale-110 duration-300`}>
                <Icon className={`w-6 h-6 ${accentColor}`} />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{subtext}</span>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_assets: 0,
        pending_maintenance: 0,
        low_stock_items: 0,
        completed_this_month: 0,
        total_maintenance_cost: 0
    });
    const [loading, setLoading] = useState(true);

    const downloadReport = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/reports/assets', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte_activos.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading report", error);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Dashboard Operativo</h2>
                    <p className="text-slate-500 text-sm font-medium">Control centralizado de activos y servicios</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> Sistema Online
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Activos Operativos"
                    value={stats.total_assets}
                    subtext="Equipos en planta"
                    icon={Box}
                    bgLight="bg-blue-100"
                    color="bg-blue-900"
                    accentColor="text-blue-600 dark:text-blue-500"
                    loading={loading}
                />
                <MetricCard
                    title="Mtos. Programados"
                    value={stats.pending_maintenance}
                    subtext="Órdenes por ejecutar"
                    icon={Wrench}
                    bgLight="bg-amber-100"
                    color="bg-amber-900"
                    accentColor="text-amber-600 dark:text-amber-500"
                    loading={loading}
                />
                <MetricCard
                    title="Alertas de Stock"
                    value={stats.low_stock_items}
                    subtext="Repuestos críticos"
                    icon={AlertTriangle}
                    bgLight="bg-red-100"
                    color="bg-red-900"
                    accentColor="text-red-600 dark:text-red-500"
                    loading={loading}
                />
                <MetricCard
                    title="Inversión Mtto."
                    value={`$${stats.total_maintenance_cost.toLocaleString()}`}
                    subtext="Costo acumulado"
                    icon={DollarSign}
                    bgLight="bg-emerald-100"
                    color="bg-emerald-900"
                    accentColor="text-emerald-600 dark:text-emerald-500"
                    loading={loading}
                />
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Resumen Mensual</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actividad de mantenimiento</p>
                        </div>
                        <Calendar className="text-slate-200 dark:text-slate-800 w-10 h-10" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 dark:text-white">Cumplimiento de Plan</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Meta: 90%</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-blue-600">84%</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-slate-800 transition-transform hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 dark:text-white">Órdenes Finalizadas</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Período actual</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-emerald-600">{stats.completed_this_month}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/30 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight uppercase mb-4">Optimización Andros</h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6 italic font-medium">
                            "El mantenimiento preventivo reduce los costos operativos hasta en un 30% anual."
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={downloadReport}
                            className="w-full bg-white text-blue-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            Descargar Reporte PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
