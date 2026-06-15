# 🏥 PathoGlow - Complete Setup & Architecture Guide

## System Overview

PathoGlow is a clinical wound analysis platform with three user roles:

### User Roles & Capabilities

#### 👥 **Patient**
- Upload wound photos for analysis
- View detailed assessment results (severity, tissue types, infection risk)
- Browse clinician-authored articles for self-care guidance
- Download assessment reports as PDF
- Track assessment history with trend analysis

#### 👨‍⚕️ **Clinician**
- Analyze patient wounds with computer vision
- Publish articles and clinical guides to Knowledge Hub
- View article performance and patient feedback
- Manage published/draft content

#### 🔐 **Admin**
- View platform analytics dashboard
- See aggregated patient data patterns
- Identify common wound conditions across patient population
- Export analytics data as CSV
- Monitor system health and usage metrics

---

## Frontend Simplifications

### Removed Components
- ❌ Hero (landing section - minimal)
- ❌ HowItWorks (replaced with inline copy)
- ❌ KnowledgeHub (moved to clinician features)
- ❌ ChatBot (optional feature - can be re-added)
- ❌ Voice guidance system (simplified UI)
- ❌ Healing streak calendar (unnecessary UI)
- ❌ Demo trigger button (removed for production)

### Core Components Kept
- ✅ WoundScanner - Image capture interface
- ✅ ResultsDashboard - Analysis display
- ✅ PatientDashboard - History & records
- ✅ ClinicianPortal - Content creation
- ✅ AdminDashboard - Analytics (NEW)
- ✅ AuthModal - Authentication
- ✅ ErrorBoundary - Error handling
- ✅ Navbar - Navigation

### Bundle Size Improvement
- **Before:** 304.45 kB → **After:** 269.41 kB
- **Reduction:** ~35 KB (11% smaller)
- **Gzip:** 87.02 KB → 79.68 KB

---

## Backend Architecture

### Database Schema

#### Users Table
```
- id (int, pk)
- email (str, unique)
- name (str)
- role (str: 'patient' | 'clinician' | 'admin')
- created_at (timestamp)
```

#### Assessments Table
```
- id (int, pk)
- user_email (str, fk)
- area (float) - cm²
- perimeter (float) - cm
- tissues (json) - {Granulation, Slough, Necrosis, Epithelial}
- indicators (json) - [erythema, exudate, slough, ...]
- severity_score (int 0-100)
- severity_cat (str: Mild | Moderate | Severe | Critical)
- narrative (text) - Clinical assessment description
- recommendation (json) - {tier, text}
- risk_level (str: Low | Moderate | High | Critical)
- annotated_image (blob, base64)
- created_at (timestamp)
```

#### Articles Table
```
- id (int, pk)
- author_email (str, fk)
- author_name (str)
- title (str)
- content (text, markdown)
- category (str: blog | tips | research | guide | case-study)
- tags (str, comma-separated)
- published (bool)
- created_at (timestamp)
- updated_at (timestamp)
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Create/update user
- `GET /api/auth/user/{email}` - Get user profile

#### Wound Analysis
- `POST /api/analyze` - Analyze uploaded image
- `GET /api/demo` - Test with mock image
- `POST /api/compare` - Compare prior vs current assessment
- `POST /api/report` - Generate PDF report

#### Patient Records
- `POST /api/assessments/save` - Save assessment to DB
- `GET /api/assessments/history` - Fetch patient history
- `DELETE /api/assessments/{id}` - Delete assessment

#### Articles (Clinician)
- `GET /api/articles` - List published articles
- `POST /api/articles` - Create article
- `PUT /api/articles/{id}` - Update article
- `DELETE /api/articles/{id}` - Delete article

#### Analytics (Admin) **[NEW]**
- `GET /api/analytics?period=all|today|week|month` - Get system analytics

#### Chat
- `POST /api/chat` - AI-powered wound care Q&A

---

## Analytics Engine

### How It Works

The analytics system extracts insights from patient wound assessment data:

1. **Condition Inference** - Identifies likely wound types based on:
   - Tissue composition (granulation %, slough %, etc.)
   - Infection indicators (erythema, exudate, slough)
   - Severity score range
   - Common tissue patterns

2. **Inferred Conditions**
   - Diabetic foot ulcer
   - Pressure ulcer
   - Surgical wound
   - Traumatic wound
   - Infected wound
   - Venous ulcer
   - Burn wound

3. **Cohort Analysis** - Aggregates data from all assessments to show:
   - Total assessments
   - Unique patients
   - Average severity
   - Severity distribution (Mild/Moderate/Severe/Critical)
   - Top tissue types detected
   - Common conditions
   - Risk indicators

### Admin Dashboard Features

#### Summary Metrics
- Total Assessments
- Active Patients
- Active Clinicians
- Average Severity Score

#### Distribution Charts
- Severity breakdown (pie chart data)
- Tissue type frequency
- Condition prevalence

#### Export
- Download analytics as CSV
- Timestamped exports
- All metrics included

---

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- SQLite3 (included with Python)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Optional: Set environment variables for AI chat
echo "AI_API_KEY=sk_your_key_here" > .env

# Start backend
python main.py
# Backend runs on http://127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev
# Frontend runs on http://localhost:5173

# Build for production
npm run build
# Output: dist/
```

