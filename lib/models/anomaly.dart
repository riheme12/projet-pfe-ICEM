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
  final DateTime detectedAt;        // Date de détection

  Anomaly({
    required this.id,
    required this.type,
    required this.severity,
    required this.confidence,
    this.location,
    required this.cableId,
    required this.detectedAt,
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
    };
  }
}
