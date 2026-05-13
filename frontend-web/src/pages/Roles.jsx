import React, { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, X, Palette } from 'lucide-react';
import { RoleService } from '../services/api';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [form, setForm] = useState({ label: '', value: '', color: 'blue', description: '' });

    const COLORS = ['blue', 'indigo', 'emerald', 'amber', 'red', 'purple', 'pink', 'slate'];

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await RoleService.getAll();
            setRoles(response.data);
        } catch (error) {
            toast.error("Erreur de chargement des rôles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoles(); }, []);

    const openCreate = () => {
        setEditRole(null);
        setForm({ label: '', value: '', color: 'blue', description: '' });
        setIsModalOpen(true);
    };

    const openEdit = (role) => {
        setEditRole(role);
        setForm({
            label: role.label,
            value: role.value,
            color: role.color || 'blue',
            description: role.description || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editRole) {
                await RoleService.update(editRole.id, form);
                toast.success('Rôle mis à jour');
            } else {
                await RoleService.create(form);
                toast.success('Nouveau rôle ajouté');
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error("Erreur lors de la gestion du rôle");
        }
    };

    const deleteRole = async (id) => {
        if (!window.confirm("Supprimer ce rôle ? Cela ne supprimera pas les utilisateurs associés.")) return;
        try {
            await RoleService.delete(id);
            fetchRoles();
            toast.success("Rôle supprimé");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Gestion des Rôles"
                subtitle="Définissez les responsabilités et les accès au sein de votre organisation"
                icon={<Shield />}
                actions={
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                        <Plus size={18} />
                        Nouveau Rôle
                    </button>
                }
            />

            {loading ? (
                <div className="card py-20 text-center">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Chargement des rôles...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="card group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                                    ${role.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                      role.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                      role.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                      role.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                      role.color === 'red' ? 'bg-red-50 text-red-600' :
                                      role.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                                      role.color === 'pink' ? 'bg-pink-50 text-pink-600' : 'bg-slate-50 text-slate-600'}`}>
                                    <Shield size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEdit(role)} 
                                        className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                                        title="Modifier"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => deleteRole(role.id)} 
                                        className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">{role.label}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ID: {role.value}</p>
                            <p className="text-sm text-slate-500 line-clamp-2">{role.description || 'Aucune description fournie.'}</p>
                        </div>
                    ))}
                    <button onClick={openCreate} className="card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-12 gap-3 hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Plus size={24} />
                        </div>
                        <p className="font-bold text-slate-400">Ajouter un nouveau rôle</p>
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">{editRole ? 'Modifier le rôle' : 'Nouveau Rôle'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Libellé du rôle</label>
                                <input type="text" required className="input-field" placeholder="Ex: Responsable Maintenance" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Identifiant (Value)</label>
                                <input type="text" required className="input-field" placeholder="Ex: maintenance_lead" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Couleur Badge</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c} type="button"
                                            onClick={() => setForm({ ...form, color: c })}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2 ${form.color === c ? 'border-indigo-600 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                                            style={{ backgroundColor: c === 'indigo' ? '#e0e7ff' : c === 'blue' ? '#dbeafe' : c === 'emerald' ? '#d1fae5' : c === 'amber' ? '#fef3c7' : c === 'red' ? '#fee2e2' : c === 'purple' ? '#f3e8ff' : c === 'pink' ? '#fce7f3' : '#f1f5f9' }}
                                        >
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c === 'indigo' ? '#4f46e5' : c === 'blue' ? '#2563eb' : c === 'emerald' ? '#10b981' : c === 'amber' ? '#d97706' : c === 'red' ? '#dc2626' : c === 'purple' ? '#9333ea' : c === 'pink' ? '#db2777' : '#475569' }}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                                <textarea className="input-field min-h-[80px]" placeholder="Brève description des responsabilités..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Annuler</button>
                                <button type="submit" className="flex-1 btn-primary">{editRole ? 'Enregistrer' : 'Ajouter le rôle'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Roles;
