import base64
import io
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import re
import random
from datetime import datetime
import os
import hashlib
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("AI_API_KEY", "")

# Database imports
from sqlalchemy.orm import Session
from database import engine, get_db
import models

# Core engine imports
from engine.segmentation import segment_wound
from engine.tissue_classifier import classify_tissue
from engine.infection_detector import detect_infection_markers
from engine.measurement import estimate_measurements
from engine.severity import calculate_severity
from engine.narrative import generate_narrative
from engine.recommendation import get_recommendation
from engine.comparison import compare_wounds
from engine.analytics import WoundAnalyticsEngine
from utils.image_processing import resize_for_processing
from utils.visualization import draw_wound_contour, overlay_tissue_map
from utils.report import generate_pdf_report

app = FastAPI(title="PathoGlow Backend API", version="2.0.0")

# Create DB tables on startup
@app.on_event("startup")
def startup_db():
    models.Base.metadata.create_all(bind=engine)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompareRequest(BaseModel):
    prior: dict
    current: dict

class ReportRequest(BaseModel):
    annotated_image: str
    area: float
    perimeter: float
    tissues: Dict[str, float]
    indicators: List[str]
    severity_score: int
    severity_cat: str
    narrative: str
    recommendation: Dict[str, str]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[Dict[str, Any]] = None

# ── NEW: Database Pydantic schemas ────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "patient"   # "patient" | "clinician"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class AssessmentSaveRequest(BaseModel):
    user_email: str
    area: float
    perimeter: float
    tissues: Dict[str, float]
    indicators: List[str]
    severity_score: int
    severity_cat: str
    narrative: str
    recommendation: Dict[str, Any]
    risk_level: str
    annotated_image: Optional[str] = None

class ArticleCreateRequest(BaseModel):
    author_email: str
    author_name: str
    title: str
    content: str
    category: str = "blog"
    tags: str = ""
    published: bool = True

class ArticleUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    published: Optional[bool] = None

