import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un câble à inspecter
///
/// Chaque câble appartient à un ordre de fabrication
/// et peut avoir plusieurs anomalies détectées
class Cable {
  final String id;
  final String code;                // Code unique du câble
  final String orderId;             // ID de l'ordre parent
  final String status;              // 'Conforme', 'Non conforme', 'En attente'
  final DateTime? inspectionDate;   // Date d'inspection (null si pas encore inspecté)
  final String? technicianId;       // ID du technicien qui a inspecté
  final List<String> imageUrls;     // URLs des images capturées
  final int anomaliesCount;         // Nombre d'anomalies détectées

  Cable({
    this.id = '',
    required this.code,
    required this.orderId,
    required this.status,
    this.inspectionDate,
    this.technicianId,
    required this.imageUrls,
    required this.anomaliesCount,
  });

  /// Getter de compatibilité
  String get reference => code;

  /// Vérifier si le câble a été inspecté
  bool get isInspected => inspectionDate != null;

  /// Vérifier si le câble est conforme
  bool get isConform => status.toLowerCase() == 'conforme';

  /// Créer depuis Firestore
  factory Cable.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Cable(
      id: doc.id,
      code: data['code'] as String? ?? doc.id,
      orderId: data['orderId'] as String? ?? '',
      status: data['status'] as String? ?? 'En attente',
      inspectionDate: data['inspectionDate'] != null
          ? (data['inspectionDate'] is Timestamp
              ? (data['inspectionDate'] as Timestamp).toDate()
              : (data['inspectionDate'] is String
                  ? DateTime.tryParse(data['inspectionDate'] as String)
                  : null))
          : null,
      technicianId: data['technicianId'] as String?,
      imageUrls: (data['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      anomaliesCount: data['anomaliesCount'] as int? ?? 0,
    );
  }

  /// Créer depuis JSON (compatibilité API)
  factory Cable.fromJson(Map<String, dynamic> json) {
    return Cable(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString() ?? json['id']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'En attente',
      inspectionDate: json['inspectionDate'] != null
          ? (json['inspectionDate'] is String
              ? DateTime.tryParse(json['inspectionDate'] as String)
              : (json['inspectionDate'] is Timestamp
                  ? (json['inspectionDate'] as Timestamp).toDate()
                  : null))
          : null,
      technicianId: json['technicianId'] as String?,
      imageUrls: (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      anomaliesCount: json['anomaliesCount'] as int? ?? 0,
    );
  }

  /// Convertir pour Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'code': code,
      'orderId': orderId,
      'status': status,
      'inspectionDate':
          inspectionDate != null ? Timestamp.fromDate(inspectionDate!) : null,
      'technicianId': technicianId,
      'imageUrls': imageUrls,
      'anomaliesCount': anomaliesCount,
    };
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'orderId': orderId,
      'status': status,
      'inspectionDate': inspectionDate?.toIso8601String(),
      'technicianId': technicianId,
      'imageUrls': imageUrls,
      'anomaliesCount': anomaliesCount,
    };
  }
}
