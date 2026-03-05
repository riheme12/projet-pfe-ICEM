import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un câble à inspecter
/// 
/// Chaque câble appartient à un ordre de fabrication
/// et peut avoir plusieurs anomalies détectées
class Cable {

  final String code;                // Code unique du câble
  final String orderId;             // ID de l'ordre parent
  final String status;              // 'Conforme', 'Non conforme', 'En attente'
  final DateTime? inspectionDate;   // Date d'inspection (null si pas encore inspecté)
  final String? technicianId;       // ID du technicien qui a inspecté
  final List<String> imageUrls;     // URLs des images capturées
  final int anomaliesCount;         // Nombre d'anomalies détectées

  Cable({
    required this.code,
    required this.orderId,
    required this.status,
    this.inspectionDate,
    this.technicianId,
    required this.imageUrls,
    required this.anomaliesCount,
  });

  /// Vérifier si le câble a été inspecté
  bool get isInspected => inspectionDate != null;

  /// Vérifier si le câble est conforme
  bool get isConform => status == 'Conforme';

  /// Créer depuis Firestore
  factory Cable.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Cable(
      code: data['code'] as String? ?? '',
      orderId: data['orderId'] as String? ?? '',
      status: data['status'] as String? ?? 'En attente',
      inspectionDate: data['inspectionDate'] != null
          ? (data['inspectionDate'] as Timestamp).toDate()
          : null,
      technicianId: data['technicianId'] as String?,
      imageUrls: (data['imageUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      anomaliesCount: data['anomaliesCount'] as int? ?? 0,
    );
  }

  /// Créer depuis JSON
  factory Cable.fromJson(Map<String, dynamic> json) {
    return Cable(

      code: json['code'] as String,
      orderId: json['orderId'] as String,
      status: json['status'] as String,
      inspectionDate: json['inspectionDate'] != null
          ? DateTime.parse(json['inspectionDate'] as String)
          : null,
      technicianId: json['technicianId'] as String?,
      imageUrls: (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
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
      'inspectionDate': inspectionDate != null ? Timestamp.fromDate(inspectionDate!) : null,
      'technicianId': technicianId,
      'imageUrls': imageUrls,
      'anomaliesCount': anomaliesCount,
    };
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
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
