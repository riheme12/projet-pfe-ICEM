import { LayoutDashboard, ClipboardList, AlertCircle, Users, FileBarChart, LogOut, Bell, Cable, User, TrendingUp, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { AnomalyService } from '../services/api';
import logo from '../assets/logo.png';
import buildingImg from '../assets/building.png';

const Sidebar = () => {
    const navigate = useNavigate();
    const { hasPageAccess, roleLabel, user } = useAuth();
    const [activeAlertsCount, setActiveAlertsCount] = useState(0);

    const allMenuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', path: '/', page: 'dashboard' },
        { icon: <ClipboardList size={18} />, label: 'Ordres Fabrication', path: '/orders', page: 'orders' },
        { icon: <Cable size={18} />, label: 'Câbles', path: '/cables', page: 'cables' },
        { icon: <AlertCircle size={18} />, label: 'Anomalies', path: '/anomalies', page: 'anomalies' },
        { icon: <Bell size={18} />, label: 'Alertes', path: '/alerts', page: 'alerts' },
        { icon: <FileBarChart size={18} />, label: 'Rapports', path: '/reports', page: 'reports' },
        { icon: <TrendingUp size={18} />, label: 'Tendances', path: '/trends', page: 'trends' },
        { icon: <Users size={18} />, label: 'Utilisateurs', path: '/users', page: 'users' },
    ];

    const menuItems = allMenuItems.filter(item => hasPageAccess(item.page));

    useEffect(() => {
        let mounted = true;
        const loadAlertCount = async () => {
            try {
                const response = await AnomalyService.getAll();
                if (!mounted) return;
                const anomalies = response.data || [];
                const active = anomalies.filter(a => a.statut !== 'traitee' && a.statut !== 'archivee').length;
                setActiveAlertsCount(active);
            } catch (_) {
                if (mounted) setActiveAlertsCount(0);
            }
        };
        loadAlertCount();
        const timer = setInterval(loadAlertCount, 30000);
        return () => { mounted = false; clearInterval(timer); };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    const userPhotoUrl = user?.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=2563eb&color=ffffff&bold=true&size=80`;

    return (
        <aside className="w-[300px] h-screen sticky top-0 hidden md:flex flex-col border-r border-gray-100 relative overflow-hidden"
            style={{ boxShadow: '2px 0 12px rgba(99, 102, 241, 0.04)' }}>
            
            {/* Background Image & Overlay */}
            <div 
                className="absolute inset-0 z-0 opacity-100" 
                style={{ 
                    backgroundImage: `url(${buildingImg})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                }}
            />
            <div className="absolute inset-0 z-0 bg-white/60 backdrop-blur-[2px]"></div>

            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Logo */}
                <div className="px-7 pt-10 pb-8 cursor-pointer" onClick={() => navigate('/')}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                        <img src={logo} alt="ICEM" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-black leading-tight">ICEM Quality</p>
                        <p className="text-xs text-slate-900 font-bold">Control System</p>
                    </div>
                </div>
            </div>

            {/* Section label */}
            <div className="px-7 mb-4">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-[0.15em]">Menu</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto pb-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''}`
                        }
                    >
                        {item.icon}
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.page === 'alerts' && activeAlertsCount > 0 && (
                            <span className="inline-flex min-w-[20px] h-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                                {activeAlertsCount > 99 ? '99+' : activeAlertsCount}
                            </span>
                        )}
                    </NavLink>
                ))}

                {/* Divider */}
                <div className="my-4 border-t border-slate-900/10 mx-2"></div>

                <NavLink to="/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                    <User size={18} />
                    <span>Mon Profil</span>
                </NavLink>

                <button
                    onClick={handleLogout}
                    className="sidebar-item w-full text-left hover:!bg-red-50 hover:!text-red-500"
                >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                </button>
            </nav>

            {/* User Card at bottom */}
            <div className="p-4 mx-4 mb-6 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                <div className="flex items-center gap-3">
                    <img
                        src={userPhotoUrl}
                        alt={user?.fullName || 'User'}
                        className="w-10 h-10 rounded-full border-2 border-white/30 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate leading-tight">{user?.fullName || 'Utilisateur'}</p>
                        <p className="text-xs text-blue-200 truncate">{roleLabel}</p>
                    </div>
                </div>
            </div>
            </div>
        </aside>
    );
};

export default Sidebar;
