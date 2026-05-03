import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/providers/auth_provider.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/pdf_service.dart';

// ─── Dimensions tableau ───────────────────────────────────────────────────────
const double _rowH  = 38.0;
const double _subH  = 28.0;
const double _wRef  = 34.0;
const double _wCode = 82.0;   // Code Câble
const double _wNS   = 68.0;   // N° Série
const double _wDef  = 92.0;   // Code défaut
const double _wDer  = 62.0;   // Dérivation
const double _wOK   = 56.0;   // OK/NOK
const double _tableW = _wRef + _wCode + _wNS + _wDef + _wDer + _wOK; // 394px

// Codes défauts FOR QUA 06
const _codes = [
  ('A','Cosse déformée / mal agrafée'), ('B','Cosse éganchati'),
  ('C','Cosse ouverte'),                ('D','Fil pincé / écrasé / coupé'),
  ('E','Fils inversés'),                ('F','Fil tendu / torsionné'),
  ('G','Fil sans cosse'),               ('H','Ticket électrique NC'),
  ('I','Longueur fil / couleur / section'), ('J','Connecteur cassé / déformé / manquant'),
  ('K','Bouchette manquante / mal serrée'), ('L','Tube thermo NC'),
  ('M','Protection ouverte / manquante'),   ('N','Tube manqué / court / crevé'),
  ('O','Vis mal serrée / manque'),          ('P','Composant manquant'),
  ('Q','Manque fusible / erroné'),          ('R','Gamme déchirée / manquante'),
  ('S','Scotch mal exécuté / manque'),      ('T','Mesure Dérivation'),
  ('V','Étiquette manquante'),              ('W','Étiquette inversée'),
  ('Z','Autres défauts'),
];

// ─── Ligne du tableau ─────────────────────────────────────────────────────────
class _VisualRow {
  final TextEditingController codeCtrl;
  final TextEditingController nsCtrl;
  final TextEditingController defCtrl;
  final TextEditingController derCtrl;
  bool isConform;

  _VisualRow({String cableCode = ''})
      : codeCtrl = TextEditingController(text: cableCode),
        nsCtrl   = TextEditingController(),
        defCtrl  = TextEditingController(),
        derCtrl  = TextEditingController(),
        isConform = true;

  void dispose() {
    codeCtrl.dispose(); nsCtrl.dispose(); defCtrl.dispose(); derCtrl.dispose();
  }

  bool get hasCode => codeCtrl.text.trim().isNotEmpty;
}

// ─── Page principale ──────────────────────────────────────────────────────────

/// Fiche de Contrôle Finale ICEM — FOR QUA 06
/// Même style que la fiche électrique — tableau horizontal scrollable
class ChecklistPage extends StatefulWidget {
  final String? orderId;
  final String? orderReference;
  final String? cableReference;
  final String? serialNumber;           // Nouveau : N° de série scanné
  final List<String>? detectedDefects;  // Nouveau : Liste des codes défauts IA
  final String? imageUrl;               // Nouveau : URL de la photo prise

  const ChecklistPage({
    super.key,
    this.orderId,
    this.orderReference,
    this.cableReference,
    this.serialNumber,
    this.detectedDefects,
    this.imageUrl,
  });

  @override
  State<ChecklistPage> createState() => _ChecklistPageState();
}

class _ChecklistPageState extends State<ChecklistPage> {
  bool _isSaving = false;

  // Header
  late final TextEditingController _nomCtrl;
  late final TextEditingController _noteCtrl;
  late final TextEditingController _sigLigneCtrl;
  late final TextEditingController _sigQualiteCtrl;

  // Rows
  final List<_VisualRow> _rows = [];

  @override
  void initState() {
    super.initState();
    _nomCtrl       = TextEditingController();
    _noteCtrl      = TextEditingController();
    _sigLigneCtrl  = TextEditingController();
    _sigQualiteCtrl = TextEditingController();
    
    // Créer la première ligne avec les données IA si disponibles
    final row = _VisualRow(cableCode: widget.cableReference ?? '');
    
    // Auto-remplissage du N° de série (Provient du QR Code)
    row.nsCtrl.text = widget.serialNumber ?? widget.cableReference ?? '';
    
    // Auto-remplissage des codes défauts IA
    if (widget.detectedDefects != null && widget.detectedDefects!.isNotEmpty) {
      row.defCtrl.text = widget.detectedDefects!.join(', ');
      row.isConform = false;
    }

    row.defCtrl.addListener(() {
      if (mounted) setState(() => row.isConform = row.defCtrl.text.trim().isEmpty);
    });
    
    _rows.add(row);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _nomCtrl.text = auth.currentUser?.fullName ?? auth.currentUser?.username ?? '';
  }

