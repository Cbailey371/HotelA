import React from 'react';
import { List } from 'lucide-react';

const RecordLimitSelector = ({ limit, onChange }) => {
    const options = [
        { label: 'Mostrar 10', value: 10 },
        { label: 'Mostrar 20', value: 20 },
        { label: 'Mostrar 50', value: 50 },
        { label: 'Mostrar 100', value: 100 },
        { label: 'Mostrar 200', value: 200 },
        { label: 'Más de 200', value: 999999 }
    ];

    return (
        <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-slate-400" />
            <select
                value={limit}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default RecordLimitSelector;
