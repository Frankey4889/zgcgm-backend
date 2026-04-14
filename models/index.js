// ═══════════════════════════════════════════════
//  models/index.js  —  All Mongoose models
// ═══════════════════════════════════════════════
const mongoose = require('mongoose');

// ── Prayer Request ──────────────────────────────
const prayerSchema = new mongoose.Schema({
  name:      { type: String, default: 'Anonymous' },
  email:     { type: String, default: '' },
  category:  { type: String, default: 'General Prayer' },
  request:   { type: String, required: true },
  anonymous: { type: Boolean, default: false },
  status:    { type: String, enum: ['pending', 'prayed', 'resolved'], default: 'pending' },
  notes:     { type: String, default: '' },   // pastor's notes
  createdAt: { type: Date, default: Date.now }
});

// ── Contact Message ─────────────────────────────
const contactSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, default: '' },
  subject:  { type: String, default: 'General Inquiry' },
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

// ── Sermon ──────────────────────────────────────
const sermonSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  speaker:     { type: String, required: true },
  series:      { type: String, default: '' },
  date:        { type: Date, required: true },
  description: { type: String, default: '' },
  audioFile:   { type: String, default: '' },   // file path / URL
  videoUrl:    { type: String, default: '' },   // YouTube link
  thumbnail:   { type: String, default: '' },
  downloads:   { type: Number, default: 0 },
  plays:       { type: Number, default: 0 },
  published:   { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

// ── Event ───────────────────────────────────────
const eventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  date:        { type: Date, required: true },
  endDate:     { type: Date },
  time:        { type: String, required: true },
  location:    { type: String, required: true },
  category:    { type: String, default: 'General' },
  image:       { type: String, default: '' },
  registrationRequired: { type: Boolean, default: false },
  published:   { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

// ── Event Registration ──────────────────────────
const registrationSchema = new mongoose.Schema({
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, default: '' },
  guests:   { type: Number, default: 1 },
  createdAt:{ type: Date, default: Date.now }
});

// ── Newsletter Subscriber ───────────────────────
const subscriberSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true },
  name:      { type: String, default: '' },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ── Giving / Tithe Record ───────────────────────
const givingSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  amount:    { type: Number, required: true },
  category:  { type: String, default: 'Tithe' },   // Tithe / Offering / Missions / Building
  reference: { type: String, default: '' },          // payment reference
  method:    { type: String, default: 'online' },
  status:    { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// ── Admin User ──────────────────────────────────
const adminSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true },
  password:  { type: String, required: true },  // bcrypt hashed
  role:      { type: String, enum: ['super', 'pastor', 'staff'], default: 'staff' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Prayer:       mongoose.model('Prayer', prayerSchema),
  Contact:      mongoose.model('Contact', contactSchema),
  Sermon:       mongoose.model('Sermon', sermonSchema),
  Event:        mongoose.model('Event', eventSchema),
  Registration: mongoose.model('Registration', registrationSchema),
  Subscriber:   mongoose.model('Subscriber', subscriberSchema),
  Giving:       mongoose.model('Giving', givingSchema),
  Admin:        mongoose.model('Admin', adminSchema),
};
