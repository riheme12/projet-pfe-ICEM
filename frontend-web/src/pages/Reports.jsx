import React, { useState, useEffect } from 'react';
import { FileText, Download, FilePieChart, Calendar, Clock } from 'lucide-react';
import { ReportService } from '../services/api';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

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

    const sortedReports = [...reports].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    const lastReportDate = sortedReports.length > 0 ? new Date(sortedReports[0].generatedAt).toLocaleDateString() : 'Aucun';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rapports Qualité</h1>
                    <p className="text-sm text-slate-500 mt-1">Consultez et exportez l'historique de production et d'inspection</p>
                </div>
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
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg transition-all">
                                                <Download size={14} />
                                                EXPORT PDF
                                            </button>
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
