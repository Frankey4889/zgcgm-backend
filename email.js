// ═══════════════════════════════════════════════
//  services/email.js  —  Nodemailer email service
// ═══════════════════════════════════════════════
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   process.env.EMAIL_PORT   || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Shared brand header/footer ──────────────────
const brandHeader = `
  <div style="background:linear-gradient(135deg,#0b4d28,#0f6b38);padding:32px 40px;text-align:center;">
    <h1 style="font-family:Georgia,serif;color:#c9a84c;font-size:1.8rem;letter-spacing:4px;margin:0;">ZGCGM</h1>
    <p style="color:rgba(255,255,255,0.7);font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;margin:6px 0 0;">
      Zion Gospel Church of Grace &amp; Mercy
    </p>
  </div>
`;
const brandFooter = `
  <div style="background:#040a05;padding:24px 40px;text-align:center;border-top:1px solid rgba(201,168,76,0.2);">
    <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin:0;">
      ✝ &copy; 2025 Zion Gospel Church of Grace and Mercy. All rights reserved.
    </p>
    <p style="color:rgba(255,255,255,0.2);font-size:0.7rem;margin:6px 0 0;">
      <a href="https://www.youtube.com/@ZGCGM" style="color:#c9a84c;">Watch us Live on YouTube</a>
    </p>
  </div>
`;

// ── 1. Prayer request confirmation to submitter ─
async function sendPrayerConfirmation(prayer) {
  if (!prayer.email) return;
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      prayer.email,
    subject: '✝ Your Prayer Request Has Been Received — ZGCGM',
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;">
        <p style="font-size:1.1rem;color:#0b4d28;">Dear ${prayer.anonymous ? 'Beloved' : prayer.name},</p>
        <p style="color:#4a5c4c;line-height:1.8;">
          We have received your prayer request and our prayer team will be standing in
          agreement with you. You are not alone — God hears every prayer.
        </p>
        <blockquote style="border-left:3px solid #c9a84c;padding-left:16px;margin:20px 0;font-style:italic;color:#8a9b8c;">
          "The prayer of a righteous person is powerful and effective." — James 5:16
        </blockquote>
        <div style="background:#e8ede9;border-radius:4px;padding:16px 20px;margin:20px 0;">
          <p style="font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;color:#0f6b38;margin:0 0 6px;">Your Request (${prayer.category})</p>
          <p style="color:#141e15;margin:0;">${prayer.anonymous ? '[Kept Private]' : prayer.request}</p>
        </div>
        <p style="color:#4a5c4c;line-height:1.8;">May God answer your prayer abundantly above all you ask or think.</p>
        <p style="color:#0b4d28;font-weight:bold;">With love &amp; prayers,<br>The ZGCGM Prayer Team</p>
      </div>
      ${brandFooter}
    `,
  });
}

// ── 2. Prayer request alert to admin ───────────
async function sendPrayerAlert(prayer) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      process.env.ADMIN_EMAIL,
    subject: `🙏 New Prayer Request — ${prayer.category}`,
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;">
        <h2 style="color:#0b4d28;font-size:1.2rem;">New Prayer Request Received</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;background:#e8ede9;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;width:130px;">Name</td><td style="padding:8px;">${prayer.anonymous ? 'Anonymous' : prayer.name}</td></tr>
          <tr><td style="padding:8px;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Email</td><td style="padding:8px;">${prayer.email || 'Not provided'}</td></tr>
          <tr><td style="padding:8px;background:#e8ede9;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Category</td><td style="padding:8px;">${prayer.category}</td></tr>
          <tr><td style="padding:8px;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Request</td><td style="padding:8px;">${prayer.request}</td></tr>
        </table>
        <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;background:linear-gradient(135deg,#0b4d28,#0f6b38);color:white;padding:12px 24px;border-radius:2px;text-decoration:none;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;">View in Dashboard</a>
      </div>
      ${brandFooter}
    `,
  });
}

