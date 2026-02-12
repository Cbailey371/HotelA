import React from 'react';
import { AlertTriangle, Package, Loader2 } from 'lucide-react';

const LowStockWidget = ({ items, loading }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tighter uppercase">Stock Crítico</h3>
                    <p className="text-slate-500 text-xs font-bold">Repuestos por debajo del mínimo</p>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                    <AlertTriangle className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                        <Package className="w-8 h-8 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Todo en orden</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="group p-3 bg-slate-50 dark:bg-[#0f172a]/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-orange-500/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 line-clamp-1">{item.name}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-orange-500 text-white rounded-full uppercase">
                                    Crítico
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual / Mínimo</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-black ${item.current_stock === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                            {item.current_stock}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">/</span>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                            {item.min_stock}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diferencia</div>
                                    <div className="text-sm font-black text-slate-600 dark:text-slate-300">
                                        {item.current_stock - item.min_stock}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LowStockWidget;
