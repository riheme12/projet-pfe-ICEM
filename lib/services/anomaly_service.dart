import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/anomaly.dart';

/// Service pour gérer les anomalies détectées via Firestore
class AnomalyService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final AnomalyService _instance = AnomalyService._internal();
  factory AnomalyService() => _instance;
  late final CollectionReference _anomaliesCollection;

  AnomalyService._internal() {
    _anomaliesCollection = _db.collection('anomaly');
  }

  /// Récupérer toutes les anomalies détectées
  Future<List<Anomaly>> getRecentAnomalies({int limit = 20}) async {
    try {
      final querySnapshot = await _anomaliesCollection
          .orderBy('detectedAt', descending: true)
          .limit(limit)
          .get();
      
      return querySnapshot.docs
          .map((doc) => Anomaly.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error fetching recent anomalies: $e');
      // Fallback si l'index n'est pas encore créé
      try {
        final snapshot = await _anomaliesCollection.get();
        final list = snapshot.docs
            .map((doc) => Anomaly.fromFirestore(doc))
            .toList();
        list.sort((a, b) => b.detectedAt.compareTo(a.detectedAt));
        return list.take(limit).toList();
      } catch (e2) {
        debugPrint('Error fetching anomalies (fallback): $e2');
        return [];
      }
    }
  }

  /// Récupérer les anomalies d'un câble spécifique
  Future<List<Anomaly>> getAnomaliesByCable(String cableId) async {
    try {
      final querySnapshot = await _anomaliesCollection
          .where('cableId', isEqualTo: cableId)
          .get();
      
      return querySnapshot.docs
          .map((doc) => Anomaly.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error fetching anomalies for cable $cableId: $e');
      return [];
    }
  }

  /// Enregistrer une nouvelle anomalie détectée
  Future<String?> createAnomaly(Anomaly anomaly) async {
    try {
      final docRef = await _anomaliesCollection.add(anomaly.toFirestore());
      return docRef.id;
    } catch (e) {
      debugPrint('Error creating anomaly: $e');
      return null;
    }
  }

  /// Récupérer les statistiques des anomalies par gravité
  Future<Map<String, int>> getSeverityStats() async {
    try {
      final snapshot = await _anomaliesCollection.get();
      final stats = {
        'Critique': 0,
        'Majeur': 0,
        'Mineur': 0,
      };

      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        final severity = data['severity'] as String?;
        if (severity != null && stats.containsKey(severity)) {
          stats[severity] = stats[severity]! + 1;
        }
      }
      return stats;
    } catch (e) {
      debugPrint('Error fetching anomaly stats: $e');
      return {};
    }
  }
}
