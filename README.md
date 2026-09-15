# Encourage Me

An emotional wellness platform that helps people track how they feel each day and
receive personalized encouragement through music, videos, meditation content, quotes,
and affirmations.

**Built and Powered by Emtrixz Technology**

---

## What's inside

```
encourage-me/
├── backend/     FastAPI + Supabase PostgreSQL + SQLAlchemy + Supabase Storage + JWT auth + PDF reports
└── frontend/    React + Vite + Tailwind CSS + Framer Motion + Recharts
```

Everything runs locally on your machine. No paid services are required — the app
works fully out of the box, and gets richer if you add a free YouTube API key later.

The hosted database and uploaded media use Supabase. The backend keeps SQLAlchemy
as its query layer, connected to Supabase PostgreSQL, while avatars and attachments
are stored in the Supabase `media` bucket.

---

## Requirements

- **Python 3.10+**
- **Node.js 18+** and npm

Check what you have:

```bash
python3 --version
node --version
```

---

## Run it instantly

Open **two terminal windows** — one for the backend, one for the frontend.

### 1. Backend (Terminal 1)

**macOS / Linux**
```bash
cd backend
./start.sh
```

**Windows**
```bat
cd backend
start.bat
```

This creates a virtual environment, installs dependencies, copies `.env.example` to
`.env` if needed, creates the SQLite database automatically, and starts the API at
**http://localhost:8000** (interactive docs at http://localhost:8000/docs).

If you'd rather run the commands yourself:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Terminal 2)

**macOS / Linux**
```bash
cd frontend
./start.sh
```

**Windows**
```bat
cd frontend
start.bat
```

This installs npm dependencies and starts the app at **http://localhost:5173**.

Manual version:
```bash
cd frontend
cp .env.example .env             # Windows: copy .env.example .env
npm install
npm run dev
```

### 3. Configure Supabase

Create a Supabase project, open the SQL Editor, and run
`backend/supabase_schema.sql`. Copy the Supabase PostgreSQL connection string and
project URL/service-role key into `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=media
AUTO_CREATE_SCHEMA=false
```

Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only. Never place it in a
`frontend/.env` file or commit it to source control.

### 4. Open the app

Go to **http://localhost:5173**, click **Create Account**, and start checking in.

---

## Optional: connect a real YouTube API key

Out of the box, music/video/meditation recommendations use a small curated fallback
library so everything works with zero setup. To pull live results from YouTube:

1. Get a free API key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (enable the **YouTube Data API v3**).
2. Open `backend/.env` and set:
   ```
   YOUTUBE_API_KEY=your-key-here
   ```
3. Restart the backend.

No key, no problem — the app degrades gracefully and keeps working.

## Optional: connect podcast and video providers

Podcast recommendations use the [Listen Notes API](https://www.listennotes.com/api/),
and motivational video recommendations use Dailymotion's public API. Add the keys
below to `backend/.env` and restart the backend:

```
LISTEN_NOTES_API_KEY=your-listen-notes-key-here
DAILYMOTION_API_KEY=your-dailymotion-key-here
```

Listen Notes requires its API key for podcast searches. Dailymotion searches can
work without a key, subject to the provider's public API limits. If either
provider is unavailable, the rest of the check-in and its other recommendations
still load normally.

---

## Features

- **Email/password auth** with JWT tokens and protected routes
- **Daily emotion check-in** — free text, voice input (browser speech-to-text), or SVG emotion cards (no emoji anywhere)
- **Hybrid AI emotion analysis** — local keyword matching combined with a real Hugging Face emotion-classification model (optional, works without it too)
- **Crisis safety net** — local, always-on detection of crisis language, showing supportive resources (988, Crisis Text Line, international helplines) without blocking the check-in
- **Recommendation engine** — Listen Notes podcast episodes, Dailymotion motivational videos, YouTube music and meditation, plus real quotes pulled from ZenQuotes.io (with graceful provider fallbacks)
- **My Emotional Journey** — timeline, weekly/monthly charts, streaks, stats, and data-backed correlation insights (e.g. "you tend to have a harder time on Mondays")
- **Streak celebrations** — animated milestone toast at 3/7/14/30/60/100-day streaks
- **Mood-based theming** — subtle background tint reflecting today's dominant emotion
- **"On This Day" reflections** — surfaces a check-in from exactly a week/month/year ago
- **Shareable encouragement cards** — download a branded image of any quote/affirmation
- **Export your data** — download all check-ins, journal entries, and favorites as CSV or JSON
- **AI Emotional Health Report** — downloadable weekly/monthly **PDF** with mood trend charts, emotion breakdown, a written narrative summary, improvement areas, and personalized recommendations
- **Daily Journal** — reflections, gratitude notes, lessons learned
- **Favorites** — save videos, songs, and meditations
- **Settings** — reminders, change password, privacy, delete account, data export
- **Rate limiting** — protects login/register/check-in endpoints from abuse
- Collapsible sidebar on desktop, bottom navigation on mobile
- Loading skeletons, error boundaries, and form validation throughout

---

## Tech stack

**Frontend:** React, React Router, Tailwind CSS, Framer Motion, Axios, Recharts, lucide-react
**Backend:** Python, FastAPI, SQLAlchemy, Supabase PostgreSQL, Supabase Storage, python-jose (JWT), passlib (bcrypt), reportlab (PDF)
**External API:** YouTube Data API v3 (optional — curated fallback included)

---

## Troubleshooting

- **Port already in use** — change `--port 8000` in `start.sh`/the manual uvicorn
  command, and update `VITE_API_URL` in `frontend/.env` to match.
- **CORS errors** — make sure `frontend/.env`'s `VITE_API_URL` points at the backend,
  and that `backend/.env`'s `FRONTEND_ORIGIN` points at the frontend URL.
- **Reset your data** — delete `backend/encourage_me.db` and restart the backend; a
  fresh database is created automatically.

---

## What's intentionally not included

A few production-readiness items need infrastructure/credentials this local setup doesn't have, so they're not included:

- **Real email delivery for password reset** — currently acknowledges the request without sending an email. Needs an SMTP provider (e.g. SendGrid, Postmark) and API key.
- **PostgreSQL** — currently uses SQLite, which is great for local/personal use but not ideal for multiple concurrent users. Migrating is straightforward with SQLAlchemy but needs a running Postgres instance.

Happy to build either of these if you set up the underlying service and share how you'd like to proceed.

---

*Built and Powered by Emtrixz Technology*
