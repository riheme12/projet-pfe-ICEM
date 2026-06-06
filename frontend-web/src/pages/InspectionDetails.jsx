import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, ShieldCheck, Calendar, User, Package, Image as ImageIcon, X, ChevronDown, Cpu, Tag, Layers, FileText, Activity } from 'lucide-react';
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

const defectNamesMap = {
    'A': 'Cosse déformée', 'B': 'Cosse ébanchati', 'C': 'Cosse ouverte',
    'D': 'Fil pincé/coupé', 'E': 'Fils inversés', 'F': 'Fil tendu',
    'G': 'Fil sans cosse', 'H': 'Ticket élec. NC', 'I': 'Long./couleur NC',
    'J': 'Conn. cassé', 'K': 'Bouchette manq.', 'L': 'Tube thermo NC',
    'M': 'Protection manq.', 'N': 'Tube manqué', 'O': 'Vis mal serrée',
    'P': 'Composant manq.', 'Q': 'Fusible manq.', 'R': 'Gamme manq.',
    'S': 'Scotch mal exécuté', 'T': 'Mesure Dériv.', 'V': 'Étiquette manquante',
    'W': 'Étiquette inv.', 'Z': 'Autres défauts',
};

const getCleanDefectName = (rawKey) => {
    if (!rawKey) return 'Inconnu';
    let key = String(rawKey).trim();
    
    // 1. Remove "Défauts: " or "Défaut: " prefix if it exists
    if (key.startsWith('Défauts:') || key.startsWith('Défaut:')) {
      const codePart = key.split(':').pop().trim();
      const codes = codePart.split(',').map(c => c.trim().toUpperCase());
      const names = codes.map(c => defectNamesMap[c] || c);
      return names.join(', ');
    }
    
    // 2. Remove "[Code] " prefix if it exists (e.g. "[A] Cosse déformée" -> "Cosse déformée")
    const match = key.match(/^\[[A-Z]\]\s+(.+)$/);
    if (match) {
      return match[1];
    }
    
    // 3. Map raw Roboflow classes to clean names
    const classMapping = {
      'composant_mal_insere': 'Composant mal inséré',
      'composant_mal _insere': 'Composant mal inséré',
      'composant_manquant': 'Composant manquant',
      'etiquette_anomalie': 'Étiquette manquante',
      'protection_anomalie': 'Anomalie protection',
      'connecteur_anomalie': 'Anomalie connecteur',
      'cosse_anomalie': 'Anomalie cosse',
      'scotche_anomalie': 'Scotch mal exécuté',
      'anomalie scotch': 'Scotch mal exécuté',
      'anomalie étiquette': 'Étiquette manquante',
      'anomalie protection': 'Protection manquante',
      'anomalie connecteur': 'Connecteur cassé',
      'anomalie cosse': 'Cosse déformée',
    };
    
    const lowerKey = key.toLowerCase();
    if (classMapping[lowerKey]) {
      return classMapping[lowerKey];
    }
    
    return rawKey;
};

const getDefectDescription = (cleanType, rawDescription) => {
    if (rawDescription && rawDescription.trim().length > 0 && !rawDescription.includes("Le système de vision artificielle a détecté")) {
        return rawDescription;
    }
    
    const descriptions = {
        'étiquette manquante': "L'étiquette d'identification du câble est manquante, déchirée ou illisible sur le connecteur.",
        'anomalie étiquette': "L'étiquette de marquage présente un défaut de positionnement ou est manquante.",
        'scotch mal exécuté': "Le ruban adhésif (scotch) de protection n'est pas appliqué de manière homogène ou est effiloché.",
        'anomalie scotch': "Le ruban de protection (scotch) présente des irrégularités d'application ou de tension.",
        'composant manquant': "Un composant ou accessoire requis (ex: fusible, bouchon) est absent de l'assemblage.",
        'composant mal inséré': "Le fil conducteur ou le composant n'est pas entièrement inséré dans le boîtier du connecteur.",
        'anomalie protection': "La gaine isolante ou la protection thermique présente des déchirures ou un mauvais positionnement.",
        'anomalie connecteur': "Le boîtier du connecteur montre des signes de fissures ou de casse mécanique lors de l'assemblage.",
        'anomalie cosse': "La cosse métallique de raccordement est déformée, tordue ou mal sertie.",
        'autres défauts': "Défaut de conformité générale détecté lors de l'analyse visuelle de la pièce.",
    };
    
    const cleanKey = cleanType.toLowerCase().trim();
    for (const key of Object.keys(descriptions)) {
        if (cleanKey.includes(key) || key.includes(cleanKey)) {
            return descriptions[key];
        }
    }
    return "Défaut de conformité détecté et signalé pour analyse corrective par le responsable qualité.";
};

