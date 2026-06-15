# 🤖 PathoGlow AI Chat Setup Guide

## Overview

The ChatBot component now uses **OpenAI's GPT-3.5-turbo** for intelligent, context-aware wound care responses. The system includes:

- **Secure backend integration** - API keys stored on server, not exposed to frontend
- **Graceful fallback** - Rule-based responses if API is unavailable
- **Contextual awareness** - References patient's assessment data in responses
- **Safety guardrails** - System prompt ensures medically appropriate responses

---

## Setup Instructions

### Step 1: Get an OpenAI API Key

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you can only see it once)

⚠️ **IMPORTANT:** Keep this key secret! Never commit it to Git or share in public.

### Step 2: Configure Backend Environment

#### Option A: Using `.env` file (Recommended for Development)

1. Create `.env` in the `backend/` directory:
```bash
cd backend
echo "AI_API_KEY=sk_your_actual_key_here" > .env
```

2. The file should look like:
```
AI_API_KEY=sk_1234567890abcdefghijklmnopqrstuvwxyz
AI_API_BASE=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
DATABASE_URL=sqlite:///./pathoglow.db
FRONTEND_URL=http://localhost:5173
```

3. **Verify `.env` is in `.gitignore`:**
```bash
cat .gitignore | grep ".env"
```

Should output: `.env`

#### Option B: Using Environment Variables (Production)

```bash
# On your production server, set environment variables:
export AI_API_KEY="sk_your_actual_key_here"
export AI_MODEL="gpt-3.5-turbo"
```

### Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if requirements.txt doesn't include the new packages:

```bash
pip install openai python-dotenv
```

### Step 4: Test the Backend

```bash
# Start the backend
python main.py

# In another terminal, test the chat endpoint:
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is granulation tissue?",
    "history": [],
    "context": null
  }'
```

Expected response:
```json
{
  "reply": "🩺 Granulation tissue is the new, healthy pink tissue that forms...",
  "role": "assistant"
}
```

### Step 5: Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The ChatBot is accessible via the floating action button in the bottom-right corner.

---

## How It Works

### Frontend Flow
1. User types message in ChatBot component
2. Message sent to backend `/api/chat` endpoint
3. Backend calls OpenAI API with context
4. Response displayed in chat UI

### Backend Flow
```
User Message
    ↓
Load .env variables
    ↓
Create System Prompt (with assessment context if available)
    ↓
Call OpenAI ChatCompletion API
    ↓
Parse Response
    ↓
On Success: Return AI response
On Error: Fallback to rule-based response
    ↓
Return to Frontend
```

---

## Safety & Security

### API Key Protection
- ✅ Keys stored in `.env` on server only
- ✅ `.env` added to `.gitignore` to prevent accidental commits
- ✅ Frontend never sees the key
- ✅ All API calls go through your backend

### Medical Safety
- ✅ System prompt enforces non-diagnostic responses
- ✅ Always directs to healthcare providers for concerns
- ✅ Emergency situations trigger clear warnings
- ✅ Contextual awareness prevents harmful generic advice

### Fallback Mechanism
If OpenAI API is down or rate-limited:
- System automatically falls back to rule-based responses
- Users continue to get helpful guidance
- No data loss or service interruption

---

## Cost Considerations

### OpenAI Pricing
- **GPT-3.5-turbo:** ~$0.0005 per 1K input tokens, $0.0015 per 1K output tokens
- **Average wound care question:** 150-300 tokens (~$0.0001-0.0002 per response)

### Estimate
- 100 daily users, 5 questions each = 500 questions/day
- At $0.0002 per response = ~$0.10/day = **~$3/month**

To monitor costs:
1. Visit [OpenAI Usage Page](https://platform.openai.com/account/usage/overview)
2. Set up billing alerts in account settings
3. Consider usage limits in organization settings

### Cost Optimization
```python
# Current settings in main.py
temperature=0.7,  # Lower = cheaper, more consistent
max_tokens=300,   # Limit output length
```

---

## Troubleshooting

### "API key not found" error
**Problem:** `.env` file not in `backend/` directory or `AI_API_KEY` not set

**Solution:**
```bash
# Check if .env exists
ls -la backend/.env

# Check if key is set
grep AI_API_KEY backend/.env

# Set key if missing
echo "AI_API_KEY=sk_your_key_here" >> backend/.env
```

### "Invalid API Key" error
**Problem:** API key is incorrect or revoked

**Solution:**
1. Verify key in `.env` matches OpenAI dashboard
2. Check for trailing spaces or newlines
3. Generate new key from OpenAI dashboard

### "Rate limit exceeded"
**Problem:** Too many API calls in short time

**Solution:**
- Default rate limit: 3,500 requests/minute for free tier
- Upgrade to paid account or add request throttling
- Implement per-user rate limiting

### Backend still returning rule-based responses
**Problem:** AI API working but falling back to rules

**Solution:**
1. Check backend logs: `python main.py` (look for errors)
2. Verify API key is valid
3. Check OpenAI account has positive balance
4. Test API directly:
```bash
python -c "import openai; openai.api_key='sk_...'; print(openai.ChatCompletion.create(model='gpt-3.5-turbo', messages=[{'role': 'user', 'content': 'test'}]))"
```

---

## Advanced Configuration

### Use Different AI Models

To use Claude (Anthropic), Gemini, or other models:

1. Update `main.py`:
```python
# For Claude (via Anthropic)
import anthropic
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# In chat function:
response = client.messages.create(
    model="claude-3-sonnet-20240229",
    max_tokens=300,
    messages=[{"role": "user", "content": message}]
)
```

2. Update `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Add Response Caching

For frequently asked questions:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_response(message: str):
    return find_best_response(message, None)
```

### Add Conversation Memory

Store conversation history in database:

```python
db.add(models.ChatMessage(
    user_email=current_user.email,
    role="user",
    content=message
))
db.commit()
```

---

## Support & Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **API Status:** https://status.openai.com
- **Community Forum:** https://community.openai.com
- **Rate Limits:** https://platform.openai.com/account/rate-limits

---

## Security Checklist

- [ ] `.env` file created with valid API key
- [ ] `.env` added to `.gitignore`
- [ ] `.env` never committed to Git
- [ ] Backend environment variables set correctly
- [ ] Test API call successful
- [ ] Frontend ChatBot working
- [ ] API key rotation plan in place
- [ ] Billing alerts configured
- [ ] Usage monitoring set up

---

**Last Updated:** June 2026
**PathoGlow Version:** 2.0.0
