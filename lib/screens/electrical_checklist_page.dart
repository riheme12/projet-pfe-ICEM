import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/electrical_checklist.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/theme/app_theme.dart';

// ─── Dimensions du tableau ───────────────────────────────────────────────────
const double _rowH   = 36.0;
const double _grpH   = 22.0;
const double _subH   = 26.0;
const double _wRef   = 34.0;
const double _wNS    = 70.0;
const double _wConn  = 66.0;
const double _wPos   = 48.0;
const double _wMC    = 58.0;
const double _wEtiq  = 76.0;
const double _wCn2   = 56.0;
const double _wDer   = 66.0;

// Largeurs groupes
const double _wFMI  = _wConn + _wPos;
const double _wFI   = _wConn + _wPos + _wMC;
const double _wEM   = _wEtiq;
const double _wEI   = _wCn2 + _wCn2;
const double _wC    = _wDer;
const double _wPM   = _wEtiq;

const double _tableW = _wRef + _wNS + _wFMI + _wFI + _wEM + _wEI + _wC + _wPM;

// Couleurs groupes (légère alternance)
const Color _cFMI  = Color(0xFFFFF8E1);
const Color _cFI   = Color(0xFFE8F5E9);
const Color _cEM   = Color(0xFFE3F2FD);
const Color _cEI   = Color(0xFFF3E5F5);
const Color _cC    = Color(0xFFE8EAF6);
const Color _cPM   = Color(0xFFFFEBEE);
const Color _cBase = Colors.white;

/// Fiche de Contrôle Électrique ICEM — version numérique
class ElectricalChecklistPage extends StatefulWidget {
  final ManufacturingOrder order;
  const ElectricalChecklistPage({super.key, required this.order});

  @override
  State<ElectricalChecklistPage> createState() =>
      _ElectricalChecklistPageState();
}

// ─── Contrôleurs d'une ligne ─────────────────────────────────────────────────
typedef _RowCtrl = Map<String, TextEditingController>;

_RowCtrl _newRowCtrl() => {
      'ns':   TextEditingController(),
      'fmiC': TextEditingController(),
      'fmiP': TextEditingController(),
      'fiC':  TextEditingController(),
      'fiP':  TextEditingController(),
      'fiMC': TextEditingController(),
      'emC':  TextEditingController(),
      'eiC1': TextEditingController(),
      'eiC2': TextEditingController(),
      'cDer': TextEditingController(),
      'pmC':  TextEditingController(),
    };

void _disposeRowCtrl(_RowCtrl c) =>
    c.values.forEach((ctrl) => ctrl.dispose());

