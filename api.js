// ═══════════════════════════════════════════════
//  api.js  —  ZGCGM Frontend API Connector
//  Include this script in your index.html
//  <script src="api.js"></script>
// ═══════════════════════════════════════════════

// ── Config ──────────────────────────────────────
// Change this to your deployed backend URL
const API_BASE = 'https://your-backend-url.com/api';
// For local testing use: const API_BASE = 'http://localhost:5000/api';

// ════════════════════════════════════════════════
//  CORE FETCH HELPER
// ════════════════════════════════════════════════
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('zgcgm_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ════════════════════════════════════════════════
//  PRAYER REQUEST
// ════════════════════════════════════════════════
async function submitPrayer() {
  const name      = document.getElementById('prayerName')?.value?.trim();
  const email     = document.getElementById('prayerEmail')?.value?.trim();
  const category  = document.getElementById('prayerCat')?.value;
  const request   = document.getElementById('prayerReq')?.value?.trim();
  const anonymous = document.getElementById('prayerAnon')?.checked;

  if (!request) { showToast('Please enter your prayer request'); return; }

  const submitBtn = document.querySelector('.prayer-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

  try {
    const result = await apiRequest('/prayer', {
      method: 'POST',
      body: JSON.stringify({ name, email, category, request, anonymous }),
    });

    // Show success screen
    document.getElementById('prayerForm').style.display = 'none';
    document.getElementById('prayerSuccess').classList.add('show');
    showToast('♥ ' + result.message);

    // Reset after 5.5 seconds
    setTimeout(() => {
      document.getElementById('prayerForm').style.display = 'block';
      document.getElementById('prayerSuccess').classList.remove('show');
      ['prayerName','prayerEmail','prayerCat','prayerReq'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      if (document.getElementById('prayerAnon')) document.getElementById('prayerAnon').checked = false;
      document.getElementById('prayerPanel').classList.remove('open');
    }, 5500);

  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-hands-praying"></i> Submit Prayer Request'; }
  }
}

// ════════════════════════════════════════════════
//  CONTACT FORM
// ════════════════════════════════════════════════
async function submitContactForm() {
  // Collect form values — adjust selectors to match your HTML
  const inputs   = document.querySelectorAll('.contact-form-body .form-input');
  const name     = inputs[0]?.value?.trim();
  const email    = inputs[1]?.value?.trim();
  const phone    = inputs[2]?.value?.trim();
  const subject  = inputs[3]?.value;
  const message  = inputs[4]?.value?.trim();

  if (!name || !email || !message) {
    showToast('Please fill in your name, email, and message.');
    return;
  }

  const btn = document.querySelector('.contact-form-body .form-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  try {
    const result = await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, subject, message }),
    });
    showToast('✓ ' + result.message);
    inputs.forEach(i => { if (i.tagName !== 'SELECT') i.value = ''; });
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message'; }
  }
}

// ════════════════════════════════════════════════
//  SERMONS — Load from database
// ════════════════════════════════════════════════
async function loadSermons(page = 1, series = '') {
  try {
    const params = new URLSearchParams({ page, limit: 6 });
    if (series) params.append('series', series);

    const result = await apiRequest(`/sermons?${params}`);
    renderSermons(result.data);
    return result;
  } catch (err) {
    console.error('Failed to load sermons:', err);
  }
}

