const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { Cable } = require('../models');

// Get all cables (optional filter by orderId)
router.get('/', async (req, res) => {
    try {
        const { orderId, status } = req.query;
        let query = db.collection('cable');

        if (orderId) {
            query = query.where('orderId', '==', orderId);
        }
        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        const cables = snapshot.docs.map(doc => {
            const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
            return cable.toJson();
        });
        res.status(200).json(cables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cable stats
router.get('/stats/summary', async (req, res) => {
    try {
        const snapshot = await db.collection('cable').get();
        const stats = {
            total: snapshot.size,
            conforme: 0,
            nonConforme: 0,
            enAttente: 0
        };
        snapshot.forEach(doc => {
            const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
            const s = cable.status?.toLowerCase() || '';
            if (s === 'conforme') stats.conforme++;
            else if (s === 'non conforme') stats.nonConforme++;
            else stats.enAttente++;
        });
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