  @override
  void dispose() {
    _nomCtrl.dispose(); _noteCtrl.dispose();
    _sigLigneCtrl.dispose(); _sigQualiteCtrl.dispose();
    for (final r in _rows) r.dispose();
    super.dispose();
  }

  void _addRow({String cableCode = ''}) {
    final row = _VisualRow(cableCode: cableCode);
    row.defCtrl.addListener(() {
      setState(() => row.isConform = row.defCtrl.text.trim().isEmpty);
    });
    setState(() => _rows.add(row));
  }

  void _removeRow(int i) {
    if (_rows.length <= 1) return;
    setState(() {
      _rows[i].dispose();
      _rows.removeAt(i);
    });
  }

  // ── Calculs ──────────────────────────────────────────────────────────────────
  int get _totalControlled => _rows.where((r) => r.hasCode).length;
  int get _nombreNC => _rows.where((r) => r.hasCode && !r.isConform).length;

  // ── Submit ────────────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final validRows = _rows.where((r) => r.hasCode).toList();
    if (validRows.isEmpty) return;

    setState(() => _isSaving = true);

    for (final row in validRows) {
      final status = row.isConform ? 'Conforme' : 'Non conforme';
      await OrdersService().saveCable(
        reference: row.codeCtrl.text.trim(),
        code: row.codeCtrl.text.trim(),
        orderId: widget.orderId ?? '',
        status: status,
        technicianId: auth.currentUser?.id ?? 'unknown',
        technicianName: auth.currentUser?.fullName ?? auth.currentUser?.username ?? 'Technicien Mobile',
        anomaliesCount: row.defCtrl.text.trim().isEmpty ? 0 : 1,
        imageUrl: widget.imageUrl, // Enregistrement de l'URL de la photo !
        visualChecklistItems: [{
          'codeDefaut':  row.defCtrl.text.trim(),
          'numeroSerie': row.nsCtrl.text.trim(),
          'derivation':  row.derCtrl.text.trim(),
          'status':      status,
          'note':        _noteCtrl.text.trim(),
        }],
      );
    }

    setState(() => _isSaving = false);
    if (!mounted) return;

    // --- NOUVEAU : GÉNÉRATION DU PDF AUTOMATIQUE ---
    try {
      await PdfService.generateInspectionReport(
        technicianName: _nomCtrl.text.trim(),
        cableRef: widget.cableReference ?? 'N/A',
        orderRef: widget.orderReference ?? 'N/A',
        checklistItems: validRows.map((r) => {
          'numeroSerie': r.nsCtrl.text.trim(),
          'codeDefaut': r.defCtrl.text.trim(),
          'derivation': r.derCtrl.text.trim(),
          'status': r.isConform ? 'Conforme' : 'Non conforme',
        }).toList(),
      );
    } catch (e) {
      debugPrint('Erreur PDF: $e');
    }

