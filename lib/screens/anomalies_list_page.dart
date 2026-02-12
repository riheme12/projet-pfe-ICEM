import 'package:flutter/material.dart';
import 'package:projeticem/models/anomaly.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/screens/anomaly_detail_page.dart';

/// Page qui liste toutes les anomalies détectées
class AnomaliesListPage extends StatefulWidget {
  const AnomaliesListPage({super.key});

  @override
  State<AnomaliesListPage> createState() => _AnomaliesListPageState();
}

class _AnomaliesListPageState extends State<AnomaliesListPage> {
  final ReportsService _reportsService = ReportsService();
  List<Anomaly> _anomalies = [];
  bool _isLoading = true;
  String _selectedSeverity = 'Tous';

  @override
  void initState() {
    super.initState();
    _loadAnomalies();
  }

  Future<void> _loadAnomalies() async {
    setState(() => _isLoading = true);
    final anomalies = await _reportsService.getRecentAnomalies(limit: 50);
    setState(() {
      _anomalies = anomalies;
      _isLoading = false;
    });
  }

  List<Anomaly> get _filteredAnomalies {
    if (_selectedSeverity == 'Tous') return _anomalies;
    return _anomalies.where((a) => a.severity == _selectedSeverity).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestion des Anomalies'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnomalies,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterSection(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredAnomalies.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredAnomalies.length,
                        itemBuilder: (context, index) {
                          final anomaly = _filteredAnomalies[index];
                          return _buildAnomalyCard(anomaly);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    final severities = ['Tous', 'Mineur', 'Majeur', 'Critique'];
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: severities.length,
        itemBuilder: (context, index) {
          final severity = severities[index];
          final isSelected = _selectedSeverity == severity;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(severity),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() => _selectedSeverity = severity);
                }
              },
              selectedColor: AppTheme.primaryBlue,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAnomalyCard(Anomaly anomaly) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AnomalyDetailPage(anomaly: anomaly),
            ),
          ).then((_) => _loadAnomalies());
        },
        leading: Icon(
          Icons.report_problem,
          color: _getSeverityColor(anomaly.severity),
        ),
        title: Text(anomaly.type),
        subtitle: Text('Câble: ${anomaly.cableId} • ${anomaly.location ?? "Zone inconnue"}'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            StatusBadge(status: anomaly.severity, isSmall: true),
            const SizedBox(height: 4),
            Text(
              '${(anomaly.confidence * 100).toStringAsFixed(0)}% fiable',
              style: const TextStyle(fontSize: 10, color: AppTheme.textGrey),
            ),
          ],
        ),
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity) {
      case 'Critique': return AppTheme.errorRed;
      case 'Majeur': return AppTheme.secondaryOrange;
      case 'Mineur': return AppTheme.warningAmber;
      default: return AppTheme.textGrey;
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline, size: 64, color: AppTheme.successGreen),
          const SizedBox(height: 16),
          const Text('Aucune anomalie à traiter !', style: TextStyle(fontSize: 18, color: AppTheme.textGrey)),
        ],
      ),
    );
  }
}
