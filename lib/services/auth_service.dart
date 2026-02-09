import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

/// Authentication service handling login, logout, and session management
class AuthService {
  static const String _keyIsLoggedIn = 'isLoggedIn';
  static const String _keyCurrentUser = 'currentUser';
  static const String _keyRememberMe = 'rememberMe';

  /// Demo users for testing (In production, this would be an API call)
  static final Map<String, Map<String, dynamic>> _demoUsers = {
    'admin': {
      'password': _hashPassword('admin123'),
      'user': User(
        id: '1',
        username: 'admin',
        fullName: 'Administrator',
        email: 'admin@cableinspection.com',
        role: UserRole.admin,
      ),
    },
    'inspector': {
      'password': _hashPassword('inspector123'),
      'user': User(
        id: '2',
        username: 'inspector',
        fullName: 'John Inspector',
        email: 'inspector@cableinspection.com',
        role: UserRole.inspector,
      ),
    },
    'supervisor': {
      'password': _hashPassword('supervisor123'),
      'user': User(
        id: '3',
        username: 'supervisor',
        fullName: 'Jane Supervisor',
        email: 'supervisor@cableinspection.com',
        role: UserRole.supervisor,
      ),
    },
    'operator': {
      'password': _hashPassword('operator123'),
      'user': User(
        id: '4',
        username: 'operator',
        fullName: 'Bob Operator',
        email: 'operator@cableinspection.com',
        role: UserRole.operator,
      ),
    },
  };

  /// Hash password using SHA-256
  static String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Authenticate user with username and password
  Future<User?> login(String username, String password, bool rememberMe) async {
    try {
      // Simulate network delay
      await Future.delayed(const Duration(seconds: 1));

      // Check if user exists
      if (!_demoUsers.containsKey(username.toLowerCase())) {
        return null;
      }

      final userData = _demoUsers[username.toLowerCase()]!;
      final hashedPassword = _hashPassword(password);

      // Verify password
      if (userData['password'] != hashedPassword) {
        return null;
      }

      final user = userData['user'] as User;

      // Save session
      await _saveSession(user, rememberMe);

      return user;
    } catch (e) {
      print('Login error: $e');
      return null;
    }
  }

  /// Save user session to SharedPreferences
  Future<void> _saveSession(User user, bool rememberMe) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsLoggedIn, true);
    await prefs.setBool(_keyRememberMe, rememberMe);
    await prefs.setString(_keyCurrentUser, jsonEncode(user.toJson()));
  }

  /// Get current logged-in user from session
  Future<User?> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final isLoggedIn = prefs.getBool(_keyIsLoggedIn) ?? false;
      final rememberMe = prefs.getBool(_keyRememberMe) ?? false;

      if (!isLoggedIn || !rememberMe) {
        return null;
      }

      final userJson = prefs.getString(_keyCurrentUser);
      if (userJson == null) {
        return null;
      }

      final userMap = jsonDecode(userJson) as Map<String, dynamic>;
      return User.fromJson(userMap);
    } catch (e) {
      print('Get current user error: $e');
      return null;
    }
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyIsLoggedIn) ?? false;
  }

  /// Logout user and clear session
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyIsLoggedIn, false);
    await prefs.remove(_keyCurrentUser);
    // Keep rememberMe preference for next login
  }

  /// Clear all session data including rememberMe
  Future<void> clearAllData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
