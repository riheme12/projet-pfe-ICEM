import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Calendar, Phone, Activity, CheckCircle, AlertCircle, Eye, Package, Settings, QrCode, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, roleLabel, hasPageAccess, canCreate } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    // Format date d'inscription
    const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Inconnue';

    const stats = user?.stats || { inspectionsCount: 0, anomaliesDetected: 0, conformityRate: 0, cablesProcessed: 0 };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limite à 500 KB pour le Base64 (car Firestore a une limite stricte de 1 MB par document)
        if (file.size > 500 * 1024) {
            toast.error("L'image est trop volumineuse (max 500 KB).");
            return;
        }

        try {
            setUploading(true);
            
            // Convertir l'image en Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onloadend = async () => {
                const base64String = reader.result;
                
                try {
                    // Mettre à jour l'utilisateur en base de données avec la chaîne Base64
                    await UserService.update(user.id, { photoUrl: base64String });
                    
                    // Mettre à jour le localStorage (pour la session actuelle)
                    const updatedUser = { ...user, photoUrl: base64String };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    
                    toast.success("Photo de profil mise à jour avec succès !");
                    
                    // Recharger la page pour propager le changement dans le contexte React
                    setTimeout(() => window.location.reload(), 1500);
                } catch (updateError) {
                    console.error("Erreur de mise à jour :", updateError);
                    toast.error("Erreur lors de l'enregistrement de la photo.");
                } finally {
                    setUploading(false);
                }
            };
            
            reader.onerror = () => {
                toast.error("Erreur lors de la lecture de l'image.");
                setUploading(false);
            };
            
        } catch (error) {
            console.error("Erreur générale :", error);
            toast.error("Erreur inattendue.");
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-10">
            {/* Top Profile Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                
                {/* Avatar */}
                <div className="relative group">
                    <div className="w-40 h-40 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl transition-transform"
                         style={{ border: '8px solid #f3f4f8' }}>
                        {uploading ? (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                <Loader2 size={32} className="text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <img 
                                src={user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=2563eb&color=ffffff&bold=true&size=200`}
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    {/* Bouton d'édition photo */}
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 text-blue-600 hover:bg-blue-50 transition-colors z-10"
                        title="Modifier la photo"
                    >
                        <Camera size={18} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePhotoUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col pt-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{user?.fullName || 'Utilisateur ICEM'}</h2>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-6">{roleLabel || 'Collaborateur'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Mail size={16} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email</p>
                                <span className="text-slate-700">{user?.email || 'Non renseigné'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Phone size={16} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Téléphone</p>
                                <span className="text-slate-700">{user?.phone || 'Non renseigné'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={16} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Inscrit le</p>
                                <span className="text-slate-700">{joinDate}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Shield size={16} /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Statut du compte</p>
                                <span className="text-emerald-600 font-bold">{user?.isActive ? 'Actif' : 'Désactivé'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Statistics */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <Activity className="text-blue-500" /> Mon Impact Global
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><CheckCircle size={24} /></div>
                            <p className="text-3xl font-black text-slate-800 mb-1">{stats.inspectionsCount || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspections réalisées</p>
                        </div>
                        <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100/50 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4"><AlertCircle size={24} /></div>
                            <p className="text-3xl font-black text-slate-800 mb-1">{stats.anomaliesDetected || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Anomalies signalées</p>
                        </div>
                        <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><Activity size={24} /></div>
                            <p className="text-3xl font-black text-slate-800 mb-1">{stats.conformityRate || 0}%</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Taux de conformité</p>
                        </div>
                        <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100/50 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4"><QrCode size={24} /></div>
                            <p className="text-3xl font-black text-slate-800 mb-1">{stats.cablesProcessed || 0}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Câbles traités</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Permissions Card (Thème Clair) */}
                <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[32px] p-8 flex flex-col shadow-sm">
                    <h3 className="text-xl font-bold mb-6 leading-tight flex items-center gap-2 text-slate-800">
                        <Shield className="text-blue-500" /> Mes Permissions
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Vos accès sont définis par votre rôle <strong className="text-slate-700">{roleLabel}</strong>. Voici ce que vous pouvez faire :</p>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600"><Eye size={16} className="text-slate-400"/> Voir les ordres</span>
                            {hasPageAccess('orders') ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600"><Package size={16} className="text-slate-400"/> Créer des ordres</span>
                            {canCreate('orders') ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600"><AlertCircle size={16} className="text-slate-400"/> Gérer les anomalies</span>
                            {hasPageAccess('anomalies') ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600"><User size={16} className="text-slate-400"/> Gérer les utilisateurs</span>
                            {hasPageAccess('users') ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                        </li>
                    </ul>

                    <div className="mt-auto bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
                        <Shield size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            En cas de problème d'accès, veuillez contacter votre administrateur système.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
