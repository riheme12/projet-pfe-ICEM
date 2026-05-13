const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

// Get all roles
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('roles').get();
        const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // If collection is empty, return defaults
        if (roles.length === 0) {
            const defaults = [
                { label: 'Administrateur', value: 'admin', color: 'indigo' },
                { label: 'Responsable Qualité', value: 'manager', color: 'blue' },
                { label: 'Technicien Qualité', value: 'technician', color: 'emerald' },
                { label: 'Direction', value: 'direction', color: 'amber' }
            ];
            return res.status(200).json(defaults);
        }
        
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create role
router.post('/', async (req, res) => {
    try {
        const { label, value, description, color } = req.body;
        const roleData = { label, value, description, color: color || 'blue', createdAt: new Date().toISOString() };
        const docRef = await db.collection('roles').add(roleData);
        res.status(201).json({ id: docRef.id, ...roleData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update role
router.patch('/:id', async (req, res) => {
    try {
        await db.collection('roles').doc(req.params.id).update(req.body);
        res.status(200).json({ id: req.params.id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete role
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('roles').doc(req.params.id).delete();
        res.status(200).json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
