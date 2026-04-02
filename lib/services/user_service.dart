import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import './auth_service.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

/// Service pour gérer les données utilisateur via Firestore
///
/// Connecté à Firebase Auth et Firestore (collection 'users')
class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final AuthService _authService = AuthService();

  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;

  late final CollectionReference _usersCollection;

  // Cache de l'utilisateur actuel
  User? _currentUser;

  UserService._internal() {
    _usersCollection = _db.collection('users');
  }

  /// Récupérer l'utilisateur actuellement connecté depuis Firebase
  Future<User?> getCurrentUser() async {
    if (_currentUser != null) return _currentUser;

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
          return _currentUser;
        }
      }
    } catch (e) {
      debugPrint('Error fetching current user: $e');
    }

    return null;
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
        _currentUser = null; // Invalider le cache
        await getCurrentUser(); // Recharger depuis Firestore
      }
    } catch (e) {
      debugPrint('Error updating profile: $e');
      rethrow;
    }
  }

  /// Récupérer les statistiques de l'utilisateur
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
      debugPrint('Logout error: $e');
      rethrow;
    }
  }

  /// Vérifier si un utilisateur est connecté
  bool isLoggedIn() {
    return _auth.currentUser != null;
  }

  /// Invalider le cache
  void clearCache() {
    _currentUser = null;
  }
}
