import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertTriangle, CheckCircle, Package, TrendingUp, Download, BarChart3, Shield, Zap, ArrowUpRight, ArrowDownRight, Activity, RefreshCw } from 'lucide-react';
import { OrderService, AnomalyService, StatsService, CableService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import toast, { Toaster } from 'react-hot-toast';
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

const StatCard = ({ label, value, unit, subtitle, icon, hero = false, trend, color = 'indigo' }) => {
    const colorStyles = {
        indigo: {
            bg: "from-indigo-50 to-indigo-100",
            border: "border-indigo-200 hover:border-indigo-300",
            iconBg: "bg-indigo-600 text-white shadow-md shadow-indigo-600/30",
            blob: "bg-indigo-200/50",
            textAccent: "text-indigo-600",
            title: "text-indigo-900",
            value: "text-indigo-950"
        },
        rose: {
            bg: "from-rose-50 to-rose-100",
            border: "border-rose-200 hover:border-rose-300",
            iconBg: "bg-rose-500 text-white shadow-md shadow-rose-500/30",
            blob: "bg-rose-200/50",
            textAccent: "text-rose-600",
            title: "text-rose-900",
            value: "text-rose-950"
        },
        emerald: {
            bg: "from-emerald-50 to-emerald-100",
            border: "border-emerald-200 hover:border-emerald-300",
            iconBg: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30",
            blob: "bg-emerald-200/50",
            textAccent: "text-emerald-600",
            title: "text-emerald-900",
            value: "text-emerald-950"
        },
        amber: {
            bg: "from-amber-50 to-amber-100",
            border: "border-amber-200 hover:border-amber-300",
            iconBg: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
            blob: "bg-amber-200/50",
            textAccent: "text-amber-600",
            title: "text-amber-900",
            value: "text-amber-950"
        },
        blue: {
            bg: "from-blue-50 to-blue-100",
            border: "border-blue-200 hover:border-blue-300",
            iconBg: "bg-blue-500 text-white shadow-md shadow-blue-500/30",
            blob: "bg-blue-200/50",
            textAccent: "text-blue-600",
            title: "text-blue-900",
            value: "text-blue-950"
        }
    };

    const theme = colorStyles[color] || colorStyles.indigo;

    return (
        <div className={`bg-gradient-to-br ${theme.bg} p-8 rounded-[40px] border border-white ${theme.border} shadow-xl shadow-slate-200/40 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${theme.blob} rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        {React.cloneElement(icon, { size: 24 })}
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-sm font-black px-3 py-1 rounded-xl
                            ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <p className={`text-sm font-black ${theme.textAccent} uppercase tracking-widest mb-1`}>{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className={`text-3xl font-black ${theme.value} tracking-normal`}>
                        {value}
                    </h3>
                    {unit && <span className={`text-sm font-black ${theme.textAccent} uppercase tracking-widest`}>{unit}</span>}
                </div>
                {subtitle && <p className={`text-sm font-black ${theme.title} uppercase tracking-widest mt-3 opacity-70 group-hover:opacity-100 transition-opacity`}>{subtitle}</p>}
            </div>
        </div>
    );
};

/* ─── Mini stat item ─── */
const MiniStat = ({ icon, label, value, color }) => (
    <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-[32px] border border-white shadow-xl shadow-indigo-900/5 flex items-center gap-4 hover:shadow-2xl transition-all duration-300">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${color} shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-xl font-black text-slate-900 tracking-normal">{value}</p>
        </div>
    </div>
);

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-xl border border-gray-100 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((e, i) => (
                <p key={i} className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.color }}></span>
                    {e.name}: <span className="font-bold text-gray-700">{e.value}</span>
                </p>
            ))}
        </div>
    );
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

const Dashboard = () => {
    const [stats, setStats] = useState({
        orders: { total: 0, enCours: 0, termine: 0, enAttente: 0 },
        anomalies: { total: 0, critique: 0, majeur: 0, mineur: 0 },
        cables: { total: 0, conforme: 0, nonConforme: 0, enAttente: 0 },
    });
    const [recentInspections, setRecentInspections] = useState([]);
    const [recentAnomalies, setRecentAnomalies] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const { canExport, user } = useAuth();

    useEffect(() => {
        const fetchRecentData = async () => {
            try {
                const [anomRes, cableRes] = await Promise.all([
                    AnomalyService.getAll({ limit: 10 }),
                    CableService.getAll({ limit: 10 })
                ]);
                
                // Anomalies
                const anomalies = anomRes.data || [];
                anomalies.sort((a, b) => new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0));
                setRecentAnomalies(anomalies.slice(0, 5));
                
                // Cables
                const cables = cableRes.data || [];
                cables.sort((a, b) => new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0));
                setRecentInspections(cables.slice(0, 5));
            } catch (e) {
                console.error("Error fetching recent data", e);
            }
        };

        const fetchStats = async () => {
            try {
                const [summaryRes, trendsRes] = await Promise.all([
                    StatsService.getSummary(),
                    StatsService.getTrends().catch(() => ({ data: [] })),
                ]);
                
                const data = summaryRes.data;
                setStats({ 
                    orders: data.orders, 
                    anomalies: data.anomalies, 
                    cables: data.cables 
                });
                setTrends(trendsRes.data || []);
            } catch (e) { 
                console.error('Error fetching dashboard stats:', e); 
            } finally { 
                setLoading(false); 
            }
        };

        fetchStats();
        fetchRecentData();

        let isFirstLoad = true;
        const qNotifs = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(1));
        const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
            if (!isFirstLoad && snapshot.docChanges().some(c => c.type === 'added')) {
                fetchStats();
                fetchRecentData();
                const newNotif = snapshot.docs[0]?.data();
                if (newNotif && newNotif.type === 'anomaly_detected') {
                    toast.error(`Alerte: ${newNotif.message || 'Anomalie détectée'}`, {
                        duration: 5000,
                        style: { borderRadius: '12px', background: '#1e2035', color: '#fff', fontSize: '13px' }
                    });
                }
            }
            isFirstLoad = false;
        });

        return () => unsubNotifs();
    }, []);

    const conformityRate = stats.cables.total > 0
        ? Math.round((stats.cables.conforme / stats.cables.total) * 100) : 0;

    const barData = [
        { name: 'En cours', ordres: stats.orders.enCours || 0, anomalies: stats.anomalies.majeur || 0 },
        { name: 'Terminé', ordres: stats.orders.termine || 0, anomalies: stats.anomalies.critique || 0 },
        { name: 'Attente', ordres: stats.orders.enAttente || 0, anomalies: stats.anomalies.mineur || 0 },
    ];

    const pieData = [
        { name: 'Critique', value: stats.anomalies.critique || 0 },
        { name: 'Majeur', value: stats.anomalies.majeur || 0 },
        { name: 'Mineur', value: stats.anomalies.mineur || 0 },
    ].filter(d => d.value > 0);

    const trendData = trends.slice(-12);

    const handleExportPDF = async () => {
        const toastId = toast.loading("Génération du rapport complet...");
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;

            // ────── PAGE 1 : HEADER + KPI ──────
            const logoBase64 = await urlToBase64(logo);
            if (logoBase64) {
                pdf.addImage(logoBase64, 'PNG', 15, 10, 15, 15);
            }
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(15, 23, 42);
            pdf.text('ICEM', 34, 16);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);
            pdf.text('Smart Quality Control System', 34, 21);

            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Utilisateur : ${user?.fullName || 'riheme'}`, pageWidth - 15, 15, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 20, { align: 'right' });
            pdf.text(`Heure : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 15, 25, { align: 'right' });

            // Blue separator line
            pdf.setDrawColor(30, 58, 138);
            pdf.setLineWidth(0.5);
            pdf.line(15, 30, pageWidth - 15, 30);

            // Section: KPIs principaux
            let y = 42;
            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('INDICATEURS CLES DE PERFORMANCE', margin, y);
            y += 2;

            autoTable(pdf, {
                startY: y,
                head: [['Indicateur', 'Valeur', 'Detail']],
                body: [
                    ['Ordres de Fabrication', `${stats.orders.total || 0}`, `En cours: ${stats.orders.enCours || 0} | Termines: ${stats.orders.termine || 0} | En attente: ${stats.orders.enAttente || 0}`],
                    ['Cables Inspectes', `${stats.cables.total || 0}`, `Conformes: ${stats.cables.conforme || 0} | Non conformes: ${stats.cables.nonConforme || 0} | En attente: ${stats.cables.enAttente || 0}`],
                    ['Taux de Conformite', `${conformityRate}%`, conformityRate >= 90 ? 'Objectif atteint (>=90%)' : 'En dessous de l\'objectif (90%)'],
                    ['Total Anomalies', `${stats.anomalies.total || 0}`, `Critiques: ${stats.anomalies.critique || 0} | Majeures: ${stats.anomalies.majeur || 0} | Mineures: ${stats.anomalies.mineur || 0}`],
                    ['Anomalies Critiques', `${stats.anomalies.critique || 0}`, stats.anomalies.critique > 0 ? 'Attention requise' : 'Aucune anomalie critique'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 10 },
                bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
                alternateRowStyles: { fillColor: [248, 248, 255] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 45 },
                    1: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
                    2: { cellWidth: contentWidth - 70, fontSize: 8, textColor: [100, 100, 100] }
                },
                margin: { left: margin, right: margin }
            });

            y = pdf.lastAutoTable.finalY + 10;

            // Section: Répartition des ordres
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(15, 23, 42);
            pdf.text('REPARTITION DES ORDRES DE FABRICATION', margin, y);
            y += 2;

            autoTable(pdf, {
                startY: y,
                head: [['Statut', 'Nombre', 'Proportion']],
                body: [
                    ['En cours', stats.orders.enCours || 0, `${stats.orders.total > 0 ? ((stats.orders.enCours / stats.orders.total) * 100).toFixed(1) : 0}%`],
                    ['Termines', stats.orders.termine || 0, `${stats.orders.total > 0 ? ((stats.orders.termine / stats.orders.total) * 100).toFixed(1) : 0}%`],
                    ['En attente', stats.orders.enAttente || 0, `${stats.orders.total > 0 ? ((stats.orders.enAttente / stats.orders.total) * 100).toFixed(1) : 0}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { halign: 'center', cellWidth: 30 },
                    2: { halign: 'center' }
                },
                margin: { left: margin, right: margin }
            });

            y = pdf.lastAutoTable.finalY + 10;

            // Section: Répartition des câbles
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('REPARTITION DES CABLES', margin, y);
            y += 2;

            autoTable(pdf, {
                startY: y,
                head: [['Statut', 'Nombre', 'Proportion']],
                body: [
                    ['Conformes', stats.cables.conforme || 0, `${stats.cables.total > 0 ? ((stats.cables.conforme / stats.cables.total) * 100).toFixed(1) : 0}%`],
                    ['Non conformes', stats.cables.nonConforme || 0, `${stats.cables.total > 0 ? ((stats.cables.nonConforme / stats.cables.total) * 100).toFixed(1) : 0}%`],
                    ['En attente', stats.cables.enAttente || 0, `${stats.cables.total > 0 ? ((stats.cables.enAttente / stats.cables.total) * 100).toFixed(1) : 0}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50 },
                    1: { halign: 'center', cellWidth: 30 },
                    2: { halign: 'center' }
                },
                margin: { left: margin, right: margin }
            });

            // ────── PAGE 2 : GRAPHIQUES ──────
            pdf.addPage();

            // Header page 2
            if (logoBase64) {
                pdf.addImage(logoBase64, 'PNG', 15, 10, 12, 12);
            }
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(15, 23, 42);
            pdf.text('ICEM - Graphiques & Visualisations', 30, 18);
            pdf.setDrawColor(30, 58, 138);
            pdf.setLineWidth(0.3);
            pdf.line(15, 24, pageWidth - 15, 24);

            y = 32;

            // Capture chart images using html2canvas
            const captureChart = async (elementId, label) => {
                const el = document.getElementById(elementId);
                if (!el) return null;
                try {
                    const canvas = await html2canvas(el, {
                        backgroundColor: '#ffffff',
                        scale: 2,
                        useCORS: true,
                        logging: false
                    });
                    return canvas.toDataURL('image/png');
                } catch (e) {
                    console.warn(`Failed to capture ${label}:`, e);
                    return null;
                }
            };

            // Capture Trend chart
            const trendImg = await captureChart('dashboard-trend-chart', 'Tendances');
            if (trendImg) {
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Tendances de Conformite (14 derniers jours)', margin, y);
                y += 4;
                const imgWidth = contentWidth;
                const imgHeight = 65;
                pdf.addImage(trendImg, 'PNG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 12;
            }

            // Capture Bar chart and Pie chart side by side
            const barImg = await captureChart('dashboard-bar-chart', 'Production');
            const pieImg = await captureChart('dashboard-pie-chart', 'Anomalies');

            if (barImg || pieImg) {
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Production & Anomalies par Gravite', margin, y);
                y += 4;

                const halfWidth = (contentWidth - 6) / 2;
                const chartHeight = 65;
                if (barImg) {
                    pdf.addImage(barImg, 'PNG', margin, y, halfWidth, chartHeight);
                }
                if (pieImg) {
                    pdf.addImage(pieImg, 'PNG', margin + halfWidth + 6, y, halfWidth, chartHeight);
                }
                y += chartHeight + 12;
            }

            // Anomalies breakdown table on page 2
            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('DETAIL DES ANOMALIES PAR GRAVITE', margin, y);
            y += 2;

            const totalAnom = (stats.anomalies.critique || 0) + (stats.anomalies.majeur || 0) + (stats.anomalies.mineur || 0);
            autoTable(pdf, {
                startY: y,
                head: [['Gravite', 'Nombre', 'Proportion', 'Niveau de Risque']],
                body: [
                    ['Critique', stats.anomalies.critique || 0, `${totalAnom > 0 ? ((stats.anomalies.critique / totalAnom) * 100).toFixed(1) : 0}%`, 'Risque Eleve'],
                    ['Majeur', stats.anomalies.majeur || 0, `${totalAnom > 0 ? ((stats.anomalies.majeur / totalAnom) * 100).toFixed(1) : 0}%`, 'Risque Modere'],
                    ['Mineur', stats.anomalies.mineur || 0, `${totalAnom > 0 ? ((stats.anomalies.mineur / totalAnom) * 100).toFixed(1) : 0}%`, 'Risque Faible'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 35 },
                    1: { halign: 'center', cellWidth: 25 },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center' }
                },
                margin: { left: margin, right: margin }
            });

            // ────── PAGE 3 : ACTIVITÉ RÉCENTE ──────
            pdf.addPage();

            // Header page 3
            if (logoBase64) {
                pdf.addImage(logoBase64, 'PNG', 15, 10, 12, 12);
            }
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(15, 23, 42);
            pdf.text('ICEM - Activite Recente & Inspections', 30, 18);
            pdf.setDrawColor(30, 58, 138);
            pdf.setLineWidth(0.3);
            pdf.line(15, 24, pageWidth - 15, 24);

            y = 32;

            // Recent inspections table
            if (recentInspections.length > 0) {
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('DERNIERES INSPECTIONS', margin, y);
                y += 2;

                autoTable(pdf, {
                    startY: y,
                    head: [['Reference', 'OF', 'Date', 'Statut']],
                    body: recentInspections.map(ins => [
                        ins.reference || ins.id?.substring(0, 12) || 'N/A',
                        ins.orderId?.substring(0, 12) || 'N/A',
                        ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('fr-FR') : 'N/A',
                        ins.status || 'N/A'
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 9 },
                    margin: { left: margin, right: margin }
                });
                y = pdf.lastAutoTable.finalY + 10;
            }

            // Recent anomalies table
            if (recentAnomalies.length > 0) {
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('DERNIERES ANOMALIES DETECTEES', margin, y);
                y += 2;

                autoTable(pdf, {
                    startY: y,
                    head: [['Type', 'Reference', 'Gravite', 'Confiance', 'Date']],
                    body: recentAnomalies.map(ano => [
                        ano.type || 'N/A',
                        ano.reference || 'N/A',
                        ano.severity || 'N/A',
                        ano.confidence ? `${(ano.confidence * 100).toFixed(0)}%` : 'N/A',
                        ano.detectedAt?.seconds
                            ? new Date(ano.detectedAt.seconds * 1000).toLocaleDateString('fr-FR')
                            : ano.detectedAt ? new Date(ano.detectedAt).toLocaleDateString('fr-FR') : 'N/A'
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 9 },
                    margin: { left: margin, right: margin }
                });
                y = pdf.lastAutoTable.finalY + 10;
            }

            // Trend data table
            if (trendData.length > 0) {
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text('DONNEES DE TENDANCES QUOTIDIENNES', margin, y);
                y += 2;

                autoTable(pdf, {
                    startY: y,
                    head: [['Jour', 'Inspections', 'Anomalies']],
                    body: trendData.map(t => [
                        t.label || 'N/A',
                        t.inspections || 0,
                        t.anomalies || 0
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 40 },
                        1: { halign: 'center', cellWidth: 35 },
                        2: { halign: 'center', cellWidth: 35 }
                    },
                    margin: { left: margin, right: margin }
                });
            }

            // Footer on each page
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(7);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`ICEM Quality Dashboard - Page ${i}/${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            }

            pdf.save(`ICEM_Dashboard_Complet_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Rapport complet exporté avec succès !", { id: toastId });
        } catch (e) {
            console.error('PDF export error:', e);
            toast.error("Erreur d'export : " + e.message, { id: toastId });
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <Toaster position="top-right" />

            {/* Premium Light Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 p-10 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/80 backdrop-blur-2xl rounded-[45px] shadow-[0_15px_40px_-10px_rgba(30,27,75,0.05)] border border-white relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.3] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-300/30 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-300/30 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="relative group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
                        <div className="w-16 h-16 bg-white border border-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 relative z-10 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                            <Activity size={32} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-normal drop-shadow-sm">Tableau de Bord</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Supervision Centrale en Temps Réel</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    {canExport && (
                        <button onClick={handleExportPDF} className="px-8 py-4 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3 active:scale-95">
                            <Download size={18} /> Exporter
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Package />}
                    label="Ordres en cours"
                    value={stats.orders.enCours || 0}
                    subtitle={`${stats.orders.total || 0} au total`}
                    color="blue"
                />
                <StatCard
                    icon={<AlertTriangle />}
                    label="Anomalies Critiques"
                    value={stats.anomalies.critique || 0}
                    subtitle={`${(stats.anomalies.critique || 0) + (stats.anomalies.majeur || 0) + (stats.anomalies.mineur || 0)} total`}
                    color="rose"
                />
                <StatCard
                    icon={<CheckCircle />}
                    label="Taux Conformité"
                    value={conformityRate}
                    unit="%"
                    subtitle={`${stats.cables.conforme || 0} câbles OK`}
                    color="emerald"
                />
                <StatCard
                    icon={<TrendingUp />}
                    label="Câbles Inspectés"
                    value={stats.cables.total || 0}
                    subtitle={`${stats.cables.nonConforme || 0} non conformes`}
                    color="indigo"
                />
            </div>

            {/* Charts + Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Area Chart — spans 2 cols */}
                {trendData.length > 0 && (
                    <div id="dashboard-trend-chart" className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Tendances de Conformité</h3>
                                <p className="text-sm text-gray-400 mt-0.5">14 derniers jours</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>Inspections
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Anomalies
                                </span>
                            </div>
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="gInsp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="gAnom" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f8" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={6} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dx={-4} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="inspections" stroke="#6366f1" strokeWidth={2} fill="url(#gInsp)" name="Inspections" />
                                    <Area type="monotone" dataKey="anomalies" stroke="#ef4444" strokeWidth={2} fill="url(#gAnom)" name="Anomalies" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Pie Chart */}
                <div id="dashboard-pie-chart" className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Anomalies par Gravité</h3>
                    <p className="text-sm text-gray-400 mb-4">Répartition des défauts</p>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={58}
                                            paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-2 mt-3">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }}></span>
                                            <span className="text-sm text-gray-500 font-medium">{d.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-36 flex flex-col items-center justify-center text-center">
                            <CheckCircle size={28} className="text-emerald-300 mb-2" />
                            <p className="text-sm text-gray-400">Aucune anomalie</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Bar Chart + Mini Stats + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div id="dashboard-bar-chart" className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-1">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Production</h3>
                    <p className="text-sm text-gray-400 mb-4">Par statut</p>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barGap={3}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f8" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="ordres" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} name="Ordres" />
                                <Bar dataKey="anomalies" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} name="Anomalies" opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-3 content-start">
                    <MiniStat icon={<Shield size={16} />} label="Conformes" value={stats.cables.conforme || 0} color="bg-emerald-50 text-emerald-500" />
                    <MiniStat icon={<AlertTriangle size={16} />} label="Non Conf." value={stats.cables.nonConforme || 0} color="bg-red-50 text-red-500" />
                    <MiniStat icon={<Zap size={16} />} label="Majeures" value={stats.anomalies.majeur || 0} color="bg-amber-50 text-amber-500" />
                    <MiniStat icon={<BarChart3 size={16} />} label="Terminés" value={stats.orders.termine || 0} color="bg-indigo-50 text-indigo-500" />
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-8 rounded-[40px] border border-white shadow-2xl shadow-indigo-900/5 lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-800">Activité Récente</h3>
                        <span className="chip text-sm">En direct</span>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-gray-400">Chargement...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {[...recentInspections.slice(0, 2).map((ins, i) => ({
                                type: 'inspection', key: `ins-${i}`,
                                icon: <CheckCircle size={14} />,
                                iconBg: 'bg-emerald-50 text-emerald-500',
                                title: `Câble #${ins.reference || ins.id?.substring(0, 10)}`,
                                sub: `OF: ${ins.orderId?.substring(0, 10) || '—'}`,
                                date: ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString('fr-FR') : '',
                            })), ...recentAnomalies.filter(a => a.severity?.toLowerCase() === 'critique').slice(0, 3).map((ano, i) => ({
                                type: 'anomaly', key: `ano-${i}`,
                                icon: <AlertTriangle size={14} />,
                                iconBg: 'bg-red-50 text-red-500',
                                title: `Alerte Critique: ${ano.type}`,
                                sub: `${ano.reference || 'REF-STD'} — ${ano.confidence ? (ano.confidence * 100).toFixed(0) : 0}% confiance`,
                                date: ano.detectedAt?.seconds
                                    ? new Date(ano.detectedAt.seconds * 1000).toLocaleDateString('fr-FR')
                                    : ano.detectedAt ? new Date(ano.detectedAt).toLocaleDateString('fr-FR') : '',
                            }))].map(item => (
                                <div key={item.key} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate">{item.title}</p>
                                        <p className="text-sm text-gray-400 truncate">{item.sub}</p>
                                    </div>
                                    <span className="text-sm text-gray-300 flex-shrink-0">{item.date}</span>
                                </div>
                            ))}
                            {recentInspections.length === 0 && recentAnomalies.length === 0 && (
                                <div className="py-6 text-center">
                                    <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                                    <p className="text-sm text-gray-400">Aucune activité récente</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
