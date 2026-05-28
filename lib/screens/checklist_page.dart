import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/reports_service.dart';

const _defectCodes = [
  ('A','Cosse déformée'), ('B','Cosse ébanchati'), ('C','Cosse ouverte'),
  ('D','Fil pincé/coupé'), ('E','Fils inversés'), ('F','Fil tendu'),
  ('G','Fil sans cosse'), ('H','Ticket élec. NC'), ('I','Long./couleur NC'),
  ('J','Conn. cassé'), ('K','Bouchette manq.'), ('L','Tube thermo NC'),
  ('M','Protection manq.'), ('N','Tube manqué'), ('O','Vis mal serrée'),
  ('P','Composant manq.'), ('Q','Fusible manq.'), ('R','Gamme manq.'),
  ('S','Scotch mal exéc.'), ('T','Mesure Dériv.'), ('V','Étiquette manq.'),
  ('W','Étiquette inv.'), ('Z','Autres défauts'),
];

class _VisualRow {
  String cableCode;
  String serialNumber;
  final Set<String> selectedDefects; 
  String comment;
  bool isConform;
  _VisualRow({this.cableCode = '', this.serialNumber = '', this.comment = ''}) : selectedDefects = {}, isConform = true;
  bool get hasCode => cableCode.trim().isNotEmpty;
  bool get hasDefect => selectedDefects.isNotEmpty || !isConform;
}

class ChecklistPage extends StatefulWidget {
  final String? orderId;
  final String? orderReference;
  final String? cableReference;
  final String? serialNumber;
  final List<String>? detectedDefects;
  final String? imageUrl;
  const ChecklistPage({super.key, this.orderId, this.orderReference, this.cableReference, this.serialNumber, this.detectedDefects, this.imageUrl});
  @override
  State<ChecklistPage> createState() => _ChecklistPageState();
}

class _ChecklistPageState extends State<ChecklistPage> {
  bool _isSaving = false;
  final List<_VisualRow> _rows = [];

  @override
  void initState() {
    super.initState();
    final row = _VisualRow(cableCode: widget.cableReference ?? '', serialNumber: widget.serialNumber ?? widget.cableReference ?? '');
    if (widget.detectedDefects != null) {
      for (final d in widget.detectedDefects!) { row.selectedDefects.add(d.trim().toUpperCase()); }
      row.isConform = false;
    }
    _rows.add(row);
  }

