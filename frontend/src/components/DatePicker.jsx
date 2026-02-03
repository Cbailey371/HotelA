import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DatePicker = ({ label, value, onChange, name, min, max, required = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Internal date for the calendar view (defaults to current date or value)
    const [viewDate, setViewDate] = useState(new Date());
    // Internal selected date
    const [selectedDate, setSelectedDate] = useState(null);
    const containerRef = useRef(null);

    const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Initialize state from props
    useEffect(() => {
        if (value) {
            // Adjust for timezone issues by appending T12:00:00 if it's just a date string
            // or parsing it carefully. Assuming value is YYYY-MM-DD.
            const [y, m, d] = value.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            setSelectedDate(date);
            setViewDate(date);
        } else {
            setSelectedDate(null);
            setViewDate(new Date());
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const changeMonth = (increment) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setViewDate(newDate);
    };

    const changeYear = (increment) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(newDate.getFullYear() + increment);
        setViewDate(newDate);
    };

    const handleDateClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Format to YYYY-MM-DD for the parent
        const formatted = newDate.toISOString().split('T')[0];

        // Mock event object for compatibility with standard handleChange
        const event = {
            target: {
                name: name,
                value: formatted
            }
        };
        onChange(event);
        setIsOpen(false);
    };

    const handleClear = () => {
        const event = {
            target: {
                name: name,
                value: ''
            }
        };
        onChange(event);
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        const formatted = today.toISOString().split('T')[0];
        const event = {
            target: {
                name: name,
                value: formatted
            }
        };
        onChange(event);
        setIsOpen(false);
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Days of the month
        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
            const isSelected = selectedDate &&
                currentDate.getDate() === selectedDate.getDate() &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

            const isToday = new Date().toDateString() === currentDate.toDateString();

            let classes = "h-8 w-8 rounded-full flex items-center justify-center text-sm cursor-pointer transition-colors ";

            if (isSelected) {
                classes += "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30";
            } else if (isToday) {
                classes += "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800";
            } else {
                classes += "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300";
            }

            days.push(
                <div
                    key={d}
                    onClick={() => handleDateClick(d)}
                    className={classes}
                >
                    {d}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block uppercase">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Input Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 dark:bg-[#0f172a] border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 dark:border-slate-700'} rounded-lg px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all`}
            >
                <span className={`text-sm ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {value ? new Date(value.split('-').map(Number).join('/')).toLocaleDateString() : 'Seleccionar fecha...'}
                </span>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
            </div>

            {/* Calendar Popover */}
            {isOpen && (
                <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-[300px] animate-in fade-in zoom-in-95 duration-150 transform left-0 md:left-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </div>

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {DAYS.map(day => (
                            <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 place-items-center mb-4">
                        {renderCalendarGrid()}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            type="button"
                            onClick={handleToday}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
