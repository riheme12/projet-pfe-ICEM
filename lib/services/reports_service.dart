import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques
/// 
/// Fournit des données simulées pour les graphiques et rapports
class ReportsService {
  // Singleton
  static final ReportsService _instance = ReportsService._internal();
  factory ReportsService() => _instance;
  ReportsService._internal();

  /// Récupérer les statistiques globales
  Future<GlobalStats> getGlobalStats() async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    return GlobalStats(
      totalInspections: 456,
      conformityRate: 95.2,
      totalAnomalies: 38,
      reportsGenerated: 456,
    );
  }

  /// Récupérer la tendance de conformité (7 derniers jours)
  Future<List<ConformityTrend>> getConformityTrend() async {
    await Future.delayed(const Duration(milliseconds: 600));
    
    final now = DateTime.now();
    return List.generate(7, (index) {
      final date = now.subtract(Duration(days: 6 - index));
      return ConformityTrend(
        date: date,
        conformityRate: 92.0 + (index * 0.5) + (index % 2 == 0 ? 1.0 : 0.0),
        inspectionsCount: 50 + (index * 5),
      );
    });
  }

  /// Récupérer la répartition des anomalies par type
  Future<Map<String, int>> getAnomaliesByType() async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    return {
      'Rayure': 15,
      'Déformation': 8,
      'Défaut de surface': 10,
      'Couleur incorrecte': 3,
      'Marquage illisible': 2,
    };
  }

  /// Récupérer les rapports récents
  Future<List<Report>> getRecentReports({int limit = 10}) async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    final now = DateTime.now();
    final reports = <Report>[];
    
    for (int i = 0; i < limit; i++) {
      final isConform = i % 4 != 0; // 75% conformes
      
      reports.add(Report(
        id: 'report_${i + 1}',
        cableId: 'cable_00${i + 1}',
        orderId: 'order_00${(i % 3) + 1}',
        technicianId: 'user_001',
        generatedAt: now.subtract(Duration(hours: i * 2)),
        conformityStatus: isConform ? 'Conforme' : 'Non conforme',
        anomaliesCount: isConform ? 0 : (i % 3 + 1),
        pdfUrl: 'https://example.com/reports/report_${i + 1}.pdf',
        notes: isConform ? null : 'Anomalies détectées nécessitant attention',
      ));
    }
    
    return reports;
  }

  /// Récupérer les anomalies récentes
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    final now = DateTime.now();
    final anomalies = <Anomaly>[];
    
    final types = ['Rayure', 'Déformation', 'Défaut de surface', 'Couleur incorrecte'];
    final severities = ['Mineur', 'Majeur', 'Critique'];
    
    for (int i = 0; i < limit; i++) {
      anomalies.add(Anomaly(
        id: 'anomaly_${i + 1}',
        type: types[i % types.length],
        severity: severities[i % severities.length],
        confidence: 0.75 + (i % 20) * 0.01,
        location: 'Position ${i * 10}cm',
        cableId: 'cable_00${(i % 10) + 1}',
        detectedAt: now.subtract(Duration(hours: i)),
      ));
    }
    
    return anomalies;
  }

  /// Générer un rapport PDF (simulé)
  Future<String> generateReport(String cableId) async {
    await Future.delayed(const Duration(milliseconds: 1500));
    
    // Simuler la génération d'un PDF
    return 'https://example.com/reports/cable_$cableId.pdf';
  }

  /// Récupérer les statistiques par période
  Future<PeriodStats> getStatsByPeriod(String period) async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Données différentes selon la période
    switch (period) {
      case 'Aujourd\'hui':
        return PeriodStats(
          inspections: 24,
          conformityRate: 95.8,
          anomalies: 1,
        );
      case 'Cette semaine':
        return PeriodStats(
          inspections: 156,
          conformityRate: 94.5,
          anomalies: 9,
        );
      case 'Ce mois':
        return PeriodStats(
          inspections: 456,
          conformityRate: 95.2,
          anomalies: 22,
        );
      default:
        return PeriodStats(
          inspections: 0,
          conformityRate: 0,
          anomalies: 0,
        );
    }
  }
}

/// Modèle pour les statistiques globales
class GlobalStats {
  final int totalInspections;
  final double conformityRate;
  final int totalAnomalies;
  final int reportsGenerated;

  GlobalStats({
    required this.totalInspections,
    required this.conformityRate,
    required this.totalAnomalies,
    required this.reportsGenerated,
  });
}

/// Modèle pour la tendance de conformité
class ConformityTrend {
  final DateTime date;
  final double conformityRate;
  final int inspectionsCount;

  ConformityTrend({
    required this.date,
    required this.conformityRate,
    required this.inspectionsCount,
  });
}

/// Modèle pour les statistiques par période
class PeriodStats {
  final int inspections;
  final double conformityRate;
  final int anomalies;

  PeriodStats({
    required this.inspections,
    required this.conformityRate,
    required this.anomalies,
  });
}
