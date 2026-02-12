import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

/// Authentication service handling login, logout, and session management using Firebase
class AuthService {
  static const String _keyIsLoggedIn = 'isLoggedIn';
  static const String _keyCurrentUser = 'currentUser';
  static const String _keyRememberMe = 'rememberMe';

  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Authenticate user with username (email) and password
  Future<User?> login(String email, String password, bool rememberMe) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user == null) return null;

      // Fetch user role and details from Firestore
      final userDoc = await _firestore
          .collection('users')
          .doc(userCredential.user!.uid)
          .get();

      if (!userDoc.exists) {
        // If user exists in Auth but not in Firestore, create a default profile
        // This is a fallback, normally signup handles this
        return null;
      }

      final userData = userDoc.data()!;
      final user = User(
        id: userCredential.user!.uid,
        username: userData['username'] ?? email.split('@')[0],
        fullName: userData['fullName'] ?? 'Unknown',
        email: email,
        role: UserRoleExtension.fromString(userData['role'] ?? 'operator'),
      );

      // Save session
      if (rememberMe) {
        await _saveSession(user, rememberMe);
      }

      return user;
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  /// Register new user
  Future<User?> signup({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
  }) async {
    try {
      // Create user in Firebase Auth
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user == null) return null;

      final uid = userCredential.user!.uid;
      final username = email.split('@')[0];

      // Create user document in Firestore
      final user = User(
        id: uid,
        username: username,
        fullName: fullName,
        email: email,
        role: role,
      );

      await _firestore.collection('users').doc(uid).set(user.toJson());

      return user;
    } catch (e) {
      print('Signup error: $e');
      rethrow;
    }
  }

  /// Save user session to SharedPreferences
  Future<void> _saveSession(User user, bool rememberMe) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsLoggedIn, true);
    await prefs.setBool(_keyRememberMe, rememberMe);
    await prefs.setString(_keyCurrentUser, jsonEncode(user.toJson()));
  }

  /// Get current logged-in user from session or Firebase
  Future<User?> getCurrentUser() async {
    try {
      // First check SharedPreferences for offline/quick access
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(_keyIsLoggedIn) ?? false;
      final rememberMe = prefs.getBool(_keyRememberMe) ?? false;

      if (isLoggedIn && rememberMe) {
        final userJson = prefs.getString(_keyCurrentUser);
        if (userJson != null) {
          return User.fromJson(jsonDecode(userJson));
        }
      }

      // If not in prefs, check Firebase Auth state
      final firebaseUser = _auth.currentUser;
      if (firebaseUser != null) {
        final userDoc = await _firestore
            .collection('users')
            .doc(firebaseUser.uid)
            .get();

        if (userDoc.exists) {
          final userData = userDoc.data()!;
          final user = User(
             id: firebaseUser.uid,
             username: userData['username'] ?? firebaseUser.email!.split('@')[0],
             fullName: userData['fullName'] ?? 'Unknown',
             email: firebaseUser.email!,
             role: UserRoleExtension.fromString(userData['role'] ?? 'operator'),
          );
          // Refresh session
          await _saveSession(user, true); 
          return user;
        }
      }

      return null;
    } catch (e) {
      print('Get current user error: $e');
      return null;
    }
  }

  /// Logout user and clear session
  Future<void> logout() async {
    try {
      await _auth.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyIsLoggedIn, false);
      await prefs.remove(_keyCurrentUser);
    } catch (e) {
      print('Logout error: $e');
      rethrow;
    }
  }
}
