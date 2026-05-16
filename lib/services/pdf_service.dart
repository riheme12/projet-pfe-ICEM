import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:convert';
import 'dart:typed_data';

/// Service de génération de rapports PDF — Premium Command Center Style
class PdfService {
  static Future<void> generateInspectionReport({
    required String technicianName,
    required String cableRef,
    required String orderRef,
    required List<Map<String, dynamic>> checklistItems,
    String? imageUrl,
    String? technicianSignatureUrl,
  }) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now());

    // Asset Loading
    pw.ImageProvider? logo;
    try {
      final data = await rootBundle.load('assets/images/logo.png');
      logo = pw.MemoryImage(data.buffer.asUint8List());
    } catch (_) {}

    // Defect Image
    pw.ImageProvider? defectImg;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      try {
        final bytes = base64Decode(imageUrl.contains(',') ? imageUrl.split(',').last : imageUrl);
        defectImg = pw.MemoryImage(bytes);
      } catch (_) {}
    }

    // Signature
    pw.ImageProvider? signature;
    if (technicianSignatureUrl != null && technicianSignatureUrl.startsWith('http')) {
       // Since we can't easily download network images inside PDF generation without a plugin/complex logic, 
       // we usually handle this by passing bytes. But for simplicity in this PFE demo, we'll try to use netImage if possible or fallback.
       // For now, let's assume we might have bytes if we pre-fetched it.
    }

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        theme: pw.ThemeData.withFont(
          base: await PdfGoogleFonts.interRegular(),
          bold: await PdfGoogleFonts.interBold(),
        ),
        build: (context) => [
          _buildHeader(logo, dateStr),
          pw.SizedBox(height: 20),
          _buildTitle('CERTIFICAT D\'INSPECTION INTELLIGENTE'),
          pw.SizedBox(height: 24),
          _buildSummaryBox(technicianName, cableRef, orderRef, checklistItems),
          pw.SizedBox(height: 24),
          if (defectImg != null) ...[
            _buildSectionTitle('CAPTURE DE L\'ANOMALIE (IA)'),
            pw.SizedBox(height: 12),
            pw.Center(child: pw.Container(
              height: 220, width: double.infinity,
              decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey300), borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12))),
              child: pw.ClipRRect(horizontalRadius: 12, verticalRadius: 12, child: pw.Image(defectImg, fit: pw.BoxFit.contain)),
            )),
            pw.SizedBox(height: 30),
          ],
          _buildSectionTitle('DÉTAILS DU CONTRÔLE VISUEL (FOR QUA 06)'),
          pw.SizedBox(height: 12),
          _buildDataTable(checklistItems),
          pw.SizedBox(height: 40),
          _buildSignatures(technicianName),
          pw.Spacer(),
          _buildFooter(),
        ],
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'Rapport_ICEM_${cableRef}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf',
    );
  }

  static pw.Widget _buildHeader(pw.ImageProvider? logo, String date) => pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Row(children: [
        if (logo != null) pw.Container(width: 45, height: 45, margin: const pw.EdgeInsets.only(right: 12), child: pw.Image(logo)),
        pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          pw.Text('ICEM QUALITY CONTROL', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
          pw.Text('Système de Surveillance Industrielle IA', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
        ]),
      ]),
      pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
        pw.Text('Rapport généré le $date', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
        pw.Text('REF: FOR QUA 06 / V07', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
      ]),
    ],
  );

  static pw.Widget _buildTitle(String text) => pw.Container(
    width: double.infinity, padding: const pw.EdgeInsets.symmetric(vertical: 10),
    decoration: const pw.BoxDecoration(color: PdfColors.blue900, borderRadius: pw.BorderRadius.all(pw.Radius.circular(6))),
    child: pw.Center(child: pw.Text(text, style: pw.TextStyle(color: PdfColors.white, fontSize: 14, fontWeight: pw.FontWeight.bold, letterSpacing: 1.5))),
  );

  static pw.Widget _buildSummaryBox(String tech, String cable, String order, List items) {
    final isNC = items.any((i) => i['status'] != 'Conforme');
    return pw.Container(
      padding: const pw.EdgeInsets.all(16),
      decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200), borderRadius: const pw.BorderRadius.all(pw.Radius.circular(10))),
      child: pw.Row(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
        pw.Expanded(child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          _rowInfo('TECHNICIEN', tech),
          _rowInfo('RÉFÉRENCE CÂBLE', cable),
          _rowInfo('ORDRE DE FABRICATION', order),
        ])),
        pw.Container(width: 1, height: 60, color: PdfColors.grey200, margin: const pw.EdgeInsets.symmetric(horizontal: 20)),
        pw.Expanded(child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          _rowInfo('NB ANOMALIES', items.where((i) => i['status'] != 'Conforme').length.toString()),
          pw.SizedBox(height: 8),
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: pw.BoxDecoration(color: isNC ? PdfColors.red100 : PdfColors.green100, borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4))),
            child: pw.Text(isNC ? 'NON CONFORME' : 'CONFORME', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: isNC ? PdfColors.red900 : PdfColors.green900, fontSize: 12)),
          ),
        ])),
      ]),
    );
  }

  static pw.Widget _rowInfo(String label, String val) => pw.Padding(
    padding: const pw.EdgeInsets.symmetric(vertical: 2),
    child: pw.RichText(text: pw.TextSpan(children: [
      pw.TextSpan(text: '$label : ', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey, fontWeight: pw.FontWeight.bold)),
      pw.TextSpan(text: val, style: const pw.TextStyle(fontSize: 9, color: PdfColors.black)),
    ])),
  );

  static pw.Widget _buildSectionTitle(String text) => pw.Text(text, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900));

  static pw.Widget _buildDataTable(List items) => pw.Table(
    border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
    children: [
      pw.TableRow(decoration: const pw.BoxDecoration(color: PdfColors.grey100), children: [
        _cell('N° SÉRIE', isH: true), _cell('DÉFAUT(S)', isH: true), _cell('STATUT', isH: true),
      ]),
      ...items.map((i) {
        final nc = i['status'] != 'Conforme';
        return pw.TableRow(children: [
          _cell(i['numeroSerie'] ?? '—'),
          _cell(i['codeDefaut'] ?? 'OK', color: nc ? PdfColors.red900 : PdfColors.black),
          _cell(i['status'] ?? '—', color: nc ? PdfColors.red900 : PdfColors.green900, bold: true),
        ]);
      }),
    ],
  );

  static pw.Widget _cell(String t, {bool isH = false, PdfColor? color, bool bold = false}) => pw.Padding(
    padding: const pw.EdgeInsets.all(8),
    child: pw.Text(t, textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 9, fontWeight: (isH || bold) ? pw.FontWeight.bold : pw.FontWeight.normal, color: color ?? PdfColors.black)),
  );

  static pw.Widget _buildSignatures(String tech) => pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Column(children: [
        pw.Text('SIGNATURE TECHNICIEN', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
        pw.SizedBox(height: 8),
        pw.Container(width: 140, height: 60, decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200), borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8))), child: pw.Center(child: pw.Text(tech, style: pw.TextStyle(fontSize: 10, fontStyle: pw.FontStyle.italic, color: PdfColors.grey)))),
      ]),
      pw.Column(children: [
        pw.Text('SIGNATURE RESPONSABLE QUALITÉ', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
        pw.SizedBox(height: 8),
        pw.Container(width: 140, height: 60, decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey200), borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)))),
      ]),
    ],
  );

  static pw.Widget _buildFooter() => pw.Column(children: [
    pw.Divider(color: PdfColors.grey200),
    pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
      pw.Text('ICEM QA v2.0 — Certification IA Roboflow', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey)),
      pw.Text('Page 1/1', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey)),
    ]),
  ]);
}