# ---------------------------------------------------------------------------- #
#  Rule-based Wound Care Knowledge Engine
# ---------------------------------------------------------------------------- #
WOUND_KNOWLEDGE = [
    {
        "patterns": ["granulation", "granulate", "pink tissue", "healthy tissue"],
        "response": "🩺 **Granulation tissue** is the new, healthy pink tissue that forms during healing. It looks beefy red or pink and is a great sign — it means your wound is filling in from the bottom up. Keep it moist with an appropriate dressing and avoid disturbing it."
    },
    {
        "patterns": ["slough", "yellow tissue", "white tissue", "stringy"],
        "response": "⚠️ **Slough** is yellowish or whitish soft dead tissue on the wound surface. It can slow healing by providing a breeding ground for bacteria. Your clinician may use debridement (cleaning) to remove it. It's different from healthy tissue — healthy tissue is pink and moist."
    },
    {
        "patterns": ["necrosis", "necrotic", "black tissue", "dead tissue", "eschar"],
        "response": "🔴 **Necrotic tissue** (eschar) is black, brown, or dark tissue — it's dead and has no blood supply. It must be removed by a healthcare professional through debridement before the wound can heal properly. If you see black tissue, please seek medical attention promptly."
    },
    {
        "patterns": ["erythema", "redness", "red skin", "skin turning red"],
        "response": "🔴 **Erythema** is redness of the skin around the wound. A small amount of redness right at the wound edge is normal (part of inflammation). But spreading redness (>2cm from the wound edge), warmth, or streaking suggests infection — seek medical care if you see this."
    },
    {
        "patterns": ["exudate", "discharge", "fluid", "pus", "leaking", "draining"],
        "response": "💧 **Exudate** is fluid that comes from the wound. Clear or slightly yellow (serous) fluid is normal. Cloudy, thick, green, or foul-smelling discharge suggests infection. Heavy exudate requires frequent dressing changes. Always tell your clinician about changes in wound discharge."
    },
    {
        "patterns": ["infection", "infected", "bacteria", "sepsis", "fever"],
        "response": "🚨 **Signs of wound infection** include: spreading redness, increased warmth, swelling, foul odor, cloudy/green discharge, and fever. If you have fever (>38°C/100.4°F) with wound symptoms, seek emergency care immediately. Do not wait — wound infections can spread rapidly."
    },
    {
        "patterns": ["dressing", "bandage", "cover", "change dressing", "how often"],
        "response": "🩹 **Dressing changes** depend on the wound type and drainage. Generally: change dressings when wet/soiled, or every 1–3 days for moderate wounds. Always wash hands thoroughly before touching wound dressings. Keep the wound moist (not wet) for optimal healing. Your clinician will advise the best dressing type."
    },
    {
        "patterns": ["clean", "wash wound", "cleaning", "rinse", "saline"],
        "response": "🧼 **Wound cleaning**: Rinse gently with sterile saline solution or clean tap water. Avoid hydrogen peroxide, iodine, or alcohol on open wounds — they damage healthy tissue. Pat dry with a clean cloth. Clean wounds in a well-lit area and check for any changes in size, color, or smell."
    },
    {
        "patterns": ["severity", "severity score", "score", "how bad", "serious"],
        "response": "📊 **Severity scoring** in ToxiGlow uses 4 levels:\n• **Mild (0–30)**: Minor wound, healing expected — monitor at home.\n• **Moderate (31–60)**: Some concern — schedule a nurse visit within 48–72h.\n• **Severe (61–80)**: Medical attention needed within 24h.\n• **Critical (81–100)**: Seek emergency care immediately."
    },
    {
        "patterns": ["epithelial", "epithelialization", "skin closing", "skin forming"],
        "response": "✨ **Epithelialization** is the final stage of healing where new skin cells migrate across the wound surface. You'll see the wound turning pinkish-white or silvery at the edges. This is excellent progress! Keep the area moist and protected. Avoid picking or rubbing."
    },
    {
        "patterns": ["diabetes", "diabetic", "blood sugar", "diabetic wound"],
        "response": "🩸 **Diabetic wounds** heal more slowly due to reduced circulation and nerve damage. They need close monitoring — check your wound daily, maintain blood sugar control, and see a wound care specialist. Any wound that doesn't improve within 2–4 weeks needs medical review. Diabetic foot ulcers are especially serious."
    },
    {
        "patterns": ["pressure sore", "pressure ulcer", "bedsore", "decubitus"],
        "response": "🛏️ **Pressure ulcers** form when sustained pressure cuts off blood supply to skin (especially over bony areas). Prevention: reposition every 2 hours, use pressure-relieving mattresses, keep skin clean and dry. Early stages (redness) are treatable — advanced stages need specialist care."
    },
    {
        "patterns": ["pain", "hurt", "hurting", "painful", "sting", "burning"],
        "response": "💊 **Wound pain** is normal in acute wounds but shouldn't worsen over time. Increasing pain often signals infection. Mild pain: keep wound elevated, use paracetamol/ibuprofen if not contraindicated. Severe, throbbing, or sudden pain: seek medical attention. Never ignore pain that wakes you at night."
    },
    {
        "patterns": ["nutrition", "diet", "food", "vitamin", "protein", "zinc"],
        "response": "🥗 **Nutrition for healing**: Protein is the building block of new tissue — aim for adequate protein intake (meat, fish, eggs, legumes). Vitamin C supports collagen formation. Zinc helps immune function. Staying hydrated keeps tissue supple. Poor nutrition significantly slows wound healing."
    },
    {
        "patterns": ["how long", "heal time", "healing time", "when will", "how fast"],
        "response": "⏱️ **Healing time** varies widely by wound type, size, and individual health. Small superficial wounds: 1–2 weeks. Moderate wounds: 2–6 weeks. Chronic or deep wounds: months. Factors that slow healing: diabetes, poor nutrition, smoking, infection, and inadequate care. If not improving after 2 weeks, see a doctor."
    },
    {
        "patterns": ["hello", "hi", "hey", "good morning", "good evening", "howdy"],
        "response": "👋 Hello! I'm **ToxiGlow AI**, your wound care assistant. I can help you understand:\n• Wound assessment results\n• Tissue types and what they mean\n• Infection signs to watch for\n• Dressing and cleaning guidance\n\nWhat would you like to know?"
    },
    {
        "patterns": ["thank", "thanks", "appreciate", "helpful"],
        "response": "😊 You're welcome! Remember — while I can provide general guidance, I'm not a substitute for professional medical care. If you're concerned about your wound, please consult a healthcare provider. Stay well! 🩹"
    },
    {
        "patterns": ["emergency", "urgent", "911", "ambulance", "help me"],
        "response": "🚨 **If this is a medical emergency, call emergency services immediately** (911 in US, 999 in UK, 112 in EU, 000 in Australia).\n\nSigns requiring emergency care:\n• Rapidly spreading redness/swelling\n• High fever (>39°C/102°F)\n• Extreme pain or numbness\n• Green/black discharge with foul odor\n• Loss of consciousness"
    }
]

