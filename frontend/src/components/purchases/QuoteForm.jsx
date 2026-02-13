import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Search, Package, ChevronLeft, Truck, FileText } from 'lucide-react';
import { purchaseQuotes } from '../../services/api';
import { providerService } from '../../services/providerService';
import { inventoryService } from '../../services/inventoryService';
import Modal from '../Modal';

const QuoteForm = ({ initialData, onCancel, onSuccess }) => {
    const isEditing = !!initialData;
    const [formData, setFormData] = useState({
        proveedor_id: initialData?.proveedor_id || '',
        fecha_solicitud: initialData?.fecha_solicitud || new Date().toISOString().split('T')[0],
        observaciones: initialData?.observaciones || '',
        detalles: initialData?.detalles?.map(d => ({
            ...d,
            repuesto_id: d.repuesto_id.toString(), // Ensure string for matching
            repuesto_nombre: d.nombre_repuesto || '', // Add if available or fetch
            cantidad: d.cantidad
        })) || []
    });

    const [providers, setProviders] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State - Parts
    const [showPartModal, setShowPartModal] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    // Modal State - Providers
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [providerSearch, setProviderSearch] = useState('');

    useEffect(() => {
        loadDependencies();
    }, []);

    const loadDependencies = async () => {
        try {
            const [pData, invData] = await Promise.all([
                providerService.getAll(),
                inventoryService.getAll()
            ]);
            setProviders(pData);
            setAvailableParts(invData);

            // Enrich details with names if editing and names are missing
            if (isEditing && initialData?.detalles) {
                const enrichedDetails = initialData.detalles.map(d => {
                    const part = invData.find(p => p.id.toString() === d.repuesto_id.toString());
                    return {
                        ...d,
                        repuesto_id: d.repuesto_id.toString(),
                        repuesto_nombre: part ? part.nombre : d.nombre_repuesto || 'Desconocido',
                        cantidad: d.cantidad
                    };
                });
                setFormData(prev => ({ ...prev, detalles: enrichedDetails }));
            }

        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            detalles: [...prev.detalles, { repuesto_id: '', repuesto_nombre: '', cantidad: 1 }]
        }));
    };

    const handleRemoveItem = (index) => {
        const newDetails = [...formData.detalles];
        newDetails.splice(index, 1);
        setFormData(prev => ({ ...prev, detalles: newDetails }));
    };

    const handleItemChange = (index, field, value) => {
        const newDetails = [...formData.detalles];
        newDetails[index][field] = value;
        setFormData(prev => ({ ...prev, detalles: newDetails }));
    };

    const handleOpenPartModal = (index) => {
        setActiveItemIndex(index);
        setModalSearch('');
        setShowPartModal(true);
    };

    const handleSelectPart = (part) => {
        const newDetails = [...formData.detalles];
        newDetails[activeItemIndex] = {
            ...newDetails[activeItemIndex],
            repuesto_id: part.id.toString(),
            repuesto_nombre: part.nombre,
        };
        setFormData(prev => ({ ...prev, detalles: newDetails }));
        setShowPartModal(false);
    };

    const handleSelectProvider = (provider) => {
        setFormData(prev => ({
            ...prev,
            proveedor_id: provider.id.toString()
        }));
        setShowProviderModal(false);
    };

    const getSelectedProviderName = () => {
        const provider = providers.find(p => p.id.toString() === formData.proveedor_id.toString());
        return provider ? provider.nombre : 'Seleccionar Proveedor...';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.proveedor_id) {
            alert('Seleccione un proveedor');
            setLoading(false);
            return;
        }
        if (formData.detalles.length === 0) {
            alert('Agregue al menos un item');
            setLoading(false);
            return;
        }

        // Validate all items have a part selected
        if (formData.detalles.some(d => !d.repuesto_id)) {
            alert('Todos los items deben tener un repuesto seleccionado.');
            setLoading(false);
            return;
        }


        try {
            const payload = {
                ...formData,
                codigo: isEditing ? initialData.codigo : `RFQ-${Date.now()}`, // Temporary autofill to satisfy backend
                proveedor_id: parseInt(formData.proveedor_id),
                detalles: formData.detalles.map(d => ({
                    repuesto_id: parseInt(d.repuesto_id),
                    cantidad: parseInt(d.cantidad)
                }))
            };

            if (isEditing) {
                await purchaseQuotes.update(initialData.id, payload);
            } else {
                await purchaseQuotes.create(payload);
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Error al guardar la cotización');
        } finally {
            setLoading(false);
        }
    };

    const filteredParts = availableParts.filter(p =>
        p.nombre.toLowerCase().includes(modalSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(modalSearch.toLowerCase())
    );

    const filteredProviders = providers.filter(p =>
        p.nombre.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.nit?.toLowerCase().includes(providerSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <FileText className="w-6 h-6 text-blue-600" />
                    {isEditing ? 'Editar Solicitud de Cotización' : 'Nueva Solicitud de Cotización'}
                </h2>

                <form id="quote-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* General Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Proveedor *</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setProviderSearch('');
                                    setShowProviderModal(true);
                                }}
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex justify-between items-center hover:border-blue-400 transition-colors text-left"
                            >
                                <span className={formData.proveedor_id ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                                    {getSelectedProviderName()}
                                </span>
                                <Search className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Fecha Solicitud *</label>
                            <input
                                type="date"
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-800 dark:text-slate-200"
                                value={formData.fecha_solicitud}
                                onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Observaciones</label>
                            <textarea
                                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none resize-none text-slate-800 dark:text-slate-200"
                                rows="2"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Notas internas..."
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase text-slate-500 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Items
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" /> Agregar Item
                            </button>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3">Repuesto</th>
                                        <th className="px-4 py-3 w-32 text-right">Cantidad</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {formData.detalles.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-slate-500 text-sm">
                                                No hay items agregados. Haga clic en "Agregar Item" para comenzar.
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.detalles.map((item, index) => (
                                            <tr key={index} className="bg-white dark:bg-[#1e293b]">
                                                <td className="px-4 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPartModal(index)}
                                                        className="w-full text-left bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex justify-between items-center hover:border-blue-400 transition-colors"
                                                    >
                                                        <span className={item.repuesto_nombre ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                                                            {item.repuesto_nombre ? item.repuesto_nombre : 'Seleccionar Repuesto...'}
                                                        </span>
                                                        <Search className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-right outline-none focus:border-blue-500"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </form>
            </div>

            {/* Part Selection Modal */}
            <Modal
                isOpen={showPartModal}
                onClose={() => setShowPartModal(false)}
                title="Seleccionar Repuesto"
                zIndex={60}
            >
                <div className="flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar repuesto por nombre o código..."
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredParts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No se encontraron resultados para "{modalSearch}"
                            </div>
                        ) : (
                            filteredParts.map(part => (
                                <button
                                    key={part.id}
                                    onClick={() => handleSelectPart(part)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            {part.imagen ? (
                                                <img src={`${part.imagen}`} alt="" className="w-10 h-10 object-cover rounded shadow-sm" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{part.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{part.codigo}</span>
                                                <span className="text-xs text-slate-400 truncate max-w-[200px]">{part.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${part.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            EST: {part.stock}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>

            {/* Provider Selection Modal */}
            <Modal
                isOpen={showProviderModal}
                onClose={() => setShowProviderModal(false)}
                title="Seleccionar Proveedor"
                zIndex={60}
            >
                <div className="flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar proveedor por nombre o NIT..."
                            value={providerSearch}
                            onChange={(e) => setProviderSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredProviders.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No se encontraron resultados para "{providerSearch}"
                            </div>
                        ) : (
                            filteredProviders.map(provider => (
                                <button
                                    key={provider.id}
                                    onClick={() => handleSelectProvider(provider)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            <Truck className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{provider.nombre}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">NIT: {provider.nit}</span>
                                                <span className="text-xs text-slate-400">{provider.correo}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-400 rotate-180 transition-colors" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default QuoteForm;
