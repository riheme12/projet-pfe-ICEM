require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS (doit être avant Helmet et Limiter)
const corsOptions = {
    origin: '*', // Autoriser tous les ports en développement (5173, 5174, etc.)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware de sécurité (Phase 3)
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting de base
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limite augmentée pour le développement
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

app.use(helmet({
    crossOriginResourcePolicy: false, // Nécessaire pour éviter les blocages CORS du front-end
}));
app.use('/api/', limiter);

// Autres Middlewares
app.use(express.json({ limit: '50mb' }));          // Augmenté pour les images base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Auth middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const inspectionsRoutes = require('./routes/inspections');
const anomaliesRoutes = require('./routes/anomalies');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const cablesRoutes = require('./routes/cables');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const aiRoutes = require('./routes/ai');
const rolesRoutes = require('./routes/roles');

// Health Check Endpoint (Phase 3)
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Auth routes (public — no middleware)
app.use('/api/auth', authRoutes);

// Protected routes (require valid Firebase token)
app.use('/api/orders', authenticateToken, ordersRoutes);
app.use('/api/inspections', authenticateToken, inspectionsRoutes);
app.use('/api/anomalies', authenticateToken, anomaliesRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/cables', authenticateToken, cablesRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/roles', authenticateToken, rolesRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Backend ICEM Quality Control API is running');
});

// Middleware global de gestion des erreurs (doit être le dernier)
app.use(errorHandler);

const logger = require('./utils/logger');

// Start server (Seulement si le fichier est exécuté directement, pas lors des tests)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

module.exports = app; // Exporté pour les tests d'intégration
