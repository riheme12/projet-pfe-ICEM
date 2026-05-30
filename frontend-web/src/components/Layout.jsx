import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, Calendar, Clock, Globe, ShieldCheck } from 'lucide-react';
import { AnomalyService } from '../services/api';
import buildingImg from '../assets/building.png';

const PAGE_TITLES = {
    '/': 'Tableau de Bord',
    '/orders': 'Suivi de Production',
    '/anomalies': 'Contrôle Qualité',
    '/alerts': 'Centre d\'Alertes',
    '/reports': 'Rapports',
    '/users': 'Gestion d\'Équipe',
    '/profile': 'Profil Utilisateur',
};

const Layout = () => {
    const { user, roleLabel } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeAlertsCount, setActiveAlertsCount] = useState(0);
    const pageTitle = PAGE_TITLES[location.pathname] || 'ICEM Quality';

    useEffect(() => {
        let mounted = true;
        const loadAlertCount = async () => {
            try {
                const response = await AnomalyService.getUnreadCount();
                if (!mounted) return;
                setActiveAlertsCount(response.data.count || 0);
            } catch (_) {
                if (mounted) setActiveAlertsCount(0);
            }
        };
        loadAlertCount();
        return () => { mounted = false; };
    }, []);

    const userPhotoUrl = user?.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=1e1b4b&color=ffffff&bold=true&size=120`;

    const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="flex min-h-screen bg-[#f8fafc] font-['Plus Jakarta Sans']">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#f1f5f9]">
                {/* 🎨 NEW: More colorful background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full -z-10 -translate-x-1/3 translate-y-1/3"></div>
                <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] -z-10"></div>

                {/* 🎨 Massive Creative Premium Header */}
                <header className="sticky top-0 z-40 px-12 py-6 flex items-center justify-between transition-all duration-300 border-b border-blue-100/50 shadow-[0_15px_40px_-15px_rgba(30,27,75,0.15)] relative overflow-hidden">
                    {/* Background Image behind glass */}
                    <div 
                        className="absolute inset-0 z-0 opacity-100" 
                        style={{ 
                            backgroundImage: `url(${buildingImg})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'top center',
                        }}
                    />
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/95 via-white/80 to-blue-50/90 backdrop-blur-md"></div>
                    
                    {/* 🎨 Subtle Blue Fade over background */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-600/40 via-blue-600/10 to-transparent mix-blend-multiply"></div>

                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 opacity-90 shadow-[0_0_15px_rgba(37,99,235,0.4)] z-10"></div>
                    
                    {/* Left: Branding & Welcome — INDUSTRIAL CONTROL */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-1.5 h-12 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-blue-500 uppercase tracking-[0.4em] mb-1.5 drop-shadow-sm">Supervision Industrielle</span>
                            <h2 className="text-3xl font-black tracking-normal flex items-center gap-3">
                                <span className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] bg-clip-text text-transparent">ICEM</span>
                                <span className="text-slate-300 font-light tracking-widest">|</span>
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Contrôle Qualité</span>
                            </h2>
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-5 relative z-10">
                        {/* Time Widget — Improved Readability */}
                        <div className="hidden lg:flex flex-col items-end mr-6 pr-8 border-r border-slate-200/60 text-indigo-900">
                            <span className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Date Actuelle</span>
                            <span className="text-sm font-black text-slate-800">{currentDate}</span>
                        </div>

                        {/* Notifications */}
                        <button 
                            onClick={() => navigate('/alerts')}
                            className="relative w-14 h-14 rounded-2xl bg-white border border-slate-200/60 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 flex items-center justify-center text-slate-600 transition-all duration-300 shadow-sm group active:scale-90"
                        >
                            <Bell size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                            {activeAlertsCount > 0 && (
                                <span className="absolute top-3.5 right-3.5 w-4.5 h-4.5 bg-red-500 border-[3px] border-white rounded-full shadow-lg shadow-red-500/40 animate-bounce"></span>
                            )}
                        </button>

                        {/* Profile Command Center */}
                        <Link to="/profile" className="flex items-center gap-5 p-2 pr-6 rounded-full bg-gradient-to-r from-white to-slate-50/50 border border-white shadow-xl shadow-indigo-900/5 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-0.5 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/30 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <img
                                    src={userPhotoUrl}
                                    alt="User"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg relative z-10 transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg z-20"></div>
                            </div>
                            <div className="flex flex-col relative z-10">
                                <p className="text-base font-black text-[#1e1b4b] tracking-tight group-hover:text-blue-600 transition-colors leading-tight">{user?.fullName || 'Utilisateur'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <ShieldCheck size={12} className="text-blue-500" />
                                    <p className="text-sm font-black text-blue-600 uppercase tracking-widest leading-none">{roleLabel || 'Utilisateur'}</p>
                                </div>
                            </div>
                            <ChevronDown size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-y-0.5 transition-all ml-2 relative z-10" />
                        </Link>
                    </div>
                </header>

                {/* 🚀 Page Content Section */}
                <div className="flex-1 p-12 overflow-auto relative custom-scrollbar">


                    <div className="relative z-10" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
