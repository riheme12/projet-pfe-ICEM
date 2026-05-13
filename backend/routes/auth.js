const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebase');
const { User } = require('../models');

// Login — verify Firebase ID token and return user data
router.post('/login', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID token is required' });
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Fetch user data from Firestore
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        const user = User.fromJson({ id: userDoc.id, ...userDoc.data() });
        res.status(200).json(user.toJson());
    } catch (error) {
        console.error('Auth error:', error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expiré' });
        }
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Token invalide' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Get current user from token
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Aucun token fourni' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        const user = User.fromJson({ id: userDoc.id, ...userDoc.data() });
        res.status(200).json(user.toJson());
    } catch (error) {
        res.status(401).json({ error: 'Token invalide ou expiré' });
    }
});

// Signup — Create new user from public portal
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName, username, role = 'technician' } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, mot de passe et nom complet sont requis' });
        }

        // 1. Create Firebase Auth account
        const authUser = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
        });

        // 2. Create Firestore user document
        const userData = {
            email,
            fullName,
            username: username || email.split('@')[0],
            role,
            roles: [role],
            isActive: true,
            createdAt: new Date().toISOString(),
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
        };

        await db.collection('users').doc(authUser.uid).set(userData);

        res.status(201).json({
            message: 'Compte créé avec succès',
            user: { id: authUser.uid, ...userData }
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
