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
        { icon: <Users size={22} />, label: 'Utilisateurs', path: '/users', page: 'users' },
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
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-900/10 via-white/40 to-blue-900/10 backdrop-blur-sm"></div>
            <div className="absolute inset-0 z-0 bg-white/30"></div>

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
                <nav className="flex-1 flex flex-col gap-2 px-4 overflow-y-auto pb-6 custom-scrollbar relative z-10">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-5 px-5 py-4 rounded-[24px] transition-all duration-500 font-bold text-[17px] relative group
                                ${isActive 
                                    ? 'active-nav-link bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-[0_10px_30px_rgba(30,27,75,0.25)] translate-x-2' 
                                    : 'text-slate-600 hover:bg-white/60 hover:text-[#1e1b4b] hover:translate-x-1'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Indicator Dot/Line */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                                    )}
                                    
                                    <span className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span className={`flex-1 truncate tracking-tight ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>{item.label}</span>
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
                        `flex items-center gap-5 px-5 py-4 rounded-[24px] transition-all font-bold text-[17px] group relative
                        ${isActive ? 'active-nav-link bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white shadow-xl translate-x-2' : 'text-slate-600 hover:bg-white/60 hover:translate-x-1'}`
                    }>
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                                )}
                                <span className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                    <User size={22} />
                                </span>
                                <span className={`flex-1 truncate tracking-tight ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-[#1e1b4b]'}`}>Mon Profil</span>
                            </>
                        )}
                    </NavLink>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-5 px-5 py-4 rounded-[24px] transition-all font-bold text-[17px] text-slate-600 hover:bg-red-50 hover:text-red-600 mt-auto"
                    >
                        <LogOut size={22} />
                        <span>Déconnexion</span>
                    </button>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
