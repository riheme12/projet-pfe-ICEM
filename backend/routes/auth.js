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

// Forgot Password — generate and send reset link using local emailService
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email est requis' });
        }

        // Check if user exists in Firestore
        const userQuery = await db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            // Return success even if email is not found to prevent user enumeration attacks
            return res.status(200).json({ message: 'Si l\'adresse email est valide, un lien a été envoyé.' });
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        // Get request origin to form the reset link
        const referer = req.headers.referer || 'http://localhost:5173/';
        const origin = new URL(referer).origin;

        // Generate password reset link using Firebase Admin SDK
        const actionCodeSettings = {
            url: `${origin}/login`,
        };
        const firebaseResetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

        // Parse oobCode from the firebaseResetLink
        const linkUrl = new URL(firebaseResetLink);
        const oobCode = linkUrl.searchParams.get('oobCode');

        // Form our own custom link that points to our reset-password page
        const customResetLink = `${origin}/reset-password?oobCode=${oobCode}`;

        // Send email via local EmailService
        const emailService = require('../services/emailService');
        await emailService.transporter.sendMail({
            from: `"ICEM Quality Control" <${emailService.fromAddress}>`,
            to: email,
            subject: 'ICEM — Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px; border-radius: 24px;">
                    <div style="background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); padding: 32px; border-radius: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">ICEM Quality Control</h1>
                        <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.7);">Système Intelligent de Contrôle Qualité</p>
                    </div>
                    
                    <div style="background: white; padding: 32px; border-radius: 20px; margin-top: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #0f172a;">Demande de réinitialisation</h2>
                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                            Bonjour <strong>${userData.fullName || userData.username || email}</strong>,
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte de supervision ICEM. Cliquez sur le bouton ci-dessous pour configurer un nouveau mot de passe :
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${customResetLink}" style="background: linear-gradient(135deg, #312e81, #4338ca); color: white; padding: 16px 36px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(67,56,202,0.3);">
                                Réinitialiser le mot de passe
                            </a>
                        </div>
                        
                        <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                            Si le bouton ci-dessus ne fonctionne pas, copiez-collez le lien suivant dans votre navigateur :
                        </p>
                        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6366f1; word-break: break-all; font-family: monospace;">
                            ${customResetLink}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
                        <p style="margin: 0 0 4px 0;">Ce lien est valable pour une durée limitée. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                        <p style="margin: 0;">© 2026 ICEM Quality Control System. Tous droits réservés.</p>
                    </div>
                </div>
            `
        });

        res.status(200).json({ message: 'Si l\'adresse email est valide, un lien a été envoyé.' });
    } catch (error) {
        console.error('Error generating forgot password link:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
