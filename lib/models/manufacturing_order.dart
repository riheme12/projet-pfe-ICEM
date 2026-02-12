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

  /// Créer depuis JSON
  factory ManufacturingOrder.fromJson(Map<String, dynamic> json) {
    return ManufacturingOrder(
      id: json['id'] as String,
      reference: json['reference'] as String,
      cableType: json['cableType'] as String,
      quantity: json['quantity'] as int,
      productionDate: DateTime.parse(json['productionDate'] as String),
      status: json['status'] as String,
      assignedTechnicianId: json['assignedTechnicianId'] as String?,
      inspectedCount: json['inspectedCount'] as int,
      conformCount: json['conformCount'] as int,
      nonConformCount: json['nonConformCount'] as int,
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
      'cableType': cableType,
      'quantity': quantity,
      'productionDate': productionDate.toIso8601String(),
      'status': status,
      'assignedTechnicianId': assignedTechnicianId,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }
}
