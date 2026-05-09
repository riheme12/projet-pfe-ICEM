import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/manufacturing_order.dart';
import '../models/cable.dart';
import '../models/electrical_checklist.dart';

/// Service pour gérer les ordres de fabrication via Firestore
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

  /// Récupérer tous les ordres de fabrication avec des statistiques dynamiques
  Future<List<ManufacturingOrder>> getAllOrders() async {
    try {
      final querySnapshot = await _ordersCollection
          .orderBy('DateLiv', descending: true)
          .get();
      
      return await _processOrdersWithDynamicStats(querySnapshot.docs);
    } catch (e) {
      debugPrint('Error fetching orders (with orderBy): $e');
      // Fallback: essayer sans orderBy (si l'index Firestore n'existe pas encore)
      try {
        final snapshot = await _ordersCollection.get();
        return await _processOrdersWithDynamicStats(snapshot.docs);
      } catch (e2) {
        debugPrint('Error fetching orders (fallback): $e2');
        return [];
      }
    }
  }

  Future<List<ManufacturingOrder>> _processOrdersWithDynamicStats(List<QueryDocumentSnapshot> docs) async {
    final List<ManufacturingOrder> orders = [];
    
    // Process in parallel to reduce load time
    await Future.wait(docs.map((doc) async {
      var order = ManufacturingOrder.fromFirestore(doc);
      
      try {
        final cablesSnapshot = await _cablesCollection.where('orderId', isEqualTo: order.numeroOF).get();
        int inspected = 0;
        int conform = 0;
        int nonConform = 0;
        
        for (var cDoc in cablesSnapshot.docs) {
           final status = (cDoc.data() as Map<String, dynamic>)['status']?.toString().toLowerCase() ?? '';
           if (status == 'conforme') {
             conform++;
             inspected++;
           } else if (status == 'non conforme') {
             nonConform++;
             inspected++;
           }
        }
        
        orders.add(ManufacturingOrder(
          id: order.id,
          reference: order.reference,
          status: order.status,
          inspectedCount: inspected,
          conformCount: conform,
          nonConformCount: nonConform,
          numeroOF: order.numeroOF,
          gipros: order.gipros,
          ligne: order.ligne,
          client: order.client,
          numComd: order.numComd,
          qta: order.qta,
          dateLiv: order.dateLiv,
        ));
      } catch (e) {
        orders.add(order); // Fallback to static data on error
      }
    }));
    
    // Re-sort because Future.wait might return out of order
    orders.sort((a, b) => b.dateLiv.compareTo(a.dateLiv));
    return orders;
  }

  /// Récupérer un ordre par son ID
  Future<ManufacturingOrder?> getOrderById(String id) async {
    try {
      final doc = await _ordersCollection.doc(id).get();
      if (!doc.exists) return null;
      
      final orders = await _processOrdersWithDynamicStats([doc as QueryDocumentSnapshot]);
      return orders.isNotEmpty ? orders.first : null;
    } catch (e) {
      debugPrint('Error fetching order $id: $e');
      return null;
    }
  }

  /// Rechercher des ordres par référence, numéro d'OF, ou Gipros
  Future<List<ManufacturingOrder>> searchOrders(String query) async {
    if (query.isEmpty) return getAllOrders();

    try {
      final snapshot = await _ordersCollection.get();
      final allOrders = await _processOrdersWithDynamicStats(snapshot.docs);

      final lowerQuery = query.toLowerCase();
      return allOrders.where((order) {
        return order.reference.toLowerCase().contains(lowerQuery) ||
            order.gipros.toLowerCase().contains(lowerQuery) ||
            order.numeroOF.toLowerCase().contains(lowerQuery) ||
            order.numComd.toLowerCase().contains(lowerQuery);
      }).toList();
    } catch (e) {
      debugPrint('Error searching orders: $e');
      return [];
    }
  }

  /// Filtrer les ordres par statut
  Future<List<ManufacturingOrder>> filterOrders(String status) async {
    if (status == 'Tous') return getAllOrders();

    try {
      final allOrders = await getAllOrders();
      final normalizedStatus = status.toLowerCase();
      return allOrders
          .where((order) => order.status.toLowerCase() == normalizedStatus)
          .toList();
    } catch (e) {
      debugPrint('Error filtering orders: $e');
      return [];
    }
  }

  /// Ajouter un ordre
  Future<void> addOrder(ManufacturingOrder order) async {
    try {
      if (order.numeroOF.isEmpty) {
        await _ordersCollection.add(order.toFirestore());
      } else {
        await _ordersCollection.doc(order.numeroOF).set(order.toFirestore());
      }
    } catch (e) {
      debugPrint('Error adding order: $e');
      rethrow;
    }
  }

  /// Récupérer les câbles d'un ordre
  Future<List<Cable>> getOrderCables(String orderId) async {
    try {
      final querySnapshot = await _cablesCollection
          .where('orderId', isEqualTo: orderId)
          .get();

      return querySnapshot.docs
          .map((doc) => Cable.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error fetching cables for order $orderId: $e');
      return [];
    }
  }

  /// Sauvegarder un câble après inspection (lié à son ordre)
  Future<String?> saveCable({
    required String reference,
    required String code,
    required String orderId,
    required String status,
    required String technicianId,
    required String technicianName,
    int anomaliesCount = 0,
    String? imageUrl, // Ajout de l'URL de l'image
    List<Map<String, dynamic>>? visualChecklistItems,
  }) async {
    try {
      final cableData = {
        'reference': reference,
        'code': code,
        'orderId': orderId,
        'status': status,
        'inspectionDate': Timestamp.fromDate(DateTime.now()),
        'technicianId': technicianId,
        'technicianName': technicianName,
        'imageUrls': imageUrl != null ? [imageUrl] : <String>[],
        'anomaliesCount': anomaliesCount,
        if (visualChecklistItems != null)
          'visualChecklist': visualChecklistItems,
      };
      final docRef = await _db.collection('cable').add(cableData);

      // Mettre à jour les stats de l'ordre
      await _updateOrderStats(orderId, status == 'Conforme');

      return docRef.id;
    } catch (e) {
      debugPrint('Error saving cable: $e');
      return null;
    }
  }

  /// Mettre à jour les statistiques de l'ordre après inspection d'un câble
  Future<void> _updateOrderStats(String orderId, bool isConform) async {
    try {
      final doc = await _ordersCollection.doc(orderId).get();
      if (!doc.exists) return;

      final data = doc.data() as Map<String, dynamic>;

      int parseInt(dynamic value) {
        if (value == null) return 0;
        if (value is int) return value;
        if (value is String) return int.tryParse(value) ?? 0;
        if (value is double) return value.toInt();
        return 0;
      }

      final inspected = parseInt(data['inspectedCount']);
      final conform = parseInt(data['conformCount']);
      final nonConform = parseInt(data['nonConformCount']);
      final qta = parseInt(data['QTA']);

      final newInspected = inspected + 1;

      await _ordersCollection.doc(orderId).update({
        'inspectedCount': newInspected,
        'conformCount': isConform ? conform + 1 : conform,
        'nonConformCount': isConform ? nonConform : nonConform + 1,
        'status': newInspected >= qta ? 'Terminé' : 'En cours',
      });
    } catch (e) {
      debugPrint('Error updating order stats: $e');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CHECKLIST ÉLECTRIQUE
  // ─────────────────────────────────────────────────────────────────

  /// Sauvegarder une checklist électrique dans Firestore
  Future<String?> saveElectricalChecklist(ElectricalChecklist checklist) async {
    try {
      final docRef = await _db
          .collection('electrical_checklists')
          .add(checklist.toFirestore());

      await _ordersCollection.doc(checklist.orderId).update({
        'electricalCheckDone': true,
        'electricalCheckDate': Timestamp.fromDate(checklist.date),
        'electricalCheckStatus': checklist.status,
        'electricalControleurId': checklist.controleurId,
      });

      return docRef.id;
    } catch (e) {
      debugPrint('Error saving electrical checklist: $e');
      return null;
    }
  }

  /// Récupérer la checklist électrique d'un ordre
  Future<ElectricalChecklist?> getElectricalChecklistForOrder(
      String orderId) async {
    try {
      final snapshot = await _db
          .collection('electrical_checklists')
          .where('orderId', isEqualTo: orderId)
          .orderBy('date', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) return null;
      return ElectricalChecklist.fromFirestore(snapshot.docs.first);
    } catch (e) {
      debugPrint('Error fetching electrical checklist for order $orderId: $e');
      return null;
    }
  }

  /// Vérifier si un ordre a déjà une checklist électrique complète
  Future<bool> hasElectricalCheckForOrder(String orderId) async {
    try {
      final snapshot = await _db
          .collection('electrical_checklists')
          .where('orderId', isEqualTo: orderId)
          .limit(1)
          .get();
      return snapshot.docs.isNotEmpty;
    } catch (e) {
      debugPrint('Error checking electrical check for order $orderId: $e');
      return false;
    }
  }
}
