require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const documentRoutes = require('./routes/documents');
const invoiceRoutes = require('./routes/invoices');
const templateRoutes = require('./routes/templates');
const dashboardRoutes = require('./routes/dashboard');
const workflowRoutes = require('./routes/workflows');
const paymentRoutes = require('./routes/payments');
const assetRoutes = require('./routes/assets');
const noteRoutes = require('./routes/notes');
const dailyTaskRoutes = require('./routes/dailyTasks');
const path = require('path');

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Assets', express.static(path.join(__dirname, '../Assets')));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://xenotrixos.vercel.app/', // Adding a common default if they follow the guide
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow during first-time setup, but ideally log it
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);

app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const userCount = await mongoose.model('User').countDocuments().catch(() => 0);
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    setup: userCount > 0 ? 'complete' : 'pending_seed'
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xenotrix-agency';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
