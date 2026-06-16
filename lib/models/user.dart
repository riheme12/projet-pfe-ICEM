/// Rôles utilisateur disponibles dans le système ICEM
enum UserRole {
  technician,
  manager,
  admin,
  director,
}

/// Extension pour la conversion String <-> UserRole
extension UserRoleExtension on UserRole {
  String get name {
    switch (this) {
      case UserRole.admin:
        return 'Administrateur';
      case UserRole.technician:
        return 'Technicien';
      case UserRole.manager:
        return 'Responsable Qualité';
      case UserRole.director:
        return 'Directeur';
    }
  }

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'administrateur':
      case 'admin':
        return UserRole.admin;
      case 'technicien':
      case 'technician':
        return UserRole.technician;
      case 'responsable':
      case 'responsable qualité':
      case 'manager':
        return UserRole.manager;
      case 'directeur':
      case 'director':
        return UserRole.director;
      default:
        return UserRole.technician;
    }
  }
}

/// Modèle représentant un utilisateur du système ICEM
///
/// Ce modèle contient toutes les informations d'un utilisateur :
/// - Informations personnelles (nom, email, téléphone)
/// - Rôle dans le système
/// - Statistiques personnelles
/// - URL de la signature (image uploadée par l'admin)

class User {
  final String id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;
  final String? photoUrl;
  final String? phone;
  final String? signatureUrl;  // URL de l'image signature (uploadée par admin)
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
    this.signatureUrl,
    required this.createdAt,
    required this.stats,
  });

  // Alignement avec le diagramme de classe de conception (DCC)
  List<String> get roles => [role.toString().split('.').last];

  bool hasRole(UserRole targetRole) {
    return role == targetRole;
  }

  void activate() {
    // Squelette de méthode pour le DCC
  }

  void deactivate() {
    // Squelette de méthode pour le DCC
  }

  void updateSignature(String newSignatureUrl) {
    // Squelette de méthode pour le DCC
  }

  /// Créer un User depuis un JSON (pour Firebase)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      fullName: json['fullName'] as String? ?? json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: UserRoleExtension.fromString(json['role'] as String? ?? 'technician'),
      photoUrl: json['photoUrl'] as String?,
      phone: json['phone'] as String?,
      signatureUrl: json['signatureUrl'] as String?,
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
      'signatureUrl': signatureUrl,
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
