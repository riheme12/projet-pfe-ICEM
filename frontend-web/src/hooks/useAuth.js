/**
 * Hook d'authentification gérant le contrôle d'accès basé sur les rôles (RBAC)
 * Permet de définir les accès aux pages et aux actions pour chaque rôle utilisateur
 */

// Configurations des permissions par rôle
const ROLE_PERMISSIONS = {
    admin: {
        label: 'Administrateur',
        pages: ['dashboard', 'orders', 'cables', 'anomalies', 'alerts', 'reports', 'users', 'evolution'],
        canCreate: ['orders', 'cables', 'users'],
        canEdit: ['orders', 'cables', 'users', 'anomalies', 'alerts'],
        canDelete: ['orders', 'cables', 'users'],
        canExport: true,
        canResetPassword: true,
        canGenerateReport: true,
    },
    manager: {
        label: 'Responsable Qualité',
        pages: ['dashboard', 'orders', 'cables', 'anomalies', 'alerts', 'reports', 'evolution'],
        canCreate: ['orders', 'cables'],
        canEdit: ['orders', 'cables', 'anomalies', 'alerts'],
        canDelete: ['orders', 'cables'],
        canExport: true,
        canResetPassword: false,
        canGenerateReport: true,
    },
    director: {
        label: 'Directeur',
        pages: ['dashboard', 'orders', 'cables', 'anomalies', 'reports', 'evolution'],
        canCreate: [],
        canEdit: [],
        canDelete: [],
        canExport: true,
        canResetPassword: false,
        canGenerateReport: true,
    },
    technician: {
        label: 'Technicien',
        pages: [], // Pas d'accès au portail web
        canCreate: [],
        canEdit: [],
        canDelete: [],
        canExport: false,
        canResetPassword: false,
        canGenerateReport: false,
    }
};

// Mapping des paths de routes vers les noms de pages
const PATH_TO_PAGE = {
    '/': 'dashboard',
    '/orders': 'orders',
    '/cables': 'cables',
    '/anomalies': 'anomalies',
    '/alerts': 'alerts',
    '/reports': 'reports',
    '/users': 'users',
    '/evolution': 'evolution'
};

/**
 * Récupère l'utilisateur connecté depuis localStorage
 */
export function getCurrentUser() {
    try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error parsing currentUser:', e);
    }
    return null;
}

/**
 * Hook principal d'authentification (RBAC actif)
 */
export function useAuth() {
    const user = getCurrentUser();
    
    // Déterminer le rôle de l'utilisateur
    const userRole = user?.role || (user?.roles && user?.roles[0]) || 'technician';
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.technician;

    let actualRoleLabel = permissions.label;
    if (user) {
        const rawRole = user.role || (user.roles && user.roles[0]);
        if (rawRole && typeof rawRole === 'string') {
            const normalized = rawRole.toLowerCase().trim();
            if (ROLE_PERMISSIONS[normalized]) {
                actualRoleLabel = ROLE_PERMISSIONS[normalized].label;
            } else {
                actualRoleLabel = rawRole;
            }
        }
    }

    return {
        user,
        roles: user?.roles || (user?.role ? [user.role] : ['technician']),
        role: userRole,
        roleLabel: actualRoleLabel,
        
        /** Vérifie si l'utilisateur a accès à une page */
        hasPageAccess: (page) => permissions.pages.includes(page),
        
        /** Vérifie si l'utilisateur a accès à un path de route */
        hasRouteAccess: (path) => {
            const page = PATH_TO_PAGE[path];
            if (!page) return true;
            return permissions.pages.includes(page);
        },
        
        /** Vérifie si l'utilisateur peut créer une ressource */
        canCreate: (resource) => permissions.canCreate.includes(resource),
        
        /** Vérifie si l'utilisateur peut modifier une ressource */
        canEdit: (resource) => permissions.canEdit.includes(resource),
        
        /** Vérifie si l'utilisateur peut supprimer une ressource */
        canDelete: (resource) => permissions.canDelete.includes(resource),
        
        /** Vérifie si l'utilisateur peut exporter des données */
        canExport: permissions.canExport,
        
        /** Vérifie si l'utilisateur peut réinitialiser un mot de passe */
        canResetPassword: permissions.canResetPassword,
        
        /** Vérifie si l'utilisateur peut générer des rapports */
        canGenerateReport: permissions.canGenerateReport,
        
        /** Liste des pages accessibles */
        accessiblePages: permissions.pages,
    };
}

export { PATH_TO_PAGE };
export default useAuth;
