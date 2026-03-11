import 'package:cloud_firestore/cloud_firestore.dart';
<<<<<<< HEAD
import 'package:firebase_auth/firebase_auth.dart' as auth;
=======
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
import '../models/user.dart';
import './auth_service.dart';

<<<<<<< HEAD
/// Service pour gérer les données utilisateur via Firestore
=======
/// Service pour gérer les données utilisateur
/// 
/// Connecté à Firebase Auth et Firestore (collection 'users')
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;
  final AuthService _authService = AuthService();

  // Singleton pattern
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

<<<<<<< HEAD
  /// Récupérer l'utilisateur actuellement connecté
  Future<User?> getCurrentUser() async {
    return await _authService.getCurrentUser();
=======
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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  }

  /// Mettre à jour le profil utilisateur dans Firestore
  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? photoUrl,
  }) async {
<<<<<<< HEAD
    final user = _auth.currentUser;
    if (user == null) return;

    Map<String, dynamic> updates = {};
    if (fullName != null) updates['fullName'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (photoUrl != null) updates['photoUrl'] = photoUrl;

    if (updates.isNotEmpty) {
      await _db.collection('users').doc(user.uid).update(updates);
=======
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
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
    }
  }

  /// Récupérer les statistiques de l'utilisateur depuis Firestore
  Future<UserStats> getUserStats() async {
    final user = await getCurrentUser();
    return user?.stats ?? UserStats.empty();
  }

  /// Déconnexion
  Future<void> logout() async {
<<<<<<< HEAD
    await _authService.logout();
=======
    try {
      await _auth.signOut();
      _currentUser = null;
    } catch (e) {
      print('Logout error: $e');
      rethrow;
    }
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  }

  /// Vérifier si un utilisateur est connecté
  bool isLoggedIn() {
    return _auth.currentUser != null;
<<<<<<< HEAD
=======
  }

  /// Invalider le cache (forcer le rechargement)
  void clearCache() {
    _currentUser = null;
>>>>>>> 835fa6e404f62fbfd43f415bfecb2d8d4fa75317
  }
}
