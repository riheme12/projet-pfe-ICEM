/**
 * Modèle représentant un utilisateur du système ICEM
 * Synchronisé avec lib/models/user.dart (mobile)
 */

// Rôles utilisateur disponibles
const UserRole = Object.freeze({
    TECHNICIAN: 'technician',
    MANAGER: 'manager',
    ADMIN: 'admin',
    OPERATOR: 'operator',
});

// Noms d'affichage français pour les rôles
const UserRoleDisplayNames = Object.freeze({
    [UserRole.TECHNICIAN]: 'Technicien',
    [UserRole.MANAGER]: 'Responsable',
    [UserRole.ADMIN]: 'Administrateur',
    [UserRole.OPERATOR]: 'Opérateur',
});

/**
 * Convertir un string en UserRole
 */
function parseUserRole(role) {
    const roleMap = {
        'Technicien': UserRole.TECHNICIAN,
        'technician': UserRole.TECHNICIAN,
        'Responsable': UserRole.MANAGER,
        'manager': UserRole.MANAGER,
        'Administrateur': UserRole.ADMIN,
        'admin': UserRole.ADMIN,
        'Opérateur': UserRole.OPERATOR,
        'operator': UserRole.OPERATOR,
    };
    return roleMap[role] || UserRole.OPERATOR;
}

/**
 * Statistiques personnelles d'un utilisateur
 */
class UserStats {
    constructor({ inspectionsCount = 0, anomaliesDetected = 0, conformityRate = 0.0, cablesProcessed = 0 } = {}) {
        this.inspectionsCount = inspectionsCount;
        this.anomaliesDetected = anomaliesDetected;
        this.conformityRate = conformityRate;
        this.cablesProcessed = cablesProcessed;
    }

    static empty() {
        return new UserStats();
    }

    static fromJson(json) {
        return new UserStats({
            inspectionsCount: json.inspectionsCount || 0,
            anomaliesDetected: json.anomaliesDetected || 0,
            conformityRate: json.conformityRate || 0.0,
            cablesProcessed: json.cablesProcessed || 0,
        });
    }

    toJson() {
        return {
            inspectionsCount: this.inspectionsCount,
            anomaliesDetected: this.anomaliesDetected,
            conformityRate: this.conformityRate,
            cablesProcessed: this.cablesProcessed,
        };
    }
}

/**
 * Modèle User
 */
class User {
    constructor({ id, username, fullName, email, role, photoUrl = null, phone = null, createdAt, stats, isActive = true }) {
        this.id = id || '';
        this.username = username || '';
        this.fullName = fullName || '';
        this.email = email || '';
        this.role = role || UserRole.OPERATOR;
        this.photoUrl = photoUrl;
        this.phone = phone;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt || Date.now());
        this.stats = stats instanceof UserStats ? stats : UserStats.empty();
        this.isActive = isActive !== undefined ? isActive : true;
    }

    static fromJson(json) {
        return new User({
            id: json.id || '',
            username: json.username || '',
            fullName: json.fullName || '',
            email: json.email || '',
            role: parseUserRole(json.role || 'operator'),
            photoUrl: json.photoUrl || null,
            phone: json.phone || null,
            createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
            stats: json.stats ? UserStats.fromJson(json.stats) : UserStats.empty(),
            isActive: json.isActive !== undefined ? json.isActive : true,
        });
    }

    toJson() {
        return {
            id: this.id,
            username: this.username,
            fullName: this.fullName,
            email: this.email,
            role: this.role, // Use logical name (technician, operator, etc.) for storage
            photoUrl: this.photoUrl,
            phone: this.phone,
            createdAt: this.createdAt.toISOString(),
            stats: this.stats.toJson(),
            isActive: this.isActive,
        };
    }
}

module.exports = { User, UserStats, UserRole, UserRoleDisplayNames, parseUserRole };
