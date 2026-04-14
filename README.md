# ✝ ZGCGM Church Website — Backend

**Zion Gospel Church of Grace and Mercy**  
Full Node.js/Express backend powering all website features.

---

## 📁 File Structure

```
zgcgm-backend/
├── server.js              ← Main server entry point
├── package.json           ← Dependencies
├── .env.example           ← Copy to .env and fill in values
├── api.js                 ← Frontend connector (add to your HTML)
├── models/
│   └── index.js           ← All database models
├── routes/
│   └── index.js           ← All API endpoints
├── services/
│   └── email.js           ← Email templates & sending
├── middleware/
│   └── auth.js            ← JWT admin authentication
└── uploads/
    └── sermons/           ← Uploaded sermon files (auto-created)
```

---

## 🚀 Setup Instructions

### Step 1 — Install Node.js
Download from https://nodejs.org (choose LTS version)

### Step 2 — Get a free MongoDB database
1. Go to https://mongodb.com/atlas
2. Create a free account → New Project → Build a Database (Free tier)
3. Create a username and password
4. Under Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
5. Click Connect → Drivers → Copy the connection string

### Step 3 — Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `MONGODB_URI` — your MongoDB connection string
- `EMAIL_USER` — your church Gmail address
- `EMAIL_PASS` — Gmail App Password (not your regular password)
  → Google Account → Security → 2-Step Verification → App Passwords
- `ADMIN_EMAIL` — where prayer/contact alerts go
- `ADMIN_PASSWORD` — your chosen admin password

### Step 4 — Install dependencies
```bash
npm install
```

### Step 5 — Run the server
```bash
# Development (auto-restarts on changes)
npm run dev

# Production
npm start
```

Server will run at: http://localhost:5000

---

## 🌐 Connect to Your Website (index.html)

Add this line just before `</body>` in your `index.html`:

```html
<script src="api.js"></script>
```

Then change the `API_BASE` at the top of `api.js` to your backend URL:
```javascript
const API_BASE = 'https://your-backend.railway.app/api';
```

---

## ☁️ Deploy to the Internet (Free)

### Option A — Railway (Recommended, easiest)
1. Go to https://railway.app → Sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Add your backend files to a GitHub repo
4. In Railway → Variables → add all your `.env` values
5. Railway gives you a URL like `https://zgcgm.up.railway.app`
6. Update `API_BASE` in `api.js` to that URL

### Option B — Render
1. Go to https://render.com → New Web Service
2. Connect your GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables

### Option C — Run locally + ngrok (quick testing)
```bash
npm run dev
# In another terminal:
npx ngrok http 5000
# Use the https://xxx.ngrok.io URL as your API_BASE
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/health | Server health check | No |
| POST | /api/prayer | Submit prayer request | No |
| GET | /api/prayer | Get all prayers | Admin |
| PATCH | /api/prayer/:id | Update prayer status | Admin |
| POST | /api/contact | Send contact message | No |
| GET | /api/contact | Get all messages | Admin |
| GET | /api/sermons | Get all sermons | No |
| GET | /api/sermons/:id | Get single sermon | No |
| POST | /api/sermons | Upload sermon + file | Admin |
| POST | /api/sermons/:id/play | Track play count | No |
| POST | /api/sermons/:id/download | Track downloads | No |
| DELETE | /api/sermons/:id | Delete sermon | Admin |
| GET | /api/events | Get upcoming events | No |
| POST | /api/events | Create event | Admin |
| PUT | /api/events/:id | Update event | Admin |
| POST | /api/events/:id/register | Register for event | No |
| POST | /api/giving | Record giving | No |
| GET | /api/giving | Get giving records | Admin |
| POST | /api/newsletter/subscribe | Subscribe | No |
| POST | /api/newsletter/unsubscribe | Unsubscribe | No |
| GET | /api/live-status | Check YouTube live | No |
| POST | /api/admin/login | Admin login | No |
| GET | /api/admin/dashboard | Stats dashboard | Admin |

---

## 🔐 Admin Login

After first startup, a default admin account is created:
- Username: value from `ADMIN_USERNAME` in `.env`
- Password: value from `ADMIN_PASSWORD` in `.env`

**Change your password immediately after first login!**

To get an admin token (for testing with Postman or fetch):
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword"}'
```

Use the returned token as `Authorization: Bearer <token>` on protected routes.

---

## 📧 Gmail App Password Setup

1. Go to your Google Account
2. Security → 2-Step Verification (enable if not done)
3. Security → App Passwords
4. Select app: Mail → Select device: Other → type "ZGCGM"
5. Copy the 16-character password → paste as `EMAIL_PASS` in `.env`

---

## ✝ God bless ZGCGM!
