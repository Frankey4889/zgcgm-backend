// ═══════════════════════════════════════════════
//  server.js  —  ZGCGM Church Backend
//  Main Express application entry point
// ═══════════════════════════════════════════════
require('dotenv').config();
const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const bcrypt      = require('bcryptjs');
const { Admin }   = require('./models');
const routes      = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ─────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '*',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    /\.github\.io$/,         // allow all GitHub Pages
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ───────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter limits for form submissions
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many submissions. Please wait before trying again.' },
});

app.use('/api/', limiter);
app.use('/api/prayer',    formLimiter);
app.use('/api/contact',   formLimiter);
app.use('/api/newsletter/subscribe', formLimiter);

// ── Body Parsing ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ─────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Static Files (uploaded sermons) ────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.m4a')) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  },
}));

// ── API Routes ──────────────────────────────────
app.use('/api', routes);

// ── Root endpoint ───────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    church:  'Zion Gospel Church of Grace and Mercy',
    abbr:    'ZGCGM',
    api:     '/api',
    version: '1.0.0',
    endpoints: {
      health:      'GET  /api/health',
      prayer:      'POST /api/prayer',
      contact:     'POST /api/contact',
      sermons:     'GET  /api/sermons',
      events:      'GET  /api/events',
      giving:      'POST /api/giving',
      newsletter:  'POST /api/newsletter/subscribe',
      liveStatus:  'GET  /api/live-status',
      adminLogin:  'POST /api/admin/login',
      dashboard:   'GET  /api/admin/dashboard  (auth required)',
    },
  });
});

// ── 404 Handler ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum 500 MB.' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message,
  });
});

// ── Database + Server Start ─────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log('✝  MongoDB connected successfully');

    // Create default admin account if none exists
    const adminExists = await Admin.findOne();
    if (!adminExists) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashed,
        role:     'super',
      });
      console.log('✝  Default admin account created');
      console.log('   Username:', process.env.ADMIN_USERNAME || 'admin');
      console.log('   ⚠️  Change the password immediately after first login!');
    }

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads', 'sermons');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✝  Uploads directory created');
    }

    app.listen(PORT, () => {
      console.log(`\n✝  ZGCGM Church API running on port ${PORT}`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
