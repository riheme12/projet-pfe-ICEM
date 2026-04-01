import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Search, Filter, Clock, Shield, ChevronDown, X } from 'lucide-react';
import { AnomalyService } from '../services/api';

const SeverityBadge = ({ severity }) => {
    const s = severity?.toLowerCase() || 'moyenne';
    const config = {
        critique: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        haute: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        moyenne: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
        majeur: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
        faible: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        mineur: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    };
    const c = config[s] || config.moyenne;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {severity}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'detectee';
    const config = {
        detectee: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Détectée' },
        en_traitement: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'En traitement' },
        traitee: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Traitée' },
        archivee: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Archivée' },
    };
    const c = config[s] || config.detectee;
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
};

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('Tous');
    const [treatModal, setTreatModal] = useState(null);
    const [corrective, setCorrective] = useState('');

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await AnomalyService.getAll();
            const sorted = (response.data || []).sort((a, b) => {
                const order = { critique: 0, haute: 0, majeur: 1, moyenne: 1, faible: 2, mineur: 2 };
                return (order[a.severity?.toLowerCase()] ?? 3) - (order[b.severity?.toLowerCase()] ?? 3);
            });
            setAlerts(sorted);
        } catch (error) {
            console.error("Erreur chargement alertes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const handleTreat = async () => {
        if (!treatModal) return;
        try {
            await AnomalyService.update(treatModal.id, {
                statut: 'traitee',
                mesureCorrective: corrective
            });
            setTreatModal(null);
            setCorrective('');
            fetchAlerts();
        } catch (error) {
            console.error("Erreur traitement", error);
        }
    };

    const filteredAlerts = alerts.filter(a => {
        const matchesSearch = searchTerm === '' ||
            a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.cableId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === 'Tous' || a.severity?.toLowerCase() === filterSeverity.toLowerCase();
        return matchesSearch && matchesSeverity;
    });

    const activeCount = alerts.filter(a => a.statut !== 'traitee' && a.statut !== 'archivee').length;
    const criticalCount = alerts.filter(a => ['critique', 'haute'].includes(a.severity?.toLowerCase())).length;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Alertes</h1>
                    <p className="text-sm text-slate-500 mt-1">Suivi et traitement des alertes qualité en temps réel</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="text-sm font-semibold text-red-700">{criticalCount} critiques</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <Bell size={16} className="text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{activeCount} actives</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par type ou câble..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field w-full md:w-48"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                >
                    <option value="Tous">Toutes gravités</option>
                    <option value="Critique">Critique</option>
                    <option value="Majeur">Majeur</option>
                    <option value="Mineur">Mineur</option>
                </select>
            </div>

            {/* Alerts List */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="card py-16 text-center">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Chargement des alertes...</p>
                    </div>
                ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                        <div key={alert.id} className="card flex flex-col md:flex-row md:items-center gap-4 !p-5">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                                    ${['critique', 'haute'].includes(alert.severity?.toLowerCase()) ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-800 capitalize">{alert.type}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Câble: {alert.cableId?.substring(0, 12) || '—'} • Confiance: {alert.confidence ? (alert.confidence * 100).toFixed(0) : 0}%
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <SeverityBadge severity={alert.severity} />
                                <StatusBadge status={alert.statut || 'detectee'} />
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock size={12} />
                                    {alert.detectedAt ? new Date(alert.detectedAt).toLocaleDateString() : '—'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {alert.statut !== 'traitee' && (
                                    <button
                                        onClick={() => setTreatModal(alert)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                                    >
                                        <CheckCircle size={14} />
                                        Traiter
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card flex flex-col items-center py-20 text-slate-400 gap-3">
                        <Shield size={48} className="text-emerald-400" />
                        <p className="text-base font-medium text-slate-600">Aucune alerte trouvée</p>
                        <p className="text-sm">Toutes les alertes ont été traitées ou les filtres ne correspondent à aucun résultat.</p>
                    </div>
                )}
            </div>

            {/* Treat Modal */}
            {treatModal && (
                <div className="modal-overlay" onClick={() => setTreatModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Traiter l'alerte</h2>
                            <button onClick={() => setTreatModal(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Type</span>
                                    <span className="font-semibold text-slate-800 capitalize">{treatModal.type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Gravité</span>
                                    <SeverityBadge severity={treatModal.severity} />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Confiance IA</span>
                                    <span className="font-semibold text-slate-800">{treatModal.confidence ? (treatModal.confidence * 100).toFixed(0) : 0}%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mesure corrective prise</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    placeholder="Décrivez la mesure corrective appliquée..."
                                    value={corrective}
                                    onChange={(e) => setCorrective(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setTreatModal(null)}
                                    className="flex-1 btn-secondary"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleTreat}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Confirmer le traitement
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;
