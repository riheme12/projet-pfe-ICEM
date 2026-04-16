const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebase');
const { User } = require('../models');

// Get all users
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const user = User.fromJson({ id: doc.id, ...doc.data() });
            return user.toJson();
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = User.fromJson({ id: doc.id, ...doc.data() });
        res.status(200).json(user.toJson());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new user with automatic Firebase Auth account
router.post('/', async (req, res) => {
    try {
        const { email, fullName, role, username } = req.body;

        // 1. Create account in Firebase Auth
        const password = 'Icem2026!'; // Simple default password
        const authUser = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
        });

        // 2. Prepare user data for Firestore
        const user = User.fromJson({
            ...req.body,
            id: authUser.uid, // Use Auth UID as Firestore ID
            isActive: true,
            createdAt: new Date().toISOString()
        });

        const data = user.toJson();
        const uid = data.id;
        delete data.id; // Don't store ID inside the document fields

        // 3. Create document in Firestore with custom ID
        await db.collection('users').doc(uid).set(data);

        res.status(201).json({
            id: uid,
            ...data,
            defaultPassword: password,
            message: 'Utilisateur créé avec succès dans Auth et Firestore'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.patch('/:id', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const existingData = { id: doc.id, ...doc.data() };
        const updatedData = { ...existingData, ...req.body };
        const user = User.fromJson(updatedData);
        const data = user.toJson();
        delete data.id;
        await db.collection('users').doc(req.params.id).update(data);
        res.status(200).json({ id: req.params.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (newPassword) {
            // Reset with a specific new password
            await admin.auth().updateUser(req.params.id, { password: newPassword });
            res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
        } else {
            // Generate a reset link via email
            const userData = doc.data();
            const link = await admin.auth().generatePasswordResetLink(userData.email);
            res.status(200).json({ 
                message: 'Lien de réinitialisation généré',
                resetLink: link 
            });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
