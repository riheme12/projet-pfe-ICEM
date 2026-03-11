import React, { useState, useEffect } from 'react';
import { Cable as CableIcon, Plus, Search, QrCode, Eye, Pencil, Trash2, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { CableService, OrderService } from '../services/api';

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'en attente';
    const config = {
        'conforme': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={13} /> },
        'non conforme': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle size={13} /> },
        'en attente': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: <Clock size={13} /> },
    };
    const c = config[s] || config['en attente'];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            {c.icon} {status}
        </span>
    );
};

const Cables = () => {
    const [cables, setCables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editCable, setEditCable] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
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
            console.error("Erreur chargement câbles", error);
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
        try {
            if (editCable) {
                await CableService.update(editCable.id, form);
            } else {
                await CableService.create(form);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert("Erreur lors de l'enregistrement du câble");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await CableService.delete(deleteConfirm.id);
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const filteredCables = cables.filter(c =>
        c.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getOrderRef = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        return order?.reference || orderId?.substring(0, 10) || '—';
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Câbles</h1>
                    <p className="text-sm text-slate-500 mt-1">Suivi et traçabilité des câbles par référence et QR code</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Nouveau Câble
                </button>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par référence ou code QR..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code QR</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ordre</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Contrôle</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
                                        Chargement des câbles...
                                    </td>
                                </tr>
                            ) : filteredCables.length > 0 ? (
                                filteredCables.map((cable) => (
                                    <tr key={cable.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-800 text-sm">{cable.reference}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <QrCode size={14} className="text-slate-400" />
                                                {cable.code || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{getOrderRef(cable.orderId)}</td>
                                        <td className="px-6 py-4"><StatusBadge status={cable.status} /></td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {cable.inspectionDate ? new Date(cable.inspectionDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(cable)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(cable)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <QrCode size={44} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">Aucun câble trouvé</p>
                                        <p className="text-sm text-slate-400 mt-1">Ajoutez un câble ou modifiez vos critères de recherche</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editCable ? 'Modifier le câble' : 'Nouveau Câble'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Référence du câble</label>
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
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code QR / Code-barres</label>
                                <div className="relative">
                                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Scannez ou saisissez le code"
                                        className="input-field pl-10"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ordre de fabrication</label>
                                <select
                                    className="input-field"
                                    value={form.orderId}
                                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                                >
                                    <option value="">— Sélectionner un ordre —</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>{o.reference} — {o.cableType}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Statut</label>
                                <select
                                    className="input-field"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                    <option value="En attente">En attente</option>
                                    <option value="Conforme">Conforme</option>
                                    <option value="Non conforme">Non conforme</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
                                    {editCable ? 'Enregistrer' : 'Créer le câble'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content !max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Supprimer le câble ?</h3>
                            <p className="text-sm text-slate-500 mb-6">Cette action est irréversible. Le câble <strong>{deleteConfirm.reference}</strong> sera supprimé définitivement.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Annuler</button>
                                <button onClick={handleDelete} className="flex-1 btn-danger">Supprimer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cables;
