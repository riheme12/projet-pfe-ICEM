import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques via Firestore
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
      // Compter les anomalies
      final anomalySnapshot = await _anomalyCollection.get();
      final totalAnomalies = anomalySnapshot.docs.length;

      final ordersSnapshot =
          await _db.collection('manufacturingOrder').get();

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
      debugPrint('Error fetching global stats: $e');
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

      final cablesSnapshot = await _db
          .collection('cable')
          .where('inspectionDate',
              isGreaterThanOrEqualTo: Timestamp.fromDate(sevenDaysAgo))
          .get();

      // Grouper par jour
      final Map<String, List<Map<String, dynamic>>> byDay = {};
      for (var doc in cablesSnapshot.docs) {
        final data = doc.data();
        final timestamp = data['inspectionDate'] as Timestamp?;
        if (timestamp == null) continue;

        final date = timestamp.toDate();
        final dayKey = '${date.year}-${date.month}-${date.day}';
        byDay.putIfAbsent(dayKey, () => []);
        byDay[dayKey]!.add(data);
      }

      return List.generate(7, (index) {
        final date = now.subtract(Duration(days: 6 - index));
        final dayKey = '${date.year}-${date.month}-${date.day}';
        final dayCables = byDay[dayKey] ?? [];

        int total = dayCables.length;
        int conform = dayCables
            .where((c) =>
                (c['status'] as String? ?? '').toLowerCase() == 'conforme')
            .length;

        return ConformityTrend(
          date: date,
          conformityRate: total > 0 ? (conform / total) * 100 : 100.0,
          inspectionsCount: total,
        );
      });
    } catch (e) {
      debugPrint('Error fetching conformity trend: $e');
      return [];
    }
  }

  /// Récupérer la répartition des anomalies par type
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
      debugPrint('Error fetching anomalies by type: $e');
      return {};
    }
  }

  /// Récupérer les rapports récents
  Future<List<Report>> getRecentReports({int limit = 20}) async {
    try {
      final snapshot = await _db
          .collection('report')
          .orderBy('generatedAt', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => Report.fromFirestore(doc)).toList();
    } catch (e) {
      debugPrint('Error fetching recent reports: $e');
      return [];
    }
  }

  /// Récupérer les anomalies récentes
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
      final snapshot = await _anomalyCollection
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => Anomaly.fromFirestore(doc)).toList();
    } catch (e) {
      debugPrint('Error fetching recent anomalies: $e');
      return [];
    }
  }

  /// Ajouter une anomalie à Firestore
  Future<void> addAnomaly(Anomaly anomaly) async {
    try {
      await _anomalyCollection.add(anomaly.toFirestore());
    } catch (e) {
      debugPrint('Error adding anomaly: $e');
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

      final snapshot = await _db
          .collection('cable')
          .where('inspectionDate',
              isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .get();

      int total = snapshot.docs.length;
      int conform = snapshot.docs
          .where((d) =>
              ((d.data()['status'] as String?) ?? '').toLowerCase() ==
              'conforme')
          .length;
      int anomalies = snapshot.docs
          .fold(0, (acc, d) => acc + _parseInt(d.data()['anomaliesCount']));

      return PeriodStats(
        inspections: total,
        conformityRate: total > 0 ? (conform / total) * 100 : 0.0,
        anomalies: anomalies,
      );
    } catch (e) {
      debugPrint('Error fetching period stats: $e');
      return PeriodStats(inspections: 0, conformityRate: 0.0, anomalies: 0);
    }
  }

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
