import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';

const Layout = () => {
    const { user, roleLabel } = useAuth();

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Supervision Industrielle</h2>
                        <p className="text-2xl font-bold text-slate-800">Contrôle Qualité IA</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{user?.fullName || 'Utilisateur'}</p>
                            <p className="text-xs text-slate-500">{roleLabel} — ICEM Production</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=e2e8f0&color=475569&bold=true`}
                                alt={user?.fullName || 'User'}
                            />
                        </div>
                    </div>
                </header>
                <div className="animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
