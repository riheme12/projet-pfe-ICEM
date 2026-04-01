import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:projeticem/models/checklist_item.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/providers/auth_provider.dart';

// ─── Définition des groupes de défauts ICEM ──────────────────────────────────

class _DefectGroup {
  final String title;
  final IconData icon;
  final Color color;
  final List<ChecklistItem> items;
  const _DefectGroup(this.title, this.icon, this.color, this.items);
}

List<_DefectGroup> _buildGroups() => [
      _DefectGroup('Cosses & Fils', Icons.electrical_services_rounded,
          const Color(0xFF1565C0), [
        ChecklistItem(code: 'A', label: 'Cosse déformée / mal sertie'),
        ChecklistItem(code: 'B', label: 'Cosse repercutée'),
        ChecklistItem(code: 'C', label: 'Cosse ouverte'),
        ChecklistItem(code: 'D', label: 'Fil pincé / écrasé / coupé'),
        ChecklistItem(code: 'E', label: 'Fils inversés'),
        ChecklistItem(code: 'F', label: 'Fil troublé / torsionné'),
      ]),
      _DefectGroup('Gaine & Protection', Icons.shield_rounded,
          const Color(0xFF2E7D32), [
        ChecklistItem(code: 'G', label: 'Gaine défectueuse NC'),
        ChecklistItem(code: 'L', label: 'Tube therme NC'),
        ChecklistItem(code: 'M', label: 'Protection incorrecte / manquante'),
      ]),
      _DefectGroup('Longueur & Bouchette', Icons.straighten_rounded,
          const Color(0xFF6A1B9A), [
        ChecklistItem(code: 'J', label: 'Longueur fil / couleur / section'),
        ChecklistItem(code: 'K', label: 'Bouchette manquante / mal serrée'),
      ]),
      _DefectGroup('Connecteur & Composants', Icons.settings_input_component_rounded,
          const Color(0xFFE65100), [
        ChecklistItem(code: 'N', label: 'Connecteur cassé / déformé / manquant'),
        ChecklistItem(code: 'O', label: 'Vis mal serrée / manque'),
        ChecklistItem(code: 'P', label: 'Composant manquant'),
        ChecklistItem(code: 'Q', label: 'Manque fusible / erroné'),
      ]),
      _DefectGroup('Finition', Icons.auto_fix_high_rounded,
          const Color(0xFF00838F), [
        ChecklistItem(code: 'R', label: 'Gestion déchirée / manquante'),
        ChecklistItem(code: 'S', label: 'Scotch mal exécuté / manque'),
      ]),
      _DefectGroup('Étiquettes', Icons.label_rounded,
          const Color(0xFFC62828), [
        ChecklistItem(code: 'V', label: 'Étiquette manquante'),
        ChecklistItem(code: 'W', label: 'Étiquette inversée'),
      ]),
      _DefectGroup('Autres', Icons.more_horiz_rounded,
          const Color(0xFF546E7A), [
        ChecklistItem(code: 'Z', label: 'Autres défauts'),
      ]),
    ];

// ─── Page principale ─────────────────────────────────────────────────────────

/// Page de checklist VISUELLE — 20 codes de défauts ICEM (A→Z)
/// Effectuée par le contrôleur visuel APRÈS le contrôle électrique + scan QR
class ChecklistPage extends StatefulWidget {
  final String? orderId;
  final String? orderReference;
  final String? cableReference;

  const ChecklistPage({
    super.key,
    this.orderId,
    this.orderReference,
    this.cableReference,
  });

  @override
  State<ChecklistPage> createState() => _ChecklistPageState();
}

class _ChecklistPageState extends State<ChecklistPage> {
  bool _isSaving = false;
  late final List<_DefectGroup> _groups;
  List<ChecklistItem> get _allItems =>
      _groups.expand((g) => g.items).toList();

  @override
  void initState() {
    super.initState();
    _groups = _buildGroups();
  }

