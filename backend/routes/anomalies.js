const express = require('express');
const router = express.Router();
const { db, bucket } = require('../firebase');
const { Anomaly } = require('../models');
const emailService = require('../services/emailService');

// ═══ CACHE MÉMOIRE ══════════════════════════════════════
const cache = {};
const CACHE_TTL = 30 * 1000;
function getCached(key) {
    const e = cache[key];
    if (e && Date.now() - e.time < CACHE_TTL) return e.data;
    return null;
}
function setCache(key, data) { cache[key] = { data, time: Date.now() }; }

// Get all anomalies (avec pagination)
router.get('/', async (req, res) => {
    try {
        const { inspectionId, cableId, limit: queryLimit } = req.query;
        let query = db.collection('anomaly');

        if (inspectionId) {
            query = query.where('inspectionId', '==', inspectionId);
        }
        if (cableId) {
            query = query.where('cableId', '==', cableId);
        }
        
        // Appliquer la limite seulement si on ne filtre pas par un ID précis
        if (!inspectionId && !cableId) {
            const limit = parseInt(queryLimit) || 100;
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        const anomalies = snapshot.docs.map(doc => {
            // imageUrl est une URL ImgBB (https://i.ibb.co/...) → on la conserve pour l'affichage
            return Anomaly.fromJson({ id: doc.id, ...doc.data() }).toJson();
        });
        
        // Sort in memory
        anomalies.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
        
        res.status(200).json(anomalies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anomalies by cable (supports both Firestore document ID and reference/code, filtered by orderId)
router.get('/cable/:cableId', async (req, res) => {
    try {
        const cableId = req.params.cableId;
        const reqOrderId = req.query.orderId;
        let queryIds = [cableId];
        let orderIds = [];
        if (reqOrderId) {
            const cleanOrderId = reqOrderId.replace(/^OFL/i, 'OF');
            const withL = 'OFL' + cleanOrderId.substring(2);
            orderIds.push(reqOrderId);
            orderIds.push(reqOrderId.replace(/\//g, '&#x2F;'));
            orderIds.push(cleanOrderId);
            orderIds.push(cleanOrderId.replace(/\//g, '&#x2F;'));
            orderIds.push(withL);
            orderIds.push(withL.replace(/\//g, '&#x2F;'));
        }

        // Résoudre les identifiants possibles du câble (Firestore ID, référence, code)
        try {
            const cableDoc = await db.collection('cable').doc(cableId).get();
            if (cableDoc.exists) {
                const data = cableDoc.data();
                if (data.reference) queryIds.push(data.reference);
                if (data.code) queryIds.push(data.code);
                if (data.orderId) {
                    orderIds.push(data.orderId);
                    orderIds.push(data.orderId.replace(/\//g, '&#x2F;'));
                }
            } else {
                // Essayer de trouver par référence
                let queryRef = db.collection('cable').where('reference', '==', cableId);
                if (reqOrderId) {
                    const cleanOrderId = reqOrderId.replace(/^OFL/i, 'OF');
                    const withL = 'OFL' + cleanOrderId.substring(2);
                    const possibleOrderIds = [
                        reqOrderId,
                        reqOrderId.replace(/\//g, '&#x2F;'),
                        cleanOrderId,
                        cleanOrderId.replace(/\//g, '&#x2F;'),
                        withL,
                        withL.replace(/\//g, '&#x2F;')
                    ];
                    const snapshotRef = await queryRef.where('orderId', 'in', possibleOrderIds).limit(1).get();
                    if (!snapshotRef.empty) {
                        queryIds.push(snapshotRef.docs[0].id);
                        const data = snapshotRef.docs[0].data();
                        if (data.code) queryIds.push(data.code);
                    }
                } else {
                    const snapshotRef = await queryRef.limit(1).get();
                    if (!snapshotRef.empty) {
                        queryIds.push(snapshotRef.docs[0].id);
                        const data = snapshotRef.docs[0].data();
                        if (data.code) queryIds.push(data.code);
                        if (data.orderId) {
                            orderIds.push(data.orderId);
                            orderIds.push(data.orderId.replace(/\//g, '&#x2F;'));
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Erreur lors de la résolution du câble dans la route des anomalies:', err);
        }

        const uniqueQueryIds = [...new Set(queryIds)].filter(Boolean);
        const uniqueOrderIds = [...new Set(orderIds)].filter(Boolean);

        const snapshot = await db.collection('anomaly')
            .where('cableId', 'in', uniqueQueryIds)
            .get();
            
        let anomalies = snapshot.docs.map(doc => {
            return Anomaly.fromJson({ id: doc.id, ...doc.data() }).toJson();
        });

        // Filtrer les anomalies en mémoire par orderId si spécifié
        if (uniqueOrderIds.length > 0) {
            anomalies = anomalies.filter(anom => {
                const anomOrderId = String(anom.orderId || '').toLowerCase().trim();
                return uniqueOrderIds.some(id => String(id).toLowerCase().trim() === anomOrderId);
            });
        }

        // Tri par date
        anomalies.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

        res.status(200).json(anomalies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload image via Backend to Firebase Storage
router.post('/upload-image', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ error: 'Aucune image base64 fournie' });
        }

        // Nettoyer la chaîne base64 (enlever le préfixe data:image/jpeg;base64, si présent)
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const fileName = `inspections/insp_backend_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: {
                contentType: 'image/jpeg',
            },
            public: true // Rendre public pour affichage dans l'app
        });

        // Générer l'URL publique
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        res.status(200).json({ imageUrl: publicUrl });
    } catch (error) {
        console.error('Erreur lors du téléversement backend de l\'image:', error);
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
        if (req.body.imageUrls !== undefined) data.imageUrls = req.body.imageUrls;
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

// Get anomalies stats (CACHED)
router.get('/stats/summary', async (req, res) => {
    try {
        const cached = getCached('anomaly_stats');
        if (cached) return res.status(200).json(cached);

        const [totalSnap, critiqueSnap, majeurSnap] = await Promise.all([
            db.collection('anomaly').count().get(),
            db.collection('anomaly').where('severity', 'in', ['Critique', 'critique']).count().get(),
            db.collection('anomaly').where('severity', 'in', ['Majeur', 'majeur']).count().get()
        ]);

        const total = totalSnap.data().count;
        const critique = critiqueSnap.data().count;
        const majeur = majeurSnap.data().count;
        
        const stats = { 
            total, 
            critique, 
            majeur, 
            mineur: total - critique - majeur 
        };
        
        setCache('anomaly_stats', stats);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get anomaly by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('anomaly').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Anomaly not found' });
        }
        const anomaly = Anomaly.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(anomaly.toJson());
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

                // Mettre à jour le câble associé → retour à "Conforme"
                const cableRef = existingData.cableId;
                if (cableRef) {
                    try {
                        // Chercher le câble par référence ou code
                        let cableSnap = await db.collection('cable')
                            .where('reference', '==', cableRef).get();
                        if (cableSnap.empty) {
                            cableSnap = await db.collection('cable')
                                .where('code', '==', cableRef).get();
                        }
                        for (const cableDoc of cableSnap.docs) {
                            await db.collection('cable').doc(cableDoc.id).update({
                                status: 'Conforme',
                                anomaliesCount: 0,
                            });
                        }

                        // Ajuster les compteurs de l'ordre de fabrication
                        const orderId = existingData.orderId;
                        if (orderId) {
                            const orderDoc = await db.collection('manufacturingOrder').doc(orderId).get();
                            if (orderDoc.exists) {
                                const orderData = orderDoc.data();
                                const conformCount = parseInt(orderData.conformCount || 0);
                                const nonConformCount = parseInt(orderData.nonConformCount || 0);
                                if (nonConformCount > 0) {
                                    await db.collection('manufacturingOrder').doc(orderId).update({
                                        conformCount: conformCount + 1,
                                        nonConformCount: nonConformCount - 1,
                                    });
                                }
                            }
                        }
                    } catch (cableErr) {
                        console.error('Error updating cable on resolve:', cableErr);
                    }
                }
            }
        }
        const updatePayload = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        if (req.body.statut === 'traitee') {
            updatePayload.resolvedAt = new Date().toISOString();
        }

        await db.collection('anomaly').doc(req.params.id).update(updatePayload);
        res.status(200).json({ id: req.params.id, ...existingData, ...updatePayload });
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

// Get unread critical alerts count (CACHED)
router.get('/notifications/unread/count', async (req, res) => {
    try {
        const cached = getCached('unread_count');
        if (cached) return res.status(200).json(cached);

        // Requête filtrée server-side : seulement les anomalies non traitées
        const snapshot = await db.collection('anomaly')
            .where('statut', '==', 'detectee')
            .get();

        const criticalCount = snapshot.docs.filter(doc => {
            const severity = (doc.data().severity || '').toLowerCase();
            return ['critique', 'haute'].includes(severity);
        }).length;

        const result = { count: criticalCount };
        setCache('unread_count', result);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
