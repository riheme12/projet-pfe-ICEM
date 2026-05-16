const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebase');
const { User } = require('../models');

// Get all users
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const user = User.fromJson({ id: doc.id, ...doc.data() }).toJson();
            delete user.photoUrl; // Optimisation: ne pas charger les images lourdes dans la liste
            return user;
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

const { body, validationResult } = require('express-validator');

// Middlewares de validation
const validateUser = [
    body('email').isEmail().withMessage('Une adresse email valide est requise').normalizeEmail(),
    body('fullName').trim().notEmpty().withMessage('Le nom complet est requis').isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères').escape(),
    body('username').trim().notEmpty().withMessage('Le nom d\'utilisateur est requis').escape(),
    body('roles').isArray().withMessage('Les rôles doivent être une liste de chaînes de caractères')
];

// Create a new user with automatic Firebase Auth account
router.post('/', validateUser, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, fullName, role, username } = req.body;

        // 1. Créer le compte dans Firebase Auth
        const password = process.env.DEFAULT_USER_PASSWORD || 'ChangeMeOnFirstLogin!';
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

        // 4. Send Welcome/Password Email
        try {
            const emailService = require('../services/emailService');
            await emailService.sendPasswordReset({
                email,
                username: username || fullName,
                newPassword: password
            });
        } catch (mailError) {
            console.error('Email failed but user created:', mailError);
        }

        res.status(201).json({
            id: uid,
            ...data,
            defaultPassword: password,
            message: 'Utilisateur créé avec succès et email envoyé'
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

        // Send notification for ANY change
        const emailService = require('../services/emailService');
        try {
            if (req.body.roles || req.body.role) {
                await emailService.sendRoleUpdate({
                    email: user.email,
                    username: user.username || user.fullName,
                    roles: user.roles
                });
            } else {
                // Generic update notification
                await emailService.transporter.sendMail({
                    from: `"ICEM Quality Control" <${emailService.fromAddress}>`,
                    to: user.email,
                    subject: '🛠️ ICEM — Mise à jour de votre compte',
                    html: `<p>Bonjour ${user.fullName},</p><p>Vos informations de compte ont été mises à jour par un administrateur.</p><p>Veuillez vous connecter pour vérifier les changements.</p>`
                });
            }
            console.log(`✉️ Email de notification envoyé avec succès à ${user.email}`);
        } catch (mailErr) {
            console.error('❌ Erreur critique lors de l\'envoi du mail backend:', mailErr.message);
            console.error('Vérifiez que SMTP_USER et SMTP_PASS sont corrects dans le fichier .env');
        }

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
            
            // Send email
            const userData = doc.data();
            const emailService = require('../services/emailService');
            await emailService.sendPasswordReset({
                email: userData.email,
                username: userData.username || userData.fullName,
                newPassword: newPassword
            });

            res.status(200).json({ message: 'Mot de passe réinitialisé avec succès et email envoyé' });
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

// --- Signature Upload ---
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Upload/update user signature
router.post('/:id/signature', upload.single('signature'), async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier de signature fourni' });
        }

        const { bucket } = require('../firebase');
        const fileName = `signatures/${req.params.id}_${Date.now()}.${req.file.originalname.split('.').pop()}`;
        const file = bucket.file(fileName);

        await file.save(req.file.buffer, {
            metadata: { contentType: req.file.mimetype },
        });

        // Make the file publicly accessible
        await file.makePublic();

        const signatureUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Update Firestore
        await db.collection('users').doc(req.params.id).update({ signatureUrl });

        res.status(200).json({ signatureUrl, message: 'Signature uploadée avec succès' });
    } catch (error) {
        console.error('Error uploading signature:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user signature
router.delete('/:id/signature', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.collection('users').doc(req.params.id).update({ signatureUrl: null });

        res.status(200).json({ message: 'Signature supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting signature:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
