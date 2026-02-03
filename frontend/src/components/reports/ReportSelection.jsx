import React from 'react';
import {
    Box,
    ShoppingCart,
    ClipboardList,
    Wrench,
    Building2,
    TrendingDown,
    FileText,
    FileText,
    ArrowRight,
    Calendar
} from 'lucide-react';

const ReportSelection = ({ onSelect }) => {
    const reportTypes = [
        {
            id: 'Inventario',
            title: 'Inventario / Productos',
            description: 'Listado de productos, stock y valoración.',
            icon: Box,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'hover:border-blue-500/50'
        },
        {
            id: 'Mantenimiento',
            title: 'Mantenimiento',
            description: 'Historial de mantenimientos y costos.',
            icon: Wrench,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'hover:border-orange-500/50'
        },
        {
            id: 'PlanMantenimiento',
            title: 'Plan de Mantenimiento',
            description: 'Cronograma de servicios programados.',
            icon: Calendar,
            color: 'text-cyan-500',
            bg: 'bg-cyan-50 dark:bg-cyan-900/20',
            borderColor: 'hover:border-cyan-500/50'
        },
        {
            id: 'OrdenesTrabajo',
            title: 'Órdenes de Trabajo',
            description: 'Seguimiento de OTs y técnicos.',
            icon: ClipboardList,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'hover:border-emerald-500/50'
        },
        {
            id: 'OrdenesCompra',
            title: 'Reporte de Compras',
            description: 'Órdenes de compra y recepciones.',
            icon: ShoppingCart,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'hover:border-purple-500/50'
        },
        {
            id: 'Depreciación',
            title: 'Depreciación de Activos',
            description: 'Análisis financiero y vida útil.',
            icon: TrendingDown,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            borderColor: 'hover:border-indigo-500/50'
        },
        {
            id: 'ProveedoresTecnicos',
            title: 'Proveedores y Técnicos',
            description: 'Base de datos de contactos externos.',
            icon: Building2,
            color: 'text-pink-500',
            bg: 'bg-pink-50 dark:bg-pink-900/20',
            borderColor: 'hover:border-pink-500/50'
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-8">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">Reportes</h1>
                    <p className="text-slate-500 dark:text-slate-400">Genera y exporta reportes personalizados en Excel o CSV.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report) => (
                    <button
                        key={report.id}
                        onClick={() => onSelect(report.id)}
                        className={`
                            relative group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 
                            bg-white dark:bg-[#1e293b] text-left transition-all duration-300
                            hover:shadow-xl hover:-translate-y-1 ${report.borderColor}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl ${report.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <report.icon className={`w-6 h-6 ${report.color}`} />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {report.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {report.description}
                        </p>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Crear</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ReportSelection;
