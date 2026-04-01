const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { ManufacturingOrder } = require('../models');

// Get all production orders
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('manufacturingOrder').get();
        const orders = snapshot.docs.map(doc => {
            const order = ManufacturingOrder.fromJson({ id: doc.id, ...doc.data() });
            return order.toJson();
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('manufacturingOrder').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const order = ManufacturingOrder.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(order.toJson());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new production order
router.post('/', async (req, res) => {
    try {
        const order = ManufacturingOrder.fromJson(req.body);
        const data = order.toJson();
        delete data.id;
        const docRef = await db.collection('manufacturingOrder').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics for production orders
router.get('/stats/summary', async (req, res) => {
    try {
        const snapshot = await db.collection('manufacturingOrder').get();
        const stats = {
            total: snapshot.size,
            enCours: 0,
            termine: 0,
            enAttente: 0
        };
        snapshot.forEach(doc => {
            const order = ManufacturingOrder.fromJson({ id: doc.id, ...doc.data() });
            const status = order.status;
            if (status === 'En cours') stats.enCours++;
            else if (status === 'Terminé') stats.termine++;
            else if (status === 'En attente') stats.enAttente++;
        });
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        // Map status back to lowercase if necessary for storage
        const storageStatus = status.toLowerCase() === 'en cours' ? 'en cours' : status.toLowerCase();
        await db.collection('manufacturingOrder').doc(req.params.id).update({ status: storageStatus });
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order
router.patch('/:id', async (req, res) => {
    try {
        const doc = await db.collection('manufacturingOrder').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const existingData = { id: doc.id, ...doc.data() };
        const updatedData = { ...existingData, ...req.body };
        const order = ManufacturingOrder.fromJson(updatedData);
        const data = order.toJson();
        delete data.id;
        await db.collection('manufacturingOrder').doc(req.params.id).update(data);
        res.status(200).json({ id: req.params.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const doc = await db.collection('manufacturingOrder').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        await db.collection('manufacturingOrder').doc(req.params.id).delete();
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
