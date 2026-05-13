import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, Calendar, Clock, Globe, ShieldCheck } from 'lucide-react';
import { AnomalyService } from '../services/api';

const PAGE_TITLES = {
    '/': 'Tableau de Bord',
    '/orders': 'Suivi de Production',
    '/anomalies': 'Contrôle Qualité',
    '/alerts': 'Centre d\'Alertes',
    '/reports': 'Rapports Analytiques',
    '/trends': 'Tendances & Data',
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
        <div className="flex min-h-screen bg-[#f8fafc] font-['Inter']">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                {/* 🎨 Massive Creative Premium Header (Solid White for Performance) */}
                <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-12 py-8 flex items-center justify-between shadow-sm">
                    
                    {/* Welcome Section - Massive Typography */}
                    <div className="flex flex-col">
                        <h2 className="text-4xl font-black text-[#1e1b4b] tracking-tighter leading-tight">
                            {user?.fullName || 'Utilisateur'}
                        </h2>
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                                <span>Espace de Supervision</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                <Calendar size={12} className="text-slate-300" />
                                <span>{currentDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notifications - Fixed Link */}
                        <button 
                            onClick={() => navigate('/alerts')}
                            className="relative w-16 h-16 rounded-[24px] bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center text-slate-600 transition-all duration-300 shadow-sm group"
                        >
                            <Bell size={28} className="group-hover:rotate-12 transition-transform" />
                            {activeAlertsCount > 0 && (
                                <span className="absolute top-4 right-4 w-4 h-4 bg-red-500 border-4 border-white rounded-full"></span>
                            )}
                        </button>

                        <div className="w-px h-12 bg-slate-200 mx-2"></div>

                        {/* User Profile - Enlarged & Premium */}
                        <Link to="/profile" className="flex items-center gap-5 pl-2 pr-6 py-2 rounded-[30px] hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100 shadow-sm bg-white">
                            <div className="relative">
                                <img
                                    src={userPhotoUrl}
                                    alt="User"
                                    className="w-14 h-14 rounded-[22px] object-cover ring-4 ring-slate-50 shadow-lg group-hover:ring-blue-100 transition-all"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 border-4 border-white rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div className="hidden xl:block">
                                <p className="text-lg font-black text-[#1e1b4b] leading-none mb-1.5 truncate max-w-[150px]">{user?.fullName || 'Utilisateur'}</p>
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none">{roleLabel}</p>
                            </div>
                            <ChevronDown size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </Link>
                    </div>
                </header>

                {/* 🚀 Page Content Section */}
                <div className="flex-1 p-12 overflow-auto relative">
                    <div className="mb-16 animate-[fadeUp_0.4s_ease-out]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-[2px] w-12 bg-blue-600"></div>
                            <span className="text-xs font-black text-blue-600 uppercase tracking-[0.6em]">Système ICEM</span>
                        </div>
                        <h1 className="text-6xl font-black text-[#1e1b4b] tracking-tighter leading-none">{pageTitle}</h1>
                    </div>

                    <div className="relative z-10" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                        <Outlet />
                    </div>
                    
                    {/* Background decoration */}
                    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-[150px] -z-10 pointer-events-none translate-x-1/3 translate-y-1/3"></div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
