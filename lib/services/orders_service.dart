import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/manufacturing_order.dart';
import '../models/cable.dart';
import '../models/electrical_checklist.dart';

/// Service pour gérer les ordres de fabrication (Optimisé pour la vitesse)
class OrdersService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final OrdersService _instance = OrdersService._internal();
  factory OrdersService() => _instance;
  late final CollectionReference _ordersCollection;
  late final CollectionReference _cablesCollection;

  OrdersService._internal() {
    _ordersCollection = _db.collection('manufacturingOrder');
    _cablesCollection = _db.collection('cable');
  }

  // ─── Cache mémoire ──────────────────────────────────────────────────
  List<ManufacturingOrder>? _cachedOrders;
  DateTime? _cachedOrdersAt;
  static const _cacheTtl = Duration(seconds: 30);

  /// Récupérer tous les ordres avec stats dynamiques (OPTIMISÉ)
  Future<List<ManufacturingOrder>> getAllOrders({bool forceRefresh = false}) async {
    // Vérifier le cache
    if (!forceRefresh && _cachedOrders != null && _cachedOrdersAt != null &&
        DateTime.now().difference(_cachedOrdersAt!) < _cacheTtl) {
      return _cachedOrders!;
    }

    try {
      // 1. Récupérer les ordres (léger)
      final ordersSnapshot = await _ordersCollection.orderBy('DateLiv', descending: true).get();
      final baseOrders = ordersSnapshot.docs.map((doc) => ManufacturingOrder.fromFirestore(doc)).toList();
      if (baseOrders.isEmpty) return [];

      // 2. Récupérer les câbles par chunks de 10 (limite Firestore whereIn)
      final ofNumbers = baseOrders.map((o) => o.numeroOF).toSet().toList();
      final Map<String, List<Map<String, dynamic>>> cablesByOF = {};

      // Diviser en chunks de 10 pour Firestore
      for (var i = 0; i < ofNumbers.length; i += 10) {
        final chunk = ofNumbers.sublist(i, (i + 10).clamp(0, ofNumbers.length));
        final snap = await _cablesCollection.where('orderId', whereIn: chunk).get();
        for (var doc in snap.docs) {
          final data = doc.data() as Map<String, dynamic>;
          final of = data['orderId']?.toString() ?? '';
          cablesByOF.putIfAbsent(of, () => []);
          cablesByOF[of]!.add(data);
        }
      }

      // 3. Mapper les stats
      final result = baseOrders.map((order) {
        final cables = cablesByOF[order.numeroOF] ?? [];
        int conform = 0, nonConform = 0;
        for (var c in cables) {
          final status = c['status']?.toString().toLowerCase() ?? '';
          if (status == 'conforme' || status == 'conforme (corrigé)') conform++;
          else if (status == 'non conforme') nonConform++;
        }
        return ManufacturingOrder(
          id: order.id, reference: order.reference, status: order.status,
          inspectedCount: conform + nonConform, conformCount: conform, nonConformCount: nonConform,
          numeroOF: order.numeroOF, gipros: order.gipros, ligne: order.ligne,
          client: order.client, numComd: order.numComd, qta: order.qta, dateLiv: order.dateLiv,
        );
      }).toList();

      // Cache
      _cachedOrders = result;
      _cachedOrdersAt = DateTime.now();
      return result;
    } catch (e) {
      debugPrint('Error getAllOrders: $e');
      return [];
    }
  }

  /// Récupérer un ordre par son ID
  Future<ManufacturingOrder?> getOrderById(String id) async {
    try {
      final doc = await _ordersCollection.doc(id).get();
      if (!doc.exists) return null;
      final order = ManufacturingOrder.fromFirestore(doc);
      return order;
    } catch (e) {
      return null;
    }
  }

  /// Récupérer les câbles d'un ordre
  Future<List<Cable>> getOrderCables(String orderId) async {
    try {
      final querySnapshot = await _cablesCollection.where('orderId', isEqualTo: orderId).get();
      return querySnapshot.docs.map((doc) => Cable.fromFirestore(doc)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Sauvegarder un câble après inspection
  Future<String?> saveCable({
    required String reference,
    required String code,
    required String orderId,
    required String status,
    required String technicianId,
    required String technicianName,
    int anomaliesCount = 0,
    String? imageUrl,
    List<Map<String, dynamic>>? visualChecklistItems,
  }) async {
    try {
      final now = DateTime.now();
      final cableData = {
        'reference': reference,
        'code': code,
        'orderId': orderId,
        'status': status,
        'inspectionDate': Timestamp.fromDate(now),
        'technicianId': technicianId,
        'technicianName': technicianName,
        'imageUrls': imageUrl != null ? [imageUrl] : <String>[],
        'anomaliesCount': anomaliesCount,
        if (visualChecklistItems != null) 'visualChecklist': visualChecklistItems,
      };
      final docRef = await _cablesCollection.add(cableData);

      // Créer un rapport d'inspection dans Firestore
      await _db.collection('report').add({
        'type': 'inspection',
        'cableId': code,
        'orderId': orderId,
        'technicianId': technicianId,
        'technicianName': technicianName,
        'generatedAt': Timestamp.fromDate(now),
        'conformityStatus': status,
        'anomaliesCount': anomaliesCount,
      });

      return docRef.id;
    } catch (e) {
      debugPrint('Error saveCable: $e');
      return null;
    }
  }

  // ─── Checklist Électrique ───
  Future<String?> saveElectricalChecklist(ElectricalChecklist checklist) async {
    try {
      final docRef = await _db.collection('electrical_checklists').add(checklist.toFirestore());
      await _ordersCollection.doc(checklist.orderId).update({
        'electricalCheckDone': true,
        'electricalCheckStatus': checklist.status,
      });
      return docRef.id;
    } catch (e) {
      return null;
    }
  }

  Future<ElectricalChecklist?> getElectricalChecklistForOrder(String orderId) async {
    try {
      final snapshot = await _db.collection('electrical_checklists').where('orderId', isEqualTo: orderId).limit(1).get();
      if (snapshot.docs.isEmpty) return null;
      return ElectricalChecklist.fromFirestore(snapshot.docs.first);
    } catch (e) {
      return null;
    }
  }
}
