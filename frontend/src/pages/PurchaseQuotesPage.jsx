import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Loader, Edit, Trash2, Mail, Download, Eye, X, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { purchaseQuotes } from '../services/api'; // api.providers not exported? We added it but maybe easier to use providerService if we want consistent pattern, but api.js has providers.
import { providerService } from '../services/providerService'; // Importing this to be safe or use api.providers
import QuoteForm from '../components/purchases/QuoteForm';
import { generateQuotePDF } from '../components/purchases/generateQuotePDF';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import RecordLimitSelector from '../components/RecordLimitSelector';

const PurchaseQuotesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [providers, setProviders] = useState([]); // Store providers
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(null);
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const canCreate = user?.role === 'ADMINISTRADOR' || user?.role === 'SUPER-ADMIN' || user?.permissions?.includes('quotes_create');
    const canEdit = user?.role === 'ADMINISTRADOR' || user?.role === 'SUPER-ADMIN' || user?.permissions?.includes('quotes_edit');
    const canDelete = user?.role === 'ADMINISTRADOR' || user?.role === 'SUPER-ADMIN' || user?.permissions?.includes('quotes_delete');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [quotesRes, providersRes] = await Promise.all([
                purchaseQuotes.getAll(),
                providerService.getAll()
            ]);
            setQuotes(quotesRes.data);
            setProviders(providersRes);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuotes = async () => { // Keep for refresh after update
        try {
            const response = await purchaseQuotes.getAll();
            setQuotes(response.data);
        } catch (error) {
            console.error('Error fetching quotes:', error);
        }
    };

    const handleCreate = () => {
        setSelectedQuote(null);
        setShowForm(true);
    };

    const handleEdit = (quote) => {
        setSelectedQuote(quote);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta cotización?')) {
            try {
                await purchaseQuotes.delete(id);
                fetchQuotes();
            } catch (error) {
                console.error('Error deleting quote:', error);
                alert('Error al eliminar la cotización');
            }
        }
    };

    const getProviderForQuote = (quote) => {
        return providers.find(p => p.id === quote.proveedor_id) || {};
    };

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState(null);
    const [targetEmail, setTargetEmail] = useState('');

    const handleSendEmailClick = (quote) => {
        const provider = getProviderForQuote(quote);
        setSelectedQuoteForEmail(quote);
        setTargetEmail(provider.email || '');
        setShowEmailModal(true);
    };

    const handleConfirmSendEmail = async () => {
        if (!selectedQuoteForEmail) return;

        setShowEmailModal(false);
        setSendingEmail(selectedQuoteForEmail.id);

        try {
            const quote = selectedQuoteForEmail;
            const provider = getProviderForQuote(quote); // Get provider again or use stored if needed, mainly for PDF info which needs provider details object

            // Generate PDF Blob
            const pdfBlob = generateQuotePDF(quote, provider, true); // true = return blob

            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];

                try {
                    await purchaseQuotes.sendEmail(quote.id, {
                        pdf_base64: base64data,
                        email: targetEmail // Use the email from the modal
                    });
                    alert('Correo enviado exitosamente');
                    fetchQuotes(); // Update status if backend changes it
                } catch (error) {
                    console.error('Error sending email:', error);
                    alert('Error al enviar el correo');
                } finally {
                    setSendingEmail(null);
                    setSelectedQuoteForEmail(null);
                }
            };
        } catch (error) {
            console.error('Error generating PDF for email:', error);
            setSendingEmail(null);
            setSelectedQuoteForEmail(null);
            alert('Error generando el PDF para enviar');
        }
    };

    const handleDownloadPDF = (quote) => {
        const provider = getProviderForQuote(quote);
        generateQuotePDF(quote, provider, false); // false = download
    };

    const handleConvertToOC = (quote) => {
        navigate('/purchases', { state: { fromQuoteId: quote.id } });
    };

    const handleFormSubmit = async () => {
        setShowForm(false);
        setSelectedQuote(null);
        fetchQuotes();
    };

    const filteredQuotes = quotes.filter(quote =>
        quote.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.nombre_proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                    <FileText className="w-8 h-8 text-blue-600" />
                    Solicitudes de Cotización
                </h1>
                {canCreate && (
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Nueva Solicitud
                    </button>
                )}
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por código o proveedor..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <RecordLimitSelector 
                    limit={limit} 
                    onChange={setLimit} 
                    currentPage={currentPage}
                    totalItems={filteredQuotes.length}
                    onPageChange={setCurrentPage}
                />
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow overflow-hidden border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-[#0f172a]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Cantidad</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1e293b] divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredQuotes.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                    No se encontraron solicitudes de cotización
                                </td>
                            </tr>
                        ) : filteredQuotes.slice((currentPage - 1) * limit, currentPage * limit).map((quote) => (
                            <tr key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 font-mono">
                                    {quote.codigo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {quote.fecha_solicitud}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-white">
                                    {quote.nombre_proveedor || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full uppercase
                                        ${quote.estado === 'ENVIADA' ? 'bg-green-100 text-green-800' :
                                            quote.estado === 'BORRADOR' ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {quote.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right font-mono">
                                    {quote.detalles?.length || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right font-mono">
                                    {quote.detalles?.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    {(quote.estado === 'ENVIADA' || quote.estado === 'PROCESADA') && (
                                        <button
                                            onClick={() => handleConvertToOC(quote)}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Convertir a Orden de Compra"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDownloadPDF(quote)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Descargar PDF"
                                    >
                                        <Download size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleSendEmailClick(quote)}
                                        disabled={sendingEmail === quote.id}
                                        className={`p-2 rounded-lg transition-colors ${sendingEmail === quote.id ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                                        title="Enviar por Correo"
                                    >
                                        {sendingEmail === quote.id ? <Loader className="animate-spin" size={18} /> : <Mail size={18} />}
                                    </button>

                                    {canEdit && quote.estado === 'BORRADOR' && (
                                        <button
                                            onClick={() => handleEdit(quote)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    )}

                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(quote.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for Form */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSave={() => document.getElementById('quote-form')?.requestSubmit()}
                title={selectedQuote ? 'Editar Solicitud' : 'Nueva Solicitud'}
                width="max-w-4xl"
            >
                <QuoteForm
                    initialData={selectedQuote}
                    onCancel={() => setShowForm(false)}
                    onSuccess={handleFormSubmit}
                />
            </Modal>

            {/* Modal for Email Confirmation */}
            <Modal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSave={handleConfirmSendEmail}
                title="Confirmar Envío de Correo"
            >
                <div className="p-4 space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        Se enviará la solicitud de cotización <strong>{selectedQuoteForEmail?.codigo}</strong>.
                        <br />
                        Por favor, verifique o actualice la dirección de correo electrónico del destinatario:
                    </p>

                    <div>
                        <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Correo del Proveedor</label>
                        <input
                            type="email"
                            className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none text-slate-800 dark:text-slate-200"
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            placeholder="ejemplo@proveedor.com, otro@ejemplo.com"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Separe múltiples correos con comas. Ej: <em>ventas@proveedor.com, gerente@proveedor.com</em>
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseQuotesPage;
