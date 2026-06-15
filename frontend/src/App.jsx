import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WoundScanner from './components/WoundScanner';
import ResultsDashboard from './components/ResultsDashboard';
import AuthModal from './components/AuthModal';
import PatientDashboard from './components/PatientDashboard';
import ClinicianPortal from './components/ClinicianPortal';
import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { API_BASE_URL, safeLocalStorage } from './config';

// ── Inline Hero (no separate file needed) ────────────────────────────────────
function Hero({ onAuthClick }) {
  return (
    <section className="tg-hero" id="hero">
      <div className="hero-glow" />
      <div className="hero-content animate-fade-slide-up">
        <div className="hero-eyebrow">AI-Powered Wound Analysis</div>
        <h1 className="hero-headline">
          ToxiGlow
        </h1>
        <p className="hero-sub">
          Instant wound severity assessment using computer vision. Upload a photo, get a full clinical report in seconds.
        </p>
        <div className="hero-badges">
          <span>🔬 Tissue Classification</span>
          <span>📏 Wound Measurement</span>
          <span>⚡ Infection Detection</span>
          <span>📋 PDF Reports</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#assess" className="btn-cta">
            Start Assessment <span>→</span>
          </a>
          <button
            onClick={() => onAuthClick('signup')}
            style={{
              padding: '16px 32px',
              borderRadius: 999,
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Create Account
          </button>
        </div>
        <p className="hero-disclaimer">
          For educational and early-warning use only. Not a substitute for professional medical advice.
        </p>
      </div>
      <div className="hero-scroll-indicator">
        <div className="scroll-text">SCROLL</div>
        <div className="scroll-line"><div className="scroll-line-active" /></div>
      </div>
    </section>
  );
}

// ── Inline HowItWorks ─────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: '📸', title: 'Capture or Upload', desc: 'Take a photo with your camera or upload an existing image. Good lighting and focus give the best results.' },
    { icon: '🧠', title: 'AI Analysis', desc: 'Our computer vision engine segments tissue types, detects infection markers, and calculates severity in seconds.' },
    { icon: '📋', title: 'Get Your Report', desc: 'Receive a detailed assessment with severity score, tissue breakdown, and actionable care recommendations.' },
  ];
  return (
    <section className="tg-section section-how-it-works" id="how-it-works">
      <div className="tg-section-container">
        <div className="section-header">
          <div className="section-eyebrow-container">
            <div className="section-eyebrow-line" />
            <div className="section-eyebrow">HOW IT WORKS</div>
          </div>
          <h2 className="section-title">Three steps to <span className="text-display">clarity</span></h2>
        </div>
        <div className="how-grid">
          {steps.map((s, i) => (
            <div key={i} className="tg-glass-card how-card">
              <div className="how-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('idle');
  const [view, setView] = useState('home');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [results, setResults] = useState(null);
  const [priorAssessment, setPriorAssessment] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(safeLocalStorage.getItem('tg_session'));
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    safeLocalStorage.removeItem('tg_session');
    setUser(null);
    setView('home');
  };

  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timerId, setTimerId] = useState(null);
  const [activeStage, setActiveStage] = useState(0);
  const stages = [
    { pending: 'Detecting wound boundaries...', completed: '✓ Wound mapped' },
    { pending: 'Classifying tissue types...', completed: '✓ Tissue analyzed' },
    { pending: 'Checking infection indicators...', completed: '✓ Indicators checked' },
    { pending: 'Generating your assessment...', completed: '✓ Assessment ready' },
  ];

  useEffect(() => {
    let interval;
    if (phase === 'processing') {
      setActiveStage(0);
      setTimeoutActive(false);
      const tId = setTimeout(() => setTimeoutActive(true), 30000);
      setTimerId(tId);
      interval = setInterval(() => {
        setActiveStage(prev => {
          if (prev < stages.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 700);
    } else {
      if (timerId) clearTimeout(timerId);
    }
    return () => {
      clearInterval(interval);
      if (timerId) clearTimeout(timerId);
    };
  }, [phase]);

  const handleImageSelected = (file) => {
    setSelectedFile(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImageSrc(e.target.result);
      setPhase('confirmation');
      setTimeout(() => {
        document.getElementById('assess')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    reader.readAsDataURL(file);
  };

  const handleDemoTrigger = async () => {
    setPhase('processing');
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/demo`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Demo analysis failed');
      }
      const data = await response.json();
      setTimeout(async () => {
        setResults(data);
        setRawImageSrc(data.annotated_image);
        if (priorAssessment) await calculateComparison(priorAssessment, data);
        setPhase('results');
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }, 2800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Demo failed. Make sure the backend is running on port 8000.');
      setPhase('idle');
    }
  };

  const calculateComparison = async (prior, current) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prior, current }),
      });
      if (res.ok) setComparison(await res.json());
    } catch (err) {
      console.error('Comparison failed:', err);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedFile) return;
    setPhase('processing');
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }
      const data = await response.json();
      setTimeout(async () => {
        setResults(data);
        if (priorAssessment) await calculateComparison(priorAssessment, data);
        setPhase('results');
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }, 2800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Analysis failed. Check image quality or backend connection.');
      setPhase('idle');
    }
  };

  const handleRetake = () => {
    setSelectedFile(null);
    setRawImageSrc(null);
    setResults(null);
    setPhase('idle');
    setError('');
  };

  const handleNewAssessment = () => {
    if (results) setPriorAssessment(results);
    setSelectedFile(null);
    setRawImageSrc(null);
    setResults(null);
    setComparison(null);
    setPhase('idle');
    setError('');
  };

  const handleSaveAssessment = async (res) => {
    if (!user?.email) return;
    try {
      await fetch(`${API_BASE_URL}/api/assessments/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          area: res.area,
          perimeter: res.perimeter,
          tissues: res.tissues,
          indicators: res.indicators || [],
          severity_score: res.severity_score,
          severity_cat: res.severity_cat,
          narrative: res.narrative,
          recommendation: res.recommendation,
          risk_level: res.risk_level || 'Unknown',
          annotated_image: res.annotated_image || null,
        }),
      });
    } catch { /* backend offline — silently skip */ }
  };

  return (
    <ErrorBoundary>
      <div>
        <Navbar
          user={user}
          onLogout={handleLogout}
          onAuthClick={(tab) => { setAuthModalOpen(true); setAuthInitialTab(tab); }}
          onViewChange={setView}
          currentView={view}
        />

        {/* ── Patient Dashboard ── */}
        {view === 'patient-dashboard' && user && (
          <PatientDashboard user={user} onBack={() => setView('home')} />
        )}

        {/* ── Clinician Portal ── */}
        {view === 'clinician-portal' && user?.role === 'clinician' && (
          <ClinicianPortal user={user} onBack={() => setView('home')} />
        )}

        {/* ── Admin Analytics ── */}
        {view === 'admin-dashboard' && user?.role === 'admin' && (
          <AdminDashboard user={user} onBack={() => setView('home')} />
        )}

        {/* ── Home View ── */}
        {view === 'home' && (
          <>
            <Hero onAuthClick={(tab) => { setAuthModalOpen(true); setAuthInitialTab(tab); }} />

            {phase === 'idle' && (
              <WoundScanner
                onImageSelected={handleImageSelected}
                onDemoTrigger={handleDemoTrigger}
                error={error}
                setError={setError}
              />
            )}

            {phase === 'confirmation' && (
              <section className="tg-section section-confirmation animate-fade-slide-up" id="assess">
                <div className="tg-section-container">
                  <div className="tg-glass-card tg-confirm-card">
                    <h3 className="section-title" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '24px' }}>
                      Confirm Photo Alignment
                    </h3>
                    <div style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
                      <img src={rawImageSrc} alt="Preview capture" className="tg-confirm-image" />
                    </div>
                    <div className="confirm-buttons">
                      <button className="tg-button tg-button-primary" onClick={triggerAnalysis}>
                        🔬 ANALYZE WOUND
                      </button>
                      <button className="tg-button tg-button-secondary" onClick={handleRetake}>
                        ↩️ Retake
                      </button>
                    </div>
                    <p className="confirm-copy">Analysis is instant and stays on your device.</p>
                  </div>
                </div>
              </section>
            )}

            {phase === 'processing' && (
              <section className="tg-section section-confirmation animate-fade-slide-up" id="assess">
                <div className="tg-section-container">
                  {timeoutActive ? (
                    <div className="tg-glass-card tg-scanner-container">
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                      <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
                        Taking longer than expected...
                      </h3>
                      <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px', fontSize: '0.9rem' }}>
                        Processing exceeded 30 seconds. Please check image focus and lighting, or try again.
                      </p>
                      <button className="tg-button tg-button-primary" onClick={handleRetake}>
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="tg-glass-card tg-scanner-container">
                      <div className="tg-scanner-circles">
                        <div className="tg-scanner-circle" />
                        <div className="tg-scanner-circle" />
                        <div className="tg-scanner-circle" />
                        <span className="tg-scanner-icon">🩹</span>
                      </div>
                      <h3 className="section-title" style={{ fontSize: '1.15rem', marginTop: '16px', marginBottom: '24px' }}>
                        Analyzing your wound...
                      </h3>
                      <div className="tg-stage-list">
                        {stages.map((stage, i) => {
                          const isCompleted = activeStage > i;
                          const isActive = activeStage === i;
                          let statusClass = 'pending';
                          if (isCompleted) statusClass = 'completed';
                          else if (isActive) statusClass = 'active';
                          return (
                            <div key={i} className={`tg-stage-item ${statusClass}`}>
                              <span className="tg-stage-check" style={{ marginRight: '8px' }}>
                                {isCompleted ? '✓' : isActive ? '⚡' : '⚪'}
                              </span>
                              <span>{isCompleted ? stage.completed : stage.pending}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {phase === 'results' && results && (
              <ResultsDashboard
                results={results}
                rawImageSrc={rawImageSrc}
                comparison={comparison}
                onNewAssessment={handleNewAssessment}
                onSaveAssessment={handleSaveAssessment}
                user={user}
              />
            )}

            <HowItWorks />
            <Footer />
          </>
        )}

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialTab={authInitialTab}
          onAuthSuccess={() => {
            try {
              setUser(JSON.parse(safeLocalStorage.getItem('tg_session')));
            } catch { /* ignore */ }
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
