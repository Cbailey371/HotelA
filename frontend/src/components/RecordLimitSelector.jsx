import React from 'react';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';

const RecordLimitSelector = ({ limit, onChange, currentPage = 1, totalItems = 0, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / limit);
    const options = [
        { label: '10', value: 10 },
        { label: '20', value: 20 },
        { label: '50', value: 50 },
        { label: '100', value: 100 },
        { label: '200', value: 200 },
        { label: 'Todos', value: 999999 }
    ];

    return (
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#0f172a] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-3">
                <List className="w-3.5 h-3.5 text-slate-400" />
                <select
                    value={limit}
                    onChange={(e) => {
                        onChange(parseInt(e.target.value));
                        if(onPageChange) onPageChange(1); // Reset to page 1 on limit change
                    }}
                    className="bg-transparent border-none text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[70px] text-center">
                    Pág {currentPage} / {totalPages || 1}
                </div>
                
                <div className="flex gap-1">
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md disabled:opacity-20 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md disabled:opacity-20 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordLimitSelector;
