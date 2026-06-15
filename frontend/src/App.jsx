import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WoundScanner from './components/WoundScanner';
import ResultsDashboard from './components/ResultsDashboard';
import AuthModal from './components/AuthModal';
import PatientDashboard from './components/PatientDashboard';
import ClinicianPortal from './components/ClinicianPortal';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { API_BASE_URL, safeLocalStorage } from './config';

export default function App() {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'confirmation' | 'processing' | 'results'
  const [view, setView] = useState('home');  // 'home' | 'patient-dashboard' | 'clinician-portal' | 'knowledge-hub'
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
    }
    catch { 
      return null; 
    }
  });

  const handleLogout = () => {
    safeLocalStorage.removeItem('tg_session');
    setUser(null);
    setView('home');
  };
  
  // Timeout tracking
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timerId, setTimerId] = useState(null);

  // Processing sequential progress stages
  const [activeStage, setActiveStage] = useState(0);
  const stages = [
    { pending: 'Detecting wound boundaries...', completed: '✓ Wound mapped' },
    { pending: 'Classifying tissue types...', completed: '✓ Tissue analyzed' },
    { pending: 'Checking infection indicators...', completed: '✓ Indicators checked' },
    { pending: 'Generating your assessment...', completed: '✓ Assessment ready' }
  ];

  // Animate stages during processing
  useEffect(() => {
    let interval;
    if (phase === 'processing') {
      setActiveStage(0);
      setTimeoutActive(false);

      // Start a 30s backup timer for edge cases/timeouts
      const tId = setTimeout(() => {
        setTimeoutActive(true);
      }, 30000);
      setTimerId(tId);

      interval = setInterval(() => {
        setActiveStage(prev => {
          if (prev < stages.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 700);
    } else {
      if (timerId) {
        clearTimeout(timerId);
      }
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

        if (priorAssessment) {
          await calculateComparison(priorAssessment, data);
        }

        setPhase('results');
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }, 2800);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Demo failed. Make sure the backend API is running on port 8000.');
      setPhase('idle');
    }
  };

  const calculateComparison = async (prior, current) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prior, current }),
      });
      if (res.ok) {
        const compData = await res.json();
        setComparison(compData);
      }
    } catch (err) {
      console.error('Comparison calculation failed:', err);
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

        if (priorAssessment) {
          await calculateComparison(priorAssessment, data);
        }

        setPhase('results');
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }, 2800);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Wound analysis failed. Check image illumination, focus, or connection to backend.');
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
    if (results) {
      setPriorAssessment(results);
    }
    setSelectedFile(null);
    setRawImageSrc(null);
    setResults(null);
    setComparison(null);
    setPhase('idle');
    setError('');
  };

  // ── Save assessment to DB when results come in ────────────────────────────────────────────
  const handleSaveAssessment = async (res) => {
    if (!user?.email) return;  // only save if logged in
    try {
      await fetch(`${API_BASE_URL}/api/assessments/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email:     user.email,
          area:           res.area,
          perimeter:      res.perimeter,
          tissues:        res.tissues,
          indicators:     res.indicators || [],
          severity_score: res.severity_score,
          severity_cat:   res.severity_cat,
          narrative:      res.narrative,
          recommendation: res.recommendation,
          risk_level:     res.risk_level || 'Unknown',
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

      {/* ── View: Patient Dashboard ── */}
      {view === 'patient-dashboard' && user && (
        <PatientDashboard user={user} onBack={() => setView('home')} />
      )}

      {/* ── View: Clinician Portal ── */}
      {view === 'clinician-portal' && user?.role === 'clinician' && (
        <ClinicianPortal user={user} onBack={() => setView('home')} />
      )}

      {/* ── View: Knowledge Hub ── */}
      {view === 'knowledge-hub' && (
        <KnowledgeHub onBack={() => setView('home')} />
      )}

      {/* ── View: Home ── */}
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
                    <button className="tg-button tg-button-primary" onClick={triggerAnalysis}>🔬 ANALYZE WOUND</button>
                    <button className="tg-button tg-button-secondary" onClick={handleRetake}>↩️ Retake</button>
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
                    <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Taking longer than expected...</h3>
                    <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px', fontSize: '0.9rem' }}>
                      The image processing pipeline took longer than 30 seconds. Please check your image focus and lighting, or try again.
                    </p>
                    <button className="tg-button tg-button-primary" onClick={handleRetake}>Try Again</button>
                  </div>
                ) : (
                  <div className="tg-glass-card tg-scanner-container">
                    <div className="tg-scanner-circles">
                      <div className="tg-scanner-circle"></div>
                      <div className="tg-scanner-circle"></div>
                      <div className="tg-scanner-circle"></div>
                      <span className="tg-scanner-icon">🩹</span>
                    </div>
                    <h3 className="section-title" style={{ fontSize: '1.15rem', marginTop: '16px', marginBottom: '24px' }}>Analyzing your wound...</h3>
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
        onAuthSuccess={() => setUser(JSON.parse(safeLocalStorage.getItem('tg_session')))}
      />

      {/* Global chatbot — always visible on home view */}
      {view === 'home' && (
        <ChatBot
          assessmentContext={results ? {
            severity_score: results.severity_score,
            severity_cat: results.severity_cat,
            area: results.area,
            risk_level: results.risk_level,
            tissues: results.tissues,
          } : null}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
