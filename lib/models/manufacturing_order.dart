import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un ordre de fabrication
/// 
/// Un ordre de fabrication contient :
/// - Les informations de production (référence, type, quantité)
/// - Le statut de l'ordre
/// - Les statistiques de conformité
class manufacturingOrder {
  final String numeroOF;
  final String Gipros;
  final String reference;
  final String? ligne;
  final String Client;
  final String NumComd;
  final int  QTA ;               // Quantité totale à produire
  final DateTime DateLiv;    // Date de production
  final String status;              // 'En cours', 'Terminé', 'En attente'
  final int inspectedCount;         // Nombre de câbles déjà inspectés
  final int conformCount;           // Nombre de câbles conformes
  final int nonConformCount;        // Nombre de câbles non conformes

  manufacturingOrder({
    required this.reference,
    required this.status,
    required this.inspectedCount,
    required this.conformCount,
    required this.nonConformCount,
    required this.numeroOF,
    required this.Gipros,
    required this.ligne,
    required this.Client,
    required this.NumComd,
    required this.QTA,
    required this.DateLiv,
  });

  /// Calculer le taux de conformité de cet ordre (0-100)
  double get conformityRate {
    if (inspectedCount == 0) return 0.0;
    return (conformCount / inspectedCount) * 100;
  }

  /// Calculer le pourcentage de progression (0-100)
  double get progressPercentage {
    if (QTA == 0) return 0.0;
    return (inspectedCount /QTA) * 100;
  }

  /// Vérifier si l'ordre est terminé
  bool get isCompleted => inspectedCount >= QTA;

<<<<<<< HEAD
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
=======
  /// Créer depuis Firestore
  factory manufacturingOrder.fromFirestore(DocumentSnapshot doc) {
    print('Parsing document: ${doc.id}');
    final data = doc.data() as Map<String, dynamic>;
    
    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      if (value is double) return value.toInt();
      return 0;
    }

    return manufacturingOrder(
      reference: data['reference'] as String? ?? '',
      status: data['status'] as String? ?? 'en attente',
      inspectedCount: parseInt(data['inspectedCount']),
      conformCount: parseInt(data['conformCount']),
      nonConformCount: parseInt(data['nonConformCount']),
      numeroOF: data['numeroOF'] as String? ?? '',
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

  /// Créer depuis JSON (gardé pour compatibilité si nécessaire)
  factory manufacturingOrder.fromJson(Map<String, dynamic> json) {
    return manufacturingOrder(
      reference: json['reference'] as String,
      status: json['status'] as String,
      inspectedCount: json['inspectedCount'] as int,
      conformCount: json['conformCount'] as int,
      nonConformCount: json['nonConformCount'] as int,
      numeroOF: json['numeroOF'] as String,
      Gipros: json['Gi pros'] as String,
      ligne: json['ligne'] as String,
      Client: json['Client'] as String,
      NumComd: json['NumComd'] as String,
      QTA: json['QTA'] as int,
      DateLiv: DateTime.parse(json['DateLiv'] as String)
    );
  }

  /// Convertir pour Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'numeroOF':numeroOF,
      'Gi pros':Gipros,
      'reference': reference,
      'QTA':QTA,
      'NumComd':NumComd,
      'Client':Client,
      'DateLiv': Timestamp.fromDate(DateLiv),
      'status': status,
      'ligne': ligne,
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }

  /// Convertir en JSON
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  Map<String, dynamic> toJson() {
    return {
      'reference': reference,
<<<<<<< HEAD
      'NumComd': cableType, // Sync with Firestore NumComd
      'QTA': quantity,      // Sync with Firestore QTA
      'DateLiv': productionDate.toIso8601String(),
      'status': status.toLowerCase(),
      'assignedTechnicianId': assignedTechnicianId,
=======
      'QTA': QTA,
      'DateLiv': DateLiv.toIso8601String(),
      'status': status,
      'ligne': ligne,
      'Client':Client,
      'Gi pros':Gipros,
      'numeroOF':numeroOF,
      'NumComd':NumComd,
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
      'inspectedCount': inspectedCount,
      'conformCount': conformCount,
      'nonConformCount': nonConformCount,
    };
  }
}
