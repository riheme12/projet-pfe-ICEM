import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/manufacturing_order.dart';
import '../models/report.dart';
import '../services/reports_service.dart';

/// Service pour générer et exporter des rapports au format PDF
class PdfExportService {
  /// Générer un PDF pour un ordre de fabrication
  static Future<void> exportOrderReport(ManufacturingOrder order) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(
                level: 0,
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('RAPPORT DE CONTROLE QUALITE ICEM', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
                    pw.Text(DateTime.now().toString().substring(0, 10)),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              pw.SizedBox(height: 20),
              pw.Text('Référence: ${order.reference}', style: pw.TextStyle(fontSize: 14)),
              pw.Text('N° OF: ${order.numeroOF}', style: pw.TextStyle(fontSize: 14)),
              pw.Text('Client/Commande: ${order.client ?? order.numComd}', style: pw.TextStyle(fontSize: 14)),
              pw.Text('Ligne/Machine: ${order.ligne ?? 'N/A'}', style: pw.TextStyle(fontSize: 14)),
              pw.Text('Responsable: ${order.assignedTechnicianId ?? 'Système'}', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
              pw.Text('Date: ${order.dateLiv.day}/${order.dateLiv.month}/${order.dateLiv.year} ${DateTime.now().hour}:${DateTime.now().minute}', style: pw.TextStyle(fontSize: 14)),
              pw.Text('Statut: ${order.status}', style: pw.TextStyle(fontSize: 14)),
              pw.SizedBox(height: 30),
              pw.Header(level: 1, text: 'Statistiques de production'),
              pw.Bullet(text: 'Quantité totale: ${order.qta}'),
              pw.Bullet(text: 'Inspectés: ${order.inspectedCount}'),
              pw.Bullet(text: 'Conformes: ${order.conformCount} (${order.conformityRate.toStringAsFixed(1)}%)'),
              pw.Bullet(text: 'Non conformes: ${order.nonConformCount}'),
              pw.SizedBox(height: 40),
              pw.Paragraph(
                text: 'Ce document atteste du contrôle qualité effectué via l\'application intelligente ICEM. '
                    'Les données ont été générées automatiquement par le système de vision artificielle.',
              ),
              pw.Spacer(),
              pw.Divider(),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Text('ICEM Quality Assurance System v1.0', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey)),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Rapport_${order.reference}.pdf',
    );
  }

  /// Générer un PDF pour un rapport d'inspection individuel
  static Future<void> exportInspectionReport(Report report) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(level: 0, text: 'CERTIFICAT D\'INSPECTION CABLE'),
              pw.SizedBox(height: 20),
              pw.Text('ID Rapport: ${report.id}'),
              pw.Text('ID Câble: ${report.cableId}'),
              pw.Text('Technicien: ${report.technicianName ?? report.technicianId}'),
              pw.Text('Date d\'inspection: ${report.generatedAt.day}/${report.generatedAt.month}/${report.generatedAt.year} ${report.generatedAt.hour}:${report.generatedAt.minute}'),
              pw.SizedBox(height: 20),
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: report.isConform ? PdfColors.green100 : PdfColors.red100,
                  border: pw.Border.all(color: report.isConform ? PdfColors.green : PdfColors.red),
                ),
                child: pw.Center(
                  child: pw.Text(
                    report.conformityStatus.toUpperCase(),
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 20, color: report.isConform ? PdfColors.green : PdfColors.red),
                  ),
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Text('Nombre d\'anomalies détectées: ${report.anomaliesCount}'),
              if (report.notes != null) ...[
                pw.SizedBox(height: 20),
                pw.Text('Commentaires:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                pw.Text(report.notes!),
              ],
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Inspection_${report.cableId}.pdf',
    );
  }

  /// Générer un PDF pour les statistiques globales
  static Future<void> exportGlobalStatsReport(GlobalStats stats, Map<String, int> anomaliesByType) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(level: 0, text: 'RAPPORTS & STATISTIQUES GLOBALES'),
              pw.SizedBox(height: 20),
              pw.Text('Date de génération: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}'),
              pw.SizedBox(height: 30),
              pw.Header(level: 1, text: 'Vue d\'ensemble'),
              pw.Bullet(text: 'Inspections totales: ${stats.totalInspections}'),
              pw.Bullet(text: 'Taux de conformité: ${stats.conformityRate.toStringAsFixed(1)}%'),
              pw.Bullet(text: 'Anomalies totales: ${stats.totalAnomalies}'),
              pw.Bullet(text: 'Rapports générés: ${stats.reportsGenerated}'),
              pw.SizedBox(height: 30),
              pw.Header(level: 1, text: 'Répartition des anomalies'),
              if (anomaliesByType.isEmpty)
                pw.Text('Aucune anomalie enregistrée.')
              else
                ...anomaliesByType.entries.map((e) => pw.Bullet(text: '${e.key} : ${e.value}')),
              pw.Spacer(),
              pw.Divider(),
              pw.Align(
                alignment: pw.Alignment.centerRight,
                child: pw.Text('ICEM Quality Assurance System v1.0', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey)),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Rapport_Global_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );
  }
}
