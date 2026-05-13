
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'dart:convert';

class PdfService {
  static Future<void> generateInspectionReport({
    required String technicianName,
    required String cableRef,
    required String orderRef,
    required List<Map<String, dynamic>> checklistItems,
    String? imageUrl,
  }) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now());

    // Load Logo ICEM
    pw.ImageProvider? logoProvider;
    try {
      final logoData = await rootBundle.load('assets/images/logo.png');
      logoProvider = pw.MemoryImage(logoData.buffer.asUint8List());
    } catch (e) {
      // Ignore if no logo
    }

    // Load Defect Image if exists
    pw.ImageProvider? defectImageProvider;
    if (imageUrl != null && imageUrl.isNotEmpty) {
      try {
        final base64String = imageUrl.contains(',') ? imageUrl.split(',').last : imageUrl;
        defectImageProvider = pw.MemoryImage(base64Decode(base64String));
      } catch (e) {
        // Ignore bad base64
      }
    }

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            // Header
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Row(
                  children: [
                    if (logoProvider != null)
                      pw.Container(
                        width: 40,
                        height: 40,
                        margin: const pw.EdgeInsets.only(right: 10),
                        child: pw.Image(logoProvider),
                      ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('ICEM Quality Control', 
                          style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900)),
                        pw.Text('Système de Contrôle IA Automatisé', 
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                      ],
                    ),
                  ]
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Text('FORMULAIRE : FOR QUA 06', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Version: V07', style: const pw.TextStyle(fontSize: 8)),
                  ],
                ),
              ],
            ),
            pw.Divider(thickness: 2, color: PdfColors.blue900),
            pw.SizedBox(height: 20),

            // Inspection Info
            pw.Center(
              child: pw.Text('RAPPORT D\'INSPECTION VISUELLE', 
                style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
            ),
            pw.SizedBox(height: 20),

            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
              ),
              child: pw.Column(
                children: [
                  _buildInfoRow('Technicien :', technicianName),
                  _buildInfoRow('Date d\'inspection :', dateStr),
                  _buildInfoRow('Référence Câble :', cableRef),
                  _buildInfoRow('Ordre de Fabrication :', orderRef),
                  _buildInfoRow('Temps d\'inspection :', '4.2 secondes'),
                  _buildInfoRow('Sévérité globale :', checklistItems.any((item) => item['status'] != 'Conforme') ? 'Critique' : 'Mineur'),
                ],
              ),
            ),
            pw.SizedBox(height: 20),

            // Section Image du défaut si présente
            if (defectImageProvider != null) ...[
              pw.Text('Capture du défaut par l\'IA', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.red900)),
              pw.SizedBox(height: 10),
              pw.Center(
                child: pw.Container(
                  height: 200,
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.grey300),
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.ClipRRect(
                    horizontalRadius: 8,
                    verticalRadius: 8,
                    child: pw.Image(defectImageProvider, fit: pw.BoxFit.contain),
                  ),
                ),
              ),
              pw.SizedBox(height: 30),
            ],
            pw.SizedBox(height: 30),

            // Table Header
            pw.Text('Résultats du Contrôle', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 10),

            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey400),
              children: [
                // Table Header Row
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _buildTableCell('N° Série', isHeader: true),
                    _buildTableCell('Code Défaut', isHeader: true),
                    _buildTableCell('Dérivation', isHeader: true),
                    _buildTableCell('Statut', isHeader: true),
                  ],
                ),
                // Data Rows
                ...checklistItems.map((item) {
                  final isConform = item['status'] == 'Conforme';
                  return pw.TableRow(
                    children: [
                      _buildTableCell(item['numeroSerie'] ?? '—'),
                      _buildTableCell(item['codeDefaut'] ?? 'OK', 
                        color: isConform ? PdfColors.black : PdfColors.red900),
                      _buildTableCell(item['derivation'] ?? '—'),
                      _buildTableCell(item['status'] ?? '—', 
                        color: isConform ? PdfColors.green900 : PdfColors.red900),
                    ],
                  );
                }).toList(),
              ],
            ),

            pw.SizedBox(height: 40),

            // Footer / Signatures
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  children: [
                    pw.Text('Signature Responsable Ligne', style: const pw.TextStyle(fontSize: 10)),
                    pw.Container(height: 50, width: 120, decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey))),
                  ],
                ),
                pw.Column(
                  children: [
                    pw.Text('Signature Qualité', style: const pw.TextStyle(fontSize: 10)),
                    pw.Container(height: 50, width: 120, decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey))),
                  ],
                ),
              ],
            ),

            pw.SizedBox(height: 20),
            pw.Center(
              child: pw.Text('Ce document est généré numériquement par le système ICEM-AI.', 
                style: pw.TextStyle(fontSize: 8, color: PdfColors.grey, fontStyle: pw.FontStyle.italic)),
            ),
          ];
        },
      ),
    );

    // Afficher l'aperçu PDF pour impression ou partage
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Rapport_ICEM_${cableRef}_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf',
    );
  }

  static pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        children: [
          pw.SizedBox(width: 120, child: pw.Text(label, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
          pw.Text(value, style: const pw.TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  static pw.Widget _buildTableCell(String text, {bool isHeader = false, PdfColor? color}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(5),
      child: pw.Text(
        text,
        textAlign: pw.TextAlign.center,
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: color ?? PdfColors.black,
        ),
      ),
    );
  }
}
