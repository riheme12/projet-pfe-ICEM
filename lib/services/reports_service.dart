import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques
/// 
/// Connecté à Firebase Firestore pour les anomalies
/// Les rapports restent en mock pour l'instant
class ReportsService {
  // Singleton
  static final ReportsService _instance = ReportsService._internal();
  factory ReportsService() => _instance;
  ReportsService._internal();

  final CollectionReference _anomalyCollection =
      FirebaseFirestore.instance.collection('anomaly');

  /// Récupérer les statistiques globales (agrégées depuis Firestore)
  Future<GlobalStats> getGlobalStats() async {
    try {
      // Compter les anomalies
      final anomalySnapshot = await _anomalyCollection.get();
      final totalAnomalies = anomalySnapshot.docs.length;

      // Lire les ordres pour calculer les stats
      final ordersSnapshot = await FirebaseFirestore.instance
          .collection('manufacturingOrder')
          .get();
      
      int totalInspections = 0;
      int totalConform = 0;

      for (var doc in ordersSnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final inspected = _parseInt(data['inspectedCount']);
        final conform = _parseInt(data['conformCount']);
        totalInspections += inspected;
        totalConform += conform;
      }

      final conformityRate = totalInspections > 0
          ? (totalConform / totalInspections) * 100
          : 0.0;

      return GlobalStats(
        totalInspections: totalInspections,
        conformityRate: conformityRate,
        totalAnomalies: totalAnomalies,
        reportsGenerated: totalInspections, // 1 rapport par inspection
      );
    } catch (e) {
      print('Error fetching global stats: $e');
      return GlobalStats(
        totalInspections: 0,
        conformityRate: 0.0,
        totalAnomalies: 0,
        reportsGenerated: 0,
      );
    }
  }

  /// Récupérer la tendance de conformité (7 derniers jours)
  /// Note: Calculée depuis les ordres de fabrication
  Future<List<ConformityTrend>> getConformityTrend() async {
    try {
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));

      final ordersSnapshot = await FirebaseFirestore.instance
          .collection('manufacturingOrder')
          .where('DateLiv', isGreaterThanOrEqualTo: Timestamp.fromDate(sevenDaysAgo))
          .orderBy('DateLiv')
          .get();

      // Grouper par jour
      final Map<String, List<Map<String, dynamic>>> byDay = {};
      for (var doc in ordersSnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final date = data['DateLiv'] is Timestamp
            ? (data['DateLiv'] as Timestamp).toDate()
            : now;
        final dayKey = '${date.year}-${date.month}-${date.day}';
        byDay.putIfAbsent(dayKey, () => []);
        byDay[dayKey]!.add(data);
      }

      // Générer les tendances pour les 7 derniers jours
      return List.generate(7, (index) {
        final date = now.subtract(Duration(days: 6 - index));
        final dayKey = '${date.year}-${date.month}-${date.day}';
        final dayOrders = byDay[dayKey] ?? [];

        int inspections = 0;
        int conform = 0;
        for (var data in dayOrders) {
          inspections += _parseInt(data['inspectedCount']);
          conform += _parseInt(data['conformCount']);
        }

        return ConformityTrend(
          date: date,
          conformityRate: inspections > 0 ? (conform / inspections) * 100 : 0.0,
          inspectionsCount: inspections,
        );
      });
    } catch (e) {
      print('Error fetching conformity trend: $e');
      return [];
    }
  }

  /// Récupérer la répartition des anomalies par type (depuis Firestore)
  Future<Map<String, int>> getAnomaliesByType() async {
    try {
      final snapshot = await _anomalyCollection.get();
      final Map<String, int> result = {};

      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final type = data['type'] as String? ?? 'Inconnu';
        result[type] = (result[type] ?? 0) + 1;
      }

      return result;
    } catch (e) {
      print('Error fetching anomalies by type: $e');
      return {};
    }
  }

  /// Récupérer les rapports récents (mock pour l'instant - pas de collection reports)
  Future<List<Report>> getRecentReports({int limit = 10}) async {
    // Reports collection n'existe pas encore - retourner une liste vide
    return [];
  }

  /// Récupérer les anomalies récentes (depuis Firestore)
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
      final snapshot = await _anomalyCollection
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Anomaly.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('Error fetching recent anomalies: $e');
      return [];
    }
  }

  /// Ajouter une anomalie à Firestore
  Future<void> addAnomaly(Anomaly anomaly) async {
    try {
      await _anomalyCollection.add(anomaly.toFirestore());
    } catch (e) {
      print('Error adding anomaly: $e');
      rethrow;
    }
  }

  /// Générer un rapport PDF (simulé pour l'instant)
  Future<String> generateReport(String cableId) async {
    await Future.delayed(const Duration(milliseconds: 1500));
    return 'https://example.com/reports/cable_$cableId.pdf';
  }

  /// Récupérer les statistiques par période
  Future<PeriodStats> getStatsByPeriod(String period) async {
    try {
      final now = DateTime.now();
      DateTime startDate;

      switch (period) {
        case 'Aujourd\'hui':
          startDate = DateTime(now.year, now.month, now.day);
          break;
        case 'Cette semaine':
          startDate = now.subtract(Duration(days: now.weekday - 1));
          break;
        case 'Ce mois':
          startDate = DateTime(now.year, now.month, 1);
          break;
        default:
          startDate = DateTime(now.year, now.month, 1);
      }

      // Compter les anomalies de la période
      final anomalySnapshot = await _anomalyCollection
          .where('detectedAt', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .get();

      // Compter les inspections de la période
      final ordersSnapshot = await FirebaseFirestore.instance
          .collection('manufacturingOrder')
          .get();

      int inspections = 0;
      int conform = 0;
      for (var doc in ordersSnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        inspections += _parseInt(data['inspectedCount']);
        conform += _parseInt(data['conformCount']);
      }

      return PeriodStats(
        inspections: inspections,
        conformityRate: inspections > 0 ? (conform / inspections) * 100 : 0.0,
        anomalies: anomalySnapshot.docs.length,
      );
    } catch (e) {
      print('Error fetching period stats: $e');
      return PeriodStats(inspections: 0, conformityRate: 0.0, anomalies: 0);
    }
  }

  /// Helper pour parser les entiers de manière sûre
  int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
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
