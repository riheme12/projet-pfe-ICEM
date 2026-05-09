import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle représentant une anomalie détectée par l'IA
/// 
/// Une anomalie est un défaut détecté sur un câble
/// Elle a un type, une gravité et un score de confiance
class Anomaly {
  final String id;
  final String type;                // 'Rayure', 'Déformation', 'Défaut de surface', etc.
  final String severity;            // 'Mineur', 'Majeur', 'Critique'
  final double confidence;          // Score de confiance IA (0.0 - 1.0)
  final String? location;           // Description de la localisation
  final String cableId;             // ID du câble concerné
  final String? technicianId;       // ID du technicien ayant détecté
  final String? technicianName;     // Nom du technicien
  final DateTime detectedAt;        // Date de détection
  final String? imageUrl;           // URL de l'image capturée dans Firebase Storage
  final String statut;              // 'detectee', 'en_traitement', 'traitee'
  final String? orderId;            // ID de l'ordre de fabrication
  final String? mesureCorrective;   // Mesure corrective appliquée

  Anomaly({
    required this.id,
    required this.type,
    required this.severity,
    required this.confidence,
    this.location,
    required this.cableId,
    required this.detectedAt,
    this.technicianId,
    this.technicianName,
    this.imageUrl,
    this.statut = 'detectee',
    this.orderId,
    this.mesureCorrective,
  });

  /// Obtenir la couleur associée à la gravité
  /// (pour l'affichage dans l'UI)
  String get severityColor {
    switch (severity) {
      case 'Critique':
        return 'red';
      case 'Majeur':
        return 'orange';
      case 'Mineur':
        return 'yellow';
      default:
        return 'grey';
    }
  }

  /// Vérifier si l'anomalie est critique
  bool get isCritical => severity == 'Critique';

  /// Vérifier si l'anomalie est résolue
  bool get isResolved => statut == 'traitee';

  /// Créer depuis Firestore
  factory Anomaly.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return Anomaly(
      id: doc.id,
      type: data['type'] as String? ?? '',
      severity: data['severity'] as String? ?? 'Mineur',
      confidence: parseDouble(data['confidence']),
      location: data['location'] as String?,
      cableId: data['cableId'] as String? ?? '',
      detectedAt: data['detectedAt'] != null && data['detectedAt'] is Timestamp
          ? (data['detectedAt'] as Timestamp).toDate()
          : DateTime.now(),
      technicianId: data['technicianId'] as String?,
      technicianName: data['technicianName'] as String?,
      imageUrl: data['imageUrl'] as String?,
      statut: data['statut'] as String? ?? 'detectee',
      orderId: data['orderId'] as String?,
      mesureCorrective: data['mesureCorrective'] as String?,
    );
  }

  /// Convertir pour Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'type': type,
      'severity': severity,
      'confidence': confidence,
      'location': location,
      'cableId': cableId,
      'detectedAt': Timestamp.fromDate(detectedAt),
      'technicianId': technicianId,
      'technicianName': technicianName,
      'imageUrl': imageUrl,
      'statut': statut,
      'orderId': orderId,
      'mesureCorrective': mesureCorrective,
    };
  }

  /// Créer depuis JSON
  factory Anomaly.fromJson(Map<String, dynamic> json) {
    return Anomaly(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? json['description']?.toString() ?? 'Inconnu',
      severity: json['severity']?.toString() ?? 'Mineur',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      location: json['location']?.toString(),
      cableId: json['cableId']?.toString() ?? '',
      detectedAt: json['detectedAt'] != null 
          ? (json['detectedAt'] is String 
              ? DateTime.parse(json['detectedAt'] as String)
              : (json['detectedAt'] as dynamic).toDate())
          : (json['timestamp'] != null 
              ? (json['timestamp'] is String 
                  ? DateTime.parse(json['timestamp'] as String)
                  : (json['timestamp'] as dynamic).toDate())
              : DateTime.now()),
      technicianId: json['technicianId']?.toString(),
      technicianName: json['technicianName']?.toString() ?? json['technicianFullName']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      statut: json['statut']?.toString() ?? 'detectee',
      orderId: json['orderId']?.toString(),
      mesureCorrective: json['mesureCorrective']?.toString(),
    );
  }

  /// Convertir en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'severity': severity,
      'confidence': confidence,
      'location': location,
      'cableId': cableId,
      'detectedAt': detectedAt.toIso8601String(),
      'technicianId': technicianId,
      'technicianName': technicianName,
      'imageUrl': imageUrl,
      'statut': statut,
      'orderId': orderId,
      'mesureCorrective': mesureCorrective,
    };
  }

  /// Créer une copie avec modifications
  Anomaly copyWith({
    String? id,
    String? type,
    String? severity,
    double? confidence,
    String? location,
    String? cableId,
    DateTime? detectedAt,
    String? technicianId,
    String? technicianName,
    String? imageUrl,
    String? statut,
    String? orderId,
    String? mesureCorrective,
  }) {
    return Anomaly(
      id: id ?? this.id,
      type: type ?? this.type,
      severity: severity ?? this.severity,
      confidence: confidence ?? this.confidence,
      location: location ?? this.location,
      cableId: cableId ?? this.cableId,
      detectedAt: detectedAt ?? this.detectedAt,
      technicianId: technicianId ?? this.technicianId,
      technicianName: technicianName ?? this.technicianName,
      imageUrl: imageUrl ?? this.imageUrl,
      statut: statut ?? this.statut,
      orderId: orderId ?? this.orderId,
      mesureCorrective: mesureCorrective ?? this.mesureCorrective,
    );
  }
}
