import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';

const PAGE_TITLES = {
    '/': 'Tableau de bord',
    '/orders': 'Ordres de Fabrication',
    '/cables': 'Câbles',
    '/anomalies': 'Anomalies',
    '/alerts': 'Alertes',
    '/reports': 'Rapports',
    '/trends': 'Tendances',
    '/users': 'Utilisateurs',
    '/profile': 'Mon Profil',
};

const Layout = () => {
    const { user, roleLabel } = useAuth();
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] || 'ICEM Quality';

    const userPhotoUrl = user?.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=6366f1&color=ffffff&bold=true&size=80`;

    return (
        <div className="flex min-h-screen" style={{ background: '#f3f4f8' }}>
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-6"
                    style={{ boxShadow: '0 1px 6px rgba(99,102,241,0.04)' }}>

                    {/* Search Bar */}
                    <div className="search-input flex-1 max-w-lg p-2.5 px-4 text-base">
                        <Search size={18} className="flex-shrink-0 text-slate-900 mr-2" />
                        <input placeholder="Rechercher..." className="w-full bg-transparent outline-none text-slate-900 placeholder:text-slate-500" />
                    </div>

                    <div className="flex-1"></div>

                    {/* Notifications */}
                    <button className="relative w-12 h-12 rounded-xl bg-gray-50 hover:bg-blue-50 flex items-center justify-center text-slate-900 hover:text-blue-600 transition-colors border border-gray-100">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-100"></div>

                    {/* User */}
                    <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={userPhotoUrl}
                            alt={user?.fullName || 'User'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                        />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-bold text-black leading-tight">{user?.fullName || 'Utilisateur'}</p>
                            <p className="text-xs font-semibold text-slate-900">{roleLabel}</p>
                        </div>
                        <ChevronDown size={16} className="text-slate-900 hidden sm:block ml-1" />
                    </Link>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-8 overflow-auto">
                    {/* Page breadcrumb header */}
                    <div className="mb-8">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1.5">ICEM Industrial Solutions</p>
                        <h1 className="text-3xl font-black text-black">{pageTitle}</h1>
                    </div>
                    <div style={{ animation: 'fadeUp 0.3s ease-out both' }}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