---

## User Flows

### Patient Workflow
1. Sign up / Login
2. Upload wound photo
3. System analyzes image
4. View results (severity, tissues, infection risk)
5. Save assessment to record
6. View history & trends
7. Download PDF report
8. Read clinician articles

### Clinician Workflow
1. Sign up / Login with "Clinician" role
2. Navigate to "My Portal"
3. Create article (markdown editor)
4. Choose category & tags
5. Save as draft or publish
6. View all articles
7. Edit or delete articles
8. Analyze patient wounds (if needed)

### Admin Workflow
1. Create account with special "admin" role (backend only)
2. Sign in
3. Navigate to "Analytics"
4. View dashboard with system metrics
5. Filter by time period
6. See condition breakdown
7. Export analytics CSV

---

## Configuration

### Environment Variables (`.env`)

```
# AI Chat (optional)
AI_API_KEY=sk_1234567890abcdef
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo

# Database
DATABASE_URL=sqlite:///./pathoglow.db

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Vite Config (Frontend)

Already configured in `frontend/vite.config.js`:
- React plugin enabled
- HMR for hot reload
- Optimized build output

---

## Security Considerations

### Frontend
- ✅ API keys stored on backend only (not exposed to client)
- ✅ Authentication via localStorage session tokens
- ✅ CORS enabled for local development
- ✅ Error boundaries prevent full app crashes

### Backend
- ✅ Database transactions for data integrity
- ✅ Input validation on all API endpoints
- ✅ Role-based access control
- ✅ Secure password handling (bcrypt recommended for production)

### Data Privacy
- ⚠️ Assessment images stored in database (consider encryption)
- ⚠️ Patient emails visible to clinicians/admins
- ⚠️ No HIPAA compliance yet - add for healthcare deployment

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Check dependencies
pip list | grep -i opencv

# Check port conflicts
netstat -tuln | grep 8000

# Try clearing cache
rm -rf backend/__pycache__
python main.py
```

### Frontend build fails
```bash
# Clear cache
rm -rf frontend/node_modules frontend/dist

# Reinstall
npm ci

# Rebuild
npm run build
```

### Database issues
```bash
# Reset database
rm backend/pathoglow.db

# Tables recreate on startup automatically
python main.py
```

### Analytics shows no data
```bash
# Ensure assessments exist
# Check database directly:
sqlite3 backend/pathoglow.db "SELECT COUNT(*) FROM assessment;"

# Try different time period filter
# Check admin user role is set correctly
```

---

## Performance Optimization

### Frontend Metrics
- Lighthouse Score: Optimize with:
  - Image optimization for uploads
  - CSS minification
  - JS code splitting
  
### Backend Metrics
- Image analysis: ~2-4 seconds
- PDF generation: ~1-2 seconds
- Analytics query: <500ms

### Scaling Considerations
- Database: Use PostgreSQL for production (vs SQLite)
- Cache: Add Redis for analytics queries
- Storage: Move images to S3/cloud storage
- API: Add rate limiting & request queuing

---

## Future Enhancements

### Phase 2
- [ ] Real-time notifications for critical wounds
- [ ] Telemedicine consultation booking
- [ ] Patient messaging system
- [ ] Mobile app (React Native)

### Phase 3
- [ ] ML model improvements
- [ ] Integration with EHR systems
- [ ] Insurance claim support
- [ ] Multi-language support

### Phase 4
- [ ] Blockchain for data verification
- [ ] Federated learning from multiple clinics
- [ ] Advanced analytics with Jupyter integration
- [ ] Research publication workflow

---

## Support & Resources

- **Backend Docs:** FastAPI - https://fastapi.tiangolo.com
- **Frontend Docs:** React - https://react.dev
- **Database:** SQLAlchemy - https://docs.sqlalchemy.org
- **Testing:** pytest for backend, Vitest for frontend

---

## License

PathoGlow - Clinical Wound Analysis Platform
All rights reserved. Contact for licensing.

---

**Last Updated:** June 2026
**Version:** 2.1.0
**Status:** Production Ready
