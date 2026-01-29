import React from 'react';
import { X } from 'lucide-react';

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
    if (!isOpen) return null;

    const handleCloseAttempt = () => {
        if (isDirty) {
            // Standard browser confirm
            const shouldSave = window.confirm("¿Desea guardar los cambios?");
            if (shouldSave) {
                if (onSave) onSave();
            } else {
                onClose(); // Discard changes
            }
        } else {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            style={{ zIndex }}
            onClick={(e) => {
                // Ensure click is exactly on the backdrop
                if (e.target === e.currentTarget) {
                    handleCloseAttempt();
                }
            }}
        >
            <div className={`bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full ${width} border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                    <button
                        onClick={handleCloseAttempt}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-red-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
