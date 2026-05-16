import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:projeticem/models/user.dart';

/// Authentication service handling login, logout, and session management using Firebase
class AuthService {
  static const String _keyIsLoggedIn = 'isLoggedIn';
  static const String _keyCurrentUser = 'currentUser';
  static const String _keyRememberMe = 'rememberMe';

  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Authenticate user with username and password
  Future<User?> login(String username, String password, bool rememberMe) async {
    try {
      final email = '$username@icem.app';
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user == null) return null;

      final userDoc = await _firestore.collection('users').doc(userCredential.user!.uid).get();
      if (!userDoc.exists) return null;

      final userData = userDoc.data()!;
      final user = User.fromJson({'id': userCredential.user!.uid, ...userData});

      if (rememberMe) await _saveSession(user, rememberMe);
      return user;
    } catch (e) {
      debugPrint('Login error: $e');
      rethrow;
    }
  }

  /// Register new user (Simplified for PFE)
  Future<User?> signup({
    required String username,
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user == null) return null;
      final uid = userCredential.user!.uid;

      final user = User(
        id: uid,
        username: username,
        fullName: fullName,
        email: email,
        role: UserRole.technician,
        createdAt: DateTime.now(),
        stats: UserStats.empty(),
      );

      await _firestore.collection('users').doc(uid).set(user.toJson());
      return user;
    } catch (e) {
      debugPrint('Signup error: $e');
      rethrow;
    }
  }

  /// Send password reset email
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      debugPrint('Reset email error: $e');
      rethrow;
    }
  }

  Future<void> _saveSession(User user, bool rememberMe) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsLoggedIn, true);
    await prefs.setBool(_keyRememberMe, rememberMe);
    await prefs.setString(_keyCurrentUser, jsonEncode(user.toJson()));
  }

  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(_keyIsLoggedIn) ?? false;
      final rememberMe = prefs.getBool(_keyRememberMe) ?? false;

      if (isLoggedIn && rememberMe) {
        final userJson = prefs.getString(_keyCurrentUser);
        if (userJson != null) {
          try { return User.fromJson(jsonDecode(userJson)); } catch (_) {}
        }
      }

      final firebaseUser = _auth.currentUser;
      if (firebaseUser != null) {
        final userDoc = await _firestore.collection('users').doc(firebaseUser.uid).get();
        if (userDoc.exists) {
          final user = User.fromJson({'id': firebaseUser.uid, ...userDoc.data()!});
          await _saveSession(user, true); 
          return user;
        }
      }
      return null;
    } catch (e) {
      debugPrint('Get current user error: $e');
      return null;
    }
  }

  Future<String?> updateProfilePhoto(String userId, String base64Image) async {
    try {
      await _firestore.collection('users').doc(userId).update({'photoUrl': base64Image});
      final currentUser = await getCurrentUser();
      if (currentUser != null && currentUser.id == userId) {
        final updatedUser = User.fromJson({...currentUser.toJson(), 'photoUrl': base64Image});
        await _saveSession(updatedUser, true);
      }
      return base64Image;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _auth.signOut();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyIsLoggedIn, false);
      await prefs.remove(_keyCurrentUser);
      await prefs.remove(_keyRememberMe);
    } catch (_) {}
  }
}
