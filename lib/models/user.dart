/// User role enumeration for role-based access control
enum UserRole {
  admin,
  inspector,
  supervisor,
  operator,
}

/// Extension to convert UserRole to/from string
extension UserRoleExtension on UserRole {
  String get name {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.inspector:
        return 'Inspector';
      case UserRole.supervisor:
        return 'Supervisor';
      case UserRole.operator:
        return 'Operator';
    }
  }

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return UserRole.admin;
      case 'inspector':
        return UserRole.inspector;
      case 'supervisor':
        return UserRole.supervisor;
      case 'operator':
        return UserRole.operator;
      default:
        return UserRole.operator;
    }
  }
}

/// User model representing authenticated user
class User {
  final String id;
  final String username;
  final String fullName;
  final String email;
  final UserRole role;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.role,
  });

  /// Convert User to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'fullName': fullName,
      'email': email,
      'role': role.toString().split('.').last,
    };
  }

  /// Create User from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      fullName: json['fullName'] as String,
      email: json['email'] as String,
      role: UserRoleExtension.fromString(json['role'] as String),
    );
  }

  /// Create a copy of User with updated fields
  User copyWith({
    String? id,
    String? username,
    String? fullName,
    String? email,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
    );
  }
}
