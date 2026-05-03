import React from 'react';
import { User, Mail, Shield, Calendar, Clock, MapPin, Phone, Building } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
    const { user, roleLabel } = useAuth();
    
    const stats = [
        { label: 'Dernière connexion', value: new Date().toLocaleDateString(), icon: <Clock size={16} /> },
        { label: 'Rôle Système', value: roleLabel, icon: <Shield size={16} /> },
        { label: 'Localisation', value: 'Usine ICEM — Sfax', icon: <MapPin size={16} /> },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mon Profil</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez vos informations personnelles et vos préférences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="card lg:col-span-1 flex flex-col items-center text-center p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                    
                    <div className="relative mt-8">
                        <div className="w-32 h-32 rounded-[40px] bg-white p-1.5 shadow-2xl relative z-10">
                            <div className="w-full h-full rounded-[35px] bg-slate-100 flex items-center justify-center text-blue-600 overflow-hidden border-4 border-slate-50">
                                <User size={64} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg z-20">
                            <Shield size={16} />
                        </div>
                    </div>

                    <div className="mt-8 relative z-10 w-full">
                        <h2 className="text-2xl font-black text-slate-800 mb-1">{user?.fullName || 'Administrateur'}</h2>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 italic">
                            {roleLabel}
                        </span>
                        
                        <div className="mt-10 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contact</p>
                                    <p className="text-sm font-bold text-slate-700">{user?.email || 'admin@icem.tn'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <Building size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Département</p>
                                    <p className="text-sm font-bold text-slate-700">Contrôle Qualité IA</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Details & Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             Détails du compte
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="text-blue-500 group-hover:scale-110 transition-transform">
                                            {stat.icon}
                                        </div>
                                        <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-700 ml-7">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             Sécurité & Accès
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Accès Privilégié</p>
                                        <p className="text-xs text-slate-500">Votre compte dispose des droits d'administration complets.</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-white text-amber-600 text-[0.6rem] font-black uppercase tracking-widest rounded-lg border border-amber-200">Actif</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button className="btn-secondary h-12 text-sm justify-center">Changer le mot de passe</button>
                                <button className="btn-secondary h-12 text-sm justify-center border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600">Désactiver le compte</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
