import { LayoutDashboard, ClipboardList, AlertCircle, Users, FileBarChart, LogOut, Bell, Cable, User, TrendingUp, Settings, Shield } from 'lucide-react';
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
        { icon: <LayoutDashboard size={22} />, label: 'Tableau de bord', path: '/', page: 'dashboard' },
        { icon: <ClipboardList size={22} />, label: 'Ordres Fabrication', path: '/orders', page: 'orders' },
        { icon: <AlertCircle size={22} />, label: 'Anomalies', path: '/anomalies', page: 'anomalies' },
        { icon: <Bell size={22} />, label: 'Alertes', path: '/alerts', page: 'alerts' },
        { icon: <FileBarChart size={22} />, label: 'Rapports', path: '/reports', page: 'reports' },
        { icon: <TrendingUp size={22} />, label: 'Tendances', path: '/trends', page: 'trends' },
        { icon: <Users size={22} />, label: 'Utilisateurs', path: '/users', page: 'users' },
        { icon: <Shield size={22} />, label: 'Rôles', path: '/roles', page: 'roles' },
    ];

    const menuItems = allMenuItems.filter(item => hasPageAccess(item.page));

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
        const timer = setInterval(loadAlertCount, 30000);
        return () => { mounted = false; clearInterval(timer); };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        navigate('/login');
    };

    const userPhotoUrl = user?.photoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=2563eb&color=ffffff&bold=true&size=100`;

    return (
        <aside className="w-[320px] h-screen sticky top-0 hidden md:flex flex-col border-r border-slate-200/50 relative overflow-hidden bg-white/40 backdrop-blur-2xl">
            
            {/* Background Image behind glass */}
            <div 
                className="absolute inset-0 z-0 opacity-100 scale-105" 
                style={{ 
                    backgroundImage: `url(${buildingImg})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/70 via-white/50 to-blue-50/70"></div>

            <div className="relative z-10 flex flex-col h-full w-full">
                
                {/* 🚀 ENLARGED LOGO SECTION */}
                <div className="px-8 pt-16 pb-12 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative inline-block">
                            {/* Larger Glow */}
                            <div className="absolute inset-0 bg-blue-600 blur-[40px] opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
                            {/* Larger Logo Container without background */}
                            <div className="relative w-28 h-28 flex items-center justify-center drop-shadow-[0_25px_25px_rgba(37,99,235,0.4)] transition-transform duration-500 group-hover:scale-110">
                                <img src={logo} alt="ICEM" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section label */}
                <div className="px-8 mb-6">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Navigation Centrale</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto pb-6 custom-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-5 px-5 py-4 rounded-[22px] transition-all duration-300 font-bold text-[15px]
                                ${isActive 
                                    ? 'bg-[#1e1b4b] text-white shadow-2xl shadow-indigo-950/20 translate-x-2' 
                                    : 'text-slate-600 hover:bg-white/60 hover:text-[#1e1b4b]'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`flex-1 truncate tracking-tight ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                                    {item.page === 'alerts' && activeAlertsCount > 0 && (
                                        <span className="inline-flex min-w-[24px] h-[24px] px-1.5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg">
                                            {activeAlertsCount > 99 ? '99+' : activeAlertsCount}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="my-8 border-t border-slate-200/60 mx-6"></div>

                    <NavLink to="/profile" className={({ isActive }) => 
                        `flex items-center gap-5 px-5 py-4 rounded-[22px] transition-all font-bold text-[15px]
                        ${isActive ? 'bg-[#1e1b4b] text-white shadow-xl' : 'text-slate-600 hover:bg-white/60'}`
                    }>
                        <User size={22} />
                        <span>Mon Profil</span>
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-5 px-5 py-4 rounded-[22px] transition-all font-bold text-[15px] text-slate-600 hover:bg-red-50 hover:text-red-600 mt-auto"
                    >
                        <LogOut size={22} />
                        <span>Déconnexion</span>
                    </button>
                </nav>

                {/* Footer User Widget */}
                <div className="p-5 m-5 rounded-[30px] bg-white/70 backdrop-blur-md border border-white/60 shadow-xl shadow-blue-900/5">
                    <div className="flex items-center gap-4">
                        <img
                            src={userPhotoUrl}
                            alt="User"
                            className="w-12 h-12 rounded-[18px] border-2 border-blue-500/10 object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="text-[15px] font-black text-[#1e1b4b] truncate leading-none mb-1.5">{user?.fullName || 'Utilisateur'}</p>
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{roleLabel}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