// ── 3. Contact form confirmation to sender ──────
async function sendContactConfirmation(contact) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      contact.email,
    subject: '✝ We Received Your Message — ZGCGM',
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;">
        <p style="font-size:1.1rem;color:#0b4d28;">Dear ${contact.name},</p>
        <p style="color:#4a5c4c;line-height:1.8;">
          Thank you for reaching out to us. We have received your message and will
          respond within <strong>24–48 hours</strong>.
        </p>
        <div style="background:#e8ede9;border-radius:4px;padding:16px 20px;margin:20px 0;">
          <p style="font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;color:#0f6b38;margin:0 0 6px;">Your Message</p>
          <p style="color:#141e15;margin:0;">${contact.message}</p>
        </div>
        <p style="color:#4a5c4c;">God bless you,<br><strong style="color:#0b4d28;">ZGCGM Church Office</strong></p>
      </div>
      ${brandFooter}
    `,
  });
}

// ── 4. Contact alert to admin ───────────────────
async function sendContactAlert(contact) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      process.env.ADMIN_EMAIL,
    subject: `📩 New Contact Message — ${contact.subject}`,
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;">
        <h2 style="color:#0b4d28;font-size:1.2rem;">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;background:#e8ede9;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;width:130px;">Name</td><td style="padding:8px;">${contact.name}</td></tr>
          <tr><td style="padding:8px;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Email</td><td style="padding:8px;">${contact.email}</td></tr>
          <tr><td style="padding:8px;background:#e8ede9;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Phone</td><td style="padding:8px;">${contact.phone || 'Not provided'}</td></tr>
          <tr><td style="padding:8px;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Subject</td><td style="padding:8px;">${contact.subject}</td></tr>
          <tr><td style="padding:8px;background:#e8ede9;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#8a9b8c;">Message</td><td style="padding:8px;">${contact.message}</td></tr>
        </table>
      </div>
      ${brandFooter}
    `,
  });
}

// ── 5. Event registration confirmation ─────────
async function sendRegistrationConfirmation(reg, event) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      reg.email,
    subject: `✝ Registration Confirmed — ${event.title}`,
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;">
        <p style="font-size:1.1rem;color:#0b4d28;">Dear ${reg.name},</p>
        <p style="color:#4a5c4c;line-height:1.8;">Your registration for <strong>${event.title}</strong> has been confirmed. We look forward to seeing you!</p>
        <div style="background:#0b4d28;color:white;border-radius:4px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;">Event Details</p>
          <p style="margin:4px 0;"><strong>${event.title}</strong></p>
          <p style="margin:4px 0;color:rgba(255,255,255,0.7);">📅 ${new Date(event.date).toDateString()}</p>
          <p style="margin:4px 0;color:rgba(255,255,255,0.7);">🕐 ${event.time}</p>
          <p style="margin:4px 0;color:rgba(255,255,255,0.7);">📍 ${event.location}</p>
          <p style="margin:4px 0;color:rgba(255,255,255,0.7);">👥 ${reg.guests} guest(s)</p>
        </div>
        <p style="color:#4a5c4c;">God bless you,<br><strong style="color:#0b4d28;">ZGCGM Church</strong></p>
      </div>
      ${brandFooter}
    `,
  });
}

// ── 6. Newsletter welcome ───────────────────────
async function sendNewsletterWelcome(subscriber) {
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      subscriber.email,
    subject: '✝ Welcome to the ZGCGM Family Newsletter',
    html: `
      ${brandHeader}
      <div style="padding:32px 40px;background:#faf9f6;font-family:Georgia,serif;text-align:center;">
        <h2 style="color:#0b4d28;font-family:Georgia,serif;">Welcome to the Family!</h2>
        <p style="color:#4a5c4c;line-height:1.8;max-width:480px;margin:0 auto 20px;">
          You are now subscribed to the ZGCGM newsletter. You will receive updates on sermons,
          events, and church news straight to your inbox.
        </p>
        <blockquote style="border-left:3px solid #c9a84c;padding-left:16px;margin:20px auto;font-style:italic;color:#8a9b8c;text-align:left;max-width:400px;">
          "How good and pleasant it is when God's people live together in unity!" — Psalm 133:1
        </blockquote>
        <a href="https://www.youtube.com/@ZGCGM" style="display:inline-block;background:linear-gradient(135deg,#0b4d28,#0f6b38);color:white;padding:12px 28px;border-radius:2px;text-decoration:none;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;margin-top:16px;">Watch Us Live</a>
      </div>
      ${brandFooter}
    `,
  });
}

module.exports = {
  sendPrayerConfirmation,
  sendPrayerAlert,
  sendContactConfirmation,
  sendContactAlert,
  sendRegistrationConfirmation,
  sendNewsletterWelcome,
};
