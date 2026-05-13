/**
 * Hook d'authentification et de contrôle d'accès RBAC
 * Gère les rôles : admin, manager (responsable qualité), direction
 */

// Définition des permissions par rôle
const ROLE_PERMISSIONS = {
    admin: {
        label: 'Administrateur',
        pages: ['dashboard', 'orders', 'cables', 'anomalies', 'alerts', 'reports', 'users', 'roles', 'trends'],
        canCreate: ['orders', 'cables', 'users', 'roles'],
        canEdit: ['orders', 'cables', 'users', 'roles', 'anomalies', 'alerts'],
        canDelete: ['orders', 'cables', 'users', 'roles'],
        canExport: true,
        canResetPassword: true,
        canGenerateReport: true,
    },
    manager: {
        label: 'Responsable Qualité',
        pages: ['dashboard', 'orders', 'cables', 'anomalies', 'alerts', 'reports', 'trends'],
        canCreate: [],
        canEdit: ['anomalies', 'alerts'],
        canDelete: [],
        canExport: true,
        canResetPassword: false,
        canGenerateReport: true,
    },
    direction: {
        label: 'Direction',
        pages: ['dashboard', 'reports', 'trends'],
        canCreate: [],
        canEdit: [],
        canDelete: [],
        canExport: true,
        canResetPassword: false,
        canGenerateReport: false,
    },
    technician: {
        label: 'Technicien Qualité',
        pages: ['dashboard'],
        canCreate: [],
        canEdit: [],
        canDelete: [],
        canExport: false,
        canResetPassword: false,
        canGenerateReport: false,
    },
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
    '/roles': 'roles',
    '/trends': 'trends'
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
 * Hook principal d'authentification et RBAC
 */
export function useAuth() {
    const user = getCurrentUser();
    const roles = user?.roles || (user?.role ? [user.role] : ['technician']);
    
    // Combine permissions
    const permissions = {
        label: roles.map(r => ROLE_PERMISSIONS[r]?.label || r).join(', '),
        pages: [],
        canCreate: [],
        canEdit: [],
        canDelete: [],
        canExport: false,
        canResetPassword: false,
        canGenerateReport: false,
    };

    roles.forEach(role => {
        const p = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.technician;
        permissions.pages = [...new Set([...permissions.pages, ...p.pages])];
        permissions.canCreate = [...new Set([...permissions.canCreate, ...p.canCreate])];
        permissions.canEdit = [...new Set([...permissions.canEdit, ...p.canEdit])];
        permissions.canDelete = [...new Set([...permissions.canDelete, ...p.canDelete])];
        permissions.canExport = permissions.canExport || p.canExport;
        permissions.canResetPassword = permissions.canResetPassword || p.canResetPassword;
        permissions.canGenerateReport = permissions.canGenerateReport || p.canGenerateReport;
    });

    return {
        user,
        roles,
        role: roles[0],
        roleLabel: permissions.label,
        
        /** Vérifie si l'utilisateur a accès à une page */
        hasPageAccess: (page) => permissions.pages.includes(page),
        
        /** Vérifie si l'utilisateur a accès à un path de route */
        hasRouteAccess: (path) => {
            const page = PATH_TO_PAGE[path];
            if (!page) return true; // Les paths non mappés (comme /inspections/:id) sont accessibles
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

export { ROLE_PERMISSIONS, PATH_TO_PAGE };
export default useAuth;
