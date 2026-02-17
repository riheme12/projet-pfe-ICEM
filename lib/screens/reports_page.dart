import 'package:flutter/material.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/models/report.dart';
import 'package:projeticem/widgets/stats_card.dart';
import 'package:projeticem/widgets/chart_card.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/pdf_export_service.dart';

import '../models/report.dart';
import '../services/reports_service.dart';

/// Page rapports et statistiques
/// 
/// Affiche les statistiques globales, graphiques et liste des rapports
class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  final ReportsService _reportsService = ReportsService();
  GlobalStats? _globalStats;
  List<Report> _recentReports = [];
  Map<String, int> _anomaliesByType = {};
  bool _isLoading = true;
  String _selectedPeriod = 'Ce mois';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final stats = await _reportsService.getGlobalStats();
    final reports = await _reportsService.getRecentReports(limit: 10);
    final anomalies = await _reportsService.getAnomaliesByType();
    
    setState(() {
      _globalStats = stats;
      _recentReports = reports;
      _anomaliesByType = anomalies;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rapports & Statistiques'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Export - À venir')),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sélecteur de période
                    _buildPeriodSelector(),
                    const SizedBox(height: 24),

                    // Statistiques globales
                    _buildGlobalStats(),
                    const SizedBox(height: 24),

                    // Graphiques
                    _buildChartsSection(),
                    const SizedBox(height: 24),

                    // Liste des rapports récents
                    _buildRecentReports(),
                  ],
                ),
              ),
            ),
    );
  }

  /// Sélecteur de période
  Widget _buildPeriodSelector() {
    final periods = ['Aujourd\'hui', 'Cette semaine', 'Ce mois'];
    
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: periods.length,
        itemBuilder: (context, index) {
          final period = periods[index];
          final isSelected = _selectedPeriod == period;
          
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(period),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() => _selectedPeriod = period);
                  _loadData();
                }
              },
              backgroundColor: AppTheme.backgroundLight,
              selectedColor: AppTheme.primaryBlue,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textDark,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          );
        },
      ),
    );
  }

  /// Statistiques globales
  Widget _buildGlobalStats() {
    if (_globalStats == null) return const SizedBox();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Vue d\'ensemble',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.2,
          children: [
            StatsCard(
              value: _globalStats!.totalInspections.toString(),
              label: 'Inspections',
              icon: Icons.assignment_turned_in,
              color: AppTheme.primaryBlue,
            ),
            StatsCard(
              value: '${_globalStats!.conformityRate.toStringAsFixed(1)}%',
              label: 'Conformité',
              icon: Icons.check_circle,
              color: AppTheme.successGreen,
            ),
            StatsCard(
              value: _globalStats!.totalAnomalies.toString(),
              label: 'Anomalies',
              icon: Icons.warning,
              color: AppTheme.warningAmber,
            ),
            StatsCard(
              value: _globalStats!.reportsGenerated.toString(),
              label: 'Rapports',
              icon: Icons.description,
              color: AppTheme.secondaryOrange,
            ),
          ],
        ),
      ],
    );
  }

  /// Section graphiques
  Widget _buildChartsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Analyses',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        
        // Graphique 1 : Tendance de conformité
        ChartCard(
          title: 'Évolution de la conformité',
          subtitle: '7 derniers jours',
          child: const ChartPlaceholder(
            message: 'Graphique de tendance\n(À venir)',
            icon: Icons.show_chart,
          ),
        ),
        const SizedBox(height: 16),
        
        // Graphique 2 : Répartition des anomalies
        ChartCard(
          title: 'Répartition des anomalies',
          subtitle: 'Par type',
          child: _buildAnomaliesChart(),
        ),
      ],
    );
  }

  /// Graphique simple des anomalies
  Widget _buildAnomaliesChart() {
    if (_anomaliesByType.isEmpty) {
      return const ChartPlaceholder(
        message: 'Aucune donnée',
        icon: Icons.pie_chart,
      );
    }

    final total = _anomaliesByType.values.reduce((a, b) => a + b);
    final colors = [
      AppTheme.errorRed,
      AppTheme.secondaryOrange,
      AppTheme.warningAmber,
      AppTheme.primaryBlue,
      AppTheme.successGreen,
    ];

    return ListView.builder(
      itemCount: _anomaliesByType.length,
      itemBuilder: (context, index) {
        final entry = _anomaliesByType.entries.elementAt(index);
        final percentage = (entry.value / total * 100).toStringAsFixed(1);
        final color = colors[index % colors.length];

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(entry.key),
                    ],
                  ),
                  Text(
                    '${entry.value} ($percentage%)',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: entry.value / total,
                  backgroundColor: AppTheme.dividerGrey,
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  minHeight: 8,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Liste des rapports récents
  Widget _buildRecentReports() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Rapports récents',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Voir tous - À venir')),
                );
              },
              child: const Text('Voir tous'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        if (_recentReports.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('Aucun rapport disponible'),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _recentReports.length,
            itemBuilder: (context, index) {
              final report = _recentReports[index];
              return _buildReportItem(report);
            },
          ),
      ],
    );
  }

  /// Item de rapport
  Widget _buildReportItem(Report report) {
    final date = report.generatedAt;
    final dateStr = '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: report.isConform
              ? AppTheme.successGreen.withValues(alpha: 0.1)
              : AppTheme.errorRed.withValues(alpha: 0.1),
          child: Icon(
            report.isConform ? Icons.check : Icons.warning,
            color: report.isConform ? AppTheme.successGreen : AppTheme.errorRed,
          ),
        ),
        title: Text('Câble ${report.cableId}'),
        subtitle: Text(dateStr),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            StatusBadge(status: report.conformityStatus, isSmall: true),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.picture_as_pdf, size: 20),
              onPressed: () => PdfExportService.exportInspectionReport(report),
            ),
          ],
        ),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Détails rapport ${report.id}')),
          );
        },
      ),
    );
  }
}
