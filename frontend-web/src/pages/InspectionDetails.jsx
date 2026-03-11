import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Calendar, User, Package, Image as ImageIcon } from 'lucide-react';
import { InspectionService, AnomalyService, OrderService } from '../services/api';

const InspectionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inspection, setInspection] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Inspection in web context is actually a Cable object
                const insRes = await InspectionService.getById(id);
                setInspection(insRes.data);

                const anomRes = await AnomalyService.getByCable(id);
                setAnomalies(anomRes.data || []);
            } catch (error) {
                console.error("Erreur détails", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Chargement de l'inspection...</div>;

    return (
        <div className="flex flex-col gap-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-accent transition-colors font-bold text-sm w-fit"
            >
                <ArrowLeft size={18} />
                Retour
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-black text-slate-800">Inspection #{inspection?.reference || id.substring(0, 8)}</h1>
                        <span className={`px-3 py-1 border rounded-full text-xs font-black uppercase ${inspection?.status === 'Conforme' ? 'bg-success/10 text-success border-success/20' :
                                inspection?.status === 'Non conforme' ? 'bg-danger/10 text-danger border-danger/20' :
                                    'bg-warning/10 text-warning border-warning/20'
                            }`}>
                            {inspection?.status}
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <Package size={16} /> Rapport d'inspection pour l'ordre <span className="text-accent font-bold underline cursor-pointer">{inspection?.orderId}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-200 transition-all">
                        Imprimer Rapport
                    </button>
                    <button
                        className="btn-primary px-8"
                        onClick={() => alert("Fonctionnalité de validation manuelle en cours de développement")}
                    >
                        Valider Inspection
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex flex-col gap-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={14} /> Technicien
                    </p>
                    <p className="text-lg font-bold text-slate-800">{inspection?.technicianId || 'IA System'}</p>
                </div>
                <div className="card flex flex-col gap-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Date de contrôle
                    </p>
                    <p className="text-lg font-bold text-slate-800">
                        {inspection?.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'En attente'}
                    </p>
                </div>
                <div className="card flex flex-col gap-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Défauts détectés
                    </p>
                    <p className={`text-2xl font-black ${anomalies.length > 0 ? 'text-danger' : 'text-success'}`}>
                        {anomalies.length}
                    </p>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={24} className="text-danger" />
                Défauts Détectés ({anomalies.length})
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {anomalies.length > 0 ? anomalies.map((anomaly, index) => (
                    <div key={index} className="card !p-0 overflow-hidden flex flex-col md:flex-row border-slate-200 hover:border-accent group transition-all">
                        <div
                            className="w-full md:w-64 h-64 bg-slate-100 relative overflow-hidden bg-center bg-cover"
                            style={{ backgroundImage: `url(${anomaly.imageUrl || 'https://images.unsplash.com/photo-1621905235277-226871630ed6?q=80&w=500'})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                                <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Capture Caméra #{index + 1}</p>
                                <p className="text-sm font-black flex items-center gap-1">
                                    <ImageIcon size={14} /> Voir l'original
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-black text-slate-800 capitalize">{anomaly.type}</h3>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase text-white ${anomaly.severity === 'Critique' ? 'bg-danger shadow-lg shadow-danger/30' :
                                            anomaly.severity === 'Majeur' ? 'bg-warning shadow-lg shadow-warning/30' :
                                                'bg-success shadow-lg shadow-success/30'
                                        }`}>
                                        Gravité {anomaly.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                                    {anomaly.location || "Localisation non précisée."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confiance IA</p>
                                    <p className="text-xl font-black text-accent">{(anomaly.confidence * 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-1000"
                                        style={{ width: `${anomaly.confidence * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full card py-12 flex flex-col items-center justify-center text-slate-400 border-dashed border-2">
                        <ShieldCheck size={48} className="text-success opacity-20 mb-4" />
                        <p className="font-bold">Aucune anomalie à afficher pour cette inspection.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InspectionDetails;
