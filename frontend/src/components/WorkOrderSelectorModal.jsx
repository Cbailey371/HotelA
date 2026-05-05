import React from 'react';
import { CheckCircle, Info, ClipboardList, Hash, Layout, User } from 'lucide-react';
import Modal from './Modal';

const WorkOrderSelectorModal = ({ 
    isOpen, 
    onClose, 
    workOrders, 
    selectedIds, 
    onToggle, 
    onConfirm 
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Vincular Órdenes de Trabajo"
            zIndex={60}
        >
            <div className="flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-sm font-bold text-slate-500">
                        {selectedIds.length === 0
                            ? "Seleccione una o más OTs"
                            : `${selectedIds.length} seleccionadas`}
                    </span>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={onConfirm}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Vincular Selección
                        </button>
                    )}
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {workOrders.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <Info className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-bold text-slate-500">No hay órdenes de trabajo disponibles</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workOrders.map(wo => {
                                const isSelected = selectedIds.includes(wo.id_ot);
                                return (
                                    <div
                                        key={wo.id_ot}
                                        onClick={() => onToggle(wo.id_ot)}
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
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                                                <Hash className="w-3 h-3" />
                                                {wo.codigo_ot || `OT-${wo.id_ot}`}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wo.fecha_creacion}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                                            {wo.asunto || 'Sin asunto'}
                                        </h4>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                <Layout className="w-3.5 h-3.5" /> {wo.nombre_activo || 'Sin activo'}
                                            </div>
                                            {wo.nombre_tecnico && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                                                    <User className="w-3.5 h-3.5" /> {wo.nombre_tecnico}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 ml-auto">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter
                                                    ${wo.estado === 'terminada' ? 'bg-emerald-100 text-emerald-600' : 
                                                      wo.estado === 'pendiente' ? 'bg-amber-100 text-amber-600' : 
                                                      'bg-slate-100 text-slate-600'}`}>
                                                    {wo.estado}
                                                </span>
                                            </div>
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

export default WorkOrderSelectorModal;
