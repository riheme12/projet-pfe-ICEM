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

// Get cables by production order
router.get('/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const cleanOrderId = orderId.replace(/^OFL/i, 'OF');
        const withL = 'OFL' + cleanOrderId.substring(2);
        
        const possibleOrderIds = [
            cleanOrderId,
            cleanOrderId.replace(/\//g, '&#x2F;'),
            withL,
            withL.replace(/\//g, '&#x2F;')
        ];
        
        const uniqueOrderIds = [...new Set(possibleOrderIds)];
        const snapshot = await db.collection('cable')
            .where('orderId', 'in', uniqueOrderIds)
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

// Get a single cable by ID or Reference
router.get('/:id', async (req, res) => {
    try {
        let doc = await db.collection('cable').doc(req.params.id).get();
        if (!doc.exists) {
            const orderId = req.query.orderId;
            let queryRef = db.collection('cable').where('reference', '==', req.params.id);
            let queryCode = db.collection('cable').where('code', '==', req.params.id);
            
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
                
                // Try finding by reference in this specific order
                const snapshotRef = await queryRef.where('orderId', 'in', possibleOrderIds).limit(1).get();
                if (!snapshotRef.empty) {
                    doc = snapshotRef.docs[0];
                } else {
                    // Try finding by code in this specific order
                    const snapshotCode = await queryCode.where('orderId', 'in', possibleOrderIds).limit(1).get();
                    if (!snapshotCode.empty) {
                        doc = snapshotCode.docs[0];
                    }
                }
            }
            
            // Fallback to simple limit(1) if not found with orderId or orderId not provided
            if (!doc || !doc.exists) {
                const snapshotRef = await queryRef.limit(1).get();
                if (snapshotRef.empty) {
                    const snapshotCode = await queryCode.limit(1).get();
                    if (snapshotCode.empty) {
                        return res.status(404).json({ error: 'Cable not found' });
                    }
                    doc = snapshotCode.docs[0];
                } else {
                    doc = snapshotRef.docs[0];
                }
            }
        }
        const cable = Cable.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(cable.toJson());
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
        let doc = await db.collection('cable').doc(req.params.id).get();
        if (!doc.exists) {
            // Try by reference
            const snapshot = await db.collection('cable').where('reference', '==', req.params.id).limit(1).get();
            if (snapshot.empty) {
                // Try by code
                const snapshotCode = await db.collection('cable').where('code', '==', req.params.id).limit(1).get();
                if (snapshotCode.empty) {
                    return res.status(404).json({ error: 'Cable not found' });
                }
                doc = snapshotCode.docs[0];
            } else {
                doc = snapshot.docs[0];
            }
        }
        const existingData = { id: doc.id, ...doc.data() };
        const updatedData = { ...existingData, ...req.body };
        const cable = Cable.fromJson(updatedData);
        const data = cable.toJson();
        delete data.id;
        await db.collection('cable').doc(doc.id).update(data);
        res.status(200).json({ id: doc.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