def find_best_response(message: str, context: Optional[Dict] = None) -> str:
    """Call OpenAI API for AI-powered response with wound care context."""
    try:
        # Build context prompt
        context_str = ""
        if context:
            score = context.get("severity_score")
            area = context.get("area")
            risk = context.get("risk_level")
            tissues = context.get("tissues", {})
            
            if score is not None:
                dominant = max(tissues, key=tissues.get) if tissues else "Unknown"
                context_str = f"""
The patient's latest wound assessment:
- Severity Score: {score}/100
- Wound Area: {area} cm²
- Infection Risk: {risk}
- Dominant Tissue Type: {dominant} ({tissues.get(dominant, 0):.0f}%)

Refer to this context when answering questions about "my wound", "my result", etc.
"""
        
        system_prompt = f"""You are ToxiGlow AI, a specialized wound care assistant that provides evidence-based guidance on:
- Wound tissue types (granulation, slough, necrosis, epithelial)
- Infection signs and prevention
- Dressing and wound care best practices
- Severity assessment interpretation
- When to seek emergency care

IMPORTANT SAFETY RULES:
1. NEVER provide medical diagnosis - only describe what different tissue types look like
2. Always recommend seeing a healthcare provider for concerning symptoms
3. For emergency signs (spreading redness, fever, foul discharge, severe pain), ALWAYS direct to emergency services
4. Use emoji for visual clarity (🩺 for medical, 🚨 for urgent, etc.)
5. Keep responses concise but thorough (2-3 short paragraphs max)
6. Use Markdown formatting with **bold** for emphasis

{context_str}
"""
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=300,
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"AI API error: {str(e)}")
        # Fallback to rule-based response if API fails
        return find_best_response_fallback(message, context)

