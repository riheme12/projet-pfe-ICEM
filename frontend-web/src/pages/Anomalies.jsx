import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, Search, CheckCircle, Clock, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnomalyService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import CustomSelect from '../components/CustomSelect';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 6;

const SeverityBadge = ({ severity }) => {
    const s = severity?.toLowerCase() || 'mineur';
    const config = {
        critique: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
        haute: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
        majeur: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
        moyenne: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
        mineur: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
        faible: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    };
    const c = config[s] || config.mineur;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
            {severity}
        </span>
    );
};

// ── Composant Pagination ──────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Génère les numéros à afficher (max 5 visibles, avec ellipsis)
    const getPageNumbers = () => {
        const delta = 2;
        const pages = [];
        const left = Math.max(1, currentPage - delta);
        const right = Math.min(totalPages, currentPage + delta);

        if (left > 1) {
            pages.push(1);
            if (left > 2) pages.push('...');
        }
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages) {
            if (right < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between mt-8 px-1">
            {/* Info */}
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Page <span className="text-slate-700">{currentPage}</span> / {totalPages}
            </p>

            {/* Boutons */}
            <div className="flex items-center gap-1.5">
                {/* Flèche gauche */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500
                               hover:bg-slate-900 hover:text-white hover:border-slate-900
                               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200
                               transition-all duration-200 shadow-sm"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>

                {/* Numéros */}
                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm">
                            ···
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all duration-200 shadow-sm border
                                ${currentPage === page
                                    ? 'bg-slate-900 text-white border-slate-900 scale-105'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Flèche droite */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500
                               hover:bg-slate-900 hover:text-white hover:border-slate-900
                               disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200
                               transition-all duration-200 shadow-sm"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

// ── Page principale ───────────────────────────────────────────────────────────
const Anomalies = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('Tous');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

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

    const { canExport } = useAuth();

    // Filtrage
    const filteredAnomalies = anomalies.filter(a => {
        const matchSearch = searchTerm === '' ||
            a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.cableId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSeverity = filterSeverity === 'Tous' || a.severity?.toLowerCase() === filterSeverity.toLowerCase();
        return matchSearch && matchSeverity;
    });

    // Remettre à la page 1 quand le filtre change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterSeverity]);

    // Pagination
    const totalPages = Math.ceil(filteredAnomalies.length / ITEMS_PER_PAGE);
    const paginatedAnomalies = filteredAnomalies.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Anomalies Qualité"
                subtitle={`Suivi des défauts détectés par l'intelligence artificielle — ${anomalies.length} anomalie${anomalies.length !== 1 ? 's' : ''}`}
                icon={<AlertCircle />}
                actions={
                    canExport && (
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-sm"
                        >
                            <Download size={18} />
                            Exporter les détails
                        </button>
                    )
                }
            />

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-3.5 rounded-xl border border-slate-100" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.03)' }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par type ou câble..."
                        className="input-field pl-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CustomSelect
                    className="w-full md:w-64"
                    options={[
                        { value: 'Tous', label: 'Toutes les gravités' },
                        { value: 'Critique', label: 'Critique' },
                        { value: 'Majeur', label: 'Majeur' },
                        { value: 'Moyenne', label: 'Moyenne' },
                        { value: 'Mineur', label: 'Mineur' },
                    ]}
                    value={filterSeverity}
                    onChange={setFilterSeverity}
                />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Analyse des défauts en cours...</p>
                    </div>
                ) : paginatedAnomalies.length > 0 ? (
                    paginatedAnomalies.map((anomaly) => {
                        const isCritical = anomaly.severity?.toLowerCase() === 'critique' || anomaly.severity?.toLowerCase() === 'haute';
                        const isMajor = anomaly.severity?.toLowerCase() === 'majeur' || anomaly.severity?.toLowerCase() === 'moyenne';
                        const isTraitee = anomaly.statut === 'traitee';

                        return (
                            <div key={anomaly.id} className={`group relative bg-white rounded-[32px] border transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 flex flex-col h-full overflow-hidden
                                ${isCritical ? 'border-red-100 bg-gradient-to-b from-red-50/30 to-white' :
                                  isMajor ? 'border-amber-100 bg-gradient-to-b from-amber-50/30 to-white' :
                                  'border-slate-100 hover:border-blue-200'}`}>

                                {/* Header Color Stripe */}
                                <div className={`h-1.5 w-full ${isCritical ? 'bg-red-500' : isMajor ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                                {/* Photo de l'inspection */}
                                <div className="relative h-56 m-3 overflow-hidden rounded-[24px] bg-slate-100">
                                    {anomaly.imageUrl ? (
                                        <>
                                            <img
                                                src={anomaly.imageUrl}
                                                alt={anomaly.type}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => setSelectedImage(anomaly.imageUrl)}
                                            />
                                            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-sm font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-xl border border-white/10">
                                                ANALYSE IA
                                            </div>
                                            <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 text-white text-sm font-black shadow-lg
                                                ${anomaly.confidence > 0.8 ? 'bg-emerald-600/80' : anomaly.confidence > 0.5 ? 'bg-amber-600/80' : 'bg-red-600/80'}`}>
                                                {(anomaly.confidence * 100).toFixed(0)}% CONFIANCE
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <AlertCircle size={44} className="opacity-10" />
                                            <span className="text-sm font-black uppercase tracking-widest">Aucun visuel disponible</span>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 pb-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h3 className="text-xl font-black text-slate-900 capitalize tracking-normal group-hover:text-blue-700 transition-colors">{anomaly.type}</h3>
                                        <SeverityBadge severity={anomaly.severity} />
                                    </div>

                                    <p className="text-sm font-medium text-slate-500 mb-6 line-clamp-2 leading-relaxed italic">
                                        "{anomaly.description || 'Anomalie détectée lors du contrôle automatique par vision artificielle.'}"
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all duration-500">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Câble / OF</p>
                                            <p className="text-sm font-black text-slate-900">#{anomaly.cableId?.substring(0, 10) || '—'}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                                            <p className="text-sm font-black text-blue-700 truncate">{anomaly.technicianName || 'Auto System'}</p>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span className="text-sm font-black text-slate-600 uppercase tracking-widest">
                                                    {anomaly.detectedAt ? new Date(anomaly.detectedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {isTraitee ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                                        <CheckCircle size={14} strokeWidth={3} />
                                                        <span className="text-sm font-black uppercase tracking-widest">Traitée</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-amber-600">
                                                        <Clock size={14} strokeWidth={3} />
                                                        <span className="text-sm font-black uppercase tracking-widest">En attente</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {anomaly.mesureCorrective && (
                                        <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <p className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-1">Mesure corrective</p>
                                            <p className="text-sm font-bold text-emerald-900 italic">"{anomaly.mesureCorrective}"</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-auto">
                                        <button
                                            onClick={() => navigate(`/inspections/${anomaly.inspectionId || anomaly.cableId}`)}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-black text-slate-700 bg-white hover:bg-slate-900 hover:text-white rounded-2xl transition-all border border-slate-200 shadow-sm active:scale-95"
                                        >
                                            <Eye size={18} />
                                            Détails de l'anomalie
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-white/60 backdrop-blur-md rounded-[40px] border border-white p-20 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 border border-emerald-100">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-normal">Zone de Sécurité</h3>
                            <p className="text-slate-500 font-bold max-w-xs mx-auto">Aucune anomalie détectée. La qualité de production est conforme aux standards ICEM.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && filteredAnomalies.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
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
