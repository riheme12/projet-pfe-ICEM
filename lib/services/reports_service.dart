import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques via Firestore
class ReportsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final ReportsService _instance = ReportsService._internal();
  factory ReportsService() => _instance;
  ReportsService._internal();

  /// Récupérer les statistiques globales
  Future<GlobalStats> getGlobalStats() async {
    try {
      final ordersSnapshot = await _db.collection('manufacturingOrder').get();
      final anomaliesSnapshot = await _db.collection('anomaly').get();
      final reportsSnapshot = await _db.collection('report').get();
      
      int totalInspections = 0;
      int conformCount = 0;
      for (var doc in ordersSnapshot.docs) {
        final data = doc.data();
        totalInspections += (data['inspectedCount'] ?? 0) as int;
        conformCount += (data['conformCount'] ?? 0) as int;
      }

      double conformityRate = totalInspections > 0 
          ? (conformCount / totalInspections) * 100 
          : 0.0;

      return GlobalStats(
        totalInspections: totalInspections,
        conformityRate: conformityRate,
        totalAnomalies: anomaliesSnapshot.size,
        reportsGenerated: reportsSnapshot.size,
      );
    } catch (e) {
      print('Error calculating global stats: $e');
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
      
      // Fetch inspections from the last 7 days
      final snapshot = await _db
          .collection('cable')
          .where('inspectionDate', isGreaterThanOrEqualTo: sevenDaysAgo.toIso8601String())
          .get();

      // Group by date
      Map<String, List<DocumentSnapshot>> groupedByDate = {};
      for (var doc in snapshot.docs) {
        final dateStr = (doc.data()['inspectionDate'] as String).substring(0, 10);
        groupedByDate.putIfAbsent(dateStr, () => []).add(doc);
      }

      List<ConformityTrend> trends = [];
      for (int i = 0; i < 7; i++) {
        final date = now.subtract(Duration(days: 6 - i));
        final dateKey = date.toIso8601String().substring(0, 10);
        
        final cables = groupedByDate[dateKey] ?? [];
        int total = cables.length;
        int conform = cables.where((c) => c.data() != null && (c.data() as Map)['status'] == 'Conforme').length;
        
        trends.add(ConformityTrend(
          date: date,
          conformityRate: total > 0 ? (conform / total) * 100 : 100.0, // Default to 100 if no inspections
          inspectionsCount: total,
        ));
      }
      
      return trends;
    } catch (e) {
      print('Error fetching conformity trend: $e');
      return [];
    }
  }

  /// Récupérer la répartition des anomalies par type
  Future<Map<String, int>> getAnomaliesByType() async {
    try {
      final snapshot = await _db.collection('anomaly').get();
      Map<String, int> distribution = {};
      
      for (var doc in snapshot.docs) {
        final type = (doc.data()['type'] ?? 'Autre') as String;
        distribution[type] = (distribution[type] ?? 0) + 1;
      }
      
      return distribution;
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

  /// Récupérer les anomalies récentes
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
      final snapshot = await _db
          .collection('anomaly')
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();
          
      return snapshot.docs.map((doc) {
        return Anomaly.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
    } catch (e) {
      print('Error fetching recent anomalies: $e');
      return [];
    }
  }

  /// Générer un rapport PDF (Simulé pour l'instant)
  Future<String> generateReport(String cableId) async {
    // In a real app, this might call a Cloud Function or backend to generate a PDF
    // For now, we simulate the delay and return a mock URL
    await Future.delayed(const Duration(milliseconds: 1500));
    return 'https://firebasestorage.googleapis.com/v0/b/testflutter-de1f5.appspot.com/o/reports%2Fplaceholder.pdf?alt=media';
  }

  /// Récupérer les statistiques par période
  Future<PeriodStats> getStatsByPeriod(String period) async {
    try {
      DateTime startDate;
      final now = DateTime.now();
      
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
          .where('inspectionDate', isGreaterThanOrEqualTo: startDate.toIso8601String())
          .get();

      int total = snapshot.size;
      int conform = snapshot.docs.where((d) => d.data()['status'] == 'Conforme').length;
      int anomalies = snapshot.docs.fold(0, (sum, d) => sum + ((d.data()['anomaliesCount'] ?? 0) as int));

      return PeriodStats(
        inspections: total,
        conformityRate: total > 0 ? (conform / total) * 100 : 0.0,
        anomalies: anomalies,
      );
    } catch (e) {
      print('Error fetching period stats: $e');
      return PeriodStats(inspections: 0, conformityRate: 0.0, anomalies: 0);
    }
  }
}

/// Modèles locaux (inchangés)
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
