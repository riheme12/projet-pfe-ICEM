import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/manufacturing_order.dart';
import '../models/cable.dart';

/// Service pour gérer les ordres de fabrication via Firestore
class OrdersService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton
  static final OrdersService _instance = OrdersService._internal();
  factory OrdersService() => _instance;
  OrdersService._internal();

  /// Récupérer tous les ordres de fabrication
  Future<List<ManufacturingOrder>> getAllOrders() async {
    try {
      final snapshot = await _db
          .collection('manufacturingOrder')
          .orderBy('productionDate', descending: true)
          .get();
          
      return snapshot.docs.map((doc) {
        return ManufacturingOrder.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  /// Récupérer un ordre par son ID
  Future<ManufacturingOrder?> getOrderById(String id) async {
    try {
      final doc = await _db.collection('manufacturingOrder').doc(id).get();
      if (!doc.exists) return null;
      return ManufacturingOrder.fromJson({'id': doc.id, ...doc.data() as Map<String, dynamic>});
    } catch (e) {
      print('Error fetching order $id: $e');
      return null;
    }
  }

  /// Rechercher des ordres par référence ou type de câble
  Future<List<ManufacturingOrder>> searchOrders(String query) async {
    if (query.isEmpty) return getAllOrders();
    
    // Firestore doesn't support partial string match with 'contains' efficiently
    // So we fetch all and filter client side, or use a simple prefix match if reference starts with query
    try {
      final allOrders = await getAllOrders();
      final lowerQuery = query.toLowerCase();
      return allOrders.where((order) {
        return order.reference.toLowerCase().contains(lowerQuery) ||
            order.cableType.toLowerCase().contains(lowerQuery);
      }).toList();
    } catch (e) {
      print('Error searching orders: $e');
      return [];
    }
  }

  /// Filtrer les ordres par statut
  Future<List<ManufacturingOrder>> filterOrders(String status) async {
    if (status == 'Tous') return getAllOrders();
    
    try {
      final snapshot = await _db
          .collection('manufacturingOrder')
          .where('status', isEqualTo: status.toLowerCase())
          .get();
          
      return snapshot.docs.map((doc) {
        return ManufacturingOrder.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
    } catch (e) {
      print('Error filtering orders: $e');
      return [];
    }
  }

  /// Récupérer les câbles d'un ordre
  Future<List<Cable>> getOrderCables(String orderId) async {
    try {
      final snapshot = await _db
          .collection('cable')
          .where('orderId', isEqualTo: orderId)
          .get();
          
      return snapshot.docs.map((doc) {
        return Cable.fromJson({'id': doc.id, ...doc.data()});
      }).toList();
    } catch (e) {
      print('Error fetching cables for order $orderId: $e');
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
    int anomaliesCount = 0,
  }) async {
    try {
      final cableData = {
        'reference': reference,
        'code': code,
        'orderId': orderId,
        'status': status,
        'inspectionDate': DateTime.now().toIso8601String(),
        'technicianId': technicianId,
        'imageUrls': [],
        'anomaliesCount': anomaliesCount,
      };
      final docRef = await _db.collection('cable').add(cableData);
      
      // Mettre à jour les stats de l'ordre
      await _updateOrderStats(orderId, status == 'Conforme');
      
      return docRef.id;
    } catch (e) {
      print('Error saving cable: $e');
      return null;
    }
  }

  /// Mettre à jour les statistiques de l'ordre après inspection d'un câble
  Future<void> _updateOrderStats(String orderId, bool isConform) async {
    try {
      final doc = await _db.collection('manufacturingOrder').doc(orderId).get();
      if (!doc.exists) return;

      final data = doc.data() as Map<String, dynamic>;
      final inspected = (data['inspectedCount'] ?? 0) as int;
      final conform = (data['conformCount'] ?? 0) as int;
      final nonConform = (data['nonConformCount'] ?? 0) as int;

      await _db.collection('manufacturingOrder').doc(orderId).update({
        'inspectedCount': inspected + 1,
        'conformCount': isConform ? conform + 1 : conform,
        'nonConformCount': isConform ? nonConform : nonConform + 1,
      });
    } catch (e) {
      print('Error updating order stats: $e');
    }
  }
}

