const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { Anomaly } = require('../models');
const emailService = require('../services/emailService');

// Get all anomalies
router.get('/', async (req, res) => {
    try {
        const { inspectionId, cableId } = req.query;
        let query = db.collection('anomaly');

        if (inspectionId) {
            query = query.where('inspectionId', '==', inspectionId);
        }
        if (cableId) {
            query = query.where('cableId', '==', cableId);
        }

        const snapshot = await query.get();
        const anomalies = snapshot.docs.map(doc => {
            const anomaly = Anomaly.fromJson({ id: doc.id, ...doc.data() });
            return anomaly.toJson();
        });
        res.status(200).json(anomalies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anomalies by cable
router.get('/cable/:cableId', async (req, res) => {
    try {
        const snapshot = await db.collection('anomaly')
            .where('cableId', '==', req.params.cableId)
            .get();
        const anomalies = snapshot.docs.map(doc => {
            const anomaly = Anomaly.fromJson({ id: doc.id, ...doc.data() });
            return anomaly.toJson();
        });
        res.status(200).json(anomalies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new anomaly
router.post('/', async (req, res) => {
    try {
        const anomaly = Anomaly.fromJson(req.body);
        const data = anomaly.toJson();
        data.statut = req.body.statut || 'detectee';
        if (req.body.mesureCorrective !== undefined) data.mesureCorrective = req.body.mesureCorrective;
        if (req.body.orderId !== undefined) data.orderId = req.body.orderId;
        if (req.body.inspectionId !== undefined) data.inspectionId = req.body.inspectionId;
        if (req.body.imageUrl !== undefined) data.imageUrl = req.body.imageUrl;
        delete data.id;
        const docRef = await db.collection('anomaly').add(data);
        const createdAnomaly = { id: docRef.id, ...data };

        await db.collection('notifications').add({
            type: 'anomaly_detected',
            title: `Anomalie ${createdAnomaly.severity || 'Inconnue'} détectée`,
            message: `${createdAnomaly.type || 'Anomalie'} sur câble ${createdAnomaly.cableId || 'N/A'}`,
            anomalyId: docRef.id,
            orderId: createdAnomaly.orderId || null,
            cableId: createdAnomaly.cableId || null,
            technicianId: createdAnomaly.technicianId || null,
            statut: 'unread',
            createdAt: new Date().toISOString(),
        });

        // Handle Email Alerts if Critical
        if (createdAnomaly.severity?.toLowerCase() === 'critique') {
            try {
                // Fetch settings for notification config
                const settingsDoc = await db.collection('settings').doc('global_config').get();
                const settings = settingsDoc.exists ? settingsDoc.data() : null;
                
                const alertsConfig = settings?.alerts;
                const enableEmail = alertsConfig?.enableEmailNotifications;
                const recipientsStr = alertsConfig?.emailRecipients;

                if (enableEmail && recipientsStr) {
                    const recipients = recipientsStr.split(',').map(r => r.trim()).filter(r => r);
                    if (recipients.length > 0) {
                        // Async send (don't block response)
                        emailService.sendCriticalAlert({
                            recipients,
                            anomalyType: createdAnomaly.type,
                            severity: createdAnomaly.severity,
                            confidence: createdAnomaly.confidence,
                            cableId: createdAnomaly.cableId,
                            orderId: createdAnomaly.orderId
                        }).catch(err => console.error('Delayed email sending error:', err));
                    }
                }
            } catch (err) {
                console.error('Email alert trigger error:', err);
            }
        }

        res.status(201).json(createdAnomaly);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anomalies stats
router.get('/stats/summary', async (req, res) => {
    try {
        const snapshot = await db.collection('anomaly').get();
        const stats = {
            total: snapshot.size,
            critique: 0,
            majeur: 0,
            mineur: 0
        };
        snapshot.forEach(doc => {
            const anomaly = Anomaly.fromJson({ id: doc.id, ...doc.data() });
            const severity = anomaly.severity.toLowerCase();
            if (severity === 'critique') stats.critique++;
            else if (severity === 'majeur') stats.majeur++;
            else if (severity === 'mineur') stats.mineur++;
        });
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update anomaly (e.g., mark as treated)
router.patch('/:id', async (req, res) => {
    try {
        const doc = await db.collection('anomaly').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Anomaly not found' });
        }
        const existingData = { id: doc.id, ...doc.data() };
        const data = { ...existingData, ...req.body };
        data.updatedAt = new Date().toISOString();
        if (req.body.statut === 'traitee') {
            data.resolvedAt = new Date().toISOString();
            if (!existingData.statut || existingData.statut !== 'traitee') {
                await db.collection('notifications').add({
                    type: 'anomaly_resolved',
                    title: 'Anomalie traitée',
                    message: `${existingData.type || 'Anomalie'} a été marquée comme traitée`,
                    anomalyId: req.params.id,
                    orderId: existingData.orderId || null,
                    cableId: existingData.cableId || null,
                    statut: 'unread',
                    createdAt: new Date().toISOString(),
                });
            }
        }
        delete data.id;
        await db.collection('anomaly').doc(req.params.id).update(data);
        res.status(200).json({ id: req.params.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete anomaly
router.delete('/:id', async (req, res) => {
    try {
        const doc = await db.collection('anomaly').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Anomaly not found' });
        }
        await db.collection('anomaly').doc(req.params.id).delete();
        res.status(200).json({ message: 'Anomaly deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