  int get _totalControlled => _rows.where((r) => r.hasCode).length;
  int get _nombreNC => _rows.where((r) => r.hasCode && r.hasDefect).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Rapport d\'Inspection')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _buildInfoBanner(),
          const SizedBox(height: 16),
          ..._rows.asMap().entries.map((e) => _buildRowCard(e.key, e.value)),
          const SizedBox(height: 12),
          _buildAddButton(),
          const SizedBox(height: 40),
        ]),
      ),
      bottomNavigationBar: _buildBottomSubmit(),
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(gradient: AppTheme.heroGradient, borderRadius: BorderRadius.all(Radius.circular(12))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        _infoMini('OF', widget.orderReference ?? 'N/A'),
        _infoMini('Câble', widget.cableReference ?? 'N/A'),
        _infoMini('Date', '${DateTime.now().day}/${DateTime.now().month}'),
      ]),
    );
  }

  Widget _infoMini(String label, String val) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: GoogleFonts.inter(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w600)),
    Text(val, style: GoogleFonts.inter(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
  ]);

  Widget _buildRowCard(int index, _VisualRow row) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppTheme.cardDecoration(),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppTheme.primaryNavy.withOpacity(0.03), borderRadius: const BorderRadius.vertical(top: Radius.circular(12))),
          child: Row(children: [
            CircleAvatar(radius: 12, backgroundColor: AppTheme.primaryNavy, child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11))),
            const SizedBox(width: 12),
            Expanded(child: Text(row.cableCode.isEmpty ? 'Nouveau câble' : 'Câble ${row.cableCode}', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, color: AppTheme.primaryNavy))),
            _buildConformToggle(row),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (!row.isConform) ...[
              Text('CODES DÉFAUTS :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textGrey)),
              const SizedBox(height: 10),
              _buildDefectGrid(row),
              const SizedBox(height: 16),
            ],
            Text('OBSERVATIONS :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textGrey)),
            const SizedBox(height: 8),
            TextField(
              onChanged: (val) => row.comment = val,
              decoration: const InputDecoration(hintText: 'Note technique...'),
              style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textDark),
              maxLines: 2,
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _buildConformToggle(_VisualRow row) => GestureDetector(
    onTap: () => setState(() { row.isConform = !row.isConform; if (row.isConform) row.selectedDefects.clear(); }),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(color: row.isConform ? AppTheme.successGreen : AppTheme.errorRed, borderRadius: BorderRadius.circular(20)),
      child: Text(row.isConform ? 'CONFORME' : 'NON CONFORME', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10)),
    ),
  );

  Widget _buildDefectGrid(_VisualRow row) => Wrap(
    spacing: 6, runSpacing: 6,
    children: _defectCodes.map((d) {
      final sel = row.selectedDefects.contains(d.$1);
      return InkWell(
        onTap: () => setState(() => sel ? row.selectedDefects.remove(d.$1) : row.selectedDefects.add(d.$1)),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(color: sel ? AppTheme.errorRed : Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: sel ? AppTheme.errorRed : AppTheme.borderGris)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(d.$1, style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 11, color: sel ? Colors.white : AppTheme.primaryNavy)),
            const SizedBox(width: 6),
            Text(d.$2, style: GoogleFonts.inter(fontSize: 10, color: sel ? Colors.white70 : AppTheme.textGrey, fontWeight: FontWeight.w700)),
          ]),
        ),
      );
    }).toList(),
  );

  Widget _buildAddButton() => TextButton.icon(
    onPressed: () => setState(() => _rows.add(_VisualRow())),
    icon: const Icon(Icons.add_circle_outline),
    label: const Text('AJOUTER UN AUTRE CÂBLE'),
    style: TextButton.styleFrom(foregroundColor: AppTheme.accentBlue),
  );

  Widget _buildBottomSubmit() => Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
    decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppTheme.borderGris))),
    child: Row(children: [
      Expanded(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('CONTRÔLÉS: $_totalControlled', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 12)),
        Text('ANOMALIES: $_nombreNC', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 12, color: _nombreNC > 0 ? AppTheme.errorRed : AppTheme.successGreen)),
      ])),
      Expanded(flex: 2, child: ElevatedButton.icon(
        onPressed: _isSaving ? null : _submit,
        icon: _isSaving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.check_circle_outline),
        label: Text(_isSaving ? 'ENCOURS...' : 'VALIDER L\'INSPECTION'),
      )),
    ]),
  );

  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final validRows = _rows.where((r) => r.hasCode).toList();
    if (validRows.isEmpty) return;

    setState(() => _isSaving = true);
    
    // Rafraîchir le profil pour récupérer la signatureUrl à jour
    await auth.refreshCurrentUser();
    
    Anomaly? lastCreatedAnomaly;

    for (final row in validRows) {
      final status = row.hasDefect ? 'Non conforme' : 'Conforme';
      await OrdersService().saveCable(
        reference: row.cableCode.trim(), code: row.cableCode.trim(), orderId: widget.orderId ?? '', status: status,
        technicianId: auth.currentUser?.id ?? '', technicianName: auth.currentUser?.fullName ?? '',
        anomaliesCount: row.selectedDefects.length, imageUrl: widget.imageUrl,
        visualChecklistItems: [{'defauts': row.selectedDefects.toList(), 'commentaire': row.comment, 'status': status}],
      );

      if (row.hasDefect) {
        final a = Anomaly(
          id: '', type: 'Défauts: ${row.selectedDefects.join(", ")}', severity: 'Majeur', confidence: 1.0,
          cableId: row.cableCode, detectedAt: DateTime.now(), technicianId: auth.currentUser?.id,
          technicianName: auth.currentUser?.fullName, imageUrl: widget.imageUrl, status: 'detectee', orderId: widget.orderId,
          location: 'Inspection Visuelle',
        );
        final id = await AnomalyService().createAnomaly(a);
        lastCreatedAnomaly = a.copyWith(id: id);
      }

      // CRÉER UN ENREGISTREMENT DE RAPPORT (pour TOUS les câbles, conformes et non conformes)
      await ReportsService().createReportRecord(
        technicianId: auth.currentUser?.id ?? '',
        technicianName: auth.currentUser?.fullName ?? '',
        type: 'inspection',
        cableId: row.cableCode,
        orderId: widget.orderId,
        status: status, // "Conforme" ou "Non conforme"
        anomaliesCount: row.selectedDefects.length,
        notes: row.hasDefect 
            ? 'Inspection visuelle avec ${row.selectedDefects.length} défaut(s): ${row.selectedDefects.join(", ")}\nCommentaire: ${row.comment}'
            : 'Inspection visuelle OK. ${row.comment}',
        signatureUrl: auth.currentUser?.signatureUrl,
        imageUrl: widget.imageUrl,
      );
    }
    
    if (mounted && _nombreNC > 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Rapport d\'anomalie généré automatiquement.'),
        backgroundColor: AppTheme.successGreen,
        duration: Duration(seconds: 3),
      ));
    }

    setState(() => _isSaving = false);
    if (mounted) Navigator.pop(context, {'status': _nombreNC == 0 ? 'Conforme' : 'Non conforme', 'anomaly': lastCreatedAnomaly});
  }
}
