import React, { useState, useRef, useEffect } from 'react';
import { Bell, Box, Calendar, AlertTriangle, ClipboardList, ShoppingCart, ShieldAlert, X, ChevronRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { alerts, unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const categoryIcons = {
        stock: <Box className="w-4 h-4 text-red-500" />,
        maintenance: <Calendar className="w-4 h-4 text-blue-500" />,
        assets: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        work_orders: <ClipboardList className="w-4 h-4 text-orange-500" />,
        purchases: <ShoppingCart className="w-4 h-4 text-purple-500" />,
        warranty: <ShieldAlert className="w-4 h-4 text-indigo-500" />,
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (link) => {
        if (link) {
            navigate(link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-bold">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white">Notificaciones</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No tienes notificaciones pendientes</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        onClick={() => handleNotificationClick(alert.link)}
                                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    {categoryIcons[alert.category] || <Bell className="w-4 h-4 text-slate-500" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                                                    {alert.title}
                                                </p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                                                    {alert.message}
                                                </p>
                                                {alert.date && (
                                                    <p className="text-[10px] text-slate-400 mt-2">
                                                        Fecha: {alert.date}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-4 h-4 text-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {alerts.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => navigate('/notifications')} // If we ever create a notifications page
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                            >
                                Ver Todo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
