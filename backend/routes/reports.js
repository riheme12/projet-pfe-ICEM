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

// Generate / create a report
router.post('/generate', async (req, res) => {
    try {
        const { orderId = 'global', technicianId = '' } = req.body;

        const [cablesSnap, anomaliesSnap, technicianDoc] = await Promise.all([
            orderId === 'global'
                ? db.collection('cable').get()
                : db.collection('cable').where('orderId', '==', orderId).get(),
            orderId === 'global'
                ? db.collection('anomaly').get()
                : db.collection('anomaly').where('orderId', '==', orderId).get(),
            technicianId ? db.collection('users').doc(technicianId).get() : Promise.resolve(null),
        ]);

        let conformes = 0;
        cablesSnap.forEach((doc) => {
            const status = (doc.data()?.status || '').toLowerCase();
            if (status === 'conforme') conformes++;
        });

        const totalCables = cablesSnap.size;
        const conformityStatus = totalCables > 0 && conformes === totalCables ? 'Conforme' : 'Non conforme';
        const technicianName = technicianDoc?.exists ? technicianDoc.data()?.fullName || null : null;

        const report = Report.fromJson({
            ...req.body,
            generatedAt: new Date().toISOString(),
            cableId: req.body.cableId || '',
            technicianName,
            type: req.body.type || 'Rapport de Production',
            anomaliesCount: anomaliesSnap.size,
            conformityStatus,
        });
        const data = report.toJson();
        delete data.id;
        const docRef = await db.collection('report').add(data);
        res.status(201).json({ id: docRef.id, ...data });
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
