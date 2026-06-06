import React, { useState, useEffect, useRef } from 'react';
import { Users as UsersIcon, Shield, Mail, Phone, UserPlus, Pencil, X, KeyRound, Loader2, Search, Plus, Upload, Trash2, FileSignature, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="flex items-center justify-between mt-4 px-1">
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
import { UserService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
    admin: 'Administrateur',
    manager: 'Responsable Qualité',
    director: 'Directeur',
    technician: 'Technicien'
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(null);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const signatureInputRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [form, setForm] = useState({
        fullName: '', username: '', email: '', phone: '', isActive: true, role: 'technician', roles: ['technician']
    });

    const { canResetPassword, canCreate, canEdit } = useAuth();

    const fetchData = async () => {
        try {
            setLoading(true);
            const usersRes = await UserService.getAll();
            setUsers(usersRes.data);
        } catch (error) {
            toast.error("Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreateUser = () => {
        setEditUser(null);
        setForm({ fullName: '', username: '', email: '', phone: '', isActive: true, role: 'technician', roles: ['technician'] });
        setSignatureFile(null);
        setSignaturePreview(null);
        setIsModalOpen(true);
    };

    const openEditUser = async (user) => {
        try {
            // Fetch complete user data to get the signatureUrl (omitted in getAll)
            const response = await toast.promise(
                UserService.getById(user.id),
                {
                    loading: 'Chargement des données...',
                    success: 'Données chargées',
                    error: 'Erreur de chargement'
                }
            );
            
            const fullUser = response.data;
            
            setEditUser(fullUser);
            
            const userRoles = fullUser.roles && fullUser.roles.length > 0 ? fullUser.roles : [fullUser.role || 'technician'];
            const primaryRole = fullUser.role || userRoles[0];

            setForm({
                fullName: fullUser.fullName || '',
                username: fullUser.username || '',
                email: fullUser.email || '',
                phone: fullUser.phone || '',
                isActive: fullUser.isActive !== false,
                role: primaryRole,
                roles: userRoles
            });
            setSignatureFile(null);
            setSignaturePreview(fullUser.signatureUrl || null);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Erreur openEditUser:', error);
            if (error.response) {
                toast.error(`Erreur Serveur: ${error.response.data?.error || error.response.status}`);
            } else {
                toast.error(`Erreur: ${error.message}`);
            }
        }
    };

    const handleSignatureSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Veuillez sélectionner une image (PNG, JPG)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La taille maximale est de 5 Mo');
            return;
        }
        setSignatureFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setSignaturePreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveSignature = () => {
        setSignatureFile(null);
        setSignaturePreview(null);
        if (signatureInputRef.current) signatureInputRef.current.value = '';
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            const secondaryRoles = (form.roles || []).filter(r => r !== form.role);
            const data = {
                ...form,
                role: form.role,
                roles: [form.role, ...secondaryRoles]
            };
            let userId = editUser?.id;

            if (editUser) {
                await UserService.update(editUser.id, data);
                toast.success('Utilisateur mis à jour !');
            } else {
                const response = await UserService.create({
                    ...data,
                    createdAt: new Date().toISOString(),
                    stats: { inspectionsCount: 0, anomaliesDetected: 0, conformityRate: 0, cablesProcessed: 0 }
                });
                userId = response.data.id;
                const password = response.data.defaultPassword || 'Icem2026!';
                toast.success(`Utilisateur créé !\nMot de passe : ${password}`, { duration: 8000 });
            }

            // Upload signature if a new file was selected
            if (signatureFile && userId) {
                setUploadingSignature(true);
                try {
                    await UserService.uploadSignature(userId, signatureFile);
                    toast.success('Signature uploadée avec succès !');
                } catch (sigError) {
                    toast.error("Erreur lors de l'upload de la signature");
                    console.error(sigError);
                } finally {
                    setUploadingSignature(false);
                }
            }

            // Delete signature if preview was cleared on an existing user
            if (editUser && !signaturePreview && editUser.signatureUrl) {
                try {
                    await UserService.deleteSignature(editUser.id);
                } catch (err) {
                    console.error('Error deleting signature:', err);
                }
            }

            setIsModalOpen(false);
            fetchData();
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

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Gestion des Utilisateurs"
                subtitle="Contrôlez les accès et la sécurité de votre équipe industrielle"
                icon={<UsersIcon />}
                actions={
                    canCreate('users') && (
                        <button onClick={openCreateUser} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                            <Plus size={18} />
                            Ajouter Utilisateur
                        </button>
                    )
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
                ) : paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => (
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
                                    {user.signatureUrl && (
                                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <FileSignature size={12} /> Signature
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                                    {user.phone && <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>}
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                                            {ROLE_LABELS[user.role || (user.roles && user.roles[0]) || 'technician'] || user.role}
                                        </span>
                                        {user.roles && user.roles.filter(r => r !== (user.role || (user.roles && user.roles[0]))).map(r => (
                                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                                {ROLE_LABELS[r] || r}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={`flex items-center gap-1 font-medium ${user.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                                        <Shield size={14} /> {user.isActive ? 'Actif' : 'Suspendu'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {canEdit('users') && (
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
                                )}
                                {canResetPassword && (
                                    <button
                                        onClick={() => { setResetModal(user); setNewPassword(''); }}
                                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        <KeyRound size={15} />
                                    </button>
                                )}
                                {canEdit('users') && (
                                    <button
                                        onClick={() => openEditUser(user)}
                                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                )}
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

            {/* Pagination */}
            {!loading && filteredUsers.length > 0 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}

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
                                    {editUser ? <Pencil size={22} /> : <UserPlus size={22} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight" style={{color: 'white'}}>
                                        {editUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
                                    </h2>
                                    <p className="text-sm font-semibold mt-0.5" style={{color: 'rgba(255,255,255,0.6)'}}>
                                        {editUser ? 'Mise à jour du profil' : 'Créer un nouveau compte'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <form onSubmit={handleUserSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                                {/* Nom complet */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Nom Complet</label>
                                    <input
                                        type="text" required
                                        placeholder="Prénom et nom"
                                        className="input-field"
                                        value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    />
                                </div>

                                {/* 2 columns */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Nom d'utilisateur</label>
                                        <input type="text" required placeholder="Identifiant" className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Téléphone</label>
                                        <input type="tel" placeholder="+216 ..." className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Email Professionnel</label>
                                    <input type="email" required placeholder="nom@icem.tn" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>

                                {/* Rôle Principal */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Rôle Principal</label>
                                    <select
                                        className="input-field"
                                        value={form.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            setForm(prev => {
                                                const updatedRoles = (prev.roles || []).filter(r => r !== newRole);
                                                return {
                                                    ...prev,
                                                    role: newRole,
                                                    roles: [newRole, ...updatedRoles]
                                                };
                                            });
                                        }}
                                    >
                                        <option value="technician">Technicien</option>
                                        <option value="manager">Responsable Qualité</option>
                                        <option value="director">Directeur</option>
                                        <option value="admin">Administrateur</option>
                                    </select>
                                </div>

                                {/* Rôles Secondaires */}
                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em]">Rôles Secondaires</label>
                                    
                                    {/* Liste des rôles secondaires actuels */}
                                    {form.roles && form.roles.filter(r => r !== form.role).length > 0 ? (
                                        <div className="flex flex-wrap gap-2 py-1">
                                            {form.roles.filter(r => r !== form.role).map(roleKey => (
                                                <span
                                                    key={roleKey}
                                                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-red-200 hover:bg-red-50/10 transition-all group"
                                                >
                                                    <Shield size={12} className="text-slate-400 group-hover:text-red-400" />
                                                    {ROLE_LABELS[roleKey] || roleKey}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                roles: prev.roles.filter(r => r !== roleKey)
                                                            }));
                                                        }}
                                                        className="w-4 h-4 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-400 transition-all duration-200"
                                                    >
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Aucun rôle secondaire attribué.</p>
                                    )}

                                    {/* Menu déroulant pour ajouter un rôle secondaire */}
                                    {Object.keys(ROLE_LABELS).filter(roleKey => roleKey !== form.role && !(form.roles || []).includes(roleKey)).length > 0 ? (
                                        <div className="pt-1.5 border-t border-slate-100">
                                            <select
                                                className="input-field text-xs !py-2 bg-white"
                                                value=""
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val) {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            roles: [...new Set([...(prev.roles || []), val])]
                                                        }));
                                                    }
                                                }}
                                            >
                                                <option value="" disabled hidden>+ Attribuer un rôle secondaire...</option>
                                                {Object.keys(ROLE_LABELS)
                                                    .filter(roleKey => roleKey !== form.role && !(form.roles || []).includes(roleKey))
                                                    .map(roleKey => (
                                                        <option key={roleKey} value={roleKey}>
                                                            {ROLE_LABELS[roleKey]}
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-100">
                                            Tous les rôles ont été attribués
                                        </p>
                                    )}
                                </div>

                                {/* Signature */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                                        <FileSignature size={12} className="text-indigo-400" />
                                        Signature
                                    </label>
                                    {signaturePreview ? (
                                        <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 bg-indigo-50/40">
                                            <img src={signaturePreview} alt="Signature" className="max-h-20 object-contain rounded-xl mx-auto" />
                                            <div className="flex justify-center gap-2 mt-3">
                                                <button type="button" onClick={() => signatureInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors uppercase tracking-wider">
                                                    <Upload size={12} /> Remplacer
                                                </button>
                                                <button type="button" onClick={handleRemoveSignature} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors uppercase tracking-wider">
                                                    <Trash2 size={12} /> Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div onClick={() => signatureInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                                            <Upload size={26} className="mx-auto mb-2 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            <p className="text-sm font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">Cliquez pour ajouter une signature</p>
                                            <p className="text-xs text-slate-300 mt-1">PNG, JPG — Max 5 Mo</p>
                                        </div>
                                    )}
                                    <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleSignatureSelect} />
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
                                    disabled={uploadingSignature}
                                    className="flex-2 flex-1 py-3.5 px-6 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', boxShadow: '0 8px 20px -4px rgba(67,56,202,0.4)' }}
                                >
                                    {uploadingSignature ? (
                                        <><Loader2 size={16} className="animate-spin" /> Upload...</>
                                    ) : editUser ? 'Enregistrer les modifications' : 'Créer le compte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setResetModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div
                            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' }}
                            className="relative px-7 py-6 overflow-hidden flex-shrink-0"
                        >
                            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white opacity-5" />
                            <button onClick={() => setResetModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all z-10">
                                <X size={15} />
                            </button>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                                    <KeyRound size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white" style={{color:'white'}}>Réinitialiser le mot de passe</h2>
                                    <p className="text-sm font-semibold" style={{color:'rgba(255,255,255,0.6)'}}>{resetModal.fullName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-7 py-6 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Utilisateur</p>
                                    <p className="text-sm font-black text-blue-900">{resetModal.fullName}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Nouveau mot de passe</label>
                                <input type="text" className="input-field" placeholder="Saisir le nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-7 pb-6">
                            <button onClick={() => setResetModal(null)} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-black text-sm hover:bg-slate-50 transition-all active:scale-95">Annuler</button>
                            <button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6} className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50" style={{background:'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',boxShadow:'0 8px 20px -4px rgba(29,78,216,0.35)'}}>
                                {resetting ? <Loader2 size={16} className="animate-spin" /> : 'Réinitialiser'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
