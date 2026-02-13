import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar...",
    label,
    name,
    className = "",
    allowCustom = true,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setFilteredOptions(
            options.filter(opt =>
                (opt?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
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
        onChange({ target: { name: name || label, value: option.nombre, ...option } });
        // We pass the full option too just in case consumer needs ID
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCustom = () => {
        if (searchTerm && allowCustom) {
            onChange({ target: { name: name || label, value: searchTerm } });
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>}
            <div
                className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-400'}>
                    {value || placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs outline-none focus:ring-2 ring-blue-500/20"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors"
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt.nombre}
                                    {opt.ubicacion && <span className="ml-2 text-xs text-slate-400">({opt.ubicacion})</span>}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">
                                {allowCustom ? (
                                    <button onClick={handleCustom} className="text-blue-500 hover:underline">
                                        Usar "{searchTerm}"
                                    </button>
                                ) : 'No encontrado'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
