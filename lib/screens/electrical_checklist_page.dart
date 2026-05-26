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

class ElectricalChecklistPage extends StatefulWidget {
  final ManufacturingOrder order;
  const ElectricalChecklistPage({super.key, required this.order});
  @override
  State<ElectricalChecklistPage> createState() => _ElectricalChecklistPageState();
}

class _ElectricalChecklistPageState extends State<ElectricalChecklistPage> {
  bool _isSaving = false;
  final TextEditingController _serialNumberController = TextEditingController();
  final TextEditingController _commentController = TextEditingController();
  final Map<String, bool> _defects = {for (var k in _defectKeys) k: false};

  @override
  void dispose() {
    _serialNumberController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  int get _totalDefects => _defects.values.where((v) => v).length;

  List<String> get _selectedDefectLabels {
    final labels = <String>[];
    for (int i = 0; i < _defectKeys.length; i++) {
      if (_defects[_defectKeys[i]] == true) labels.add(_defectCategories[i]);
    }
    return labels;
  }

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
          _buildChecklistCard(),
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

  Widget _buildChecklistCard() {
    final hasDefects = _totalDefects > 0;
    return Container(
      decoration: AppTheme.cardDecoration(),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(color: AppTheme.primaryNavy.withOpacity(0.03), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
          child: Row(children: [
            const CircleAvatar(radius: 12, backgroundColor: AppTheme.primaryNavy, child: Icon(Icons.tag, color: Colors.white, size: 12)),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: _serialNumberController,
                decoration: const InputDecoration(hintText: 'Saisir N° de série du câble...', border: InputBorder.none, filled: false, contentPadding: EdgeInsets.zero),
                style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14),
              ),
            ),
            if (hasDefects) const Icon(Icons.warning_amber_rounded, color: AppTheme.errorRed, size: 18),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Grille des Défauts :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textGrey)),
            const SizedBox(height: 12),
            _buildDefectGrid(),
            const SizedBox(height: 20),
            Text('Observations / Mesures prises :', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textGrey)),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              decoration: const InputDecoration(hintText: 'Note optionnelle...', contentPadding: EdgeInsets.all(12)),
              style: GoogleFonts.inter(fontSize: 13),
              maxLines: 2,
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _buildDefectGrid() => Wrap(
    spacing: 6, runSpacing: 6,
    children: List.generate(_defectKeys.length, (i) {
      final key = _defectKeys[i];
      final sel = _defects[key]!;
      return InkWell(
        onTap: () => setState(() => _defects[key] = !sel),
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

  Widget _buildBottomSubmit() {
    final hasDefects = _totalDefects > 0;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppTheme.borderGris))),
      child: Row(children: [
        Expanded(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('TOTAL DÉFAUTS: $_totalDefects', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11)),
          Text(hasDefects ? 'CÂBLE NON CONFORME' : 'CÂBLE CONFORME', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11, color: hasDefects ? AppTheme.errorRed : AppTheme.successGreen)),
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
    final serialNumber = _serialNumberController.text.trim();
    if (serialNumber.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Veuillez saisir le numéro de série du câble.'),
        backgroundColor: AppTheme.errorRed,
      ));
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    setState(() => _isSaving = true);
    
    // Rafraîchir le profil pour récupérer la signatureUrl à jour
    await auth.refreshCurrentUser();
    
    final status = _totalDefects == 0 ? 'Conforme' : 'Non conforme';
    
    final checklist = ElectricalChecklist(
      orderId: widget.order.id,
      orderReference: widget.order.reference,
      ligneDeProd: widget.order.ligne ?? '',
      matriculeOperateur: auth.currentUser?.fullName ?? '',
      controleurId: auth.currentUser?.id ?? '',
      controleurName: auth.currentUser?.fullName ?? '',
      date: DateTime.now(),
      codeCable: serialNumber,
      revision: '',
      nombreDefauts: _totalDefects,
      signatureRespLigne: auth.currentUser?.signatureUrl ?? '',
      signatureRespQualite: '',
      status: status,
      comment: _commentController.text.trim(),
      fmiConnecteur: _defects['fmiC'] == true ? 'Oui' : '',
      fmiPos: _defects['fmiP'] == true ? 'Oui' : '',
      fiConnecteur: _defects['fiC'] == true ? 'Oui' : '',
      fiPos: _defects['fiP'] == true ? 'Oui' : '',
      fiMarCoul: _defects['fiMC'] == true ? 'Oui' : '',
      etiquetteManquanteConnecteur: _defects['emC'] == true ? 'Oui' : '',
      etiquetteInvertieConn1: _defects['eiC1'] == true ? 'Oui' : '',
      etiquetteInvertieConn2: _defects['eiC2'] == true ? 'Oui' : '',
      connecteurDerivation: _defects['cDer'] == true ? 'Oui' : '',
      protectionManquanteConnecteur: _defects['pmC'] == true ? 'Oui' : '',
    );

    await OrdersService().saveElectricalChecklist(checklist);

    // Create anomalies and report records
    if (_totalDefects > 0) {
      await AnomalyService().createAnomaly(Anomaly(
        id: '',
        type: 'Défaut Électrique: ${_selectedDefectLabels.join(", ")}',
        severity: 'Critique',
        confidence: 1.0,
        cableId: serialNumber,
        detectedAt: DateTime.now(),
        technicianId: auth.currentUser?.id,
        technicianName: auth.currentUser?.fullName,
        statut: 'detectee',
        orderId: widget.order.id,
      ));
    }

    // CRÉER UN ENREGISTREMENT DE RAPPORT (pour le câble inspecté)
    await ReportsService().createReportRecord(
      technicianId: auth.currentUser?.id ?? '',
      technicianName: auth.currentUser?.fullName ?? '',
      type: 'inspection_electrique',
      cableId: serialNumber,
      orderId: widget.order.id,
      status: status,
      anomaliesCount: _totalDefects,
      notes: _totalDefects > 0 
          ? 'Contrôle électrique avec $_totalDefects défaut(s): ${_selectedDefectLabels.join(", ")}. ${checklist.comment}'
          : 'Contrôle électrique OK. ${checklist.comment}',
      signatureUrl: auth.currentUser?.signatureUrl,
    );

    if (mounted && _totalDefects > 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Rapport d\'anomalie électrique généré.'),
        backgroundColor: AppTheme.successGreen,
        duration: Duration(seconds: 3),
      ));
    }

    setState(() => _isSaving = false);
    if (mounted) Navigator.pop(context, {'status': status, 'nombreDefauts': _totalDefects});
  }
}
