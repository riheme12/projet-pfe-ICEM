import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/electrical_checklist.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/services/anomaly_service.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/theme/app_theme.dart';

const _defectCategories = [
  'FMI Conn.', 'FMI Pos.', 'FI Conn.', 'FI Pos.', 'FI Mar/Coul',
  'Étiq. Manq.', 'Étiq. Inv. C1', 'Étiq. Inv. C2', 'Conn. Dériv.', 'Prot. Manq.',
];
const _defectKeys = ['fmiC', 'fmiP', 'fiC', 'fiP', 'fiMC', 'emC', 'eiC1', 'eiC2', 'cDer', 'pmC'];

class _ElecRow {
  String ns;
  String comment;
  final Map<String, bool> defects; 

  _ElecRow({this.ns = '', this.comment = ''})
      : defects = {for (var k in _defectKeys) k: false};

  bool get hasDefect => defects.values.any((v) => v);
  int get defectCount => defects.values.where((v) => v).length;

  List<String> get defectLabels {
    final labels = <String>[];
    for (int i = 0; i < _defectKeys.length; i++) {
      if (defects[_defectKeys[i]] == true) labels.add(_defectCategories[i]);
    }
    return labels;
  }
}

class ElectricalChecklistPage extends StatefulWidget {
  final ManufacturingOrder order;
  const ElectricalChecklistPage({super.key, required this.order});
  @override
  State<ElectricalChecklistPage> createState() => _ElectricalChecklistPageState();
}

class _ElectricalChecklistPageState extends State<ElectricalChecklistPage> {
  bool _isSaving = false;
  final List<_ElecRow> _rows = [];

  @override
  void initState() {
    super.initState();
    for (int i = 0; i < 3; i++) _rows.add(_ElecRow());
  }

