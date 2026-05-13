import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, Mail, Phone, UserPlus, Pencil, X, KeyRound, Loader2, Search, Plus } from 'lucide-react';
import { UserService, RoleService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const RoleBadge = ({ role, allRoles = [] }) => {
    const roleData = allRoles.find(r => r.value === role);
    const color = roleData?.color || 'slate';

    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
        pink: 'bg-pink-50 text-pink-600',
        slate: 'bg-slate-50 text-slate-600',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${colorClasses[color] || colorClasses.slate}`}>
            {roleData?.label || role}
        </span>
    );
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [form, setForm] = useState({
        fullName: '', username: '', email: '', role: 'technician', roles: [], phone: '', isActive: true
    });

    const { canResetPassword } = useAuth();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([
                UserService.getAll(),
                RoleService.getAll()
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            toast.error("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreateUser = () => {
        setEditUser(null);
        setForm({ fullName: '', username: '', email: '', role: roles[0]?.value || 'technician', roles: [], phone: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEditUser = (user) => {
        setEditUser(user);
        setForm({
            fullName: user.fullName || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role || (user.roles?.length > 0 ? user.roles[0] : 'technician'),
            roles: user.roles?.filter(r => r !== (user.role || user.roles[0])) || [],
            phone: user.phone || '',
            isActive: user.isActive !== false,
        });
        setIsModalOpen(true);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalRoles = [form.role, ...form.roles];
            const data = { ...form, roles: [...new Set(finalRoles)] };

            if (editUser) {
                await UserService.update(editUser.id, data);
                setIsModalOpen(false);
                fetchData();
                toast.success('Utilisateur mis à jour !');
            } else {
                const response = await UserService.create({
                    ...data,
                    createdAt: new Date().toISOString(),
                    stats: { inspectionsCount: 0, anomaliesDetected: 0, conformityRate: 0, cablesProcessed: 0 }
                });
                const password = response.data.defaultPassword || 'Icem2026!';
                setIsModalOpen(false);
                fetchData();
                toast.success(`Utilisateur créé !\nMot de passe : ${password}`, { duration: 8000 });
            }
        } catch (error) {
            toast.error("Erreur : " + (error.response?.data?.error || error.message));
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            await UserService.update(user.id, { isActive: !user.isActive });
            fetchData();
            toast.success(user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé');
        } catch (error) {
            toast.error("Erreur lors de la modification du statut");
        }
    };

    const handleResetPassword = async () => {
        if (!resetModal || !newPassword) return;
        try {
            setResetting(true);
            await UserService.resetPassword(resetModal.id, newPassword);
            toast.success(`Mot de passe de ${resetModal.fullName} réinitialisé avec succès !`);
            setResetModal(null);
            setNewPassword('');
        } catch (error) {
            toast.error("Erreur : " + (error.response?.data?.error || error.message));
        } finally {
            setResetting(false);
        }
    };

    const filteredUsers = users.filter(user => 
        (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Gestion des Utilisateurs"
                subtitle="Contrôlez les accès et la sécurité de votre équipe industrielle"
                icon={<UsersIcon />}
                actions={
                    <button onClick={openCreateUser} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                        <Plus size={18} />
                        Ajouter Utilisateur
                    </button>
                }
            />

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-3.5 rounded-xl border border-slate-100" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.03)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        className="input-field pl-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="card py-20 text-center">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Chargement de l'équipe...</p>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div key={user.id} className={`card flex flex-col md:flex-row md:items-center gap-4 !p-4 transition-all border-l-4 ${user.isActive ? 'border-l-emerald-400 hover:border-l-emerald-500' : 'border-l-red-400 opacity-75'} shadow-sm hover:bg-slate-50`}>
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-white ring-2 ring-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                                <img
                                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=6366f1&color=ffffff&bold=true&size=88`}
                                    alt={user.fullName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-slate-900 text-base">{user.fullName}</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {[user.role, ...(user.roles || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(r => (
                                            <RoleBadge key={r} role={r} allRoles={roles} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                                    {user.phone && <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>}
                                    <span className={`flex items-center gap-1 font-medium ${user.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                        <Shield size={14} /> {user.isActive ? 'Actif' : 'Suspendu'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleUserStatus(user)}
                                    className={`px-3 py-2 text-sm font-bold rounded-lg transition-colors border ${
                                        user.isActive
                                            ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                    }`}
                                >
                                    {user.isActive ? 'Désactiver' : 'Activer'}
                                </button>
                                {canResetPassword && (
                                    <button
                                        onClick={() => { setResetModal(user); setNewPassword(''); }}
                                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        <KeyRound size={15} />
                                    </button>
                                )}
                                <button
                                    onClick={() => openEditUser(user)}
                                    className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                >
                                    <Pencil size={15} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card py-20 text-center text-slate-400">
                        <UsersIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-slate-600">Aucun utilisateur trouvé</p>
                    </div>
                )}
            </div>

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
                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom Complet</label>
                                    <input type="text" required className="input-field" placeholder="Prénom et nom" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'utilisateur</label>
                                    <input type="text" required className="input-field" placeholder="Identifiant" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
                                    <input type="tel" className="input-field" placeholder="+216 ..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Professionnel</label>
                                    <input type="email" required className="input-field" placeholder="nom@icem.tn" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rôle Principal</label>
                                <select 
                                    className="input-field cursor-pointer"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rôles Additionnels</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                                    {roles.filter(r => r.value !== form.role).map(r => (
                                        <label key={r.id} className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                checked={form.roles.includes(r.value)}
                                                onChange={(e) => {
                                                    let newRoles = e.target.checked 
                                                        ? [...form.roles, r.value] 
                                                        : form.roles.filter(x => x !== r.value);
                                                    setForm({...form, roles: newRoles});
                                                }}
                                            />
                                            <span className="text-xs font-medium text-slate-700">{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Annuler</button>
                                <button type="submit" className="flex-1 btn-primary">{editUser ? 'Enregistrer' : 'Créer le compte'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nouveau mot de passe</label>
                                <input type="text" className="input-field" placeholder="Saisir le nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setResetModal(null)} className="flex-1 btn-secondary">Annuler</button>
                                <button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6} className="flex-1 btn-primary flex items-center justify-center gap-2">
                                    {resetting ? <Loader2 size={16} className="animate-spin" /> : 'Réinitialiser'}
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
