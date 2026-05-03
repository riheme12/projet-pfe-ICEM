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


/// Page détails d'un ordre de fabrication
///
/// Workflow de contrôle :
///  1. Bouton "Contrôle Électrique" → ElectricalChecklistPage (premier contrôleur)
///  2. Bouton "Contrôle Visuel"     → QR Scan → Inspection → ChecklistPage visuelle (second contrôleur)
///     ⚠️ Le contrôle visuel est BLOQUÉ si le contrôle électrique n'a pas été fait.
class OrderDetailPage extends StatefulWidget {
  final ManufacturingOrder order;

  const OrderDetailPage({
    super.key,
    required this.order,
  });

  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  final OrdersService _ordersService = OrdersService();
  List<Cable> _cables = [];
  bool _isLoading = true;
  bool _isCheckingElectrical = false;
  bool _electricalCheckDone = false;
  String? _electricalCheckStatus;
  String _cableFilter = 'Tous';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final cables = await _ordersService.getOrderCables(widget.order.numeroOF);
    final elecChecklist =
        await _ordersService.getElectricalChecklistForOrder(widget.order.id);

    if (!mounted) return;
    setState(() {
      _cables = cables;
      _electricalCheckDone = elecChecklist != null;
      _electricalCheckStatus = elecChecklist?.status;
      _isLoading = false;
    });
  }

  List<Cable> get _filteredCables {
    if (_cableFilter == 'Tous') return _cables;
    return _cables.where((cable) => cable.status == _cableFilter).toList();
  }

  /// Lance la checklist électrique (Contrôleur 1)
  Future<void> _startElectricalChecklist() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => ElectricalChecklistPage(order: widget.order),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _electricalCheckDone = true;
        _electricalCheckStatus = result['status'] as String?;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.electric_bolt_rounded,
                  color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(
                  'Contrôle électrique enregistré — ${result['status']}',
                  style: GoogleFonts.inter()),
            ],
          ),
          backgroundColor: const Color(0xFF0D47A1),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  /// Lance le flux visuel : QR Scan → Inspection IA → Checklist Visuelle (Contrôleur 2)
  /// ⚠️ BLOQUÉ si le contrôle électrique n'est pas fait
  Future<void> _startVisualInspectionFlow() async {
    // 1. Vérifier si le contrôle électrique est fait
    if (!mounted) return;

    // 2. Scanner le QR code du câble
    final scannedCode = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => QrScannerPage(
          orderId: widget.order.id,
          orderReference: widget.order.reference,
        ),
      ),
    );

    if (scannedCode == null || !mounted) return;

    // 3. Lancer l'inspection IA
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionPage(
          orderId: widget.order.numeroOF,
          orderReference: widget.order.reference,
          cableReference: scannedCode,
        ),
      ),
    );

    // 4. Si terminé, recharger la liste des câbles
    if (result != null && mounted) {
      await _loadData();

      final status = result['status'] as String? ?? 'En attente';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                  status == 'Conforme'
                      ? Icons.check_circle_rounded
                      : Icons.warning_rounded,
                  color: Colors.white,
                  size: 18),
              const SizedBox(width: 8),
              Text('Câble $scannedCode — $status',
                  style: GoogleFonts.inter()),
            ],
          ),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          backgroundColor:
              status == 'Conforme' ? AppTheme.successGreen : AppTheme.warningAmber,
        ),
      );
    }
  }

  /// Dialogue de blocage : contrôle électrique obligatoire
  void _showElectricalRequiredDialog() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_rounded,
                    color: Colors.orange, size: 36),
              ),
              const SizedBox(height: 20),
              Text(
                'Contrôle Électrique Requis',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                'Le contrôle électrique doit être effectué par le contrôleur électrique avant de pouvoir lancer le contrôle visuel.',
                style: GoogleFonts.inter(
                    fontSize: 13, color: AppTheme.textGrey, height: 1.5),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D47A1).withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: const Color(0xFF0D47A1).withValues(alpha: 0.15)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.electric_bolt_rounded,
                        color: Color(0xFF0D47A1), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Demandez au contrôleur électrique de complèter la checklist électrique d\'abord.',
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFF0D47A1),
                            height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text('Fermer',
                          style:
                              GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _startElectricalChecklist();
                      },
                      icon: const Icon(Icons.electric_bolt_rounded, size: 16),
                      label: Text('Faire l\'électrique',
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700, fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0D47A1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.order.reference),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildGeneralInfo(),
            const SizedBox(height: 16),
            _buildControlStatusBanner(),
            const SizedBox(height: 16),
            _buildOrderStats(),
            const SizedBox(height: 24),
            _buildCablesSection(),
            const SizedBox(height: 20),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  /// Bannière de statut des contrôles (électrique + visuel)
  Widget _buildControlStatusBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
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
            Text(
              'Statut des contrôles',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppTheme.textGrey,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildControlStatusTile(
                    icon: Icons.electric_bolt_rounded,
                    label: 'Contrôle Électrique',
                    isDone: _electricalCheckDone,
                    status: _electricalCheckStatus,
                    color: const Color(0xFF0D47A1),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildControlStatusTile(
                    icon: Icons.visibility_rounded,
                    label: 'Contrôle Visuel',
                    isDone: _cables.isNotEmpty,
                    status: _cables.isNotEmpty ? '${_cables.length} câbles' : null,
                    color: const Color(0xFF2E7D32),
                    isLocked: false,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlStatusTile({
    required IconData icon,
    required String label,
    required bool isDone,
    String? status,
    required Color color,
    bool isLocked = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isLocked
            ? Colors.grey.shade100
            : isDone
                ? color.withValues(alpha: 0.06)
                : Colors.orange.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLocked
              ? Colors.grey.shade300
              : isDone
                  ? color.withValues(alpha: 0.3)
                  : Colors.orange.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isLocked ? Icons.lock_rounded : icon,
                size: 16,
                color: isLocked
                    ? Colors.grey
                    : isDone
                        ? color
                        : Colors.orange,
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isLocked
                      ? Colors.grey.withValues(alpha: 0.15)
                      : isDone
                          ? color.withValues(alpha: 0.15)
                          : Colors.orange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isLocked ? 'Bloqué' : isDone ? 'Fait ✓' : 'En attente',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isLocked
                        ? Colors.grey
                        : isDone
                            ? color
                            : Colors.orange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isLocked ? Colors.grey : AppTheme.textDark,
            ),
          ),
          if (status != null) ...[
            const SizedBox(height: 2),
            Text(
              status,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: isLocked ? Colors.grey : color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGeneralInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryBlue,
            AppTheme.primaryBlue.withValues(alpha: 0.8)
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StatusBadge(status: widget.order.status),
          const SizedBox(height: 16),
          Text(
            'Réf: ${widget.order.reference}',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 20,
            runSpacing: 10,
            children: [
              _buildInfoRow(Icons.numbers, 'N° OF', widget.order.numeroOF),
              _buildInfoRow(Icons.business_center, 'Client', widget.order.client),
              _buildInfoRow(Icons.assignment, 'Gi pros', widget.order.gipros),
              _buildInfoRow(Icons.receipt_long, 'N° Commande', widget.order.numComd),
              _buildInfoRow(Icons.precision_manufacturing, 'Ligne', widget.order.ligne ?? 'N/A'),
              _buildInfoRow(Icons.calendar_today, 'Livraison',
                  '${widget.order.dateLiv.day}/${widget.order.dateLiv.month}/${widget.order.dateLiv.year}'),
              _buildInfoRow(Icons.inventory, 'Quantité', '${widget.order.qta} unités'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.white70),
        const SizedBox(width: 8),
        Text('$label: ',
            style: const TextStyle(color: Colors.white70, fontSize: 14)),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildOrderStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Statistiques', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Progression',
                  '${widget.order.inspectedCount}/${widget.order.qta}',
                  '${widget.order.progressPercentage.toStringAsFixed(0)}%',
                  AppTheme.primaryBlue),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                    'Conformité',
                    '${widget.order.conformCount} OK',
                    '${widget.order.conformityRate.toStringAsFixed(1)}%',
                    AppTheme.successGreen),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Conformes',
                    widget.order.conformCount.toString(), 'câbles',
                    AppTheme.successGreen),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard('Non conformes',
                    widget.order.nonConformCount.toString(), 'câbles',
                    AppTheme.errorRed),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, String subtitle, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.textGrey)),
            const SizedBox(height: 8),
            Text(value,
                style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: color)),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildCablesSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Câbles inspectés (${_filteredCables.length})',
                  style: Theme.of(context).textTheme.titleLarge),
              PopupMenuButton<String>(
                initialValue: _cableFilter,
                onSelected: (value) =>
                    setState(() => _cableFilter = value),
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'Tous', child: Text('Tous')),
                  const PopupMenuItem(
                      value: 'Conforme', child: Text('Conformes')),
                  const PopupMenuItem(
                      value: 'Non conforme', child: Text('Non conformes')),
                  const PopupMenuItem(
                      value: 'En attente', child: Text('En attente')),
                ],
                child: Row(
                  children: [
                    Text(_cableFilter,
                        style: const TextStyle(fontSize: 14)),
                    const Icon(Icons.arrow_drop_down),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _cables.isEmpty
                  ? _buildEmptyCablesState()
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _filteredCables.length,
                      itemBuilder: (context, index) {
                        final cable = _filteredCables[index];
                        return _buildCableItem(cable);
                      },
                    ),
        ],
      ),
    );
  }

  Widget _buildEmptyCablesState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.qr_code_scanner_rounded,
                size: 56, color: AppTheme.textLight),
            const SizedBox(height: 12),
            Text('Aucun câble inspecté',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textGrey)),
            const SizedBox(height: 4),
            Text(
              _electricalCheckDone
                  ? 'Scannez un câble pour commencer le contrôle visuel'
                  : 'Effectuez d\'abord le contrôle électrique',
              style:
                  TextStyle(fontSize: 13, color: AppTheme.textLight),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCableItem(Cable cable) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: cable.isConform
              ? AppTheme.successGreen.withValues(alpha: 0.1)
              : cable.status == 'En attente'
                  ? AppTheme.textLight.withValues(alpha: 0.1)
                  : AppTheme.errorRed.withValues(alpha: 0.1),
          child: Icon(
            cable.isConform
                ? Icons.check
                : cable.status == 'En attente'
                    ? Icons.pending
                    : Icons.warning,
            color: cable.isConform
                ? AppTheme.successGreen
                : cable.status == 'En attente'
                    ? AppTheme.textGrey
                    : AppTheme.errorRed,
          ),
        ),
        title: Text(cable.code, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          cable.inspectionDate != null
              ? 'Inspecté le ${cable.inspectionDate!.day}/${cable.inspectionDate!.month}/${cable.inspectionDate!.year}'
              : 'En attente d\'inspection',
        ),
        trailing: StatusBadge(status: cable.status, isSmall: true),
      ),
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Ligne 1 : Export PDF
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () =>
                    PdfExportService.exportOrderReport(widget.order),
                icon: const Icon(Icons.description_rounded),
                label: Text('Exporter le Rapport PDF',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Ligne 2 : Boutons contrôle côte à côte
            Row(
              children: [
                // Bouton Contrôle Électrique
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _electricalCheckDone
                        ? null
                        : _startElectricalChecklist,
                    icon: Icon(
                      _electricalCheckDone
                          ? Icons.check_circle_rounded
                          : Icons.electric_bolt_rounded,
                      size: 18,
                    ),
                    label: Text(
                      _electricalCheckDone ? 'Élec. ✓' : 'Contrôle Élec.',
                      style: GoogleFonts.inter(
                          fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _electricalCheckDone
                          ? Colors.green.shade600
                          : const Color(0xFF0D47A1),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.green.shade600,
                      disabledForegroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Bouton Contrôle Visuel
                Expanded(
                  flex: 2,
                  child: Stack(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _startVisualInspectionFlow,
                          icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                          label: Text(
                            'Scanner & Contrôle Visuel',
                            style: GoogleFonts.inter(
                                fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2E7D32),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}
