import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Cable as CableIcon, Plus, Search, QrCode, Eye, Pencil, Trash2, X, CheckCircle, AlertCircle, Clock, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

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
import { CableService, OrderService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'en attente';
    const config = {
        'conforme': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
        'non conforme': { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
        'en attente': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    };
    const c = config[s] || config['en attente'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {status}
        </span>
    );
};

const Cables = () => {
    const { canCreate, canEdit, canDelete } = useAuth();
    const [cables, setCables] = useState([]);
    const [orders, setOrders] = useState([]);
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(location.state?.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editCable, setEditCable] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [form, setForm] = useState({
        reference: '',
        code: '',
        orderId: '',
        status: 'En attente'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cablesRes, ordersRes] = await Promise.all([
                CableService.getAll(),
                OrderService.getAll().catch(() => ({ data: [] }))
            ]);
            setCables(cablesRes.data || []);
            setOrders(ordersRes.data || []);
        } catch (error) {
            toast.error("Erreur de chargement des câbles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditCable(null);
        setForm({ reference: '', code: '', orderId: '', status: 'En attente' });
        setIsModalOpen(true);
    };

    const openEdit = (cable) => {
        setEditCable(cable);
        setForm({
            reference: cable.reference || '',
            code: cable.code || '',
            orderId: cable.orderId || '',
            status: cable.status || 'En attente'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation logique métier
        if (form.code && form.code.length < 3) {
            toast.error("Le code QR doit contenir au moins 3 caractères.");
            return;
        }
        if (!form.orderId) {
            toast.error("Le câble doit être associé à un ordre de fabrication.");
            return;
        }

        try {
            if (editCable) {
                await CableService.update(editCable.id, form);
                toast.success('Câble mis à jour !');
            } else {
                await CableService.create(form);
                toast.success('Câble créé avec succès !');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(err => `• ${err.msg}`).join('\n');
                toast.error(`Erreur de validation :\n${errorMessages}`);
            } else {
                toast.error("Erreur d'enregistrement : " + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await CableService.delete(deleteConfirm.id);
            toast.success('Câble supprimé');
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const getOrderRef = (orderId) => {
        const order = orders.find(o => o.numeroOF === orderId || o.id === orderId);
        return order ? (order.numeroOF || order.reference) : orderId || '—';
    };

    const filteredCables = cables.filter(c => {
        const orderRef = getOrderRef(c.orderId).toLowerCase();
        const search = searchTerm.toLowerCase();
        return c.reference?.toLowerCase().includes(search) ||
               c.code?.toLowerCase().includes(search) ||
               orderRef.includes(search);
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredCables.length / ITEMS_PER_PAGE);
    const paginatedCables = filteredCables.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Suivi des Câbles"
                subtitle="Traçabilité unitaire et contrôle qualité par QR Code"
                icon={<CableIcon />}
                actions={
                    canCreate('cables') && (
                        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                            <Plus size={20} />
                            Enregistrer un Câble
                        </button>
                    )
                }
            />

            {/* Search Suite */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white/60 backdrop-blur-md p-4 rounded-[28px] border border-white/60 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, QR Code ou n° d'OF..."
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3.5 pl-12 pr-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Cables Grid/List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[30px] border border-white py-24 text-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chargement des données câbles...</p>
                    </div>
                ) : paginatedCables.length > 0 ? (
                    paginatedCables.map((cable) => (
                        <div key={cable.id} className="group bg-white/70 backdrop-blur-md rounded-[30px] border border-white/60 p-5 flex flex-col lg:flex-row lg:items-center gap-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 overflow-hidden">
                            
                            <div className="flex items-center gap-5 flex-1">
                                {/* Icon with background */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200/50 text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <QrCode size={32} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{cable.reference}</h3>
                                        <StatusBadge status={cable.status} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
                                        <span className="flex items-center gap-1.5"><QrCode size={14} className="text-slate-300" /> {cable.code || 'Sans Code'}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                        <span className="flex items-center gap-1.5 text-blue-600 font-black"><ClipboardList size={14} className="text-blue-300" /> OF: {getOrderRef(cable.orderId)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap lg:justify-end">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="text-[13px] font-black text-slate-700">
                                        {cable.inspectionDate ? new Date(cable.inspectionDate).toLocaleDateString('fr-FR') : 'Non inspecté'}
                                    </span>
                                </div>

                                {(canEdit('cables') || canDelete('cables')) && (
                                    <div className="flex gap-2">
                                        {canEdit('cables') && (
                                            <button
                                                onClick={() => openEdit(cable)}
                                                className="w-11 h-11 bg-white text-amber-500 rounded-xl border border-amber-100 shadow-sm flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all active:scale-90"
                                            >
                                                <Pencil size={16} strokeWidth={2.5} />
                                            </button>
                                        )}
                                        {canDelete('cables') && (
                                            <button
                                                onClick={() => setDeleteConfirm(cable)}
                                                className="w-11 h-11 bg-white text-red-500 rounded-xl border border-red-100 shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white/50 backdrop-blur-sm rounded-[30px] border border-white py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 border border-slate-100 shadow-inner">
                            <QrCode size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Aucun câble trouvé</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto">Aucun résultat ne correspond à votre recherche pour "{searchTerm}".</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && filteredCables.length > 0 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content !max-w-xl" onClick={(e) => e.stopPropagation()}>

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
                                    {editCable ? <Pencil size={22} /> : <QrCode size={22} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>
                                        {editCable ? 'Modifier le câble' : 'Nouveau Câble'}
                                    </h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>
                                        {editCable ? 'Mise à jour des informations' : 'Enregistrement d\'une nouvelle unité'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Référence du câble</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: CAB-2026-001"
                                        className="input-field"
                                        value={form.reference}
                                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Code QR / Code-barres</label>
                                    <div className="relative">
                                        <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Scannez ou saisissez le code"
                                            className="input-field pl-12"
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Ordre de fabrication</label>
                                    <select
                                        className="select-field"
                                        value={form.orderId}
                                        onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                                    >
                                        <option value="">— Sélectionner un ordre —</option>
                                        {orders.map(o => (
                                            <option key={o.id} value={o.numeroOF || o.reference}>{o.numeroOF} — {o.reference} — {o.client}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Statut</label>
                                    <select
                                        className="select-field"
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option value="En attente">En attente</option>
                                        <option value="Conforme">Conforme</option>
                                        <option value="Non conforme">Non conforme</option>
                                    </select>
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
                                    {editCable ? 'Enregistrer les modifications' : 'Créer le câble'}
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
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>Supprimer le câble ?</h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>Action irréversible</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6">
                            <p className="text-slate-600 font-semibold text-base leading-relaxed">
                                Le câble <strong className="text-slate-900">{deleteConfirm.reference}</strong> sera supprimé définitivement de la base de données.
                            </p>
                        </div>
                        <div className="flex gap-3 px-8 py-5 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cables;
