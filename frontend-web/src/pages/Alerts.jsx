import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Search, Filter, Clock, Shield, ChevronDown, X } from 'lucide-react';
import { AnomalyService } from '../services/api';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

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
    const [selectedAlert, setSelectedAlert] = useState(null);
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

    useEffect(() => { 
        fetchAlerts(); 
        
        // Real-time listener for new alerts
        const q = query(collection(db, 'anomaly'), orderBy('detectedAt', 'desc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty && !loading) {
                // If a new document is detected, refresh the list
                fetchAlerts();
                
                // Show a brief notification for critical ones
                const newAnom = snapshot.docs[0].data();
                if (newAnom.severity === 'Critique' || newAnom.severity === 'Majeur') {
                    // One could use a toast library here, but we will use a simple state or console for now
                    console.log("Nouvelle anomalie détectée !", newAnom);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleTreat = async () => {
        if (!selectedAlert) return;
        try {
            await AnomalyService.update(selectedAlert.id, {
                statut: 'traitee',
                mesureCorrective: corrective
            });
            setSelectedAlert(null);
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
                        <div key={alert.id} 
                             onClick={() => setSelectedAlert(alert)}
                             className="card flex flex-col md:flex-row md:items-center gap-4 !p-5 cursor-pointer hover:bg-blue-50/40 transition-colors border-l-4 border-l-transparent hover:border-l-blue-500 shadow-sm">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner
                                    ${['critique', 'haute'].includes(alert.severity?.toLowerCase()) ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                    <AlertTriangle size={28} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 capitalize mb-1">{alert.type}</h3>
                                    <p className="text-sm text-slate-600">
                                        Câble: <span className="font-medium text-slate-800">{alert.cableId?.substring(0, 12) || '—'}</span> • Par: <span className="font-bold text-slate-800">{alert.technicianName || 'Auto System'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <SeverityBadge severity={alert.severity} />
                                <StatusBadge status={alert.statut || 'detectee'} />
                                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <Clock size={16} />
                                    {alert.detectedAt ? new Date(alert.detectedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                {alert.statut !== 'traitee' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); }}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors shadow-sm"
                                    >
                                        <CheckCircle size={20} />
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

            {/* Details & Treat Modal */}
            {selectedAlert && (
                <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
                    <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <AlertTriangle size={24} className={['critique', 'haute'].includes(selectedAlert.severity?.toLowerCase()) ? 'text-red-500' : 'text-amber-500'} />
                                    Détails de l'Anomalie
                                </h2>
                            </div>
                            <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Type d'anomalie</p>
                                    <p className="text-xl font-black text-blue-900 capitalize">{selectedAlert.type}</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gravité</p>
                                    <div className="pt-1"><SeverityBadge severity={selectedAlert.severity} /></div>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Câble / Commande</p>
                                    <p className="text-lg font-bold text-slate-800">{selectedAlert.cableId?.substring(0, 16) || '—'}</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Détecté par</p>
                                    <p className="text-lg font-bold text-slate-800">{selectedAlert.technicianName || 'Système IA'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-amber-700">Date et Heure</span>
                                    <span className="font-black text-amber-900">{new Date(selectedAlert.detectedAt).toLocaleString()}</span>
                                </div>
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-emerald-700">Confiance IA</span>
                                    <span className="font-black text-emerald-900">{selectedAlert.confidence ? (selectedAlert.confidence * 100).toFixed(0) : 0}%</span>
                                </div>
                            </div>
                            
                            {selectedAlert.statut !== 'traitee' ? (
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Shield size={20} className="text-blue-500" />
                                        Traitement de l'alerte
                                    </h3>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mesure corrective prise</label>
                                    <textarea
                                        rows={3}
                                        className="input-field resize-none text-base p-4"
                                        placeholder="Décrivez la mesure corrective appliquée pour résoudre cette anomalie..."
                                        value={corrective}
                                        onChange={(e) => setCorrective(e.target.value)}
                                    />
                                    <div className="flex gap-4 pt-6">
                                        <button
                                            onClick={() => setSelectedAlert(null)}
                                            className="flex-1 btn-secondary py-3 text-base"
                                        >
                                            Fermer
                                        </button>
                                        <button
                                            onClick={handleTreat}
                                            className="flex-1 btn-primary py-3 text-base flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Confirmer le traitement
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                                    <h3 className="text-base font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-emerald-600" />
                                        Alerte Traitée
                                    </h3>
                                    <p className="text-sm text-emerald-700 mb-4 font-medium">Cette anomalie a été traitée avec succès.</p>
                                    {selectedAlert.mesureCorrective && (
                                        <div className="p-4 bg-white/60 rounded-xl border border-emerald-200/50">
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Mesure corrective</p>
                                            <p className="text-emerald-900 font-medium">{selectedAlert.mesureCorrective}</p>
                                        </div>
                                    )}
                                    <div className="pt-6">
                                        <button onClick={() => setSelectedAlert(null)} className="w-full btn-secondary py-3 text-base">
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;
