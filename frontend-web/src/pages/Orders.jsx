import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Eye, Pencil, Trash2, X, CheckCircle2, Clock, AlertCircle, Hash, User, Cable, Factory, Calendar } from 'lucide-react';
import { OrderService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import jsPDF from 'jspdf';
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${styles[s] || styles['en attente']}`}>
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
    const [editOrder, setEditOrder] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    
    const [form, setForm] = useState({
        reference: '', 
        client: '', 
        numComd: '', 
        cableType: '', 
        quantity: '', 
        status: 'En attente',
        ligne: '',
        dateDebut: '', 
        dateFin: ''
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

    const openCreate = () => {
        setEditOrder(null);
        setForm({ 
            reference: '', client: '', numComd: '', cableType: '', 
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
            cableType: order.cableType || '',
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
        setIsDetailsOpen(true);
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
                cableType: form.cableType,
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
            order.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.numComd?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || order.statusDisplay?.toLowerCase() === statusFilter.toLowerCase() || order.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const handlePrintQRCodes = (order) => {
        const doc = new jsPDF();
        const canvas = document.getElementById(`qr-gen-${order.id}`);
        if (!canvas) {
            toast.error("QR Code non disponible.");
            return;
        }
        const qrImage = canvas.toDataURL("image/png");
        doc.setFontSize(16);
        doc.text(`Étiquettes QR - OF: ${order.reference}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Client: ${order.client} | Commande: ${order.numComd}`, 14, 28);

        let x = 14;
        let y = 40;
        for (let i = 0; i < Math.min(order.quantity, 12); i++) {
            doc.rect(x, y, 45, 45);
            doc.addImage(qrImage, 'PNG', x + 5, y + 5, 35, 35);
            doc.setFontSize(8);
            doc.text(`${order.reference}`, x + 22.5, y + 43, { align: 'center' });
            x += 50;
            if (x > 160) { x = 14; y += 50; }
        }
        doc.save(`QR_${order.reference}.pdf`);
    };

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
                        placeholder="Référence, client, commande..."
                        className="input-field pl-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field w-full md:w-44 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="Tous">Tous les statuts</option>
                    <option value="En cours">En Cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="En attente">En Attente</option>
                    <option value="Annulé">Annulé</option>
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Référence (OF)</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client / Commande</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type Câble</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Quantité</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-16 text-center">
                                        <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} 
                                    onClick={() => openDetails(order)}
                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                                    <td className="px-5 py-4 font-black text-slate-900 text-sm">{order.reference}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{order.client}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{order.numComd || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600 font-medium">{order.cableType || '—'}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-black">{order.quantity}</span>
                                    </td>
                                    <td className="px-5 py-4"><StatusBadge status={order.statusDisplay || order.status} /></td>
                                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(order)} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(order)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
                    <div className="modal-content !max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase">Dossier de Fabrication</h2>
                                    <p className="text-xs font-bold text-blue-600 tracking-widest">RÉF : {selectedOrder.reference}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar">
                            <div className="md:col-span-2 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <User size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Client</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{selectedOrder.client}</p>
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <Hash size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">N° Commande</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{selectedOrder.numComd || '—'}</p>
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <Cable size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Type de Câble</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{selectedOrder.cableType || '—'}</p>
                                    </div>
                                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Factory size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Ligne / OF</span>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">{selectedOrder.ligne || '—'}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-blue-600" />
                                        Performance Qualité
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-2xl text-center border border-blue-100/50 shadow-sm">
                                            <p className="text-2xl font-black text-slate-800">{selectedOrder.inspectedCount || 0}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Total Inspectés</p>
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100 shadow-sm">
                                            <p className="text-2xl font-black text-emerald-600">{selectedOrder.conformCount || 0}</p>
                                            <p className="text-[9px] font-bold text-emerald-700 uppercase">Conformes</p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100 shadow-sm">
                                            <p className="text-2xl font-black text-red-600">{selectedOrder.nonConformCount || 0}</p>
                                            <p className="text-[9px] font-bold text-red-700 uppercase">Rejetés</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                            <span className="text-slate-500">Progression Production</span>
                                            <span className="text-blue-600">{((selectedOrder.inspectedCount / selectedOrder.quantity) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-blue-100/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(selectedOrder.inspectedCount / selectedOrder.quantity) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center">
                                    <QRCodeCanvas id={`qr-gen-${selectedOrder.id}`} value={selectedOrder.reference} size={160} level={"H"} className="rounded-xl p-2 bg-white shadow-sm mb-4" />
                                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">{selectedOrder.reference}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Calendar className="text-slate-400" size={18} />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Date Lancement</p>
                                            <p className="text-sm font-bold text-slate-900">{new Date(selectedOrder.productionDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <Clock className="text-slate-400" size={18} />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Date Livraison</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedOrder.dateLiv ? new Date(selectedOrder.dateLiv).toLocaleDateString() : 'Non définie'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handlePrintQRCodes(selectedOrder)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-xl">
                                    <Package size={18} /> Imprimer Étiquettes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                {editOrder ? 'Mise à jour de l\'Ordre' : 'Nouvel Ordre de Fabrication'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Référence OF (numeroOF)</label>
                                    <input type="text" required placeholder="Ex: OF-2026-001" className="input-field" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client</label>
                                    <input type="text" required placeholder="Ex: STEG" className="input-field" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">N° Commande (NumComd)</label>
                                    <input type="text" placeholder="Ex: CMD-8890" className="input-field" value={form.numComd} onChange={(e) => setForm({ ...form, numComd: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Type de Câble (cableType)</label>
                                    <input type="text" placeholder="Ex: NYY-J 3x1.5 mm2" className="input-field" value={form.cableType} onChange={(e) => setForm({ ...form, cableType: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Quantité (QTA)</label>
                                    <input type="number" required min="1" placeholder="Ex: 500" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ligne de Production</label>
                                    <input type="text" placeholder="Ex: Ligne 1" className="input-field" value={form.ligne} onChange={(e) => setForm({ ...form, ligne: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Date Lancement</label>
                                    <input type="date" required className="input-field" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Date Livraison (DateLiv)</label>
                                    <input type="date" className="input-field" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Statut Actuel</label>
                                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        <option value="En attente">En Attente</option>
                                        <option value="En cours">En Cours</option>
                                        <option value="Terminé">Terminé</option>
                                        <option value="Suspendu">Suspendu</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-3">Annuler</button>
                                <button type="submit" className="flex-1 btn-primary py-3 shadow-lg shadow-blue-200">{editOrder ? 'Mettre à jour' : 'Lancer la Production'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content !max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Supprimer l'ordre ?</h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                Cette action est irréversible. L'ordre <strong>{deleteConfirm.reference}</strong> sera effacé définitivement de Firebase.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Conserver</button>
                                <button onClick={handleDelete} className="flex-1 btn-danger">Supprimer OF</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
