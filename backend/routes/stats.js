const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// Get trend data for dashboard charts
// Returns inspections and anomalies grouped by day for the last 30 days
router.get('/trends', async (req, res) => {
    try {
        // Get all cables (inspections) and anomalies
        const [cablesSnap, anomaliesSnap] = await Promise.all([
            db.collection('cable').get(),
            db.collection('anomaly').get(),
        ]);

        // Build a map of last 30 days
        const days = {};
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            days[key] = {
                date: key,
                label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                inspections: 0,
                anomalies: 0,
                conformes: 0,
                nonConformes: 0,
            };
        }

        // Count inspections per day
        cablesSnap.forEach(doc => {
            const data = doc.data();
            let dateStr = null;

            if (data.inspectionDate) {
                // Handle Firestore Timestamp or ISO string
                const d = data.inspectionDate._seconds
                    ? new Date(data.inspectionDate._seconds * 1000)
                    : new Date(data.inspectionDate);
                dateStr = d.toISOString().split('T')[0];
            }

            if (dateStr && days[dateStr]) {
                days[dateStr].inspections++;
                const status = (data.status || '').toLowerCase();
                if (status === 'conforme') {
                    days[dateStr].conformes++;
                } else if (status === 'non conforme') {
                    days[dateStr].nonConformes++;
                }
            }
        });

        // Count anomalies per day
        anomaliesSnap.forEach(doc => {
            const data = doc.data();
            let dateStr = null;

            if (data.detectedAt) {
                const d = data.detectedAt._seconds
                    ? new Date(data.detectedAt._seconds * 1000)
                    : new Date(data.detectedAt);
                dateStr = d.toISOString().split('T')[0];
            }

            if (dateStr && days[dateStr]) {
                days[dateStr].anomalies++;
            }
        });

        // Convert to array and compute conformity rate
        const trends = Object.values(days).map(day => ({
            ...day,
            tauxConformite: day.inspections > 0
                ? Math.round((day.conformes / day.inspections) * 100)
                : null,
        }));

        res.status(200).json(trends);
    } catch (error) {
        console.error('Error computing trends:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