  int get _totalDefects => _rows.fold(0, (s, r) => s + r.defectCount);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Contrôle Électrique')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _buildInfoCard(),
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

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: BorderRadius.all(Radius.circular(16))),
      child: Column(children: [
        Row(children: [
          const Icon(Icons.bolt, color: Colors.white, size: 22),
          const SizedBox(width: 10),
          Text('FICHE DE CONTRÔLE ÉLECTRIQUE', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
        ]),
        const Divider(color: Colors.white24, height: 24),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          _miniInfo('OF', widget.order.numeroOF),
          _miniInfo('Référence', widget.order.reference),
          _miniInfo('Ligne', widget.order.ligne ?? 'N/A'),
        ]),
      ]),
    );
  }

  Widget _miniInfo(String label, String val) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(label, style: GoogleFonts.inter(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w600)),
    Text(val, style: GoogleFonts.inter(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
  ]);

  Widget _buildRowCard(int index, _ElecRow row) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppTheme.cardDecoration(),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: AppTheme.primaryNavy.withOpacity(0.03), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
          child: Row(children: [
            CircleAvatar(radius: 12, backgroundColor: AppTheme.primaryNavy, child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900))),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                onChanged: (v) => row.ns = v,
                decoration: const InputDecoration(hintText: 'Saisir N° de série...', border: InputBorder.none, filled: false, contentPadding: EdgeInsets.zero),
                style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
            if (row.hasDefect) const Icon(Icons.warning_amber_rounded, color: AppTheme.errorRed, size: 18),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Grille des Défauts :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textGrey)),
            const SizedBox(height: 12),
            _buildDefectGrid(row),
            const SizedBox(height: 20),
            Text('Observations / Mesures prises :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textGrey)),
            const SizedBox(height: 8),
            TextField(
              onChanged: (val) => row.comment = val,
              decoration: const InputDecoration(hintText: 'Note optionnelle...', contentPadding: EdgeInsets.all(12)),
              style: GoogleFonts.inter(fontSize: 13),
              maxLines: 2,
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _buildDefectGrid(_ElecRow row) => Wrap(
    spacing: 6, runSpacing: 6,
    children: List.generate(_defectKeys.length, (i) {
      final key = _defectKeys[i];
      final sel = row.defects[key]!;
      return InkWell(
        onTap: () => setState(() => row.defects[key] = !sel),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: sel ? AppTheme.errorRed : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: sel ? AppTheme.errorRed : AppTheme.borderGris),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(sel ? Icons.cancel : Icons.check_circle_outline, size: 12, color: sel ? Colors.white : AppTheme.textLight),
            const SizedBox(width: 6),
            Text(_defectCategories[i], style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: sel ? Colors.white : AppTheme.primaryNavy)),
          ]),
        ),
      );
    }),
  );

  Widget _buildAddButton() => TextButton.icon(
    onPressed: () => setState(() => _rows.add(_ElecRow())),
    icon: const Icon(Icons.add_circle_outline),
    label: const Text('AJOUTER UN CÂBLE'),
    style: TextButton.styleFrom(foregroundColor: AppTheme.accentBlue),
  );

  Widget _buildBottomSubmit() {
    final ncCount = _rows.where((r) => r.hasDefect).length;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppTheme.borderGris))),
      child: Row(children: [
        Expanded(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('TOTAL DÉFAUTS: $_totalDefects', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11)),
          Text('$ncCount CÂBLES NC', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11, color: ncCount > 0 ? AppTheme.errorRed : AppTheme.successGreen)),
        ])),
        Expanded(flex: 2, child: ElevatedButton.icon(
          onPressed: _isSaving ? null : _submit,
          icon: _isSaving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white)) : const Icon(Icons.bolt),
          label: Text(_isSaving ? 'ENREGISTREMENT...' : 'VALIDER FICHE ÉLEC'),
        )),
      ]),
    );
  }

  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final validRows = _rows.where((r) => r.ns.trim().isNotEmpty).toList();
    if (validRows.isEmpty) return;

    setState(() => _isSaving = true);
    final status = _totalDefects == 0 ? 'Conforme' : 'Non conforme';
    
    final checklist = ElectricalChecklist(
      orderId: widget.order.id, orderReference: widget.order.reference,
      ligneDeProd: widget.order.ligne ?? '', matriculeOperateur: auth.currentUser?.fullName ?? '',
      controleurId: auth.currentUser?.id ?? '', controleurName: auth.currentUser?.fullName ?? '',
      date: DateTime.now(), codeCable: widget.order.reference, revision: '', quantiteCablesControles: validRows.length,
      cableRows: validRows.map<CableDefectRow>((r) => CableDefectRow(numeroSerie: r.ns, comment: r.comment)).toList(),
      nombreDefauts: _totalDefects, signatureRespLigne: auth.currentUser?.signatureUrl ?? '', signatureRespQualite: '', status: status,
    );

    await OrdersService().saveElectricalChecklist(checklist);

    // Create anomalies and report records
    for (final row in validRows.where((r) => r.hasDefect)) {
      await AnomalyService().createAnomaly(Anomaly(
        id: '', type: 'Défaut Électrique: ${row.defectLabels.join(", ")}', severity: 'Critique', confidence: 1.0,
        cableId: row.ns, detectedAt: DateTime.now(), technicianId: auth.currentUser?.id,
        technicianName: auth.currentUser?.fullName, statut: 'detectee', orderId: widget.order.id,
      ));

      // CRÉER UN ENREGISTREMENT DE RAPPORT (pour le registre "Mes Rapports")
      await ReportsService().createReportRecord(
        technicianId: auth.currentUser?.id ?? '',
        technicianName: auth.currentUser?.fullName ?? '',
        type: 'inspection',
        cableId: row.ns,
        orderId: widget.order.id,
        status: 'Non conforme',
        anomaliesCount: row.defectCount,
        notes: 'Contrôle électrique avec ${row.defectCount} défaut(s): ${row.defectLabels.join(", ")}',
      );
    }

    setState(() => _isSaving = false);
    if (mounted) Navigator.pop(context, {'status': status, 'nombreDefauts': _totalDefects});
  }
}
