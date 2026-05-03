import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Eye, Pencil, Trash2, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { OrderService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

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
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [editOrder, setEditOrder] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        reference: '', client: '', quantity: '', status: 'En attente',
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
        setForm({ reference: '', client: '', quantity: '', status: 'En attente', dateDebut: '', dateFin: '' });
        setIsModalOpen(true);
    };

    const openEdit = (order) => {
        setEditOrder(order);
        setForm({
            reference: order.reference || '',
            client: order.client || order.cableType || '',
            quantity: order.quantity?.toString() || '',
            status: order.status || 'En attente',
            dateDebut: order.productionDate ? new Date(order.productionDate).toISOString().split('T')[0] : '',
            dateFin: order.endDate ? new Date(order.endDate).toISOString().split('T')[0] : '',
        });
        setIsModalOpen(true);
    };

    const handleClientChange = (value) => {
        const prefix = value.substring(0, 3).toUpperCase() || 'CLI';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const autoRef = `${prefix}-${new Date().getFullYear()}-${randomNum}`;
        setForm({ ...form, client: value, reference: form.reference || autoRef });
    };

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                reference: form.reference,
                client: form.client,
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
        const clientName = order.client || order.cableType || '';
        const matchesSearch =
            order.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || order.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const handlePrintQRCodes = (order) => {
        const doc = new jsPDF();
        const canvas = document.getElementById(`qr-gen-${order.id}`);
        if (!canvas) {
            alert("Erreur: QR Code non généré visuellement. Réessayez.");
            return;
        }
        const qrImage = canvas.toDataURL("image/png");

        doc.setFontSize(16);
        doc.text(`Étiquettes QR - Ordre: ${order.reference}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Client: ${order.client || order.cableType} | Quantité: ${order.quantity}`, 14, 28);

        // Générer une grille d'étiquettes
        let x = 14;
        let y = 40;
        for (let i = 0; i < Math.min(order.quantity, 12); i++) {
            doc.rect(x, y, 45, 45); // Cadre
            doc.addImage(qrImage, 'PNG', x + 5, y + 5, 35, 35);
            doc.setFontSize(8);
            doc.text(`${order.reference}`, x + 22.5, y + 43, { align: 'center' });
            
            x += 50;
            if (x > 160) {
                x = 14;
                y += 50;
            }
        }

        doc.save(`QR_Labels_${order.reference}.pdf`);
    };

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
                        placeholder="Rechercher par référence ou client..."
                        className="input-field pl-10 text-base"
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
                            <tr className="bg-blue-50/60 border-b border-blue-100">
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Quantité</th>
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-sm font-bold text-blue-900 uppercase tracking-wider text-right">Actions</th>
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
                                    <tr key={order.id} 
                                        onClick={() => openDetails(order)}
                                        className="hover:bg-blue-50/40 transition-colors cursor-pointer border-b border-slate-50">
                                        <td className="px-6 py-5 font-bold text-slate-900 text-base">{order.reference}</td>
                                        <td className="px-6 py-5 text-slate-700 text-base font-medium">{order.client || order.cableType}</td>
                                        <td className="px-6 py-5 text-slate-700 text-base font-medium">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">{order.quantity} unités</span>
                                        </td>
                                        <td className="px-6 py-5"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-5 text-base font-medium text-slate-600">
                                            {order.productionDate ? new Date(order.productionDate).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate('/cables', { state: { search: order.reference } })}
                                                    className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors shadow-sm"
                                                    title="Voir les câbles/inspections"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                {canEdit('orders') && (
                                                    <button
                                                        onClick={() => openEdit(order)}
                                                        className="p-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-600 transition-colors shadow-sm"
                                                        title="Modifier"
                                                    >
                                                        <Pencil size={20} />
                                                    </button>
                                                )}
                                                {canDelete('orders') && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(order)}
                                                        className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors shadow-sm"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={20} />
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

            {/* Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
                    <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Détails de l'Ordre</h2>
                                <p className="text-sm text-slate-500 font-medium">{selectedOrder.reference}</p>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Client</p>
                                    <p className="text-xl font-black text-blue-900">{selectedOrder.client || selectedOrder.cableType}</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Statut Production</p>
                                    <div className="pt-1"><StatusBadge status={selectedOrder.status} /></div>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantité Totale</p>
                                    <p className="text-xl font-black text-slate-900">{selectedOrder.quantity} unités</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date de Début</p>
                                    <p className="text-xl font-black text-slate-900">{new Date(selectedOrder.productionDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-900 mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-blue-600" />
                                    Statistiques de Conformité
                                </h3>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-slate-800">{selectedOrder.inspectedCount || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Inspectés</p>
                                    </div>
                                    <div className="text-center text-emerald-600">
                                        <p className="text-2xl font-black">{selectedOrder.conformCount || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Conformes</p>
                                    </div>
                                    <div className="text-center text-red-600">
                                        <p className="text-2xl font-black">{selectedOrder.nonConformCount || 0}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Défauts</p>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500 uppercase tracking-tighter">Progression</span>
                                        <span className="text-blue-600">{((selectedOrder.inspectedCount / selectedOrder.quantity) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all duration-1000"
                                            style={{ width: `${(selectedOrder.inspectedCount / selectedOrder.quantity) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <div style={{ display: 'none' }}>
                                    <QRCodeCanvas
                                        id={`qr-gen-${selectedOrder.id}`}
                                        value={selectedOrder.reference}
                                        size={256}
                                        level={"H"}
                                    />
                                </div>
                                <button
                                    onClick={() => handlePrintQRCodes(selectedOrder)}
                                    className="flex-1 bg-slate-800 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                                >
                                    <Package size={18} />
                                    Imprimer Étiquettes QR
                                </button>
                                <button
                                    onClick={() => navigate('/cables', { state: { search: selectedOrder.reference } })}
                                    className="flex-1 btn-primary py-4 rounded-2xl flex items-center justify-center gap-2"
                                >
                                    <Eye size={18} />
                                    Suivi Inspections
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Nom du client"
                                        className="input-field"
                                        value={form.client}
                                        onChange={(e) => handleClientChange(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Référence / Commande</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: OF-2026-001"
                                        className="input-field"
                                        value={form.reference}
                                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
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
