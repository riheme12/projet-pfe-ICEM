import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

<<<<<<< HEAD
/// Service pour gérer les rapports et statistiques via Firestore
=======
/// Service pour gérer les rapports et statistiques
/// 
/// Connecté à Firebase Firestore pour les anomalies
/// Les rapports restent en mock pour l'instant
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
          : 0.0;

      return GlobalStats(
        totalInspections: totalInspections,
        conformityRate: conformityRate,
<<<<<<< HEAD
        totalAnomalies: anomaliesSnapshot.size,
        reportsGenerated: reportsSnapshot.size,
      );
    } catch (e) {
      print('Error calculating global stats: $e');
=======
        totalAnomalies: totalAnomalies,
        reportsGenerated: totalInspections, // 1 rapport par inspection
      );
    } catch (e) {
      print('Error fetching global stats: $e');
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
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
<<<<<<< HEAD
      
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
=======

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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
    } catch (e) {
      print('Error fetching conformity trend: $e');
      return [];
    }
  }

  /// Récupérer la répartition des anomalies par type (depuis Firestore)
  Future<Map<String, int>> getAnomaliesByType() async {
    try {
<<<<<<< HEAD
      final snapshot = await _db.collection('anomaly').get();
      Map<String, int> distribution = {};
      
      for (var doc in snapshot.docs) {
        final type = (doc.data()['type'] ?? 'Autre') as String;
        distribution[type] = (distribution[type] ?? 0) + 1;
      }
      
      return distribution;
=======
      final snapshot = await _anomalyCollection.get();
      final Map<String, int> result = {};

      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final type = data['type'] as String? ?? 'Inconnu';
        result[type] = (result[type] ?? 0) + 1;
      }

      return result;
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
    } catch (e) {
      print('Error fetching anomalies by type: $e');
      return {};
    }
  }

  /// Récupérer les rapports récents (mock pour l'instant - pas de collection reports)
  Future<List<Report>> getRecentReports({int limit = 10}) async {
<<<<<<< HEAD
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
=======
    // Reports collection n'existe pas encore - retourner une liste vide
    return [];
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  }

  /// Récupérer les anomalies récentes (depuis Firestore)
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
<<<<<<< HEAD
      final snapshot = await _db
          .collection('anomaly')
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();
          
      return snapshot.docs.map((doc) {
        return Anomaly.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
=======
      final snapshot = await _anomalyCollection
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => Anomaly.fromFirestore(doc))
          .toList();
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
    } catch (e) {
      print('Error fetching recent anomalies: $e');
      return [];
    }
  }

<<<<<<< HEAD
  /// Générer un rapport PDF (Simulé pour l'instant)
=======
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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  Future<String> generateReport(String cableId) async {
    // In a real app, this might call a Cloud Function or backend to generate a PDF
    // For now, we simulate the delay and return a mock URL
    await Future.delayed(const Duration(milliseconds: 1500));
<<<<<<< HEAD
    return 'https://firebasestorage.googleapis.com/v0/b/testflutter-de1f5.appspot.com/o/reports%2Fplaceholder.pdf?alt=media';
=======
    return 'https://example.com/reports/cable_$cableId.pdf';
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  }

  /// Récupérer les statistiques par période
  Future<PeriodStats> getStatsByPeriod(String period) async {
    try {
<<<<<<< HEAD
      DateTime startDate;
      final now = DateTime.now();
      
=======
      final now = DateTime.now();
      DateTime startDate;

>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
      switch (period) {
        case 'Aujourd\'hui':
          startDate = DateTime(now.year, now.month, now.day);
          break;
        case 'Cette semaine':
          startDate = now.subtract(Duration(days: now.weekday - 1));
<<<<<<< HEAD
          startDate = DateTime(startDate.year, startDate.month, startDate.day);
=======
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
          break;
        case 'Ce mois':
          startDate = DateTime(now.year, now.month, 1);
          break;
        default:
<<<<<<< HEAD
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
=======
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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
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
