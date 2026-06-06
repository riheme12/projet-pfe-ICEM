import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:projeticem/services/reports_service.dart';
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';
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
      fontRegular: pw.Font.helvetica(),
      fontBold: pw.Font.helveticaBold(),
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

  static const Map<String, String> _defectNamesMap = {
    'A': 'Cosse déformée', 'B': 'Cosse ébanchati', 'C': 'Cosse ouverte',
    'D': 'Fil pincé/coupé', 'E': 'Fils inversés', 'F': 'Fil tendu',
    'G': 'Fil sans cosse', 'H': 'Ticket élec. NC', 'I': 'Long./couleur NC',
    'J': 'Conn. cassé', 'K': 'Bouchette manq.', 'L': 'Tube thermo NC',
    'M': 'Protection manq.', 'N': 'Tube manqué', 'O': 'Vis mal serrée',
    'P': 'Composant manq.', 'Q': 'Fusible manq.', 'R': 'Gamme manq.',
    'S': 'Scotch mal exécuté', 'T': 'Mesure Dériv.', 'V': 'Étiquette manquante',
    'W': 'Étiquette inv.', 'Z': 'Autres défauts',
  };

  static String _getCleanDefectName(String rawKey) {
    String key = rawKey.trim();
    
    // 1. Remove "Défauts: " or "Défaut: " prefix if it exists
    if (key.startsWith('Défauts:') || key.startsWith('Défaut:')) {
      final codePart = key.split(':').last.trim();
      final codes = codePart.split(',').map((c) => c.trim().toUpperCase()).toList();
      final names = codes.map((c) => _defectNamesMap[c] ?? c).toList();
      return names.join(', ');
    }
    
    // 2. Remove "[Code] " prefix if it exists (e.g. "[A] Cosse déformée" -> "Cosse déformée")
    final match = RegExp(r'^\[[A-Z]\]\s+(.+)$').firstMatch(key);
    if (match != null) {
      return match.group(1)!;
    }
    
    // 3. Map raw Roboflow classes to clean names
    final classMapping = {
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
    
    final lowerKey = key.toLowerCase();
    if (classMapping.containsKey(lowerKey)) {
      return classMapping[lowerKey]!;
    }
    
    // 4. Map electrical check abbreviations
    final electricalMapping = {
      'fi conn.': 'Fils inversés connecteur',
      'fmi conn.': 'Fils mal insérés connecteur',
      'fi pos.': 'Fils inversés position',
      'fmi pos.': 'Fils mal insérés position',
      'fi mar/coul': 'Fils inversés marquage/couleur',
      'étiq. manq.': 'Étiquette manquante',
      'étiq. inv. c1': 'Étiquette invertie Conn 1',
      'étiq. inv. c2': 'Étiquette invertie Conn 2',
      'conn. dériv.': 'Connecteur dérivation',
      'prot. manq.': 'Protection manquante connecteur',
    };
    
    if (key.startsWith('Défaut Électrique:')) {
      final label = key.split(':').last.trim().toLowerCase();
      return electricalMapping[label] ?? key;
    }
    
    return key;
  }

  // ─── Defects Table ─────────────────────────────────────────────────────
  static pw.Widget _defectsTable(Map<String, int> rawMap) {
    // Aggregate by clean names
    final Map<String, int> map = {};
    rawMap.forEach((key, val) {
      final cleanKey = _getCleanDefectName(key);
      map[cleanKey] = (map[cleanKey] ?? 0) + val;
    });

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
            '${stats.anomaliesBySeverity['Critique']} anomalie(s) critique(s) nécessitant une attention immédiate.',
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
    
    // 1. Download images
    final List<pw.MemoryImage> anomalyImages = [];
    final imageUrls = report.imageUrls ?? (report.imageUrl != null && report.imageUrl!.isNotEmpty ? [report.imageUrl!] : <String>[]);
    for (final url in imageUrls) {
      final img = await _downloadImage(url);
      if (img != null) {
        anomalyImages.add(img);
      }
    }
    final techSignatureImage = report.signatureUrl != null ? await _downloadImage(report.signatureUrl) : null;
    
    // Fetch manager/admin signature from Firestore
    String? managerSignatureUrl;
    String? managerName;
    try {
      final managersSnap = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'manager')
          .limit(1)
          .get();
      if (managersSnap.docs.isNotEmpty) {
        managerSignatureUrl = managersSnap.docs.first.data()['signatureUrl'] as String?;
        managerName = managersSnap.docs.first.data()['fullName'] as String?;
      } else {
        final adminsSnap = await FirebaseFirestore.instance
            .collection('users')
            .where('role', isEqualTo: 'admin')
            .limit(1)
            .get();
        if (adminsSnap.docs.isNotEmpty) {
          managerSignatureUrl = adminsSnap.docs.first.data()['signatureUrl'] as String?;
          managerName = adminsSnap.docs.first.data()['fullName'] as String?;
        }
      }
    } catch (_) {}
    
    final managerSignatureImage = managerSignatureUrl != null ? await _downloadImage(managerSignatureUrl) : null;

    final pdf = pw.Document();
    
    final dateOnlyStr = DateFormat('dd/MM/yyyy').format(report.generatedAt);
    final timeOnlyStr = DateFormat('HH:mm').format(report.generatedAt);
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(report.generatedAt);
    final isConform = report.conformityStatus == 'Conforme';

    // Helper for Section Headers
    pw.Widget buildSectionHeader(String title) {
      return pw.Row(
        children: [
          pw.Container(width: 3, height: 20, color: const PdfColor.fromInt(0xFF2563EB)),
          pw.Expanded(
            child: pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 6, horizontal: 10),
              color: const PdfColor.fromInt(0xFFEFF6FF),
              child: pw.Text(
                title, 
                style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A)),
              ),
            ),
          ),
        ],
      );
    }

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 40, vertical: 30),
        theme: pw.ThemeData.withFont(
          base: res.fontRegular,
          bold: res.fontBold,
        ),
        build: (context) => [
          // ─── 1. HEADER ───
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Row(
                children: [
                  if (res.logo != null)
                    pw.Container(
                      width: 40,
                      height: 40,
                      margin: const pw.EdgeInsets.only(right: 12),
                      child: pw.Image(res.logo!),
                    ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'ICEM', 
                        style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A)),
                      ),
                      pw.Text(
                        'Smart Quality Control System', 
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600),
                      ),
                    ],
                  ),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    'Technicien : ${report.technicianName ?? "Inconnu"}', 
                    style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF0F172A)),
                  ),
                  pw.Text('Date : $dateOnlyStr', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                  pw.Text('Heure : $timeOnlyStr', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 8),
          // Blue separation line
          pw.Container(
            height: 2,
            color: const PdfColor.fromInt(0xFF2563EB),
          ),
          pw.SizedBox(height: 16),
          
          // ─── 2. TITLE BANNER ───
          pw.Container(
            width: double.infinity,
            padding: const pw.EdgeInsets.symmetric(vertical: 10),
            color: const PdfColor.fromInt(0xFF0F172A),
            child: pw.Center(
              child: pw.Text(
                'RAPPORT D\'INSPECTION DÉTAILLÉ',
                style: pw.TextStyle(color: PdfColors.white, fontSize: 12, fontWeight: pw.FontWeight.bold, letterSpacing: 1.5),
              ),
            ),
          ),
          pw.SizedBox(height: 24),
          
          // ─── 3. SECTION 1: DÉTAILS DE L'INSPECTION ───
          buildSectionHeader('DÉTAILS DE L\'INSPECTION'),
          pw.SizedBox(height: 8),
          
          // Details Container
          pw.Container(
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
              color: PdfColors.white,
            ),
            child: pw.Column(
              children: [
                _buildDetailsRow('CÂBLE ID', report.cableId),
                pw.SizedBox(height: 6),
                _buildDetailsRow('ORDRE ID', report.orderId.replaceAll('&#x2F;', '/')),
                pw.SizedBox(height: 6),
                _buildDetailsRow('DATE', dateStr),
                pw.SizedBox(height: 6),
                _buildVerdictRow('VERDICT', report.conformityStatus, isConform),
                pw.SizedBox(height: 6),
                _buildDetailsRow('ANOMALIES', '${report.anomaliesCount}'),
              ],
            ),
          ),
          pw.SizedBox(height: 24),
          
          // ─── 4. SECTION 2: OBSERVATIONS TECHNIQUES ───
          buildSectionHeader('OBSERVATIONS TECHNIQUES'),
          pw.SizedBox(height: 8),
          
          // Observations Box
          pw.Container(
            width: double.infinity,
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
              color: PdfColors.white,
            ),
            child: pw.Text(
              report.notes ?? (isConform
                  ? 'Inspection visuelle : aucune anomalie détectée.'
                  : 'Inspection visuelle avec ${report.anomaliesCount} défaut(s) détecté(s).'),
              style: const pw.TextStyle(fontSize: 9),
            ),
          ),
          pw.SizedBox(height: 24),
          
          // ─── 5. SECTION 3: PREUVE VISUELLE (si anomalie) ───
          if (anomalyImages.isNotEmpty) ...[
            buildSectionHeader('PREUVE VISUELLE'),
            pw.SizedBox(height: 8),
            pw.Wrap(
              spacing: 10,
              runSpacing: 10,
              children: anomalyImages.map((img) {
                return pw.Container(
                  width: 150,
                  height: 110,
                  padding: const pw.EdgeInsets.all(4),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
                    color: PdfColors.white,
                  ),
                  child: pw.Image(img, fit: pw.BoxFit.contain),
                );
              }).toList(),
            ),
            pw.SizedBox(height: 24),
          ],
          
          // ─── 6. SECTION 4: SIGNATURES ───
          buildSectionHeader('SIGNATURES DES RESPONSABLES'),
          pw.SizedBox(height: 8),
          
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              // Technician Box
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Text(
                    'SIGNATURE TECHNICIEN', 
                    style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Container(
                    width: 180,
                    height: 50,
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
                      color: PdfColors.white,
                    ),
                    child: techSignatureImage != null
                        ? pw.Padding(
                            padding: const pw.EdgeInsets.all(4),
                            child: pw.Image(techSignatureImage, fit: pw.BoxFit.contain),
                          )
                        : pw.Center(
                            child: pw.Text(
                              report.technicianName ?? 'Signé',
                              style: pw.TextStyle(fontSize: 9, fontStyle: pw.FontStyle.italic, color: PdfColors.grey500),
                            ),
                          ),
                  ),
                ],
              ),
              // Manager Box
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Text(
                    'SIGNATURE RESPONSABLE QUALITÉ', 
                    style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Container(
                    width: 180,
                    height: 50,
                    decoration: pw.BoxDecoration(
                      border: pw.Border.all(color: PdfColors.grey300, width: 0.5),
                      color: PdfColors.white,
                    ),
                    child: managerSignatureImage != null
                        ? pw.Padding(
                            padding: const pw.EdgeInsets.all(4),
                            child: pw.Image(managerSignatureImage, fit: pw.BoxFit.contain),
                          )
                        : pw.Center(
                            child: pw.Text(
                              managerName ?? 'Validé',
                              style: pw.TextStyle(fontSize: 9, fontStyle: pw.FontStyle.italic, color: PdfColors.grey500),
                            ),
                          ),
                  ),
                ],
              ),
            ],
          ),
          pw.Spacer(),
          
          // ─── 7. FOOTER ───
          pw.Column(
            children: [
              pw.Container(
                height: 0.5,
                color: PdfColors.grey300,
              ),
              pw.SizedBox(height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'Document généré automatiquement — ICEM AI © 2026', 
                    style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey500),
                  ),
                  pw.Text(
                    'Page 1 / 1', 
                    style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey500),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'Rapport_ICEM_${report.cableId}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf',
    );
  }

  // Helper row builder inside details box
  static pw.Widget _buildDetailsRow(String label, String value) {
    return pw.Row(
      children: [
        pw.SizedBox(
          width: 120,
          child: pw.Text(
            '$label :', 
            style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey600),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            value,
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.black),
          ),
        ),
      ],
    );
  }

  // Helper row builder for status verdict with custom color
  static pw.Widget _buildVerdictRow(String label, String value, bool isConform) {
    return pw.Row(
      children: [
        pw.SizedBox(
          width: 120,
          child: pw.Text(
            '$label :', 
            style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.grey600),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            value.toUpperCase(),
            style: pw.TextStyle(
              fontSize: 9, 
              fontWeight: pw.FontWeight.bold, 
              color: isConform ? PdfColors.green900 : PdfColors.red900,
            ),
          ),
        ),
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
