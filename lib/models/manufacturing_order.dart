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
  final String gipros;
  final String reference;
  final String? ligne;
  final String client;
  final String numComd;
  final int qta;               // Quantité totale à produire
  final DateTime dateLiv;      // Date de livraison
  final String status;         // 'En cours', 'Terminé', 'En attente'
  final int inspectedCount;    // Nombre de câbles déjà inspectés
  final int conformCount;      // Nombre de câbles conformes
  final int nonConformCount;   // Nombre de câbles non conformes

  ManufacturingOrder({
    this.id = '',
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

  // ── Getters de compatibilité (noms PascalCase utilisés dans certains écrans) ──
  String get Gipros => gipros;
  String get Client => client;
  String get NumComd => numComd;
  int get QTA => qta;
  DateTime get DateLiv => dateLiv;
  String get cableType => numComd.isNotEmpty ? numComd : client;
  int get quantity => qta;
  DateTime get productionDate => dateLiv;
  String? get assignedTechnicianId => ligne;

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
      id: doc.id,
      numeroOF: data['numeroOF'] as String? ?? doc.id,
      gipros: data['Gi pros'] as String? ?? data['Gipros'] as String? ?? '',
      reference: data['reference'] as String? ?? '',
      ligne: data['ligne'] as String? ?? '',
      client: data['Client'] as String? ?? data['client'] as String? ?? '',
      numComd: data['NumComd'] as String? ?? '',
      qta: parseInt(data['QTA'] ?? data['quantity']),
      dateLiv: data['DateLiv'] != null && data['DateLiv'] is Timestamp
          ? (data['DateLiv'] as Timestamp).toDate()
          : (data['productionDate'] != null
              ? DateTime.tryParse(data['productionDate'].toString()) ?? DateTime.now()
              : DateTime.now()),
      status: data['status'] as String? ?? 'En attente',
      inspectedCount: parseInt(data['inspectedCount']),
      conformCount: parseInt(data['conformCount']),
      nonConformCount: parseInt(data['nonConformCount']),
    );
  }

  /// Créer depuis JSON (compatibilité API backend)
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
      numeroOF: json['numeroOF']?.toString() ?? json['id']?.toString() ?? '',
      gipros: json['Gi pros']?.toString() ?? json['Gipros']?.toString() ?? json['gipros']?.toString() ?? '',
      reference: json['reference']?.toString() ?? '',
      ligne: json['ligne']?.toString() ?? json['assignedTechnicianId']?.toString(),
      client: json['Client']?.toString() ?? json['client']?.toString() ?? '',
      numComd: json['NumComd']?.toString() ?? '',
      qta: parseInt(json['QTA'] ?? json['quantity']),
      dateLiv: parseDate(json['DateLiv'] ?? json['productionDate']),
      status: json['status']?.toString() ?? 'En attente',
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
      'id': id,
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
