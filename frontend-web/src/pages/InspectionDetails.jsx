import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Calendar, User, Package, Image as ImageIcon } from 'lucide-react';
import { InspectionService, AnomalyService, OrderService } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    const handleValidate = async () => {
        if (!window.confirm("Voulez-vous valider manuellement cette inspection comme 'Conforme' ?")) return;
        
        try {
            setLoading(true);
            await InspectionService.update(id, { status: 'Conforme' });
            
            // Re-fetch data to reflect changes
            const insRes = await InspectionService.getById(id);
            setInspection(insRes.data);
            alert("Inspection validée avec succès !");
        } catch (error) {
            console.error("Erreur validation", error);
            alert("Erreur lors de la validation");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('ICEM QUALITY CONTROL', 14, 18);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`RAPPORT D'INSPECTION - CÂBLE: ${inspection?.reference || id.substring(0, 8)}`, 14, 28);
            
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(12);
            doc.text(`Ordre de Fabrication: ${inspection?.orderId || 'Non défini'}`, 14, 50);
            doc.text(`Technicien: ${inspection?.technicianName || 'Système IA'}`, 14, 58);
            doc.text(`Date: ${inspection?.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'En attente'}`, 14, 66);
            doc.text(`Statut: ${inspection?.status || 'En attente'}`, 14, 74);
            
            if (anomalies.length > 0) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Défauts Détectés', 14, 90);
                
                const tableData = anomalies.map(a => [
                    a.type || 'Inconnu',
                    a.severity || 'Mineur',
                    a.confidence ? `${(a.confidence * 100).toFixed(0)}%` : '—',
                    a.location || 'Non précisée'
                ]);
                
                doc.autoTable({
                    startY: 95,
                    head: [['Type', 'Gravité', 'Confiance IA', 'Localisation']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
                    margin: { left: 14, right: 14 }
                });
            } else {
                doc.setFontSize(12);
                doc.setTextColor(16, 185, 129); // Emerald 500
                doc.text('Aucune anomalie détectée. Câble conforme.', 14, 90);
            }
            
            doc.save(`Rapport_Inspection_${inspection?.reference || id}.pdf`);
        } catch (err) {
            console.error("Erreur PDF:", err);
            alert("Impossible de générer le PDF.");
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Chargement de l'inspection...</div>;

    return (
        <div className="flex flex-col gap-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-accent transition-colors font-bold text-base w-fit"
            >
                <ArrowLeft size={24} />
                Retour
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-4xl font-black text-slate-900">Inspection #{inspection?.reference || id.substring(0, 8)}</h1>
                        <span className={`px-4 py-1.5 border-2 rounded-xl text-sm font-black uppercase ${inspection?.status === 'Conforme' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                inspection?.status === 'Non conforme' ? 'bg-red-50 text-red-600 border-red-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {inspection?.status}
                        </span>
                    </div>
                    <p className="text-slate-600 text-lg font-medium flex items-center gap-2">
                        <Package size={24} /> Rapport d'inspection pour l'ordre <span className="text-blue-600 font-bold underline cursor-pointer">{inspection?.orderId}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExportPDF}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-200 transition-all"
                    >
                        Imprimer Rapport
                    </button>
                    <button
                        className="btn-primary px-8"
                        onClick={handleValidate}
                        disabled={inspection?.status === 'Conforme'}
                    >
                        {inspection?.status === 'Conforme' ? 'Inspection Validée' : 'Valider Inspection'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex flex-col gap-2 p-6 bg-blue-50/40 border border-blue-100">
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                        <User size={20} /> Technicien
                    </p>
                    <p className="text-2xl font-black text-slate-900">{inspection?.technicianName || inspection?.technicianId || 'IA System'}</p>
                </div>
                <div className="card flex flex-col gap-2 p-6 bg-slate-50 border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={20} /> Date de contrôle
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                        {inspection?.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString() : 'En attente'}
                    </p>
                </div>
                <div className="card flex flex-col gap-2 p-6 bg-slate-50 border border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={20} /> Défauts détectés
                    </p>
                    <p className={`text-3xl font-black ${anomalies.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {anomalies.length}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-4">
                <AlertTriangle size={32} className="text-red-500" />
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
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-black text-slate-900 capitalize">{anomaly.type}</h3>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase text-white ${anomaly.severity === 'Critique' ? 'bg-red-500 shadow-lg shadow-red-500/30' :
                                            anomaly.severity === 'Majeur' ? 'bg-amber-500 shadow-lg shadow-amber-500/30' :
                                                'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                        }`}>
                                        Gravité {anomaly.severity}
                                    </span>
                                </div>
                                <p className="text-base text-slate-700 font-medium leading-relaxed mb-6">
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
