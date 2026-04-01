import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un ordre de fabrication
/// 
/// Un ordre de fabrication contient :
/// - Les informations de production (référence, type, quantité)
/// - Le statut de l'ordre
/// - Les statistiques de conformité
class ManufacturingOrder {
  final String id;
  final String numeroOF;
  final String Gipros;
  final String reference;
  final String? ligne;
  final String Client;
  final String NumComd;
  final int QTA;
  final DateTime DateLiv;
  final String status;
  final int inspectedCount;
  final int conformCount;
  final int nonConformCount;

  ManufacturingOrder({
    required this.id,
    required this.reference,
    required this.status,
    required this.inspectedCount,
    required this.conformCount,
    required this.nonConformCount,
    required this.numeroOF,
    required this.Gipros,
    this.ligne,
    required this.Client,
    required this.NumComd,
    required this.QTA,
    required this.DateLiv,
  });

  // Getters de compatibilité pour les écrans existants
  String get cableType => NumComd.isNotEmpty ? NumComd : Client;
  int get quantity => QTA;
  DateTime get productionDate => DateLiv;
  String? get assignedTechnicianId => ligne;

  /// Calculer le taux de conformité de cet ordre (0-100)
  double get conformityRate {
    if (inspectedCount == 0) return 0.0;
    return (conformCount / inspectedCount) * 100;
  }

  /// Calculer le pourcentage de progression (0-100)
  double get progressPercentage {
    if (QTA == 0) return 0.0;
    return (inspectedCount / QTA) * 100;
  }

  /// Vérifier si l'ordre est terminé
  bool get isCompleted => inspectedCount >= QTA;

  /// Créer depuis Firestore (lecture directe mobile)
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
      id: doc.id,
      reference: data['reference'] as String? ?? '',
      status: data['status'] as String? ?? 'En attente',
      inspectedCount: parseInt(data['inspectedCount']),
      conformCount: parseInt(data['conformCount']),
      nonConformCount: parseInt(data['nonConformCount']),
      numeroOF: data['numeroOF'] as String? ?? doc.id,
      Gipros: data['Gi pros'] as String? ?? '',
      Client: data['Client'] as String? ?? data['client'] as String? ?? '',
      NumComd: data['NumComd'] as String? ?? '',
      QTA: parseInt(data['QTA']),
      DateLiv: data['DateLiv'] != null && data['DateLiv'] is Timestamp
          ? (data['DateLiv'] as Timestamp).toDate()
          : DateTime.now(),
      ligne: data['ligne'] as String? ?? '',
    );
  }

  /// Créer depuis JSON (compatibilité avec API backend)
  factory ManufacturingOrder.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      if (value is double) return value.toInt();
      return 0;
    }

    DateTime parseDate(dynamic value) {
      if (value == null) return DateTime.now();
      if (value is Timestamp) return value.toDate();
      if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
      return DateTime.now();
    }

    return ManufacturingOrder(
      id: json['id']?.toString() ?? '',
      reference: json['reference']?.toString() ?? json['numeroOF']?.toString() ?? '',
      status: json['status']?.toString() ?? 'En attente',
      inspectedCount: parseInt(json['inspectedCount']),
      conformCount: parseInt(json['conformCount']),
      nonConformCount: parseInt(json['nonConformCount']),
      numeroOF: json['numeroOF']?.toString() ?? json['id']?.toString() ?? '',
      Gipros: json['Gi pros']?.toString() ?? json['Gipros']?.toString() ?? '',
      Client: json['Client']?.toString() ?? json['client']?.toString() ?? '',
      NumComd: json['NumComd']?.toString() ?? '',
      QTA: parseInt(json['QTA'] ?? json['quantity']),
      DateLiv: parseDate(json['DateLiv'] ?? json['productionDate']),
      ligne: json['ligne']?.toString() ?? json['assignedTechnicianId']?.toString(),
    );
  }

  /// Convertir pour Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'numeroOF': numeroOF,
      'Gi pros': Gipros,
      'reference': reference,
      'QTA': QTA,
      'NumComd': NumComd,
      'Client': Client,
      'DateLiv': Timestamp.fromDate(DateLiv),
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
      'id': id,
      'reference': reference,
      'QTA': QTA,
      'DateLiv': DateLiv.toIso8601String(),
      'status': status,
      'ligne': ligne,
      'Client': Client,
      'Gi pros': Gipros,
      'numeroOF': numeroOF,
      'NumComd': NumComd,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }
}
