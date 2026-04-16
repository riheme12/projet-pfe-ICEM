import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant un rapport d'inspection
/// 
/// Un rapport est généré après chaque inspection de câble
/// Il contient toutes les informations de l'inspection
class Report {
  final String id;
  final String cableId;             // ID du câble inspecté
  final String orderId;             // ID de l'ordre de fabrication
  final String technicianId;        // ID du technicien
  final DateTime generatedAt;       // Date de génération
  final String conformityStatus;    // 'Conforme' ou 'Non conforme'
  final int anomaliesCount;         // Nombre d'anomalies détectées
  final String? pdfUrl;             // URL du PDF généré (si disponible)
  final String? notes;              // Notes du technicien

  Report({
    required this.id,
    required this.cableId,
    required this.orderId,
    required this.technicianId,
    required this.generatedAt,
    required this.conformityStatus,
    required this.anomaliesCount,
    this.pdfUrl,
    this.notes,
  });

  /// Vérifier si le câble est conforme
  bool get isConform => conformityStatus == 'Conforme';

  /// Vérifier si le PDF est disponible
  bool get hasPdf => pdfUrl != null && pdfUrl!.isNotEmpty;

  /// Créer depuis Firestore (DocumentSnapshot)
  factory Report.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Report(
      id: doc.id,
      cableId: data['cableId'] as String? ?? '',
      orderId: data['orderId'] as String? ?? '',
      technicianId: data['technicianId'] as String? ?? '',
      generatedAt: (data['generatedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      conformityStatus: data['conformityStatus'] as String? ?? 'Inconnu',
      anomaliesCount: data['anomaliesCount'] as int? ?? 0,
      pdfUrl: data['pdfUrl'] as String?,
      notes: data['notes'] as String?,
    );
  }

  /// Créer depuis JSON (Map)
  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'] as String,
      cableId: json['cableId'] as String,
      orderId: json['orderId'] as String,
      technicianId: json['technicianId'] as String,
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      conformityStatus: json['conformityStatus'] as String,
      anomaliesCount: json['anomaliesCount'] as int,
      pdfUrl: json['pdfUrl'] as String?,
      notes: json['notes'] as String?,
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cableId': cableId,
      'orderId': orderId,
      'technicianId': technicianId,
      'generatedAt': generatedAt.toIso8601String(),
      'conformityStatus': conformityStatus,
      'anomaliesCount': anomaliesCount,
      'pdfUrl': pdfUrl,
      'notes': notes,
    };
  }
}
