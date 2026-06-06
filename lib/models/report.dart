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
  final String? technicianName;     // Nom du technicien
  final DateTime generatedAt;       // Date de génération
  final String conformityStatus;    // 'Conforme' ou 'Non conforme'
  final int anomaliesCount;         // Nombre d'anomalies détectées
  final String? type;              // 'performance' ou 'inspection'
  final String? pdfUrl;             // URL du PDF généré (si disponible)
  final String? notes;              // Notes du technicien
  final String? signatureUrl;       // Signature du technicien
  final String? imageUrl;           // Image de l'anomalie
  final List<String>? imageUrls;     // Images des anomalies

  Report({
    required this.id,
    required this.cableId,
    required this.orderId,
    required this.technicianId,
    this.technicianName,
    required this.generatedAt,
    required this.conformityStatus,
    required this.anomaliesCount,
    this.type,
    this.pdfUrl,
    this.notes,
    this.signatureUrl,
    this.imageUrl,
    this.imageUrls,
  });

  /// Vérifier si le câble est conforme
  bool get isConform => conformityStatus == 'Conforme';

  /// Vérifier si le PDF est disponible
  bool get hasPdf => pdfUrl != null && pdfUrl!.isNotEmpty;

  factory Report.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    
    // Sécurisation de la date: supporte Timestamp, String ISO, ou utilise DateTime.now() en secours
    DateTime dateToUse = DateTime.now();
    if (data['generatedAt'] is Timestamp) {
      dateToUse = (data['generatedAt'] as Timestamp).toDate();
    } else if (data['generatedAt'] is String) {
      try { dateToUse = DateTime.parse(data['generatedAt'] as String); } catch (_) {}
    }

    final dynamic rawImageUrls = data['imageUrls'];
    List<String>? parsedImageUrls;
    if (rawImageUrls is List) {
      parsedImageUrls = List<String>.from(rawImageUrls.map((e) => e.toString()));
    } else if (data['imageUrl'] != null) {
      parsedImageUrls = [data['imageUrl'] as String];
    }

    return Report(
      id: doc.id,
      cableId: data['cableId'] as String? ?? '',
      orderId: data['orderId'] as String? ?? '',
      technicianId: data['technicianId'] as String? ?? '',
      technicianName: data['technicianName'] as String?,
      generatedAt: dateToUse,
      conformityStatus: data['conformityStatus'] as String? ?? 'Inconnu',
      anomaliesCount: data['anomaliesCount'] as int? ?? 0,
      type: data['type'] as String?,
      pdfUrl: data['pdfUrl'] as String?,
      notes: data['notes'] as String?,
      signatureUrl: data['signatureUrl'] as String?,
      imageUrl: data['imageUrl'] as String?,
      imageUrls: parsedImageUrls,
    );
  }

  /// Créer depuis JSON (Map)
  factory Report.fromJson(Map<String, dynamic> json) {
    final dynamic rawImageUrls = json['imageUrls'];
    List<String>? parsedImageUrls;
    if (rawImageUrls is List) {
      parsedImageUrls = List<String>.from(rawImageUrls.map((e) => e.toString()));
    } else if (json['imageUrl'] != null) {
      parsedImageUrls = [json['imageUrl'] as String];
    }

    return Report(
      id: json['id'] as String,
      cableId: json['cableId'] as String,
      orderId: json['orderId'] as String,
      technicianId: json['technicianId'] as String,
      technicianName: json['technicianName'] as String?,
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      conformityStatus: json['conformityStatus'] as String,
      anomaliesCount: json['anomaliesCount'] as int,
      type: json['type'] as String?,
      pdfUrl: json['pdfUrl'] as String?,
      notes: json['notes'] as String?,
      signatureUrl: json['signatureUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      imageUrls: parsedImageUrls,
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cableId': cableId,
      'orderId': orderId,
      'technicianId': technicianId,
      'technicianName': technicianName,
      'generatedAt': generatedAt.toIso8601String(),
      'conformityStatus': conformityStatus,
      'anomaliesCount': anomaliesCount,
      'type': type,
      'pdfUrl': pdfUrl,
      'notes': notes,
      'signatureUrl': signatureUrl,
      'imageUrl': imageUrl,
      'imageUrls': imageUrls ?? (imageUrl != null ? [imageUrl!] : []),
    };
  }
}
