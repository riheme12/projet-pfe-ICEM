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
            return res.status(401).json({ error: 'Token expired' });
        }
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Get current user from token
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = User.fromJson({ id: userDoc.id, ...userDoc.data() });
        res.status(200).json(user.toJson());
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;
