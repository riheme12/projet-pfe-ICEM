const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { ManufacturingOrder } = require('../models');

// ═══ CACHE MÉMOIRE ══════════════════════════════════════
const cache = {};
const CACHE_TTL = 30 * 1000;
function getCached(key) {
    const e = cache[key];
    if (e && Date.now() - e.time < CACHE_TTL) return e.data;
    return null;
}
function setCache(key, data) { cache[key] = { data, time: Date.now() }; }

// IMPORTANT: Static routes (/stats/summary) MUST come before dynamic routes (/:id)

// Get statistics for production orders (CACHED)
router.get('/stats/summary', async (req, res) => {
    try {
        const cached = getCached('order_stats');
        if (cached) return res.status(200).json(cached);

        const [totalSnap, enCoursSnap, termineSnap] = await Promise.all([
            db.collection('manufacturingOrder').count().get(),
            db.collection('manufacturingOrder').where('status', 'in', ['En cours', 'en cours']).count().get(),
            db.collection('manufacturingOrder').where('status', 'in', ['Terminé', 'terminé', 'Termine', 'termine']).count().get()
        ]);

        const total = totalSnap.data().count;
        const enCours = enCoursSnap.data().count;
        const termine = termineSnap.data().count;

        const stats = { 
            total, 
            enCours, 
            termine, 
            enAttente: total - enCours - termine 
        };
        
        setCache('order_stats', stats);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all production orders (CACHED)
router.get('/', async (req, res) => {
    try {
        const cached = getCached('orders_list');
        if (cached) return res.status(200).json(cached);

        const limit = parseInt(req.query.limit) || 100;
        const snapshot = await db.collection('manufacturingOrder').limit(limit).get();
        const orders = snapshot.docs.map(doc => {
            const order = ManufacturingOrder.fromJson({ id: doc.id, ...doc.data() });
            return order.toJson();
        });
        orders.sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate));
        setCache('orders_list', orders);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get order by ID (MUST be after /stats/summary)
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

const { body, validationResult } = require('express-validator');

// Validation middleware for orders
const validateOrder = [
    body('reference').optional().trim().escape(),
    body('numeroOF').optional().trim().escape(),
    body('client').trim().notEmpty().withMessage('Le client est requis').escape(),
    body('quantity').isInt({ min: 1 }).withMessage('La quantité doit être un entier positif'),
    body('status').optional().trim().escape()
];

// Add a new production order (avec validation)
router.post('/', validateOrder, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const order = ManufacturingOrder.fromJson(req.body);
        const data = order.toJson();
        delete data.id;
        const docRef = await db.collection('manufacturingOrder').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        next(error);
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
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

        const currentStatus = (doc.data().statusDisplay || doc.data().status || '').toLowerCase().trim();
        if (currentStatus !== 'en cours' && currentStatus !== 'en attente') {
            return res.status(400).json({ error: 'Seuls les ordres "En cours" ou "En attente" peuvent être modifiés.' });
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

        const currentStatus = (doc.data().statusDisplay || doc.data().status || '').toLowerCase().trim();
        if (currentStatus !== 'en attente') {
            return res.status(400).json({ error: 'Seuls les ordres "En attente" peuvent être supprimés.' });
        }

        await db.collection('manufacturingOrder').doc(req.params.id).delete();
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
