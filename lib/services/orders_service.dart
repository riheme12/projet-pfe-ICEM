import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/manufacturing_order.dart';
import '../models/cable.dart';

/// Service pour gérer les ordres de fabrication
/// 
/// Fournit des données simulées pour le développement
/// Sera connecté à Firebase plus tard
class OrdersService {
  // Singleton
  static final OrdersService _instance = OrdersService._internal();
  factory OrdersService() => _instance;
  OrdersService._internal();

  final CollectionReference _ordersCollection = 
      FirebaseFirestore.instance.collection('manufacturingOrder');
  final CollectionReference _cablesCollection = 
      FirebaseFirestore.instance.collection('cable');

  /// Récupérer tous les ordres de fabrication
  Future<List<manufacturingOrder>> getAllOrders() async {
    try {
      final querySnapshot = await _ordersCollection.orderBy('DateLiv', descending: true).get();
      print('Found ${querySnapshot.docs.length} orders in Firestore');
      return querySnapshot.docs
          .map((doc) => manufacturingOrder.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  /// Récupérer un ordre par son ID
  Future<manufacturingOrder?> getOrderById(String id) async {
    try {
      final doc = await _ordersCollection.doc(id).get();
      if (doc.exists) {
        return manufacturingOrder.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      print('Error fetching order $id: $e');
      return null;
    }
  }

  /// Rechercher des ordres par référence ou type de câble
  /// Note: Firestore ne supporte pas la recherche "contains" nativement de manière simple.
  /// Pour une vraie recherche, il faudrait utiliser Algolia ou ElasticSearch.
  /// Ici, on filtre en mémoire après avoir récupéré les données (simulé) ou on utilise des astuces.
  /// Pour l'instant, on récupère tout et on filtre en local ce qui est OK pour un petit dataset.
  Future<List<manufacturingOrder>> searchOrders(String query) async {
    if (query.isEmpty) return getAllOrders();
    
    // Optimisation : Idéalement, ne pas tout charger. 
    // Mais pour "contains", on doit souvent le faire côté client avec Firestore standard.
    final allOrders = await getAllOrders();
    final lowerQuery = query.toLowerCase();
    
    return allOrders.where((order) {
      return order.reference.toLowerCase().contains(lowerQuery) ||
          order.Gipros.toLowerCase().contains(lowerQuery) ||
          order.numeroOF.toLowerCase().contains(lowerQuery);
    }).toList();
  }

  /// Filtrer les ordres par statut
  Future<List<manufacturingOrder>> filterOrders(String status) async {
    if (status == 'Tous') return getAllOrders();
    
    try {
      final normalizedStatus = status.toLowerCase();
      final querySnapshot = await _ordersCollection
          .where('status', isEqualTo: normalizedStatus)
          .orderBy('DateLiv', descending: true)
          .get();
      
      return querySnapshot.docs
          .map((doc) => manufacturingOrder.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('Error filtering orders: $e');
      return [];
    }
  }

  /// Ajouter un ordre (Méthode utilitaire)
  Future<void> addOrder(manufacturingOrder order) async {
    try {
      // Utiliser set avec l'ID de l'ordre, ou add si l'ID est auto-généré
      if (order.numeroOF.isEmpty) {
         await _ordersCollection.add(order.toFirestore());
      } else {
         await _ordersCollection.doc(order.numeroOF).set(order.toFirestore());
      }
    } catch (e) {
      print('Error adding order: $e');
      rethrow;
    }
  }

  /// Seed initial data (Pour initialiser la base si vide)
  Future<void> seedMockData() async {
    // Seed Orders
    final mockOrders = _generateMockOrders();
    for (var order in mockOrders) {
      final doc = await _ordersCollection.doc(order.numeroOF).get();
      if (!doc.exists) {
        await _ordersCollection.doc(order.numeroOF).set(order.toFirestore());
        
        // Seed Cables for this order
        final mockCables = _generateMockCables(order.numeroOF);
        for (var cable in mockCables) {
             await _cablesCollection.doc(cable.code).set(cable.toFirestore());
        }
      }
    }
  }

  /// Mettre à jour les compteurs d'un ordre (après inspection)
  Future<void> updateOrderStats(String orderId, int inspected, int conform, int nonConform) async {
      try {
        final order = await getOrderById(orderId);
        if (order == null) return;

        await _ordersCollection.doc(orderId).update({
          'inspectedCount': inspected,
          'conformCount': conform,
          'nonConformCount': nonConform,
          'status': (inspected > 0 && inspected >= order.QTA) 
              ? 'Terminé' 
              : 'En cours' 
        });
      } catch (e) {
        print('Error updating stats: $e');
      }
  }
 
  static List<manufacturingOrder> _generateMockOrders() {
    final now = DateTime.now();
    
    return [
      manufacturingOrder(
        numeroOF: 'OF-2024-001',
        Gipros: 'G-101',
        reference: 'CAB-3x2.5',
        ligne: 'Ligne 1',
        Client: 'Schneider Electric',
        NumComd: 'CMD-8821',
        QTA: 100,
        DateLiv: now.subtract(const Duration(days: 2)),
        status: 'En cours',
        inspectedCount: 65,
        conformCount: 62,
        nonConformCount: 3,
      ),
      manufacturingOrder(
        numeroOF: 'OF-2024-002',
        Gipros: 'G-102',
        reference: 'CAT6-UTP',
        ligne: 'Ligne 2',
        Client: 'D-Link',
        NumComd: 'CMD-8822',
        QTA: 200,
        DateLiv: now.subtract(const Duration(days: 5)),
        status: 'Terminé',
        inspectedCount: 200,
        conformCount: 195,
        nonConformCount: 5,
      ),
      manufacturingOrder(
        numeroOF: 'OF-2024-003',
        Gipros: 'G-103',
        reference: 'RG6-COAX',
        ligne: 'Ligne 1',
        Client: 'TP-Link',
        NumComd: 'CMD-8823',
        QTA: 150,
        DateLiv: now.subtract(const Duration(days: 1)),
        status: 'En cours',
        inspectedCount: 45,
        conformCount: 44,
        nonConformCount: 1,
      ),
      manufacturingOrder(
        numeroOF: 'OF-2024-004',
        Gipros: 'G-104',
        reference: 'FIB-SINGLE',
        ligne: 'Ligne 3',
        Client: 'Cisco',
        NumComd: 'CMD-8824',
        QTA: 80,
        DateLiv: now,
        status: 'En attente',
        inspectedCount: 0,
        conformCount: 0,
        nonConformCount: 0,
      ),
    ];
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
      print('Error fetching cables for order $orderId: $e');
      return [];
    }
  }  

  /// Générer des câbles simulés pour un ordre
  static List<Cable> _generateMockCables(String orderId) {
    final now = DateTime.now();
    final cables = <Cable>[];
    
    // Générer 10 câbles d'exemple
    for (int i = 1; i <= 10; i++) {
      final isInspected = i <= 7; // 7 premiers sont inspectés
      final isConform = i <= 6;   // 6 premiers sont conformes
      
      cables.add(Cable(
        reference: 'CAB-${i.toString().padLeft(3, '0')}',
        code: 'CODE-${orderId.toUpperCase()}-$i',
        orderId: orderId,
        status: !isInspected
            ? 'En attente'
            : (isConform ? 'Conforme' : 'Non conforme'),
        inspectionDate: isInspected
            ? now.subtract(Duration(hours: 24 - i))
            : null,
        technicianId: isInspected ? 'user_001' : null,
        imageUrls: isInspected ? ['image_$i.jpg'] : [],
        anomaliesCount: isConform ? 0 : (i % 3 + 1),
      ));
    }
    
    return cables;
  }
}
