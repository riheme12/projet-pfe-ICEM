import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, BarChart3, Activity, Zap, 
    Calendar, ArrowUpRight, ArrowDownRight, Layers, Target
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, LineChart, Line, ComposedChart, Bar, Legend
} from 'recharts';
import { CableService, AnomalyService } from '../services/api';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const Evolution = () => {
    const [loading, setLoading] = useState(true);
    const [cables, setCables] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cablesRes, anomaliesRes] = await Promise.all([
                    CableService.getAll({ limit: 500 }),
                    AnomalyService.getAll({ limit: 500 })
                ]);
                
                const cablesData = cablesRes.data || [];
                const anomaliesData = anomaliesRes.data || [];
                
                setCables(cablesData);
                setAnomalies(anomaliesData);

                // Group data by Date (Last 7 Days or dynamically)
                const last30Days = [...Array(30)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    return d.toISOString().split('T')[0];
                });

                let data = last30Days.map(date => {
                    const dailyCables = cablesData.filter(c => {
                        try {
                            const d = new Date(c.inspectionDate || c.createdAt);
                            if (isNaN(d.getTime())) return false;
                            return d.toISOString().split('T')[0] === date;
                        } catch (e) { return false; }
                    });
                    
                    const dailyAnomalies = anomaliesData.filter(a => {
                        try {
                            const d = new Date(a.detectedAt || a.createdAt);
                            if (isNaN(d.getTime())) return false;
                            return d.toISOString().split('T')[0] === date;
                        } catch (e) { return false; }
                    });
                    
                    const conformCount = dailyCables.filter(c => c.status === 'Conforme').length;
                    const total = dailyCables.length;
                    const conformityRate = total > 0 ? (conformCount / total) * 100 : 0;

                    return {
                        date,
                        shortDate: date.substring(8, 10) + '/' + date.substring(5, 7),
                        totalInspections: total,
                        conformityRate: parseFloat(conformityRate.toFixed(1)),
                        anomalies: dailyAnomalies.length,
                        criticalAnomalies: dailyAnomalies.filter(a => a.severity?.toLowerCase() === 'critique').length
                    };
                });

                // Mode Simulation si la base de données est vide (pour la soutenance PFE)
                if (cablesData.length === 0 && anomaliesData.length === 0) {
                    let baseConformity = 85;
                    data = last30Days.map((date, i) => {
                        const total = Math.floor(Math.random() * 40) + 20 + (i > 20 ? 15 : 0); // Hausse à la fin
                        baseConformity = Math.min(100, Math.max(70, baseConformity + (Math.random() * 10 - 4)));
                        const anomaliesCount = Math.floor(total * (1 - (baseConformity / 100)));
                        const critical = Math.floor(anomaliesCount * 0.2);
                        
                        return {
                            date,
                            shortDate: date.substring(8, 10) + '/' + date.substring(5, 7),
                            totalInspections: total,
                            conformityRate: parseFloat(baseConformity.toFixed(1)),
                            anomalies: anomaliesCount,
                            criticalAnomalies: critical
                        };
                    });
                }

                setTrendData(data);

            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Erreur de récupération des données d'évolution");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateTrend = (key) => {
        if (trendData.length < 2) return 0;
        const recent = trendData.slice(-7).reduce((acc, curr) => acc + curr[key], 0);
        const previous = trendData.slice(-14, -7).reduce((acc, curr) => acc + curr[key], 0);
        if (previous === 0) return recent > 0 ? 100 : 0;
        return (((recent - previous) / previous) * 100).toFixed(1);
    };

    const inspectionTrend = calculateTrend('totalInspections');
    const anomalyTrend = calculateTrend('anomalies');

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-6 mb-2">
                            <span className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name}
                            </span>
                            <span className="font-black text-slate-900">
                                {entry.value}{entry.name.includes('Taux') ? '%' : ''}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Analyse prédictive en cours...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            <PageHeader 
                title="Évolution & Tendances"
                subtitle="Analyse prédictive et aide à la décision stratégique"
                icon={<TrendingUp />}
            />

            {/* Strategic KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[40px] border border-white shadow-xl shadow-indigo-900/5 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                    <Activity size={24} />
                                </div>
                                <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Tendance Production</span>
                            </div>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tight">
                                {trendData.reduce((acc, curr) => acc + curr.totalInspections, 0)}
                            </h3>
                            <p className="text-sm font-bold text-slate-500 mt-2">Inspections (30j)</p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-black px-3 py-1.5 rounded-xl ${inspectionTrend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {inspectionTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(inspectionTrend)}%
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-[40px] border border-white shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Target size={24} />
                                </div>
                                <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Stabilité Qualité</span>
                            </div>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tight">
                                {(trendData.reduce((acc, curr) => acc + curr.conformityRate, 0) / (trendData.length || 1)).toFixed(1)}%
                            </h3>
                            <p className="text-sm font-bold text-slate-500 mt-2">Moyenne (30j)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-white p-8 rounded-[40px] border border-white shadow-xl shadow-rose-900/5 relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-rose-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                                    <Zap size={24} />
                                </div>
                                <span className="text-sm font-black text-rose-600 uppercase tracking-widest">Risque Système</span>
                            </div>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tight">
                                {trendData.reduce((acc, curr) => acc + curr.anomalies, 0)}
                            </h3>
                            <p className="text-sm font-bold text-slate-500 mt-2">Anomalies détectées (30j)</p>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-black px-3 py-1.5 rounded-xl ${anomalyTrend <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {anomalyTrend <= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                            {Math.abs(anomalyTrend)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Evolution de la Production */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dynamique de Production</h3>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Volume d'inspections sur 30 jours</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="totalInspections" name="Inspections" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorProd)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evolution du Taux de Conformité */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tendance de la Qualité</h3>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Taux de conformité journalier</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="conformityRate" name="Taux Conformité" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Corrélation Anomalies vs Production */}
                <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl shadow-slate-200/40 lg:col-span-2">
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analyse Croisée : Défauts vs Production</h3>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Aide à la décision sur la charge de travail</p>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '12px' }} />
                                <Bar yAxisId="left" dataKey="totalInspections" name="Volume Produit" barSize={20} fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="anomalies" name="Total Anomalies" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 0}} />
                                <Line yAxisId="right" type="monotone" dataKey="criticalAnomalies" name="Anomalies Critiques" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444', strokeWidth: 0}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Décisions & Alertes */}
            <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                        <Target size={28} className="text-blue-400" />
                        Aide à la Décision
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                            <h4 className="font-bold text-blue-200 mb-2 uppercase tracking-widest text-xs">Alerte Charge</h4>
                            <p className="text-lg font-medium leading-relaxed">
                                {inspectionTrend > 20 
                                    ? "Forte augmentation de la production détectée. Risque de fatigue pour les opérateurs, surveillance recommandée." 
                                    : "La charge d'inspection est stable, permettant de maintenir une qualité constante."}
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                            <h4 className="font-bold text-rose-300 mb-2 uppercase tracking-widest text-xs">Risque Qualité</h4>
                            <p className="text-lg font-medium leading-relaxed">
                                {anomalyTrend > 10 
                                    ? "Hausse des anomalies signalée. Il est conseillé de vérifier l'étalonnage des machines et d'auditer le lot récent." 
                                    : "Le niveau d'anomalie est contrôlé. Aucune action corrective d'urgence n'est requise."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Evolution;
