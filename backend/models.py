from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """Registered users — both patients and clinicians."""
    __tablename__ = "users"

    email      = Column(String, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role       = Column(String, default="patient")   # "patient" | "clinician"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Assessment(Base):
    """Wound assessment records saved by patients."""
    __tablename__ = "assessments"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_email     = Column(String, index=True, nullable=False)
    area           = Column(Float)
    perimeter      = Column(Float)
    tissues        = Column(JSON)      # {"Granulation": 45.2, ...}
    indicators     = Column(JSON)      # ["Erythema detected", ...]
    severity_score = Column(Integer)
    severity_cat   = Column(String)
    narrative      = Column(Text)
    recommendation = Column(JSON)      # {"text": "...", "tier": "...", "color": "..."}
    risk_level     = Column(String)
    annotated_image= Column(Text)      # base64 data-uri (optional)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class Article(Base):
    """Knowledge-base articles written by clinicians."""
    __tablename__ = "articles"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    author_email = Column(String, index=True)
    author_name  = Column(String)
    title        = Column(String, nullable=False)
    content      = Column(Text, nullable=False)
    category     = Column(String, default="blog")  # tips | blog | research | guide | case-study
    tags         = Column(String, default="")       # comma-separated
    published    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
