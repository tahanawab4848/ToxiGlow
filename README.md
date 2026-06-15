# ToxiGlow — AI-Powered Wound Analysis Platform

> Early warning system for wound deterioration. Upload a photo, get a clinical-grade assessment in seconds.

![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.1.0-blue)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![Node](https://img.shields.io/badge/Node-16%2B-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Overview

ToxiGlow is a full-stack wound assessment web application combining computer vision with a cinematic dark UI. Patients upload wound photos, the AI engine segments tissue, detects infection markers, and produces a severity score — all in under 5 seconds.

Built for **BioNova Innovathon 2026**.

---

## Live Features

### For Patients
- 📸 Camera capture or drag-and-drop image upload
- 🧠 AI tissue classification (granulation, slough, necrosis, epithelial, etc.)
- 📏 Automated wound measurement (area, perimeter, diameter)
- ⚡ Infection risk detection with visual markers
- 📊 Severity score (0–100) with animated gauge
- 📥 Downloadable PDF assessment report
- 🗂️ Personal assessment history with trend tracking

### For Clinicians
- ✍️ Publish articles, guides, and case studies
- 📂 Draft/publish workflow with category tagging
- 🏷️ Tag system for content organisation

### For Admins
- 📊 Analytics dashboard — live system metrics
- 🏥 Condition inference from patient wound data
- 📉 Severity distribution and tissue pattern analysis
- 📥 CSV data export
- 🕐 Time-period filtering (today / week / month / all)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | Custom CSS — dark glassmorphism |
| Backend | FastAPI (Python) |
| Database | SQLAlchemy + SQLite |
| Image Processing | OpenCV + NumPy + Pillow |
| AI Chat | OpenAI GPT (optional) |
| PDF Reports | fpdf2 |
| Auth | localStorage sessions + role-based access |

---

## UI & Animations

The interface uses a **"Clinical Compassion"** dark cinematic design system:

- **Particle field** — 22 rising cyan particles on the hero
- **Animated gradient orbs** — breathing radial glows (cyan, purple, green)
- **Typing animation** — cycling feature descriptions with blinking cursor
- **Scroll-reveal** — `IntersectionObserver`-based staggered entrance animations
- **Animated counters** — stats count up when scrolled into view
- **Scanner rings** — pulsing concentric circles during analysis
- **Severity pulse** — critical wound cards animate with a red glow
- **Tissue progress bars** — animated fill on results load
- **Before/After wipe slider** — drag to compare raw vs annotated image
- **Glass cards** with hover lift and glow effects

Fonts: **Instrument Serif** (display) + **Inter** (body)

---

## Project Structure

```
toxiglow/
├── backend/
│   ├── main.py                  # FastAPI app, all endpoints
│   ├── models.py                # SQLAlchemy models
│   ├── database.py              # DB config
│   ├── requirements.txt
│   ├── .env.example             # Environment variable template
│   └── engine/
│       ├── analytics.py         # Admin analytics engine
│       ├── comparison.py        # Assessment comparison
│       ├── infection_detector.py
│       ├── measurement.py
│       ├── narrative.py
│       ├── recommendation.py
│       ├── segmentation.py
│       ├── severity.py
│       └── tissue_classifier.py
│   └── utils/
│       ├── image_processing.py
│       ├── report.py            # PDF generation
│       └── visualization.py
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main app + Hero + HowItWorks
    │   ├── index.css            # Full design system + animations
    │   ├── config.js            # Centralized API config
    │   └── components/
    │       ├── Navbar.jsx
    │       ├── WoundScanner.jsx
    │       ├── ResultsDashboard.jsx
    │       ├── SeverityGauge.jsx
    │       ├── TissueChart.jsx
    │       ├── PatientDashboard.jsx
    │       ├── ClinicianPortal.jsx
    │       ├── AdminDashboard.jsx
    │       ├── AuthModal.jsx
    │       ├── ErrorBoundary.jsx
    │       └── Footer.jsx
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- pip

### 1. Clone the repo

```bash
git clone https://github.com/tahanawab4848/ToxiGlow.git
cd ToxiGlow
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in your values
python main.py
```

Backend runs at `http://127.0.0.1:8000`  
API docs at `http://127.0.0.1:8000/docs`

### 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # set VITE_API_URL if needed
npm run dev
```

Frontend runs at `http://localhost:5173`

> **Windows shortcut:** double-click `run_backend.bat` and `run_frontend.bat`

---

## Environment Variables

**backend/.env**
```env
AI_API_KEY=your_openai_key_here     # optional — enables AI chat
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
DATABASE_URL=sqlite:///./pathoglow.db
FRONTEND_URL=http://localhost:5173
```

**frontend/.env.local**
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze wound image |
| GET | `/api/demo` | Run demo analysis |
| POST | `/api/compare` | Compare two assessments |
| POST | `/api/report` | Generate PDF report |
| POST | `/api/auth/register` | Register user |
| GET | `/api/auth/user/{email}` | Get user profile |
| POST | `/api/assessments/save` | Save assessment |
| GET | `/api/assessments/history` | Get patient history |
| DELETE | `/api/assessments/{id}` | Delete assessment |
| GET | `/api/articles` | List articles |
| POST | `/api/articles` | Create article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |
| GET | `/api/analytics` | Admin analytics |
| POST | `/api/chat` | AI chat |

---

## User Roles

| Feature | Patient | Clinician | Admin |
|---------|---------|-----------|-------|
| Analyze wounds | ✅ | ✅ | — |
| Save & view history | ✅ | ✅ | — |
| Write articles | — | ✅ | — |
| View analytics | — | — | ✅ |

**Creating an admin account:**
```sql
-- Run in SQLite against backend/pathoglow.db
INSERT INTO user (email, name, role) VALUES ('admin@example.com', 'Admin', 'admin');
```

---

## Database Schema

```
users          → id, email, name, role, created_at
assessments    → id, user_email, area, perimeter, tissues, severity_score,
                 severity_cat, narrative, recommendation, risk_level,
                 annotated_image, created_at
articles       → id, author_email, title, content, category, tags,
                 published, created_at, updated_at
```

---

## Performance

| Metric | Value |
|--------|-------|
| Frontend bundle | 289 KB (84 KB gzipped) |
| Build time | ~700ms |
| Image analysis | 2–4 seconds |
| PDF generation | 1–2 seconds |
| Analytics query | < 500ms |

---

## Roadmap

- [ ] Real-time wound progression alerts
- [ ] Telemedicine appointment booking
- [ ] React Native mobile app
- [ ] EHR system integration
- [ ] Multi-language support
- [ ] HIPAA-compliant encryption

---

## Troubleshooting

**Backend won't start**
```bash
pip install -r requirements.txt
python main.py
```

**Frontend build fails**
```bash
rm -rf node_modules
npm install
npm run build
```

**Database reset**
```bash
del backend\pathoglow.db
python main.py    # auto-recreates tables on startup
```

---

## Changelog

### v2.1.0 — June 2026
- ✨ Rich animations: particles, typing effect, scroll-reveal, orbs, animated counters
- ✨ Admin analytics dashboard with condition detection
- 🎯 Simplified frontend — removed dead components
- 🐛 Fixed blank main page (broken component imports)
- 🐛 Fixed navbar invisible on initial load
- 📦 Bundle size optimised

### v2.0.0 — May 2026
- 🎉 Full React + FastAPI rewrite
- ✅ Role-based auth (Patient / Clinician / Admin)
- ✅ Wound analysis engine with computer vision
- ✅ PDF report generation
- ✅ Patient history tracking
- ✅ Clinician article system
- ✅ AI chat integration (OpenAI)

### v1.0.0 — April 2026
- 🎯 MVP — basic wound analysis prototype

---

## Disclaimer

ToxiGlow provides early warning indicators only. It is **not a medical diagnostic device**. Always consult a qualified healthcare provider for medical advice. In an emergency, call your local emergency services immediately.

---

*Built with ❤️ for BioNova Innovathon 2026*
