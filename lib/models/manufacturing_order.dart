import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un ordre de fabrication
/// 
/// Un ordre de fabrication contient :
/// - Les informations de production (référence, type, quantité)
/// - Le statut de l'ordre
/// - Les statistiques de conformité
class ManufacturingOrder {
  final String numeroOF;
  final String gipros;
  final String reference;
  final String? ligne;
  final String client;
  final String numComd;
  final int qta;               // Quantité totale à produire
  final DateTime dateLiv;    // Date de production
  final String status;              // 'En cours', 'Terminé', 'En attente'
  final int inspectedCount;         // Nombre de câbles déjà inspectés
  final int conformCount;           // Nombre de câbles conformes
  final int nonConformCount;        // Nombre de câbles non conformes

  ManufacturingOrder({
    required this.reference,
    required this.status,
    required this.inspectedCount,
    required this.conformCount,
    required this.nonConformCount,
    required this.numeroOF,
    required this.gipros,
    required this.ligne,
    required this.client,
    required this.numComd,
    required this.qta,
    required this.dateLiv,
  });

  /// Calculer le taux de conformité de cet ordre (0-100)
  double get conformityRate {
    if (inspectedCount == 0) return 0.0;
    return (conformCount / inspectedCount) * 100;
  }

  /// Calculer le pourcentage de progression (0-100)
  double get progressPercentage {
    if (qta == 0) return 0.0;
    return (inspectedCount / qta) * 100;
  }

  /// Vérifier si l'ordre est terminé
  bool get isCompleted => inspectedCount >= qta;

  /// Créer depuis Firestore (DocumentSnapshot)
  factory ManufacturingOrder.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    
    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      if (value is double) return value.toInt();
      return 0;
    }

    return ManufacturingOrder(
      numeroOF: data['numeroOF'] as String? ?? doc.id,
      gipros: data['Gi pros'] as String? ?? data['Gipros'] as String? ?? '',
      reference: data['reference'] as String? ?? '',
      ligne: data['ligne'] as String? ?? '',
      client: data['Client'] as String? ?? data['client'] as String? ?? '',
      numComd: data['NumComd'] as String? ?? '',
      qta: parseInt(data['QTA'] ?? data['quantity']),
      dateLiv: data['DateLiv'] != null && data['DateLiv'] is Timestamp 
          ? (data['DateLiv'] as Timestamp).toDate() 
          : (data['productionDate'] != null ? DateTime.parse(data['productionDate']) : DateTime.now()),
      status: data['status'] as String? ?? 'En attente',
      inspectedCount: parseInt(data['inspectedCount']),
      conformCount: parseInt(data['conformCount']),
      nonConformCount: parseInt(data['nonConformCount']),
    );
  }

  /// Créer depuis JSON (Map)
  factory ManufacturingOrder.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      if (value is double) return value.toInt();
      return 0;
    }

    return ManufacturingOrder(
      numeroOF: json['numeroOF'] as String? ?? json['id'] as String? ?? '',
      gipros: json['Gi pros'] as String? ?? json['gipros'] as String? ?? '',
      reference: json['reference'] as String? ?? '',
      ligne: json['ligne'] as String? ?? '',
      client: json['Client'] as String? ?? json['client'] as String? ?? '',
      numComd: json['NumComd'] as String? ?? '',
      qta: parseInt(json['QTA'] ?? json['quantity']),
      dateLiv: json['DateLiv'] != null 
          ? (json['DateLiv'] is String ? DateTime.parse(json['DateLiv']) : (json['DateLiv'] as Timestamp).toDate())
          : (json['productionDate'] != null ? DateTime.parse(json['productionDate']) : DateTime.now()),
      status: json['status'] as String? ?? 'En attente',
      inspectedCount: parseInt(json['inspectedCount']),
      conformCount: parseInt(json['conformCount']),
      nonConformCount: parseInt(json['nonConformCount']),
    );
  }

  /// Convertir pour Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'numeroOF': numeroOF,
      'Gi pros': gipros,
      'reference': reference,
      'QTA': qta,
      'NumComd': numComd,
      'Client': client,
      'DateLiv': Timestamp.fromDate(dateLiv),
      'status': status,
      'ligne': ligne,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'numeroOF': numeroOF,
      'Gi pros': gipros,
      'reference': reference,
      'QTA': qta,
      'NumComd': numComd,
      'Client': client,
      'DateLiv': dateLiv.toIso8601String(),
      'status': status,
      'ligne': ligne,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }
}
