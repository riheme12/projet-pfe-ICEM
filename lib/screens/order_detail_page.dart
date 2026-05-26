import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/models/cable.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/pdf_export_service.dart';
import 'package:projeticem/screens/inspection_page.dart';
import 'package:projeticem/screens/electrical_checklist_page.dart';
import 'package:projeticem/screens/qr_scanner_page.dart';

/// Page details d'un ordre de fabrication -- Design professionnel unifie
class OrderDetailPage extends StatefulWidget {
  final ManufacturingOrder order;
  const OrderDetailPage({super.key, required this.order});
  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  final OrdersService _ordersService = OrdersService();
  List<Cable> _cables = [];
  bool _isLoading = true;
  bool _electricalCheckDone = false;
  int _electricalCableCount = 0;
  String? _electricalCheckStatus;
  String _cableFilter = 'Tous';

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    final results = await Future.wait([
      _ordersService.getOrderCables(widget.order.numeroOF),
      _ordersService.getElectricalChecklistForOrder(widget.order.id),
      _ordersService.getElectricalChecklistCableCount(widget.order.id),
    ]);
    if (!mounted) return;
    setState(() {
      _cables = results[0] as List<Cable>;
      final elec = results[1];
      _electricalCableCount = results[2] as int;
      // TERMINE seulement quand le nombre de cables controles >= quantite OF
      _electricalCheckDone = _electricalCableCount >= widget.order.qta && widget.order.qta > 0;
      _electricalCheckStatus = (elec as dynamic)?.status;
      _isLoading = false;
    });
  }

  String _normalizeStatus(String status) {
    final s = status.trim().toLowerCase();
    if (s == 'conforme' || s.contains('corrig') || s == 'ok') {
      return 'Conforme';
    } else if (s == 'non conforme' || s.contains('nc') || s == 'rejeté' || s == 'rejete') {
      return 'Non conforme';
    } else {
      return 'En attente';
    }
  }

  List<Cable> get _filteredCables {
    if (_cableFilter == 'Tous') return _cables;
    return _cables.where((c) => _normalizeStatus(c.status) == _cableFilter).toList();
  }

  Map<String, dynamic> get _dynamicStats {
    final list = _cables;
    int conform = list.where((c) => _normalizeStatus(c.status) == 'Conforme').length;
    int nonConform = list.where((c) => _normalizeStatus(c.status) == 'Non conforme').length;
    int total = list.length;
    double rate = total > 0 ? (conform / total) * 100 : 0.0;
    return {'conform': conform, 'nonConform': nonConform, 'total': total, 'rate': rate};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue))
          : CustomScrollView(slivers: [
              SliverAppBar(
                expandedHeight: 210,
                pinned: true,
                backgroundColor: const Color(0xFF0F172A),
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                actions: [
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.refresh_rounded, color: Colors.white, size: 16),
                    ),
                    onPressed: _loadData,
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(background: _buildHeaderHero()),
              ),
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Column(children: [
                  _buildStatsSection(),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Actions de controle'),
                  const SizedBox(height: 12),
                  _buildElectricalCard(),
                  const SizedBox(height: 12),
                  _buildVisualInspectionCard(),
                  const SizedBox(height: 28),
                  _buildCablesListHeader(),
                  const SizedBox(height: 8),
                  _buildCablesList(),
                  const SizedBox(height: 100),
                ]),
              )),
            ]),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  // -- Section title helper --
  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 18,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF6366F1)]),
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF64748B),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  // -- Header Hero --
  Widget _buildHeaderHero() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF312E81), Color(0xFF6366F1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Row(children: [
              StatusBadge(status: widget.order.status),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.08)),
                ),
                child: Text(
                  widget.order.numeroOF,
                  style: GoogleFonts.inter(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
            ]),
            const SizedBox(height: 14),
            Text(
              widget.order.reference,
              style: GoogleFonts.inter(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                _heroItem(Icons.business_center_outlined, 'Client', widget.order.client),
                Container(width: 1, height: 28, color: Colors.white.withOpacity(0.1)),
                _heroItem(Icons.inventory_2_outlined, 'Quantite', '${widget.order.qta} pcs'),
                Container(width: 1, height: 28, color: Colors.white.withOpacity(0.1)),
                _heroItem(Icons.location_on_outlined, 'Ligne', widget.order.ligne ?? 'N/A'),
              ]),
            ),
          ],
        ),
      )),
    );
  }

  Widget _heroItem(IconData icon, String label, String value) => Expanded(
    child: Column(
      children: [
        Icon(icon, color: Colors.white38, size: 14),
        const SizedBox(height: 4),
        Text(label.toUpperCase(), style: GoogleFonts.inter(color: Colors.white38, fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 1)),
        const SizedBox(height: 2),
        Text(value, style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800), overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
      ],
    ),
  );

  // -- Stats --
  Widget _buildStatsSection() {
    final stats = _dynamicStats;
    return Row(children: [
      Expanded(child: _statCard('${stats['rate'].toStringAsFixed(0)}%', 'Conformite', Icons.trending_up_rounded, const Color(0xFF10B981), const Color(0xFF059669))),
      const SizedBox(width: 10),
      Expanded(child: _statCard('${stats['conform']}', 'Conformes', Icons.check_circle_outline_rounded, const Color(0xFF6366F1), const Color(0xFF8B5CF6))),
      const SizedBox(width: 10),
      Expanded(child: _statCard('${stats['nonConform']}', 'Rejetes', Icons.highlight_off_rounded, const Color(0xFFF43F5E), const Color(0xFFE11D48))),
    ]);
  }

  Widget _statCard(String value, String label, IconData icon, Color c1, Color c2) => Container(
    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: c1.withOpacity(0.1)),
      boxShadow: [BoxShadow(color: c1.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 6))],
    ),
    child: Column(children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [c1, c2]),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
      const SizedBox(height: 10),
      Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
      const SizedBox(height: 2),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B), fontWeight: FontWeight.w700)),
    ]),
  );

  // -- Electrical Checklist Card (full width) --
  Widget _buildElectricalCard() {
    final isDone = _electricalCheckDone;
    final statusColor = isDone ? const Color(0xFF10B981) : const Color(0xFF2563EB);
    final statusLabel = isDone ? 'TERMINE' : '$_electricalCableCount / ${widget.order.qta} cables';
    final statusBg = isDone ? const Color(0xFFECFDF5) : const Color(0xFFEFF6FF);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ElectricalChecklistPage(order: widget.order)),
        ).then((_) => _loadData()),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: statusColor.withOpacity(0.12)),
            boxShadow: [
              BoxShadow(color: statusColor.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4)),
            ],
          ),
          child: Row(
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDone
                        ? [const Color(0xFF10B981).withOpacity(0.15), const Color(0xFF10B981).withOpacity(0.05)]
                        : [const Color(0xFF2563EB).withOpacity(0.15), const Color(0xFF2563EB).withOpacity(0.05)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  Icons.electric_bolt_rounded,
                  color: statusColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Controle Electrique',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Verification des points electriques',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusLabel,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: statusColor,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Arrow
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // -- Visual Inspection Card (full width) --
  Widget _buildVisualInspectionCard() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: _startVisualInspectionFlow,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.12)),
            boxShadow: [
              BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4)),
            ],
          ),
          child: Row(
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [const Color(0xFF6366F1).withOpacity(0.15), const Color(0xFF6366F1).withOpacity(0.05)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.qr_code_scanner_rounded,
                  color: Color(0xFF6366F1),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Inspection Visuelle',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Scanner et controler les cables',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_cables.length} / ${widget.order.qta} CABLES INSPECTES',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF6366F1),
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Arrow
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // -- Cables List Header --
  Widget _buildCablesListHeader() => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Expanded(
        child: Row(
          children: [
            Container(
              width: 3,
              height: 18,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF334155)]),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'CÂBLES (${_filteredCables.length})',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                  letterSpacing: 1.2,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
      const SizedBox(width: 8),
      _buildCompactFilter(),
    ],
  );

  Widget _buildCompactFilter() => Container(
    height: 34,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFE2E8F0)),
      boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2)),
      ],
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      _filterItem('Tous'),
      _filterItem('Conforme'),
      _filterItem('Non conforme'),
    ]),
  );

  Widget _filterItem(String label) {
    final sel = _cableFilter == label;
    final displayLabel = label == 'Non conforme' ? 'NC' : (label == 'Conforme' ? 'OK' : label);
    return GestureDetector(
      onTap: () => setState(() => _cableFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: sel ? const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]) : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          displayLabel,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: sel ? Colors.white : const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }

  // -- Cables List --
  Widget _buildCablesList() => _filteredCables.isEmpty
      ? _buildEmptyState()
      : ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredCables.length,
          itemBuilder: (_, i) => _cableItem(_filteredCables[i]),
        );

  Widget _cableItem(Cable cable) {
    final status = _normalizeStatus(cable.status);
    final Color color;
    final IconData icon;
    
    if (status == 'Conforme') {
      color = const Color(0xFF10B981);
      icon = Icons.check_circle_rounded;
    } else if (status == 'Non conforme') {
      color = const Color(0xFFF43F5E);
      icon = Icons.warning_rounded;
    } else {
      color = const Color(0xFFF59E0B);
      icon = Icons.info_rounded;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(cable.code, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 14, color: const Color(0xFF0F172A))),
          const SizedBox(height: 2),
          Text(cable.technicianName ?? 'Controleur', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            status.toUpperCase(),
            style: GoogleFonts.inter(color: color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
          ),
        ),
      ]),
    );
  }

  Widget _buildEmptyState() => Padding(
    padding: const EdgeInsets.all(40),
    child: Column(children: [
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF2563EB).withOpacity(0.06),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.inventory_2_outlined, size: 40, color: Color(0xFF2563EB)),
      ),
      const SizedBox(height: 12),
      Text('Aucun cable trouve', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      Text('Scannez un cable pour commencer', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 11)),
    ]),
  );

  // -- Bottom Actions (3 clear buttons) --
  Widget _buildBottomActions() => Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: const Color(0xFFE2E8F0).withOpacity(0.6))),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, -4))],
    ),
    child: Row(children: [
      // PDF button
      Flexible(
        child: _bottomIconButton(
          icon: Icons.picture_as_pdf_rounded,
          label: 'PDF',
          color: const Color(0xFF64748B),
          onTap: () => PdfExportService.exportOrderReport(widget.order),
        ),
      ),
      const SizedBox(width: 8),
      // Electrical checklist button
      Flexible(
        child: _bottomIconButton(
          icon: Icons.electric_bolt_rounded,
          label: 'Elec.',
          color: _electricalCheckDone ? const Color(0xFF10B981) : const Color(0xFF2563EB),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => ElectricalChecklistPage(order: widget.order)),
          ).then((_) => _loadData()),
        ),
      ),
      const SizedBox(width: 8),
      // Main scan button
      Expanded(child: Container(
        height: 50,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)]),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.25), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: _startVisualInspectionFlow,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.qr_code_scanner_rounded, size: 18, color: Colors.white),
              const SizedBox(width: 10),
              Text(
                'SCANNER CABLE',
                style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1),
              ),
            ]),
          ),
        ),
      )),
    ]),
  );

  Widget _bottomIconButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      height: 50,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF64748B),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // -- Visual Inspection Flow --
  Future<void> _startVisualInspectionFlow() async {
    final scannedCode = await Navigator.push<String>(
      context, MaterialPageRoute(builder: (_) => QrScannerPage(orderId: widget.order.id, orderReference: widget.order.reference)),
    );
    if (scannedCode == null || !mounted) return;

    // 1. Verifier si la checklist electrique a ete faite pour CE cable precis
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    final isElecChecked = await _ordersService.isCableElectricallyChecked(widget.order.id, scannedCode);
    if (!mounted) return;
    Navigator.pop(context);

    if (!isElecChecked) {
      _showErrorDialog('Checklist Electrique Manquante', 'Vous devez effectuer et valider la checklist electrique pour le cable "$scannedCode" avant de pouvoir passer a l\'inspection visuelle.');
      return;
    }

    // 2. Verifier si l'inspection visuelle a DEJA ete faite
    final isVisuallyChecked = _cables.any((c) => c.code == scannedCode);
    if (isVisuallyChecked) {
      final confirm = await _showConfirmDialog('Inspection deja existante', 'L\'inspection visuelle a deja ete realisee pour le cable "$scannedCode".\n\nVoulez-vous vraiment refaire l\'inspection ? (Les anciennes donnees visuelles seront ecrasees)');
      if (confirm != true) return;
    }

    // 3. Lancer l'inspection visuelle (IA/Manuel)
    final result = await Navigator.push<Map<String, dynamic>>(
      context, MaterialPageRoute(builder: (_) => InspectionPage(orderId: widget.order.numeroOF, orderReference: widget.order.reference, cableReference: scannedCode)),
    );
    if (result != null && mounted) await _loadData();
  }

  void _showErrorDialog(String title, String message) {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFFFEE2E2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 16))),
      ]),
      content: Text(message, style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B), height: 1.5)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      actions: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text('Compris', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
          ),
        ),
      ],
    ));
  }

  Future<bool?> _showConfirmDialog(String title, String message) {
    return showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 16))),
      ]),
      content: Text(message, style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B), height: 1.5)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      actions: [
        Row(children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => Navigator.pop(ctx, false),
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Text('Annuler', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: const Color(0xFF64748B))),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text('Oui, refaire', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ),
        ]),
      ],
    ));
  }
}