function renderSermons(sermons) {
  const grid = document.getElementById('sermons-grid') || document.querySelector('.sermons-grid');
  if (!grid) return;

  const colors = [
    'linear-gradient(135deg,#0b4d28,#1a9050)',
    'linear-gradient(135deg,#1a2a1a,#2d5a27)',
    'linear-gradient(135deg,#2a2a0a,#5a5a0d)',
    'linear-gradient(135deg,#0a1a2a,#0d4a6b)',
    'linear-gradient(135deg,#2a0a1a,#6b0d3d)',
    'linear-gradient(135deg,#0a2a2a,#0d6b5a)',
  ];

  grid.innerHTML = sermons.map((sermon, i) => `
    <div class="sermon-card reveal">
      <div class="sermon-cover" style="background:${colors[i % colors.length]};">
        <i class="fas fa-bible sermon-cover-icon"></i>
        <span class="sermon-cover-date">${new Date(sermon.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
      <div class="sermon-body">
        <div class="sermon-series">${sermon.series || 'General'}</div>
        <div class="sermon-title">${sermon.title}</div>
        <div class="sermon-speaker">${sermon.speaker}</div>
        <div class="sermon-actions">
          ${sermon.audioFile || sermon.videoUrl
            ? `<button class="btn-sm btn-sm-green" onclick="playSermon('${sermon._id}','${sermon.audioFile || sermon.videoUrl}')"><i class="fas fa-play"></i> Listen</button>`
            : `<button class="btn-sm btn-sm-green" disabled style="opacity:0.5;"><i class="fas fa-play"></i> Soon</button>`
          }
          ${sermon.audioFile
            ? `<button class="btn-sm btn-sm-ghost" onclick="downloadSermon('${sermon._id}')"><i class="fas fa-download"></i> Save</button>`
            : ''
          }
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe for scroll animations
  grid.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(36px)';
    revealObserver.observe(el);
  });
}

async function playSermon(id, url) {
  try {
    await apiRequest(`/sermons/${id}/play`, { method: 'POST' });
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      window.open(url, '_blank');
    } else {
      // Open audio player
      openAudioPlayer(url);
    }
    showToast('▶ Playing sermon...');
  } catch (err) {
    showToast('Error playing sermon.');
  }
}

async function downloadSermon(id) {
  try {
    const result = await apiRequest(`/sermons/${id}/download`, { method: 'POST' });
    const link = document.createElement('a');
    link.href = API_BASE.replace('/api', '') + result.url;
    link.download = true;
    link.click();
    showToast('↓ Downloading sermon...');
  } catch (err) {
    showToast('Error downloading sermon.');
  }
}

// Simple audio player overlay
function openAudioPlayer(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:5000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;';
  overlay.innerHTML = `
    <div style="background:#141e15;padding:2rem;border-radius:8px;border:1px solid rgba(201,168,76,0.2);max-width:420px;width:90%;text-align:center;">
      <p style="color:#c9a84c;font-family:Georgia,serif;font-style:italic;margin-bottom:1rem;">Now Playing</p>
      <audio controls autoplay style="width:100%;margin-bottom:1rem;">
        <source src="${API_BASE.replace('/api','')}${url}" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
      <button onclick="this.closest('[style]').remove()" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:8px 20px;border-radius:2px;cursor:pointer;font-size:0.8rem;letter-spacing:1px;">✕ Close</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

// ════════════════════════════════════════════════
//  EVENTS — Load from database
// ════════════════════════════════════════════════
async function loadEvents() {
  try {
    const result = await apiRequest('/events?upcoming=true');
    renderEvents(result.data);
  } catch (err) {
    console.error('Failed to load events:', err);
  }
}

function renderEvents(events) {
  const list = document.querySelector('.events-list');
  if (!list || !events.length) return;

  list.innerHTML = events.map(event => {
    const d   = new Date(event.date);
    const day = d.getDate();
    const mon = d.toLocaleString('en',{month:'short'}).toUpperCase();
    return `
      <div class="event-row reveal">
        <div class="event-date-box"><span class="event-d">${day}</span><span class="event-m">${mon}</span></div>
        <div class="event-info">
          <h4>${event.title}</h4>
          <p>${event.description}</p>
        </div>
        <div class="event-meta">
          <span class="e-tag">${event.category}</span>
          <span><i class="fas fa-clock"></i> ${event.time}</span>
          <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
          ${event.registrationRequired
            ? `<button onclick="openEventRegistration('${event._id}','${event.title.replace(/'/g,"\\'")}'); " style="background:linear-gradient(135deg,#0b4d28,#0f6b38);color:white;border:none;padding:5px 12px;border-radius:2px;font-size:0.65rem;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;margin-top:4px;">Register</button>`
            : ''
          }
        </div>
      </div>
    `;
  }).join('');
}

// Event Registration Modal
function openEventRegistration(eventId, eventTitle) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:5000;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:white;border-radius:4px;max-width:460px;width:100%;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0b4d28,#0f6b38);padding:1.5rem 2rem;">
        <h3 style="color:#c9a84c;font-family:Georgia,serif;margin:0;">Register for Event</h3>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.85rem;">${eventTitle}</p>
      </div>
      <div style="padding:1.5rem 2rem;display:flex;flex-direction:column;gap:0.8rem;">
        <input id="regName"   type="text"   placeholder="Your Full Name *" style="width:100%;padding:0.7rem 1rem;border:1px solid #e8ede9;border-radius:2px;font-family:inherit;font-size:0.9rem;outline:none;">
        <input id="regEmail"  type="email"  placeholder="Email Address *"  style="width:100%;padding:0.7rem 1rem;border:1px solid #e8ede9;border-radius:2px;font-family:inherit;font-size:0.9rem;outline:none;">
        <input id="regPhone"  type="tel"    placeholder="Phone Number"     style="width:100%;padding:0.7rem 1rem;border:1px solid #e8ede9;border-radius:2px;font-family:inherit;font-size:0.9rem;outline:none;">
        <input id="regGuests" type="number" placeholder="Number of guests" min="1" max="10" value="1" style="width:100%;padding:0.7rem 1rem;border:1px solid #e8ede9;border-radius:2px;font-family:inherit;font-size:0.9rem;outline:none;">
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
          <button onclick="submitEventRegistration('${eventId}')" style="flex:1;padding:0.8rem;background:linear-gradient(135deg,#0b4d28,#0f6b38);color:white;border:none;border-radius:2px;font-size:0.75rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;">Register</button>
          <button onclick="this.closest('[style]').remove()" style="padding:0.8rem 1.2rem;background:#e8ede9;border:none;border-radius:2px;cursor:pointer;font-size:0.8rem;">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitEventRegistration(eventId) {
  const name   = document.getElementById('regName')?.value?.trim();
  const email  = document.getElementById('regEmail')?.value?.trim();
  const phone  = document.getElementById('regPhone')?.value?.trim();
  const guests = document.getElementById('regGuests')?.value;

  if (!name || !email) { showToast('Name and email are required.'); return; }

  try {
    const result = await apiRequest(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, guests }),
    });
    document.querySelector('[style*="fixed"][style*="inset"]')?.remove();
    showToast('✓ ' + result.message);
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ════════════════════════════════════════════════
//  NEWSLETTER SUBSCRIBE
// ════════════════════════════════════════════════
async function subscribeNewsletter(email, name = '') {
  if (!email) { showToast('Please enter your email address.'); return; }
  try {
    const result = await apiRequest('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    showToast('✓ ' + result.message);
    return result;
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ════════════════════════════════════════════════
//  GIVING
// ════════════════════════════════════════════════
async function submitGiving(name, email, amount, category) {
  if (!name || !email || !amount) {
    showToast('Please fill in all giving details.');
    return;
  }
  try {
    const result = await apiRequest('/giving', {
      method: 'POST',
      body: JSON.stringify({ name, email, amount: Number(amount), category }),
    });
    showToast('✓ ' + result.message);
    return result;
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ════════════════════════════════════════════════
//  LIVE STATUS CHECK
// ════════════════════════════════════════════════
async function checkLiveStatus() {
  try {
    const result = await apiRequest('/live-status');
    const liveBtn = document.querySelector('.live-pill');
    if (!liveBtn) return;

    if (result.isLive) {
      liveBtn.style.background = 'linear-gradient(135deg,#c0392b,#e74c3c)';
      liveBtn.href = result.watchUrl;
      liveBtn.title = result.title || 'Watch Live';
      showToast('🔴 We are LIVE! Click the Live button to watch.');
    }
  } catch (err) {
    // Silently fail — live check is non-critical
  }
}

// ════════════════════════════════════════════════
//  SERMON UPLOAD (Admin)
// ════════════════════════════════════════════════
async function uploadSermon(formData) {
  const token = localStorage.getItem('zgcgm_token');
  if (!token) { showToast('Admin login required.'); return; }

  try {
    const response = await fetch(`${API_BASE}/sermons`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData, // FormData — no Content-Type header needed
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    showToast('✓ Sermon uploaded successfully!');
    loadSermons(); // Reload sermon list
    return result;
  } catch (err) {
    showToast('Upload error: ' + err.message);
  }
}

// Hook into upload button in the HTML
function handleSermonUpload() {
  const inputs = document.querySelectorAll('.upload-form input, .upload-form select');
  const title    = inputs[0]?.value?.trim();
  const speaker  = inputs[1]?.value?.trim();
  const date     = inputs[2]?.value;
  const series   = inputs[3]?.value;
  const fileInput = document.querySelector('.upload-form input[type="file"]');

  if (!title || !speaker || !date) {
    showToast('Please fill in title, speaker, and date.');
    return;
  }

  const fd = new FormData();
  fd.append('title', title);
  fd.append('speaker', speaker);
  fd.append('date', date);
  fd.append('series', series);
  if (fileInput?.files[0]) fd.append('audioFile', fileInput.files[0]);

  uploadSermon(fd);
}

// ════════════════════════════════════════════════
//  SCROLL REVEAL OBSERVER (shared)
// ════════════════════════════════════════════════
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity    = '1';
      e.target.style.transform  = 'translateY(0)';
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

// ════════════════════════════════════════════════
//  INITIALISE ON PAGE LOAD
// ════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Load dynamic content from backend
  await Promise.all([
    loadSermons(),
    loadEvents(),
    checkLiveStatus(),
  ]);

  // Wire up contact form button
  const contactBtn = document.querySelector('.contact-form-body .form-btn');
  if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitContactForm();
    });
  }

  // Wire up sermon upload button
  const uploadBtn = document.querySelector('.upload-form .form-btn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSermonUpload();
    });
  }

  // Check live status every 5 minutes
  setInterval(checkLiveStatus, 5 * 60 * 1000);

  console.log('✝ ZGCGM API connector initialised');
});