def find_best_response_fallback(message: str, context: Optional[Dict] = None) -> str:
    """Fallback rule-based response if AI API is unavailable."""
    msg_lower = message.lower().strip()
    
    # Check for assessment context questions first
    if context and any(kw in msg_lower for kw in ["my wound", "my result", "my score", "my assessment", "what does my"]):
        score = context.get("severity_score", None)
        cat = context.get("severity_cat", "Unknown")
        area = context.get("area", None)
        risk = context.get("risk_level", "Unknown")
        tissues = context.get("tissues", {})
        
        if score is not None:
            dominant = max(tissues, key=tissues.get) if tissues else "Unknown"
            return (
                f"📋 **Your Latest Assessment:**\n"
                f"• Severity Score: **{score}/100** ({cat})\n"
                f"• Wound Area: **{area} cm²**\n"
                f"• Infection Risk: **{risk}**\n"
                f"• Dominant Tissue: **{dominant}** ({tissues.get(dominant, 0):.0f}%)\n\n"
                f"Ask me anything about these results — for example, what does '{dominant.lower()} tissue' mean?"
            )
    
    # Pattern match against knowledge base
    for entry in WOUND_KNOWLEDGE:
        if any(pattern in msg_lower for pattern in entry["patterns"]):
            return entry["response"]
    
    # Fallback response
    fallbacks = [
        "🤔 I'm not sure I have specific information on that. Could you rephrase? I can help with wound types, tissue classification, infection signs, dressing care, and interpreting your assessment results.",
        "💡 That's a good question! For specific medical concerns about your wound, I always recommend consulting a licensed clinician. I can help explain wound care concepts — just ask!",
        "📚 I didn't quite catch that. Try asking about: **granulation tissue**, **infection signs**, **dressing changes**, **severity scores**, or **your assessment results**."
    ]
    return random.choice(fallbacks)

def process_and_analyze_image(img_rgb: np.ndarray) -> dict:
    gray = np.asarray(img_rgb)
    if gray.ndim == 3:
        gray = np.mean(gray, axis=2)

    # 1. Quality Validation: Brightness
    mean_brightness = np.mean(gray)
    if mean_brightness < 35:
        raise HTTPException(status_code=400, detail="The image is too dark. Please use brighter, even lighting.")
    if mean_brightness > 230:
        raise HTTPException(status_code=400, detail="The image is too bright. Avoid glare or overexposure.")

    # 2. Quality Validation: Blur
    laplacian_var = cv2.Laplacian(gray.astype(np.uint8), cv2.CV_64F).var()
    if laplacian_var < 18:
        raise HTTPException(status_code=400, detail="The image looks blurry or out of focus. Please retake with a steadier hand.")

    # 3. Processing & Segmentation
    resized, scale = resize_for_processing(img_rgb, max_dim=900)
    wound_mask = segment_wound(resized)
    
    # 4. Quality Validation: Wound size/detection
    if np.sum(wound_mask > 0) < 2500:
        raise HTTPException(status_code=400, detail="Could not find a reliable wound boundary. Try a clearer photo, different angle, or include a reference object.")

    # 5. Core Engine Computations
    tissues, tissue_map = classify_tissue(resized, wound_mask)
    indicators, infection_score, risk_level = detect_infection_markers(resized, wound_mask)
    area_cm2, perimeter_cm = estimate_measurements(wound_mask, pixel_to_mm_ratio=None)
    severity_score, severity_cat = calculate_severity(tissues, infection_score, area_cm2)
    narrative = generate_narrative(area_cm2, tissues, indicators, severity_score)
    recommendation = get_recommendation(severity_score, risk_level, tissues.get("Necrosis", 0))

    # 6. Annotate Image
    annotated = overlay_tissue_map(resized, wound_mask, tissue_map)
    annotated = draw_wound_contour(annotated, wound_mask, color=(0, 188, 212), thickness=4)

    # 7. Convert annotated image to Base64
    _, buffer = cv2.imencode(".jpg", cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "area": area_cm2,
        "perimeter": perimeter_cm,
        "tissues": tissues,
        "indicators": indicators,
        "severity_score": severity_score,
        "severity_cat": severity_cat,
        "narrative": narrative,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "reference_detected": False,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}"
    }

@app.post("/api/analyze")
async def analyze_upload(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        img_np = np.array(image)
        return process_and_analyze_image(img_np)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.get("/api/demo")
async def analyze_demo():
    try:
        img_np = cv2.imread("mock_wound.png")
        if img_np is None:
            raise HTTPException(status_code=404, detail="Demo image mock_wound.png not found")
        # cv2 reads BGR, convert to RGB
        img_rgb = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)
        return process_and_analyze_image(img_rgb)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo image processing failed: {str(e)}")

