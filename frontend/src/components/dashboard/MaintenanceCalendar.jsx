import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MaintenanceCalendar = ({ events }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'day'

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const navigate = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(currentDate.getMonth() + direction);
        } else if (view === 'week') {
            newDate.setDate(currentDate.getDate() + (direction * 7));
        } else {
            newDate.setDate(currentDate.getDate() + direction);
        }
        setCurrentDate(newDate);
    };

    // Helper to generate days for grid
    const getDaysForView = () => {
        const days = [];
        if (view === 'month') {
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun

            for (let i = 0; i < startDay; i++) days.push(null);
            for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        } else if (view === 'week') {
            const curr = new Date(currentDate);
            const first = curr.getDate() - curr.getDay();

            for (let i = 0; i < 7; i++) {
                let next = new Date(curr);
                next.setDate(first + i);
                days.push(next);
            }
        } else { // day
            days.push(new Date(currentDate));
        }
        return days;
    };

    const daysToRender = getDaysForView();

    const getEventsForDay = (dateObj) => {
        if (!dateObj) return [];
        return events.filter(e => {
            // Fix: Parse input date correctly considering timezone offset issues or just stick to YYYY-MM-DD comparisons
            // Assuming e.date is YYYY-MM-DD string
            const eDate = new Date(e.date + 'T00:00:00'); // Force midnight
            return eDate.getDate() === dateObj.getDate() &&
                eDate.getMonth() === dateObj.getMonth() &&
                eDate.getFullYear() === dateObj.getFullYear();
        });
    };

    return (
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Calendario de Mantenimiento</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {view === 'month' ? 'Visualización mensual' : view === 'week' ? 'Visualización semanal' : 'Agenda diaria'}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => navigate(-1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                    <span className="px-3 text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[120px] text-center capitalize">
                        {view === 'day'
                            ? currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                            : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                    </span>
                    <button onClick={() => navigate(1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {['month', 'week', 'day'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all capitalize ${view === v ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full">
                {/* Header Days - Hide if Day View */}
                {view !== 'day' && (
                    <div className="grid grid-cols-7 mb-2">
                        {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-2">{d}</div>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className={`grid gap-1 ${view === 'day' ? 'grid-cols-1' : 'grid-cols-7'} ${view === 'month' ? 'auto-rows-[80px] sm:auto-rows-[100px]' : view === 'week' ? 'auto-rows-[300px]' : 'auto-rows-auto'}`}>
                    {daysToRender.map((dateObj, idx) => {
                        const isToday = dateObj && dateObj.getDate() === new Date().getDate() && dateObj.getMonth() === new Date().getMonth() && dateObj.getFullYear() === new Date().getFullYear();
                        const dayEvents = getEventsForDay(dateObj);
                        const dayNum = dateObj ? dateObj.getDate() : null;

                        return (
                            <div key={idx} className={`relative p-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-all 
                                ${dateObj ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer' : 'bg-transparent border-none'} 
                                ${isToday ? 'bg-blue-50/50 ring-1 ring-blue-200' : ''}
                                ${view === 'day' ? 'min-h-[200px]' : ''}
                            `}>
                                {dateObj && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold ${isToday ? 'text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md' : 'text-slate-500'}`}>
                                                {view === 'day' ? 'Tareas del día' : dayNum}
                                            </span>
                                            {view !== 'month' && dayEvents.length > 0 && <span className="text-[10px] text-slate-400 font-bold">{dayEvents.length} tareas</span>}
                                        </div>

                                        <div className={`mt-2 space-y-1 overflow-y-auto scrollbar-hide ${view === 'month' ? 'max-h-[60px]' : 'max-h-full'}`}>
                                            {dayEvents.length > 0 ? dayEvents.map(ev => (
                                                <div key={ev.id} className={`text-[10px] px-2 py-1.5 rounded-lg font-bold border-l-4 mb-1.5 shadow-sm
                                                    ${ev.priority?.toLowerCase() === 'alta' ? 'bg-red-50 text-red-700 border-red-500' :
                                                        ev.priority?.toLowerCase() === 'baja' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' :
                                                            'bg-amber-50 text-amber-700 border-amber-500'}`}>
                                                    <div className="line-clamp-1">{ev.title}</div>
                                                    {(view === 'week' || view === 'day') && (
                                                        <div className="flex gap-2 mt-1 opacity-75 text-[9px]">
                                                            <span>{ev.type_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (view === 'day' && <div className="text-slate-400 text-sm mt-4 text-center italic">Sin tareas programadas</div>)}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-medium text-slate-500">Media</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs font-medium text-slate-500">Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-medium text-slate-500">Baja</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceCalendar;
