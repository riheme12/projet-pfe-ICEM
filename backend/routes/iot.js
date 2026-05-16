const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// GET /api/iot/alert-status
// Retourne le statut des alertes pour le module IoT ESP32
router.get('/alert-status', async (req, res) => {
    try {
        // Récupérer toutes les anomalies
        const snapshot = await db.collection('anomaly').get();
        
        // Filtrer celles qui sont actives (non traitées)
        const activeAnomalies = snapshot.docs.filter(doc => {
            const data = doc.data();
            const status = data.statut?.toLowerCase() || '';
            // Si le statut n'est pas "traitee", "archivee", ou "resolue", elle est active.
            const isUntreated = !['traitee', 'archivee', 'resolue'].includes(status);
            return isUntreated;
        });

        // Nombre d'anomalies actives
        const activeCount = activeAnomalies.length;

        // Réponse pour l'ESP32
        res.status(200).json({
            activeCount: activeCount,
            hasAlert: activeCount > 0
        });
    } catch (error) {
        console.error("Erreur lors de la vérification du statut IoT :", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
