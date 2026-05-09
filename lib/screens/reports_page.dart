import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeticem/services/reports_service.dart';
import 'package:projeticem/models/report.dart';
import 'package:projeticem/widgets/stats_card.dart';
import 'package:projeticem/widgets/chart_card.dart';
import 'package:projeticem/widgets/status_badge.dart';
import 'package:projeticem/theme/app_theme.dart';
import 'package:projeticem/services/pdf_export_service.dart';

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
  List<ConformityTrend> _trendData = [];
  bool _isLoading = true;
  String _selectedPeriod = 'Ce mois';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final periodStats = await _reportsService.getStatsByPeriod(_selectedPeriod);
    final reports = await _reportsService.getRecentReports(limit: 10, period: _selectedPeriod);
    final anomalies = await _reportsService.getAnomaliesByType(period: _selectedPeriod);
    final trends = await _reportsService.getConformityTrend();
    
    setState(() {
      _globalStats = GlobalStats(
        totalInspections: periodStats.inspections,
        conformityRate: periodStats.conformityRate,
        totalAnomalies: periodStats.anomalies,
        reportsGenerated: periodStats.inspections,
      );
      _recentReports = reports;
      _anomaliesByType = anomalies;
      _trendData = trends;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Rapports & Statistiques',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download_outlined, color: Colors.white),
            onPressed: () {
              if (_globalStats != null) {
                PdfExportService.exportGlobalStatsReport(_globalStats!, _anomaliesByType);
              }
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
              label: Text(period, style: GoogleFonts.inter(fontSize: 14)),
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
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.9,
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
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        
        // Graphique 1 : Tendance de conformité (données réelles)
        ChartCard(
          title: 'Évolution de la conformité',
          subtitle: '7 derniers jours',
          child: _buildConformityTrend(),
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

  /// Graphique de tendance de conformité (données réelles depuis Firestore)
  Widget _buildConformityTrend() {
    if (_trendData.isEmpty) {
      return const ChartPlaceholder(
        message: 'Aucune donnée d\'inspection disponible',
        icon: Icons.show_chart,
      );
    }

    // Trouver la valeur max pour normaliser les barres
    final maxInspections = _trendData.fold<int>(0, (max, t) => t.inspectionsCount > max ? t.inspectionsCount : max);

    return SizedBox(
      height: 200,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: _trendData.map((trend) {
          final days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          final dayLabel = trend.date.weekday <= 7 ? days[trend.date.weekday - 1] : '';
          final barHeight = maxInspections > 0 ? (trend.inspectionsCount / maxInspections) * 140 : 0.0;
          final rate = trend.conformityRate;
          
          Color barColor;
          if (rate >= 90) {
            barColor = AppTheme.successGreen;
          } else if (rate >= 70) {
            barColor = AppTheme.warningAmber;
          } else {
            barColor = AppTheme.errorRed;
          }

          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    '${rate.toStringAsFixed(0)}%',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: barColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    height: barHeight.clamp(4, 140),
                    width: 14,
                    decoration: BoxDecoration(
                      color: barColor.withValues(alpha: 0.8),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    dayLabel,
                    style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textGrey),
                  ),
                  Text(
                    '${trend.inspectionsCount}',
                    style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textLight),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
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

    return SizedBox(
      height: _anomaliesByType.length * 52.0, // Give it a fixed height instead of ListView
      child: ListView.builder(
        physics: const NeverScrollableScrollPhysics(), // Prevent nested scroll issues
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
                        Text(entry.key, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    Text(
                      '${entry.value} ($percentage%)',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
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
      ),
    );
  }

  /// Liste des rapports récents
  Widget _buildRecentReports() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Rapports récents',
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        
        if (_recentReports.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(Icons.description_outlined, size: 48, color: AppTheme.textLight),
                  const SizedBox(height: 12),
                  Text(
                    'Aucun rapport disponible',
                    style: GoogleFonts.inter(fontSize: 16, color: AppTheme.textGrey),
                  ),
                ],
              ),
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
    final dateStr = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
        title: Text('Câble ${report.cableId}', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
        subtitle: Text(dateStr, style: GoogleFonts.inter(fontSize: 13)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            StatusBadge(status: report.conformityStatus, isSmall: true),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.picture_as_pdf, size: 22),
              onPressed: () => PdfExportService.exportInspectionReport(report),
            ),
          ],
        ),
      ),
    );
  }
}
