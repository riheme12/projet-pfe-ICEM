/// Modèle représentant un utilisateur du système ICEM
///
/// Ce modèle contient toutes les informations d'un utilisateur :
/// - Informations personnelles (nom, email, téléphone)
/// - Rôle dans le système
/// - Statistiques personnelles
/// Rôles utilisateur disponibles
enum UserRole {
  technician,
  manager,
  admin,
  operator,
}

/// Extension pour la conversion String <-> UserRole
extension UserRoleExtension on UserRole {
  String get name {
    switch (this) {
      case UserRole.technician:
        return 'Technicien';
      case UserRole.manager:
        return 'Responsable';
      case UserRole.admin:
        return 'Administrateur';
      case UserRole.operator:
        return 'Opérateur';
    }
  }

  static UserRole fromString(String role) {
    switch (role) {
      case 'Technicien':
      case 'technician':
        return UserRole.technician;
      case 'Responsable':
      case 'manager':
        return UserRole.manager;
      case 'Administrateur':
      case 'admin':
        return UserRole.admin;
      case 'Opérateur':
      case 'operator':
        return UserRole.operator;
      default:
        return UserRole.operator;
    }
  }
}

class User {
  final String id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final String? photoUrl;
  final String? phone;
  final DateTime createdAt;
  final UserStats stats;

  User({
    required this.id,
    required this.username,
    required this.fullName,
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
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: UserRoleExtension.fromString(json['role'] as String? ?? 'operator'),
      photoUrl: json['photoUrl'] as String?,
      phone: json['phone'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      stats: json['stats'] != null
          ? UserStats.fromJson(json['stats'] as Map<String, dynamic>)
          : UserStats.empty(),
    );
  }

  /// Convertir un User en JSON (pour Firebase)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'email': email,
      'role': role.toString().split('.').last, // Store logical name (e.g., 'operator')
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

  factory UserStats.empty() {
    return UserStats(
      inspectionsCount: 0,
      anomaliesDetected: 0,
      conformityRate: 0.0,
      cablesProcessed: 0,
    );
  }

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
