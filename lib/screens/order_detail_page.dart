import 'package:flutter/material.dart';
import 'package:projeticem/models/manufacturing_order.dart';
import 'package:projeticem/models/cable.dart';
import 'package:projeticem/services/orders_service.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/pdf_export_service.dart';
import 'package:projeticem/screens/inspection_page.dart';

/// Page détails d'un ordre de fabrication
/// 
/// Affiche toutes les informations d'un ordre et la liste de ses câbles
/// Le bouton "Démarrer inspection" lance le flux d'inspection
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
  String _cableFilter = 'Tous';

  @override
  void initState() {
    super.initState();
    _loadCables();
  }

  Future<void> _loadCables() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    final cables = await _ordersService.getOrderCables(widget.order.numeroOF);
    if (!mounted) return;
    setState(() {
      _cables = cables;
      _isLoading = false;
    });
  }

  List<Cable> get _filteredCables {
    if (_cableFilter == 'Tous') return _cables;
    return _cables.where((cable) => cable.status == _cableFilter).toList();
  }

  /// Lancer le flux d'inspection
  Future<void> _startInspectionFlow() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionPage(
          orderId: widget.order.numeroOF,
          orderReference: widget.order.reference,
        ),
      ),
    );

    if (result != null) {
      await _loadCables();
      if (!mounted) return;
      
      final status = result['status'] as String? ?? 'En attente';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Câble inspecté — Statut: $status'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          backgroundColor: status == 'Conforme' ? AppTheme.successGreen : AppTheme.warningAmber,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.order.reference),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadCables,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildGeneralInfo(),
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

  Widget _buildGeneralInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primaryBlue, AppTheme.primaryBlue.withValues(alpha: 0.8)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StatusBadge(status: widget.order.status),
          const SizedBox(height: 16),
          Text(
            'Réf: ${widget.order.reference}',
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
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
        Text(
          '$label: ',
          style: const TextStyle(color: Colors.white70, fontSize: 14),
        ),
        Text(
          value,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  Widget _buildOrderStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Statistiques',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Progression',
                  '${widget.order.inspectedCount}/${widget.order.qta}',
                  '${widget.order.progressPercentage.toStringAsFixed(0)}%',
                  AppTheme.primaryBlue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Conformité',
                  '${widget.order.conformCount} OK',
                  '${widget.order.conformityRate.toStringAsFixed(1)}%',
                  AppTheme.successGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Conformes',
                  widget.order.conformCount.toString(),
                  'câbles',
                  AppTheme.successGreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Non conformes',
                  widget.order.nonConformCount.toString(),
                  'câbles',
                  AppTheme.errorRed,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, String subtitle, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textGrey,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall,
            ),
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
              Text(
                'Câbles inspectés (${_filteredCables.length})',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              PopupMenuButton<String>(
                initialValue: _cableFilter,
                onSelected: (value) {
                  setState(() => _cableFilter = value);
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'Tous', child: Text('Tous')),
                  const PopupMenuItem(value: 'Conforme', child: Text('Conformes')),
                  const PopupMenuItem(value: 'Non conforme', child: Text('Non conformes')),
                  const PopupMenuItem(value: 'En attente', child: Text('En attente')),
                ],
                child: Row(
                  children: [
                    Text(_cableFilter, style: const TextStyle(fontSize: 14)),
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
            Icon(Icons.qr_code_scanner_rounded, size: 56, color: AppTheme.textLight),
            const SizedBox(height: 12),
            Text(
              'Aucun câble inspecté',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textGrey),
            ),
            const SizedBox(height: 4),
            Text(
              'Scannez un câble pour commencer l\'inspection',
              style: TextStyle(fontSize: 13, color: AppTheme.textLight),
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
      padding: const EdgeInsets.all(16),
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
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => PdfExportService.exportOrderReport(widget.order),
                icon: const Icon(Icons.description),
                label: const Text('Rapport'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: _startInspectionFlow,
                icon: const Icon(Icons.qr_code_scanner_rounded),
                label: const Text('Scanner & Inspecter'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
