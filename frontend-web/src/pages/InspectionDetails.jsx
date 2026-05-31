import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Calendar, User, Package, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { InspectionService, AnomalyService, OrderService, UserService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const urlToBase64 = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error("Erreur conversion image base64:", err);
        return null;
    }
};


const InspectionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, canEdit } = useAuth();
    const [inspection, setInspection] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Inspection in web context is actually a Cable object
                const [insRes, anomRes, usersRes] = await Promise.all([
                    InspectionService.getById(id),
                    AnomalyService.getByCable(id),
                    UserService.getAll(),
                ]);
                setInspection(insRes.data);
                setAnomalies(anomRes.data || []);
                setUsers(usersRes.data || []);
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
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // ─── 1. HEADER ───
            const logoBase64 = await urlToBase64(logo);
            if (logoBase64) {
                pdf.addImage(logoBase64, 'PNG', 15, 12, 11, 11);
            }
            const headerTextX = logoBase64 ? 28 : 15;
            pdf.setTextColor(15, 23, 42); // slate-900
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ICEM', headerTextX, 18);
            
            pdf.setTextColor(100, 116, 139); // slate-500
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Smart Quality Control System', headerTextX, 22.5);

            // Right side of header
            const techName = inspection?.technicianName || 'Inconnu';
            const generatedDate = inspection?.inspectionDate || new Date();
            const dateObj = new Date(generatedDate);
            const dateText = dateObj.toLocaleDateString('fr-FR');
            const timeText = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Technicien : ${techName}`, pageWidth - 15, 15, { align: 'right' });
            
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Date : ${dateText}`, pageWidth - 15, 19, { align: 'right' });
            pdf.text(`Heure : ${timeText}`, pageWidth - 15, 23, { align: 'right' });

            // Blue horizontal line under header
            pdf.setDrawColor(37, 99, 235); // blue-600
            pdf.setLineWidth(0.6);
            pdf.line(15, 26, pageWidth - 15, 26);

            // ─── 2. TITLE BANNER ───
            pdf.setFillColor(15, 23, 42); // slate-900
            pdf.rect(15, 31, pageWidth - 30, 9, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text("RAPPORT D'INSPECTION DÉTAILLÉ", pageWidth / 2, 36.8, { align: 'center' });

            // Helper to draw section header
            const drawSectionHeader = (title, y) => {
                pdf.setFillColor(37, 99, 235); // blue-600
                pdf.rect(15, y, 1.5, 7, 'F');
                
                pdf.setFillColor(239, 246, 255); // blue-50
                pdf.rect(16.5, y, pageWidth - 31.5, 7, 'F');
                
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(8.5);
                pdf.setFont('helvetica', 'bold');
                pdf.text(title, 20, y + 4.8);
            };

            // ─── 3. SECTION 1: DÉTAILS DE L'INSPECTION ───
            let currentY = 46;
            drawSectionHeader("DÉTAILS DE L'INSPECTION", currentY);
            currentY += 7;

            // Details Container Box
            const detailsHeight = 35;
            pdf.setDrawColor(226, 232, 240); // slate-200
            pdf.setLineWidth(0.3);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(15, currentY + 3, pageWidth - 30, detailsHeight, 'FD');
            
            // Content inside Details Box
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'bold');
            
            let fieldY = currentY + 9;
            pdf.text('CÂBLE ID :', 20, fieldY);
            pdf.text('ORDRE ID :', 20, fieldY + 6);
            pdf.text('DATE :', 20, fieldY + 12);
            pdf.text('VERDICT :', 20, fieldY + 18);
            pdf.text('ANOMALIES :', 20, fieldY + 24);

            const cleanText = (str) => {
                if (!str) return 'N/A';
                return str.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&');
            };

            const cableIdVal = inspection?.reference || id || 'N/A';
            const orderIdVal = cleanText(inspection?.orderId);
            const dateVal = `${dateText} ${timeText}`;
            const verdictVal = inspection?.status || 'Inconnu';
            const anomaliesVal = String(anomalies.length || 0);

            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'normal');
            pdf.text(cableIdVal, 55, fieldY);
            pdf.text(orderIdVal, 55, fieldY + 6);
            pdf.text(dateVal, 55, fieldY + 12);
            
            const isConform = verdictVal === 'Conforme';
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(isConform ? 21 : 185, isConform ? 128 : 28, isConform ? 61 : 28);
            pdf.text(verdictVal.toUpperCase(), 55, fieldY + 18);

            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'normal');
            pdf.text(anomaliesVal, 55, fieldY + 24);

            currentY += detailsHeight + 8;

            // ─── 4. SECTION 2: OBSERVATIONS TECHNIQUES ───
            drawSectionHeader("OBSERVATIONS TECHNIQUES", currentY);
            currentY += 7;

            const obsHeight = 15;
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(15, currentY + 3, pageWidth - 30, obsHeight, 'FD');

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            
            const noteText = inspection?.notes || (isConform 
                ? "Inspection visuelle : aucune anomalie détectée."
                : `Inspection visuelle avec ${anomaliesVal} défaut(s) détecté(s).`);
            pdf.text(noteText, 20, currentY + 11);

            currentY += obsHeight + 8;

            // ─── 5. SECTION 3: PREUVE VISUELLE ───
            const rawImgUrl = anomalies.length > 0 ? anomalies[0].imageUrl : null;
            const imgUrl = await urlToBase64(rawImgUrl);

            if (imgUrl) {
                drawSectionHeader("PREUVE VISUELLE", currentY);
                currentY += 7;

                const imgBoxHeight = 65;
                pdf.setDrawColor(226, 232, 240);
                pdf.setFillColor(255, 255, 255);
                pdf.rect(15, currentY + 3, pageWidth - 30, imgBoxHeight, 'FD');

                try {
                    const imgWidth = 85;
                    const imgHeight = 55;
                    const xPos = (pageWidth - imgWidth) / 2;
                    pdf.addImage(imgUrl, 'JPEG', xPos, currentY + 8, imgWidth, imgHeight);
                } catch (e) {
                    console.error("Error adding anomaly image", e);
                }

                currentY += imgBoxHeight + 8;
            }

            // ─── 6. SECTION 4: SIGNATURES ───
            drawSectionHeader("SIGNATURES DES RESPONSABLES", currentY);
            currentY += 7;

            const sigBoxHeight = 30;
            const sigWidth = 80;
            
            // Left Box: Signature Technicien
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'bold');
            pdf.text('SIGNATURE TECHNICIEN', 15 + sigWidth/2, currentY + 2, { align: 'center' });
            
            pdf.setDrawColor(226, 232, 240);
            pdf.rect(15, currentY + 4, sigWidth, sigBoxHeight - 4, 'D');

            const techUser = users.find(u => u.id === inspection?.technicianId || u.fullName === inspection?.technicianName);
            const rawTechSig = inspection?.signatureUrl || techUser?.signatureUrl || (inspection?.technicianId === user?.id ? user?.signatureUrl : null);
            const techSignature = await urlToBase64(rawTechSig);
            
            if (techSignature) {
                try {
                    pdf.addImage(techSignature, 'PNG', 20, currentY + 6, sigWidth - 10, sigBoxHeight - 8);
                } catch (err) {}
            } else {
                pdf.setTextColor(148, 163, 184);
                pdf.setFont('helvetica', 'italic');
                pdf.text(techName, 15 + sigWidth/2, currentY + 16, { align: 'center' });
            }

            // Right Box: Signature Responsable Qualité
            pdf.setTextColor(100, 116, 139);
            pdf.setFont('helvetica', 'bold');
            pdf.text('SIGNATURE RESPONSABLE QUALITÉ', pageWidth - 15 - sigWidth/2, currentY + 2, { align: 'center' });
            
            pdf.rect(pageWidth - 15 - sigWidth, currentY + 4, sigWidth, sigBoxHeight - 4, 'D');

            const rawManagerSig = user?.signatureUrl;
            const managerSignature = await urlToBase64(rawManagerSig);
            
            if (managerSignature) {
                try {
                    pdf.addImage(managerSignature, 'PNG', pageWidth - 10 - sigWidth, currentY + 6, sigWidth - 10, sigBoxHeight - 8);
                } catch (err) {}
            } else {
                pdf.setTextColor(148, 163, 184);
                pdf.setFont('helvetica', 'italic');
                pdf.text(user?.fullName || 'Validé', pageWidth - 15 - sigWidth/2, currentY + 16, { align: 'center' });
            }

            // ─── 7. FOOTER ───
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.3);
            pdf.line(15, 280, pageWidth - 15, 280);
            
            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Document généré automatiquement — ICEM AI © 2026', 15, 286);
            pdf.text('Page 1/1', pageWidth - 15, 286, { align: 'right' });

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
                        <ImageIcon size={16} /> Exporter les détails
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
                        
                        <h1 className="text-5xl font-black text-slate-900 tracking-normal mb-6">
                            {anomalies.length > 0 ? "Détails de l'anomalie" : "Détails de l'inspection"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">#{inspection?.reference || id.substring(0, 8)}</span>
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
                    <h2 className="text-3xl font-black text-slate-900 tracking-normal">Analyse Diagnostique</h2>
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
                                                <h3 className="text-3xl font-black text-slate-900 capitalize tracking-normal mb-2">{anomaly.type}</h3>
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
                            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-normal">Conformité Absolue</h3>
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
