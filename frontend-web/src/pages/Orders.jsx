import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Eye, Pencil, Trash2, X, CheckCircle2, Clock, Hash, User, Factory, Calendar, Settings, Briefcase, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const delta = 2, pages = [];
        const left = Math.max(1, currentPage - delta);
        const right = Math.min(totalPages, currentPage + delta);
        if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
        return pages;
    };
    return (
        <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Page <span className="text-slate-700">{currentPage}</span> / {totalPages}</p>
            <div className="flex items-center gap-1.5">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all duration-200 shadow-sm">
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                {getPageNumbers().map((page, idx) => page === '...' ? (
                    <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm">···</span>
                ) : (
                    <button key={page} onClick={() => onPageChange(page)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all duration-200 shadow-sm border ${currentPage === page ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'}`}>{page}</button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all duration-200 shadow-sm">
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
import { OrderService, CableService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'en attente';
    const styles = {
        'en cours':  'bg-blue-50 text-blue-600 border border-blue-100',
        'terminé':   'bg-emerald-50 text-emerald-600 border border-emerald-100',
        'termine':   'bg-emerald-50 text-emerald-600 border border-emerald-100',
        'en attente':'bg-amber-50 text-amber-600 border border-amber-100',
        'annulé':    'bg-red-50 text-red-500 border border-red-100',
        'suspendu':  'bg-gray-100 text-gray-500 border border-gray-200',
    };
    const dots = {
        'en cours':  'bg-blue-500',
        'terminé':   'bg-emerald-500',
        'termine':   'bg-emerald-500',
        'en attente':'bg-amber-500',
        'annulé':    'bg-red-500',
        'suspendu':  'bg-gray-400',
    };
    const labels = {
        'en cours': 'En Cours', 'terminé': 'Terminé', 'termine': 'Terminé',
        'en attente': 'En Attente', 'annulé': 'Annulé', 'suspendu': 'Suspendu',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${styles[s] || styles['en attente']}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[s] || 'bg-gray-400'}`}></span>
            {labels[s] || status}
        </span>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isCableListView, setIsCableListView] = useState(false);
    const [cablesForOrder, setCablesForOrder] = useState([]);
    const [loadingCables, setLoadingCables] = useState(false);
    const [editOrder, setEditOrder] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [form, setForm] = useState({
        reference: '', client: '', numComd: '', giPros: '',
        quantity: '', status: 'En attente', ligne: '',
        dateDebut: '', dateFin: ''
    });

    const navigate = useNavigate();
    const { canCreate, canEdit, canDelete } = useAuth();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await OrderService.getAll();
            setOrders(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des ordres");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const fetchCablesForOrder = async (orderId) => {
        try {
            setLoadingCables(true);
            const response = await CableService.getAll({ orderId });
            setCablesForOrder(response.data || []);
            setIsCableListView(true);
        } catch (error) {
            toast.error("Erreur lors du chargement des câbles");
        } finally {
            setLoadingCables(false);
        }
    };

    const openCreate = () => {
        setEditOrder(null);
        setForm({ 
            reference: '', client: '', numComd: '', giPros: '', 
            quantity: '', status: 'En attente', ligne: '', 
            dateDebut: new Date().toISOString().split('T')[0], 
            dateFin: '' 
        });
        setIsModalOpen(true);
    };

    const openEdit = (order) => {
        setEditOrder(order);
        setForm({
            reference: order.reference || '',
            client: order.client || '',
            numComd: order.numComd || '',
            giPros: order.giPros || '',
            quantity: order.quantity?.toString() || '',
            status: order.statusDisplay || (order.status?.charAt(0).toUpperCase() + order.status?.slice(1)) || 'En attente',
            ligne: order.ligne || '',
            dateDebut: order.productionDate ? new Date(order.productionDate).toISOString().split('T')[0] : '',
            dateFin: order.dateLiv ? new Date(order.dateLiv).toISOString().split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsCableListView(false);
        setIsDetailsOpen(true);
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedOrder(null);
        setIsCableListView(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const qty = parseInt(form.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
            toast.error("La quantité doit être supérieure à 0.");
            return;
        }

        try {
            const data = {
                reference: form.reference,
                client: form.client,
                numComd: form.numComd,
                giPros: form.giPros,
                quantity: qty,
                status: form.status,
                ligne: form.ligne,
                productionDate: form.dateDebut,
                dateLiv: form.dateFin || null,
            };

            if (editOrder) {
                await OrderService.update(editOrder.id, data);
                toast.success('Ordre mis à jour !');
            } else {
                data.inspectedCount = 0;
                data.conformCount = 0;
                data.nonConformCount = 0;
                await OrderService.create(data);
                toast.success('Ordre de fabrication créé !');
            }
            setIsModalOpen(false);
            fetchOrders();
        } catch (error) {
            toast.error("Erreur : " + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await OrderService.delete(deleteConfirm.id);
            toast.success('Ordre supprimé');
            setDeleteConfirm(null);
            fetchOrders();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.numeroOF?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.numComd?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.giPros?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || order.statusDisplay?.toLowerCase() === statusFilter.toLowerCase() || order.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Ordres de Fabrication"
                subtitle="Gestion intégrale de la chaîne de production et suivi qualité"
                icon={<Package />}
                actions={
                    canCreate('orders') && (
                        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                            <Plus size={18} />
                            Nouvel Ordre
                        </button>
                    )
                }
            />

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Référence, client, commande, GI PROS..."
                        className="input-field pl-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CustomSelect
                    className="w-full md:w-64"
                    options={[
                        { value: 'Tous', label: 'Tous les statuts' },
                        { value: 'En cours', label: 'En Cours' },
                        { value: 'Terminé', label: 'Terminé' },
                        { value: 'En attente', label: 'En Attente' },
                        { value: 'Annulé', label: 'Annulé' },
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                />
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/60 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/40">
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Référence (OF)</th>
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Client / Commande</th>
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">GI PROS</th>
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Quantité</th>
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Statut</th>
                                <th className="px-8 py-5 text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-24 text-center">
                                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-widest">Synchronisation Firebase...</p>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-1 uppercase">Aucun résultat</h3>
                                        <p className="text-sm text-slate-400 font-bold">Ajustez vos filtres ou lancez une nouvelle recherche</p>
                                    </td>
                                </tr>
                            ) : paginatedOrders.map((order) => {
                                const statusVal = (order.statusDisplay || order.status || '').toLowerCase().trim();
                                const isEditable = ['en attente', 'en cours'].includes(statusVal);
                                const isDeletable = statusVal === 'en attente';
                                return (
                                    <tr key={order.id} 
                                        onClick={() => openDetails(order)}
                                        className="hover:bg-blue-50/40 transition-all cursor-pointer group/row">
                                        <td className="px-8 py-6 font-black text-slate-900 text-[15px] tracking-tight group-hover/row:text-blue-600 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-blue-100 rounded-full group-hover/row:bg-blue-600 transition-colors"></div>
                                                <div>
                                                    <div>{order.numeroOF || order.reference}</div>
                                                    {order.numeroOF && order.reference && order.numeroOF !== order.reference && (
                                                        <div className="text-xs text-slate-400 font-bold">Réf: {order.reference}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[15px] font-black text-slate-800">{order.client}</span>
                                                <span className="text-sm text-slate-400 font-black uppercase tracking-wider bg-slate-50 self-start px-2 py-0.5 rounded-md border border-slate-100">{order.numComd || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                                <Briefcase size={12} className="text-indigo-400" />
                                                <span className="text-[13px] text-indigo-700 font-black">{order.giPros || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-block px-4 py-2 bg-slate-900 text-white rounded-2xl text-[14px] font-black shadow-lg shadow-slate-900/10 min-w-[60px]">
                                                {order.quantity}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6"><StatusBadge status={order.statusDisplay || order.status} /></td>
                                        <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                            {((canEdit('orders') && isEditable) || (canDelete('orders') && isDeletable)) && (
                                                <div className="flex justify-end gap-3 opacity-40 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                                    {canEdit('orders') && isEditable && (
                                                        <button onClick={() => openEdit(order)} className="w-10 h-10 bg-white text-amber-500 rounded-[14px] border border-amber-100 shadow-sm flex items-center justify-center hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-200 transition-all active:scale-90">
                                                            <Pencil size={16} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                    {canDelete('orders') && isDeletable && (
                                                        <button onClick={() => setDeleteConfirm(order)} className="w-10 h-10 bg-white text-red-500 rounded-[14px] border border-red-100 shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-200 transition-all active:scale-90">
                                                            <Trash2 size={16} strokeWidth={2.5} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {!loading && filteredOrders.length > 0 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-content !max-w-4xl" onClick={(e) => e.stopPropagation()}>
                        
                        {/* ── Header gradient ── */}
                        <div
                            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)' }}
                            className="relative px-8 py-6 overflow-hidden flex-shrink-0"
                        >
                            {/* decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-5" />
                            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white opacity-5" />

                            <button
                                onClick={closeDetails}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all z-10"
                            >
                                <X size={15} strokeWidth={2.5} />
                            </button>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                                    <Package size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>
                                        {isCableListView ? 'Détails des Câbles' : 'Dossier de Fabrication'}
                                    </h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>
                                        OF : {selectedOrder.numeroOF || selectedOrder.reference}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar max-h-[80vh]">
                            {!isCableListView ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <User size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">Client</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{selectedOrder.client}</p>
                                        </div>
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 text-indigo-600">
                                                <Hash size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">N° Commande</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{selectedOrder.numComd || '—'}</p>
                                        </div>
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 text-purple-600">
                                                <Briefcase size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">GI PROS</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{selectedOrder.giPros || '—'}</p>
                                        </div>
                                        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                            <div className="flex items-center gap-2 text-amber-600">
                                                <Factory size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">Ligne de Production</span>
                                            </div>
                                            <p className="text-lg font-black text-slate-900">{selectedOrder.ligne || '—'}</p>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">Date Lancement</span>
                                            </div>
                                            <p className="text-base font-bold text-slate-900">{new Date(selectedOrder.productionDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={16} />
                                                <span className="text-sm font-black uppercase tracking-wider">Date Livraison</span>
                                            </div>
                                            <p className="text-base font-bold text-slate-900">{selectedOrder.dateLiv ? new Date(selectedOrder.dateLiv).toLocaleDateString() : '—'}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 shadow-sm">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-blue-600" />
                                            Performance Qualité Actuelle
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-2xl text-center border border-blue-100/50 shadow-sm">
                                                <p className="text-2xl font-black text-slate-800">{selectedOrder.inspectedCount || 0}</p>
                                                <p className="text-sm font-bold text-slate-400 uppercase">Total Inspectés</p>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100 shadow-sm">
                                                <p className="text-2xl font-black text-emerald-600">{selectedOrder.conformCount || 0}</p>
                                                <p className="text-sm font-bold text-emerald-700 uppercase">Conformes</p>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100 shadow-sm">
                                                <p className="text-2xl font-black text-red-600">{selectedOrder.nonConformCount || 0}</p>
                                                <p className="text-sm font-bold text-red-700 uppercase">Rejetés</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 space-y-2">
                                            <div className="flex justify-between text-sm font-black uppercase">
                                                <span className="text-slate-500">Progression Production ({selectedOrder.inspectedCount}/{selectedOrder.quantity})</span>
                                                <span className="text-blue-600">{((selectedOrder.inspectedCount / selectedOrder.quantity) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-blue-100/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(selectedOrder.inspectedCount / selectedOrder.quantity) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8">
                                        <button 
                                            onClick={() => fetchCablesForOrder(selectedOrder.numeroOF)} 
                                            disabled={loadingCables}
                                            className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {loadingCables ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Eye size={20} />
                                            )}
                                            Suivi Détaillé des Câbles
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <button 
                                        onClick={() => setIsCableListView(false)}
                                        className="flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors mb-4"
                                    >
                                        <X size={16} className="rotate-45" /> Retour au Dossier
                                    </button>

                                    {(() => {
                                        // 1. Filtrer les câbles réels pour ne garder que ceux inspectés (Conformes ou Non conformes)
                                        const realInspectedCables = cablesForOrder.filter(cable => 
                                            cable.status && 
                                            cable.status.toLowerCase() !== 'en attente' && 
                                            cable.status.toLowerCase() !== 'en cours'
                                        );

                                        // 2. Identifier combien de câbles conformes manquent en base de données
                                        // (puisque Firestore n'enregistre souvent que les câbles non conformes pour économiser l'espace)
                                        const conformInDb = realInspectedCables.filter(c => 
                                            c.status?.toLowerCase() === 'conforme' || 
                                            c.status?.toLowerCase() === 'conforme (corrigé)'
                                        ).length;
                                        
                                        const missingConform = (selectedOrder.conformCount || 0) - conformInDb;
                                        
                                        const displayCables = [...realInspectedCables];
                                        
                                        if (missingConform > 0) {
                                            for (let i = 0; i < missingConform; i++) {
                                                displayCables.push({
                                                    id: `virtual-conform-${i}-${selectedOrder.id}`,
                                                    reference: `Câble Conforme #${i + 1}`,
                                                    code: `${selectedOrder.numeroOF || selectedOrder.reference}-CONF-${String(i + 1).padStart(3, '0')}`,
                                                    status: 'Conforme',
                                                    inspectionDate: selectedOrder.productionDate || new Date().toISOString()
                                                });
                                            }
                                        }

                                        if (displayCables.length === 0) {
                                            return (
                                                <div className="py-20 text-center space-y-4">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                                                        <Package size={32} />
                                                    </div>
                                                    <p className="text-slate-500 font-bold">Aucun câble inspecté trouvé pour cet OF</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="grid grid-cols-1 gap-3">
                                                {displayCables.map((cable) => (
                                                    <div 
                                                        key={cable.id} 
                                                        onClick={() => {
                                                            // Ne naviguer que pour les câbles non-virtuels
                                                            if (!cable.id.startsWith('virtual-conform-')) {
                                                                navigate(`/inspections/${cable.id}`);
                                                            }
                                                        }}
                                                        className={`p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/5 transition-all ${cable.id.startsWith('virtual-conform-') ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                <Hash size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{cable.reference}</p>
                                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{cable.code || 'Sans QR Code'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest border
                                                                ${cable.status === 'Conforme' || cable.status === 'Conforme (Corrigé)' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                                  cable.status === 'Non conforme' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                                  'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                {cable.status || 'En attente'}
                                                            </span>
                                                            {!cable.id.startsWith('virtual-conform-') && (
                                                                <ChevronDown size={16} className="text-slate-300 group-hover:text-blue-600 -rotate-90 transition-all" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>

                        {/* ── Header gradient ── */}
                        <div
                            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)' }}
                            className="relative px-8 py-6 overflow-hidden flex-shrink-0"
                        >
                            {/* decorative circles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-5" />
                            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white opacity-5" />

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all z-10"
                            >
                                <X size={15} strokeWidth={2.5} />
                            </button>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                                    {editOrder ? <Pencil size={22} /> : <Package size={22} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>
                                        {editOrder ? 'Mise à jour de l\'Ordre' : 'Nouvel Ordre de Fabrication'}
                                    </h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>
                                        {editOrder ? 'Modifier les informations du dossier' : 'Lancer un nouveau cycle de production'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Référence OF (numeroOF)</label>
                                        <input type="text" required placeholder="Ex: OF-2026-001" className="input-field" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Client</label>
                                        <input type="text" required placeholder="Ex: STEG" className="input-field" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">N° Commande (NumComd)</label>
                                        <input type="text" placeholder="Ex: CMD-8890" className="input-field" value={form.numComd} onChange={(e) => setForm({ ...form, numComd: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">GI PROS</label>
                                        <input type="text" placeholder="Responsable ou Processus" className="input-field" value={form.giPros} onChange={(e) => setForm({ ...form, giPros: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Quantité (QTA)</label>
                                        <input type="number" required min="1" placeholder="Ex: 500" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Ligne de Production</label>
                                        <input type="text" placeholder="Ex: Ligne 1" className="input-field" value={form.ligne} onChange={(e) => setForm({ ...form, ligne: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Date Lancement</label>
                                        <input type="date" required className="input-field" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Date Livraison (DateLiv)</label>
                                        <input type="date" className="input-field" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Statut Actuel</label>
                                        <CustomSelect
                                            options={[
                                                { value: 'En attente', label: 'En Attente' },
                                                { value: 'En cours', label: 'En Cours' },
                                                { value: 'Terminé', label: 'Terminé' },
                                                { value: 'Suspendu', label: 'Suspendu' },
                                            ]}
                                            value={form.status}
                                            onChange={(val) => setForm({ ...form, status: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer buttons ── */}
                            <div className="flex gap-3 px-8 py-5 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-2 flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', boxShadow: '0 8px 20px -4px rgba(67,56,202,0.4)' }}
                                >
                                    {editOrder ? 'Enregistrer les modifications' : 'Lancer la Production'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div
                            style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)' }}
                            className="relative px-8 py-6 overflow-hidden flex-shrink-0"
                        >
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white opacity-5" />
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all z-10"
                            >
                                <X size={15} />
                            </button>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                                    <Trash2 size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>Supprimer l'ordre ?</h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>Action irréversible</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6">
                            <p className="text-slate-600 font-semibold text-base leading-relaxed">
                                L'ordre <strong className="text-slate-900">{deleteConfirm.reference}</strong> sera supprimé définitivement ainsi que toutes les données associées.
                            </p>
                        </div>
                        <div className="flex gap-3 px-8 py-5 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Conserver
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Supprimer OF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
