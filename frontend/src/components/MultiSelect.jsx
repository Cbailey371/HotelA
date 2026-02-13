import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

const MultiSelect = ({
    options = [],
    value = [], // Array of IDs
    onChange, // Returns array of IDs
    placeholder = "Seleccionar...",
    label,
    name,
    className = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setFilteredOptions(
            options.filter(opt =>
                (opt?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (opt?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, options]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (option) => {
        const isSelected = value.includes(option.id);
        let newValue;
        if (isSelected) {
            newValue = value.filter(id => id !== option.id);
        } else {
            newValue = [...value, option.id];
        }
        onChange({ target: { name, value: newValue } });
    };

    const removeTag = (e, id) => {
        e.stopPropagation();
        const newValue = value.filter(v => v !== id);
        onChange({ target: { name, value: newValue } });
    };

    const selectedOptions = options.filter(opt => value.includes(opt.id));

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{label}</label>}
            <div
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl min-h-[46px] flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1.5 ">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span key={opt.id} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                {opt.nombre}
                                <button onClick={(e) => removeTag(e, opt.id)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                            </span>
                        ))
                    ) : (
                        <span className="text-slate-400 text-sm">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs outline-none focus:ring-2 ring-blue-500/20 text-slate-700 dark:text-slate-300"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = value.includes(opt.id);
                                return (
                                    <div
                                        key={opt.id}
                                        className={`px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer rounded-lg text-sm transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                                        onClick={() => handleSelect(opt)}
                                    >
                                        <span>
                                            {opt.nombre}
                                            {opt.codigo && <span className="ml-2 text-xs text-slate-400 opacity-70">({opt.codigo})</span>}
                                        </span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">
                                No encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
