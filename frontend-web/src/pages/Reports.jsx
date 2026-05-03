import React, { useState, useEffect } from 'react';
import { FileText, Download, FilePieChart, Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import { ReportService, OrderService, AnomalyService, CableService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const { canGenerateReport, canExport } = useAuth();

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await ReportService.getAll();
            setReports(response.data);
        } catch (error) {
            console.error("Erreur rapports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true);
            await ReportService.generate({
                type: 'Production Hebdomadaire',
                orderId: 'global',
                technicianId: JSON.parse(localStorage.getItem('currentUser') || '{}').id || 'unknown'
            });
            setTimeout(() => {
                fetchReports();
                setIsGenerating(false);
                alert("Le rapport a été généré avec succès !");
            }, 2000);
        } catch (error) {
            console.error("Erreur génération", error);
            setIsGenerating(false);
        }
    };

    const handleExportPDF = async (report) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // En-tête
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('ICEM QUALITY CONTROL', 14, 18);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(`RAPPORT DE PRODUCTION : ${report.type || 'Standard'}`, 14, 28);
            doc.text(`GÉNÉRÉ LE : ${new Date(report.generatedAt || Date.now()).toLocaleString('fr-FR')}`, 14, 35);

            // Informations du rapport
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Informations du Rapport', 14, 55);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const infoY = 63;
            doc.text(`ID: ${report.id}`, 14, infoY);
            doc.text(`Source: ${report.orderId && report.orderId !== 'global' ? `Ordre #${report.orderId.substring(0, 8)}` : 'Données Globales'}`, 14, infoY + 7);
            doc.text(`Type: ${report.type || 'Production'}`, 14, infoY + 14);

            // Récupérer les données pour le rapport
            let ordersData = [];
            let anomaliesData = [];
            let cableStats = { total: 0, conforme: 0, nonConforme: 0, enAttente: 0 };
            try {
                const [ordersRes, anomaliesRes, cableStatsRes] = await Promise.all([
                    OrderService.getAll(),
                    AnomalyService.getAll(),
                    CableService.getStats(),
                ]);
                ordersData = ordersRes.data || [];
                anomaliesData = anomaliesRes.data || [];
                cableStats = cableStatsRes.data || cableStats;
            } catch (e) {
                console.error('Error fetching data for PDF:', e);
            }

            // KPIs
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Indicateurs Clés (KPIs)', 14, infoY + 30);

            const kpiY = infoY + 38;
            const totalOrders = ordersData.length;
            const enCours = ordersData.filter(o => o.status?.toLowerCase() === 'en cours').length;
            const termine = ordersData.filter(o => ['terminé', 'termine'].includes(o.status?.toLowerCase())).length;
            const totalAnomalies = anomaliesData.length;
            const critiques = anomaliesData.filter(a => a.severity?.toLowerCase() === 'critique').length;

            doc.autoTable({
                startY: kpiY,
                head: [['Indicateur', 'Valeur']],
                body: [
                    ['Total Ordres de Fabrication', totalOrders.toString()],
                    ['Ordres En Cours', enCours.toString()],
                    ['Ordres Terminés', termine.toString()],
                    ['Câbles Inspectés', (cableStats.total || 0).toString()],
                    ['Câbles Conformes', (cableStats.conforme || 0).toString()],
                    ['Total Anomalies Détectées', totalAnomalies.toString()],
                    ['Anomalies Critiques', critiques.toString()],
                    ['Taux de Conformité', cableStats.total > 0 ? `${Math.round(((cableStats.conforme || 0) / cableStats.total) * 100)}%` : 'N/A'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 10 },
                bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 },
            });

            // Tableau des anomalies récentes
            if (anomaliesData.length > 0) {
                const lastTableY = doc.lastAutoTable.finalY + 15;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Anomalies Récentes', 14, lastTableY);

                doc.autoTable({
                    startY: lastTableY + 8,
                    head: [['Type', 'Gravité', 'Technicien', 'Confiance IA', 'Date', 'Statut']],
                    body: anomaliesData.slice(0, 15).map(a => [
                        a.type || '—',
                        a.severity || '—',
                        a.technicianName || 'Système',
                        a.confidence ? `${(a.confidence * 100).toFixed(0)}%` : '—',
                        a.detectedAt ? new Date(a.detectedAt).toLocaleDateString('fr-FR') : '—',
                        a.statut === 'traitee' ? 'Traitée' : a.statut === 'en_traitement' ? 'En traitement' : 'Détectée',
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
                    alternateRowStyles: { fillColor: [254, 242, 242] },
                    margin: { left: 14, right: 14 },
                });
            }

            // Pied de page
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `ICEM Quality Control — Rapport généré le ${new Date().toLocaleString('fr-FR')} — Page ${i}/${pageCount}`,
                    pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' }
                );
            }

            doc.save(`ICEM_RAPPORT_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Erreur export PDF:', error);
            alert("Erreur lors de l'exportation du document PDF. Veuillez vérifier la console.");
        }
    };

    const handleExportExcel = async () => {
        try {
            const [ordersRes, anomaliesRes, cableStatsRes] = await Promise.all([
                OrderService.getAll(),
                AnomalyService.getAll(),
                CableService.getStats(),
            ]);
            const ordersData = ordersRes.data || [];
            const anomaliesData = anomaliesRes.data || [];
            const cableStats = cableStatsRes.data || { total: 0, conforme: 0, nonConforme: 0, enAttente: 0 };

            // Feuille 1: Ordres de Fabrication
            const ordersSheet = ordersData.map(o => ({
                'Référence': o.reference || '',
                'N° OF': o.numeroOF || '',
                'Client': o.client || '',
                'Statut': o.status || '',
                'Quantité': o.qta || 0,
                'Inspectés': o.inspectedCount || 0,
                'Conformes': o.conformCount || 0,
                'Non Conformes': o.nonConformCount || 0,
                'Taux Conformité (%)': o.inspectedCount > 0 ? Math.round((o.conformCount / o.inspectedCount) * 100) : 0,
                'Date Livraison': o.dateLiv ? new Date(o.dateLiv).toLocaleDateString('fr-FR') : '',
            }));

            // Feuille 2: Anomalies
            const anomaliesSheet = anomaliesData.map(a => ({
                'Type': a.type || '',
                'Gravité': a.severity || '',
                'Technicien': a.technicianName || 'Système',
                'Confiance IA (%)': a.confidence ? (a.confidence * 100).toFixed(0) : '',
                'Câble': a.cableId || '',
                'Statut': a.statut === 'traitee' ? 'Traitée' : a.statut === 'en_traitement' ? 'En traitement' : 'Détectée',
                'Date Détection': a.detectedAt ? new Date(a.detectedAt).toLocaleString('fr-FR') : '',
                'Description': a.description || '',
            }));

            // Feuille 3: Résumé (KPIs)
            const totalOrders = ordersData.length;
            const enCours = ordersData.filter(o => o.status?.toLowerCase() === 'en cours').length;
            const termine = ordersData.filter(o => ['terminé', 'termine'].includes(o.status?.toLowerCase())).length;
            const totalAnomalies = anomaliesData.length;
            const critiques = anomaliesData.filter(a => a.severity?.toLowerCase() === 'critique').length;

            const summarySheet = [
                { 'Indicateur': 'Total Ordres', 'Valeur': totalOrders },
                { 'Indicateur': 'Ordres En Cours', 'Valeur': enCours },
                { 'Indicateur': 'Ordres Terminés', 'Valeur': termine },
                { 'Indicateur': 'Câbles Inspectés', 'Valeur': cableStats.total || 0 },
                { 'Indicateur': 'Câbles Conformes', 'Valeur': cableStats.conforme || 0 },
                { 'Indicateur': 'Total Anomalies', 'Valeur': totalAnomalies },
                { 'Indicateur': 'Anomalies Critiques', 'Valeur': critiques },
                { 'Indicateur': 'Taux Conformité (%)', 'Valeur': cableStats.total > 0 ? Math.round(((cableStats.conforme || 0) / cableStats.total) * 100) : 'N/A'},
                { 'Indicateur': 'Date Export', 'Valeur': new Date().toLocaleString('fr-FR') },
            ];

            // Créer le workbook Excel
            const wb = XLSX.utils.book_new();
            const ws1 = XLSX.utils.json_to_sheet(summarySheet);
            const ws2 = XLSX.utils.json_to_sheet(ordersSheet);
            const ws3 = XLSX.utils.json_to_sheet(anomaliesSheet);

            // Définir la largeur des colonnes
            ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
            ws2['!cols'] = Array(10).fill({ wch: 18 });
            ws3['!cols'] = Array(8).fill({ wch: 18 });

            XLSX.utils.book_append_sheet(wb, ws1, 'Résumé');
            XLSX.utils.book_append_sheet(wb, ws2, 'Ordres');
            XLSX.utils.book_append_sheet(wb, ws3, 'Anomalies');

            // Générer et télécharger
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `ICEM_Rapport_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Erreur export Excel:', error);
            alert("Erreur lors de l'export Excel");
        }
    };

    const sortedReports = [...reports].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    const lastReportDate = sortedReports.length > 0 ? new Date(sortedReports[0].generatedAt).toLocaleDateString() : 'Aucun';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapports Qualité</h1>
                    <p className="text-sm text-slate-500 mt-1">Consultez et exportez l'historique de production et d'inspection</p>
                </div>
                {canGenerateReport && (
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Génération...
                            </>
                        ) : (
                            <>
                                <FilePieChart size={18} />
                                Générer Rapport Global
                            </>
                        )}
                    </button>
                )}
                {canExport && (
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                >
                    <FileSpreadsheet size={18} />
                    Export Excel
                </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="card flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Rapports Archivés</p>
                        <p className="text-2xl font-bold text-slate-800">{reports.length}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Download size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Téléchargements</p>
                        <p className="text-2xl font-bold text-slate-800">{reports.length * 3}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Dernier Rapport</p>
                        <p className="text-base font-bold text-slate-800">{lastReportDate}</p>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type de Rapport</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && !isGenerating ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-accent rounded-full animate-spin mx-auto mb-3"></div>
                                        Récupération de l'historique...
                                    </td>
                                </tr>
                            ) : sortedReports.length > 0 ? (
                                sortedReports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock size={14} className="text-slate-400" />
                                                <span className="font-medium text-slate-700">
                                                    {new Date(report.generatedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
                                                    <FileText size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {report.type || 'Rapport de Production'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {report.orderId && report.orderId !== 'global'
                                                ? `Ordre #${report.orderId.substring(0, 8)}`
                                                : 'Données Globales'}
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {report.technicianName || report.technicianId || 'Système'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canExport && (
                                                <button
                                                    onClick={() => handleExportPDF(report)}
                                                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg transition-all"
                                                >
                                                    <Download size={14} />
                                                    EXPORT PDF
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center">
                                        <FileText className="mx-auto text-slate-200 mb-3" size={44} />
                                        <p className="text-slate-500 font-medium">Aucun rapport trouvé</p>
                                        <p className="text-sm text-slate-400 mt-1">Cliquez sur "Générer Rapport Global" pour créer votre premier rapport</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
