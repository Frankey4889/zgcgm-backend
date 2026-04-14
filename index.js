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

    res.status(201).json({
      success: true,
      message: 'Your prayer request has been received. Our team is praying for you.',
      id: prayer._id,
    });
  } catch (err) {
    console.error('Prayer error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/prayer  — Get all prayers (admin only)
router.get('/prayer', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const prayers = await Prayer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Prayer.countDocuments(filter);
    res.json({ success: true, data: prayers, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/prayer/:id  — Update prayer status (admin)
router.patch('/prayer/:id', auth, async (req, res) => {
  try {
    const prayer = await Prayer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: prayer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  CONTACT FORM
// ════════════════════════════════════════════════

// POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email: userEmail, phone, subject, message } = req.body;

    if (!name || !userEmail || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const contact = await Contact.create({ name, email: userEmail, phone, subject, message });

    Promise.all([
      email.sendContactConfirmation(contact).catch(console.error),
      email.sendContactAlert(contact).catch(console.error),
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent! We will respond within 24–48 hours.',
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/contact  — Get all messages (admin)
router.get('/contact', auth, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/contact/:id/read  — Mark as read
router.patch('/contact/:id/read', auth, async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  SERMONS
// ════════════════════════════════════════════════

// GET /api/sermons  — Get all published sermons
router.get('/sermons', async (req, res) => {
  try {
    const { series, page = 1, limit = 12, search } = req.query;
    const filter = { published: true };
    if (series) filter.series = series;
    if (search) filter.$text = { $search: search };

    const sermons = await Sermon.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Sermon.countDocuments(filter);

    res.json({ success: true, data: sermons, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sermons/series  — Get all unique series names
router.get('/sermons/series', async (req, res) => {
  try {
    const series = await Sermon.distinct('series', { published: true, series: { $ne: '' } });
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/sermons/:id  — Get single sermon
router.get('/sermons/:id', async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found.' });
    res.json({ success: true, data: sermon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sermons/:id/play  — Increment play count
router.post('/sermons/:id/play', async (req, res) => {
  try {
    await Sermon.findByIdAndUpdate(req.params.id, { $inc: { plays: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sermons/:id/download  — Increment download count
router.post('/sermons/:id/download', async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!sermon || !sermon.audioFile) {
      return res.status(404).json({ success: false, message: 'Audio file not found.' });
    }
    res.json({ success: true, url: sermon.audioFile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sermons  — Upload a new sermon (admin + file)
router.post('/sermons', auth, upload.single('audioFile'), async (req, res) => {
  try {
    const { title, speaker, series, date, description, videoUrl } = req.body;
    if (!title || !speaker || !date) {
      return res.status(400).json({ success: false, message: 'Title, speaker, and date are required.' });
    }

    const sermon = await Sermon.create({
      title, speaker, series, date, description, videoUrl,
      audioFile: req.file ? `/uploads/sermons/${req.file.filename}` : '',
    });

    res.status(201).json({ success: true, message: 'Sermon uploaded.', data: sermon });
  } catch (err) {
    console.error('Sermon upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/sermons/:id  — Update sermon (admin)
router.put('/sermons/:id', auth, async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: sermon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/sermons/:id  — Delete sermon (admin)
router.delete('/sermons/:id', auth, async (req, res) => {
  try {
    await Sermon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sermon deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  EVENTS
// ════════════════════════════════════════════════

// GET /api/events  — Get upcoming events
router.get('/events', async (req, res) => {
  try {
    const { upcoming } = req.query;
    const filter = { published: true };
    if (upcoming === 'true') filter.date = { $gte: new Date() };

    const events = await Event.find(filter).sort({ date: 1 }).limit(20);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/:id
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events  — Create event (admin)
router.post('/events', auth, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/events/:id  — Update event (admin)
router.put('/events/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/events/:id  — Delete event (admin)
router.delete('/events/:id', auth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/register  — Register for an event
router.post('/events/:id/register', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const { name, email: userEmail, phone, guests } = req.body;
    if (!name || !userEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const reg = await Registration.create({ event: event._id, name, email: userEmail, phone, guests: guests || 1 });

    email.sendRegistrationConfirmation(reg, event).catch(console.error);

    res.status(201).json({
      success: true,
      message: `You are registered for ${event.title}! A confirmation email has been sent.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  GIVING / TITHE
// ════════════════════════════════════════════════

// POST /api/giving  — Record a giving entry
router.post('/giving', async (req, res) => {
  try {
    const { name, email: userEmail, amount, category, reference, method } = req.body;
    if (!name || !userEmail || !amount) {
      return res.status(400).json({ success: false, message: 'Name, email, and amount are required.' });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount.' });
    }

    const giving = await Giving.create({ name, email: userEmail, amount, category, reference, method });
    res.status(201).json({
      success: true,
      message: 'Thank you for your generous giving. God bless you!',
      id: giving._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/giving  — Get giving records (admin)
router.get('/giving', auth, async (req, res) => {
  try {
    const records = await Giving.find().sort({ createdAt: -1 }).limit(200);
    const total   = records.reduce((sum, r) => sum + r.amount, 0);
    res.json({ success: true, data: records, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/giving/:id  — Update giving status (admin)
router.patch('/giving/:id', auth, async (req, res) => {
  try {
    const giving = await Giving.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: giving });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  NEWSLETTER
// ════════════════════════════════════════════════

// POST /api/newsletter/subscribe
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email: userEmail, name } = req.body;
    if (!userEmail) return res.status(400).json({ success: false, message: 'Email is required.' });

    const existing = await Subscriber.findOne({ email: userEmail });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
        return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
      }
      return res.json({ success: true, message: 'You are already subscribed. God bless you!' });
    }

    const sub = await Subscriber.create({ email: userEmail, name });
    email.sendNewsletterWelcome(sub).catch(console.error);

    res.status(201).json({ success: true, message: 'Subscribed successfully! Welcome to the family.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/newsletter/unsubscribe
router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    await Subscriber.findOneAndUpdate({ email: req.body.email }, { active: false });
    res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/newsletter/subscribers  — Admin only
router.get('/newsletter/subscribers', auth, async (req, res) => {
  try {
    const subs = await Subscriber.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: subs, total: subs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════
//  LIVE STATUS (YouTube)
// ════════════════════════════════════════════════
router.get('/live-status', async (req, res) => {
  try {
    const apiKey   = process.env.YOUTUBE_API_KEY;
    const channelId= process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      return res.json({ success: true, isLive: false, message: 'YouTube API not configured.' });
    }

    // Check YouTube for active live broadcasts
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();

    const isLive   = data.items && data.items.length > 0;
    const videoId  = isLive ? data.items[0].id.videoId : null;
    const title    = isLive ? data.items[0].snippet.title : null;

    res.json({
      success: true,
      isLive,
      videoId,
      title,
      watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/@${channelId}`,
    });
  } catch (err) {
    res.json({ success: true, isLive: false, error: err.message });
  }
});

// ════════════════════════════════════════════════
//  ADMIN AUTH
// ════════════════════════════════════════════════

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token, role: admin.role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/dashboard  — Summary stats
router.get('/admin/dashboard', auth, async (req, res) => {
  try {
    const [prayers, contacts, sermons, events, subscribers, givingRecords] = await Promise.all([
      Prayer.countDocuments(),
      Contact.countDocuments({ read: false }),
      Sermon.countDocuments({ published: true }),
      Event.countDocuments({ published: true, date: { $gte: new Date() } }),
      Subscriber.countDocuments({ active: true }),
      Giving.find({ status: 'confirmed' }),
    ]);

    const totalGiving = givingRecords.reduce((sum, r) => sum + r.amount, 0);
    const recentPrayers = await Prayer.find().sort({ createdAt: -1 }).limit(5);
    const recentMessages = await Contact.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: { prayers, unreadMessages: contacts, sermons, upcomingEvents: events, subscribers, totalGiving },
      recentPrayers,
      recentMessages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
