import React from 'react';
import { User, Mail, Shield, Calendar, Award, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminProfile = () => {
    const { user, roleLabel } = useAuth();

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Profil Administrateur</h1>
                    <p className="text-slate-500 mt-1">Gérez vos informations personnelles et consultez vos statistiques</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border-4 border-blue-50">
                            {user?.fullName ? (
                                <span className="text-3xl font-bold">{user.fullName.charAt(0)}</span>
                            ) : (
                                <User size={40} />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{user?.fullName || 'Administrateur'}</h2>
                        <span className="mt-2 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-100">
                            {roleLabel}
                        </span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-blue-600" />
                            Informations du Compte
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Mail size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Email Professionnel</p>
                                        <p className="text-slate-700 font-semibold">{user?.email || 'non renseigné'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Award size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Niveau d'Accès</p>
                                        <p className="text-slate-700 font-semibold">Accès Complet (Super-Admin)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Calendar size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Dernière Connexion</p>
                                        <p className="text-slate-700 font-semibold">{new Date().toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-emerald-600" />
                            Activité Système
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-600 uppercase">Total Actions</p>
                                <p className="text-2xl font-black text-emerald-700">142</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-600 uppercase">Rapports Validés</p>
                                <p className="text-2xl font-black text-blue-700">28</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
