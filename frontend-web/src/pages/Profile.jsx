import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Calendar, Phone, Activity, CheckCircle, AlertCircle, Eye, Package, Settings, QrCode, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, roleLabel, hasPageAccess, canCreate } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || ''
    });
    const fileInputRef = useRef(null);
    
    const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Inconnue';

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024) {
            toast.error("L'image est trop volumineuse (max 500 KB).");
            return;
        }

        try {
            setUploading(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64String = reader.result;
                try {
                    await UserService.update(user.id, { photoUrl: base64String });
                    const updatedUser = { ...user, photoUrl: base64String };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    toast.success("Photo de profil mise à jour !");
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    toast.error("Erreur lors de l'enregistrement.");
                } finally {
                    setUploading(false);
                }
            };
        } catch (error) {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await UserService.update(user.id, formData);
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            toast.success("Profil mis à jour !");
            setIsEditing(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in duration-700 space-y-12 pb-20">
            {/* 🛸 High-Vibrancy Command Center Light Theme */}
            <div className="bg-white/70 backdrop-blur-3xl rounded-[40px] border border-white shadow-[0_15px_40px_-15px_rgba(30,27,75,0.1)] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-indigo-50/30 to-purple-50/20 pointer-events-none"></div>
                
                <div className="flex flex-col lg:flex-row relative z-10">
                    
                    {/* Left Section: User Identity (Vibrant Light Glass) */}
                    <div className="lg:w-[400px] p-12 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-indigo-100/50 relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white/40 to-indigo-50/80">
                        {/* Soft colorful background orbs */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/20 blur-[80px] rounded-full -z-10 animate-pulse"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-400/20 blur-[80px] rounded-full -z-10" style={{ animationDelay: '2s' }}></div>
                        
                        <div className="relative mb-8 group">
                            <div className="w-48 h-48 rounded-[2.5rem] p-2 bg-white/60 backdrop-blur-sm shadow-xl shadow-blue-900/10 border-2 border-white relative z-10 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                                <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 relative">
                                    {uploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                                            <Loader2 size={32} className="text-blue-600 animate-spin" />
                                        </div>
                                    ) : null}
                                    <img 
                                        src={user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=e0e7ff&color=4338ca&bold=true&size=256`}
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploading}
                                className="absolute -bottom-2 -right-2 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] border-4 border-white hover:scale-110 transition-all z-20 active:scale-95 group-hover:-rotate-12"
                            >
                                <Camera size={22} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        </div>

                        <div className="space-y-3 mb-8 w-full relative z-10">
                            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text text-transparent drop-shadow-sm">
                                {user?.fullName || roleLabel || 'Profil Utilisateur'}
                            </h2>
                            <div className="inline-flex px-6 py-2 bg-white/80 backdrop-blur-md border border-blue-100/50 shadow-lg shadow-blue-900/5 rounded-2xl">
                                <p className="font-black text-sm uppercase tracking-[0.25em] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {roleLabel || 'Collaborateur'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center w-full relative z-10">
                            <span className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white text-sm font-black uppercase tracking-widest text-indigo-900/60 shadow-sm">
                                ID: {user?.id?.substring(0, 8).toUpperCase()}
                            </span>
                            <span className="px-4 py-2 bg-emerald-50/80 backdrop-blur-sm text-emerald-600 rounded-xl border border-emerald-100/50 font-black text-sm uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <CheckCircle size={14} /> Vérifié
                            </span>
                        </div>
                    </div>

                    {/* Right Section: Smart Fields */}
                    <div className="flex-1 p-12 lg:p-16 flex flex-col justify-center bg-white/30 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-indigo-100/50">
                            <h3 className="text-sm font-black text-indigo-800/40 uppercase tracking-widest">Informations du Profil</h3>
                            {isEditing ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 border border-slate-200 shadow-sm transition-all">Annuler</button>
                                    <button onClick={handleSave} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 border border-indigo-500/50">
                                        {loading && <Loader2 size={14} className="animate-spin" />} Enregistrer
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white text-blue-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-50 border border-blue-100 shadow-md shadow-blue-900/5 transition-all flex items-center gap-2">
                                    <Settings size={16} /> Éditer
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                    <User size={16} />
                                    <span className="text-sm font-black uppercase tracking-widest opacity-90">Nom Complet</span>
                                </div>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={formData.fullName} 
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                        className="w-full p-5 bg-white border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-indigo-950 transition-all shadow-sm text-2xl"
                                    />
                                ) : (
                                    <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-white shadow-[0_4px_20px_-5px_rgba(30,27,75,0.05)]">
                                        <p className="text-2xl font-black bg-gradient-to-r from-indigo-950 to-blue-900 bg-clip-text text-transparent">{user?.fullName || '—'}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-500 mb-2">
                                    <Phone size={16} />
                                    <span className="text-sm font-black uppercase tracking-widest opacity-90">Ligne Directe</span>
                                </div>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-5 bg-white border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-indigo-950 transition-all shadow-sm text-2xl"
                                    />
                                ) : (
                                    <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-white shadow-[0_4px_20px_-5px_rgba(30,27,75,0.05)]">
                                        <p className="text-2xl font-black bg-gradient-to-r from-indigo-950 to-blue-900 bg-clip-text text-transparent tracking-tight">{user?.phone || 'Non renseigné'}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-purple-500 mb-2">
                                    <Mail size={16} />
                                    <span className="text-sm font-black uppercase tracking-widest opacity-90">Email Professionnel</span>
                                </div>
                                <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-white shadow-[0_4px_20px_-5px_rgba(30,27,75,0.05)]">
                                    <p className="text-2xl font-black bg-gradient-to-r from-indigo-950 to-blue-900 bg-clip-text text-transparent">{user?.email || '—'}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-teal-500 mb-2">
                                    <Calendar size={16} />
                                    <span className="text-sm font-black uppercase tracking-widest opacity-90">Membre Depuis</span>
                                </div>
                                <div className="bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-white shadow-[0_4px_20px_-5px_rgba(30,27,75,0.05)]">
                                    <p className="text-2xl font-black bg-gradient-to-r from-indigo-950 to-blue-900 bg-clip-text text-transparent">{joinDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🌈 Matrix - Infused with Colors */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-6">
                    <div className="w-3 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full shadow-lg"></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Droits d'Accès</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'Ordres', desc: 'Production', icon: Eye, access: 'orders', color: 'from-blue-400 to-blue-600' },
                        { title: 'Fabrication', desc: 'Création OF', icon: Package, access: 'orders_create', check: canCreate('orders'), color: 'from-purple-400 to-purple-600' },
                        { title: 'Anomalies', desc: 'Qualité IA', icon: AlertCircle, access: 'anomalies', color: 'from-rose-400 to-rose-600' },
                        { title: 'Utilisateurs', desc: 'Administration', icon: User, access: 'users', color: 'from-emerald-400 to-emerald-600' }
                    ].map((perm, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[40px] border-2 border-transparent hover:border-slate-100 shadow-xl shadow-indigo-900/5 transition-all group overflow-hidden relative">
                            {/* Hover Color Gradient */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${perm.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`}></div>
                            
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all shadow-lg 
                                ${((perm.check ?? hasPageAccess(perm.access))) ? `bg-gradient-to-br ${perm.color} text-white` : 'bg-slate-100 text-slate-300'}`}>
                                <perm.icon size={28} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-1">{perm.title}</h4>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{perm.desc}</p>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-sm font-black uppercase tracking-widest text-slate-400">Status</span>
                                {((perm.check ?? hasPageAccess(perm.access))) ? (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Autorisé
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-sm font-black uppercase tracking-widest border border-slate-100">Restreint</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
