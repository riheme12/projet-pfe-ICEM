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

/* ─── Stat Card — two variants: filled (hero) and white ─── */
const StatCard = ({ label, value, unit, subtitle, icon, hero = false, trend }) => {
    if (hero) {
        return (
            <div className="card-hero relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5"></div>
                <div className="absolute -right-2 bottom-4 w-14 h-14 rounded-full bg-white/8"></div>
                <div className="flex justify-between items-start mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                        {React.cloneElement(icon, { size: 17 })}
                    </div>
                    {trend !== undefined && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <p className="stat-label text-indigo-200 mb-1">{label}</p>
                <p className="text-3xl font-extrabold text-white tracking-tight leading-none">
                    {value}{unit && <span className="text-lg font-semibold text-indigo-200 ml-1">{unit}</span>}
                </p>
                {subtitle && <p className="text-[11px] text-indigo-200 mt-2">{subtitle}</p>}
            </div>
        );
    }

    return (
        <div className="card group hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                    {React.cloneElement(icon, { size: 17 })}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full
                        ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="stat-label mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
                {value}{unit && <span className="text-base font-semibold text-gray-300 ml-0.5">{unit}</span>}
            </p>
            {subtitle && <p className="text-[11px] text-gray-400 mt-2">{subtitle}</p>}
        </div>
    );
};

/* ─── Mini stat item ─── */
const MiniStat = ({ icon, label, value, color }) => (
    <div className="card flex items-center gap-3 !p-4 hover:-translate-y-0.5 transition-all duration-200">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="stat-label">{label}</p>
            <p className="text-lg font-bold text-gray-800">{value}</p>
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
        const qAnomalies = query(collection(db, 'anomaly'), orderBy('detectedAt', 'desc'), limit(5));
        let isFirstLoad = true;
        const unsubAnomalies = onSnapshot(qAnomalies, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentAnomalies(list);
            if (!isFirstLoad && snapshot.docChanges().some(c => c.type === 'added')) {
                const a = list[0];
                if (a?.type) toast.error(`🚨 ${a.type} détecté — câble #${a.cableId?.substring(0, 8) || 'N/A'}`, {
                    duration: 5000,
                    style: { borderRadius: '12px', background: '#1e2035', color: '#fff', fontSize: '13px' }
                });
            }
            isFirstLoad = false;
            const crit = list.filter(a => a.severity?.toLowerCase() === 'critique').length;
            setStats(prev => ({ ...prev, anomalies: { ...prev.anomalies, total: list.length, critique: crit } }));
        }, console.error);

        const qInspections = query(collection(db, 'cable'), orderBy('inspectionDate', 'desc'), limit(5));
        const unsubInspections = onSnapshot(qInspections, (snapshot) => {
            setRecentInspections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const fetchStats = async () => {
            try {
                const [orderRes, anomalyRes, cableRes, trendsRes] = await Promise.all([
                    OrderService.getStats(),
                    AnomalyService.getStats(),
                    CableService.getStats(),
                    StatsService.getTrends().catch(() => ({ data: [] })),
                ]);
                setStats({ orders: orderRes.data, anomalies: anomalyRes.data, cables: cableRes.data });
                setTrends(trendsRes.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchStats();

        return () => { unsubAnomalies(); unsubInspections(); };
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
        const doc = new jsPDF();
        const w = doc.internal.pageSize.getWidth();
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, w, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text('ICEM Quality Control', 14, 16);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Tableau de Bord — ' + new Date().toLocaleString('fr-FR'), 14, 26);
        doc.setTextColor(30, 32, 53);
        autoTable(doc, {
            startY: 48,
            head: [['KPI', 'Valeur']],
            body: [
                ['Ordres en cours', stats.orders.enCours || 0],
                ['Ordres terminés', stats.orders.termine || 0],
                ['Anomalies critiques', stats.anomalies.critique || 0],
                ['Taux de conformité', `${conformityRate}%`],
                ['Câbles inspectés', stats.cables.total || 0],
            ],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            alternateRowStyles: { fillColor: [238, 242, 255] },
        });
        doc.save(`ICEM_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex flex-col gap-5">
            <Toaster position="top-right" />

            <PageHeader 
                title={`Bonjour, ${user?.fullName?.split(' ')[0] || 'Utilisateur'}`}
                subtitle="Voici l'état global de la qualité de production en temps réel"
                icon={<LayoutDashboard />}
                actions={
                    canExport && (
                        <button onClick={handleExportPDF}
                            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                            <Download size={18} />
                            Exporter PDF
                        </button>
                    )
                }
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Package />}
                    label="Ordres en cours"
                    value={stats.orders.enCours || 0}
                    subtitle={`${stats.orders.total || 0} au total`}
                    hero
                />
                <StatCard
                    icon={<AlertTriangle />}
                    label="Anomalies Critiques"
                    value={stats.anomalies.critique || 0}
                    subtitle={`${(stats.anomalies.critique || 0) + (stats.anomalies.majeur || 0) + (stats.anomalies.mineur || 0)} total`}
                />
                <StatCard
                    icon={<CheckCircle />}
                    label="Taux Conformité"
                    value={conformityRate}
                    unit="%"
                    subtitle={`${stats.cables.conforme || 0} câbles OK`}
                />
                <StatCard
                    icon={<TrendingUp />}
                    label="Câbles Inspectés"
                    value={stats.cables.total || 0}
                    subtitle={`${stats.cables.nonConforme || 0} non conformes`}
                />
            </div>

            {/* Charts + Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Area Chart — spans 2 cols */}
                {trendData.length > 0 && (
                    <div className="card lg:col-span-2">
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
                <div className="card">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar Chart */}
                <div className="card lg:col-span-1">
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
                <div className="card lg:col-span-1">
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
                            })), ...recentAnomalies.slice(0, 2).map((ano, i) => ({
                                type: 'anomaly', key: `ano-${i}`,
                                icon: <AlertTriangle size={14} />,
                                iconBg: 'bg-red-50 text-red-500',
                                title: `Anomalie: ${ano.type}`,
                                sub: `${ano.severity} — ${ano.confidence ? (ano.confidence * 100).toFixed(0) : 0}% confiance`,
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
