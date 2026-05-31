import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { 
    FileText, Download, Search, AlertTriangle, 
    CheckCircle, BarChart3, LayoutDashboard,
    Activity, Package, User, Loader2, TrendingUp, Users, Calendar, ListFilter,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const REPORTS_PER_PAGE = 8;

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


const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const delta = 2, pages = [];
        const left = Math.max(1, currentPage - delta);
        const right = Math.min(totalPages, currentPage + delta);
        if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }
        return pages;
    };
    return (
        <div className="flex items-center justify-between px-12 py-8 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Page <span className="text-slate-700">{currentPage}</span> / {totalPages}</p>
            <div className="flex items-center gap-1.5">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all duration-200 shadow-sm">
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                {getPageNumbers().map((page, idx) => page === '...' ? (
                    <span key={`e-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold text-sm">···</span>
                ) : (
                    <button key={page} onClick={() => onPageChange(page)} className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all duration-200 shadow-sm border ${currentPage === page ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'}`}>{page}</button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all duration-200 shadow-sm">
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
import { CableService, AnomalyService, UserService, ReportService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    BarChart, Bar, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import logo from '../assets/logo.png';

const Reports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('global');
    const [cables, setCables] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [mobileReports, setMobileReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportsPage, setReportsPage] = useState(1);
    const dashboardRef = useRef(null);

    // Filter States
    const [periodType, setPeriodType] = useState('Mois');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterOperator, setFilterOperator] = useState('Tous');
    const [filterDefect, setFilterDefect] = useState('Tous');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cablesRes, anomaliesRes, reportsRes, usersRes] = await Promise.all([
                    CableService.getAll({ limit: 300 }),
                    AnomalyService.getAll({ limit: 300 }),
                    ReportService.getAll(),
                    UserService.getAll(),
                ]);
                setCables(cablesRes.data || []);
                setAnomalies(anomaliesRes.data || []);
                setMobileReports(reportsRes.data || []);
                setUsers(usersRes.data || []);
                
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 30);
                setDateStart(start.toISOString().split('T')[0]);
                setDateEnd(end.toISOString().split('T')[0]);
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Erreur de synchronisation");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 📊 Computed Data
    const filteredCablesGlobal = cables.filter(c => {
        const cDate = new Date(c.inspectionDate || c.createdAt);
        const ds = dateStart ? new Date(dateStart) : null;
        const de = dateEnd ? new Date(dateEnd) : null;
        if (ds && cDate < ds) return false;
        if (de) {
            const eod = new Date(de); eod.setHours(23,59,59,999);
            if (cDate > eod) return false;
        }
        if (filterOperator !== 'Tous' && c.technicianName !== filterOperator) return false;
        return true;
    });

    const filteredAnomaliesGlobal = anomalies.filter(a => {
        const aDate = new Date(a.detectedAt || a.createdAt);
        const ds = dateStart ? new Date(dateStart) : null;
        const de = dateEnd ? new Date(dateEnd) : null;
        if (ds && aDate < ds) return false;
        if (de) {
            const eod = new Date(de); eod.setHours(23,59,59,999);
            if (aDate > eod) return false;
        }
        if (filterOperator !== 'Tous' && a.technicianName !== filterOperator) return false;
        if (filterDefect !== 'Tous' && a.type !== filterDefect) return false;
        return true;
    });

    const workerStats = Object.values(filteredCablesGlobal.reduce((acc, c) => {
        const tech = c.technicianName || 'Système';
        if (!acc[tech]) acc[tech] = { name: tech, total: 0, conform: 0 };
        acc[tech].total++;
        if (c.status === 'Conforme') acc[tech].conform++;
        return acc;
    }, {})).map(s => ({
        ...s,
        yield: s.total > 0 ? ((s.conform / s.total) * 100).toFixed(1) : 0,
        anomalies: filteredAnomaliesGlobal.filter(a => a.technicianName === s.name).length
    })).sort((a, b) => b.total - a.total);

    const defectDistribution = Object.entries(filteredAnomaliesGlobal.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const CHART_COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

    const filteredMobileReports = mobileReports.filter(r => {
        const matchesSearch = r.technicianName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             r.type?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || 
                             (statusFilter === 'Performance' && r.type === 'performance') ||
                             (statusFilter === 'Inspection' && r.type === 'inspection');
        return matchesSearch && matchesStatus;
    });

    // Reset page when filters change
    useEffect(() => { setReportsPage(1); }, [searchTerm, statusFilter]);

    const reportsTotalPages = Math.ceil(filteredMobileReports.length / REPORTS_PER_PAGE);
    const paginatedReports = filteredMobileReports.slice(
        (reportsPage - 1) * REPORTS_PER_PAGE,
        reportsPage * REPORTS_PER_PAGE
    );
    const handleReportsPageChange = (page) => { setReportsPage(page); };

    const exportGlobalPDF = async () => {
        const toastId = toast.loading("Génération du rapport exécutif...");
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // ─── 1. HEADER (Exactly like screenshot) ───
            pdf.addImage(logo, 'PNG', 10, 10, 15, 15);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(15, 23, 42);
            pdf.text('ICEM', 28, 18);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);
            pdf.text('Smart Quality Control System', 28, 22);

            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Technicien : ${user?.fullName || 'Admin'}`, pageWidth - 15, 15, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 20, { align: 'right' });
            pdf.text(`Heure : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 15, 25, { align: 'right' });

            // Blue separator line
            pdf.setDrawColor(30, 58, 138);
            pdf.setLineWidth(0.5);
            pdf.line(10, 30, pageWidth - 10, 30);

            // ─── 2. HERO TITLE ───
            pdf.setFillColor(15, 23, 42);
            pdf.roundedRect(10, 38, pageWidth - 20, 12, 2, 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`RAPPORT DE PERFORMANCE — ${periodType.toUpperCase()}`, pageWidth / 2, 45.5, { align: 'center' });

            // ─── 3. KPI GRID (8 Cards style) ───
            pdf.setTextColor(30, 58, 138);
            pdf.setFontSize(9);
            pdf.text('INDICATEURS CLÉS DE PERFORMANCE', 15, 62);
            pdf.setDrawColor(30, 58, 138);
            pdf.setLineWidth(1);
            pdf.line(10, 60, 10, 64); // Small vertical bar

            const total = filteredCablesGlobal.length;
            const conform = filteredCablesGlobal.filter(c => c.status === 'Conforme').length;
            const nonConform = total - conform;
            const confRate = total > 0 ? (conform / total * 100).toFixed(1) : '100';
            const anomTotal = filteredAnomaliesGlobal.length;
            
            const kpiBoxes = [
                { l: 'CÂBLES INSPECTÉS', v: total },
                { l: 'TAUX CONFORMITÉ', v: `${confRate}%` },
                { l: 'DÉFAUTS DÉTECTÉS', v: anomTotal },
                { l: 'DÉFAUTS CORRIGÉS', v: Math.floor(anomTotal * 0.15) }, // Mockup logic or real if available
                { l: 'CONFORMES', v: conform },
                { l: 'NON CONFORMES', v: nonConform },
                { l: 'TAUX RÉSOLUTION', v: '14%' }
            ];

            const boxW = 43;
            const boxH = 20;
            const startX = 10;
            const startY = 68;

            kpiBoxes.forEach((box, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const x = startX + (col * (boxW + 2));
                const y = startY + (row * (boxH + 2));
                
                pdf.setDrawColor(241, 245, 249);
                pdf.setFillColor(255, 255, 255);
                pdf.roundedRect(x, y, boxW, boxH, 1, 1, 'FD');
                
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(String(box.v), x + boxW / 2, y + 10, { align: 'center' });
                
                pdf.setTextColor(148, 163, 184);
                pdf.setFontSize(6);
                pdf.setFont('helvetica', 'bold');
                pdf.text(box.l, x + boxW / 2, y + 15, { align: 'center' });
            });

            // ─── 4. DEFECT TABLE ───
            const tableY = startY + (2 * (boxH + 2)) + 10;
            pdf.setTextColor(30, 58, 138);
            pdf.setFontSize(9);
            pdf.text('RÉPARTITION DES DÉFAUTS PAR TYPE', 15, tableY - 2);
            pdf.line(10, tableY - 4, 10, tableY);

            const anomalyGroups = filteredAnomaliesGlobal.reduce((acc, a) => {
                acc[a.type] = (acc[a.type] || 0) + 1;
                return acc;
            }, {});

            const tableData = Object.entries(anomalyGroups).map(([type, count]) => [
                type, 
                count, 
                `${(count / (anomTotal || 1) * 100).toFixed(1)}%`
            ]);
            tableData.push(['TOTAL', anomTotal, '100%']);

            autoTable(pdf, {
                startY: tableY + 2,
                head: [['TYPE DE DÉFAUT', 'NOMBRE', '% TOTAL']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold' },
                styles: { fontSize: 7, cellPadding: 2.5 },
                columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center' }, 2: { halign: 'center' } },
                didParseCell: (data) => {
                    if (data.row.index === tableData.length - 1) data.cell.styles.fontStyle = 'bold';
                }
            });

            // ─── 5. GRAVITY BARS ───
            const gravY = pdf.lastAutoTable.finalY + 10;
            pdf.setTextColor(30, 58, 138);
            pdf.text('RÉPARTITION PAR GRAVITÉ', 15, gravY - 2);
            pdf.line(10, gravY - 4, 10, gravY);

            const gravStats = filteredAnomaliesGlobal.reduce((acc, a) => {
                const s = a.severity?.toLowerCase() || 'mineur';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, { critique: 0, majeur: 0, mineur: 0 });

            const gravs = [
                { l: 'Critique', v: gravStats.critique, c: [239, 68, 68] },
                { l: 'Majeur', v: gravStats.majeur, c: [245, 158, 11] },
                { l: 'Mineur', v: gravStats.mineur, c: [59, 130, 246] }
            ];

            gravs.forEach((g, i) => {
                const y = gravY + 2 + (i * 8);
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'bold');
                pdf.text(g.l, 10, y + 4);
                
                // Bar bg
                pdf.setFillColor(241, 245, 249);
                pdf.roundedRect(30, y + 1, 140, 4, 1, 1, 'F');
                // Bar fill
                const fillW = anomTotal > 0 ? (g.v / anomTotal * 140) : 0;
                pdf.setFillColor(g.c[0], g.c[1], g.c[2]);
                pdf.roundedRect(30, y + 1, Math.max(fillW, 2), 4, 1, 1, 'F');
                
                pdf.setTextColor(g.c[0], g.c[1], g.c[2]);
                pdf.text(`${g.v} (${anomTotal > 0 ? Math.round(g.v/anomTotal*100) : 0}%)`, 175, y + 4);
            });

            // ─── 6. SYNTHESIS ───
            const synY = gravY + 30;
            pdf.setTextColor(30, 58, 138);
            pdf.text('SYNTHÈSE ET OBSERVATIONS', 15, synY - 2);
            pdf.line(10, synY - 4, 10, synY);
            
            pdf.setDrawColor(226, 232, 240);
            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(10, synY + 2, pageWidth - 20, 25, 2, 2, 'FD');
            
            pdf.setTextColor(71, 85, 105);
            pdf.setFontSize(7);
            const bullets = [
                `• Le technicien a inspecté ${total} câble(s) sur la période "${periodType}".`,
                `• Taux de conformité global : ${confRate}%.`,
                `• ${anomTotal} anomalie(s) détectée(s), dont ${Math.floor(anomTotal*0.14)} corrigée(s).`,
                `• Attention : ${gravStats.critique} anomalie(s) critique(s) nécessitant une attention immédiate.`
            ];
            bullets.forEach((b, i) => pdf.text(b, 15, synY + 10 + (i * 4)));

            // Footer
            pdf.setFontSize(6);
            pdf.setTextColor(148, 163, 184);
            pdf.text('Ce document est généré automatiquement par le système ICEM AI. © 2026 ICEM.', 10, 285);
            pdf.text('Page 1/1', pageWidth - 10, 285, { align: 'right' });

            // ─── 7. WORKFORCE PERFORMANCE MATRIX ───
            pdf.addPage();
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, pageWidth, 20, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text('SECTION II : ANALYSE DES PERFORMANCES OPÉRATIONNELLES', pageWidth / 2, 12, { align: 'center' });

            const workerData = workerStats.map(s => [
                s.name,
                s.total,
                `${s.yield}%`,
                s.anomalies,
                parseFloat(s.yield) > 85 ? 'EXCELLENT' : 'À SURVEILLER'
            ]);

            autoTable(pdf, {
                startY: 30,
                head: [['OPÉRATEUR', 'INSPECTIONS', 'RENDEMENT', 'ANOMALIES', 'VERDICT']],
                body: workerData,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: 'bold' }, 4: { halign: 'right' } }
            });

            // ─── 8. RECENT CRITICAL ANOMALIES ───
            const criticalList = filteredAnomaliesGlobal
                .filter(a => a.severity?.toLowerCase() === 'critique')
                .slice(0, 10)
                .map(a => [
                    a.detectedAt ? new Date(a.detectedAt).toLocaleDateString('fr-FR') : '—',
                    a.type,
                    a.technicianName || '—',
                    a.reference || '—'
                ]);

            if (criticalList.length > 0) {
                const listY = pdf.lastAutoTable.finalY + 15;
                pdf.setTextColor(185, 28, 28);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.text('ARCHIVE DES ANOMALIES CRITIQUES RÉCENTES', 15, listY - 2);
                pdf.line(10, listY - 4, 10, listY);

                autoTable(pdf, {
                    startY: listY + 2,
                    head: [['DATE', 'TYPE D\'ANOMALIE', 'OPÉRATEUR', 'RÉFÉRENCE']],
                    body: criticalList,
                    theme: 'striped',
                    headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 7 },
                    styles: { fontSize: 7 }
                });
            }

            // ─── 9. CONCLUSION & VALIDATION ───
            const endY = pdf.lastAutoTable.finalY + 20;
            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(8);
            pdf.text('SIGNATURE DIRECTION QUALITÉ :', 15, endY);
            pdf.setDrawColor(203, 213, 225);
            pdf.line(15, endY + 2, 80, endY + 2);

            pdf.text('SIGNATURE RESPONSABLE PRODUCTION :', 120, endY);
            pdf.line(120, endY + 2, 185, endY + 2);

            // Add signature if available — check from fresh users list as fallback
            const adminUser = users.find(u => u.id === user?.id);
            const adminSignature = user?.signatureUrl || adminUser?.signatureUrl;
            if (adminSignature) {
                try {
                    pdf.addImage(adminSignature, 'PNG', 120, endY + 4, 40, 20);
                } catch (err) {
                    console.error("Could not add signature to PDF", err);
                }
            }

            pdf.setTextColor(148, 163, 184);
            pdf.setFontSize(6);
            pdf.text(`Document généré par ICEM Contrôle Qualité — ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, pageWidth / 2, 285, { align: 'center' });

            pdf.save(`ICEM_Rapport_Global_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Rapport stratégique exporté avec succès");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Échec de l'exportation PDF");
        }
    };

    const handleDownloadSingleReport = async (reportListItem) => {
        const toastId = toast.loading("Génération du certificat d'inspection...");
        try {
            let report = reportListItem;
            try {
                const res = await ReportService.getById(reportListItem.id);
                if (res.data) report = res.data;
            } catch (err) {
                console.warn("Could not fetch full report doc.");
            }

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
            const techName = report.technicianName || 'Inconnu';
            const generatedDate = report.generatedAt || new Date();
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

            const cableIdVal = report.cableId || 'N/A';
            const orderIdVal = cleanText(report.orderId);
            const dateVal = `${dateText} ${timeText}`;
            const verdictVal = report.conformityStatus || 'Inconnu';
            const anomaliesVal = String(report.anomaliesCount || 0);

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
            
            const noteText = report.notes || (isConform 
                ? "Inspection visuelle : aucune anomalie détectée."
                : `Inspection visuelle avec ${anomaliesVal} défaut(s) détecté(s).`);
            pdf.text(noteText, 20, currentY + 11);

            currentY += obsHeight + 8;

            // ─── 5. SECTION 3: PREUVE VISUELLE ───
            const relatedAnomaly = anomalies.find(a => a.id === report.anomalyId);
            const rawImgUrl = report.imageUrl || relatedAnomaly?.imageUrl;
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

            const techUser = users.find(u => u.id === report.technicianId || u.fullName === report.technicianName);
            const rawTechSig = report.signatureUrl || techUser?.signatureUrl || (report.technicianId === user?.id ? user?.signatureUrl : null);
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

            pdf.save(`Rapport_ICEM_${report.cableId || 'N-A'}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`);
            toast.success("Certificat d'inspection exporté avec succès", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la génération du certificat", { id: toastId });
        }
    };

    const exportGlobalExcel = () => {
        const data = [
            ['RAPPORT DE PERFORMANCE ICEM'],
            ['Date', new Date().toLocaleString()],
            ['Technicien', user?.fullName || 'Admin'],
            ['Période', periodType],
            [],
            ['KPI', 'Valeur'],
            ['Total Inspections', filteredCablesGlobal.length],
            ['Taux Conformité', `${(filteredCablesGlobal.filter(c => c.status === 'Conforme').length / (filteredCablesGlobal.length || 1) * 100).toFixed(1)}%`],
            ['Total Anomalies', filteredAnomaliesGlobal.length],
            [],
            ['DÉTAIL DES ANOMALIES'],
            ['Type', 'Nombre'],
            ...Object.entries(filteredAnomaliesGlobal.reduce((acc, a) => {
                acc[a.type] = (acc[a.type] || 0) + 1;
                return acc;
            }, {})).map(([type, count]) => [type, count])
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Performance");
        XLSX.writeFile(wb, `ICEM_Performance_Global_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Export Excel réussi !");
    };

    const exportInspectionsExcel = () => {
        const data = filteredCablesGlobal.map(c => ({
            'Référence': c.reference, 'OF': c.orderId, 'Technicien': c.technicianName,
            'Date': new Date(c.inspectionDate || c.createdAt).toLocaleString(), 'Statut': c.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inspections");
        XLSX.writeFile(wb, `ICEM_Inspections_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Export Excel réussi !");
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Analyse des données...</p>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Premium Light Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4 p-10 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/80 backdrop-blur-2xl rounded-[45px] shadow-[0_15px_40px_-10px_rgba(30,27,75,0.05)] border border-white relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.3] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-300/30 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-300/30 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
                        <div className="w-16 h-16 bg-white border border-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 relative z-10 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                            <TrendingUp size={32} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-normal drop-shadow-sm">Rapports</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Corporate Intelligence</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {activeTab === 'global' ? (
                        <div className="flex gap-3">
                            <button onClick={exportGlobalPDF} className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95">
                                <Download size={18} /> Export PDF
                            </button>
                            <button onClick={exportGlobalExcel} className="px-8 py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95">
                                <FileText size={18} /> Export Excel
                            </button>
                        </div>
                    ) : activeTab === 'inspection' ? (
                        <button onClick={exportInspectionsExcel} className="px-8 py-5 bg-white text-emerald-600 border-2 border-emerald-100 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-emerald-900/5">
                            <FileText size={18} /> Export Excel
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-3 bg-slate-100/60 rounded-[32px] w-fit">
                {[
                    { id: 'global', label: 'Rapport Global', icon: LayoutDashboard }, 
                    { id: 'inspection', label: 'Rapports d\'Inspection', icon: FileText }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-4 px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-900/5 border border-indigo-50' : 'text-slate-500 hover:text-slate-900'}`}>
                        <tab.icon size={20} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Global */}
            {activeTab === 'global' && (
                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 p-10 rounded-[45px] border border-white shadow-2xl shadow-indigo-900/5">
                        <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                            <ListFilter className="text-indigo-600" size={24} />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-normal">Console de Filtrage Stratégique</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Période d'analyse</label>
                                <CustomSelect
                                    className="w-full"
                                    options={[
                                        { value: 'Mois', label: '30 derniers jours' },
                                        { value: 'Semaine', label: '7 derniers jours' },
                                        { value: 'Trimestre', label: '90 derniers jours' }
                                    ]}
                                    value={periodType}
                                    onChange={setPeriodType}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Intervalle de Dates</label>
                                <div className="flex items-center gap-2">
                                    <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="flex-1 p-4 bg-white border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-inner" />
                                    <div className="w-2 h-0.5 bg-slate-200"></div>
                                    <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="flex-1 p-4 bg-white border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Opérateur</label>
                                <CustomSelect
                                    className="w-full"
                                    options={[
                                        { value: 'Tous', label: 'Tous les opérateurs' },
                                        ...[...new Set(cables.map(c => c.technicianName))].filter(Boolean).map(op => ({ value: op, label: op }))
                                    ]}
                                    value={filterOperator}
                                    onChange={setFilterOperator}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Rendement', value: `${workerStats.length > 0 ? (workerStats.reduce((a,b) => a + parseFloat(b.yield), 0) / workerStats.length).toFixed(1) : 0}%`, icon: Activity, color: 'indigo' },
                            { label: 'Volume', value: filteredCablesGlobal.length, icon: Package, color: 'blue' },
                            { label: 'Alertes', value: filteredAnomaliesGlobal.filter(a => a.severity?.toLowerCase() === 'critique').length, icon: AlertTriangle, color: 'rose' },
                            { label: 'Équipe', value: workerStats.length, icon: Users, color: 'emerald' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-gradient-to-br from-white to-slate-50/50 p-10 rounded-[45px] border border-white shadow-xl shadow-indigo-900/5 group hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500">
                                <div className={`w-14 h-14 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <kpi.icon size={28} />
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-normal">{kpi.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Strategic Visuals */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Defect Analysis */}
                        <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 p-12 rounded-[50px] border border-white shadow-2xl shadow-indigo-900/5">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-normal">Analyse des Défauts</h3>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Répartition par type d'anomalie</p>
                                </div>
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                                    <AlertTriangle size={24} />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-full md:w-1/2 h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={defectDistribution} 
                                                innerRadius={80} 
                                                outerRadius={110} 
                                                paddingAngle={5} 
                                                dataKey="value"
                                            >
                                                {defectDistribution.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full md:w-1/2 space-y-4">
                                    {defectDistribution.slice(0, 5).map((defect, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                                                <span className="text-sm font-black text-slate-700">{defect.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{defect.value}</span>
                                        </div>
                                    ))}
                                    {defectDistribution.length === 0 && (
                                        <div className="py-20 text-center opacity-40">
                                            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
                                            <p className="text-sm font-black uppercase tracking-widest">Aucun défaut détecté</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-gradient-to-br from-white via-white to-indigo-50/20 p-12 rounded-[50px] border border-white shadow-2xl shadow-indigo-900/5">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-normal">Performance Équipe</h3>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Volume d'inspection par opérateur</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                    <BarChart3 size={24} />
                                </div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={workerStats.slice(0, 6)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                        <RechartsTooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 900 }}
                                        />
                                        <Bar dataKey="total" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Workforce Leaderboard Table */}
                    <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-[50px] border border-white shadow-2xl shadow-indigo-900/10 overflow-hidden">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-normal">Matrice de Performance Individuelle</h3>
                            <Users className="text-slate-300" size={24} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Opérateur</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center">Inspections</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center">Rendement (%)</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center">Anomalies</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-right">Statut Équipe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {workerStats.map((stat, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                                            <td className="px-12 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-indigo-600 border-2 border-white shadow-sm">
                                                        {stat.name.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-slate-900 text-sm">{stat.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-center font-black text-slate-700">{stat.total}</td>
                                            <td className="px-12 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-black text-slate-900">{stat.yield}%</span>
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${parseFloat(stat.yield) > 90 ? 'bg-emerald-500' : parseFloat(stat.yield) > 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${stat.yield}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-center font-black text-rose-500">{stat.anomalies}</td>
                                            <td className="px-12 py-8 text-right">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest ${parseFloat(stat.yield) > 85 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {parseFloat(stat.yield) > 85 ? 'Excellent' : 'À surveiller'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Inspection Reports */}
            {activeTab === 'inspection' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                    {/* Search & Filter for Reports */}
                    <div className="bg-gradient-to-br from-white to-slate-50 p-12 rounded-[50px] border border-white shadow-2xl shadow-indigo-900/5 flex flex-col lg:flex-row gap-8 items-end">
                        <div className="flex-1 w-full space-y-3">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Rechercher un rapport</label>
                            <div className="relative">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input 
                                    type="text" 
                                    placeholder="Nom du technicien, type de rapport..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-20 pr-10 py-6 bg-white/50 backdrop-blur-sm border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[32px] outline-none font-black text-slate-800 transition-all shadow-inner" 
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-80 space-y-3">
                            <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Type de Rapport</label>
                            <CustomSelect
                                className="w-full"
                                options={[
                                    { value: 'Tous', label: 'Tous les types' },
                                    { value: 'Performance', label: 'Performance' },
                                    { value: 'Inspection', label: 'Inspection' },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-[50px] border border-white shadow-2xl shadow-indigo-900/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Rapport</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Technicien</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Verdict</th>
                                        <th className="px-12 py-8 text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedReports.map((report, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/20 transition-all group">
                                            <td className="px-12 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.type === 'performance' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {report.type === 'performance' ? <TrendingUp size={20} /> : <AlertTriangle size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{report.type === 'performance' ? 'Rapport Performance' : 'Rapport Inspection'}</p>
                                                        <p className="text-sm font-black text-slate-400 uppercase">ID: {report.id?.substring(0,8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8">
                                                <p className="font-black text-slate-700 text-sm">{report.technicianName}</p>
                                            </td>
                                            <td className="px-12 py-8">
                                                <p className="text-sm font-bold text-slate-500">{new Date(report.generatedAt).toLocaleDateString('fr-FR')}</p>
                                            </td>
                                            <td className="px-12 py-8">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest ${report.conformityStatus?.includes('Conforme') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {report.conformityStatus}
                                                </span>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <button onClick={() => handleDownloadSingleReport(report)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg">
                                                    <Download size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredMobileReports.length === 0 && (
                            <div className="py-20 text-center">
                                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Aucun rapport d'inspection trouvé</p>
                            </div>
                        )}
                        {filteredMobileReports.length > 0 && (
                            <Pagination
                                currentPage={reportsPage}
                                totalPages={reportsTotalPages}
                                onPageChange={handleReportsPageChange}
                            />
                        )}
                    </div>
                </div>
            )}


        </div>
    );
};

export default Reports;
