import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, Mail, Phone, UserPlus, Pencil, X, KeyRound, Loader2 } from 'lucide-react';
import { UserService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const RoleBadge = ({ role }) => {
    const config = {
        'Administrateur': 'bg-purple-50 text-purple-700 border-purple-200',
        'admin': 'bg-purple-50 text-purple-700 border-purple-200',
        'Responsable': 'bg-blue-50 text-blue-700 border-blue-200',
        'manager': 'bg-blue-50 text-blue-700 border-blue-200',
        'responsable_qualite': 'bg-blue-50 text-blue-700 border-blue-200',
        'Technicien': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'technician': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'technicien_qualite': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Direction': 'bg-amber-50 text-amber-700 border-amber-200',
        'direction': 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const roleLabels = {
        'admin': 'Administrateur',
        'manager': 'Resp. Qualité',
        'technician': 'Technicien',
        'technicien_qualite': 'Technicien Qualité',
        'responsable_qualite': 'Resp. Qualité',
        'direction': 'Direction',
    };

    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${config[role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {roleLabels[role] || role}
        </span>
    );
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [form, setForm] = useState({
        fullName: '', username: '', email: '', role: 'technician', phone: '', isActive: true
    });
    const { canResetPassword } = useAuth();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await UserService.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error("Erreur users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const openCreate = () => {
        setEditUser(null);
        setForm({ fullName: '', username: '', email: '', role: 'technician', phone: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setForm({
            fullName: user.fullName || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role || 'technician',
            phone: user.phone || '',
            isActive: user.isActive !== false,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                await UserService.update(editUser.id, form);
                setIsModalOpen(false);
                fetchUsers();
            } else {
                const response = await UserService.create({
                    ...form,
                    createdAt: new Date().toISOString(),
                    stats: { inspectionsCount: 0, anomaliesDetected: 0, conformityRate: 0, cablesProcessed: 0 }
                });
                const password = response.data.defaultPassword || 'Icem2026!';
                setIsModalOpen(false);
                fetchUsers();
                alert(`Utilisateur créé avec succès !\nMot de passe par défaut : ${password}`);
            }
        } catch (error) {
            alert("Erreur : " + (error.response?.data?.error || error.message));
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            await UserService.update(user.id, { isActive: !user.isActive });
            fetchUsers();
        } catch (error) {
            console.error("Erreur toggle status", error);
        }
    };

    const handleResetPassword = async () => {
        if (!resetModal || !newPassword) return;
        try {
            setResetting(true);
            await UserService.resetPassword(resetModal.id, newPassword);
            alert(`Mot de passe de ${resetModal.fullName} réinitialisé avec succès !`);
            setResetModal(null);
            setNewPassword('');
        } catch (error) {
            alert("Erreur : " + (error.response?.data?.error || error.message));
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
                    <p className="text-sm text-slate-500 mt-1">Contrôlez les accès et les rôles de l'équipe</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <UserPlus size={18} />
                    Ajouter Utilisateur
                </button>
            </div>

            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Chargement de l'équipe...</p>
                    </div>
                ) : users.length > 0 ? (
                    users.map(user => (
                        <div key={user.id} className={`card relative transition-all border-l-4 ${user.isActive ? 'border-l-emerald-400' : 'border-l-red-400 opacity-70'}`}>
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=e2e8f0&color=475569&bold=true&size=56`}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm truncate">{user.fullName}</h3>
                                    <RoleBadge role={user.role} />
                                </div>
                                <button
                                    onClick={() => openEdit(user)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-accent transition-colors flex-shrink-0"
                                    title="Modifier"
                                >
                                    <Pencil size={15} />
                                </button>
                            </div>

                            <div className="space-y-2.5 mb-5">
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                        <Mail size={14} className="text-slate-400" />
                                    </div>
                                    <span className="truncate">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Phone size={14} className="text-slate-400" />
                                        </div>
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                        <Shield size={14} className={user.isActive ? 'text-emerald-500' : 'text-red-400'} />
                                    </div>
                                    <span>Accès {user.isActive ? 'autorisé' : 'suspendu'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleUserStatus(user)}
                                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                                        user.isActive
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
                                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                >
                                    {user.isActive ? 'Désactiver' : 'Activer'}
                                </button>
                                {canResetPassword && (
                                    <button
                                        onClick={() => { setResetModal(user); setNewPassword(''); }}
                                        className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
                                        title="Réinitialiser le mot de passe"
                                    >
                                        <KeyRound size={14} />
                                        MDP
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full card py-20 text-center text-slate-400">
                        <UsersIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-slate-600">Aucun utilisateur trouvé</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom Complet</label>
                                <input
                                    type="text" required
                                    className="input-field"
                                    placeholder="Prénom et nom"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'utilisateur</label>
                                <input
                                    type="text" required
                                    className="input-field"
                                    placeholder="Identifiant unique"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Professionnel</label>
                                <input
                                    type="email" required
                                    className="input-field"
                                    placeholder="nom@icem.tn"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="+216 XX XXX XXX"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rôle</label>
                                <select
                                    className="input-field"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="admin">Administrateur</option>
                                    <option value="manager">Responsable Qualité</option>
                                    <option value="technician">Technicien Qualité</option>
                                    <option value="direction">Direction</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="flex-1 btn-primary">
                                    {editUser ? 'Enregistrer' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal && (
                <div className="modal-overlay" onClick={() => setResetModal(null)}>
                    <div className="modal-content !max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Réinitialiser le mot de passe</h2>
                            <button onClick={() => setResetModal(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Utilisateur</span>
                                    <span className="font-semibold text-slate-800">{resetModal.fullName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Email</span>
                                    <span className="font-semibold text-slate-800">{resetModal.email}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nouveau mot de passe</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Saisir le nouveau mot de passe"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1.5">Minimum 6 caractères. L'utilisateur devra se reconnecter.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setResetModal(null)} className="flex-1 btn-secondary">Annuler</button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetting || newPassword.length < 6}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {resetting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Envoi...</>
                                    ) : (
                                        <><KeyRound size={16} /> Réinitialiser</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
