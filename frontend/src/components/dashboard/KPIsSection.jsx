import React from 'react';
import { Box, Wrench, FileText, Calendar, ArrowUpRight } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color, accentColor, bgLight, loading, trend }) => (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md group relative overflow-hidden">
        {/* Color accent bar on left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${color}`}></div>

        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                {loading ? (
                    <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                ) : (
                    <div className="flex items-center gap-2">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
                        {trend && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                                <ArrowUpRight className="w-3 h-3" /> {trend}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${bgLight} text-${accentColor.split(' ')[0].replace('text-', '')} transition-transform group-hover:scale-110 duration-300`}>
                <Icon className={`w-6 h-6 ${accentColor}`} />
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${subtext.includes('Alta') ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                {subtext}
            </span>
        </div>
    </div>
);

const KPIsSection = ({ stats, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
                title="Total de Activos"
                value={stats.total_assets?.toLocaleString()}
                subtext="+2% vs mes ant."
                icon={Box}
                bgLight="bg-blue-50 dark:bg-blue-900/20"
                color="bg-blue-500"
                accentColor="text-blue-600 dark:text-blue-400"
                loading={loading}
                trend="2%"
            />
            <MetricCard
                title="Mantenimientos Activos"
                value={stats.active_maintenance}
                subtext="EN CURSO"
                icon={Wrench}
                bgLight="bg-amber-50 dark:bg-amber-900/20"
                color="bg-amber-500"
                accentColor="text-amber-600 dark:text-amber-400"
                loading={loading}
            />
            <MetricCard
                title="Órdenes Pendientes"
                value={stats.pending_orders}
                subtext="Prioridad Alta"
                icon={FileText}
                bgLight="bg-indigo-50 dark:bg-indigo-900/20"
                color="bg-indigo-600"
                accentColor="text-indigo-600 dark:text-indigo-400"
                loading={loading}
            />
            <MetricCard
                title="Próximos Eventos"
                value={stats.upcoming_events_7d}
                subtext="Próx. 7 días"
                icon={Calendar}
                bgLight="bg-slate-100 dark:bg-slate-800"
                color="bg-slate-500"
                accentColor="text-slate-600 dark:text-slate-400"
                loading={loading}
            />
        </div>
    );
};

export default KPIsSection;
