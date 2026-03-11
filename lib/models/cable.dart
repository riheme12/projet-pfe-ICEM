/// Modèle représentant un câble à inspecter
/// 
/// Chaque câble appartient à un ordre de fabrication
/// et peut avoir plusieurs anomalies détectées
class Cable {
  final String id;
  final String reference;          // Référence du câble
  final String code;                // Code unique du câble
  final String orderId;             // ID de l'ordre parent
  final String status;              // 'Conforme', 'Non conforme', 'En attente'
  final DateTime? inspectionDate;   // Date d'inspection (null si pas encore inspecté)
  final String? technicianId;       // ID du technicien qui a inspecté
  final List<String> imageUrls;     // URLs des images capturées
  final int anomaliesCount;         // Nombre d'anomalies détectées

  Cable({
    required this.id,
    required this.reference,
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
  bool get isConform => status.toLowerCase() == 'conforme';

  /// Créer depuis JSON
  factory Cable.fromJson(Map<String, dynamic> json) {
    return Cable(
      id: json['id']?.toString() ?? '',
      reference: json['reference']?.toString() ?? json['code']?.toString() ?? 'Inconnue',
      code: json['code']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'En attente',
      inspectionDate: json['inspectionDate'] != null
          ? (json['inspectionDate'] is String 
              ? DateTime.parse(json['inspectionDate'] as String)
              : (json['inspectionDate'] as dynamic).toDate())
          : null,
      technicianId: json['technicianId']?.toString(),
      imageUrls: (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e?.toString() ?? '')
              .toList() ??
          [],
      anomaliesCount: json['anomaliesCount'] as int? ?? 0,
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
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
