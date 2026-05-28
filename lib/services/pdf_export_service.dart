import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:projeticem/services/reports_service.dart';
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import '../models/manufacturing_order.dart';
import '../models/report.dart';

/// Service d'export PDF — Template Unifié ICEM
///
/// Tous les rapports partagent le même template :
///   ┌─────────────────────────────────────┐
///   │ [LOGO] ICEM       Nom | Date | Heure │  ← Header
///   │ ════════════════════════════════════ │
///   │       TITRE DU RAPPORT              │  ← Bandeau navy
///   │                                     │
///   │  ▌ SECTION                          │  ← Sections bleues
///   │   [Contenu spécifique]              │
///   │                                     │
///   │ ──────────────────────────────────  │
///   │ © ICEM AI                  Page X/Y │  ← Footer
///   └─────────────────────────────────────┘
class PdfExportService {

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITAIRES PARTAGÉS (template commun)
  // ═══════════════════════════════════════════════════════════════════════

  /// Charger les ressources communes (logo + fonts)
  static Future<_PdfResources> _loadResources() async {
    pw.MemoryImage? logo;
    try {
      final data = await rootBundle.load('assets/images/logo.png');
      logo = pw.MemoryImage(data.buffer.asUint8List());
    } catch (_) {}
    return _PdfResources(
      logo: logo,
      fontRegular: await PdfGoogleFonts.interRegular(),
      fontBold: await PdfGoogleFonts.interBold(),
    );
  }

