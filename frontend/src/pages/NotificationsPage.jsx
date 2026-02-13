import React from 'react';
import {
    Bell, Box, Calendar, AlertTriangle, ClipboardList,
    ShoppingCart, ShieldAlert, ChevronRight, Inbox, Filter
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const { alerts, loading } = useNotifications();
    const navigate = useNavigate();

    const categoryIcons = {
        stock: <Box className="w-5 h-5 text-red-500" />,
        maintenance: <Calendar className="w-5 h-5 text-blue-500" />,
        assets: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        work_orders: <ClipboardList className="w-5 h-5 text-orange-500" />,
        purchases: <ShoppingCart className="w-5 h-5 text-purple-500" />,
        warranty: <ShieldAlert className="w-5 h-5 text-indigo-500" />,
    };

    const handleNotificationClick = (link) => {
        if (link) {
            navigate(link);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Centro de Notificaciones</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gestiona y revisa todas las alertas importantes del sistema</p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                        <Filter className="w-4 h-4" /> Filtrar
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center animate-pulse">
                        <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-400">Cargando notificaciones...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Inbox className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Bandeja de entrada vacía</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm leading-relaxed"> No tienes alertas pendientes en este momento. Te notificaremos cuando algo requiera tu atención.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                onClick={() => handleNotificationClick(alert.link)}
                                className="group p-6 hover:bg-slate-50 dark:hover:bg-blue-900/10 cursor-pointer transition-all duration-300"
                            >
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                                        {categoryIcons[alert.category] || <Bell className="w-5 h-5 text-slate-400" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md self-start">
                                                {alert.category?.replace('_', ' ')}
                                            </span>
                                            {alert.date && (
                                                <span className="text-xs font-bold text-slate-400">
                                                    {alert.date}
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                                            {alert.title}
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>

                                    <div className="hidden md:flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 group-hover:bg-blue-600 transition-all duration-300">
                                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-center py-4 opacity-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Andros Asset Notification Hub v1.0</p>
            </div>
        </div>
    );
};

export default NotificationsPage;