// ─── State ───────────────────────────────────────────────────────────────────
class _ElectricalChecklistPageState
    extends State<ElectricalChecklistPage> {
  bool _isSaving = false;

  // Header
  late final TextEditingController _ligneCtrl;
  late final TextEditingController _matriculeCtrl;
  late final TextEditingController _codeCableCtrl;
  late final TextEditingController _revisionCtrl;
  late final TextEditingController _quantiteCtrl;

  // Signatures
  final _sigLigneCtrl   = TextEditingController();
  final _sigQualiteCtrl = TextEditingController();

  // Rows
  final List<_RowCtrl> _rows = [];

  @override
  void initState() {
    super.initState();
    _ligneCtrl     = TextEditingController(text: widget.order.ligne ?? '');
    _codeCableCtrl = TextEditingController(text: widget.order.reference);
    _revisionCtrl  = TextEditingController();
    _quantiteCtrl  = TextEditingController(text: widget.order.QTA.toString());
    _matriculeCtrl = TextEditingController();
    for (int i = 0; i < 5; i++) _rows.add(_newRowCtrl());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _matriculeCtrl.text = auth.currentUser?.username ?? '';
  }

  @override
  void dispose() {
    _ligneCtrl.dispose();
    _matriculeCtrl.dispose();
    _codeCableCtrl.dispose();
    _revisionCtrl.dispose();
    _quantiteCtrl.dispose();
    _sigLigneCtrl.dispose();
    _sigQualiteCtrl.dispose();
    for (final r in _rows) _disposeRowCtrl(r);
    super.dispose();
  }

  // ── Calculs ─────────────────────────────────────────────────────────────────
  int get _nombreDefauts {
    int n = 0;
    for (final r in _rows) {
      for (final k in ['fmiC','fmiP','fiC','fiP','fiMC','emC','eiC1','eiC2','cDer','pmC']) {
        if (r[k]!.text.trim().isNotEmpty) n++;
      }
    }
    return n;
  }

  int get _cablesAvecDefaut =>
      _rows.where((r) => ['fmiC','fmiP','fiC','fiP','fiMC','emC','eiC1','eiC2','cDer','pmC']
          .any((k) => r[k]!.text.trim().isNotEmpty)).length;

  // ── Construction des objets métier ──────────────────────────────────────────
  List<CableDefectRow> _buildRowData() => _rows
      .map((r) => CableDefectRow(
            numeroSerie:                   r['ns']!.text,
            fmiConnecteur:                 r['fmiC']!.text,
            fmiPos:                        r['fmiP']!.text,
            fiConnecteur:                  r['fiC']!.text,
            fiPos:                         r['fiP']!.text,
            fiMarCoul:                     r['fiMC']!.text,
            etiquetteManquanteConnecteur:  r['emC']!.text,
            etiquetteInvertieConn1:        r['eiC1']!.text,
            etiquetteInvertieConn2:        r['eiC2']!.text,
            connecteurDerivation:          r['cDer']!.text,
            protectionManquanteConnecteur: r['pmC']!.text,
          ))
      .toList();

  // ── Submit ───────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final rowData = _buildRowData();
    final nbDef = _nombreDefauts;
    final qtaCtrl = int.tryParse(_quantiteCtrl.text) ?? rowData.length;
    final status = nbDef == 0 ? 'Conforme' : 'Non conforme';

    final checklist = ElectricalChecklist(
      orderId:               widget.order.id,
      orderReference:        widget.order.reference,
      ligneDeProd:           _ligneCtrl.text,
      matriculeOperateur:    _matriculeCtrl.text,
      controleurId:          auth.currentUser?.id ?? 'unknown',
      controleurName:        auth.currentUser?.fullName ?? 'Contrôleur',
      date:                  DateTime.now(),
      codeCable:             _codeCableCtrl.text,
      revision:              _revisionCtrl.text,
      quantiteCablesControles: qtaCtrl,
      cableRows:             rowData,
      nombreDefauts:         nbDef,
      signatureRespLigne:    _sigLigneCtrl.text,
      signatureRespQualite:  _sigQualiteCtrl.text,
      status:                status,
    );

    setState(() => _isSaving = true);
    final id = await OrdersService().saveElectricalChecklist(checklist);
    setState(() => _isSaving = false);
    if (!mounted) return;
    _showSuccess(status, nbDef, id);
  }

  void _showSuccess(String status, int nbDef, String? id) {
    final ok = status == 'Conforme';
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color: (ok ? Colors.green : Colors.orange).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  ok ? Icons.electric_bolt_rounded : Icons.warning_amber_rounded,
                  color: ok ? Colors.green : Colors.orange, size: 38,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                ok ? 'Contrôle OK — Aucun défaut' : '$nbDef défaut(s) relevé(s)',
                style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud_done_rounded, size: 15, color: Colors.blue.shade700),
                    const SizedBox(width: 7),
                    Text('Fiche enregistrée dans Firestore',
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.blue.shade700)),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context, {'status': status, 'nombreDefauts': nbDef, 'id': id, 'electricalDone': true});
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0D47A1),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Terminé', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D47A1),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Fiche de Contrôle Électrique',
                style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: Colors.white)),
            Text(widget.order.reference,
                style: GoogleFonts.inter(fontSize: 11, color: Colors.white60)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: Colors.white),
            tooltip: 'Ajouter une ligne',
            onPressed: () => setState(() => _rows.add(_newRowCtrl())),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _buildFormHeader(),
          const SizedBox(height: 12),
          _buildLegend(),
          const SizedBox(height: 8),
          _buildTable(),
          const SizedBox(height: 12),
          _buildAddRowButton(),
          const SizedBox(height: 16),
          _buildFooterSummary(),
          const SizedBox(height: 80),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  // ── En-tête formulaire ───────────────────────────────────────────────────────
  Widget _buildFormHeader() {
    final now = DateTime.now();
    final dateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            // Logo / Titre
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D47A1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('ICeM.n',
                      style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    children: [
                      Text('FORMULAIRE D\'ENREGISTREMENT',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5)),
                      Text('FICHE DE CONTROLE ÉLECTRIQUE',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 12, color: const Color(0xFF0D47A1))),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('DEM : 10/02/2007', style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
                    Text('DMJ : 10/08/2020', style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
                    Text('V : 08', style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 12),
            // Grille des champs
            Table(
              border: TableBorder.all(color: Colors.grey.shade300, width: 0.8),
              children: [
                TableRow(children: [
                  _hdrCell('LIGNE DE PRODUCTION'),
                  _inputCell(_ligneCtrl, hint: widget.order.ligne ?? ''),
                  _hdrCell('CODE CÂBLE'),
                  _inputCell(_codeCableCtrl),
                ]),
                TableRow(children: [
                  _hdrCell('MATRICULE OPÉRATEUR\nDU CONTRÔLE'),
                  _inputCell(_matriculeCtrl),
                  _hdrCell('RÉVISION'),
                  _inputCell(_revisionCtrl, hint: '—'),
                ]),
                TableRow(children: [
                  _hdrCell('DATE'),
                  _staticCell(dateStr),
                  _hdrCell('QUANTITÉ DE CÂBLES\nCONTRÔLÉS'),
                  _inputCell(_quantiteCtrl, keyboardType: TextInputType.number),
                ]),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _hdrCell(String text) => Padding(
        padding: const EdgeInsets.all(7),
        child: Text(text, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
      );

  Widget _staticCell(String text) => Padding(
        padding: const EdgeInsets.all(7),
        child: Text(text, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1))),
      );

  Widget _inputCell(TextEditingController ctrl,
      {String? hint, TextInputType keyboardType = TextInputType.text}) =>
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: TextField(
          controller: ctrl,
          keyboardType: keyboardType,
          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1)),
          decoration: InputDecoration(
            border: InputBorder.none,
            isDense: true,
            hintText: hint,
            hintStyle: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade400),
          ),
        ),
      );

  // ── Légende ─────────────────────────────────────────────────────────────────
  Widget _buildLegend() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Wrap(
          spacing: 16,
          runSpacing: 4,
          children: [
            _legendItem('DER', 'Dérivation'),
            _legendItem('MAR', 'Marquage'),
            _legendItem('POS', 'Position'),
            _legendItem('Conn', 'Connecteur'),
            _legendItem('FMI', 'Fil Mal Inséré'),
            _legendItem('FI', 'Fil Inverti'),
          ],
        ),
      );

  Widget _legendItem(String abbr, String full) => RichText(
        text: TextSpan(children: [
          TextSpan(text: '$abbr : ',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 11, color: const Color(0xFF0D47A1))),
          TextSpan(text: full,
              style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade700)),
        ]),
      );

  // ── Tableau principal (scroll horizontal) ────────────────────────────────────
  Widget _buildTable() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: _tableW,
            child: Column(
              children: [
                _buildGroupHeaders(),
                _buildSubHeaders(),
                ...List.generate(_rows.length, _buildDataRow),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Ligne des titres de groupes ──────────────────────────────────────────────
  Widget _buildGroupHeaders() {
    return SizedBox(
      height: _grpH,
      child: Row(
        children: [
          _grpHeader('', _wRef + _wNS, Colors.white),
          _grpHeader('Fil mal Inséré', _wFMI, _cFMI),
          _grpHeader('Fil Inverti', _wFI, _cFI),
          _grpHeader('Étiquette\nmanquante', _wEM, _cEM),
          _grpHeader('Étiquette\nInvertie', _wEI, _cEI),
          _grpHeader('Connecteur', _wC, _cC),
          _grpHeader('Protection\nmanquante', _wPM, _cPM),
        ],
      ),
    );
  }

  Widget _grpHeader(String text, double w, Color bg) => Container(
        width: w,
        height: _grpH,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: Colors.grey.shade400, width: 0.5),
        ),
        child: Text(text,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w700, color: Colors.grey.shade800)),
      );

  // ── Ligne des sous-colonnes ──────────────────────────────────────────────────
  Widget _buildSubHeaders() {
    return SizedBox(
      height: _subH,
      child: Row(
        children: [
          _subHeader('N°\nSérie', _wRef + _wNS, Colors.grey.shade100),
          _subHeader('Connecteur', _wConn, _cFMI),
          _subHeader('POS', _wPos, _cFMI),
          _subHeader('Connecteur', _wConn, _cFI),
          _subHeader('POS', _wPos, _cFI),
          _subHeader('Mar/Coul', _wMC, _cFI),
          _subHeader('Connecteur', _wEM, _cEM),
          _subHeader('Conn1', _wCn2, _cEI),
          _subHeader('Conn2', _wCn2, _cEI),
          _subHeader('Dérivation', _wDer, _cC),
          _subHeader('Connecteur', _wPM, _cPM),
        ],
      ),
    );
  }

  Widget _subHeader(String text, double w, Color bg) => Container(
        width: w,
        height: _subH,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: Colors.grey.shade400, width: 0.5),
        ),
        child: Text(text,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 8.5, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
      );

  // ── Ligne de données ─────────────────────────────────────────────────────────
  Widget _buildDataRow(int i) {
    final c = _rows[i];
    final isOdd = i.isOdd;
    final rowBg = isOdd ? const Color(0xFFFAFAFA) : Colors.white;
    return SizedBox(
      height: _rowH,
      child: Row(
        children: [
          // Ref + N° Série (groupés)
          _numCell(i, c, rowBg),
          _cell(c, 'fmiC', _wConn, _cFMI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'fmiP', _wPos,  _cFMI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'fiC',  _wConn, _cFI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'fiP',  _wPos,  _cFI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'fiMC', _wMC,   _cFI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'emC',  _wEM,   _cEM.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'eiC1', _wCn2,  _cEI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'eiC2', _wCn2,  _cEI.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'cDer', _wDer,  _cC.withValues(alpha: isOdd ? 0.5 : 0.25)),
          _cell(c, 'pmC',  _wPM,   _cPM.withValues(alpha: isOdd ? 0.5 : 0.25)),
        ],
      ),
    );
  }

  Widget _numCell(int i, _RowCtrl c, Color bg) => Container(
        width: _wRef + _wNS,
        height: _rowH,
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: Colors.grey.shade300, width: 0.5),
        ),
        child: Row(
          children: [
            // Ref number
            Container(
              width: _wRef,
              alignment: Alignment.center,
              child: Text('${i + 1}',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey)),
            ),
            Container(width: 0.5, color: Colors.grey.shade300),
            // N° Série text field
            Expanded(
              child: _miniField(c['ns']!),
            ),
            // Remove button
            GestureDetector(
              onTap: () { if (_rows.length > 1) setState(() { _disposeRowCtrl(_rows.removeAt(i)); }); },
              child: Padding(
                padding: const EdgeInsets.only(right: 2),
                child: Icon(Icons.close_rounded, size: 12, color: Colors.red.shade300),
              ),
            ),
          ],
        ),
      );

  Widget _cell(_RowCtrl c, String key, double w, Color bg) => Container(
        width: w,
        height: _rowH,
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: Colors.grey.shade300, width: 0.5),
        ),
        child: _miniField(c[key]!),
      );

  Widget _miniField(TextEditingController ctrl) => Center(
        child: TextField(
          controller: ctrl,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.black87),
          decoration: const InputDecoration(
            border: InputBorder.none,
            isDense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: 2, vertical: 0),
          ),
        ),
      );

  // ── Bouton ajouter ligne ─────────────────────────────────────────────────────
  Widget _buildAddRowButton() => Center(
        child: OutlinedButton.icon(
          onPressed: () => setState(() => _rows.add(_newRowCtrl())),
          icon: const Icon(Icons.add_rounded, size: 18),
          label: Text('Ajouter une ligne câble',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF0D47A1),
            side: const BorderSide(color: Color(0xFF0D47A1)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
        ),
      );

  // ── Résumé / pied de fiche ───────────────────────────────────────────────────
  Widget _buildFooterSummary() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Résumé de la fiche',
                style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.textDark)),
            const SizedBox(height: 14),
            Table(
              border: TableBorder.all(color: Colors.grey.shade300, width: 0.8, borderRadius: BorderRadius.circular(8)),
              children: [
                TableRow(children: [
                  _summaryLabel('Nombre de défauts'),
                  _summaryValue('$_nombreDefauts', _nombreDefauts > 0 ? Colors.red : Colors.green),
                  _summaryLabel('Câbles contrôlés'),
                  _summaryValue(_quantiteCtrl.text, const Color(0xFF0D47A1)),
                ]),
                TableRow(children: [
                  _summaryLabel('Câbles avec défaut'),
                  _summaryValue('$_cablesAvecDefaut', _cablesAvecDefaut > 0 ? Colors.orange : Colors.green),
                  _summaryLabel('Statut'),
                  _summaryValue(
                    _nombreDefauts == 0 ? 'Conforme' : 'Non conforme',
                    _nombreDefauts == 0 ? Colors.green : Colors.red,
                  ),
                ]),
              ],
            ),
            const SizedBox(height: 16),
            // Signatures
            Row(
              children: [
                Expanded(child: _signatureField(_sigLigneCtrl, 'Signature Resp. Ligne')),
                const SizedBox(width: 12),
                Expanded(child: _signatureField(_sigQualiteCtrl, 'Signature Resp. Qualité')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryLabel(String text) => Padding(
        padding: const EdgeInsets.all(8),
        child: Text(text, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
      );

  Widget _summaryValue(String text, Color color) => Padding(
        padding: const EdgeInsets.all(8),
        child: Text(text, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
      );

  Widget _signatureField(TextEditingController ctrl, String label) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600)),
          const SizedBox(height: 4),
          Container(
            height: 38,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: TextField(
              controller: ctrl,
              style: GoogleFonts.inter(fontSize: 12),
              decoration: const InputDecoration(
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              ),
            ),
          ),
        ],
      );

  // ── Barre du bas ─────────────────────────────────────────────────────────────
  Widget _buildBottomBar() => Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, -3))],
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isSaving ? null : _submit,
              icon: _isSaving
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.save_rounded),
              label: Text(
                _isSaving ? 'Enregistrement...' : 'Enregistrer la Fiche Électrique',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0D47A1),
                foregroundColor: Colors.white,
                disabledBackgroundColor: Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 3,
              ),
            ),
          ),
        ),
      );
}
