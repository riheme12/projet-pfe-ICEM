import React from 'react';
import { User, Mail, Shield, Calendar, MapPin, Phone, Edit, Instagram, Facebook, Twitter, Linkedin, Send, CreditCard, CheckCircle, ArrowDown, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
    const { user, roleLabel } = useAuth();
    
    return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-10">
            {/* Top Profile Card */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                <button className="absolute top-6 right-6 text-slate-400 hover:text-blue-500 transition-colors">
                    <Edit size={20} />
                </button>
                
                {/* Avatar */}
                <div className="w-40 h-40 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl"
                     style={{ border: '8px solid #f3f4f8' }}>
                    <img 
                        src={user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=2563eb&color=ffffff&bold=true&size=200`}
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
                
                {/* Info */}
                <div className="flex-1 flex flex-col pt-2">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{user?.fullName || 'Utilisateur ICEM'}</h2>
                    
                    <div className="grid grid-cols-1 gap-2.5 text-sm text-slate-500 font-medium mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-36">Date d'inscription:</span>
                            <span className="text-slate-700">24 Novembre 2022</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-36">Ville, Pays:</span>
                            <span className="text-slate-700">Sfax, Tunisie</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-36">Rôle:</span>
                            <span className="text-slate-700">{roleLabel || 'Technicien'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-36">E-mail:</span>
                            <span className="text-slate-700">{user?.email || 'user@icem.tn'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 w-36">Téléphone:</span>
                            <span className="text-slate-700">+216 25 123 456</span>
                        </div>
                    </div>
                    
                    {/* Socials */}
                    <div className="flex gap-3">
                        <a href="#" className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"><Instagram size={14} /></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"><Facebook size={14} /></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"><Twitter size={14} /></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"><Linkedin size={14} /></a>
                        <a href="#" className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors"><Send size={14} /></a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Activities / Timeline */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-8">Mes Activités Récentes</h3>
                    
                    <div className="relative pl-4 space-y-6">
                        {/* Timeline Line */}
                        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-blue-100"></div>
                        
                        {/* Item 1 */}
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">Inspection Câble — Validée</h4>
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">Terminé</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Vérification électrique, tolérance, intégrité...</p>
                                <p className="text-xs text-slate-400 font-medium">12 éléments inspectés</p>
                                <button className="absolute right-5 bottom-5 w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"><ArrowDown size={16} /></button>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                            <div className="bg-fuchsia-50/50 rounded-2xl p-5 border border-fuchsia-100/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">Anomalie — Résolue</h4>
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">Terminé</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Défaut mineur d'isolation réparé sur ligne A.</p>
                                <p className="text-xs text-slate-400 font-medium">1 rapport généré</p>
                                <button className="absolute right-5 bottom-5 w-8 h-8 bg-fuchsia-100 text-fuchsia-500 rounded-full flex items-center justify-center hover:bg-fuchsia-200 transition-colors"><ArrowDown size={16} /></button>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-3 w-4 h-4 rounded-full border-2 border-blue-300 bg-white"></div>
                            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100/50 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">Formation — Sécurité IA</h4>
                                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Début: 13.06.2026</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Nouveaux modèles de détection par ordinateur...</p>
                                <p className="text-xs text-slate-400 font-medium">2 modules restants</p>
                                <button className="absolute right-5 bottom-5 w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-200 transition-colors"><ArrowDown size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - System Cards */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    {/* Bank / System info Card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Données Système</h3>
                        <p className="text-sm text-slate-500 mb-2">Identifiant Badge:</p>
                        <div className="bg-slate-100/50 rounded-xl px-4 py-3 font-mono text-slate-600 text-sm mb-6 flex justify-between tracking-widest">
                            <span>236</span><span>***</span><span>***</span><span>265</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 border border-slate-200 rounded-xl flex items-center justify-center bg-white font-bold text-xs text-slate-600 shadow-sm">NFC Ready</div>
                            <div className="h-10 border border-slate-200 rounded-xl flex items-center justify-center bg-white font-bold text-xs text-slate-600 shadow-sm">RFID Active</div>
                            <div className="h-10 border border-slate-200 rounded-xl flex items-center justify-center bg-white font-bold text-xs text-slate-600 shadow-sm">Zone A</div>
                            <div className="h-10 border border-slate-200 rounded-xl flex items-center justify-center bg-white font-bold text-xs text-slate-600 shadow-sm">Zone B</div>
                        </div>
                    </div>

                    {/* Premium / Sub Card */}
                    <div className="bg-blue-600 rounded-[32px] p-8 text-white flex-1 flex flex-col shadow-lg shadow-blue-600/20">
                        <h3 className="text-xl font-bold mb-6 leading-tight">Accès Individuel<br/>ICEM Premium</h3>
                        
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3 text-sm text-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                                <span>1 mois Premium gratuit pour accès illimité.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                                <span>2 mois pour les nouveaux techniciens.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                                <span>Annulation possible à tout moment.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                                <span>Meilleures alertes en temps réel.</span>
                            </li>
                        </ul>
                        
                        <button className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-2xl hover:bg-blue-50 transition-colors shadow-sm">
                            S'abonner
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
