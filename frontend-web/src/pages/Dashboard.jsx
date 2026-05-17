import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertTriangle, CheckCircle, Package, TrendingUp, Download, BarChart3, Shield, Zap, ArrowUpRight, ArrowDownRight, Activity, RefreshCw } from 'lucide-react';
import { OrderService, AnomalyService, StatsService, CableService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import PageHeader from '../components/PageHeader';
import toast, { Toaster } from 'react-hot-toast';

const StatCard = ({ label, value, unit, subtitle, icon, hero = false, trend, color = 'indigo' }) => {
    const colorStyles = {
        indigo: {
            bg: "from-indigo-50 to-indigo-100",
            border: "border-indigo-200 hover:border-indigo-300",
            iconBg: "bg-indigo-600 text-white shadow-md shadow-indigo-600/30",
            blob: "bg-indigo-200/50",
            textAccent: "text-indigo-600",
            title: "text-indigo-900",
            value: "text-indigo-950"
        },
        rose: {
            bg: "from-rose-50 to-rose-100",
            border: "border-rose-200 hover:border-rose-300",
            iconBg: "bg-rose-500 text-white shadow-md shadow-rose-500/30",
            blob: "bg-rose-200/50",
            textAccent: "text-rose-600",
            title: "text-rose-900",
            value: "text-rose-950"
        },
        emerald: {
            bg: "from-emerald-50 to-emerald-100",
            border: "border-emerald-200 hover:border-emerald-300",
            iconBg: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30",
            blob: "bg-emerald-200/50",
            textAccent: "text-emerald-600",
            title: "text-emerald-900",
            value: "text-emerald-950"
        },
        amber: {
            bg: "from-amber-50 to-amber-100",
            border: "border-amber-200 hover:border-amber-300",
            iconBg: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
            blob: "bg-amber-200/50",
            textAccent: "text-amber-600",
            title: "text-amber-900",
            value: "text-amber-950"
        },
        blue: {
            bg: "from-blue-50 to-blue-100",
            border: "border-blue-200 hover:border-blue-300",
            iconBg: "bg-blue-500 text-white shadow-md shadow-blue-500/30",
            blob: "bg-blue-200/50",
            textAccent: "text-blue-600",
            title: "text-blue-900",
            value: "text-blue-950"
        }
    };

    const theme = colorStyles[color] || colorStyles.indigo;

    return (
        <div className={`bg-gradient-to-br ${theme.bg} p-8 rounded-[40px] border border-white ${theme.border} shadow-xl shadow-slate-200/40 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${theme.blob} rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {React.cloneElement(icon, { size: 24 })}
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-xl
                            ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <p className={`text-[11px] font-black ${theme.textAccent} uppercase tracking-widest mb-1`}>{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className={`text-3xl font-black ${theme.value} tracking-tight`}>
                        {value}
                    </h3>
                    {unit && <span className={`text-sm font-black ${theme.textAccent} uppercase tracking-widest`}>{unit}</span>}
                </div>
                {subtitle && <p className={`text-[10px] font-black ${theme.title} uppercase tracking-widest mt-3 opacity-70 group-hover:opacity-100 transition-opacity`}>{subtitle}</p>}
            </div>
        </div>
    );
};

/* ─── Mini stat item ─── */
const MiniStat = ({ icon, label, value, color }) => (
    <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-[32px] border border-white shadow-xl shadow-indigo-900/5 flex items-center gap-4 hover:shadow-2xl transition-all duration-300">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${color} shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-xl border border-gray-100 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((e, i) => (
                <p key={i} className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }}></span>
                    {e.name}: <span className="font-bold text-gray-700">{e.value}</span>
                </p>
            ))}
        </div>
    );
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

const Dashboard = () => {
    const [stats, setStats] = useState({
        orders: { total: 0, enCours: 0, termine: 0, enAttente: 0 },
        anomalies: { total: 0, critique: 0, majeur: 0, mineur: 0 },
        cables: { total: 0, conforme: 0, nonConforme: 0, enAttente: 0 },
    });
    const [recentInspections, setRecentInspections] = useState([]);
    const [recentAnomalies, setRecentAnomalies] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const { canExport, user } = useAuth();

    useEffect(() => {
        const fetchRecentData = async () => {
            try {
                const [anomRes, cableRes] = await Promise.all([
                    AnomalyService.getAll({ limit: 10 }),
                    CableService.getAll({ limit: 10 })
                ]);
                
                // Anomalies
                const anomalies = anomRes.data || [];
                anomalies.sort((a, b) => new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0));
                setRecentAnomalies(anomalies.slice(0, 5));
                
                // Cables
                const cables = cableRes.data || [];
                cables.sort((a, b) => new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0));
                setRecentInspections(cables.slice(0, 5));
            } catch (e) {
                console.error("Error fetching recent data", e);
            }
        };

        const fetchStats = async () => {
            try {
                const [summaryRes, trendsRes] = await Promise.all([
                    StatsService.getSummary(),
                    StatsService.getTrends().catch(() => ({ data: [] })),
                ]);
                
                const data = summaryRes.data;
                setStats({ 
                    orders: data.orders, 
                    anomalies: data.anomalies, 
                    cables: data.cables 
                });
                setTrends(trendsRes.data || []);
            } catch (e) { 
                console.error('Error fetching dashboard stats:', e); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchStats();
        fetchRecentData();

        let isFirstLoad = true;
        const qNotifs = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1));
        const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
            if (!isFirstLoad && snapshot.docChanges().some(c => c.type === 'added')) {
                fetchStats();
                fetchRecentData();
                const newNotif = snapshot.docs[0]?.data();
                if (newNotif && newNotif.type === 'anomaly_detected') {
                    toast.error(`🚨 ${newNotif.message || 'Anomalie détectée'}`, {
                        duration: 5000,
                        style: { borderRadius: '12px', background: '#1e2035', color: '#fff', fontSize: '13px' }
                    });
                }
            }
            isFirstLoad = false;
        });

        return () => unsubNotifs();
    }, []);

    const conformityRate = stats.cables.total > 0
        ? Math.round((stats.cables.conforme / stats.cables.total) * 100) : 0;

    const barData = [
        { name: 'En cours', ordres: stats.orders.enCours || 0, anomalies: stats.anomalies.majeur || 0 },
        { name: 'Terminé', ordres: stats.orders.termine || 0, anomalies: stats.anomalies.critique || 0 },
        { name: 'Attente', ordres: stats.orders.enAttente || 0, anomalies: stats.anomalies.mineur || 0 },
    ];

    const pieData = [
        { name: 'Critique', value: stats.anomalies.critique || 0 },
        { name: 'Majeur', value: stats.anomalies.majeur || 0 },
        { name: 'Mineur', value: stats.anomalies.mineur || 0 },
    ].filter(d => d.value > 0);

    const trendData = trends.slice(-12);

    const handleExportPDF = async () => {
        const toastId = toast.loading("Génération du rapport exécutif...");
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // Header
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, 40, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ICEM QUALITY DASHBOARD', 15, 18);
            
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`GÉNÉRÉ LE : ${new Date().toLocaleString('fr-FR')}`, 15, 28);
            pdf.text(`UTILISATEUR : ${user?.fullName || 'DIRECTEUR'}`, 15, 33);

            // Table Summary
            autoTable(pdf, {
                startY: 50,
                head: [['Indicateur', 'Valeur Actuelle']],
                body: [
                    ['Ordres en cours', stats.orders.enCours || 0],
                    ['Câbles Inspectés (30j)', stats.cables.total || 0],
                    ['Taux de Conformité', `${conformityRate}%`],
                    ['Anomalies Critiques', stats.anomalies.critique || 0],
                    ['Total Anomalies', stats.anomalies.total || 0],
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });

            pdf.save(`ICEM_Dashboard_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Rapport exporté !", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Erreur d'export", { id: toastId });
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <Toaster position="top-right" />

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-10 bg-gradient-to-br from-white to-slate-50/50 rounded-[45px] shadow-2xl shadow-indigo-900/5 border border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Supervision Centrale</h1>
                    <p className="text-slate-400 font-bold text-sm mt-1">Surveillance des performances en temps réel</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    {canExport && (
                        <button onClick={handleExportPDF} className="btn-secondary px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-200 transition-all shadow-xl shadow-indigo-900/5 flex items-center gap-3 active:scale-95">
                            <Download size={18} /> Export Stratégique
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Package />}
                    label="Ordres en cours"
                    value={stats.orders.enCours || 0}
                    subtitle={`${stats.orders.total || 0} au total`}
                    color="blue"
                />
                <StatCard
                    icon={<AlertTriangle />}
                    label="Anomalies Critiques"
                    value={stats.anomalies.critique || 0}
                    subtitle={`${(stats.anomalies.critique || 0) + (stats.anomalies.majeur || 0) + (stats.anomalies.mineur || 0)} total`}
                    color="rose"
                />
                <StatCard
                    icon={<CheckCircle />}
                    label="Taux Conformité"
                    value={conformityRate}
                    unit="%"
                    subtitle={`${stats.cables.conforme || 0} câbles OK`}
                    color="emerald"
                />
                <StatCard
                    icon={<TrendingUp />}
                    label="Câbles Inspectés"
                    value={stats.cables.total || 0}
                    subtitle={`${stats.cables.nonConforme || 0} non conformes`}
                    color="indigo"
                />
            </div>

            {/* Charts + Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart — spans 2 cols */}
                {trendData.length > 0 && (
                    <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Tendances de Conformité</h3>
                                <p className="text-xs text-gray-400 mt-0.5">14 derniers jours</p>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>Inspections
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Anomalies
                                </span>
                            </div>
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="gInsp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f8" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={6} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dx={-4} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="inspections" stroke="#6366f1" strokeWidth={2} fill="url(#gInsp)" name="Inspections" />
                                    <Area type="monotone" dataKey="anomalies" stroke="#ef4444" strokeWidth={2} fill="url(#gAnom)" name="Anomalies" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Pie Chart */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Anomalies par Gravité</h3>
                    <p className="text-xs text-gray-400 mb-4">Répartition des défauts</p>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={58}
                                            paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-2 mt-3">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }}></span>
                                            <span className="text-xs text-gray-500 font-medium">{d.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-36 flex flex-col items-center justify-center text-center">
                            <CheckCircle size={28} className="text-emerald-300 mb-2" />
                            <p className="text-xs text-gray-400">Aucune anomalie</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Bar Chart + Mini Stats + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Production</h3>
                    <p className="text-xs text-gray-400 mb-4">Par statut</p>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barGap={3}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f8" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="ordres" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} name="Ordres" />
                                <Bar dataKey="anomalies" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} name="Anomalies" opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-3 content-start">
                    <MiniStat icon={<Shield size={16} />} label="Conformes" value={stats.cables.conforme || 0} color="bg-emerald-50 text-emerald-500" />
                    <MiniStat icon={<AlertTriangle size={16} />} label="Non Conf." value={stats.cables.nonConforme || 0} color="bg-red-50 text-red-500" />
                    <MiniStat icon={<Zap size={16} />} label="Majeures" value={stats.anomalies.majeur || 0} color="bg-amber-50 text-amber-500" />
                    <MiniStat icon={<BarChart3 size={16} />} label="Terminés" value={stats.orders.termine || 0} color="bg-indigo-50 text-indigo-500" />
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800">Activité Récente</h3>
                        <span className="chip text-[10px]">En direct</span>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                            <p className="text-xs text-gray-400">Chargement...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {[...recentInspections.slice(0, 2).map((ins, i) => ({
                                type: 'inspection', key: `ins-${i}`,
                                icon: <CheckCircle size={14} />,
                                iconBg: 'bg-emerald-50 text-emerald-500',
                                title: `Câble #${ins.reference || ins.id?.substring(0, 10)}`,
                                sub: `OF: ${ins.orderId?.substring(0, 10) || '—'}`,
                                date: ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('fr-FR') : '',
                            })), ...recentAnomalies.filter(a => a.severity?.toLowerCase() === 'critique').slice(0, 3).map((ano, i) => ({
                                type: 'anomaly', key: `ano-${i}`,
                                icon: <AlertTriangle size={14} />,
                                iconBg: 'bg-red-50 text-red-500',
                                title: `Alerte Critique: ${ano.type}`,
                                sub: `${ano.reference || 'REF-STD'} — ${ano.confidence ? (ano.confidence * 100).toFixed(0) : 0}% confiance`,
                                date: ano.detectedAt?.seconds
                                    ? new Date(ano.detectedAt.seconds * 1000).toLocaleDateString('fr-FR')
                                    : ano.detectedAt ? new Date(ano.detectedAt).toLocaleDateString('fr-FR') : '',
                            }))].map(item => (
                                <div key={item.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 truncate">{item.title}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{item.sub}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-300 flex-shrink-0">{item.date}</span>
                                </div>
                            ))}
                            {recentInspections.length === 0 && recentAnomalies.length === 0 && (
                                <div className="py-6 text-center">
                                    <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-xs text-gray-400">Aucune activité récente</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
