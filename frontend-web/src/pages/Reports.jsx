import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
    FileText, Download, Printer, Search, Calendar, AlertTriangle, 
    CheckCircle, Clock, Info, ShieldAlert, BarChart3, ListFilter, Camera,
    LayoutDashboard, Archive
} from 'lucide-react';
import { CableService, AnomalyService, UserService, ReportService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer 
} from 'recharts';
import PageHeader from '../components/PageHeader';

const Reports = () => {
    const { user } = useAuth();
    const reportRef = useRef(null);

    // States
    const [activeTab, setActiveTab] = useState('dashboard');
    const [cables, setCables] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [archivedReports, setArchivedReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [periodType, setPeriodType] = useState('Semaine');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterCableType, setFilterCableType] = useState('');
    const [filterResult, setFilterResult] = useState('Tous');
    const [filterDefect, setFilterDefect] = useState('Tous');
    const [filterLine, setFilterLine] = useState('Toutes');
    const [filterOperator, setFilterOperator] = useState('Tous');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cablesRes, anomaliesRes, reportsRes] = await Promise.all([
                    CableService.getAll(),
                    AnomalyService.getAll(),
                    ReportService.getAll()
                ]);
                setCables(cablesRes.data || []);
                setAnomalies(anomaliesRes.data || []);
                setArchivedReports(reportsRes.data || []);
                
                // Init dates
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 7);
                setDateStart(start.toISOString().split('T')[0]);
                setDateEnd(end.toISOString().split('T')[0]);
            } catch (error) {
                console.error("Erreur de récupération des données :", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePeriodChange = (type) => {
        setPeriodType(type);
        const end = new Date();
        const start = new Date();
        if (type === 'Jour') {
            start.setHours(0, 0, 0, 0);
        } else if (type === 'Semaine') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'Mois') {
            start.setMonth(end.getMonth() - 1);
        } else {
            return;
        }
        setDateStart(start.toISOString().split('T')[0]);
        setDateEnd(end.toISOString().split('T')[0]);
    };

    // Derived Data (Filtering)
    const filteredCables = cables.filter(cable => {
        const cableDate = new Date(cable.inspectionDate || cable.createdAt || Date.now());
        const ds = dateStart ? new Date(dateStart) : null;
        const de = dateEnd ? new Date(dateEnd) : null;
        if (ds && cableDate < ds) return false;
        if (de) {
            const endOfDay = new Date(de);
            endOfDay.setHours(23, 59, 59, 999);
            if (cableDate > endOfDay) return false;
        }
        if (filterCableType && !cable.reference?.toLowerCase().includes(filterCableType.toLowerCase())) return false;
        if (filterResult && filterResult !== 'Tous') {
            if (filterResult === 'Conforme' && cable.status !== 'Conforme') return false;
            if (filterResult === 'Non conforme' && cable.status !== 'Non conforme') return false;
            if (filterResult === 'En attente' && cable.status !== 'En attente') return false;
        }
        if (filterLine !== 'Toutes' && cable.line !== filterLine) return false; // Not strictly in DB but logic holds
        if (filterOperator !== 'Tous' && cable.technicianName !== filterOperator) return false;
        return true;
    });

    const filteredAnomalies = anomalies.filter(an => {
        const anDate = new Date(an.detectedAt || Date.now());
        const ds = dateStart ? new Date(dateStart) : null;
        const de = dateEnd ? new Date(dateEnd) : null;
        if (ds && anDate < ds) return false;
        if (de) {
            const endOfDay = new Date(de);
            endOfDay.setHours(23, 59, 59, 999);
            if (anDate > endOfDay) return false;
        }
        if (filterDefect && filterDefect !== 'Tous' && an.type !== filterDefect) return false;
        if (filterOperator !== 'Tous' && an.technicianName !== filterOperator) return false;
        return true;
    });

    // KPIs
    const totalCables = filteredCables.length;
    const conformCables = filteredCables.filter(c => c.status === 'Conforme').length;
    const nonConformCables = filteredCables.filter(c => c.status === 'Non conforme').length;
    const conformityRate = totalCables ? ((conformCables / totalCables) * 100).toFixed(1) : 0;
    const nonConformityRate = totalCables ? ((nonConformCables / totalCables) * 100).toFixed(1) : 0;
    const avgAiScore = filteredAnomalies.length ? (filteredAnomalies.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / filteredAnomalies.length * 100).toFixed(1) : 0;
    const avgTime = "4.2"; 
    const criticalAlerts = filteredAnomalies.filter(a => a.severity?.toLowerCase() === 'critique').length;

    // Charts Data
    const defectsByDate = {};
    filteredAnomalies.forEach(an => {
        const dateStr = new Date(an.detectedAt).toLocaleDateString('fr-FR');
        defectsByDate[dateStr] = (defectsByDate[dateStr] || 0) + 1;
    });
    const lineChartData = Object.keys(defectsByDate)
        .map(date => ({ date, Defauts: defectsByDate[date] }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));

    const pieChartData = [
        { name: 'Conformes', value: conformCables, color: '#10b981' },
        { name: 'Non Conformes', value: nonConformCables, color: '#ef4444' },
    ];

    const defectsByType = {};
    filteredAnomalies.forEach(an => {
        defectsByType[an.type || 'Inconnu'] = (defectsByType[an.type || 'Inconnu'] || 0) + 1;
    });
    const barChartData = Object.keys(defectsByType).map(type => ({ type, count: defectsByType[type] })).sort((a, b) => b.count - a.count);

    // PDF Export pure logic
    const handleExportPDF = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 40;

        // --- 1. En-tête ---
        doc.setFillColor(30, 58, 138); // Dark indigo
        doc.rect(0, 0, pageWidth, 80, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("ICEM", 40, 45);
        
        doc.setFontSize(14);
        doc.text(`Rapport ${periodType === 'Jour' ? 'Journalier' : periodType === 'Semaine' ? 'Hebdomadaire' : periodType === 'Mois' ? 'Mensuel' : 'Personnalisé'} d'Inspection IA`, 120, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(`Date de génération : ${new Date().toLocaleString('fr-FR')}`, 40, 110);
        doc.text(`Période analysée : du ${dateStart ? new Date(dateStart).toLocaleDateString('fr-FR') : '—'} au ${dateEnd ? new Date(dateEnd).toLocaleDateString('fr-FR') : '—'}`, 40, 125);
        doc.text(`Responsable : ${user?.fullName || 'Responsable Qualité'}`, 40, 140);
        doc.text(`Type de rapport : ${periodType}`, 40, 155);

        // Paramètres de filtres
        doc.text(`Filtres : Ligne (${filterLine}) | Câble (${filterCableType || 'Tous'}) | Opérateur (${filterOperator})`, 40, 170);

        currentY = 200;

        // --- 2. KPIs Principaux ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("Indicateurs Clés de Performance (KPIs)", 40, currentY);
        currentY += 15;

        autoTable(doc, {
            startY: currentY,
            head: [['Total Inspectés', 'Conformes', 'Non Conformes', 'Taux Conf.', 'Score IA Moyen', 'Alertes Critiques']],
            body: [[
                totalCables.toString(),
                conformCables.toString(),
                nonConformCables.toString(),
                `${conformityRate}%`,
                `${avgAiScore}%`,
                criticalAlerts.toString()
            ]],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center', fontSize: 11, fontStyle: 'bold', textColor: [50, 50, 50] },
            margin: { left: 40, right: 40 }
        });
        
        currentY = doc.lastAutoTable.finalY + 30;

        // --- 3. Synthèse Automatique ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("Synthèse Automatique", 40, currentY);
        currentY += 15;

        const topDefects = Object.entries(defectsByType).sort((a,b) => b[1]-a[1]).slice(0, 2).map(d => d[0]).join(' et ');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        const synthesisText = `Pendant la période sélectionnée, le système a inspecté ${totalCables} câbles avec un taux de conformité de ${conformityRate}%. Les défauts les plus fréquents sont : ${topDefects || 'Aucun'}. Il y a eu ${criticalAlerts} alertes critiques nécessitant une attention immédiate. Le temps moyen d'inspection estimé par le système IA est de ${avgTime} secondes.`;
        
        const splitSynthesis = doc.splitTextToSize(synthesisText, pageWidth - 80);
        doc.text(splitSynthesis, 40, currentY);
        currentY += (splitSynthesis.length * 15) + 30;

        // --- 4. Données détaillées ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("Détail des Inspections et Anomalies", 40, currentY);
        
        const tableData = filteredAnomalies.map(an => [
            an.id?.substring(0, 6) || '—',
            new Date(an.detectedAt).toLocaleString('fr-FR', {day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}),
            an.cableId?.substring(0, 6) || '—',
            an.technicianName || 'Auto System',
            an.type || '—',
            an.severity || '—',
            an.confidence ? `${(an.confidence*100).toFixed(0)}%` : '—',
            an.severity?.toLowerCase() === 'critique' ? 'Rejeter' : 'Recontrôle'
        ]);

        if (tableData.length > 0) {
            autoTable(doc, {
                startY: currentY + 15,
                head: [['ID Insp.', 'Date', 'ID Câble', 'Opérateur', 'Défaut', 'Gravité', 'Confiance', 'Action']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [30, 58, 138] },
                styles: { fontSize: 8, cellPadding: 4 },
                margin: { left: 40, right: 40 }
            });
            currentY = doc.lastAutoTable.finalY + 30;
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text("Aucune anomalie détectée pour cette période.", 40, currentY + 20);
            currentY += 40;
        }

        // Pagination check for signature block
        if (currentY > doc.internal.pageSize.getHeight() - 250) {
            doc.addPage();
            currentY = 40;
        }

        // --- 5. Conclusion & Signatures ---
        doc.setFillColor(248, 250, 252);
        doc.rect(40, currentY, pageWidth - 80, 120, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(40, currentY, pageWidth - 80, 120, 'S');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text("Remarques du Responsable :", 50, currentY + 20);
        
        // Pointillés
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(50, currentY + 45, pageWidth - 50, currentY + 45);
        doc.line(50, currentY + 65, pageWidth - 50, currentY + 65);
        doc.line(50, currentY + 85, pageWidth - 50, currentY + 85);
        doc.setLineDashPattern([], 0);

        currentY += 150;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("Décision Finale : [   ] Rapport Validé    [   ] Correction Demandée    [   ] Analyse Complémentaire", 40, currentY);
        
        currentY += 40;
        doc.text("Signature Responsable Production", 40, currentY);
        doc.text("Signature Responsable Qualité", pageWidth - 200, currentY);

        // Footer pagination
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${i} sur ${pageCount} - Système d'Inspection de Câbles par IA`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 20,
                { align: 'center' }
            );
        }

        doc.save(`ICEM_Rapport_${periodType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleExportExcel = () => {
        const tableData = filteredAnomalies.map(an => ({
            'ID Inspection': an.inspectionId || an.id,
            'Date et heure': new Date(an.detectedAt).toLocaleString('fr-FR'),
            'ID Câble': an.cableId || '',
            'Opérateur': an.technicianName || '',
            'Résultat': an.statut || 'Non conforme',
            'Type de défaut': an.type || '',
            'Gravité': an.severity || '',
            'Score de confiance': an.confidence ? `${(an.confidence * 100).toFixed(1)}%` : '',
            'Action recommandée': an.mesureCorrective || (an.severity?.toLowerCase() === 'critique' ? 'Rejeter' : 'Recontrôle')
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(tableData);
        XLSX.utils.book_append_sheet(wb, ws, "Inspections");
        saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), `ICEM_Rapport_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadArchivedReport = (report) => {
        // Here we just build a PDF dynamically for the mobile report
        const doc = new jsPDF('p', 'pt', 'a4');
        doc.setFontSize(22);
        doc.setTextColor(30, 58, 138);
        doc.text("ICEM Quality Control", 40, 50);
        
        doc.setFontSize(14);
        doc.setTextColor(71, 85, 105);
        doc.text(`Type : ${report.type || "Rapport d'Inspection"}`, 40, 70);
        
        doc.setFontSize(10);
        doc.text(`Généré le : ${new Date(report.generatedAt || report.createdAt).toLocaleString('fr-FR')}`, 40, 90);
        doc.text(`Ordre de Fabrication : ${report.orderId || 'Global'}`, 40, 105);
        doc.text(`Technicien : ${report.technicianName || 'Inconnu'}`, 40, 120);

        autoTable(doc, {
            startY: 150,
            head: [['Détail', 'Valeur']],
            body: [
                ['Statut Global', report.conformityStatus || 'Non renseigné'],
                ['Nombre d\'anomalies', (report.anomaliesCount || 0).toString()],
                ['ID Câble (si applicable)', report.cableId || 'N/A'],
            ],
            theme: 'striped'
        });

        doc.save(`ICEM_Rapport_Mobile_${report.id || Date.now()}.pdf`);
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    const uniqueDefects = [...new Set(anomalies.map(a => a.type))].filter(Boolean);

    return (
        <div className="flex flex-col gap-6" id="reporting-page">
            <PageHeader 
                title="Analyses & Rapports"
                subtitle="Synthèse de performance qualité et historique des inspections automatisées"
                icon={<BarChart3 />}
                actions={
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                            <Download size={18} /> PDF Officiel
                        </button>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 w-fit">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <LayoutDashboard size={18} /> Rapport Global
                </button>
                <button 
                    onClick={() => setActiveTab('archives')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        activeTab === 'archives' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Archive size={18} /> Historique des Rapports (Mobile)
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <>
                    {/* Barre de Filtres */}
                    <div id="report-filters" className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-3">
                            <ListFilter size={20} className="text-indigo-600" />
                            <h2 className="text-base font-bold text-slate-800">Filtres du Rapport Global</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Période</label>
                                <select className="input-field text-sm" value={periodType} onChange={(e) => handlePeriodChange(e.target.value)}>
                                    <option value="Jour">Aujourd'hui</option>
                                    <option value="Semaine">Cette semaine</option>
                                    <option value="Mois">Ce mois</option>
                                    <option value="Personnalisée">Personnalisée</option>
                                </select>
                            </div>
                            {periodType === 'Personnalisée' && (
                                <>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date début</label>
                                        <input type="date" className="input-field text-sm" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Date fin</label>
                                        <input type="date" className="input-field text-sm" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                                    </div>
                                </>
                            )}
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Ligne / Poste</label>
                                <select className="input-field text-sm" value={filterLine} onChange={e => setFilterLine(e.target.value)}>
                                    <option value="Toutes">Toutes</option>
                                    <option value="Ligne 1">Ligne 1</option>
                                    <option value="Ligne 2">Ligne 2</option>
                                    <option value="Ligne 3">Ligne 3</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Opérateur</label>
                                <select className="input-field text-sm" value={filterOperator} onChange={e => setFilterOperator(e.target.value)}>
                                    <option value="Tous">Tous</option>
                                    {[...new Set([...anomalies.map(a => a.technicianName), ...cables.map(c => c.technicianName)])].filter(Boolean).map(op => (
                                        <option key={op} value={op}>{op}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Type de câble</label>
                                <input type="text" placeholder="Référence..." className="input-field text-sm" value={filterCableType} onChange={e => setFilterCableType(e.target.value)} />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Résultat</label>
                                <select className="input-field text-sm" value={filterResult} onChange={e => setFilterResult(e.target.value)}>
                                    <option value="Tous">Tous</option>
                                    <option value="Conforme">Conforme</option>
                                    <option value="Non conforme">Non conforme</option>
                                    <option value="En attente">En attente</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Type de défaut</label>
                                <select className="input-field text-sm" value={filterDefect} onChange={e => setFilterDefect(e.target.value)}>
                                    <option value="Tous">Tous</option>
                                    {uniqueDefects.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div id="report-actions" className="flex justify-end gap-3">
                        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
                            <Download size={16} /> Exporter PDF Officiel
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-semibold text-sm transition-colors">
                            <FileText size={16} /> Exporter Excel
                        </button>
                    </div>

                    {/* RAPPORT VISUEL */}
                    <div ref={reportRef} className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 md:p-12 w-full mx-auto">
                        
                        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-8 mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-white font-black text-3xl tracking-tighter">ICEM</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Rapport d'Inspection IA</h1>
                                    <p className="text-slate-500 font-semibold mt-1">Système d'Inspection Automatisé</p>
                                </div>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Inspectés</p>
                                <p className="text-4xl font-black text-slate-800">{totalCables}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Conformes</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-black text-emerald-700">{conformCables}</p>
                                    <p className="text-sm font-black text-emerald-600 mb-1.5">({conformityRate}%)</p>
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
                                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">Non Conformes</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-black text-red-700">{nonConformCables}</p>
                                    <p className="text-sm font-black text-red-600 mb-1.5">({nonConformityRate}%)</p>
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm">
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Alertes Critiques</p>
                                <p className="text-4xl font-black text-orange-700">{criticalAlerts}</p>
                            </div>
                        </div>

                        {/* Tableau détaillé */}
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><ListFilter size={24} className="text-indigo-500"/> Registre des Anomalies</h2>
                        <div className="border border-slate-200 rounded-3xl overflow-hidden mb-12 shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Câble / Réf</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Défaut</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Gravité</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Confiance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAnomalies.slice(0, 10).map(an => (
                                        <tr key={an.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-4 font-bold text-slate-700">{new Date(an.detectedAt).toLocaleString('fr-FR', {day: '2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="px-5 py-4 text-slate-600 font-medium">{an.cableId || '—'}</td>
                                            <td className="px-5 py-4 font-black text-slate-800">{an.type}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded text-xs font-black tracking-widest uppercase ${
                                                    an.severity?.toLowerCase() === 'critique' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {an.severity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600 font-bold">{an.confidence ? `${(an.confidence*100).toFixed(0)}%` : '—'}</td>
                                        </tr>
                                    ))}
                                    {filteredAnomalies.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Aucune anomalie.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Synthèse Automatique - THÈME CLAIR */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 mb-4 text-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 text-indigo-200 opacity-50">
                                <Info size={120} />
                            </div>
                            <h3 className="font-black text-xl mb-4 flex items-center gap-3 relative z-10"><Info size={24} className="text-indigo-600"/> Synthèse Automatique</h3>
                            <p className="text-slate-700 text-sm leading-relaxed relative z-10 font-medium">
                                Pendant la période sélectionnée (du {dateStart ? new Date(dateStart).toLocaleDateString('fr-FR') : '—'} au {dateEnd ? new Date(dateEnd).toLocaleDateString('fr-FR') : '—'}), le système a inspecté <strong className="text-indigo-900 text-base">{totalCables} câbles</strong> avec un taux de conformité de <strong className={conformityRate >= 90 ? 'text-emerald-700 text-base' : 'text-orange-700 text-base'}>{conformityRate}%</strong>. 
                                Il y a eu <strong className={criticalAlerts > 0 ? 'text-red-600 text-base' : 'text-emerald-600 text-base'}>{criticalAlerts} alertes critiques</strong>.
                            </p>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'archives' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 w-full mx-auto">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                        <Archive className="text-indigo-600" size={28} />
                        Rapports de l'application mobile
                    </h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        Ces rapports ont été générés directement par les techniciens sur le terrain depuis l'application mobile lors de la détection de défauts ou du contrôle qualité global.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {archivedReports.length === 0 ? (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                <Archive size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600 mb-2">Aucun rapport disponible</h3>
                                <p className="text-sm text-slate-400">Les rapports générés depuis l'application mobile apparaîtront ici.</p>
                            </div>
                        ) : (
                            archivedReports.sort((a,b) => new Date(b.generatedAt || b.createdAt) - new Date(a.generatedAt || a.createdAt)).map(report => (
                                <div key={report.id} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-shadow group flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <FileText size={24} />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                            report.type === 'Rapport de Défaut' || report.conformityStatus === 'Non conforme' 
                                                ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {report.type || 'Inspection'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{report.type || 'Rapport sans titre'}</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">OF : {report.orderId || 'Global'}</p>
                                    
                                    <div className="space-y-2 mb-6 flex-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Généré le</span>
                                            <span className="font-bold text-slate-700">{new Date(report.generatedAt || report.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Par</span>
                                            <span className="font-bold text-slate-700">{report.technicianName || 'Inconnu'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Anomalies</span>
                                            <span className="font-bold text-slate-700">{report.anomaliesCount || 0}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => downloadArchivedReport(report)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600"
                                    >
                                        <Download size={16} /> Télécharger
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
