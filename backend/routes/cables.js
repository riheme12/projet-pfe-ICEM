const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { Cable } = require('../models');

// ═══ CACHE MÉMOIRE ══════════════════════════════════════
const cache = {};
const CACHE_TTL = 30 * 1000;
function getCached(key) {
    const e = cache[key];
    if (e && Date.now() - e.time < CACHE_TTL) return e.data;
    return null;
}
function setCache(key, data) { cache[key] = { data, time: Date.now() }; }

// Get all cables (optional filter by orderId)
router.get('/', async (req, res) => {
    try {
        const { orderId, status } = req.query;
        let query = db.collection('cable');

        if (orderId) {
            const cleanOrderId = orderId.replace(/^OFL/i, 'OF');
            const withL = 'OFL' + cleanOrderId.substring(2);
            
            const possibleOrderIds = [
                cleanOrderId,
                cleanOrderId.replace(/\//g, '&#x2F;'),
                withL,
                withL.replace(/\//g, '&#x2F;')
            ];
            
            const uniqueOrderIds = [...new Set(possibleOrderIds)];
            query = query.where('orderId', 'in', uniqueOrderIds);
        }
        if (status) {
            query = query.where('status', '==', status);
        }

        // Tentative de tri + limite (nécessite index si where présent)
        const limitCount = parseInt(req.query.limit) || 200;
        let snapshot;
        try {
            snapshot = await query.orderBy('inspectionDate', 'desc').limit(limitCount).get();
        } catch (e) {
            console.warn("Falling back to unordered query (missing index?):", e.message);
            snapshot = await query.limit(limitCount).get();
        }
        
        const cables = snapshot.docs.map(doc => {
            const cable = Cable.fromJson({ id: doc.id, ...doc.data() }).toJson();
            delete cable.imageUrls; // Optimisation CRITIQUE : ne pas envoyer les images base64 dans la liste
            return cable;
        });
        res.status(200).json(cables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cable stats (CACHED)
router.get('/stats/summary', async (req, res) => {
    try {
        const cached = getCached('cable_stats');
        if (cached) return res.status(200).json(cached);

        const [totalSnap, conformeSnap, nonConformeSnap] = await Promise.all([
            db.collection('cable').count().get(),
            db.collection('cable').where('status', 'in', ['Conforme', 'conforme', 'OK', 'ok']).count().get(),
            db.collection('cable').where('status', 'in', ['Non conforme', 'non conforme', 'NOK', 'nok']).count().get()
        ]);
        
        const total = totalSnap.data().count;
        const conforme = conformeSnap.data().count;
        const nonConforme = nonConformeSnap.data().count;
        
        const stats = { 
            total, 
            conforme, 
            nonConforme, 
            enAttente: total - conforme - nonConforme 
        };
        
        setCache('cable_stats', stats);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cable by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('cable').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Cable not found' });
        }
        const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(cable.toJson());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { body, validationResult } = require('express-validator');

const validateCable = [
    body('reference').trim().notEmpty().withMessage('La référence du câble est requise').escape(),
    body('orderId').trim().notEmpty().withMessage('L\'ID de l\'ordre est requis').escape(),
    body('type').trim().notEmpty().withMessage('Le type de câble est requis').escape(),
    body('status').optional().trim().isIn(['En attente', 'Conforme', 'Non conforme']).withMessage('Statut de câble invalide')
];

// Create a new cable
router.post('/', validateCable, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const cable = Cable.fromJson(req.body);
        const data = cable.toJson();
        delete data.id;
        const docRef = await db.collection('cable').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        next(error);
    }
});

// Update cable
router.patch('/:id', async (req, res) => {
    try {
        const doc = await db.collection('cable').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Cable not found' });
        }
        const existingData = { id: doc.id, ...doc.data() };
        const updatedData = { ...existingData, ...req.body };
        const cable = Cable.fromJson(updatedData);
        const data = cable.toJson();
        delete data.id;
        await db.collection('cable').doc(req.params.id).update(data);
        res.status(200).json({ id: req.params.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete cable
router.delete('/:id', async (req, res) => {
    try {
        const doc = await db.collection('cable').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Cable not found' });
        }
        await db.collection('cable').doc(req.params.id).delete();
        res.status(200).json({ message: 'Cable deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
