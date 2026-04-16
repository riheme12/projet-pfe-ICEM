const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

const SETTINGS_DOC_ID = 'global_config';
const COLLECTION = 'settings';

// Default settings
const DEFAULT_SETTINGS = {
    ia: {
        modelName: 'YOLOv8',
        modelVersion: 'v8.1.0',
        confidenceThreshold: 0.75,
        iouThreshold: 0.45,
        maxDetections: 100,
        autoAnalysis: true,
    },
    alerts: {
        minConfidenceForAlert: 0.6,
        enableCriticalNotifications: true,
        enableEmailNotifications: false,
        emailRecipients: '',
        autoEscalateCritical: true,
    },
    system: {
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Tunis',
        retentionDays: 365,
    },
};

// Get settings
router.get('/', async (req, res) => {
    try {
        const doc = await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).get();
        if (!doc.exists) {
            // Return defaults if no settings exist yet
            return res.status(200).json(DEFAULT_SETTINGS);
        }
        // Merge with defaults to ensure all keys exist
        const stored = doc.data();
        const merged = {
            ia: { ...DEFAULT_SETTINGS.ia, ...stored.ia },
            alerts: { ...DEFAULT_SETTINGS.alerts, ...stored.alerts },
            system: { ...DEFAULT_SETTINGS.system, ...stored.system },
        };
        res.status(200).json(merged);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        const data = req.body;
        await db.collection(COLLECTION).doc(SETTINGS_DOC_ID).set(data, { merge: true });
        res.status(200).json({ message: 'Paramètres mis à jour avec succès', ...data });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
