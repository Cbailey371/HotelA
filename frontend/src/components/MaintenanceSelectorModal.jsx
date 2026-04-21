import React from 'react';
import { CheckCircle, Info, User, Building, ClipboardList } from 'lucide-react';
import Modal from './Modal';

const MaintenanceSelectorModal = ({ 
    isOpen, 
    onClose, 
    pendingSchedules, 
    selectedIds, 
    onToggle, 
    onConfirm,
    refreshing = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mantenimientos Programados"
            zIndex={60}
        >
            <div className="flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-sm font-bold text-slate-500">
                        {selectedIds.length === 0
                            ? "Seleccione uno o más mantenimientos"
                            : `${selectedIds.length} seleccionados`}
                    </span>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={onConfirm}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Cargar Selección
                        </button>
                    )}
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {refreshing && pendingSchedules.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500 font-bold animate-pulse">Sincronizando planes...</p>
                        </div>
                    ) : pendingSchedules.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <Info className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-500">No hay mantenimientos pendientes de OT</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingSchedules.map(s => {
                                const isSelected = selectedIds.includes(s.id);
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => onToggle(s.id)}
                                        className={`w-full text-left p-4 rounded-2xl border cursor-pointer group transition-all relative
                                            ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 hover:bg-white dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="absolute top-4 right-4">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-start mb-2 pr-8">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.codigo || `MANT-${s.id}`}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.fecha}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                                            {s.equipo} {s.nombre_componente ? ` (${s.nombre_componente})` : ''}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-medium mb-3">{s.tipo}</p>
                                        <div className="flex gap-4">
                                            {s.tecnico_id && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                    <User className="w-3.5 h-3.5" /> Técnico Asignado
                                                </div>
                                            )}
                                            {s.proveedor_id && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                    <Building className="w-3.5 h-3.5" /> Proveedor Asignado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MaintenanceSelectorModal;
