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

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();
    try {
      _currentUser = await _authService.getCurrentUser();
    } catch (e) {
      _errorMessage = 'Failed to restore session';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

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
        _errorMessage = 'Identifiant ou mot de passe incorrect';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = _handleAuthError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup(String username, String email, String password, String fullName) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final user = await _authService.signup(
        username: username,
        email: email,
        password: password,
        fullName: fullName,
      );
      if (user != null) {
        _currentUser = user;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _errorMessage = 'Échec de l\'inscription';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = _handleAuthError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _authService.sendPasswordResetEmail(email);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = _handleAuthError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  String _handleAuthError(dynamic e) {
    final err = e.toString().toLowerCase();
    if (err.contains('user-not-found')) return 'Compte inexistant.';
    if (err.contains('wrong-password')) return 'Mot de passe incorrect.';
    if (err.contains('invalid-credential')) return 'Identifiant ou mot de passe incorrect.';
    if (err.contains('invalid-email')) return 'Adresse email invalide.';
    if (err.contains('weak-password')) return 'Mot de passe trop faible.';
    return 'Erreur système: ${e.toString().split('] ').last}';
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.logout();
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() { _errorMessage = null; notifyListeners(); }

  Future<void> refreshCurrentUser() async {
    try {
      final user = await _authService.getCurrentUser();
      if (user != null) { _currentUser = user; notifyListeners(); }
    } catch (_) {}
  }
}
