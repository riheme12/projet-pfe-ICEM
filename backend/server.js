require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));          // Augmenté pour les images base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Auth middleware
const { authenticateToken } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const inspectionsRoutes = require('./routes/inspections');
const anomaliesRoutes = require('./routes/anomalies');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const cablesRoutes = require('./routes/cables');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const aiRoutes = require('./routes/ai');

// Auth routes (public — no middleware)
app.use('/api/auth', authRoutes);

// Protected routes (require valid Firebase token)
app.use('/api/orders', authenticateToken, ordersRoutes);
app.use('/api/inspections', authenticateToken, inspectionsRoutes);
app.use('/api/anomalies', authenticateToken, anomaliesRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/cables', authenticateToken, cablesRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Backend ICEM Quality Control API is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