  int get _totalItems => _allItems.length;
  int get _completedCount =>
      _allItems.where((i) => i.result != ChecklistResult.pending).length;
  bool get _isComplete => _completedCount == _totalItems;
  int get _nokCount => _allItems.where((i) => i.result == ChecklistResult.nok).length;

  // ─── Build ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: _buildCableBanner()),
          SliverToBoxAdapter(child: _buildProgressCard()),
          ..._groups.map((g) => SliverToBoxAdapter(child: _buildGroupSection(g))),
          const SliverToBoxAdapter(child: SizedBox(height: 110)),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  // ─── AppBar ───────────────────────────────────────────────────────────────
  Widget _buildSliverAppBar() => SliverAppBar(
        expandedHeight: 100,
        pinned: true,
        backgroundColor: const Color(0xFF2E7D32),
        flexibleSpace: FlexibleSpaceBar(
          background: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1B5E20), Color(0xFF388E3C)],
              ),
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.visibility_rounded,
                          color: Colors.lightGreenAccent, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Checklist Visuelle',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.w800,
                                fontSize: 19,
                                color: Colors.white)),
                        Text('20 points de contrôle ICEM',
                            style: GoogleFonts.inter(
                                fontSize: 12, color: Colors.white60)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

  // ─── Bannière câble ───────────────────────────────────────────────────────
  Widget _buildCableBanner() => Container(
        margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border:
              Border.all(color: Colors.green.withValues(alpha: 0.3), width: 1.5),
          boxShadow: [
            BoxShadow(
                color: Colors.green.withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, 3)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.qr_code_rounded,
                  color: Color(0xFF2E7D32), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Câble en cours de contrôle',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AppTheme.textLight)),
                  Text(widget.cableReference ?? 'Référence non spécifiée',
                      style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF2E7D32))),
                  if (widget.orderReference != null)
                    Text('Ordre: ${widget.orderReference}',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: AppTheme.textGrey)),
                ],
              ),
            ),
            // Badge électrique OK
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border:
                    Border.all(color: Colors.blue.withValues(alpha: 0.3)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.electric_bolt_rounded,
                    size: 12, color: Colors.blue),
                const SizedBox(width: 4),
                Text('Élec. ✓',
                    style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Colors.blue)),
              ]),
            ),
          ],
        ),
      );

  // ─── Carte progression ────────────────────────────────────────────────────
  Widget _buildProgressCard() {
    final pct = _totalItems == 0 ? 0.0 : _completedCount / _totalItems;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          Row(children: [
            Text('Progression',
                style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textDark)),
            const Spacer(),
            _statChip('$_completedCount/$_totalItems', Colors.blue, 'Vérifiés'),
            const SizedBox(width: 8),
            _statChip('$_nokCount', Colors.red, 'Défauts'),
          ]),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 8,
              backgroundColor: Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(
                _isComplete
                    ? (_nokCount == 0 ? Colors.green : Colors.orange)
                    : const Color(0xFF2E7D32),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _isComplete
                ? (_nokCount == 0
                    ? '✅ Tous les points sont conformes'
                    : '⚠️ $_nokCount défaut(s) détecté(s)')
                : '${_totalItems - _completedCount} point(s) restant(s)',
            style: GoogleFonts.inter(
                fontSize: 12,
                color: _isComplete
                    ? (_nokCount == 0 ? Colors.green : Colors.orange)
                    : AppTheme.textGrey),
          ),
        ],
      ),
    );
  }

  Widget _statChip(String value, Color color, String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(children: [
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: color)),
          Text(label,
              style:
                  GoogleFonts.inter(fontSize: 9, color: color)),
        ]),
      );

  // ─── Section groupe ───────────────────────────────────────────────────────
  Widget _buildGroupSection(_DefectGroup group) {
    final doneInGroup =
        group.items.where((i) => i.result != ChecklistResult.pending).length;
    final allDone = doneInGroup == group.items.length;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête du groupe
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: group.color.withValues(alpha: 0.07),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(
                bottom: BorderSide(
                    color: group.color.withValues(alpha: 0.2), width: 1),
              ),
            ),
            child: Row(children: [
              Icon(group.icon, color: group.color, size: 20),
              const SizedBox(width: 10),
              Text(group.title,
                  style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: group.color)),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: allDone
                      ? group.color.withValues(alpha: 0.15)
                      : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$doneInGroup/${group.items.length}',
                  style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: allDone ? group.color : Colors.grey),
                ),
              ),
            ]),
          ),
          // Items du groupe
          ...group.items.map((item) => _buildItem(item, group.color)),
        ],
      ),
    );
  }

  // ─── Item checklist ───────────────────────────────────────────────────────
  Widget _buildItem(ChecklistItem item, Color groupColor) {
    final isNok = item.result == ChecklistResult.nok;
    final isOk = item.result == ChecklistResult.ok;
    final isNa = item.result == ChecklistResult.na;
    final done = item.result != ChecklistResult.pending;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Code badge
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: done
                          ? (isOk
                              ? Colors.green
                              : isNok
                                  ? Colors.red
                                  : Colors.grey)
                          : groupColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: done
                          ? Icon(
                              isOk
                                  ? Icons.check
                                  : isNok
                                      ? Icons.close
                                      : Icons.remove,
                              size: 16,
                              color: Colors.white)
                          : Text(item.code,
                              style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: groupColor)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(item.label,
                        style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textDark)),
                  ),
                  if (done)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: (isOk
                                ? Colors.green
                                : isNok
                                    ? Colors.red
                                    : Colors.grey)
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isOk ? 'OK' : isNok ? 'NOK' : 'N/A',
                        style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isOk
                                ? Colors.green
                                : isNok
                                    ? Colors.red
                                    : Colors.grey),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              // Boutons OK / NOK / N/A
              Row(children: [
                _resultBtn(item, ChecklistResult.ok, 'OK', Colors.green,
                    Icons.check_circle_rounded),
                const SizedBox(width: 6),
                _resultBtn(item, ChecklistResult.nok, 'NOK', Colors.red,
                    Icons.cancel_rounded),
                const SizedBox(width: 6),
                _resultBtn(item, ChecklistResult.na, 'N/A', Colors.grey,
                    Icons.remove_circle_rounded),
              ]),
              // Champ commentaire si NOK
              if (isNok) ...[
                const SizedBox(height: 10),
                TextField(
                  decoration: InputDecoration(
                    hintText: '[${item.code}] Décrire le défaut...',
                    hintStyle:
                        GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                    prefixIcon: const Icon(Icons.warning_amber_rounded,
                        color: Colors.red, size: 18),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Colors.red),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide:
                          const BorderSide(color: Colors.red, width: 1.5),
                    ),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    filled: true,
                    fillColor: Colors.red.withValues(alpha: 0.03),
                  ),
                  style: GoogleFonts.inter(fontSize: 13),
                  onChanged: (val) => item.comment = val,
                ),
              ],
            ],
          ),
        ),
        const Divider(height: 1, indent: 14, endIndent: 14),
      ],
    );
  }

  Widget _resultBtn(ChecklistItem item, ChecklistResult res, String label,
      Color color, IconData icon) {
    final selected = item.result == res;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => item.result = res),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected
                ? color
                : color.withValues(alpha: 0.05),
            border: Border.all(
                color: selected
                    ? color
                    : color.withValues(alpha: 0.35),
                width: selected ? 2 : 1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 15,
                  color: selected ? Colors.white : color),
              const SizedBox(width: 4),
              Text(label,
                  style: GoogleFonts.inter(
                      color: selected ? Colors.white : color,
                      fontWeight: selected
                          ? FontWeight.w700
                          : FontWeight.w500,
                      fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Barre du bas ─────────────────────────────────────────────────────────
  Widget _buildBottomBar() {
    final pct = _totalItems == 0 ? 0.0 : _completedCount / _totalItems;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, -4)),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(children: [
              Text('$_completedCount/$_totalItems points',
                  style:
                      GoogleFonts.inter(fontSize: 12, color: AppTheme.textGrey)),
              const Spacer(),
              Text('${(pct * 100).toStringAsFixed(0)}%',
                  style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: _isComplete
                          ? (_nokCount == 0 ? Colors.green : Colors.orange)
                          : const Color(0xFF2E7D32))),
            ]),
            const SizedBox(height: 5),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 5,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(
                  _isComplete
                      ? (_nokCount == 0 ? Colors.green : Colors.orange)
                      : const Color(0xFF2E7D32),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isComplete && !_isSaving ? _submit : null,
                icon: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_rounded),
                label: Text(
                  _isSaving
                      ? 'Enregistrement...'
                      : 'Valider le Contrôle Visuel',
                  style: GoogleFonts.inter(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isComplete
                      ? (_nokCount == 0
                          ? const Color(0xFF2E7D32)
                          : Colors.orange.shade700)
                      : Colors.grey.shade400,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: _isComplete ? 3 : 0,
                ),
              ),
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  Future<void> _submit() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final status = _nokCount == 0 ? 'Conforme' : 'Non conforme';

    if (widget.orderId != null && widget.cableReference != null) {
      setState(() => _isSaving = true);
      await OrdersService().saveCable(
        reference: widget.cableReference!,
        code: widget.cableReference!,
        orderId: widget.orderId!,
        status: status,
        technicianId: auth.currentUser?.id ?? 'unknown',
        anomaliesCount: _nokCount,
        visualChecklistItems: _allItems.map((i) => i.toMap()).toList(),
      );
      setState(() => _isSaving = false);
    }

    if (!mounted) return;
    _showResult(status);
  }

  void _showResult(String status) {
    final ok = status == 'Conforme';
    // Collecte des défauts
    final defauts = _allItems.where((i) => i.result == ChecklistResult.nok).toList();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: (ok ? Colors.green : Colors.orange)
                      .withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  ok
                      ? Icons.check_circle_rounded
                      : Icons.warning_amber_rounded,
                  color: ok ? Colors.green : Colors.orange,
                  size: 40,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                ok ? 'Câble Conforme ✓' : 'Défauts Relevés',
                style: GoogleFonts.inter(
                    fontSize: 18, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                ok
                    ? 'Aucun défaut détecté sur le câble ${widget.cableReference ?? ''}.'
                    : '${defauts.length} défaut(s) sur le câble ${widget.cableReference ?? ''}.',
                style: GoogleFonts.inter(
                    fontSize: 13, color: AppTheme.textGrey, height: 1.5),
                textAlign: TextAlign.center,
              ),
              // Liste des défauts NOK
              if (defauts.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  constraints: const BoxConstraints(maxHeight: 140),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: defauts.length,
                    separatorBuilder: (_, __) => const Divider(height: 8),
                    itemBuilder: (_, i) => Row(children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Center(
                          child: Text(defauts[i].code,
                              style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(defauts[i].label,
                              style: GoogleFonts.inter(fontSize: 11))),
                    ]),
                  ),
                ),
              ],
              const SizedBox(height: 14),
              if (widget.orderId != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.green.shade100),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.cloud_done_rounded,
                        size: 15, color: Colors.green.shade700),
                    const SizedBox(width: 7),
                    Text('Enregistré dans Firestore',
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.green.shade700)),
                  ]),
                ),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context, {
                        'status': status,
                        'cableReference': widget.cableReference,
                        'anomaliesCount': _nokCount,
                      });
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Fermer',
                        style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600)),
                  ),
                ),
                if (ok) ...[
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.pop(context, {
                          'status': status,
                          'cableReference': widget.cableReference,
                          'anomaliesCount': _nokCount,
                        });
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: const Text('Rapport généré !'),
                          backgroundColor: Colors.green,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2E7D32),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Rapport',
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
