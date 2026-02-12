import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

/// Authentication provider for state management
class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;

  /// Initialize auth provider and check for existing session
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      _currentUser = await _authService.getCurrentUser();
    } catch (e) {
      _errorMessage = 'Failed to restore session';
      print('Initialize error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Login with username and password
  Future<bool> login(String username, String password, bool rememberMe) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.login(username, password, rememberMe);
      
      if (user != null) {
        _currentUser = user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Invalid username or password';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = _handleAuthError(e);
      _isLoading = false;
      notifyListeners();
      print('Login error: $e');
      return false;
    }
  }

  /// Signup with email, password, and role
  Future<bool> signup({
    required String email,
    required String password,
    required String fullName,
    required UserRole role,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.signup(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
      );

      if (user != null) {
        _currentUser = user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Signup failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = _handleAuthError(e);
      _isLoading = false;
      notifyListeners();
      print('Signup error: $e');
      return false;
    }
  }

  String _handleAuthError(dynamic e) {
    if (e.toString().contains('user-not-found')) {
      return 'No user found for that email.';
    } else if (e.toString().contains('wrong-password')) {
      return 'Wrong password provided.';
    } else if (e.toString().contains('email-already-in-use')) {
      return 'The account already exists for that email.';
    } else if (e.toString().contains('invalid-email')) {
      return 'The email address is not valid.';
    } else if (e.toString().contains('weak-password')) {
      return 'The password is too weak.';
    }
    return 'Authentication failed. Please try again.';
  }

  /// Logout current user
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logout();
      _currentUser = null;
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'Logout failed';
      print('Logout error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Check if user has specific role
  bool hasRole(UserRole role) {
    return _currentUser?.role == role;
  }

  /// Check if user has any of the specified roles
  bool hasAnyRole(List<UserRole> roles) {
    if (_currentUser == null) return false;
    return roles.contains(_currentUser!.role);
  }
}
