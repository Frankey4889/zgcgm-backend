// ═══════════════════════════════════════════════
//  routes/index.js  —  All ZGCGM API Routes
// ═══════════════════════════════════════════════
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const auth     = require('../middleware/auth');
const email    = require('../services/email');
const {
  Prayer, Contact, Sermon, Event,
  Registration, Subscriber, Giving, Admin
} = require('../models');

// ── File Upload Config ──────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/sermons/'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${Date.now()}_${name}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.mp4', '.wav', '.m4a', '.ogg'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only audio/video files are allowed.'));
    }
  },
});

// ════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ZGCGM API is running ✝', timestamp: new Date() });
});

// ════════════════════════════════════════════════
//  PRAYER REQUESTS
// ════════════════════════════════════════════════

// POST /api/prayer  — Submit a prayer request
router.post('/prayer', async (req, res) => {
  try {
    const { name, email: userEmail, category, request, anonymous } = req.body;

    if (!request || request.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please enter a prayer request.' });
    }

    const prayer = await Prayer.create({
      name:      anonymous ? 'Anonymous' : (name || 'Anonymous'),
      email:     userEmail || '',
      category:  category  || 'General Prayer',
      request:   request.trim(),
      anonymous: !!anonymous,
    });

    // Send emails (non-blocking — don't fail the request if email fails)
    Promise.all([
      email.sendPrayerConfirmation(prayer).catch(console.error),
      email.sendPrayerAlert(prayer).catch(console.error),
    ]);
