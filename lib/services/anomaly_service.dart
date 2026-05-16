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

  /// Récupérer uniquement les anomalies non résolues
  Future<List<Anomaly>> getActiveAnomalies({int limit = 50}) async {
    try {
      final snapshot = await _anomaliesCollection.get();
      final list = snapshot.docs
          .map((doc) => Anomaly.fromFirestore(doc))
          .where((a) => a.statut != 'traitee')
          .toList();
      list.sort((a, b) => b.detectedAt.compareTo(a.detectedAt));
      return list.take(limit).toList();
    } catch (e) {
      debugPrint('Error fetching active anomalies: $e');
      return [];
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
  Future<String?> createAnomaly(
    Anomaly anomaly, {
    Map<String, dynamic>? extraData,
  }) async {
    try {
      final payload = {
        ...anomaly.toFirestore(),
        if (extraData != null) ...extraData,
      };
      final docRef = await _anomaliesCollection.add(payload);

      // Créer la notification pour le dashboard Web
      await _db.collection('notifications').add({
        'type': 'anomaly_detected',
        'title': 'Anomalie ${anomaly.severity} détectée',
        'message': '${anomaly.type} sur câble ${anomaly.cableId}',
        'anomalyId': docRef.id,
        'orderId': extraData?['orderId'],
        'cableId': anomaly.cableId,
        'technicianId': anomaly.technicianId,
        'statut': 'unread',
        'createdAt': DateTime.now().toIso8601String(),
      });

      return docRef.id;
    } catch (e) {
      debugPrint('Error creating anomaly: $e');
      return null;
    }
  }

  /// Marquer une anomalie comme résolue et mettre à jour le câble associé
  Future<bool> markAsResolved(
    String anomalyId, {
    String correctiveAction = '',
  }) async {
    try {
      // 1. Récupérer les données de l'anomalie pour trouver le câble associé
      final anomalyDoc = await _anomaliesCollection.doc(anomalyId).get();
      if (!anomalyDoc.exists) return false;

      final anomalyData = anomalyDoc.data() as Map<String, dynamic>;
      final cableId = anomalyData['cableId'] as String?;
      final orderId = anomalyData['orderId'] as String?;

      // 2. Mettre à jour l'anomalie comme résolue
      await _anomaliesCollection.doc(anomalyId).update({
        'statut': 'traitee',
        'mesureCorrective': correctiveAction,
        'resolvedAt': Timestamp.fromDate(DateTime.now()),
      });

      // 3. Mettre à jour le câble associé → retour à "Conforme"
      if (cableId != null && cableId.isNotEmpty) {
        await _updateCableToConforme(cableId, orderId);
      }

      // 4. Créer la notification de résolution
      await _db.collection('notifications').add({
        'type': 'anomaly_resolved',
        'title': 'Anomalie traitée',
        'message': 'L\'anomalie sur câble $cableId a été résolue',
        'anomalyId': anomalyId,
        'orderId': orderId,
        'cableId': cableId,
        'statut': 'unread',
        'createdAt': DateTime.now().toIso8601String(),
      });

      return true;
    } catch (e) {
      debugPrint('Error marking anomaly as resolved: $e');
      return false;
    }
  }

  /// Met à jour le câble associé pour qu'il revienne "Conforme"
  /// et ajuste les compteurs de l'ordre de fabrication
  Future<void> _updateCableToConforme(String cableRef, String? orderId) async {
    try {
      // Chercher le câble par référence (le cableId stocké est la référence du câble)
      final cableQuery = await _db.collection('cable')
          .where('reference', isEqualTo: cableRef)
          .get();

      if (cableQuery.docs.isEmpty) {
        // Essayer par code
        final cableByCode = await _db.collection('cable')
            .where('code', isEqualTo: cableRef)
            .get();
        if (cableByCode.docs.isEmpty) {
          debugPrint('Cable not found for reference: $cableRef');
          return;
        }
        for (var doc in cableByCode.docs) {
          await _db.collection('cable').doc(doc.id).update({
            'status': 'Conforme (Corrigé)',
            'anomaliesCount': 0,
          });
        }
      } else {
        for (var doc in cableQuery.docs) {
          await _db.collection('cable').doc(doc.id).update({
            'status': 'Conforme (Corrigé)',
            'anomaliesCount': 0,
          });
        }
      }

      // Mettre à jour les compteurs de l'ordre si orderId est disponible
      if (orderId != null && orderId.isNotEmpty) {
        final orderDoc = await _db.collection('manufacturingOrder').doc(orderId).get();
        if (orderDoc.exists) {
          final data = orderDoc.data() as Map<String, dynamic>;
          int conformCount = _parseInt(data['conformCount']);
          int nonConformCount = _parseInt(data['nonConformCount']);

          if (nonConformCount > 0) {
            await _db.collection('manufacturingOrder').doc(orderId).update({
              'conformCount': conformCount + 1,
              'nonConformCount': nonConformCount - 1,
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error updating cable to conforme: $e');
    }
  }

  int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
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
