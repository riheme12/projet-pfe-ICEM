import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Search, CheckCircle, Clock, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnomalyService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';

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
    const [selectedImage, setSelectedImage] = useState(null); // Nouveau : État pour le zoom image
    const navigate = useNavigate();
    const { canExport } = useAuth();


    const handleExportExcel = () => {
        const data = filteredAnomalies.map(a => ({
            'Type': a.type || '—',
            'Gravité': a.severity || '—',
            'Câble ID': a.cableId || '—',
            'Confiance IA (%)': a.confidence ? (a.confidence * 100).toFixed(0) : '0',
            'Par': a.technicianName || 'Auto System',
            'Date Détection': a.detectedAt ? new Date(a.detectedAt).toLocaleString('fr-FR') : '—',
            'Statut': a.statut === 'traitee' ? 'Traitée' : a.statut === 'en_traitement' ? 'En traitement' : 'Détectée',
            'Description': a.description || 'Anomalie détectée par IA',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Anomalies');
        // Ajuster la largeur des colonnes
        ws['!cols'] = [
            { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
            { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 35 },
        ];
        XLSX.writeFile(wb, `ICEM_Anomalies_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

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
                <div className="flex items-center gap-3">
                    {canExport && (
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                        >
                            <Download size={16} />
                            Export Excel
                        </button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-sm font-semibold text-red-700">{anomalies.length} anomalies</span>
                    </div>
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
                        <div key={anomaly.id} className="card group hover:border-slate-300 transition-all flex flex-col h-full">
                            {/* Photo de l'inspection */}
                            <div className="relative h-48 -mx-1 -mt-1 mb-4 overflow-hidden rounded-t-2xl bg-slate-100 border-b border-slate-100">
                                {anomaly.imageUrl ? (
                                    <>
                                        <img 
                                            src={anomaly.imageUrl} 
                                            alt={anomaly.type}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                            onClick={() => setSelectedImage(anomaly.imageUrl)}
                                        />
                                        <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">
                                            Vue IA
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                        <AlertCircle size={40} className="mb-2 opacity-20" />
                                        <span className="text-xs font-medium">Pas de photo disponible</span>
                                    </div>
                                )}
                            </div>

                            <div className="px-1 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 capitalize leading-tight">{anomaly.type}</h3>
                                    <SeverityBadge severity={anomaly.severity} />
                                </div>
                                
                                <p className="text-base text-slate-600 mb-4 line-clamp-2">{anomaly.description || 'Anomalie détectée par l\'IA'}</p>

                                <div className="flex flex-col gap-3 py-4 border-y border-slate-100 mb-4 bg-slate-50/50 px-3 rounded-xl">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">Câble / OF</span>
                                        <span className="text-slate-900 font-black text-base">#{anomaly.cableId?.substring(0, 10) || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-slate-400" />
                                            <span className="font-medium">{anomaly.detectedAt ? new Date(anomaly.detectedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                        </div>
                                        <span className="font-bold text-blue-700 px-2 py-1 bg-blue-100 rounded-lg">
                                            {anomaly.confidence ? (anomaly.confidence * 100).toFixed(0) : 0}% Confiance
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">Responsable</span>
                                        <span className="text-slate-900 font-black text-base">{anomaly.technicianName || 'Système IA'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                <button
                                    onClick={() => navigate(`/inspections/${anomaly.inspectionId || anomaly.cableId}`)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm"
                                >
                                    <Eye size={18} />
                                    Détails
                                </button>
                                {anomaly.statut !== 'traitee' && (
                                    <button
                                        onClick={() => setTreatModal(anomaly)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 shadow-sm"
                                    >
                                        <CheckCircle size={18} />
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
                                <div className="flex justify-between text-base">
                                    <span className="text-slate-500 font-medium">Type</span>
                                    <span className="font-bold text-slate-900 capitalize">{treatModal.type}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-slate-500 font-medium">Gravité</span>
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

            {/* Lightbox Modal (Zoom Image) */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Zoom anomalie" 
                        className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/20 object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default Anomalies;
