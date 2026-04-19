const { admin } = require('../firebase');

/**
 * Middleware d'authentification Firebase
 * Vérifie le token Firebase ID dans le header Authorization
 * et attache les informations de l'utilisateur à req.user
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expiré. Veuillez vous reconnecter.' });
        }
        return res.status(401).json({ error: 'Token invalide' });
    }
};

module.exports = { authenticateToken };
