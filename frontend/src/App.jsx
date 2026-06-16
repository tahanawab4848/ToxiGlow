import { useState, useEffect, useRef } from 'react';
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

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Floating particles background ────────────────────────────────────────────
function ParticleField() {
  const [particles] = useState(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 12 + 10,
    opacity: Math.random() * 0.4 + 0.1,
  })));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(0, 210, 255, ${p.opacity})`,
            left: `${p.x}%`,
            bottom: '-10px',
            animation: `particleRise ${p.duration}s ${p.delay}s ease-in infinite`,
            boxShadow: `0 0 ${p.size * 2}px rgba(0,210,255,0.5)`,
          }}
        />
      ))}
    </div>
  );
}

// ── Typing animation ──────────────────────────────────────────────────────────
function TypingText({ words, speed = 80, pause = 2000 }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timer;
    if (!deleting && charIdx < word.length) {
      timer = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === word.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      timer = setTimeout(() => {
        setDeleting(false);
        setWordIdx(i => (i + 1) % words.length);
      }, speed / 2);
    }
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  const displayed = words[wordIdx].slice(0, charIdx);

  return (
    <span>
      {displayed}
      <span style={{ borderRight: '2px solid #00d2ff', marginLeft: 2, animation: 'cursorBlink 0.8s step-end infinite' }} />
    </span>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const [ref, visible] = useScrollReveal(0.2);
  const stats = [
    { value: 97, suffix: '%', label: 'Accuracy' },
    { value: 4,  suffix: 's', label: 'Analysis Time' },
    { value: 7,  suffix: '',  label: 'Tissue Types' },
    { value: 3,  suffix: '',  label: 'Severity Levels' },
  ];
  return (
    <div ref={ref} style={{
      display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center',
      margin: '48px 0 0', width: '100%',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: '1 1 120px', textAlign: 'center', padding: '20px 16px',
          borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d2ff', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {visible ? <AnimatedCounter target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onAuthClick }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <section className="tg-hero" id="hero" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)',
        top: '10%', left: '50%', transform: 'translateX(-50%)',
        animation: 'orbPulse 6s ease-in-out infinite', pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100,0,255,0.06) 0%, transparent 70%)',
        top: '30%', left: '15%',
        animation: 'orbPulse 8s ease-in-out 2s infinite', pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)',
        top: '20%', right: '10%',
        animation: 'orbPulse 7s ease-in-out 1s infinite', pointerEvents: 'none', zIndex: 1,
      }} />

      <ParticleField />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="hero-content" style={{
        position: 'relative', zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 999,
          border: '1px solid rgba(0,210,255,0.25)',
          background: 'rgba(0,210,255,0.06)',
          fontSize: '0.7rem', fontWeight: 700,
          color: '#00d2ff', letterSpacing: '0.2em', textTransform: 'uppercase',
          marginBottom: 28,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d2ff', animation: 'pulse-dot 1.5s infinite', display: 'inline-block' }} />
          AI-Powered Clinical Wound Analysis
        </div>

        <h1 className="hero-headline" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
        }}>
          <span style={{ color: 'white' }}>Toxi</span>
          <span style={{ color: '#00d2ff', textShadow: '0 0 40px rgba(0,210,255,0.4)' }}>Glow</span>
        </h1>

        <p className="hero-sub" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease 0.35s, transform 0.8s ease 0.35s',
        }}>
          <TypingText words={[
            'Instant wound severity scoring.',
            'Tissue classification in seconds.',
            'Infection detection, powered by AI.',
            'Clinical-grade PDF reports.',
          ]} />
        </p>

        {/* Feature badges */}
        <div className="hero-badges" style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s ease 0.45s, transform 0.8s ease 0.45s',
        }}>
          {['🔬 Tissue Classification','📏 Wound Measurement','⚡ Infection Detection','📋 PDF Reports'].map((b, i) => (
            <span key={i} style={{
              padding: '8px 16px', borderRadius: 999,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.75rem', fontWeight: 600,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,210,255,0.25)'; e.currentTarget.style.color = '#00d2ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
            >
              {b}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.8s ease 0.55s, transform 0.8s ease 0.55s',
        }}>
          <button className="btn-cta" style={{ 
            position: 'relative', overflow: 'hidden',
            border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 36px', borderRadius: 999,
            background: 'white', color: 'black',
            fontWeight: 600, fontSize: '0.95rem',
            boxShadow: '0 8px 24px rgba(255, 255, 255, 0.15)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
          }}
          onClick={() => {
            if (typeof document !== 'undefined') {
              const assessEl = document.getElementById('assess');
              if (assessEl) {
                assessEl.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}>
            <span style={{ position: 'relative', zIndex: 1 }}>Start Assessment</span>
            <span style={{ position: 'relative', zIndex: 1, marginLeft: 6, transition: 'transform 0.2s ease' }}>→</span>
            <div style={{
              position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,210,255,0.15) 0%, transparent 60%)',
              opacity: 0, transition: 'opacity 0.3s',
            }} className="btn-cta-shine" />
          </button>
          <button
            onClick={() => onAuthClick('signup')}
            style={{
              padding: '16px 32px', borderRadius: 999,
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
              transition: 'all 0.25s ease', background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Create Account
          </button>
        </div>

        <StatsBar />

        <p className="hero-disclaimer" style={{ opacity: mounted ? 0.6 : 0, transition: 'opacity 0.8s ease 0.7s' }}>
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

// ── HowItWorks ────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: '📸', title: 'Capture or Upload', desc: 'Take a photo with your camera or upload an existing image. Good lighting and focus give the best results.', color: '#00d2ff' },
    { icon: '🧠', title: 'AI Analysis', desc: 'Our computer vision engine segments tissue types, detects infection markers, and calculates severity in seconds.', color: '#a855f7' },
    { icon: '📋', title: 'Get Your Report', desc: 'Receive a detailed assessment with severity score, tissue breakdown, and actionable care recommendations.', color: '#00e676' },
  ];
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section className="tg-section section-how-it-works" id="how-it-works" ref={ref}>
      <div className="tg-section-container">
        <div className="section-header" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div className="section-eyebrow-container">
            <div className="section-eyebrow-line" />
            <div className="section-eyebrow">HOW IT WORKS</div>
          </div>
          <h2 className="section-title">Three steps to <span className="text-display">clarity</span></h2>
        </div>
        <div className="how-grid">
          {steps.map((s, i) => (
            <div key={i} className="tg-glass-card how-card" style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(40px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.15}s, transform 0.6s ease ${0.1 + i * 0.15}s`,
              borderTop: `2px solid ${s.color}22`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.5), 0 0 30px ${s.color}15`; e.currentTarget.style.borderTopColor = s.color + '55'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = visible ? 'translateY(0)' : 'translateY(40px)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderTopColor = s.color + '22'; }}
            >
              <div className="how-icon" style={{ filter: `drop-shadow(0 0 12px ${s.color}55)` }}>{s.icon}</div>
              <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, background: s.color + '15', border: `1px solid ${s.color}30`, fontSize: '0.65rem', fontWeight: 700, color: s.color, marginBottom: 10, letterSpacing: '0.1em' }}>
                STEP {i + 1}
              </div>
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
  const [activeStage, setActiveStage] = useState(0);
  const stages = [
    { pending: 'Detecting wound boundaries...', completed: '✓ Wound mapped' },
    { pending: 'Classifying tissue types...', completed: '✓ Tissue analyzed' },
    { pending: 'Checking infection indicators...', completed: '✓ Indicators checked' },
    { pending: 'Generating your assessment...', completed: '✓ Assessment ready' },
  ];

  useEffect(() => {
    let interval;
    let localTimerId;
    if (phase === 'processing') {
      localTimerId = setTimeout(() => setTimeoutActive(true), 30000);
      interval = setInterval(() => {
        setActiveStage(prev => {
          if (prev < stages.length - 1) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 700);
    }
    return () => {
      clearInterval(interval);
      if (localTimerId) clearTimeout(localTimerId);
    };
  }, [phase, stages.length]);

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
    setActiveStage(0);
    setTimeoutActive(false);
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
    setActiveStage(0);
    setTimeoutActive(false);
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
