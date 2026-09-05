require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const paymentRoutes = require('./routes/payment.routes');
const userRoutes = require('./routes/user.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || !process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome / status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Wolaita Tourism Management System API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chapa_payment: '/api/chapa/initialize',
      admin: '/api/admin',
      contact: '/api/contact'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', paymentRoutes);
app.use('/initialize', paymentRoutes);
app.use('/api/chapa', paymentRoutes);
app.use('/api/admin', userRoutes);
app.use('/api', contactRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;