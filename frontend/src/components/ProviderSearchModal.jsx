import React, { useState, useEffect } from 'react';
import { Search, X, Building2, User, Phone, Mail } from 'lucide-react';
import providerService from '../services/providerService';

const ProviderSearchModal = ({ isOpen, onClose, onSelect }) => {
    const [providers, setProviders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
            setSearchTerm('');
        }
    }, [isOpen]);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            const data = await providerService.getProviders();
            setProviders(data);
        } catch (error) {
            console.error("Error fetching providers:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProviders = providers.filter(provider => {
        const searchStr = searchTerm.toLowerCase();
        return (
            (provider.nombre_proveedor && provider.nombre_proveedor.toLowerCase().includes(searchStr)) ||
            (provider.ruc && provider.ruc.toLowerCase().includes(searchStr)) ||
            (provider.contacto_principal && provider.contacto_principal.toLowerCase().includes(searchStr))
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Seleccionar Proveedor</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, RUC o contacto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900">
                    {loading ? (
                        <div className="flex justify-center items-center h-32 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                            Cargando proveedores...
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 text-slate-400">
                                <Search className="w-6 h-6" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron proveedores</p>
                            <p className="text-sm text-slate-400 mt-1">Intenta con otros términos de búsqueda</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredProviders.map(provider => (
                                <button
                                    key={provider.id_proveedor}
                                    onClick={() => onSelect(provider)}
                                    className="w-full text-left bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group duration-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {provider.nombre_proveedor}
                                            </h3>
                                            <span className="text-sm font-medium text-slate-500">RUC: {provider.ruc}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${provider.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                                            {provider.estado}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{provider.contacto_principal || 'Sin contacto'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span>{provider.telefono || 'Sin teléfono'}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProviderSearchModal;
