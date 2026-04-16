require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cables', cablesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Backend ICEM Quality Control API is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
