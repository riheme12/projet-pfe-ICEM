const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { Report } = require('../models');

// Get all reports
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('report').get();
        const reports = snapshot.docs.map(doc => {
            const report = Report.fromJson({ id: doc.id, ...doc.data() });
            return report.toJson();
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get report by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('report').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const report = Report.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(report.toJson());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate / create a report
router.post('/generate', async (req, res) => {
    try {
        const report = Report.fromJson({
            ...req.body,
            generatedAt: new Date().toISOString(),
        });
        const data = report.toJson();
        delete data.id;
        const docRef = await db.collection('report').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reports by order
router.get('/order/:orderId', async (req, res) => {
    try {
        const snapshot = await db.collection('report')
            .where('orderId', '==', req.params.orderId)
            .get();
        const reports = snapshot.docs.map(doc => {
            const report = Report.fromJson({ id: doc.id, ...doc.data() });
            return report.toJson();
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
