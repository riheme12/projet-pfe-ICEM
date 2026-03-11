/// Modèle représentant un ordre de fabrication
/// 
/// Un ordre de fabrication contient :
/// - Les informations de production (référence, type, quantité)
/// - Le statut de l'ordre
/// - Les statistiques de conformité
class ManufacturingOrder {
  final String id;
  final String reference;           // Ex: "OF-2024-001"
  final String cableType;           // Ex: "Câble électrique 3x2.5mm²"
  final int quantity;               // Quantité totale à produire
  final DateTime productionDate;    // Date de production
  final String status;              // 'En cours', 'Terminé', 'En attente'
  final String? assignedTechnicianId;
  final int inspectedCount;         // Nombre de câbles déjà inspectés
  final int conformCount;           // Nombre de câbles conformes
  final int nonConformCount;        // Nombre de câbles non conformes

  ManufacturingOrder({
    required this.id,
    required this.reference,
    required this.cableType,
    required this.quantity,
    required this.productionDate,
    required this.status,
    this.assignedTechnicianId,
    required this.inspectedCount,
    required this.conformCount,
    required this.nonConformCount,
  });

  /// Calculer le taux de conformité de cet ordre (0-100)
  double get conformityRate {
    if (inspectedCount == 0) return 0.0;
    return (conformCount / inspectedCount) * 100;
  }

  /// Calculer le pourcentage de progression (0-100)
  double get progressPercentage {
    if (quantity == 0) return 0.0;
    return (inspectedCount / quantity) * 100;
  }

  /// Vérifier si l'ordre est terminé
  bool get isCompleted => inspectedCount >= quantity;

  /// Créer depuis JSON (Mapping Firestore)
  factory ManufacturingOrder.fromJson(Map<String, dynamic> json) {
    return ManufacturingOrder(
      id: json['id'] as String,
      reference: json['reference']?.toString() ?? json['numeroOF']?.toString() ?? 'Inconnue',
      cableType: json['cableType']?.toString() ?? json['NumComd']?.toString() ?? json['client']?.toString() ?? 'Inconnu',
      quantity: (json['quantity'] ?? json['QTA'] ?? 0) as int,
      productionDate: json['productionDate'] != null 
          ? DateTime.parse(json['productionDate'] as String)
          : (json['DateLiv'] != null ? DateTime.parse(json['DateLiv'] as String) : DateTime.now()),
      status: _mapStatus(json['status']?.toString() ?? 'En attente'),
      assignedTechnicianId: json['assignedTechnicianId'] as String? ?? json['ligne'] as String?,
      inspectedCount: (json['inspectedCount'] ?? 0) as int,
      conformCount: (json['conformCount'] ?? 0) as int,
      nonConformCount: (json['nonConformCount'] ?? 0) as int,
    );
  }

  static String _mapStatus(String status) {
    final s = status.toLowerCase();
    if (s == 'en cours') return 'En cours';
    if (s == 'terminé' || s == 'termine') return 'Terminé';
    return 'En attente';
  }

  /// Convertir en JSON (Mapping Firestore)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
      'NumComd': cableType, // Sync with Firestore NumComd
      'QTA': quantity,      // Sync with Firestore QTA
      'DateLiv': productionDate.toIso8601String(),
      'status': status.toLowerCase(),
      'assignedTechnicianId': assignedTechnicianId,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }
}
