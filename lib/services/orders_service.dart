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

  // Liste des ordres simulés
  final List<ManufacturingOrder> _orders = _generateMockOrders();

  /// Récupérer tous les ordres de fabrication
  Future<List<ManufacturingOrder>> getAllOrders() async {
    await Future.delayed(const Duration(milliseconds: 600));
    return List.from(_orders);
  }

  /// Récupérer un ordre par son ID
  Future<ManufacturingOrder?> getOrderById(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      return _orders.firstWhere((order) => order.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Rechercher des ordres par référence ou type de câble
  Future<List<ManufacturingOrder>> searchOrders(String query) async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    if (query.isEmpty) return _orders;
    
    final lowerQuery = query.toLowerCase();
    return _orders.where((order) {
      return order.reference.toLowerCase().contains(lowerQuery) ||
          order.cableType.toLowerCase().contains(lowerQuery);
    }).toList();
  }

  /// Filtrer les ordres par statut
  Future<List<ManufacturingOrder>> filterOrders(String status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    if (status == 'Tous') return _orders;
    
    return _orders.where((order) => order.status == status).toList();
  }

  /// Récupérer les câbles d'un ordre
  Future<List<Cable>> getOrderCables(String orderId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return _generateMockCables(orderId);
  }

  /// Générer des ordres de fabrication simulés
  static List<ManufacturingOrder> _generateMockOrders() {
    final now = DateTime.now();
    
    return [
      ManufacturingOrder(
        id: 'order_001',
        reference: 'OF-2024-001',
        cableType: 'Câble électrique 3x2.5mm²',
        quantity: 100,
        productionDate: now.subtract(const Duration(days: 2)),
        status: 'En cours',
        assignedTechnicianId: 'user_001',
        inspectedCount: 65,
        conformCount: 62,
        nonConformCount: 3,
      ),
      ManufacturingOrder(
        id: 'order_002',
        reference: 'OF-2024-002',
        cableType: 'Câble réseau Cat6 UTP',
        quantity: 200,
        productionDate: now.subtract(const Duration(days: 5)),
        status: 'Terminé',
        assignedTechnicianId: 'user_001',
        inspectedCount: 200,
        conformCount: 195,
        nonConformCount: 5,
      ),
      ManufacturingOrder(
        id: 'order_003',
        reference: 'OF-2024-003',
        cableType: 'Câble coaxial RG6',
        quantity: 150,
        productionDate: now.subtract(const Duration(days: 1)),
        status: 'En cours',
        assignedTechnicianId: 'user_001',
        inspectedCount: 45,
        conformCount: 44,
        nonConformCount: 1,
      ),
      ManufacturingOrder(
        id: 'order_004',
        reference: 'OF-2024-004',
        cableType: 'Câble fibre optique monomode',
        quantity: 80,
        productionDate: now,
        status: 'En attente',
        assignedTechnicianId: 'user_001',
        inspectedCount: 0,
        conformCount: 0,
        nonConformCount: 0,
      ),
      ManufacturingOrder(
        id: 'order_005',
        reference: 'OF-2024-005',
        cableType: 'Câble électrique 5x1.5mm²',
        quantity: 120,
        productionDate: now.subtract(const Duration(days: 7)),
        status: 'Terminé',
        assignedTechnicianId: 'user_001',
        inspectedCount: 120,
        conformCount: 118,
        nonConformCount: 2,
      ),
      ManufacturingOrder(
        id: 'order_006',
        reference: 'OF-2024-006',
        cableType: 'Câble téléphonique 4 paires',
        quantity: 90,
        productionDate: now.subtract(const Duration(days: 3)),
        status: 'En cours',
        assignedTechnicianId: 'user_001',
        inspectedCount: 30,
        conformCount: 29,
        nonConformCount: 1,
      ),
      ManufacturingOrder(
        id: 'order_007',
        reference: 'OF-2024-007',
        cableType: 'Câble blindé 3x4mm²',
        quantity: 60,
        productionDate: now.add(const Duration(days: 1)),
        status: 'En attente',
        assignedTechnicianId: 'user_001',
        inspectedCount: 0,
        conformCount: 0,
        nonConformCount: 0,
      ),
      ManufacturingOrder(
        id: 'order_008',
        reference: 'OF-2024-008',
        cableType: 'Câble audio multipaire',
        quantity: 75,
        productionDate: now.subtract(const Duration(days: 4)),
        status: 'En cours',
        assignedTechnicianId: 'user_001',
        inspectedCount: 50,
        conformCount: 48,
        nonConformCount: 2,
      ),
    ];
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
        id: 'cable_${orderId}_$i',
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
