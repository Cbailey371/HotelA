import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Reusable Modal component with standard behavior:
 * - Closes on backdrop click if !isDirty
 * - Asks for confirmation if isDirty when closing (Backdrop or X button)
 * - If user confirms save: triggers onSave
 * - If user cancels save (implies discard): triggers onClose
 */
const Modal = ({
    isOpen,
    onClose,
    onSave,
    isDirty,
    title,
    children,
    width = "max-w-2xl",
    zIndex = 50
}) => {
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    if (!isOpen) return null;

    const handleCloseAttempt = () => {
        if (isDirty) {
            setShowExitConfirm(true);
        } else {
            onClose();
        }
    };

    const handleDiscard = () => {
        setShowExitConfirm(false);
        onClose();
    };

    const handleSave = () => {
        setShowExitConfirm(false);
        if (onSave) onSave();
    };

    const handleKeepEditing = () => {
        setShowExitConfirm(false);
    };

    return (
        <>
            {/* Main Modal Backdrop */}
            <div
                className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
                style={{ zIndex }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && !showExitConfirm) {
                        handleCloseAttempt();
                    }
                }}
            >
                <div className={`bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-full md:${width} max-h-[95dvh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                        <button
                            onClick={handleCloseAttempt}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-red-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {children}
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        {onSave && (
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Guardar Cambios
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Confirmation Dialog Overlay */}
            {showExitConfirm && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    style={{ zIndex: zIndex + 10 }}
                >
                    <div className="bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 p-6 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cambios sin guardar</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Tienes cambios pendientes. ¿Qué te gustaría hacer?
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                            >
                                Guardar cambios
                            </button>

                            <button
                                onClick={handleDiscard}
                                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                            >
                                Descartar y salir
                            </button>

                            <button
                                onClick={handleKeepEditing}
                                className="w-full py-2.5 px-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
                            >
                                Volver a editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Modal;
