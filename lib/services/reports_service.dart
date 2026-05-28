import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/report.dart';
import '../models/anomaly.dart';

/// Service pour gérer les rapports et statistiques via Firestore
///
/// OPTIMISÉ : requêtes .where() server-side + cache mémoire
class ReportsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final ReportsService _instance = ReportsService._internal();
  factory ReportsService() => _instance;
  ReportsService._internal();

  // ─── Cache mémoire (évite les doublons de requêtes) ─────────────────
  TechnicianStats? _cachedStats;
  String? _cachedStatsKey; // "techId_period"
  DateTime? _cachedStatsAt;
  static const _cacheDuration = Duration(seconds: 30);

  bool _isCacheValid(String key) {
    return _cachedStatsKey == key &&
        _cachedStatsAt != null &&
        DateTime.now().difference(_cachedStatsAt!) < _cacheDuration;
  }

  /// Date de début selon la période sélectionnée
  DateTime _startDateForPeriod(String period) {
    final now = DateTime.now();
    switch (period) {
      case 'Aujourd\'hui':
        return DateTime(now.year, now.month, now.day);
      case 'Cette semaine':
        final start = now.subtract(Duration(days: now.weekday - 1));
        return DateTime(start.year, start.month, start.day);
      case 'Ce mois':
        return DateTime(now.year, now.month, 1);
      default:
        return DateTime(now.year, now.month, 1);
    }
  }

  /// Parse une date depuis n'importe quel format Firestore
  DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is String) {
      try { return DateTime.parse(value); } catch (_) { return null; }
    }
    return null;
  }

  /// Récupérer les statistiques globales (agrégées)
  /// CLIENT-SIDE filtering to avoid Firestore index/type issues
  Future<GlobalStats> getGlobalStats() async {
    try {
      final now = DateTime.now();
      final thirtyDaysAgo = now.subtract(const Duration(days: 30));

      final results = await Future.wait<QuerySnapshot>([
        _db.collection('anomaly').get(),
        _db.collection('cable').get(),
        _db.collection('report').get(),
      ]);

      // Filtrer anomalies par date côté client
      final anomDocs = results[0].docs.where((d) {
        final data = d.data() as Map<String, dynamic>;
        final date = _parseDate(data['detectedAt']);
        return date != null && date.isAfter(thirtyDaysAgo);
      }).toList();

      // Filtrer câbles par date côté client
      final cableDocs = results[1].docs.where((d) {
        final data = d.data() as Map<String, dynamic>;
        final date = _parseDate(data['inspectionDate']);
        return date != null && date.isAfter(thirtyDaysAgo);
      }).toList();

      final reportDocs = results[2].docs;

      int conform = 0;
      for (var doc in cableDocs) {
        final data = doc.data() as Map<String, dynamic>;
        final s = (data['status'] as String? ?? '').toLowerCase();
        if (s.contains('conforme') && !s.contains('non')) conform++;
      }

      final total = cableDocs.length;
      return GlobalStats(
        totalInspections: total,
        conformityRate: total > 0 ? (conform / total * 100) : 100,
        totalAnomalies: anomDocs.length,
        reportsGenerated: reportDocs.length,
      );
    } catch (e) {
      debugPrint('Error in getGlobalStats: $e');
      return GlobalStats(totalInspections: 0, conformityRate: 0, totalAnomalies: 0, reportsGenerated: 0);
    }
  }

  /// Statistiques filtrées par technicien et période
  /// CLIENT-SIDE filtering to avoid Firestore composite index issues
  Future<TechnicianStats> getTechnicianStats(String technicianId, {String period = 'Ce mois'}) async {
    final cacheKey = '${technicianId}_$period';
    if (_isCacheValid(cacheKey) && _cachedStats != null) return _cachedStats!;

    try {
      final startDate = _startDateForPeriod(period);

      // Charger TOUS les docs puis filtrer côté client
      // (évite les erreurs d'index Firestore composite)
      final results = await Future.wait<QuerySnapshot>([
        _db.collection('anomaly').get(),
        _db.collection('cable').get(),
      ]);

      // Filtrer anomalies par technicien + date côté client
      final myAnomalies = results[0].docs.where((d) {
        final data = d.data() as Map<String, dynamic>;
        if (data['technicianId'] != technicianId) return false;
        final date = _parseDate(data['detectedAt']);
        return date != null && date.isAfter(startDate);
      }).toList();

      // Filtrer câbles par technicien + date côté client
      final myCables = results[1].docs.where((d) {
        final data = d.data() as Map<String, dynamic>;
        if (data['technicianId'] != technicianId) return false;
        final date = _parseDate(data['inspectionDate']);
        return date != null && date.isAfter(startDate);
      }).toList();

      // Calculs
      final totalAnom = myAnomalies.length;
      final resolvedAnom = myAnomalies.where((d) {
        final data = d.data() as Map<String, dynamic>;
        return (data['status'] as String? ?? data['statut'] as String?) == 'traitee';
      }).length;
      final totalCables = myCables.length;
      final conformCables = myCables.where((d) {
        final data = d.data() as Map<String, dynamic>;
        final s = (data['status'] as String? ?? '').toLowerCase();
        return s.contains('conforme') && !s.contains('non');
      }).length;

      final stats = TechnicianStats(
        inspections: totalCables,
        anomaliesDetected: totalAnom,
        anomaliesResolved: resolvedAnom,
        conformityRate: totalCables > 0 ? (conformCables / totalCables * 100) : 100.0,
        cablesConform: conformCables,
        cablesNonConform: totalCables - conformCables,
        anomaliesByType: _groupBy(myAnomalies, 'type'),
        anomaliesBySeverity: _groupBy(myAnomalies, 'severity', defaults: {'Critique': 0, 'Majeur': 0, 'Mineur': 0}),
      );

      _cachedStats = stats;
      _cachedStatsKey = cacheKey;
      _cachedStatsAt = DateTime.now();
      return stats;
    } catch (e) {
      debugPrint('Error in getTechnicianStats: $e');
      return TechnicianStats.empty();
    }
  }

  Map<String, int> _groupBy(List<QueryDocumentSnapshot> docs, String field, {Map<String, int>? defaults}) {
    final Map<String, int> map = defaults != null ? Map.from(defaults) : {};
    for (var doc in docs) {
      final val = doc.data() is Map ? (doc.data() as Map)[field] as String? ?? 'Inconnu' : 'Inconnu';
      map[val] = (map[val] ?? 0) + 1;
    }
    return map;
  }

  /// Invalider le cache (appeler après un export PDF par exemple)
  void invalidateCache() {
    _cachedStats = null;
    _cachedStatsKey = null;
    _cachedStatsAt = null;
  }

  /// Récupérer la répartition des anomalies par type avec filtrage
  /// OPTIMISÉ : .where() server-side
  Future<Map<String, int>> getAnomaliesByType({String period = 'Ce mois', String? technicianId}) async {
    try {
      final startDate = _startDateForPeriod(period);

      Query query = _db.collection('anomaly');
      if (technicianId != null) {
        query = query.where('technicianId', isEqualTo: technicianId);
      }

      final snapshot = await query.get();
      final Map<String, int> result = {};

      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final date = _parseDate(data['detectedAt']);
        if (date != null && date.isBefore(startDate)) continue;
        final type = data['type'] as String? ?? 'Inconnu';
        result[type] = (result[type] ?? 0) + 1;
      }
      return result;
    } catch (e) {
      debugPrint('Error fetching anomalies by type: $e');
      return {};
    }
  }

  /// Récupérer les inspections récentes du technicien
  /// CLIENT-SIDE filtering for consistency
  Future<List<InspectionRecord>> getMyInspections(String technicianId, {int limit = 30, String period = 'Ce mois'}) async {
    try {
      final startDate = _startDateForPeriod(period);

      // Charger tous les câbles puis filtrer côté client
      final cableSnapshot = await _db.collection('cable').get();

      final records = <InspectionRecord>[];
      for (var doc in cableSnapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        if (data['technicianId'] != technicianId) continue;
        final date = _parseDate(data['inspectionDate']);
        if (date == null || date.isBefore(startDate)) continue;

        records.add(InspectionRecord(
          id: doc.id,
          cableCode: data['code'] as String? ?? data['reference'] as String? ?? '',
          orderId: data['orderId'] as String? ?? '',
          status: data['status'] as String? ?? 'Inconnu',
          inspectedAt: date,
          technicianName: data['technicianName'] as String?,
          anomaliesCount: _parseInt(data['anomaliesCount']),
        ));
      }

      records.sort((a, b) => b.inspectedAt.compareTo(a.inspectedAt));
      return records.take(limit).toList();
    } catch (e) {
      debugPrint('Error fetching my inspections: $e');
      return [];
    }
  }

  /// Récupérer les rapports du technicien
  /// CLIENT-SIDE filtering to avoid Firestore index issues
  Future<List<Report>> getMyReports(String technicianId, {int limit = 50, String period = 'Ce mois'}) async {
    try {
      // Charger TOUS les rapports puis filtrer côté client
      // (évite les erreurs d'index Firestore composite)
      final snapshot = await _db.collection('report').get();

      final reports = snapshot.docs
          .map((doc) => Report.fromFirestore(doc))
          .where((r) => r.technicianId == technicianId)
          .toList();

      reports.sort((a, b) => b.generatedAt.compareTo(a.generatedAt));
      return reports.take(limit).toList();
    } catch (e) {
      debugPrint('Error fetching my reports: $e');
      return [];
    }
  }

  /// Créer un enregistrement de rapport dans Firestore
  Future<void> createReportRecord({
    required String technicianId,
    required String technicianName,
    required String type,
    String? period,
    String? cableId,
    String? orderId,
    String? status,
    int? anomaliesCount,
    String? notes,
    String? signatureUrl,
    String? imageUrl,
  }) async {
    try {
      await _db.collection('report').add({
        'type': type,
        'cableId': cableId ?? 'Rapport Global',
        'orderId': orderId ?? '',
        'technicianId': technicianId,
        'technicianName': technicianName,
        'generatedAt': Timestamp.fromDate(DateTime.now()),
        'conformityStatus': status ?? 'Rapport $period',
        'anomaliesCount': anomaliesCount ?? 0,
        'notes': notes ?? 'Rapport généré le ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
        'signatureUrl': signatureUrl,
        'imageUrl': imageUrl,
      });
    } catch (e) {
      debugPrint('Error creating report record: $e');
    }
  }

  /// Récupérer les anomalies récentes
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
      final snapshot = await _db.collection('anomaly')
          .limit(limit)
          .get();
      final list = snapshot.docs.map((doc) => Anomaly.fromFirestore(doc)).toList();
      list.sort((a, b) => b.detectedAt.compareTo(a.detectedAt));
      return list.take(limit).toList();
    } catch (e) {
      debugPrint('Error fetching recent anomalies: $e');
      return [];
    }
  }

  /// Récupérer la tendance de conformité (7 derniers jours)
  /// OPTIMISÉ : ne charge que les câbles des 7 derniers jours
  Future<List<ConformityTrend>> getConformityTrend() async {
    try {
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));

      // Ne charger que les câbles récents
      final cablesSnapshot = await _db.collection('cable')
          .where('inspectionDate', isGreaterThanOrEqualTo: Timestamp.fromDate(sevenDaysAgo))
          .get();

      final Map<String, List<Map<String, dynamic>>> byDay = {};
      for (var doc in cablesSnapshot.docs) {
        final data = doc.data();
        final date = _parseDate(data['inspectionDate']);
        if (date == null) continue;
        final dayKey = '${date.year}-${date.month}-${date.day}';
        byDay.putIfAbsent(dayKey, () => []);
        byDay[dayKey]!.add(data);
      }

      return List.generate(7, (index) {
        final date = now.subtract(Duration(days: 6 - index));
        final dayKey = '${date.year}-${date.month}-${date.day}';
        final dayCables = byDay[dayKey] ?? [];
        int total = dayCables.length;
        int conform = dayCables.where((c) => (c['status'] as String? ?? '').toLowerCase() == 'conforme').length;
        return ConformityTrend(date: date, conformityRate: total > 0 ? (conform / total) * 100 : 0.0, inspectionsCount: total);
      });
    } catch (e) {
      debugPrint('Error fetching conformity trend: $e');
      return [];
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

/// Statistiques spécifiques au technicien connecté
class TechnicianStats {
  final int inspections;
  final int anomaliesDetected;
  final int anomaliesResolved;
  final double conformityRate;
  final int cablesConform;
  final int cablesNonConform;
  final Map<String, int> anomaliesByType;
  final Map<String, int> anomaliesBySeverity;

  TechnicianStats({
    required this.inspections,
    required this.anomaliesDetected,
    required this.anomaliesResolved,
    required this.conformityRate,
    required this.cablesConform,
    required this.cablesNonConform,
    required this.anomaliesByType,
    required this.anomaliesBySeverity,
  });

  factory TechnicianStats.empty() => TechnicianStats(
    inspections: 0, anomaliesDetected: 0, anomaliesResolved: 0,
    conformityRate: 0, cablesConform: 0, cablesNonConform: 0,
    anomaliesByType: {}, anomaliesBySeverity: {},
  );

  int get resolutionRate =>
      anomaliesDetected > 0 ? ((anomaliesResolved / anomaliesDetected) * 100).round() : 0;
}

/// Enregistrement d'une inspection individuelle
class InspectionRecord {
  final String id;
  final String cableCode;
  final String orderId;
  final String status;
  final DateTime inspectedAt;
  final String? technicianName;
  final int anomaliesCount;

  InspectionRecord({
    required this.id,
    required this.cableCode,
    required this.orderId,
    required this.status,
    required this.inspectedAt,
    this.technicianName,
    required this.anomaliesCount,
  });

  bool get isConform => status.toLowerCase().contains('conforme') && !status.toLowerCase().contains('non');
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
