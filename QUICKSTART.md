# ⚡ PathoGlow Quick Start - 5 Minutes to Running

## Step 1: Backend (2 min)

```bash
cd backend

# Setup
pip install -r requirements.txt

# Run
python main.py
```

✅ Backend ready at `http://127.0.0.1:8000`

## Step 2: Frontend (2 min)

```bash
cd frontend

# Setup
npm install

# Run
npm run dev
```

✅ Frontend ready at `http://localhost:5173`

## Step 3: Create Your First Account (1 min)

1. Click "Get Started"
2. Sign up as **Patient** or **Clinician**
3. Fill in email & password
4. Click "Create Account"

✅ You're logged in!

---

## Try It Out

### As a Patient
1. Click camera icon
2. Upload a wound image (or use the demo button)
3. See results with severity score
4. Click "My Records" to view history

### As a Clinician  
1. Click "My Portal"
2. Create a new article
3. Choose category & write content
4. Publish or save as draft

### As an Admin (Backend only)
```sql
sqlite3 backend/pathoglow.db
INSERT INTO user (email, name, role) VALUES ('admin@test.com', 'Admin', 'admin');
```
Then login and click "📊 Analytics"

---

## Key URLs

| Page | URL |
|------|-----|
| Home | http://localhost:5173 |
| Patient Records | http://localhost:5173 + Click "🩹 My Records" |
| Clinician Portal | http://localhost:5173 + Click "🩺 My Portal" |
| Admin Analytics | http://localhost:5173 + Click "📊 Analytics" |
| API Docs | http://127.0.0.1:8000/docs |

---

## Troubleshooting

### Port already in use?
```bash
# Backend on different port
python main.py --port 8001

# Or change in main.py line: uvicorn.run(..., port=8001)
```

### Module not found?
```bash
# Backend
pip install python-dotenv opencv-python numpy pillow sqlalchemy fastapi

# Frontend  
npm install react react-dom
```

### Database reset
```bash
rm backend/pathoglow.db
# Tables recreate on next startup
```

---

## Next Steps

1. **Read** `COMPLETE_SETUP.md` - Full architecture
2. **Setup AI** - See `SETUP_AI_CHAT.md`
3. **Deploy** - Use `COMPLETE_SETUP.md` → Deployment Checklist

---

**Status:** Ready to use! 🚀
