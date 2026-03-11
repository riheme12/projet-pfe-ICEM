import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import '../models/user.dart';
import './auth_service.dart';

/// Service pour gérer les données utilisateur via Firestore
class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;
  final AuthService _authService = AuthService();

  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  /// Récupérer l'utilisateur actuellement connecté
  Future<User?> getCurrentUser() async {
    return await _authService.getCurrentUser();
  }

  /// Mettre à jour le profil utilisateur
  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? photoUrl,
  }) async {
    final user = _auth.currentUser;
    if (user == null) return;

    Map<String, dynamic> updates = {};
    if (fullName != null) updates['fullName'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (photoUrl != null) updates['photoUrl'] = photoUrl;

    if (updates.isNotEmpty) {
      await _db.collection('users').doc(user.uid).update(updates);
    }
  }

  /// Récupérer les statistiques de l'utilisateur
  Future<UserStats> getUserStats() async {
    final user = await getCurrentUser();
    return user?.stats ?? UserStats.empty();
  }

  /// Déconnexion
  Future<void> logout() async {
    await _authService.logout();
  }

  /// Vérifier si un utilisateur est connecté
  bool isLoggedIn() {
    return _auth.currentUser != null;
  }
}
