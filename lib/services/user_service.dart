import '../models/user.dart';

/// Service pour gérer les données utilisateur
/// 
/// Pour l'instant, ce service utilise des données simulées
/// Plus tard, il sera connecté à Firebase
class UserService {
  // Singleton pattern : une seule instance du service
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  // Utilisateur actuellement connecté (simulé)
  User? _currentUser;

  /// Récupérer l'utilisateur actuellement connecté
  Future<User> getCurrentUser() async {
    // Simuler un délai réseau
    await Future.delayed(const Duration(milliseconds: 500));

    // Si pas d'utilisateur, créer un utilisateur de test
    _currentUser ??= User(
      id: 'user_001',
      username: 'ahmed_ba',
      fullName: 'Ahmed Ben Ali',
      email: 'ahmed.benali@icem.tn',
      role: UserRole.technician,
      photoUrl: null, // Pas de photo pour l'instant
      phone: '+216 20 123 456',
      createdAt: DateTime(2024, 1, 15),
      stats: UserStats(
        inspectionsCount: 156,
        anomaliesDetected: 23,
        conformityRate: 94.5,
        cablesProcessed: 156,
      ),
    );

    return _currentUser!;
  }

  /// Mettre à jour le profil utilisateur
  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? photoUrl,
  }) async {
    // Simuler un délai réseau
    await Future.delayed(const Duration(milliseconds: 800));

    if (_currentUser != null) {
      _currentUser = User(
        id: _currentUser!.id,
        username: _currentUser!.username,
        fullName: fullName ?? _currentUser!.fullName,
        email: _currentUser!.email,
        role: _currentUser!.role,
        photoUrl: photoUrl ?? _currentUser!.photoUrl,
        phone: phone ?? _currentUser!.phone,
        createdAt: _currentUser!.createdAt,
        stats: _currentUser!.stats,
      );
    }
  }

  /// Récupérer les statistiques de l'utilisateur
  Future<UserStats> getUserStats() async {
    await Future.delayed(const Duration(milliseconds: 300));
    final user = await getCurrentUser();
    return user.stats;
  }

  /// Déconnexion
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 500));
    _currentUser = null;
    // TODO: Déconnexion Firebase
  }

  /// Vérifier si un utilisateur est connecté
  bool isLoggedIn() {
    return _currentUser != null;
  }
}