const getDefectSeverity = (cleanType, originalSeverity) => {
    const severities = {
        'composant mal inséré': 'Critique',
        'composant manquant': 'Critique',
        'anomalie connecteur': 'Critique',
        'connecteur cassé': 'Critique',
        
        'anomalie cosse': 'Majeur',
        'cosse déformée': 'Majeur',
        'anomalie protection': 'Majeur',
        'protection manquante': 'Majeur',
        
        'anomalie scotch': 'Mineur',
        'scotch mal exécuté': 'Mineur',
        'anomalie étiquette': 'Mineur',
        'étiquette manquante': 'Mineur',
    };
    
    const cleanKey = cleanType.toLowerCase().trim();
    for (const key of Object.keys(severities)) {
        if (cleanKey.includes(key) || key.includes(cleanKey)) {
            return severities[key];
        }
    }
    return originalSeverity || 'Majeur';
};

const InspectionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, canEdit } = useAuth();
    const [inspection, setInspection] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const getTechnicianName = () => {
        if (inspection?.technicianName && !inspection.technicianName.startsWith('ID:')) return inspection.technicianName;
        if (inspection?.technicianId) {
            const u = users.find(user => user.id === inspection.technicianId || user.username === inspection.technicianId);
            if (u) return u.fullName;
            return `ID: ${inspection.technicianId.substring(0, 8)}`;
        }
        return 'System IA';
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const searchParams = new URLSearchParams(location.search);
                const orderIdQuery = searchParams.get('orderId');

                // 1. Charger d'abord les détails de l'inspection/câble
                const insRes = await InspectionService.getById(id, orderIdQuery ? { orderId: orderIdQuery } : undefined);
                const cableData = insRes.data;
                setInspection(cableData);

                // 2. Charger les anomalies avec la référence ou le code résolu
                const cableIdentifier = cableData?.reference || cableData?.code || id;
                const resolvedOrderId = orderIdQuery || cableData?.orderId;

                const [anomRes, usersRes] = await Promise.all([
                    AnomalyService.getByCable(cableIdentifier, resolvedOrderId ? { orderId: resolvedOrderId } : undefined),
                    UserService.getAll(),
                ]);
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
            const resolvedTechUser = users.find(u => u.id === inspection?.technicianId || u.username === inspection?.technicianId);
            const techName = inspection?.technicianName && !inspection.technicianName.startsWith('ID:')
                ? inspection.technicianName
                : (resolvedTechUser?.fullName || (inspection?.technicianId ? `ID:${inspection.technicianId.substring(0, 8)}` : 'System IA'));
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

            const noteText = inspection?.notes || (isConform 
                ? "Inspection visuelle : aucune anomalie détectée."
                : `Inspection visuelle avec ${anomaliesVal} défaut(s) détecté(s).`);

            // Split text to fit the page width dynamically
            const splitNotes = pdf.splitTextToSize(noteText, pageWidth - 40);
            const obsHeight = Math.max(15, splitNotes.length * 4 + 6);

            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(255, 255, 255);
            pdf.rect(15, currentY + 3, pageWidth - 30, obsHeight, 'FD');

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(splitNotes, 20, currentY + 9);

            currentY += obsHeight + 8;

            // ─── 5. SECTION 3: PREUVE VISUELLE ───
            // Accumuler toutes les images d'anomalies
            const allImageUrls = [];
            anomalies.forEach(anom => {
                const urls = anom.imageUrls && anom.imageUrls.length > 0 
                    ? anom.imageUrls 
                    : (anom.imageUrl ? [anom.imageUrl] : []);
                urls.forEach(url => {
                    if (url && !allImageUrls.includes(url)) {
                        allImageUrls.push(url);
                    }
                });
            });

            const base64Images = [];
            for (const url of allImageUrls) {
                const b64 = await urlToBase64(url);
                if (b64) base64Images.push(b64);
            }

            if (base64Images.length > 0) {
                drawSectionHeader("PREUVE VISUELLE", currentY);
                currentY += 7;

                const rows = Math.ceil(base64Images.length / 2);
                const imgBoxHeight = rows * 60 + 5;
                pdf.setDrawColor(226, 232, 240);
                pdf.setFillColor(255, 255, 255);
                pdf.rect(15, currentY + 3, pageWidth - 30, imgBoxHeight, 'FD');

                try {
                    const imgWidth = 75;
                    const imgHeight = 48;
                    for (let i = 0; i < base64Images.length; i++) {
                        const row = Math.floor(i / 2);
                        const col = i % 2;
                        
                        let xPos;
                        if (base64Images.length === 1) {
                            xPos = (pageWidth - imgWidth) / 2;
                        } else {
                            const startX = 20;
                            const spacing = (pageWidth - 40 - (imgWidth * 2));
                            xPos = startX + col * (imgWidth + spacing);
                        }

                        const yPos = currentY + 8 + row * 55;
                        pdf.addImage(base64Images[i], 'JPEG', xPos, yPos, imgWidth, imgHeight);
                    }
                } catch (e) {
                    console.error("Error adding anomaly images to PDF", e);
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

            const techUser = users.find(u => u.id === inspection?.technicianId || u.username === inspection?.technicianId || u.fullName === inspection?.technicianName);
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

            {/* Premium Hero Header (Light Theme) */}
            <div className="relative rounded-[40px] overflow-hidden mb-12 shadow-xl shadow-slate-200/40 border border-white">

                {/* ── Light gradient banner top ── */}
                <div className="relative px-12 pt-10 pb-8 overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/70 to-blue-50/80 backdrop-blur-2xl">
                    {/* decorative grid lines */}
                    <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    {/* decorative blobs */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30 blur-[100px]" style={{ background: 'radial-gradient(circle, #e0e7ff, transparent)' }}></div>
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-35 blur-[80px]" style={{ background: 'radial-gradient(circle, #dbeafe, transparent)' }}></div>

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-8">
                        {/* Left: title + badges */}
                        <div className="flex-1">
                            {/* Status + label */}
                            <div className="flex items-center gap-3 mb-5">
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] border
                                    ${isConforme
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : isNonConforme
                                        ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isConforme ? 'bg-emerald-500' : isNonConforme ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                    {inspection?.status}
                                </span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Certification Qualité ICEM</span>
                            </div>

                            {/* Main title */}
                            <h1 className="text-4xl font-black tracking-tight mb-6 text-slate-900">
                                {anomalies.length > 0 ? "Détails de l'anomalie" : "Détails de l'inspection"}
                                <span className="ml-3 font-black text-indigo-600">
                                    #{inspection?.reference || id?.substring(0, 8) || '—'}
                                </span>
                            </h1>

                            {/* Info chips */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-100 bg-white/70 shadow-sm shadow-indigo-900/5">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Package size={13} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Ordre de Fabrication</p>
                                        <p className="text-sm font-black text-slate-800">{inspection?.orderId || '—'}</p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-sm shadow-indigo-900/5
                                    ${anomalies.length > 0 ? 'border-red-100 bg-red-50/50' : 'border-emerald-100 bg-emerald-50/50'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${anomalies.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <AlertCircle size={13} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Total Anomalies</p>
                                        <p className={`text-sm font-black ${anomalies.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {anomalies.length} Détectée{anomalies.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: metadata cards */}
                        <div className="flex flex-row lg:flex-col gap-3 min-w-[240px]">
                            {/* Technicien */}
                            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm shadow-indigo-900/5 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contrôleur</p>
                                    <p className="text-sm font-black text-slate-800 truncate">{getTechnicianName()}</p>
                                </div>
                            </div>
                            {/* Date */}
                            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/80 border border-slate-100 shadow-sm shadow-indigo-900/5 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                    <Calendar size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date du Contrôle</p>
                                    <p className="text-sm font-black text-slate-800">
                                        {inspection?.inspectionDate
                                            ? new Date(inspection.inspectionDate).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                            : 'En attente'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom colored accent bar ── */}
                <div className={`h-1.5 w-full ${isConforme ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : isNonConforme ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}></div>
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
                                <div className="w-full md:w-[320px] md:h-auto h-[320px] bg-slate-50 relative overflow-hidden flex flex-col justify-center">
                                    {(() => {
                                        const images = anomaly.imageUrls && anomaly.imageUrls.length > 0 
                                            ? anomaly.imageUrls 
                                            : (anomaly.imageUrl ? [anomaly.imageUrl] : []);
                                        if (images.length === 0) {
                                            return (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                                    <ImageIcon size={64} className="opacity-10" />
                                                    <span className="text-sm font-black uppercase tracking-widest">Image Indisponible</span>
                                                </div>
                                            );
                                        }
                                        if (images.length === 1) {
                                            return (
                                                <>
                                                    <img 
                                                        src={images[0]} 
                                                        alt={anomaly.type}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                                                        onClick={() => setSelectedImage(images[0])}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>
                                                    <button 
                                                        onClick={() => setSelectedImage(images[0])}
                                                        className="absolute bottom-6 left-8 flex items-center gap-3 text-white text-sm font-black uppercase tracking-[0.2em]"
                                                    >
                                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all shadow-lg">
                                                            <ImageIcon size={18} />
                                                        </div>
                                                        Agrandir l'image
                                                    </button>
                                                </>
                                            );
                                        }
                                        return (
                                            <div className="grid grid-cols-2 gap-1.5 p-2 h-full w-full bg-slate-100">
                                                {images.map((url, idx) => (
                                                    <div key={idx} className="relative overflow-hidden rounded-2xl bg-black group-inner h-full w-full">
                                                        <img 
                                                            src={url} 
                                                            alt={`${anomaly.type} - ${idx + 1}`}
                                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-115 cursor-zoom-in"
                                                            onClick={() => setSelectedImage(url)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Descriptive Data */}
                                <div className="flex-1 p-10 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-4 mb-8">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-900 capitalize tracking-normal mb-2">{getCleanDefectName(anomaly.type)}</h3>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Zone: {anomaly.location || "Module-A"}</p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg
                                                ${getDefectSeverity(getCleanDefectName(anomaly.type), anomaly.severity) === 'Critique' ? 'bg-red-500 text-white shadow-red-200' : 
                                                  getDefectSeverity(getCleanDefectName(anomaly.type), anomaly.severity) === 'Majeur' ? 'bg-amber-500 text-white shadow-amber-200' : 
                                                  'bg-emerald-500 text-white shadow-emerald-200'}`}>
                                                {getDefectSeverity(getCleanDefectName(anomaly.type), anomaly.severity)}
                                            </span>
                                        </div>
                                        <p className="text-base text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-200 pl-6 mb-8">
                                            "{getDefectDescription(getCleanDefectName(anomaly.type), anomaly.description)}"
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
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-slate-100/50">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <ShieldCheck size={28} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Conformité Absolue</h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    Le cycle d'inspection est terminé. Aucune déviation par rapport aux standards ICEM n'a été identifiée.
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Pièce Conforme
                            </span>
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