  /// Télécharger une image réseau ou décoder du base64 pour l'inclure dans le PDF
  static Future<pw.MemoryImage?> _downloadImage(String? url) async {
    if (url == null || url.isEmpty) return null;
    try {
      if (url.startsWith('data:image/') || url.contains(';base64,')) {
        final base64String = url.split(',').last;
        return pw.MemoryImage(base64Decode(base64String));
      }
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        return pw.MemoryImage(response.bodyBytes);
      }
    } catch (e) {
      print('Erreur téléchargement image PDF: $e');
    }
    return null;
  }

  /// Générer un PDF avec le template unifié
  static Future<void> _generatePdf({
    required String title,
    required String userName,
    required String fileName,
    required List<pw.Widget> Function() contentBuilder,
    required _PdfResources res,
    String? signatureUrl,
  }) async {
    final dateStr = DateFormat('dd/MM/yyyy').format(DateTime.now());
    final heureStr = DateFormat('HH:mm').format(DateTime.now());
    final pdf = pw.Document();

    final signatureImage = signatureUrl != null ? await _downloadImage(signatureUrl) : null;

    pdf.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(40),
      theme: pw.ThemeData.withFont(base: res.fontRegular, bold: res.fontBold),
      header: (_) => _header(res.logo, userName, dateStr, heureStr),
      footer: (ctx) => _footer(ctx.pageNumber, ctx.pagesCount),
      build: (_) => [
        pw.SizedBox(height: 16),
        _titleBanner(title),
        pw.SizedBox(height: 24),
        ...contentBuilder(),
        if (signatureImage != null) ...[
          pw.SizedBox(height: 30),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.end,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Text('Signature du Technicien :', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 8),
                  pw.Image(signatureImage, width: 100, height: 50),
                ]
              )
            ]
          )
        ]
      ],
    ));

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: '$fileName.pdf',
    );
  }

  // ─── Header ────────────────────────────────────────────────────────────
  static pw.Widget _header(pw.MemoryImage? logo, String name, String date, String heure) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(bottom: 12),
      decoration: const pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromInt(0xFF2563EB), width: 2))),
      child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
        pw.Row(children: [
          if (logo != null) pw.Image(logo, width: 40, height: 40),
          if (logo != null) pw.SizedBox(width: 12),
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
            pw.Text('ICEM', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A))),
            pw.Text('Smart Quality Control System', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
          ]),
        ]),
        pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
          pw.Text(name, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A))),
          pw.Text('Date : $date', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
          if (heure.isNotEmpty) pw.Text('Heure : $heure', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
        ]),
      ]),
    );
  }

  // ─── Footer ────────────────────────────────────────────────────────────
  static pw.Widget _footer(int page, int total) {
    return pw.Container(
      padding: const pw.EdgeInsets.only(top: 8),
      decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300))),
      child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
        pw.Text('Document généré automatiquement — ICEM AI © 2026', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey500)),
        pw.Text('Page $page / $total', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey500)),
      ]),
    );
  }

  // ─── Title Banner ──────────────────────────────────────────────────────
  static pw.Widget _titleBanner(String title) => pw.Container(
    width: double.infinity,
    padding: const pw.EdgeInsets.symmetric(vertical: 12, horizontal: 16),
    color: const PdfColor.fromInt(0xFF0F172A),
    child: pw.Center(child: pw.Text(
      title.toUpperCase(),
      style: pw.TextStyle(color: PdfColors.white, fontSize: 12, fontWeight: pw.FontWeight.bold, letterSpacing: 1),
    )),
  );

  // ─── Section Header ────────────────────────────────────────────────────
  static pw.Widget _section(String title) => pw.Row(children: [
    pw.Container(width: 3, height: 20, color: const PdfColor.fromInt(0xFF2563EB)),
    pw.Expanded(child: pw.Container(
      padding: const pw.EdgeInsets.symmetric(vertical: 6, horizontal: 10),
      color: const PdfColor.fromInt(0xFFEFF6FF),
      child: pw.Text(title, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A))),
    )),
  ]);

  // ─── KPI Box ───────────────────────────────────────────────────────────
  static pw.Widget _kpi(String label, String value, PdfColor color) => pw.Expanded(
    child: pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200)),
      child: pw.Column(children: [
        pw.Text(value, style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: color)),
        pw.SizedBox(height: 4),
        pw.Text(label, textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 6, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold)),
      ]),
    ),
  );

  // ─── Defects Table ─────────────────────────────────────────────────────
  static pw.Widget _defectsTable(Map<String, int> map) {
    final total = map.values.fold(0, (a, b) => a + b);
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey200),
      columnWidths: {0: const pw.FlexColumnWidth(3), 1: const pw.FlexColumnWidth(1), 2: const pw.FlexColumnWidth(1)},
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFFF1F5F9)),
          children: [
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('TYPE DE DÉFAUT', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('NOMBRE', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('% TOTAL', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
          ],
        ),
        ...map.entries.map((e) {
          final pct = total > 0 ? (e.value / total * 100).toStringAsFixed(1) : '0';
          return pw.TableRow(children: [
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(e.key, style: const pw.TextStyle(fontSize: 8))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('${e.value}', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 8))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('$pct%', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 8))),
          ]);
        }),
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFFF1F5F9)),
          children: [
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('TOTAL', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('$total', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
            pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('100%', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
          ],
        ),
      ],
    );
  }

  // ─── Severity Bars ─────────────────────────────────────────────────────
  static pw.Widget _severityBars(Map<String, int> sev) {
    final total = sev.values.fold(0, (a, b) => a + b);
    if (total == 0) return pw.Text('Aucune anomalie détectée', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey));
    return pw.Column(children: [
      _sevBar('Critique', sev['Critique'] ?? 0, total, PdfColors.red),
      pw.SizedBox(height: 6),
      _sevBar('Majeur', sev['Majeur'] ?? 0, total, PdfColors.orange),
      pw.SizedBox(height: 6),
      _sevBar('Mineur', sev['Mineur'] ?? 0, total, PdfColors.blue),
    ]);
  }

  static pw.Widget _sevBar(String label, int count, int total, PdfColor color) {
    final pct = total > 0 ? count / total : 0.0;
    return pw.Row(children: [
      pw.SizedBox(width: 60, child: pw.Text(label, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
      pw.Expanded(child: pw.ClipRRect(
        horizontalRadius: 3, verticalRadius: 3,
        child: pw.Stack(children: [
          pw.Container(height: 12, color: PdfColors.grey100),
          pw.Container(height: 12, width: (pct * 400).clamp(4, 400), color: color),
        ]),
      )),
      pw.SizedBox(width: 8),
      pw.SizedBox(width: 40, child: pw.Text('$count (${(pct * 100).toStringAsFixed(0)}%)', style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: color))),
    ]);
  }

  // ─── Synthesis Box ─────────────────────────────────────────────────────
  static pw.Widget _synthesisBox(List<String> points) => pw.Container(
    padding: const pw.EdgeInsets.all(16),
    decoration: pw.BoxDecoration(color: const PdfColor.fromInt(0xFFF8FAFC), border: pw.Border.all(color: PdfColors.grey300)),
    child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: points.map((p) => pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 4),
      child: pw.Bullet(text: p, style: const pw.TextStyle(fontSize: 9)),
    )).toList()),
  );

  // ─── Info Grid (for OF reports) ────────────────────────────────────────
  static pw.Widget _infoGrid(List<List<String>> rows) => pw.Container(
    padding: const pw.EdgeInsets.all(12),
    decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200)),
    child: pw.Column(children: rows.map((r) => pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(children: [
        pw.SizedBox(width: 100, child: pw.Text('${r[0]} :', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold))),
        pw.Expanded(child: pw.Text(r[1], style: const pw.TextStyle(fontSize: 9))),
      ]),
    )).toList()),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE 1 : RAPPORT DE PERFORMANCE TECHNICIEN (Mobile)
  // ═══════════════════════════════════════════════════════════════════════
  static Future<void> exportTechnicianReport({
    required String technicianName,
    required TechnicianStats stats,
    required String period,
    String? signatureUrl,
  }) async {
    final res = await _loadResources();
    await _generatePdf(
      title: 'Rapport de Performance — $period',
      userName: 'Technicien : $technicianName',
      fileName: 'Rapport_${technicianName.replaceAll(' ', '_')}_${DateFormat('yyyyMMdd').format(DateTime.now())}',
      res: res,
      signatureUrl: signatureUrl,
      contentBuilder: () => [
        _section('INDICATEURS CLÉS DE PERFORMANCE'),
        pw.SizedBox(height: 10),
        pw.Row(children: [
          _kpi('CÂBLES INSPECTÉS', '${stats.inspections}', PdfColors.indigo),
          pw.SizedBox(width: 8),
          _kpi('TAUX CONFORMITÉ', '${stats.conformityRate.toStringAsFixed(1)}%', PdfColors.green800),
          pw.SizedBox(width: 8),
          _kpi('DÉFAUTS DÉTECTÉS', '${stats.anomaliesDetected}', PdfColors.red),
          pw.SizedBox(width: 8),
          _kpi('DÉFAUTS CORRIGÉS', '${stats.anomaliesResolved}', PdfColors.teal),
        ]),
        pw.SizedBox(height: 8),
        pw.Row(children: [
          _kpi('CONFORMES', '${stats.cablesConform}', PdfColors.green600),
          pw.SizedBox(width: 8),
          _kpi('NON CONFORMES', '${stats.cablesNonConform}', PdfColors.orange),
          pw.SizedBox(width: 8),
          _kpi('TAUX RÉSOLUTION', '${stats.resolutionRate}%', PdfColors.blue),
          pw.SizedBox(width: 8),
          pw.Expanded(child: pw.SizedBox()),
        ]),
        pw.SizedBox(height: 30),
        if (stats.anomaliesByType.isNotEmpty) ...[
          _section('RÉPARTITION DES DÉFAUTS PAR TYPE'),
          pw.SizedBox(height: 10),
          _defectsTable(stats.anomaliesByType),
          pw.SizedBox(height: 30),
        ],
        _section('RÉPARTITION PAR GRAVITÉ'),
        pw.SizedBox(height: 10),
        _severityBars(stats.anomaliesBySeverity),
        pw.SizedBox(height: 30),
        _section('SYNTHÈSE ET OBSERVATIONS'),
        pw.SizedBox(height: 10),
        _synthesisBox([
          'Le technicien a inspecté ${stats.inspections} câble(s) sur la période "$period".',
          'Taux de conformité global : ${stats.conformityRate.toStringAsFixed(1)}%.',
          '${stats.anomaliesDetected} anomalie(s) détectée(s), dont ${stats.anomaliesResolved} corrigée(s) (${stats.resolutionRate}% de résolution).',
          if (stats.anomaliesBySeverity['Critique'] != null && stats.anomaliesBySeverity['Critique']! > 0)
            '⚠ ${stats.anomaliesBySeverity['Critique']} anomalie(s) critique(s) nécessitant une attention immédiate.',
        ]),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE 2 : RAPPORT ORDRE DE FABRICATION (Inspection)
  // ═══════════════════════════════════════════════════════════════════════
  static Future<void> exportOrderReport(ManufacturingOrder order, {String? signatureUrl}) async {
    final res = await _loadResources();
    final conformRate = order.inspectedCount > 0
        ? (order.conformCount / order.inspectedCount * 100).toStringAsFixed(1)
        : '0.0';

    await _generatePdf(
      title: 'Rapport d\'Inspection — OF ${order.numeroOF}',
      userName: 'Ordre : ${order.reference}',
      fileName: 'Inspection_OF_${order.numeroOF}_${DateFormat('yyyyMMdd').format(DateTime.now())}',
      res: res,
      signatureUrl: signatureUrl,
      contentBuilder: () => [
        _section('INFORMATIONS GÉNÉRALES'),
        pw.SizedBox(height: 10),
        _infoGrid([
          ['NUMÉRO OF', order.numeroOF],
          ['RÉFÉRENCE', order.reference],
          ['CLIENT', order.client],
          ['LIGNE PROD.', order.ligne ?? 'N/A'],
          ['GIPROS', order.gipros],
          ['QUANTITÉ', '${order.qta} pièces'],
          ['STATUT', order.status.toUpperCase()],
        ]),
        pw.SizedBox(height: 30),
        _section('STATISTIQUES DE QUALITÉ'),
        pw.SizedBox(height: 10),
        pw.Row(children: [
          _kpi('TOTAL QTE', '${order.qta}', PdfColors.blue900),
          pw.SizedBox(width: 8),
          _kpi('INSPECTÉS', '${order.inspectedCount}', PdfColors.blue600),
          pw.SizedBox(width: 8),
          _kpi('CONFORMES', '${order.conformCount}', PdfColors.green900),
          pw.SizedBox(width: 8),
          _kpi('REJETÉS', '${order.nonConformCount}', PdfColors.red900),
        ]),
        pw.SizedBox(height: 30),
        _section('SYNTHÈSE ET OBSERVATIONS'),
        pw.SizedBox(height: 10),
        _synthesisBox([
          'Ordre de fabrication ${order.reference} pour le client ${order.client}.',
          '${order.inspectedCount} câble(s) inspectés sur ${order.qta} prévus (${order.progressPercentage.toStringAsFixed(0)}% de progression).',
          'Taux de conformité : $conformRate%.',
          '${order.conformCount} conforme(s), ${order.nonConformCount} non-conforme(s).',
          'Statut actuel de l\'ordre : ${order.status}.',
        ]),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE 3 : RAPPORT D'INSPECTION DÉTAILLÉ (Individuel)
  // ═══════════════════════════════════════════════════════════════════════
  static Future<void> exportInspectionReport(Report report) async {
    final res = await _loadResources();
    final anomalyImage = report.imageUrl != null ? await _downloadImage(report.imageUrl) : null;

    await _generatePdf(
      title: 'Rapport d\'Inspection Détallé',
      userName: 'Technicien : ${report.technicianName ?? "N/A"}',
      fileName: 'Inspection_${report.cableId}_${DateFormat('yyyyMMdd').format(DateTime.now())}',
      res: res,
      signatureUrl: report.signatureUrl,
      contentBuilder: () => [
        _section('DÉTAILS DE L\'INSPECTION'),
        pw.SizedBox(height: 10),
        _infoGrid([
          ['CÂBLE ID', report.cableId],
          ['ORDRE ID', report.orderId],
          ['DATE', DateFormat('dd/MM/yyyy HH:mm').format(report.generatedAt)],
          ['VERDICT', report.conformityStatus],
          ['ANOMALIES', '${report.anomaliesCount}'],
        ]),
        pw.SizedBox(height: 24),
        if (report.notes != null && report.notes!.isNotEmpty) ...[
          _section('OBSERVATIONS TECHNIQUES'),
          pw.SizedBox(height: 10),
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200)),
            child: pw.Text(report.notes!, style: const pw.TextStyle(fontSize: 9)),
          ),
          pw.SizedBox(height: 24),
        ],
        if (anomalyImage != null) ...[
          _section('PREUVE VISUELLE'),
          pw.SizedBox(height: 10),
          pw.Center(
            child: pw.Container(
              height: 200,
              child: pw.Image(anomalyImage, fit: pw.BoxFit.contain),
            ),
          ),
        ],
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE 4 : RAPPORT GLOBAL (Administration / Web)
  // ═══════════════════════════════════════════════════════════════════════
  static Future<void> exportGlobalStatsReport(GlobalStats stats, Map<String, int> anomaliesByType, {String? signatureUrl}) async {
    final res = await _loadResources();
    await _generatePdf(
      title: 'Rapport Global de Production',
      userName: 'Administration ICEM',
      fileName: 'Rapport_Global_${DateFormat('yyyyMMdd_HHmm').format(DateTime.now())}',
      res: res,
      signatureUrl: signatureUrl,
      contentBuilder: () => [
        _section('VUE D\'ENSEMBLE'),
        pw.SizedBox(height: 10),
        pw.Row(children: [
          _kpi('INSPECTIONS', '${stats.totalInspections}', PdfColors.blue900),
          pw.SizedBox(width: 8),
          _kpi('CONFORMITÉ', '${stats.conformityRate.toStringAsFixed(1)}%', PdfColors.green900),
          pw.SizedBox(width: 8),
          _kpi('ANOMALIES', '${stats.totalAnomalies}', PdfColors.red900),
          pw.SizedBox(width: 8),
          _kpi('RAPPORTS', '${stats.reportsGenerated}', PdfColors.indigo),
        ]),
        pw.SizedBox(height: 30),
        if (anomaliesByType.isNotEmpty) ...[
          _section('RÉPARTITION DES ANOMALIES PAR TYPE'),
          pw.SizedBox(height: 10),
          _defectsTable(anomaliesByType),
          pw.SizedBox(height: 30),
        ],
        _section('SYNTHÈSE ET OBSERVATIONS'),
        pw.SizedBox(height: 10),
        _synthesisBox([
          '${stats.totalInspections} inspection(s) réalisée(s) au total.',
          'Taux de conformité global : ${stats.conformityRate.toStringAsFixed(1)}%.',
          '${stats.totalAnomalies} anomalie(s) détectée(s) dans le système.',
          '${stats.reportsGenerated} rapport(s) générés.',
        ]),
      ],
    );
  }
}

/// Ressources partagées pour la génération PDF
class _PdfResources {
  final pw.MemoryImage? logo;
  final pw.Font fontRegular;
  final pw.Font fontBold;

  _PdfResources({required this.logo, required this.fontRegular, required this.fontBold});
}
