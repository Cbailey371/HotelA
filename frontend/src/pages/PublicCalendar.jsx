import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Calendar, ChevronLeft, ChevronRight, Clock, MapPin,
    RefreshCcw, AlertTriangle, CheckCircle, Activity, LayoutGrid, CalendarRange
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PublicCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [refreshTime, setRefreshTime] = useState(15);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [theme, setTheme] = useState('light'); // Siempre inicia en modo claro

    // Sincronizar tema con el root (html)
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const fetchEvents = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/public/calendar`);
            setEvents(response.data || []);
            setLastUpdated(new Date());
            setRefreshTime(15);
        } catch (error) {
            console.error("Error fetching public calendar:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(() => {
            setRefreshTime(prev => {
                if (prev <= 1) {
                    fetchEvents();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [fetchEvents]);

    const navigate = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(currentDate.getMonth() + direction);
        if (view === 'week') newDate.setDate(currentDate.getDate() + (direction * 7));
        if (view === 'day') newDate.setDate(currentDate.getDate() + direction);
        setCurrentDate(newDate);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completado': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
            case 'en proceso': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
            case 'atrasado': return 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20';
            default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
        }
    };

    const isToday = (day) => {
        const today = new Date();
        return day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();
    };

    const renderWeekView = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateStr = day.toLocaleDateString('en-CA');
            const dayEvents = events.filter(e => e.fecha === dateStr);

            days.push(
                <div key={i} className={`min-h-[650px] p-4 border-r border-slate-100 dark:border-slate-800 flex flex-col hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all ${isToday(day) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                    <div className="text-center mb-8">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{day.toLocaleDateString('es-ES', { weekday: 'long' })}</div>
                        <div className={`text-2xl font-black mx-auto w-12 h-12 flex items-center justify-center rounded-2xl ${isToday(day) ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 rotate-3' : 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'}`}>
                            {day.getDate()}
                        </div>
                    </div>
                    <div className="space-y-3">
                        {dayEvents.map(e => (
                            <div key={e.id} className="group/event relative">
                                <div className={`p-3 rounded-2xl text-[9px] font-bold border leading-tight transition-all shadow-sm cursor-help hover:scale-[1.02] ${
                                    e.prioridad?.toLowerCase() === 'alta' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 
                                    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                }`}>
                                    <div className="font-black mb-1 truncate">{e.asunto || e.equipo}</div>
                                    <div className="text-[8px] opacity-60 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {e.equipo}</div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute z-[100] invisible group-hover/event:visible opacity-0 group-hover/event:opacity-100 transition-all duration-200 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-64 pointer-events-none left-1/2 -translate-x-1/2 bottom-full mb-3 whitespace-normal">
                                    <div className="space-y-2">
                                        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">DETALLES</div>
                                        <div className="text-xs font-bold leading-tight">{e.asunto || 'Sin asunto'}</div>
                                        <div className="text-[10px] font-medium text-slate-300">{e.equipo}</div>
                                        {e.codigo_ot && <div className="text-[9px] font-black text-purple-400 uppercase pt-1">OT: {e.codigo_ot}</div>}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                {days}
            </div>
        );
    };

    const renderDayView = () => {
        const dateStr = currentDate.toLocaleDateString('en-CA');
        const dayEvents = events.filter(e => e.fecha === dateStr);

        return (
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl p-8 min-h-[750px]">
                <div className="flex items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-2xl shadow-blue-500/30 rotate-3">
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-80">{currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}</span>
                        <span className="text-4xl font-black">{currentDate.getDate()}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mt-1">
                            <Activity className="w-4 h-4 text-blue-500" />
                            {dayEvents.length} Tareas programadas
                        </p>
                    </div>
                </div>

                {dayEvents.length === 0 ? (
                    <div className="py-20 text-center opacity-30 flex flex-col items-center">
                        <CalendarRange className="w-20 h-20 mb-4 text-slate-400" />
                        <p className="font-black uppercase tracking-widest text-slate-500">No hay tareas para este día</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dayEvents.map(e => (
                            <div key={e.id} className={`p-6 rounded-3xl border transition-all hover:scale-[1.01] hover:shadow-lg ${
                                e.prioridad?.toLowerCase() === 'alta' 
                                    ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20' 
                                    : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        e.prioridad?.toLowerCase() === 'alta' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>{e.prioridad || 'Normal'}</span>
                                    <span className="text-[10px] font-black text-slate-400">{e.codigo || `MNT-${e.id}`}</span>
                                </div>
                                <h4 className="text-lg font-black mb-1 text-slate-800 dark:text-white leading-tight">{e.asunto || e.equipo}</h4>
                                <p className="text-xs text-slate-500 font-bold mb-6">{e.equipo}</p>
                                
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor / Técnico</div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{e.proveedor_nombre || 'Mantenimiento Interno'}</div>
                                    </div>
                                    {e.codigo_ot && (
                                        <div>
                                            <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Orden de Trabajo</div>
                                            <div className="text-xs font-black text-purple-600 dark:text-purple-400">{e.codigo_ot}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const getHeaderText = () => {
        if (view === 'month') {
            return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        } else if (view === 'week') {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - currentDate.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-ES', { month: 'short' })} ${end.getFullYear()}`;
        } else {
            return currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 dark:bg-slate-900/20 border-r border-b border-slate-100 dark:border-slate-800"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.fecha === dateStr);

            days.push(
                <div key={d} className={`min-h-[160px] p-2 border-r border-b border-slate-100 dark:border-slate-800 flex flex-col group/day relative transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:z-50 ${isToday(date) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-black ${isToday(date) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
                            {d}
                        </span>
                        {dayEvents.length > 0 && (
                            <span className="text-[10px] font-black text-blue-500 uppercase">{dayEvents.length} Tareas</span>
                        )}
                    </div>
                        <div className="flex-1 space-y-1 relative">
                            {dayEvents.slice(0, 3).map((e) => (
                                <div key={e.id} className="group/event relative">
                                    <div className={`p-1.5 rounded-lg text-[9px] font-bold border leading-tight transition-all cursor-help shadow-sm hover:scale-[1.02] ${
                                        e.prioridad?.toLowerCase() === 'alta' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 
                                        'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                    }`}>
                                        <div className="truncate">{e.asunto || e.equipo}</div>
                                        <div className="text-[8px] opacity-60 truncate">{e.equipo}</div>
                                    </div>
                                    
                                    {/* Tooltip Detallado (Mismo diseño que el dashboard) */}
                                    <div className="absolute z-[100] invisible group-hover/event:visible opacity-0 group-hover/event:opacity-100 transition-all duration-200 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-72 pointer-events-none left-1/2 -translate-x-1/2 bottom-full mb-3 whitespace-normal">
                                        <div className="space-y-3">
                                            <div className="border-b border-white/10 pb-2">
                                                <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">ASUNTO</div>
                                                <div className="text-xs font-bold leading-tight">{e.asunto || 'Sin asunto'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">ACTIVO</div>
                                                <div className="text-xs font-bold">{e.equipo}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">CÓDIGO MNT</div>
                                                    <div className="text-xs font-bold text-slate-300">{e.codigo || 'N/A'}</div>
                                                </div>
                                                {e.codigo_ot && (
                                                    <div>
                                                        <div className="text-[10px] font-black tracking-widest text-purple-400 uppercase mb-0.5">ORDEN TRABAJO</div>
                                                        <div className="text-xs font-bold text-purple-200">{e.codigo_ot}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black tracking-widest text-blue-400 uppercase mb-0.5">PROVEEDOR</div>
                                                <div className="text-xs font-bold text-slate-300">{e.proveedor_nombre || 'Mantenimiento Interno'}</div>
                                            </div>
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                    </div>
                                </div>
                            ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[9px] text-center font-black text-slate-400">+{dayEvents.length - 3} más</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
                    <div key={day} className="py-3 text-center text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-r border-slate-100 dark:border-slate-800">
                        {day}
                    </div>
                ))}
                {days}
            </div>
        );
    };


    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format safe for local date

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 p-4 lg:p-8 font-sans transition-colors duration-500">
            {/* Header */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-50 dark:border-[#020617] flex items-center justify-center animate-pulse">
                            <Activity className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            Plan de Mantenimiento
                        </h1>
                        <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm tracking-widest uppercase">
                            <Clock className="w-4 h-4 text-blue-500" />
                            HotelA Solutions • Monitor en Vivo
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                        )}
                    </button>

                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-1 shadow-sm">
                        <button onClick={() => setView('month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}>Mes</button>
                        <button onClick={() => setView('week')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'week' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}>Semana</button>
                        <button onClick={() => setView('day')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'day' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}>Día</button>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="text-sm font-black text-slate-900 dark:text-white min-w-[160px] text-center uppercase tracking-tighter">{getHeaderText()}</span>
                        <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Refresco: {refreshTime}s</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Estado del Día</h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center"><Clock className="w-6 h-6 text-blue-500" /></div>
                                <div>
                                    <div className="text-2xl font-black">{events.filter(e => e.fecha === todayStr).length}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Tareas Hoy</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
                                <div>
                                    <div className="text-2xl font-black">{events.filter(e => e.estado.toLowerCase() === 'completado').length}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Completados</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-rose-500" /></div>
                                <div>
                                    <div className="text-2xl font-black">{events.filter(e => e.prioridad.toLowerCase() === 'alta' && e.estado.toLowerCase() !== 'completado').length}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Críticos Pendientes</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Leyenda</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-[10px] font-black uppercase text-slate-400 italic">Programado</span></div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-[10px] font-black uppercase text-slate-400 italic">En Proceso</span></div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-[10px] font-black uppercase text-slate-400 italic">Completado</span></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {loading && events.length === 0 ? (
                        <div className="h-[750px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse font-black text-slate-400 uppercase tracking-widest">Sincronizando...</div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {view === 'month' && renderMonthView()}
                            {view === 'week' && renderWeekView()}
                            {view === 'day' && renderDayView()}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase italic">
                <span>© 2026 CBTECH SOLUTIONS • v1.5.0</span>
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sincronizado: {lastUpdated.toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
};

export default PublicCalendar;
