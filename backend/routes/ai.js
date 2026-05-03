/**
 * Routes d'inférence IA — Intégration Roboflow
 * 
 * POST /api/ai/analyze   — Analyser une image via Roboflow
 * GET  /api/ai/config     — Obtenir la config du modèle (sans l'API key)
 * POST /api/ai/test       — Tester la connexion Roboflow
 */
const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const roboflowService = require('../services/roboflowService');
const { Anomaly } = require('../models');

/**
 * POST /api/ai/analyze
 * 
 * Corps de la requête :
 * {
 *   "image": "<base64_encoded_image>",
 *   "cableId": "CABLE-001",
 *   "orderId": "OF-001",
 *   "technicianId": "uid",
 *   "technicianName": "Nom Prénom",
 *   "autoSave": true   // Enregistrer automatiquement les anomalies dans Firestore
 * }
 */
router.post('/analyze', async (req, res) => {
    try {
        const { image, imageUrl, cableId, orderId, technicianId, technicianName, autoSave = true } = req.body;

        if (!image && !imageUrl) {
            return res.status(400).json({ 
                error: 'Image manquante',
                message: 'Le champ "image" (base64) ou "imageUrl" est requis.' 
            });
        }

        // Appel à l'API Roboflow (nécessite toujours le base64 pour l'IA)
        const result = await roboflowService.detectDefects(image);

        // Si des anomalies sont détectées et autoSave est activé, les sauvegarder dans Firestore
        const savedAnomalyIds = [];
        
        if (autoSave && result.status === 'NOK' && result.anomalies) {
            for (const detection of result.anomalies) {
                try {
                    const anomalyData = {
                        type: detection.type,
                        severity: detection.severity,
                        confidence: detection.confidence,
                        location: `Zone de détection (${Math.round(detection.boundingBox.x)}, ${Math.round(detection.boundingBox.y)})`,
                        cableId: cableId || 'N/A',
                        detectedAt: new Date().toISOString(),
                        technicianId: technicianId || req.user?.uid || null,
                        technicianName: technicianName || 'Technicien',
                        statut: 'detectee',
                        source: 'roboflow_ai',
                        roboflowClass: detection.roboflowClass,
                        orderId: orderId || null,
                        imageUrl: imageUrl || null, // Nouveau : Lien vers la photo Firebase Storage
                    };

                    const docRef = await db.collection('anomaly').add(anomalyData);
                    savedAnomalyIds.push(docRef.id);

                    // Créer une notification pour l'admin (Toutes les anomalies IA ou juste critiques ?)
                    // Pour le PFE, notifions tout ce qui est détecté par l'IA
                    await db.collection('notifications').add({
                        type: 'anomaly_detected',
                        title: `🔍 Anomalie détectée par IA`,
                        message: `${detection.type} sur câble ${cableId || 'N/A'} (Confiance: ${(detection.confidence * 100).toFixed(0)}%)`,
                        severity: detection.severity,
                        anomalyId: docRef.id,
                        orderId: orderId || null,
                        cableId: cableId || null,
                        imageUrl: imageUrl || null,
                        statut: 'unread',
                        createdAt: new Date().toISOString(),
                    });
                } catch (saveErr) {
                    console.error('Error saving anomaly to Firestore:', saveErr.message);
                }
            }
        }

        res.status(200).json({
            ...result,
            savedAnomalyIds,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('AI analysis error:', error.message);
        
        // Retourner une erreur explicite
        if (error.message.includes('ROBOFLOW_API_KEY')) {
            return res.status(503).json({
                error: 'Configuration manquante',
                message: 'La clé API Roboflow n\'est pas configurée. Ajoutez ROBOFLOW_API_KEY dans le fichier .env',
            });
        }
        
        res.status(500).json({ 
            error: 'Erreur d\'analyse IA',
            message: error.message,
        });
    }
});

/**
 * GET /api/ai/config
 * Retourne la configuration du modèle (sans l'API key)
 */
router.get('/config', async (req, res) => {
    try {
        const config = roboflowService.ROBOFLOW_CONFIG;
        res.status(200).json({
            modelId: config.modelId,
            modelVersion: config.modelVersion,
            confidenceThreshold: config.confidenceThreshold,
            overlapThreshold: config.overlapThreshold,
            isConfigured: !!config.apiKey,
            classMapping: Object.keys(roboflowService.CLASS_MAPPING).filter(k => k !== 'default'),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/test
 * Teste la connexion au modèle Roboflow avec une image minimale
 */
router.post('/test', async (req, res) => {
    try {
        const config = roboflowService.ROBOFLOW_CONFIG;
        
        if (!config.apiKey) {
            return res.status(503).json({
                connected: false,
                message: 'ROBOFLOW_API_KEY non configurée dans .env',
            });
        }

        // Test avec une petite image noire 1x1 en base64 (PNG minimal)
        const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const result = await roboflowService.analyzeImage(testImage);

        res.status(200).json({
            connected: true,
            message: 'Connexion à Roboflow réussie',
            modelId: config.modelId,
            modelVersion: config.modelVersion,
        });
    } catch (error) {
        res.status(200).json({
            connected: false,
            message: `Erreur de connexion: ${error.message}`,
        });
    }
});

module.exports = router;
