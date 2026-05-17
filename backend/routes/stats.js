const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// ═══ CACHE MÉMOIRE SERVEUR ════════════════════════════════════════════
// Évite de re-requêter Firestore à chaque appel (TTL: 30 secondes)
const cache = {};
const CACHE_TTL = 30 * 1000; // 30 secondes

function getCached(key) {
    const entry = cache[key];
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
    return null;
}

function setCache(key, data) {
    cache[key] = { data, time: Date.now() };
}

// ═══ GLOBAL SUMMARY (Optimisé pour la vitesse) ════════════════════════
// Retourne les indicateurs clés en une seule requête, avec cache
router.get('/summary', async (req, res) => {
    try {
        const cached = getCached('global_summary');
        if (cached) return res.status(200).json(cached);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // On récupère TOUS les documents pour assurer la cohérence avec les autres interfaces
        // (Alertes, Registre, etc.) qui affichent les totaux globaux.
        const [cablesSnapshot, anomaliesSnapshot, ordersSnapshot, reportsSnap] = await Promise.all([
            db.collection('cable').get(),
            db.collection('anomaly').get(),
            db.collection('manufacturingOrder').get(),
            db.collection('report').count().get()
        ]);


        // Agrégation Câbles
        let totalCables = 0;
        let conformCount = 0;
        cablesSnapshot.forEach(doc => {
            totalCables++;
            const status = (doc.data().status || '').toLowerCase();
            if (['conforme', 'ok'].includes(status)) {
                conformCount++;
            }
        });

        // Agrégation Anomalies
        let totalAnom = 0;
        let critiqueAnom = 0;
        let majeurAnom = 0;
        anomaliesSnapshot.forEach(doc => {
            totalAnom++;
            const severity = (doc.data().severity || '').toLowerCase();
            if (['critique', 'high', 'haute'].includes(severity)) critiqueAnom++;
            else if (['majeur', 'medium', 'moyenne'].includes(severity)) majeurAnom++;
        });

        // Agrégation Ordres
        let totalOrders = 0;
        let enCoursOrders = 0;
        let termineOrders = 0;
        ordersSnapshot.forEach(doc => {
            totalOrders++;
            const status = (doc.data().status || '').toLowerCase();
            if (status.includes('cours')) enCoursOrders++;
            else if (status.includes('termin')) termineOrders++;
        });

        const summary = {
            totalInspections: totalCables,
            conformityRate: totalCables > 0 ? Math.round((conformCount / totalCables) * 100) : 100,
            cables: { 
                total: totalCables, 
                conforme: conformCount, 
                nonConforme: totalCables - conformCount 
            },
            orders: { 
                total: totalOrders, 
                enCours: enCoursOrders, 
                termine: termineOrders, 
                enAttente: totalOrders - enCoursOrders - termineOrders 
            },
            anomalies: { 
                total: totalAnom, 
                critique: critiqueAnom, 
                majeur: majeurAnom, 
                mineur: totalAnom - critiqueAnom - majeurAnom 
            },
            reportsGenerated: reportsSnap.data().count,
            updatedAt: new Date().toISOString()
        };

        setCache('global_summary', summary);
        res.status(200).json(summary);
    } catch (error) {
        console.error('Error in stats/summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get trend data for dashboard charts (OPTIMISÉ avec cache)
router.get('/trends', async (req, res) => {
    try {
        const cached = getCached('trends');
        if (cached) return res.status(200).json(cached);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [cablesSnap, anomaliesSnap] = await Promise.all([
            db.collection('cable')
                .where('inspectionDate', '>=', thirtyDaysAgo)
                .get(),
            db.collection('anomaly')
                .where('detectedAt', '>=', thirtyDaysAgo.toISOString())
                .get(),
        ]);

        const days = {};
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            days[key] = {
                date: key,
                label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                inspections: 0, anomalies: 0, conformes: 0, nonConformes: 0,
            };
        }

        cablesSnap.forEach(doc => {
            const data = doc.data();
            let dateStr = null;
            if (data.inspectionDate) {
                const d = data.inspectionDate.toDate ? data.inspectionDate.toDate() : new Date(data.inspectionDate);
                if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
            }
            if (dateStr && days[dateStr]) {
                days[dateStr].inspections++;
                const status = (data.status || '').toLowerCase();
                if (status === 'conforme' || status === 'ok') days[dateStr].conformes++;
                else if (status === 'non conforme' || status === 'nok') days[dateStr].nonConformes++;
            }
        });

        anomaliesSnap.forEach(doc => {
            const data = doc.data();
            let dateStr = null;
            if (data.detectedAt) {
                const d = data.detectedAt.toDate ? data.detectedAt.toDate() : new Date(data.detectedAt);
                if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
            }
            if (dateStr && days[dateStr]) days[dateStr].anomalies++;
        });

        const trends = Object.values(days).map(day => ({
            ...day,
            tauxConformite: day.inspections > 0 ? Math.round((day.conformes / day.inspections) * 100) : null,
        }));

        setCache('trends', trends);
        res.status(200).json(trends);
    } catch (error) {
        console.error('Error computing trends:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
