const logger = require('../utils/logger');

/**
 * Middleware de gestion globale des erreurs
 * Capture toutes les erreurs non gérées et renvoie une réponse formatée
 */
const errorHandler = (err, req, res, next) => {
    // Log structuré de l'erreur avec Winston
    logger.error(`${err.name}: ${err.message}`, { 
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    // Si l'environnement est en développement, on inclut la stack trace
    const isDev = process.env.NODE_ENV !== 'production';
    
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            message: err.message || 'Erreur interne du serveur',
            type: err.name || 'ServerError',
        }
    };

    if (isDev && err.stack) {
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

// Classe d'erreur personnalisée pour les erreurs API (400, 401, 403, 404)
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { errorHandler, ApiError };
