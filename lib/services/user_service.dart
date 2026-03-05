import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../models/user.dart';

/// Service pour gérer les données utilisateur
/// 
/// Connecté à Firebase Auth et Firestore (collection 'users')
class UserService {
  // Singleton pattern : une seule instance du service
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final CollectionReference _usersCollection =
      FirebaseFirestore.instance.collection('users');

  // Cache de l'utilisateur actuel
  User? _currentUser;

  /// Récupérer l'utilisateur actuellement connecté depuis Firebase
  Future<User> getCurrentUser() async {
    // Si l'utilisateur est en cache, le retourner
    if (_currentUser != null) return _currentUser!;

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

      final Map<String, dynamic> updates = {};
      if (fullName != null) updates['fullName'] = fullName;
      if (phone != null) updates['phone'] = phone;
      if (photoUrl != null) updates['photoUrl'] = photoUrl;

      if (updates.isNotEmpty) {
        await _usersCollection.doc(firebaseUser.uid).update(updates);
        
        // Mettre à jour le cache
        _currentUser = null; // Forcer le rechargement
        await getCurrentUser();
      }
    } catch (e) {
      print('Error updating profile: $e');
      rethrow;
    }
  }

  /// Récupérer les statistiques de l'utilisateur depuis Firestore
  Future<UserStats> getUserStats() async {
    final user = await getCurrentUser();
    return user.stats;
  }

  /// Déconnexion
  Future<void> logout() async {
    try {
      await _auth.signOut();
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
