import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Calendar, User, Package, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { InspectionService, AnomalyService, OrderService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const InspectionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, canEdit } = useAuth();
    const [inspection, setInspection] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

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

    const handleExportPDF = async () => {
        const toastId = toast.loading("Génération du certificat d'inspection...");
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // ─── 1. HEADER ───
            pdf.setTextColor(30, 58, 138); // blue-900
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ICEM QUALITY CONTROL', 15, 20);
            pdf.setTextColor(100, 116, 139); // grey-500
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Système de Surveillance Industrielle IA', 15, 25);

            const dateStr = inspection?.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR');
            pdf.text(`Rapport généré le ${dateStr}`, pageWidth - 15, 20, { align: 'right' });
            pdf.setFont('helvetica', 'bold');
            pdf.text('REF: FOR QUA 06 / V07', pageWidth - 15, 25, { align: 'right' });

            // ─── 2. TITLE BOX ───
            pdf.setFillColor(30, 58, 138);
            pdf.roundedRect(15, 35, pageWidth - 30, 10, 1.5, 1.5, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text("CERTIFICAT D'INSPECTION INTELLIGENTE", pageWidth / 2, 41.5, { align: 'center' });

            // ─── 3. SUMMARY BOX ───
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(15, 50, pageWidth - 30, 25, 2, 2, 'D');

            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(7);
            pdf.text('TECHNICIEN :', 18, 56);
            pdf.text('RÉFÉRENCE CÂBLE :', 18, 63);
            pdf.text('ORDRE DE FABRICATION :', 18, 70);

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.text(inspection?.technicianName || 'Inconnu', 50, 56);
            pdf.text(inspection?.reference || id || 'N/A', 50, 63);
            pdf.text(inspection?.orderId || 'N/A', 55, 70);

            pdf.setDrawColor(226, 232, 240);
            pdf.line(pageWidth / 2, 52, pageWidth / 2, 73);

            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(7);
            pdf.text('NB ANOMALIES :', pageWidth / 2 + 5, 56);
            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.text(String(anomalies.length || 0), pageWidth / 2 + 30, 56);

            const isConform = inspection?.status === 'Conforme';
            pdf.setFillColor(isConform ? 220 : 254, isConform ? 252 : 226, isConform ? 231 : 226); // green-100 or red-100
            pdf.roundedRect(pageWidth / 2 + 5, 62, 40, 7, 1, 1, 'F');
            pdf.setTextColor(isConform ? 20 : 153, isConform ? 83 : 27, isConform ? 45 : 27); // green-900 or red-900
            pdf.setFontSize(8);
            pdf.text(isConform ? 'CONFORME' : 'NON CONFORME', pageWidth / 2 + 25, 67, { align: 'center' });

            let nextY = 85;

            // ─── 4. IMAGE ───
            const imgUrl = anomalies.length > 0 ? anomalies[0].imageUrl : null;

            if (imgUrl && imgUrl.startsWith('data:image')) {
                pdf.setTextColor(30, 58, 138);
                pdf.setFontSize(9);
                pdf.text("CAPTURE DE L'ANOMALIE (IA)", 15, nextY);
                nextY += 5;
                
                try {
                    // Center the image
                    const imgWidth = 100;
                    const imgHeight = 70;
                    const xPos = (pageWidth - imgWidth) / 2;
                    pdf.addImage(imgUrl, 'JPEG', xPos, nextY, imgWidth, imgHeight);
                    pdf.setDrawColor(203, 213, 225);
                    pdf.roundedRect(xPos, nextY, imgWidth, imgHeight, 2, 2, 'D');
                    nextY += imgHeight + 15;
                } catch (e) {
                    nextY += 10;
                }
            } else {
                nextY += 5;
            }

            // ─── 5. DATA TABLE ───
            pdf.setTextColor(30, 58, 138);
            pdf.setFontSize(9);
            pdf.text('DÉTAILS DU CONTRÔLE VISUEL (FOR QUA 06)', 15, nextY);
            
            const tableBody = anomalies.length > 0 
                ? anomalies.map(a => [inspection?.reference || id || 'N/A', a.type || 'Défaut détecté', 'Non conforme'])
                : [[inspection?.reference || id || 'N/A', 'OK', 'Conforme']];

            autoTable(pdf, {
                startY: nextY + 3,
                head: [['N° SÉRIE', 'DÉFAUT(S)', 'STATUT']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, halign: 'center' },
                styles: { fontSize: 8, halign: 'center', cellPadding: 3 },
                columnStyles: { 2: { fontStyle: 'bold' } },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        data.cell.styles.textColor = data.cell.raw === 'Conforme' ? [21, 128, 61] : [185, 28, 28];
                    }
                }
            });

            // ─── 6. SIGNATURES ───
            const sigY = pdf.lastAutoTable.finalY + 15;
            pdf.setTextColor(71, 85, 105);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            
            pdf.text('SIGNATURE TECHNICIEN', 45, sigY, { align: 'center' });
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(15, sigY + 3, 60, 25, 2, 2, 'D');

            // Find tech signature
            const techSignature = inspection?.technicianId === user?.id ? user?.signatureUrl : null; // Basic fallback
            
            if (techSignature && techSignature.startsWith('data:image')) {
                try {
                    pdf.addImage(techSignature, 'PNG', 25, sigY + 5, 40, 20);
                } catch (err) {}
            } else {
                pdf.setTextColor(148, 163, 184);
                pdf.setFont('helvetica', 'italic');
                pdf.text(inspection?.technicianName || 'Signé', 45, sigY + 16, { align: 'center' });
            }

            pdf.setTextColor(71, 85, 105);
            pdf.setFont('helvetica', 'normal');
            pdf.text('SIGNATURE RESPONSABLE QUALITÉ', pageWidth - 45, sigY, { align: 'center' });
            pdf.roundedRect(pageWidth - 75, sigY + 3, 60, 25, 2, 2, 'D');

            // ─── 7. FOOTER ───
            pdf.setDrawColor(226, 232, 240);
            pdf.line(15, 285, pageWidth - 15, 285);
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(6);
            pdf.text('ICEM QA v2.0 — Certification IA Roboflow', 15, 289);
            pdf.text('Page 1/1', pageWidth - 15, 289, { align: 'right' });

            pdf.save(`Rapport_Inspection_${inspection?.reference || id}.pdf`);
            toast.success("Certificat d'inspection exporté avec succès", { id: toastId });
        } catch (err) {
            console.error("Erreur PDF:", err);
            toast.error("Impossible de générer le PDF.", { id: toastId });
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Synchronisation des données ICEM...</p>
        </div>
    );

    const isNonConforme = inspection?.status === 'Non conforme';
    const isConforme = inspection?.status === 'Conforme';

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-black text-sm uppercase tracking-widest px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md active:scale-95"
                >
                    <ArrowLeft size={18} />
                    Retour au Suivi
                </button>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleExportPDF}
                        className="px-6 py-3 bg-white text-indigo-600 font-black text-sm uppercase tracking-widest rounded-2xl border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                    >
                        <ImageIcon size={16} /> Exporter Rapport
                    </button>
                    {isConforme ? (
                        <button
                            className="px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg bg-emerald-500 text-white cursor-default shadow-emerald-200 flex items-center gap-2"
                            disabled
                        >
                            <CheckCircle2 size={16} />
                            Inspection Validée
                        </button>
                    ) : (
                        canEdit('cables') && (
                            <button
                                className="px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 shadow-blue-200"
                                onClick={handleValidate}
                            >
                                <ShieldCheck size={16} />
                                Valider le Dossier
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Premium Hero Header */}
            <div className="relative p-12 bg-white rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 overflow-hidden mb-12">
                {/* 🎨 Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-[0.2em] shadow-lg
                                ${isConforme ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 
                                  isNonConforme ? 'bg-red-600 text-white shadow-red-600/20 animate-pulse' : 
                                  'bg-amber-500 text-white shadow-amber-500/20'}`}>
                                {inspection?.status}
                            </span>
                            <div className="h-[2px] w-12 bg-slate-100"></div>
                            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Certification Qualité ICEM</span>
                        </div>
                        
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">
                            Rapport d'Inspection <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">#{inspection?.reference || id.substring(0, 8)}</span>
                        </h1>
                        
                        <div className="flex flex-wrap gap-6">
                            <div className="px-6 py-4 bg-slate-50 rounded-[24px] border border-slate-100">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Ordre de Fabrication</p>
                                <p className="text-lg font-black text-slate-900 underline decoration-indigo-200 decoration-4 underline-offset-4">{inspection?.orderId}</p>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 rounded-[24px] border border-slate-100">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Anomalies</p>
                                <p className={`text-lg font-black ${anomalies.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {anomalies.length} Détectée{anomalies.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[320px]">
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-[32px] border border-indigo-100/50 shadow-sm flex flex-col gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Contrôleur</p>
                                <p className="text-sm font-black text-slate-900 truncate">
                                    {inspection?.technicianName || (inspection?.technicianId ? `ID:${inspection.technicianId.substring(0, 8)}` : 'System IA')}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-[32px] border border-blue-100/50 shadow-sm flex flex-col gap-3">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1">Date du Contrôle</p>
                                <p className="text-sm font-black text-slate-900">
                                    {inspection?.inspectionDate ? new Date(inspection.inspectionDate).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'En attente'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Defects Analysis Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analyse Diagnostique</h2>
                </div>

                {anomalies.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {anomalies.map((anomaly, index) => (
                            <div key={index} className="group relative bg-white rounded-[44px] border border-white shadow-xl shadow-indigo-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col md:flex-row">
                                {/* Defect Status Sidebar (Thin colored bar) */}
                                <div className={`w-2 h-full absolute left-0 top-0 
                                    ${anomaly.severity === 'Critique' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                                      anomaly.severity === 'Majeur' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                                      'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}>
                                </div>

                                {/* Visual Data */}
                                <div className="w-full md:w-[320px] h-[320px] bg-slate-50 relative overflow-hidden">
                                    {anomaly.imageUrl ? (
                                        <>
                                            <img 
                                                src={anomaly.imageUrl} 
                                                alt={anomaly.type}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                                                onClick={() => setSelectedImage(anomaly.imageUrl)}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
                                            <div className="absolute top-6 left-8 bg-white/20 backdrop-blur-md text-white text-sm font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-xl border border-white/20">
                                                Visualisation IA
                                            </div>
                                            <button 
                                                onClick={() => setSelectedImage(anomaly.imageUrl)}
                                                className="absolute bottom-6 left-8 flex items-center gap-3 text-white text-sm font-black uppercase tracking-[0.2em]"
                                            >
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-lg">
                                                    <ImageIcon size={18} />
                                                </div>
                                                Agrandir l'image
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                            <ImageIcon size={64} className="opacity-10" />
                                            <span className="text-sm font-black uppercase tracking-widest">Image Indisponible</span>
                                        </div>
                                    )}
                                </div>

                                {/* Descriptive Data */}
                                <div className="flex-1 p-10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-4 mb-8">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 capitalize tracking-tight mb-2">{anomaly.type}</h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Zone: {anomaly.location || "Module-A"}</p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg
                                                ${anomaly.severity === 'Critique' ? 'bg-red-500 text-white shadow-red-200' : 
                                                  anomaly.severity === 'Majeur' ? 'bg-amber-500 text-white shadow-amber-200' : 
                                                  'bg-emerald-500 text-white shadow-emerald-200'}`}>
                                                {anomaly.severity}
                                            </span>
                                        </div>
                                        <p className="text-base text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-50 pl-6 mb-8">
                                            "{anomaly.description || "Le système de vision artificielle a détecté une anomalie de conformité nécessitant une intervention immédiate."}"
                                        </p>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all duration-500">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Confiance Systémique</p>
                                            <p className="text-2xl font-black text-indigo-600">{(anomaly.confidence * 100).toFixed(1)}%</p>
                                        </div>
                                        <div className="w-24 h-24 relative flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="48" cy="48" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8" className="opacity-30" />
                                                <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${anomaly.confidence * 238} 238`} className="text-indigo-600 transition-all duration-1000" strokeLinecap="round" />
                                            </svg>
                                            <ShieldCheck size={20} className="absolute text-indigo-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[50px] border border-emerald-100 p-24 flex flex-col items-center text-center gap-8 shadow-xl shadow-emerald-900/5">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-200/50 border-4 border-emerald-50 animate-bounce">
                            <ShieldCheck size={56} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Conformité Absolue</h3>
                            <p className="text-lg font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                                Le cycle d'inspection est terminé. Aucune déviation par rapport aux standards ICEM n'a été identifiée.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Enhancement */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-slate-900/96 backdrop-blur-xl flex items-center justify-center p-12 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-10 right-10 w-16 h-16 bg-white/10 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Diagnostique Haute Définition" 
                        className="max-w-full max-h-full rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/10 object-contain ring-12 ring-white/5"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default InspectionDetails;