@app.post("/api/compare")
def compare_wounds_endpoint(req: CompareRequest):
    try:
        result = compare_wounds(req.prior, req.current)
        if result is None:
            raise HTTPException(status_code=400, detail="Invalid comparison data")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/report")
def generate_report_endpoint(req: ReportRequest):
    try:
        # Decode base64 image
        header, encoded = req.annotated_image.split(",", 1)
        img_data = base64.b64decode(encoded)
        nparr = np.frombuffer(img_data, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        pdf_bytes = generate_pdf_report(
            img_rgb,
            req.area,
            req.perimeter,
            req.tissues,
            req.indicators,
            req.severity_score,
            req.severity_cat,
            req.narrative,
            req.recommendation
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=toxiglow-assessment.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    """Rule-based wound care chatbot endpoint."""
    try:
        reply = find_best_response(req.message, req.context)
        return {"reply": reply, "role": "assistant"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


# ============================================================================ #
#  DATABASE ROUTES                                                               #
# ============================================================================ #

# ── Auth: register / get user ─────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@app.post("/api/auth/register", status_code=201)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with a hashed password."""
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed = hash_password(req.password)
    user = models.User(
        email=req.email,
        name=req.name,
        password_hash=hashed,
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "created", "email": user.email, "role": user.role, "name": user.name}

@app.post("/api/auth/login")
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return their details."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    
    hashed = hash_password(req.password)
    if user.password_hash != hashed:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    return {
        "status": "authenticated",
        "email": user.email,
        "name": user.name,
        "role": user.role
    }

@app.get("/api/auth/user/{email}")
def get_user(email: str, db: Session = Depends(get_db)):
    """Fetch a user's profile and role."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": user.email, "name": user.name, "role": user.role}


# ── Patient Assessments ───────────────────────────────────────────────────────
@app.post("/api/assessments/save", status_code=201)
def save_assessment(req: AssessmentSaveRequest, db: Session = Depends(get_db)):
    """Persist a wound assessment for a patient."""
    record = models.Assessment(
        user_email     = req.user_email,
        area           = req.area,
        perimeter      = req.perimeter,
        tissues        = req.tissues,
        indicators     = req.indicators,
        severity_score = req.severity_score,
        severity_cat   = req.severity_cat,
        narrative      = req.narrative,
        recommendation = req.recommendation,
        risk_level     = req.risk_level,
        annotated_image= req.annotated_image,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"status": "saved", "id": record.id}

@app.get("/api/assessments/history")
def get_history(email: str, db: Session = Depends(get_db)):
    """Return all assessments for a patient, newest first."""
    records = (
        db.query(models.Assessment)
        .filter(models.Assessment.user_email == email)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )
    return [
        {
            "id":             r.id,
            "area":           r.area,
            "perimeter":      r.perimeter,
            "tissues":        r.tissues,
            "indicators":     r.indicators,
            "severity_score": r.severity_score,
            "severity_cat":   r.severity_cat,
            "narrative":      r.narrative,
            "recommendation": r.recommendation,
            "risk_level":     r.risk_level,
            "annotated_image":r.annotated_image,
            "created_at":     r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]

@app.delete("/api/assessments/{assessment_id}")
def delete_assessment(assessment_id: int, email: str, db: Session = Depends(get_db)):
    """Delete a patient's assessment by ID (ownership check via email)."""
    record = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id,
        models.Assessment.user_email == email
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted"}


# ── Articles (Clinician Knowledge Base) ───────────────────────────────────────
@app.get("/api/articles")
def list_articles(
    category: Optional[str] = None,
    author_email: Optional[str] = None,
    include_drafts: bool = False,
    db: Session = Depends(get_db)
):
    """List published articles; optionally filter by category or author."""
    q = db.query(models.Article)
    if not include_drafts:
        q = q.filter(models.Article.published == True)
    if category:
        q = q.filter(models.Article.category == category)
    if author_email:
        q = q.filter(models.Article.author_email == author_email)
    articles = q.order_by(models.Article.created_at.desc()).all()
    return [
        {
            "id":           a.id,
            "author_email": a.author_email,
            "author_name":  a.author_name,
            "title":        a.title,
            "content":      a.content,
            "category":     a.category,
            "tags":         a.tags,
            "published":    a.published,
            "created_at":   a.created_at.isoformat() if a.created_at else None,
            "updated_at":   a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in articles
    ]

@app.get("/api/articles/{article_id}")
def get_article(article_id: int, db: Session = Depends(get_db)):
    a = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": a.id, "author_email": a.author_email, "author_name": a.author_name,
        "title": a.title, "content": a.content, "category": a.category,
        "tags": a.tags, "published": a.published,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }

@app.post("/api/articles", status_code=201)
def create_article(req: ArticleCreateRequest, db: Session = Depends(get_db)):
    """Clinician creates a new article."""
    # Verify the author is a clinician
    user = db.query(models.User).filter(models.User.email == req.author_email).first()
    if not user or user.role != "clinician":
        raise HTTPException(status_code=403, detail="Only clinicians can publish articles")
    article = models.Article(
        author_email = req.author_email,
        author_name  = req.author_name,
        title        = req.title,
        content      = req.content,
        category     = req.category,
        tags         = req.tags,
        published    = req.published,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return {"status": "created", "id": article.id}

@app.put("/api/articles/{article_id}")
def update_article(article_id: int, req: ArticleUpdateRequest, author_email: str, db: Session = Depends(get_db)):
    """Clinician updates their article."""
    article = db.query(models.Article).filter(
        models.Article.id == article_id,
        models.Article.author_email == author_email
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if req.title is not None:     article.title = req.title
    if req.content is not None:   article.content = req.content
    if req.category is not None:  article.category = req.category
    if req.tags is not None:      article.tags = req.tags
    if req.published is not None: article.published = req.published
    article.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated"}

@app.delete("/api/articles/{article_id}")
def delete_article(article_id: int, author_email: str, db: Session = Depends(get_db)):
    """Clinician deletes their article."""
    article = db.query(models.Article).filter(
        models.Article.id == article_id,
        models.Article.author_email == author_email
    ).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return {"status": "deleted"}


# ── Admin Analytics ───────────────────────────────────────────────────────────
@app.get("/api/analytics")
def get_analytics(period: str = "all", db: Session = Depends(get_db)):
    """Get analytics from all patient assessments."""
    try:
        # Fetch assessments based on period filter
        query = db.query(models.Assessment)
        
        if period == "today":
            from datetime import datetime, timedelta
            today = datetime.utcnow().date()
            query = query.filter(models.Assessment.created_at >= datetime.combine(today, datetime.min.time()))
        elif period == "week":
            from datetime import datetime, timedelta
            week_ago = datetime.utcnow() - timedelta(days=7)
            query = query.filter(models.Assessment.created_at >= week_ago)
        elif period == "month":
            from datetime import datetime, timedelta
            month_ago = datetime.utcnow() - timedelta(days=30)
            query = query.filter(models.Assessment.created_at >= month_ago)
        
        assessments = query.all()
        
        # Convert to dict format for analytics engine
        assessment_dicts = [
            {
                'user_email': a.user_email,
                'severity_score': a.severity_score,
                'severity_cat': a.severity_cat,
                'tissues': a.tissues or {},
                'indicators': a.indicators or [],
                'area': a.area,
                'perimeter': a.perimeter,
                'risk_level': a.risk_level if hasattr(a, 'risk_level') else 'Unknown',
            }
            for a in assessments
        ]
        
        # Generate analytics
        analytics = WoundAnalyticsEngine.analyze_patient_cohort(assessment_dicts)
        
        return analytics
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics generation failed: {str(e)}")
