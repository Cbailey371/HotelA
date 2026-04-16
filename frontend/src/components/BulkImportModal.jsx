import React, { useState } from 'react';
import { X, Download, Upload, FileText, RefreshCw, Plus } from 'lucide-react';

const BulkImportModal = ({ isOpen, onClose, title, entityName, onDownloadTemplateCreate, onDownloadTemplateUpdate, onImportCreate, onImportUpdate }) => {
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'update'
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    if (!isOpen) return null;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setMessage(null);

        try {
            if (activeTab === 'create') {
                const result = await onImportCreate(formData);
                let skippedItems = null;
                if (result && result.skipped && result.skipped.length > 0) {
                    skippedItems = result.skipped;
                }
                setMessage({ 
                    type: skippedItems ? 'warning' : 'success', 
                    text: result?.message || `Creación masiva de ${entityName} completada con éxito.`,
                    skipped: skippedItems
                });
            } else {
                const result = await onImportUpdate(formData);
                setMessage({ 
                    type: 'success', 
                    text: result?.message || `Actualización masiva de ${entityName} completada con éxito.` 
                });
            }
            // Clear file input
            e.target.value = '';
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error en la importación. Verifique el formato del archivo y vuelva a intentarlo.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => { setActiveTab('create'); setMessage(null); }}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'create'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Plus className="w-4 h-4" /> Importar Nuevos
                    </button>
                    <button
                        onClick={() => { setActiveTab('update'); setMessage(null); }}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'update'
                                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <RefreshCw className="w-4 h-4" /> Actualizar Existentes
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex flex-col gap-3 ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                            message.type === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    message.type === 'success' ? 'bg-emerald-500' : 
                                    message.type === 'warning' ? 'bg-amber-500' :
                                    'bg-red-500'
                                    }`} />
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                            
                            {message.skipped && message.skipped.length > 0 && (
                                <div className="mt-2 text-xs bg-white/50 dark:bg-black/20 p-3 rounded border border-amber-200/50 max-h-32 overflow-y-auto">
                                    <p className="font-semibold mb-1">Registros omitidos (Duplicados o Errores):</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {message.skipped.map((skip, i) => (
                                            <li key={i}>{skip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-8 md:flex-row md:items-start">
                        {/* Step 1: Download Template */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
                                Descargar Plantilla
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 pl-11">
                                {activeTab === 'create'
                                    ? "Descarga la plantilla CSV vacía para registrar nuevos elementos. Los códigos se generarán automáticamente."
                                    : "Descarga la plantilla CSV con los códigos actuales para actualizar la información existente."}
                            </p>
                            <div className="pl-11">
                                <button
                                    onClick={activeTab === 'create' ? onDownloadTemplateCreate : onDownloadTemplateUpdate}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-200 dark:border-slate-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar CSV {activeTab === 'create' ? '(Nuevos)' : '(Actualización)'}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Upload */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-sm font-bold">2</div>
                                Subir Archivo
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 pl-11">
                                Sube el archivo CSV completado para procesar la {activeTab === 'create' ? 'importación' : 'actualización'}.
                            </p>
                            <div className="pl-11">
                                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${isLoading
                                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700'
                                    }`}>
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            <span className="font-medium text-sm">Seleccionar archivo CSV</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex gap-3">
                            <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas Importantes</h4>
                                <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                                    <li>Asegúrese de respetar el formato de fechas (YYYY-MM-DD).</li>
                                    <li>No modifique los encabezados del archivo CSV.</li>
                                    {activeTab === 'update' && (
                                        <li>El campo <strong>Código/SKU</strong> es obligatorio para identificar el registro a actualizar.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
