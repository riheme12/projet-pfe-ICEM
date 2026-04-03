import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../models/user.dart';
import './auth_service.dart';

/// Service pour gérer les données utilisateur
/// 
/// Connecté à Firebase Auth et Firestore (collection 'users')
class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final AuthService _authService = AuthService();

  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final CollectionReference _usersCollection =
      FirebaseFirestore.instance.collection('users');

  // Cache de l'utilisateur actuel
  User? _currentUser;

  /// Récupérer l'utilisateur actuellement connecté depuis Firebase
  Future<User?> getCurrentUser() async {
    if (_currentUser != null) return _currentUser!;

<<<<<<< Updated upstream
    try {
      final firebaseUser = _auth.currentUser;
      if (firebaseUser != null) {
        final userDoc = await _usersCollection.doc(firebaseUser.uid).get();
        if (userDoc.exists) {
          final userData = userDoc.data() as Map<String, dynamic>;
          _currentUser = User.fromJson({
            'id': firebaseUser.uid,
            ...userData,
          });
          return _currentUser!;
        }
      }
    } catch (e) {
      print('Error fetching current user: $e');
    }

    // Fallback: utilisateur par défaut si pas connecté
    return User(
      id: 'guest',
      username: 'Invité',
      fullName: 'Utilisateur non connecté',
      email: '',
      role: UserRole.operator,
      createdAt: DateTime.now(),
      stats: UserStats.empty(),
=======
    // Si pas d'utilisateur, créer un utilisateur de test
    _currentUser ??= User(
      id: 'user_001',
      username: 'ahmed_benali',
      fullName: 'Ahmed Ben Ali',
      email: 'ahmed.benali@icem.tn',
      role: UserRole.operator,
      photoUrl: null, // Pas de photo pour l'instant
      phone: '+216 20 123 456',
      createdAt: DateTime(2024, 1, 15),
      stats: UserStats(
        inspectionsCount: 156,
        anomaliesDetected: 23,
        conformityRate: 94.5,
        cablesProcessed: 156,
      ),
>>>>>>> Stashed changes
    );
  }

  /// Mettre à jour le profil utilisateur dans Firestore
  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? photoUrl,
  }) async {
    try {
      final firebaseUser = _auth.currentUser;
      if (firebaseUser == null) return;

<<<<<<< Updated upstream
      final Map<String, dynamic> updates = {};
      if (fullName != null) updates['fullName'] = fullName;
      if (phone != null) updates['phone'] = phone;
      if (photoUrl != null) updates['photoUrl'] = photoUrl;

      if (updates.isNotEmpty) {
        await _usersCollection.doc(firebaseUser.uid).update(updates);
        
        // Mettre à jour le cache
        _currentUser = null;
        await getCurrentUser();
      }
    } catch (e) {
      print('Error updating profile: $e');
      rethrow;
    }
  }

  /// Récupérer les statistiques de l'utilisateur depuis Firestore
=======
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
>>>>>>> Stashed changes
  Future<UserStats> getUserStats() async {
    final user = await getCurrentUser();
    return user?.stats ?? UserStats.empty();
  }

  /// Déconnexion
  Future<void> logout() async {
    try {
      await _authService.logout();
      _currentUser = null;
    } catch (e) {
      print('Logout error: $e');
      rethrow;
    }
  }

  /// Vérifier si un utilisateur est connecté
  bool isLoggedIn() {
    return _auth.currentUser != null;
  }

  /// Invalider le cache (forcer le rechargement)
  void clearCache() {
    _currentUser = null;
  }
}
