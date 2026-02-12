/// Modèle représentant un utilisateur du système ICEM
/// 
/// Ce modèle contient toutes les informations d'un utilisateur :
/// - Informations personnelles (nom, email, téléphone)
/// - Rôle dans le système
/// - Statistiques personnelles
class User {
  final String id;
  final String name;
  final String email;
  final String role; // 'Technicien', 'Responsable', 'Administrateur'
  final String? photoUrl;
  final String? phone;
  final DateTime createdAt;
  final UserStats stats;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.photoUrl,
    this.phone,
    required this.createdAt,
    required this.stats,
  });

  /// Créer un User depuis un JSON (pour Firebase)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      photoUrl: json['photoUrl'] as String?,
      phone: json['phone'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      stats: UserStats.fromJson(json['stats'] as Map<String, dynamic>),
    );
  }

  /// Convertir un User en JSON (pour Firebase)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'photoUrl': photoUrl,
      'phone': phone,
      'createdAt': createdAt.toIso8601String(),
      'stats': stats.toJson(),
    };
  }
}

/// Statistiques personnelles d'un utilisateur
class UserStats {
  final int inspectionsCount;      // Nombre total d'inspections
  final int anomaliesDetected;     // Anomalies détectées
  final double conformityRate;     // Taux de conformité personnel (0-100)
  final int cablesProcessed;       // Câbles traités

  UserStats({
    required this.inspectionsCount,
    required this.anomaliesDetected,
    required this.conformityRate,
    required this.cablesProcessed,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      inspectionsCount: json['inspectionsCount'] as int,
      anomaliesDetected: json['anomaliesDetected'] as int,
      conformityRate: (json['conformityRate'] as num).toDouble(),
      cablesProcessed: json['cablesProcessed'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'inspectionsCount': inspectionsCount,
      'anomaliesDetected': anomaliesDetected,
      'conformityRate': conformityRate,
      'cablesProcessed': cablesProcessed,
    };
  }
}
