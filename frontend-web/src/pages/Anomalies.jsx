import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Search, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnomalyService } from '../services/api';

const SeverityBadge = ({ severity }) => {
    const s = severity?.toLowerCase() || 'mineur';
    const config = {
        critique: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        haute: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
        majeur: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
        moyenne: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
        mineur: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        faible: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    };
    const c = config[s] || config.mineur;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {severity}
        </span>
    );
};

const Anomalies = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('Tous');
    const [treatModal, setTreatModal] = useState(null);
    const [corrective, setCorrective] = useState('');
    const navigate = useNavigate();

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            const response = await AnomalyService.getAll();
            setAnomalies(response.data || []);
        } catch (error) {
            console.error("Erreur anomalies", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnomalies(); }, []);

    const handleTreat = async () => {
        if (!treatModal) return;
        try {
            await AnomalyService.update(treatModal.id, {
                statut: 'traitee',
                mesureCorrective: corrective
            });
            setTreatModal(null);
            setCorrective('');
            fetchAnomalies();
        } catch (error) {
            console.error("Erreur traitement", error);
        }
    };

    const filteredAnomalies = anomalies.filter(a => {
        const matchSearch = searchTerm === '' ||
            a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.cableId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSeverity = filterSeverity === 'Tous' || a.severity?.toLowerCase() === filterSeverity.toLowerCase();
        return matchSearch && matchSeverity;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Anomalies</h1>
                    <p className="text-sm text-slate-500 mt-1">Suivi des défauts détectés par l'IA sur les câbles</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-700">{anomalies.length} anomalies</span>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200/80" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par type d'anomalie ou câble..."
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

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Chargement des anomalies...</p>
                    </div>
                ) : filteredAnomalies.length > 0 ? (
                    filteredAnomalies.map((anomaly) => (
                        <div key={anomaly.id} className="card group hover:border-slate-300 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                    <AlertCircle size={22} />
                                </div>
                                <SeverityBadge severity={anomaly.severity} />
                            </div>

                            <h3 className="text-base font-semibold text-slate-800 mb-1 capitalize">{anomaly.type}</h3>
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{anomaly.description || 'Anomalie détectée par l\'IA'}</p>

                            <div className="flex flex-col gap-2 py-3 border-y border-slate-100 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Câble</span>
                                    <span className="text-slate-700 font-semibold">#{anomaly.cableId?.substring(0, 10) || '—'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 items-center">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {anomaly.detectedAt ? new Date(anomaly.detectedAt).toLocaleDateString() : '—'}
                                    </div>
                                    <span className="font-semibold text-blue-600">{anomaly.confidence ? (anomaly.confidence * 100).toFixed(0) : 0}% confiance</span>
                                </div>
                                {anomaly.statut && (
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-slate-400">Statut</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            anomaly.statut === 'traitee' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {anomaly.statut === 'traitee' ? 'Traitée' : anomaly.statut === 'en_traitement' ? 'En traitement' : 'Détectée'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/inspections/${anomaly.inspectionId}`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <Eye size={14} />
                                    Détails
                                </button>
                                {anomaly.statut !== 'traitee' && (
                                    <button
                                        onClick={() => setTreatModal(anomaly)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                    >
                                        <CheckCircle size={14} />
                                        Traiter
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full card flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <CheckCircle size={48} className="text-emerald-400" />
                        <p className="text-base font-medium text-slate-600">Aucune anomalie trouvée</p>
                        <p className="text-sm">La production est conforme ou les filtres ne correspondent à aucun résultat.</p>
                    </div>
                )}
            </div>

            {/* Treat Modal */}
            {treatModal && (
                <div className="modal-overlay" onClick={() => setTreatModal(null)}>
                    <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Traiter l'anomalie</h2>
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
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Mesure corrective</label>
                                <textarea
                                    rows={3}
                                    className="input-field resize-none"
                                    placeholder="Décrivez la mesure corrective..."
                                    value={corrective}
                                    onChange={(e) => setCorrective(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setTreatModal(null)} className="flex-1 btn-secondary">Annuler</button>
                                <button onClick={handleTreat} className="flex-1 btn-primary">Confirmer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Anomalies;
