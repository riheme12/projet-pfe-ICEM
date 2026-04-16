import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Eye, Pencil, Trash2, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { OrderService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'en attente';
    const styles = {
        'en cours': 'bg-blue-50 text-blue-700 border-blue-200',
        'terminé': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'termine': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'en attente': 'bg-amber-50 text-amber-700 border-amber-200',
        'annulé': 'bg-red-50 text-red-700 border-red-200',
        'suspendu': 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const icons = {
        'en cours': <Clock size={13} className="mr-1" />,
        'terminé': <CheckCircle2 size={13} className="mr-1" />,
        'termine': <CheckCircle2 size={13} className="mr-1" />,
        'en attente': <AlertCircle size={13} className="mr-1" />,
    };
    const labels = {
        'en cours': 'En Cours', 'terminé': 'Terminé', 'termine': 'Terminé',
        'en attente': 'En Attente', 'annulé': 'Annulé', 'suspendu': 'Suspendu',
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center w-fit ${styles[s] || styles['en attente']}`}>
            {icons[s]}
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
    const [editOrder, setEditOrder] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        reference: '', cableType: '', quantity: '', status: 'En attente',
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
            console.error("Erreur lors de la récupération des ordres", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const openCreate = () => {
        setEditOrder(null);
        setForm({ reference: '', cableType: '', quantity: '', status: 'En attente', dateDebut: '', dateFin: '' });
        setIsModalOpen(true);
    };

    const openEdit = (order) => {
        setEditOrder(order);
        setForm({
            reference: order.reference || '',
            cableType: order.cableType || '',
            quantity: order.quantity?.toString() || '',
            status: order.status || 'En attente',
            dateDebut: order.productionDate ? new Date(order.productionDate).toISOString().split('T')[0] : '',
            dateFin: order.endDate ? new Date(order.endDate).toISOString().split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                reference: form.reference,
                cableType: form.cableType,
                quantity: parseInt(form.quantity, 10),
                status: form.status,
                productionDate: form.dateDebut || new Date().toISOString(),
                endDate: form.dateFin || null,
            };
            if (editOrder) {
                await OrderService.update(editOrder.id, data);
            } else {
                data.inspectedCount = 0;
                data.conformCount = 0;
                data.nonConformCount = 0;
                await OrderService.create(data);
            }
            setIsModalOpen(false);
            fetchOrders();
        } catch (error) {
            alert("Erreur lors de l'enregistrement de l'ordre");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await OrderService.delete(deleteConfirm.id);
            setDeleteConfirm(null);
            fetchOrders();
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.cableType?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || order.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ordres de Fabrication</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestion et suivi des ordres de production</p>
                </div>
                {canCreate('orders') && (
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                        <Plus size={18} />
                        Nouvel Ordre
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par référence ou type de câble..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field w-full md:w-44"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="Tous">Tous les statuts</option>
                    <option value="En cours">En Cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="En attente">En Attente</option>
                    <option value="Annulé">Annulé</option>
                    <option value="Suspendu">Suspendu</option>
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type de Câble</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantité</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
                                        Chargement des ordres...
                                    </td>
                                </tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800 text-sm">{order.reference}</td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{order.cableType}</td>
                                        <td className="px-6 py-4 text-slate-600 text-sm font-medium">{order.quantity} unités</td>
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {order.productionDate ? new Date(order.productionDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/inspections/${order.id}`)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Voir le rapport"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {canEdit('orders') && (
                                                    <button
                                                        onClick={() => openEdit(order)}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                )}
                                                {canDelete('orders') && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(order)}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Package size={44} className="mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">Aucun ordre de fabrication trouvé</p>
                                        <p className="text-sm text-slate-400 mt-1">Créez un nouvel ordre ou modifiez vos filtres</p>
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
                                {editOrder ? 'Modifier l\'ordre' : 'Nouvel Ordre de Fabrication'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Référence</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: OF-2026-001"
                                        className="input-field"
                                        value={form.reference}
                                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type de Câble</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Câble Cuivre 10mm"
                                        className="input-field"
                                        value={form.cableType}
                                        onChange={(e) => setForm({ ...form, cableType: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantité prévue</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Nombre d'unités"
                                        className="input-field"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Statut</label>
                                    <select
                                        className="input-field"
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option value="En attente">En Attente</option>
                                        <option value="En cours">En Cours</option>
                                        <option value="Terminé">Terminé</option>
                                        <option value="Suspendu">Suspendu</option>
                                        <option value="Annulé">Annulé</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date de début</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={form.dateDebut}
                                        onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date de fin prévue</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={form.dateFin}
                                        onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
                                    {editOrder ? 'Enregistrer' : 'Créer l\'ordre'}
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
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Supprimer l'ordre ?</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                L'ordre <strong>{deleteConfirm.reference}</strong> sera supprimé définitivement avec toutes ses données associées.
                            </p>
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

export default Orders;
