import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Search, Filter, Clock, Shield, ChevronDown, X, Zap } from 'lucide-react';
import { AnomalyService } from '../services/api';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';

const SeverityBadge = ({ severity }) => {
    const s = severity?.toLowerCase() || 'moyenne';
    const config = {
        critique: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
        haute: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },
        moyenne: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-600' },
        majeur: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-600' },
        faible: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
        mineur: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-600' },
    };
    const c = config[s] || config.moyenne;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
            {severity}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase() || 'detectee';
    const config = {
        detectee: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Détectée' },
        en_traitement: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'En traitement' },
        traitee: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Traitée' },
        archivee: { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-300', label: 'Archivée' },
    };
    const c = config[s] || config.detectee;
    return (
        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${c.bg} ${c.text} ${c.border}`}>
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

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await AnomalyService.getAll();
            const allAnomalies = response.data || [];
            // Tri par date décroissante pour le monitoring
            const sorted = allAnomalies.sort((a, b) => 
                new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0)
            );
            setAlerts(sorted);
        } catch (error) {
            console.error("Erreur chargement alertes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchAlerts(); 
        
        // Real-time listener for new alerts via notifications collection
        // to avoid downloading large Base64 images from anomaly collection
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty && !loading) {
                fetchAlerts();
            }
        });

        return () => unsubscribe();
    }, []);

    // On affiche uniquement les alertes critiques
    const filteredAlerts = alerts.filter(a => a.severity?.toLowerCase() === 'critique');

    const activeCount = filteredAlerts.filter(a => a.statut !== 'traitee' && a.statut !== 'archivee').length;
    const criticalCount = filteredAlerts.filter(a => ['critique', 'haute'].includes(a.severity?.toLowerCase())).length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                title="Registre des Anomalies"
                subtitle="Flux complet de surveillance et suivi des non-conformités détectées"
                icon={<Bell />}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-sm font-black text-red-700">{criticalCount} Critiques</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                            <Bell size={16} className="text-amber-600" />
                            <span className="text-sm font-black text-amber-700">{activeCount} Actives</span>
                        </div>
                    </div>
                }
            />

            {/* Alerts List */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="card py-24 text-center">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Surveillance ICEM en cours...</p>
                    </div>
                ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert, index) => {
                        const isCritical = ['critique', 'haute'].includes(alert.severity?.toLowerCase());
                        const isTraitee = alert.statut === 'traitee';
                        
                        return (
                            <div key={alert.id} 
                                 onClick={() => setSelectedAlert(alert)}
                                 className={`group relative bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/80 p-6 flex flex-col lg:flex-row lg:items-center gap-6 cursor-pointer transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(30,27,75,0.15)] hover:-translate-y-1.5 overflow-hidden
                                 ${isCritical && !isTraitee ? 'ring-2 ring-red-500/30 bg-red-50/40' : 'hover:bg-white'}`}>
                                
                                {/* Severity Edge Indicator with Glow */}
                                <div className={`absolute left-0 top-0 bottom-0 w-2.5 transition-all duration-500 group-hover:w-3
                                    ${isCritical ? 'bg-red-500 shadow-[4px_0_15px_rgba(239,68,68,0.3)]' : 'bg-amber-400 shadow-[4px_0_15px_rgba(245,158,11,0.2)]'}`}></div>

                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    {/* Icon Container with Animated Glow */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`absolute inset-0 blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-700
                                            ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                        <div className={`relative w-16 h-16 rounded-[22px] flex items-center justify-center border-2 transition-all duration-500 group-hover:scale-110
                                            ${isCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {isTraitee ? <CheckCircle size={32} strokeWidth={2.5} /> : <AlertTriangle size={32} strokeWidth={2.5} />}
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-[19px] font-black text-slate-900 capitalize tracking-tight group-hover:text-blue-600 transition-colors">{alert.type}</h3>
                                            {isTraitee ? (
                                                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-black uppercase rounded-lg shadow-sm shadow-emerald-200 tracking-widest border border-emerald-400/20">RÉSOLU</span>
                                            ) : isCritical && (
                                                <span className="px-3 py-1 bg-red-600 text-white text-sm font-black uppercase rounded-lg shadow-sm shadow-red-200 tracking-widest animate-pulse">ACTION REQUISE</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[13px] font-bold text-slate-500 flex-wrap">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                                                <Shield size={14} className="text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-slate-400">Câble:</span>
                                                <span className="text-slate-900">{alert.cableId || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                                                <Clock size={14} className="text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-slate-900">{alert.technicianName || 'Surveillance IA'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-wrap lg:justify-end">
                                    <SeverityBadge severity={alert.severity} />
                                    
                                    <div className="flex flex-col items-end gap-1 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[120px]">
                                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Détecté le</span>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-blue-500" />
                                            <span className="text-[13px] font-black text-slate-900">
                                                {alert.detectedAt ? new Date(alert.detectedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isTraitee ? (
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                                                <CheckCircle size={20} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                                                <Clock size={20} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card flex flex-col items-center py-24 text-center">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-inner">
                            <Shield size={48} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Système de Surveillance OK</h3>
                        <p className="text-slate-400 font-bold max-w-sm mx-auto">Aucune anomalie détectée pour le moment. Votre chaîne de production est conforme aux standards qualité.</p>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAlert(null)}>
                    <div className={`bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(30,27,75,0.2)] w-full ${selectedAlert.imageUrl ? 'max-w-4xl md:flex-row' : 'max-w-2xl'} max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300`} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Left Side: Visual Context (Only if image exists) */}
                        {selectedAlert.imageUrl && (
                            <div className="w-full md:w-1/2 relative min-h-[400px] flex flex-col justify-end p-8 lg:p-12 overflow-hidden bg-black">
                                <img 
                                    src={selectedAlert.imageUrl} 
                                    alt="Anomaly" 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                                {/* Gradient overlay for readable text */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border shadow-sm backdrop-blur-md bg-white/15 text-white border-white/20">
                                            Gravité {selectedAlert.severity}
                                        </span>
                                        <span className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border shadow-sm backdrop-blur-md bg-white/15 text-white border-white/20">
                                            Confiance {selectedAlert.confidence ? (selectedAlert.confidence * 100).toFixed(0) : 100}%
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-black capitalize leading-[1.1] tracking-tight text-white drop-shadow-lg">
                                        {selectedAlert.type}
                                    </h2>
                                </div>
                                
                                <button 
                                    onClick={() => setSelectedAlert(null)}
                                    className="absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-all z-20 shadow-xl backdrop-blur-xl border bg-white/10 hover:bg-white/20 text-white border-white/20"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        )}

                        {/* Right Side: Data & Actions */}
                        <div className={`w-full ${selectedAlert.imageUrl ? 'md:w-1/2' : ''} p-8 lg:p-12 overflow-y-auto`}>
                            <div className="flex flex-col h-full">
                                
                                {/* Header for No-Image variant */}
                                {!selectedAlert.imageUrl && (
                                    <div className="mb-10 relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border border-slate-200 bg-slate-50 text-slate-600">
                                                Gravité {selectedAlert.severity}
                                            </span>
                                            <span className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest border border-blue-200 bg-blue-50 text-blue-600">
                                                Testeur Automatique
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black capitalize leading-[1.1] tracking-tight text-slate-900 pr-16 drop-shadow-sm">
                                            {selectedAlert.type}
                                        </h2>
                                        
                                        <button 
                                            onClick={() => setSelectedAlert(null)}
                                            className="absolute top-0 right-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 shadow-sm"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Spécifications Techniques</h3>
                                    
                                    <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-80">Identifiant Câble</p>
                                            <p className="text-2xl font-black bg-gradient-to-br from-[#1e1b4b] to-blue-800 bg-clip-text text-transparent tracking-tighter">{selectedAlert.cableId || '—'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-80">Localisation</p>
                                            <p className="text-2xl font-black bg-gradient-to-br from-[#1e1b4b] to-blue-800 bg-clip-text text-transparent tracking-tighter">{selectedAlert.location || 'Atelier ICEM'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-80">Date de détection</p>
                                            <p className="text-2xl font-black bg-gradient-to-br from-[#1e1b4b] to-blue-800 bg-clip-text text-transparent tracking-tighter">
                                                {selectedAlert.detectedAt ? new Date(selectedAlert.detectedAt).toLocaleDateString('fr-FR') : '—'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-80">Heure précise</p>
                                            <p className="text-2xl font-black bg-gradient-to-br from-[#1e1b4b] to-blue-800 bg-clip-text text-transparent tracking-tighter">
                                                {selectedAlert.detectedAt ? new Date(selectedAlert.detectedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </p>
                                        </div>
                                        <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-5 rounded-2xl border border-blue-100/30">
                                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3 opacity-80">Responsable Qualité</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                                                    {(selectedAlert.technicianName || 'IA').substring(0, 1).toUpperCase()}
                                                </div>
                                                <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight drop-shadow-sm">{selectedAlert.technicianName || 'Surveillance IA Automatique'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-slate-100">
                                    <div className={`p-6 rounded-3xl border transition-all duration-500 ${
                                        selectedAlert.statut === 'traitee' 
                                            ? 'bg-emerald-50 border-emerald-100' 
                                            : 'bg-amber-50 border-amber-100'
                                    }`}>
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                selectedAlert.statut === 'traitee' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                            }`}>
                                                {selectedAlert.statut === 'traitee' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${
                                                    selectedAlert.statut === 'traitee' ? 'text-emerald-600' : 'text-amber-600'
                                                }`}>Statut de résolution</p>
                                                <p className="text-xl font-black text-slate-900">
                                                    {selectedAlert.statut === 'traitee' ? 'Anomalie Résolue' : 'En attente de traitement'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {selectedAlert.statut === 'traitee' ? (
                                            <div className="bg-white/60 p-5 rounded-2xl border border-emerald-100">
                                                <p className="text-base italic text-slate-700 font-medium leading-relaxed">
                                                    "{selectedAlert.mesureCorrective || 'Le technicien a confirmé la mise en conformité du câble.'}"
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-base font-medium text-amber-700/80 leading-relaxed mt-2">
                                                Cette anomalie nécessite une intervention physique sur la ligne de production pour validation et correction.
                                            </p>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => setSelectedAlert(null)}
                                        className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-[0.98] border border-blue-500/20"
                                    >
                                        Fermer le registre
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;
