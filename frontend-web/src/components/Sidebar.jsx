import { LayoutDashboard, ClipboardList, AlertCircle, Users, FileBarChart, Settings, LogOut, Bell, Cable } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
    const navigate = useNavigate();
    const { hasPageAccess, roleLabel, user } = useAuth();

    const allMenuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '/', page: 'dashboard' },
        { icon: <ClipboardList size={20} />, label: 'Ordres de Fabrication', path: '/orders', page: 'orders' },
        { icon: <Cable size={20} />, label: 'Câbles', path: '/cables', page: 'cables' },
        { icon: <AlertCircle size={20} />, label: 'Anomalies', path: '/anomalies', page: 'anomalies' },
        { icon: <Bell size={20} />, label: 'Alertes', path: '/alerts', page: 'alerts' },
        { icon: <FileBarChart size={20} />, label: 'Rapports', path: '/reports', page: 'reports' },
        { icon: <Users size={20} />, label: 'Utilisateurs', path: '/users', page: 'users' },
    ];

    // Filtrer les menus selon le rôle de l'utilisateur
    const menuItems = allMenuItems.filter(item => hasPageAccess(item.page));

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    return (
        <aside className="w-64 bg-primary h-screen sticky top-0 text-white p-5 hidden md:flex flex-col gap-6 shadow-xl">
            <div className="flex items-center gap-3 px-2 py-4">
                <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center font-bold text-sm">IC</div>
                <h1 className="text-lg font-bold tracking-tight">ICEM Quality</h1>
            </div>

            <nav className="flex flex-col gap-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-slate-700/50">
                {/* Infos utilisateur connecté */}
                <div className="px-3 py-3 mb-2">
                    <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Utilisateur'}</p>
                    <p className="text-xs text-slate-400">{roleLabel}</p>
                </div>

                {hasPageAccess('settings') && (
                    <NavLink to="/settings" className="sidebar-item">
                        <Settings size={20} />
                        <span>Paramètres</span>
                    </NavLink>
                )}
                <button
                    onClick={handleLogout}
                    className="sidebar-item w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
