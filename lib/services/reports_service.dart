import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques
/// 
/// Connecté à Firebase Firestore pour les anomalies et ordres
class ReportsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final ReportsService _instance = ReportsService._internal();
  factory ReportsService() => _instance;
  ReportsService._internal();

  final CollectionReference _anomalyCollection =
      FirebaseFirestore.instance.collection('anomaly');

  /// Récupérer les statistiques globales (agrégées depuis Firestore)
  Future<GlobalStats> getGlobalStats() async {
    try {
      final anomalySnapshot = await _anomalyCollection.get();
      final totalAnomalies = anomalySnapshot.docs.length;

      final ordersSnapshot = await _db.collection('manufacturingOrder').get();
      
      int totalInspections = 0;
      int totalConform = 0;

      for (var doc in ordersSnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        totalInspections += _parseInt(data['inspectedCount']);
        totalConform += _parseInt(data['conformCount']);
      }

      final conformityRate = totalInspections > 0
          ? (totalConform / totalInspections) * 100
          : 0.0;

      return GlobalStats(
        totalInspections: totalInspections,
        conformityRate: conformityRate,
        totalAnomalies: totalAnomalies,
        reportsGenerated: totalInspections,
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
  Future<List<ConformityTrend>> getConformityTrend() async {
    try {
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));

      final ordersSnapshot = await _db
          .collection('manufacturingOrder')
          .get();

      // Grouper par jour en utilisant DateLiv
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

  /// Récupérer les rapports récents
  Future<List<Report>> getRecentReports({int limit = 10}) async {
    try {
      final snapshot = await _db
          .collection('report')
          .orderBy('generatedAt', descending: true)
          .limit(limit)
          .get();
          
      return snapshot.docs.map((doc) {
        return Report.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
    } catch (e) {
      print('Error fetching recent reports: $e');
      return [];
    }
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
    return 'https://firebasestorage.googleapis.com/v0/b/testflutter-de1f5.appspot.com/o/reports%2Fplaceholder.pdf?alt=media';
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
          startDate = DateTime(startDate.year, startDate.month, startDate.day);
          break;
        case 'Ce mois':
          startDate = DateTime(now.year, now.month, 1);
          break;
        default:
          startDate = DateTime(now.year, now.month, now.day);
      }

      // Compter les anomalies de la période
      final anomalySnapshot = await _anomalyCollection
          .where('detectedAt', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .get();

      // Compter les inspections
      final ordersSnapshot = await _db
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

/// Modèles locaux
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
