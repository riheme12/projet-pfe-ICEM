/**
 * Hook d'authentification simplifié (RBAC annulé)
 * Tous les utilisateurs ont désormais accès à toutes les fonctionnalités
 */

// Permissions universelles (Admin pour tous)
const UNIVERSAL_PERMISSIONS = {
    label: 'Utilisateur ICEM',
    pages: ['dashboard', 'orders', 'cables', 'anomalies', 'alerts', 'reports', 'users'],
    canCreate: ['orders', 'cables', 'users'],
    canEdit: ['orders', 'cables', 'users', 'anomalies', 'alerts'],
    canDelete: ['orders', 'cables', 'users'],
    canExport: true,
    canResetPassword: true,
    canGenerateReport: true,
};

// Mapping des paths de routes vers les noms de pages
const PATH_TO_PAGE = {
    '/': 'dashboard',
    '/orders': 'orders',
    '/cables': 'cables',
    '/anomalies': 'anomalies',
    '/alerts': 'alerts',
    '/reports': 'reports',
    '/users': 'users'
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
 * Hook principal d'authentification (Accès Total)
 */
export function useAuth() {
    const user = getCurrentUser();
    
    // Tout le monde est considéré comme ayant les permissions maximales
    const permissions = UNIVERSAL_PERMISSIONS;

    return {
        user,
        roles: ['admin'], // Valeur fixe pour la compatibilité
        role: 'admin',
        roleLabel: permissions.label,
        
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
