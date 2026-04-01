import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/manufacturing_order.dart';
import '../models/cable.dart';

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

  /// Récupérer tous les ordres de fabrication
  Future<List<ManufacturingOrder>> getAllOrders() async {
    try {
      final querySnapshot =
          await _ordersCollection.orderBy('DateLiv', descending: true).get();
      return querySnapshot.docs
          .map((doc) => ManufacturingOrder.fromFirestore(doc))
          .toList();
    } catch (e) {
      debugPrint('Error fetching orders: $e');
      return [];
    }
  }

  /// Récupérer un ordre par son ID
  Future<ManufacturingOrder?> getOrderById(String id) async {
    try {
      final doc = await _ordersCollection.doc(id).get();
      if (doc.exists) {
        return ManufacturingOrder.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching order $id: $e');
      return null;
    }
  }

  /// Rechercher des ordres par référence ou numéro d'OF
  Future<List<ManufacturingOrder>> searchOrders(String query) async {
    try {
      final snapshot = await _ordersCollection.get();
      final allOrders = snapshot.docs
          .map((doc) => ManufacturingOrder.fromFirestore(doc))
          .toList();

      if (query.isEmpty) return allOrders;

      final lowercaseQuery = query.toLowerCase();
      return allOrders.where((order) {
        return order.reference.toLowerCase().contains(lowercaseQuery) ||
            order.numeroOF.toLowerCase().contains(lowercaseQuery) ||
            order.gipros.toLowerCase().contains(lowercaseQuery);
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
      final snapshot = await _ordersCollection
          .where('status', isEqualTo: status)
          .get();

      return snapshot.docs
          .map((doc) => ManufacturingOrder.fromFirestore(doc))
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

  /// Mettre à jour les compteurs d'un ordre
  Future<void> updateOrderStats(String orderId) async {
    try {
      final cables = await getOrderCables(orderId);
      int inspected = cables.where((c) => c.isInspected).length;
      int conform = cables.where((c) => c.isConform).length;
      int nonConform = inspected - conform;

      final order = await getOrderById(orderId);
      if (order == null) return;

      await _ordersCollection.doc(orderId).update({
        'inspectedCount': inspected,
        'conformCount': conform,
        'nonConformCount': nonConform,
        'status': (inspected > 0 && inspected >= order.qta)
            ? 'Terminé'
            : 'En cours'
      });
    } catch (e) {
      debugPrint('Error updating stats: $e');
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

  /// Sauvegarder un câble après inspection
  Future<String?> saveCable(Cable cable) async {
    try {
      await _cablesCollection.doc(cable.code).set(cable.toFirestore());

      // Mettre à jour les stats de l'ordre
      await updateOrderStats(cable.orderId);

      return cable.code;
    } catch (e) {
      debugPrint('Error saving cable: $e');
      return null;
    }
  }
}
