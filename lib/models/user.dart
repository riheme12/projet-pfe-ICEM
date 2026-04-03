/// Rôles possibles pour un utilisateur
enum UserRole {
  operator,
  inspector,
  supervisor,
  admin;

  String get name {
    switch (this) {
      case UserRole.operator: return 'Opérateur';
      case UserRole.inspector: return 'Inspecteur';
      case UserRole.supervisor: return 'Superviseur';
      case UserRole.admin: return 'Administrateur';
    }
  }
}

extension UserRoleExtension on UserRole {
  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'inspector': return UserRole.inspector;
      case 'supervisor': return UserRole.supervisor;
      case 'admin': return UserRole.admin;
      default: return UserRole.operator;
    }
  }
}

/// Modèle représentant un utilisateur du système ICEM
<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      fullName: json['fullName'] as String? ?? '',
=======
      fullName: json['fullName'] as String? ?? json['name'] as String? ?? '',
>>>>>>> Stashed changes
      email: json['email'] as String? ?? '',
      role: UserRoleExtension.fromString(json['role'] as String? ?? 'operator'),
      photoUrl: json['photoUrl'] as String?,
      phone: json['phone'] as String?,
<<<<<<< Updated upstream
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      stats: json['stats'] != null
=======
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String) 
          : DateTime.now(),
      stats: json['stats'] != null 
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      'role': role.toString().split('.').last, // Store logical name (e.g., 'operator')
=======
      'role': role.toString().split('.').last,
>>>>>>> Stashed changes
      'photoUrl': photoUrl,
      'phone': phone,
      'createdAt': createdAt.toIso8601String(),
      'stats': stats.toJson(),
    };
  }
}

/// Statistiques personnelles d'un utilisateur
class UserStats {
  final int inspectionsCount;
  final int anomaliesDetected;
  final double conformityRate;
  final int cablesProcessed;

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
      inspectionsCount: json['inspectionsCount'] as int? ?? 0,
      anomaliesDetected: json['anomaliesDetected'] as int? ?? 0,
      conformityRate: (json['conformityRate'] as num? ?? 0.0).toDouble(),
      cablesProcessed: json['cablesProcessed'] as int? ?? 0,
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

