const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { Cable } = require('../models');

// Get all cables / inspections
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('cable').get();
        const cables = snapshot.docs.map(doc => {
            const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
            return cable.toJson();
        });
        res.status(200).json(cables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single cable by ID
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

// Get cables by production order
router.get('/order/:orderId', async (req, res) => {
    try {
        const snapshot = await db.collection('cable')
            .where('orderId', '==', req.params.orderId)
            .get();
        const cables = snapshot.docs.map(doc => {
            const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
            return cable.toJson();
        });
        res.status(200).json(cables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new cable
router.post('/', async (req, res) => {
    try {
        const cable = Cable.fromJson(req.body);
        const data = cable.toJson();
        delete data.id;
        const docRef = await db.collection('cable').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update cable (after inspection)
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

module.exports = router;
