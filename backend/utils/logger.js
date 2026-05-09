const winston = require('winston');

// Définition du format de log
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Création du logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: logFormat,
    defaultMeta: { service: 'icem-backend' },
    transports: [
        // Écrire tous les logs d'erreur dans 'error.log'
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Écrire tous les logs dans 'combined.log'
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Si on n'est pas en production, on loggue aussi dans la console avec des couleurs
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
