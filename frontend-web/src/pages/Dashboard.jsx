import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { OrderService, AnomalyService, InspectionService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ icon, label, value, color, unit = "" }) => (
    <div className="card flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {React.cloneElement(icon, { className: 'text-white', size: 22 })}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}{unit}</p>
        </div>
    </div>
);

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626'];

const Dashboard = () => {
    const [stats, setStats] = useState({
        orders: { total: 0, enCours: 0, termine: 0, enAttente: 0 },
        anomalies: { total: 0, critique: 0, majeur: 0, mineur: 0 }
    });
    const [recentInspections, setRecentInspections] = useState([]);
    const [recentAnomalies, setRecentAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orderRes, anomalyRes, inspectionsRes, anomaliesListRes] = await Promise.all([
                    OrderService.getStats(),
                    AnomalyService.getStats(),
                    InspectionService.getAll().catch(() => ({ data: [] })),
                    AnomalyService.getAll().catch(() => ({ data: [] })),
                ]);

                setStats({
                    orders: orderRes.data,
                    anomalies: anomalyRes.data
                });

                const sortedInspections = (inspectionsRes.data || [])
                    .sort((a, b) => new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0))
                    .slice(0, 5);
                setRecentInspections(sortedInspections);

                const sortedAnomalies = (anomaliesListRes.data || [])
                    .sort((a, b) => new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0))
                    .slice(0, 5);
                setRecentAnomalies(sortedAnomalies);
            } catch (error) {
                console.error("Erreur stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const conformityRate = stats.orders.total > 0
        ? Math.round(((stats.orders.total - (stats.anomalies.total || 0)) / stats.orders.total) * 100)
        : 0;

    const chartData = [
        { name: 'En cours', ordres: stats.orders.enCours || 0, anomalies: stats.anomalies.majeur || 0 },
        { name: 'Terminé', ordres: stats.orders.termine || 0, anomalies: stats.anomalies.critique || 0 },
        { name: 'En attente', ordres: stats.orders.enAttente || 0, anomalies: stats.anomalies.mineur || 0 },
    ];

    const pieData = [
        { name: 'Critique', value: stats.anomalies.critique || 0 },
        { name: 'Majeur', value: stats.anomalies.majeur || 0 },
        { name: 'Mineur', value: stats.anomalies.mineur || 0 },
    ].filter(d => d.value > 0);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Tableau de Bord</h1>
                <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de la qualité de production</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={<Package />}
                    label="Ordres en cours"
                    value={stats.orders.enCours || 0}
                    color="bg-blue-600"
                />
                <StatCard
                    icon={<AlertTriangle />}
                    label="Anomalies Critiques"
                    value={stats.anomalies.critique || 0}
                    color="bg-red-600"
                />
                <StatCard
                    icon={<CheckCircle />}
                    label="Taux de Conformité"
                    value={conformityRate || 0}
                    unit="%"
                    color="bg-emerald-600"
                />
                <StatCard
                    icon={<TrendingUp />}
                    label="Production Totale"
                    value={stats.orders.total || 0}
                    color="bg-slate-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="card lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-800 mb-6">Répartition de la Production</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)', fontSize: 13 }}
                                />
                                <Bar dataKey="ordres" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} name="Ordres" />
                                <Bar dataKey="anomalies" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={32} name="Anomalies" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="card">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Anomalies par gravité</h3>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={index} fill={[COLORS[3], COLORS[2], COLORS[1]][index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 13 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: [COLORS[3], COLORS[2], COLORS[1]][i] }}></span>
                                            <span className="text-slate-600">{d.name}</span>
                                        </div>
                                        <span className="font-semibold text-slate-800">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center">
                            <p className="text-sm text-slate-400">Aucune anomalie</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h3 className="text-base font-bold text-slate-800 mb-5">Activité Récente</h3>
                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-slate-400 text-sm">Chargement...</p>
                        </div>
                    ) : (
                        <>
                            {recentInspections.slice(0, 3).map((ins, idx) => (
                                <div key={`ins-${idx}`} className="flex items-center gap-4 p-3.5 hover:bg-slate-50 rounded-xl transition-colors border-l-3 border-emerald-400">
                                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                        <CheckCircle size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">Câble #{ins.reference || ins.id?.substring(0, 12)}</p>
                                        <p className="text-xs text-slate-500">Ordre: {ins.orderId?.substring(0, 12)}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">
                                        {ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            ))}
                            {recentAnomalies.slice(0, 3).map((ano, idx) => (
                                <div key={`ano-${idx}`} className="flex items-center gap-4 p-3.5 hover:bg-slate-50 rounded-xl transition-colors border-l-3 border-red-400">
                                    <div className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">Anomalie: {ano.type}</p>
                                        <p className="text-xs text-slate-500">Gravité: {ano.severity} — Confiance: {ano.confidence ? (ano.confidence * 100).toFixed(0) : 0}%</p>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">
                                        {ano.detectedAt ? new Date(ano.detectedAt).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            ))}
                            {recentInspections.length === 0 && recentAnomalies.length === 0 && (
                                <div className="py-8 text-center">
                                    <Activity size={32} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 text-sm">Aucune activité récente</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
