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

/// Page détails d'un ordre de fabrication — Design Unifié
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
    ]);
    if (!mounted) return;
    setState(() {
      _cables = results[0] as List<Cable>;
      final elec = results[1];
      _electricalCheckDone = elec != null;
      _electricalCheckStatus = (elec as dynamic)?.status;
      _isLoading = false;
    });
  }

  List<Cable> get _filteredCables {
    if (_cableFilter == 'Tous') return _cables;
    return _cables.where((c) => c.status == _cableFilter).toList();
  }

  Map<String, dynamic> get _dynamicStats {
    final list = _cableFilter == 'Tous' ? _cables : _filteredCables;
    int conform = list.where((c) => c.isConform || c.status.contains('Corrigé')).length;
    int nonConform = list.where((c) => c.status == 'Non conforme').length;
    int total = list.length;
    double rate = total > 0 ? (conform / total) * 100 : 0.0;
    return {'conform': conform, 'nonConform': nonConform, 'total': total, 'rate': rate};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accentBlue))
          : CustomScrollView(slivers: [
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                backgroundColor: AppTheme.primaryNavy,
                actions: [
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
                    ),
                    onPressed: _loadData,
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(background: _buildHeaderHero()),
              ),
              SliverToBoxAdapter(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  _buildStatsSection(),
                  const SizedBox(height: 16),
                  _buildActionGrid(),
                  const SizedBox(height: 20),
                  _buildCablesListHeader(),
                  _buildCablesList(),
                  const SizedBox(height: 100),
                ]),
              )),
            ]),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  Widget _buildHeaderHero() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF312E81), Color(0xFF6366F1)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      child: SafeArea(child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
          Row(children: [
            StatusBadge(status: widget.order.status),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
              child: Text(widget.order.numeroOF, style: GoogleFonts.inter(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ]),
          const SizedBox(height: 12),
          Text(widget.order.reference, style: GoogleFonts.inter(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white12)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              _heroItem(Icons.business_center, 'Client', widget.order.client),
              _heroItem(Icons.inventory_2, 'Qta', '${widget.order.qta} pcs'),
              _heroItem(Icons.location_on, 'Ligne', widget.order.ligne ?? 'N/A'),
            ]),
          ),
        ]),
      )),
    );
  }

  Widget _heroItem(IconData icon, String label, String value) => Expanded(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.w700)),
      const SizedBox(height: 2),
      Text(value, style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800), overflow: TextOverflow.ellipsis),
    ]),
  );

  Widget _buildStatsSection() {
    final stats = _dynamicStats;
    return Row(children: [
      Expanded(child: _statCard('${stats['rate'].toStringAsFixed(0)}%', 'Conformité', Icons.trending_up_rounded, const Color(0xFF10B981), const Color(0xFF059669))),
      const SizedBox(width: 10),
      Expanded(child: _statCard('${stats['conform']}', 'Conformes', Icons.check_circle_rounded, const Color(0xFF6366F1), const Color(0xFF8B5CF6))),
      const SizedBox(width: 10),
      Expanded(child: _statCard('${stats['nonConform']}', 'Rejetés', Icons.cancel_rounded, const Color(0xFFF43F5E), const Color(0xFFE11D48))),
    ]);
  }

  Widget _statCard(String value, String label, IconData icon, Color c1, Color c2) => Container(
    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: c1.withOpacity(0.12)),
      boxShadow: [BoxShadow(color: c1.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
    ),
    child: Column(children: [
      Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(gradient: LinearGradient(colors: [c1, c2]), borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: Colors.white, size: 14),
      ),
      const SizedBox(height: 8),
      Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
      Text(label, style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textGrey, fontWeight: FontWeight.w700)),
    ]),
  );

  Widget _buildActionGrid() => Row(children: [
    Expanded(child: _actionCard(
      'Contrôle Électrique',
      _electricalCheckDone ? 'TERMINÉ' : 'À RÉALISER',
      Icons.electric_bolt_rounded,
      _electricalCheckDone ? const Color(0xFF10B981) : const Color(0xFF0EA5E9),
      _electricalCheckDone ? const Color(0xFF059669) : const Color(0xFF2563EB),
      () => Navigator.push(context, MaterialPageRoute(builder: (_) => ElectricalChecklistPage(order: widget.order))).then((_) => _loadData()),
    )),
    const SizedBox(width: 10),
    Expanded(child: _actionCard(
      'Scan & Inspection',
      '${_cables.length} câbles',
      Icons.qr_code_scanner_rounded,
      const Color(0xFF6366F1),
      const Color(0xFF8B5CF6),
      _startVisualInspectionFlow,
    )),
  ]);

  Widget _actionCard(String title, String sub, IconData icon, Color c1, Color c2, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c1.withOpacity(0.15)),
        boxShadow: [BoxShadow(color: c1.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(gradient: LinearGradient(colors: [c1.withOpacity(0.15), c1.withOpacity(0.05)]), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: c1, size: 20),
        ),
        const SizedBox(height: 10),
        Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primaryNavy)),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: c1.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Text(sub, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: c1)),
        ),
      ]),
    ),
  );

  Widget _buildCablesListHeader() => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text('Câbles Inspectés', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900, color: AppTheme.primaryNavy)),
      _buildCompactFilter(),
    ]),
  );

  Widget _buildCompactFilter() => Container(
    height: 32,
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppTheme.borderGris)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      _filterItem('Tous'),
      _filterItem('Conforme'),
      _filterItem('Non conforme'),
    ]),
  );

  Widget _filterItem(String label) {
    final sel = _cableFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _cableFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: sel ? const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]) : null,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label == 'Non conforme' ? 'NC' : label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: sel ? Colors.white : AppTheme.textGrey)),
      ),
    );
  }

  Widget _buildCablesList() => _filteredCables.isEmpty
      ? _buildEmptyState()
      : ListView.builder(
          shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredCables.length,
          itemBuilder: (_, i) => _cableItem(_filteredCables[i]),
        );

  Widget _cableItem(Cable cable) {
    final isOk = cable.isConform || cable.status.contains('Corrigé');
    final color = isOk ? const Color(0xFF10B981) : const Color(0xFFF43F5E);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.12)),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(isOk ? Icons.check_circle_rounded : Icons.warning_rounded, color: color, size: 18),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(cable.code, style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.primaryNavy)),
          Text(cable.technicianName ?? 'Contrôleur', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey, fontWeight: FontWeight.w600)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: Text(isOk ? 'OK' : 'NC', style: GoogleFonts.inter(color: color, fontSize: 10, fontWeight: FontWeight.w900)),
        ),
      ]),
    );
  }

  Widget _buildEmptyState() => Padding(
    padding: const EdgeInsets.all(40),
    child: Column(children: [
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: AppTheme.accentBlue.withOpacity(0.08), shape: BoxShape.circle),
        child: const Icon(Icons.inventory_2_outlined, size: 40, color: AppTheme.accentBlue),
      ),
      const SizedBox(height: 8),
      Text('Aucun câble trouvé', style: GoogleFonts.inter(color: AppTheme.textGrey, fontSize: 12)),
    ]),
  );

  Widget _buildBottomActions() => Container(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
    decoration: BoxDecoration(
      color: Colors.white,
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, -2))],
    ),
    child: Row(children: [
      Container(
        height: 50, width: 50,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderGris),
        ),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => PdfExportService.exportOrderReport(widget.order),
            child: const Icon(Icons.picture_as_pdf_rounded, size: 20, color: AppTheme.primaryNavy),
          ),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(child: Container(
        height: 50,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)]),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: AppTheme.primaryNavy.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: _startVisualInspectionFlow,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.qr_code_scanner_rounded, size: 20, color: Colors.white),
              const SizedBox(width: 10),
              Text('SCANNER CÂBLE', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
            ]),
          ),
        ),
      )),
    ]),
  );

  Future<void> _startVisualInspectionFlow() async {
    final scannedCode = await Navigator.push<String>(
      context, MaterialPageRoute(builder: (_) => QrScannerPage(orderId: widget.order.id, orderReference: widget.order.reference)),
    );
    if (scannedCode == null || !mounted) return;
    final result = await Navigator.push<Map<String, dynamic>>(
      context, MaterialPageRoute(builder: (_) => InspectionPage(orderId: widget.order.numeroOF, orderReference: widget.order.reference, cableReference: scannedCode)),
    );
    if (result != null && mounted) await _loadData();
  }
}
