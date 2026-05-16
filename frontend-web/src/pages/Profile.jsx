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
            {/* 🛸 High-Vibrancy Command Center */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-blue-500/20 blur-[120px] rounded-[60px] -z-10 animate-pulse"></div>
                
                <div className="bg-white/90 backdrop-blur-3xl rounded-[60px] border border-white shadow-2xl shadow-indigo-900/10 overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        
                        {/* Left Section: Visual Identity (Vibrant Gradient) */}
                        <div className="lg:w-[450px] p-12 bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 text-white relative overflow-hidden flex flex-col items-center justify-center text-center">
                            {/* Animated Background Orbs */}
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 blur-3xl rounded-full animate-bounce duration-[10s]"></div>
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/20 blur-3xl rounded-full"></div>
                            
                            <div className="relative mb-10">
                                <div className="w-56 h-56 rounded-[56px] border-4 border-white/30 p-2 relative shadow-2xl">
                                    <div className="absolute inset-0 border-2 border-white/40 rounded-[56px] animate-ping opacity-20"></div>
                                    <div className="w-full h-full rounded-[48px] overflow-hidden bg-white/10 backdrop-blur-md relative">
                                        {uploading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/60 z-20">
                                                <Loader2 size={40} className="text-white animate-spin" />
                                            </div>
                                        ) : null}
                                        <img 
                                            src={user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=ffffff&color=4f46e5&bold=true&size=256`}
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={uploading}
                                    className="absolute -bottom-4 -right-4 w-16 h-16 bg-white text-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-indigo-600 hover:scale-110 transition-all z-10 active:scale-95"
                                >
                                    <Camera size={24} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            </div>

                            {/* LEGIBILITY FIX: Ultra-Clear High Contrast Text */}
                            <div className="space-y-4 mb-8">
                                <h2 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                                    {user?.fullName || 'Utilisateur ICEM'}
                                </h2>
                                <div className="inline-flex px-6 py-2 bg-white text-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/20">
                                    <p className="font-black text-[11px] uppercase tracking-[0.3em]">
                                        {roleLabel || 'Collaborateur'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <span className="px-4 py-2 bg-white/10 rounded-2xl border border-white/20 text-[10px] font-black uppercase tracking-widest text-white">
                                    ID: {user?.id?.substring(0, 8).toUpperCase()}
                                </span>
                                <span className="px-4 py-2 bg-emerald-400 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    Vérifié
                                </span>
                            </div>
                        </div>

                        {/* Right Section: Smart Fields */}
                        <div className="flex-1 p-12 lg:p-20">
                            <div className="mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">Profil Utilisateur</h3>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
                                            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2">
                                                {loading && <Loader2 size={12} className="animate-spin" />} Enregistrer
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-200 border border-indigo-100">
                                            Éditer mon profil
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <User size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Nom Complet</span>
                                        </div>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={formData.fullName} 
                                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl focus:border-indigo-500 outline-none font-black text-slate-800"
                                            />
                                        ) : (
                                            <p className="text-2xl font-black text-slate-900">{user?.fullName || '—'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                                            <Phone size={14} className="text-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Ligne Directe</span>
                                        </div>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={formData.phone} 
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                className="w-full p-4 bg-slate-50 border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none font-black text-slate-800"
                                            />
                                        ) : (
                                            <p className="text-2xl font-black text-slate-900">{user?.phone || 'Non renseigné'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Mail size={14} className="text-purple-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{user?.email || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Calendar size={14} className="text-amber-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Membre Depuis</span>
                                        </div>
                                        <p className="text-2xl font-black text-slate-900">{joinDate}</p>
                                    </div>
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{perm.desc}</p>
                            
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</span>
                                {((perm.check ?? hasPageAccess(perm.access))) ? (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Autorisé
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">Restreint</span>
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