    _showSuccess(validRows.length, _nombreNC);
  }

  void _showSuccess(int total, int nc) {
    final ok = nc == 0;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 70, height: 70,
                decoration: BoxDecoration(
                  color: (ok ? Colors.green : Colors.orange).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  ok ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                  color: ok ? Colors.green : Colors.orange, size: 38,
                ),
              ),
              const SizedBox(height: 18),
              Text(ok ? 'Contrôle Terminé ✓' : '$nc câble(s) NC',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text('$total câble(s) contrôlé(s) — $nc non conforme(s)',
                  style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textGrey)),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.cloud_done_rounded, size: 15, color: Colors.green.shade700),
                  const SizedBox(width: 7),
                  Text('Enregistré dans Firestore',
                      style: GoogleFonts.inter(fontSize: 12, color: Colors.green.shade700)),
                ]),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context, {
                      'status': nc == 0 ? 'Conforme' : 'Non conforme',
                      'cableReference': widget.cableReference,
                      'anomaliesCount': nc,
                    });
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
            Text('Fiche de Contrôle Finale',
                style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16, color: Colors.white)),
            Text(widget.orderReference ?? widget.cableReference ?? '',
                style: GoogleFonts.inter(fontSize: 11, color: Colors.white60)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: Colors.white),
            tooltip: 'Ajouter une ligne',
            onPressed: () => _addRow(),
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

  // ── En-tête Fiche ─────────────────────────────────────────────────────────
  Widget _buildFormHeader() {
    final now = DateTime.now();
    final dateStr = '${now.day.toString().padLeft(2,'0')}/${now.month.toString().padLeft(2,'0')}/${now.year}';
    final months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            // Logo / Titre
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFF0D47A1), borderRadius: BorderRadius.circular(8)),
                child: Text('ICeM.n', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(children: [
                  Text('MODULE D\'ENREGISTREMENT',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 0.5)),
                  Text('FICHE DE CONTRÔLE FINALE',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 12, color: const Color(0xFF0D47A1))),
                ]),
              ),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('FOR QUA 06',  style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
                Text('DEM 13/11/2008', style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
                Text('V07', style: GoogleFonts.inter(fontSize: 9, color: Colors.grey)),
              ]),
            ]),
            const SizedBox(height: 12),
            // Mois
            Row(children: [
              Text('Mois : ', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textGrey, fontWeight: FontWeight.w500)),
              Expanded(
                child: Wrap(
                  spacing: 4,
                  children: List.generate(12, (i) {
                    final sel = i == now.month - 1;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: sel ? const Color(0xFF0D47A1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(months[i], style: GoogleFonts.inter(
                          fontSize: 10, color: sel ? Colors.white : Colors.grey,
                          fontWeight: sel ? FontWeight.w700 : FontWeight.w400)),
                    );
                  }),
                ),
              ),
            ]),
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),
            // Champs fiche
            Table(
              border: TableBorder.all(color: Colors.grey.shade300, width: 0.8),
              children: [
                TableRow(children: [
                  _hCell('Nom Contrôleuse :'),
                  _iCell(_nomCtrl),
                  _hCell('Date :'),
                  Padding(padding: const EdgeInsets.all(7),
                    child: Text(dateStr, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1)))),
                  _hCell('Note :'),
                  _iCell(_noteCtrl),
                ]),
                if (widget.orderReference != null) TableRow(children: [
                  _hCell('Ordre :'),
                  Padding(padding: const EdgeInsets.all(7),
                    child: Text(widget.orderReference!, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1)))),
                  _hCell('Câble scané :'),
                  Padding(padding: const EdgeInsets.all(7),
                    child: Text(widget.cableReference ?? '—', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1)))),
                  _hCell(''),
                  const SizedBox(),
                ]),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _hCell(String t) => Padding(padding: const EdgeInsets.all(7),
      child: Text(t, style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.grey.shade600)));

  Widget _iCell(TextEditingController c) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      child: TextField(controller: c, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0D47A1)),
          decoration: const InputDecoration(border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero)));

  // ── Légende compacte ──────────────────────────────────────────────────────
  Widget _buildLegend() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Codes défauts', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: const Color(0xFF0D47A1))),
            const SizedBox(height: 6),
            Wrap(
              spacing: 10,
              runSpacing: 4,
              children: _codes.map((e) => RichText(
                text: TextSpan(children: [
                  TextSpan(text: '${e.$1}: ', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 10, color: const Color(0xFF0D47A1))),
                  TextSpan(text: e.$2, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade700)),
                ]),
              )).toList(),
            ),
          ],
        ),
      );

  // ── Tableau principal ─────────────────────────────────────────────────────
  Widget _buildTable() => Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SizedBox(
              width: _tableW,
              child: Column(children: [
                _buildSubHeaders(),
                ...List.generate(_rows.length, _buildDataRow),
              ]),
            ),
          ),
        ),
      );

  Widget _buildSubHeaders() => SizedBox(
        height: _subH,
        child: Row(children: [
          _subH2('N°',         _wRef,  Colors.grey.shade100),
          _subH2('Code Câble', _wCode, Colors.blue.shade50),
          _subH2('N° Série',   _wNS,   Colors.blue.shade50),
          _subH2('Code défaut',_wDef,  Colors.orange.shade50),
          _subH2('Dérivation', _wDer,  Colors.blue.shade50),
          _subH2('OK/NOK',     _wOK,   Colors.grey.shade100),
        ]),
      );

  Widget _subH2(String t, double w, Color bg) => Container(
        width: w, height: _subH,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: bg, border: Border.all(color: Colors.grey.shade300, width: 0.5)),
        child: Text(t, textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.grey.shade700)));

  Widget _buildDataRow(int i) {
    final r  = _rows[i];
    final bg = i.isOdd ? const Color(0xFFF9FFF9) : Colors.white;
    return SizedBox(
      height: _rowH,
      child: Row(children: [
        // Ref + remove
        Container(
          width: _wRef, height: _rowH,
          decoration: BoxDecoration(color: bg, border: Border.all(color: Colors.grey.shade300, width: 0.5)),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('${i+1}', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
            if (_rows.length > 1)
              GestureDetector(
                onTap: () => _removeRow(i),
                child: Icon(Icons.close_rounded, size: 11, color: Colors.red.shade300),
              ),
          ]),
        ),
        // Code Câble
        _txtCell(r.codeCtrl, _wCode, bg, color: const Color(0xFF0D47A1), bold: true),
        // N° Série
        _txtCell(r.nsCtrl,   _wNS,  bg),
        // Code défaut
        _txtCell(r.defCtrl,  _wDef, r.defCtrl.text.trim().isEmpty ? bg : Colors.red.shade50,
            color: Colors.red.shade700, hint: 'ex: A,V,W'),
        // Dérivation
        _txtCell(r.derCtrl,  _wDer, bg, hint: '—'),
        // OK/NOK toggle
        _okNokCell(r, i),
      ]),
    );
  }

  Widget _txtCell(TextEditingController ctrl, double w, Color bg,
      {Color? color, bool bold = false, String? hint}) =>
      Container(
        width: w, height: _rowH,
        decoration: BoxDecoration(color: bg, border: Border.all(color: Colors.grey.shade300, width: 0.5)),
        child: Center(
          child: TextField(
            controller: ctrl,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
                color: color ?? Colors.black87),
            decoration: InputDecoration(
              border: InputBorder.none, isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 2, vertical: 0),
              hintText: hint,
              hintStyle: GoogleFonts.inter(fontSize: 9, color: Colors.grey.shade400),
            ),
          ),
        ),
      );

  Widget _okNokCell(_VisualRow row, int i) => GestureDetector(
        onTap: () => setState(() => row.isConform = !row.isConform),
        child: Container(
          width: _wOK, height: _rowH,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: row.isConform ? Colors.green.withValues(alpha: 0.08) : Colors.red.withValues(alpha: 0.08),
            border: Border.all(color: Colors.grey.shade300, width: 0.5),
          ),
          child: Text(
            row.isConform ? 'OK' : 'NOK',
            style: GoogleFonts.inter(
                fontSize: 11, fontWeight: FontWeight.w800,
                color: row.isConform ? Colors.green.shade700 : Colors.red.shade700),
          ),
        ),
      );

  // ── Bouton ajouter ligne ──────────────────────────────────────────────────
  Widget _buildAddRowButton() => Center(
        child: OutlinedButton.icon(
          onPressed: () => _addRow(),
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

  // ── Résumé pied de fiche ──────────────────────────────────────────────────
  Widget _buildFooterSummary() => Card(
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
                border: TableBorder.all(color: Colors.grey.shade300, width: 0.8),
                children: [
                  TableRow(children: [
                    _sLabel('Total Contrôlé'),
                    _sValue('$_totalControlled', const Color(0xFF0D47A1)),
                    _sLabel('Nombre NC'),
                    _sValue('$_nombreNC', _nombreNC > 0 ? Colors.red : Colors.green),
                    _sLabel('Statut'),
                    _sValue(_nombreNC == 0 ? 'Conforme' : 'NC',
                        _nombreNC == 0 ? Colors.green : Colors.red),
                  ]),
                ],
              ),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: _sigField(_sigLigneCtrl,   'Signature Resp. Ligne')),
                const SizedBox(width: 12),
                Expanded(child: _sigField(_sigQualiteCtrl, 'Signature Resp. Qualité')),
              ]),
            ],
          ),
        ),
      );

  Widget _sLabel(String t) => Padding(padding: const EdgeInsets.all(8),
      child: Text(t, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600)));

  Widget _sValue(String t, Color c) => Padding(padding: const EdgeInsets.all(8),
      child: Text(t, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: c)));

  Widget _sigField(TextEditingController c, String label) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey.shade600)),
          const SizedBox(height: 4),
          Container(
            height: 38,
            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
            child: TextField(controller: c, style: GoogleFonts.inter(fontSize: 12),
                decoration: const InputDecoration(border: InputBorder.none, isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 10))),
          ),
        ],
      );

  // ── Barre du bas ──────────────────────────────────────────────────────────
  Widget _buildBottomBar() => Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, -3))],
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Résumé compact
              Row(children: [
                Icon(
                  _nombreNC == 0 ? Icons.check_circle_rounded : Icons.warning_rounded,
                  size: 16, color: _nombreNC == 0 ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 6),
                Text(
                  '$_totalControlled câble(s) contrôlé(s)  •  $_nombreNC NC',
                  style: GoogleFonts.inter(fontSize: 12, color: _nombreNC == 0 ? Colors.green : Colors.red, fontWeight: FontWeight.w600),
                ),
              ]),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _submit,
                  icon: _isSaving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.save_rounded),
                  label: Text(
                    _isSaving ? 'Enregistrement...' : 'Enregistrer la Fiche Visuelle',
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
              const SizedBox(height: 4),
            ],
          ),
        ),
      );
}

