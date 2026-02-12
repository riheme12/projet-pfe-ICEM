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
    setState(() => _isLoading = true);
    final cables = await _ordersService.getOrderCables(widget.order.id);
    setState(() {
      _cables = cables;
      _isLoading = false;
    });
  }

  List<Cable> get _filteredCables {
    if (_cableFilter == 'Tous') return _cables;
    return _cables.where((cable) => cable.status == _cableFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.order.reference),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Partage - À venir')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Informations générales
            _buildGeneralInfo(),
            const SizedBox(height: 16),

            // Statistiques de l'ordre
            _buildOrderStats(),
            const SizedBox(height: 24),

            // Liste des câbles
            _buildCablesSection(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActions(),
    );
  }

  /// Informations générales
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
            widget.order.cableType,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.calendar_today, 'Production',
              '${widget.order.productionDate.day}/${widget.order.productionDate.month}/${widget.order.productionDate.year}'),
          const SizedBox(height: 4),
          _buildInfoRow(Icons.inventory, 'Quantité', '${widget.order.quantity} unités'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
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

  /// Statistiques de l'ordre
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
                  '${widget.order.inspectedCount}/${widget.order.quantity}',
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

  /// Section câbles
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
                'Câbles (${_filteredCables.length})',
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
        title: Text(cable.reference),
        subtitle: Text(cable.code),
        trailing: StatusBadge(status: cable.status, isSmall: true),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Détails du câble ${cable.reference}')),
          );
        },
      ),
    );
  }

  /// Actions en bas
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
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const InspectionPage()),
                  );
                },
                icon: const Icon(Icons.camera_alt),
                label: const Text('Démarrer inspection'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
