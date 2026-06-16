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
const iotRoutes = require('./routes/iot');

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

// IoT routes (public — no middleware, used by ESP32)
app.use('/api/iot', iotRoutes);

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

// Basic route
app.get('/', (req, res) => {
    res.send('Backend ICEM Quality Control API is running');
});

// Middleware global de gestion des erreurs (doit être le dernier)
app.use(errorHandler);

const logger = require('./utils/logger');
const { db, rtdb } = require('./firebase');

// =============================================================================
// SYNCHRONISATION FIRESTORE <==> REALTIME DATABASE (POUR LE RASPBERRY PI)
// =============================================================================
try {
    // 1. Écouter Firestore (anomaly) et copier les anomalies actives vers la RTDB
    db.collection('anomaly').onSnapshot(snapshot => {
        const activeAnomalies = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            const status = (data.statut || data.status || '').toLowerCase();
            // Statuts actifs (non résolus)
            if (!['traitee', 'archivee', 'resolue'].includes(status)) {
                activeAnomalies[doc.id] = {
                    id: doc.id,
                    type: data.type || data.typeDefaut || 'Inconnu',
                    severity: data.severity || 'Mineur',
                    confidence: data.confidence || 0,
                    location: data.location || null,
                    cableId: data.cableId || '',
                    detectedAt: data.detectedAt || data.createdAt || new Date().toISOString(),
                    description: data.description || '',
                    statut: status || 'detectee',
                    status: status || 'detectee',
                    technicianName: data.technicianName || 'Auto / IA Roboflow'
                };
            }
        });

        // Mettre à jour dans la Realtime Database
        rtdb.ref('active_anomalies').set(activeAnomalies)
            .then(() => logger.info(`[RTDB Sync] ${Object.keys(activeAnomalies).length} anomalies actives poussees.`))
            .catch(err => logger.error('[RTDB Sync Error] Echec ecriture active_anomalies:', err));
    }, err => {
        logger.error('[RTDB Sync Error] Echec ecoute Firestore:', err);
    });

    // 2. Écouter les résolutions depuis la RTDB (/resolutions) et mettre à jour Firestore
    rtdb.ref('resolutions').on('child_added', async (snapshot) => {
        const anomalyId = snapshot.key;
        if (!anomalyId) return;

        logger.info(`[RTDB Sync] Resolution recue pour l'anomalie : ${anomalyId}`);

        try {
            // Mettre à jour l'anomalie dans Firestore (ce qui va declencher onSnapshot et la retirer de la RTDB)
            const docRef = db.collection('anomaly').doc(anomalyId);
            const docSnap = await docRef.get();
            
            if (docSnap.exists) {
                await docRef.update({
                    statut: 'traitee',
                    status: 'traitee',
                    resolvedAt: new Date().toISOString(),
                    resolvedBy: 'Station Atelier Pyrebase'
                });
                
                // Mettre à jour le statut du câble dans Firestore
                const data = docSnap.data();
                const cableRef = data.cableId;
                if (cableRef) {
                    let cableSnap = await db.collection('cable').where('reference', '==', cableRef).get();
                    if (cableSnap.empty) {
                        cableSnap = await db.collection('cable').where('code', '==', cableRef).get();
                    }
                    for (const cableDoc of cableSnap.docs) {
                        await db.collection('cable').doc(cableDoc.id).update({
                            status: 'Conforme',
                            anomaliesCount: 0
                        });
                    }
                }
            }
            
            // Nettoyer la file de resolution de la RTDB
            await rtdb.ref(`resolutions/${anomalyId}`).remove();
        } catch (err) {
            logger.error(`[RTDB Sync Error] Impossible de resoudre l'anomalie ${anomalyId}:`, err);
        }
    });

} catch (err) {
    logger.error('[RTDB Init Error] Echec config sync Realtime DB:', err);
}

// Start server (Seulement si le fichier est exécuté directement, pas lors des tests)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

module.exports = app; // Exporté pour les tests d'intégration
