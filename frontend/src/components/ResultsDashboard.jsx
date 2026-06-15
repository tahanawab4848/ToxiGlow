import React, { useState, useEffect } from 'react';
import SeverityGauge from './SeverityGauge';
import TissueChart from './TissueChart';
import { API_BASE_URL } from '../config';

export default function ResultsDashboard({ results, rawImageSrc, comparison, onNewAssessment }) {
  const [sliderVal, setSliderVal] = useState(50);
  const [explainMode, setExplainMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [compareOpen, setCompareOpen] = useState(true);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotated_image: results.annotated_image,
          area: results.area,
          perimeter: results.perimeter,
          tissues: results.tissues,
          indicators: results.indicators,
          severity_score: results.severity_score,
          severity_cat: results.severity_cat,
          narrative: results.narrative,
          recommendation: results.recommendation
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'toxiglow-wound-assessment.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not download PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  // Terminology Translator dictionary for "Explain This to Me" Mode
  const explain = (term, defaultText) => {
    if (!explainMode) return defaultText;
    const dictionary = {
      'granulation': 'New, healthy pink tissue — like a scab forming from the inside',
      'necrosis': 'Dead tissue that the body can\'t use anymore',
      'erythema': 'Redness spreading outward — your body\'s alarm signal',
      'exudate': 'Fluid the wound is releasing',
      'slough': 'Yellow/white waste material that needs cleaning',
      'epithelial': 'New skin cells closing the surface',
      'macerated': 'Soggy skin around the wound edge, like being in the bath too long'
    };

    const termKey = Object.keys(dictionary).find(key => term.toLowerCase().includes(key));
    return termKey ? dictionary[termKey] : defaultText;
  };

  // Determine infection risk icon and text
  const getInfectionRisk = () => {
    const risk = results.risk_level;
    if (risk === 'Low') return { icon: '🛡️', color: 'hsl(var(--severity-green))', label: 'Low Risk' };
    if (risk === 'Moderate') return { icon: '⚠️', color: 'hsl(var(--severity-yellow))', label: 'Moderate Risk' };
    if (risk === 'High') return { icon: '🟠', color: 'hsl(var(--severity-orange))', label: 'High Risk' };
    return { icon: '🔴', color: 'hsl(var(--severity-red))', label: 'Critical Risk' };
  };

  const riskInfo = getInfectionRisk();

  // Dynamic flags for infection indicators checklist
  const hasErythema = results.indicators.some(i => i.toLowerCase().includes('erythema') || i.toLowerCase().includes('redness'));
  const hasExudate = results.indicators.some(i => i.toLowerCase().includes('exudate') || i.toLowerCase().includes('fluid') || i.toLowerCase().includes('discharge'));
  const hasNecrosis = results.tissues.Necrosis > 0;
  const hasEdgeConcerns = results.indicators.some(i => i.toLowerCase().includes('edge') || i.toLowerCase().includes('margin') || i.toLowerCase().includes('macerated'));

  // Get emergency contact number based on browser locale
  const getEmergencyNumber = () => {
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language || '';
      if (lang.startsWith('en-US') || lang.startsWith('en-CA')) return '911';
      if (lang.startsWith('en-GB') || lang.startsWith('en-IE')) return '999';
      if (lang.startsWith('en-AU')) return '000';
    }
    return '112'; // Global standard
  };
  const emergencyNum = getEmergencyNumber();

  // Get action recommendation details based on score
  const getRecommendation = () => {
    const score = results.severity_score;
    if (score <= 30) {
      return {
        bg: 'alert-mild tg-card-mild',
        icon: '✅',
        title: 'Continue Monitoring — Healing as Expected',
        text: 'The wound shows healthy granulation tissue and minimal signs of irritation. Keep the dressing clean and dry, and review the wound bed in 3 days.'
      };
    } else if (score <= 60) {
      return {
        bg: 'alert-moderate tg-card-moderate',
        icon: '⚠️',
        title: 'Schedule a Clinical Review — Moderate Concern',
        text: 'Moderate slough buildup or localized redness is present. Consider scheduling a routine checkup with a primary care nurse within 48-72 hours.'
      };
    } else if (score <= 80) {
      return {
        bg: 'alert-severe tg-card-severe',
        icon: '🟠',
        title: 'Seek Medical Attention Within 24 Hours',
        text: 'Significant necrosis or signs of infection spreading are visible. Please consult a clinician or visit a wound care clinic by tomorrow.'
      };
    } else {
      return {
        bg: 'alert-critical tg-card-critical',
        icon: '🔴',
        title: 'URGENT — Seek Emergency Care Immediately',
        text: 'Critical telemetry markers detected (high fever risk, deep necrosis, spreading heat). Seek immediate professional clinical care or go to an urgent care department.'
      };
    }
  };

  const recommendation = getRecommendation();
  const isWoundDetected = results.area > 0 || results.tissues.Granulation > 0;

  // ── Healing history (real localStorage) ─────────────────────────────────────
  const [healHistory, setHealHistory] = useState([]);

  useEffect(() => {
    const HIST_KEY = 'tg_history';
    const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    const dotColor = results.severity_score <= 30 ? '#4caf50'
      : results.severity_score <= 60 ? '#ffc107'
      : results.severity_score <= 80 ? '#ff9800'
      : '#f44336';
    const label = results.severity_score <= 30 ? 'Improving'
      : results.severity_score <= 60 ? 'Stable'
      : results.severity_score <= 80 ? 'Worsening'
      : 'Critical';

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { hist = []; }

    // Update today's entry (replace if same date)
    const existingIdx = hist.findIndex(h => h.day === today);
    const entry = { day: today, dot: dotColor, label };
    if (existingIdx >= 0) hist[existingIdx] = entry;
    else hist.push(entry);

    // Keep last 8 entries
    if (hist.length > 8) hist = hist.slice(-8);
    localStorage.setItem(HIST_KEY, JSON.stringify(hist));
    setHealHistory(hist);
  }, [results]);

  // Mark the last entry as "Current"
  const displayHistory = healHistory.map((h, i) =>
    i === healHistory.length - 1 ? { ...h, dot: '#00d2ff', label: 'Current' } : h
  );

  return (
    <section className="tg-section section-results animate-fade-slide-up" id="results">
      <div className="tg-section-container">
        
        <div className="section-header">
          <div className="section-eyebrow-container">
            <div className="section-eyebrow-line"></div>
            <div className="section-eyebrow">RESULTS</div>
          </div>
          <h2 className="section-title">Wound Assessment Dashboard</h2>

          {/* Explain Mode Toggle Pill */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => setExplainMode(!explainMode)}
              className="liquid-glass rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition-all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${explainMode ? '#00d2ff' : 'rgba(255,255,255,0.1)'}`,
                color: explainMode ? '#00d2ff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <span>🔬</span>
              Simple analogies mode: {explainMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 1. Before/After Draggable Wipe Slider */}
        <div className="tg-glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', marginBottom: '32px' }}>
          
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--stroke))' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>
              ⬅️ Drag image to swipe between Raw Photo and Annotated Map ➡️
            </span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Raw</span>
              <span style={{ color: '#00d2ff' }}>Annotated ({sliderVal}%)</span>
            </div>
          </div>

          {/* Draggable Slider Container */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxHeight: '500px', 
              aspectRatio: '4/3', 
              background: 'rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Base layer (Raw Image) */}
            <img 
              src={rawImageSrc} 
              alt="Raw Wound" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />

            {/* Wipe layer (Annotated Image) */}
            <img 
              src={results.annotated_image} 
              alt="Annotated Wound" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                clipPath: `inset(0 ${100 - sliderVal}% 0 0)`
              }}
            />

            {/* Draggable Slider Divider line */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderVal}%`,
                width: '2px',
                backgroundColor: '#00d2ff',
                boxShadow: '0 0 10px #00d2ff',
                zIndex: 15,
                pointerEvents: 'none'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#00d2ff',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'black',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                ↔
              </div>
            </div>

            {/* Slider input handle overlaid invisibly */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderVal} 
              onChange={(e) => setSliderVal(Number(e.target.value))} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              style={{ margin: 0, padding: 0 }}
            />

            {/* Calibration Reference bar */}
            {results.reference_detected && (
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  left: '16px', 
                  background: 'rgba(0,0,0,0.7)', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  fontFamily: 'monospace', 
                  padding: '6px 12px', 
                  borderRadius: '4px',
                  fontWeight: 600,
                  zIndex: 10
                }}
              >
                ├── 1 cm ──┤
              </div>
            )}
          </div>
        </div>

        {/* 2. Metric Columns */}
        <div className="tg-result-grid">
          
          {/* Severity score circular gauge */}
          <div className="tg-glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '16px' }}>
              Severity Index
            </div>
            <SeverityGauge score={results.severity_score} category={results.severity_cat} />
          </div>

          {/* Infection indicators checklist */}
          <div className="tg-glass-card" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '16px' }}>
              Infection Risk
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem' }}>{riskInfo.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: riskInfo.color }}>{riskInfo.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Early Warning Markers</div>
              </div>
            </div>

            <div className="tg-indicator-list">
              <div className="tg-indicator-row">
                <span>{hasErythema ? '⚠️' : '✓'}</span>
                <span>
                  {explain('erythema', hasErythema ? 'Erythema: spreading redness (>2cm)' : 'Erythema: no spreading redness')}
                </span>
              </div>
              <div className="tg-indicator-row">
                <span>{hasExudate ? '⚠️' : '✓'}</span>
                <span>
                  {explain('exudate', hasExudate ? 'Exudate: fluid discharge concerns' : 'Exudate: minimal serous/clear fluid')}
                </span>
              </div>
              <div className="tg-indicator-row">
                <span>{hasNecrosis ? '⚠️' : '✓'}</span>
                <span>
                  {explain('necrosis', hasNecrosis ? `Tissue: necrotic bed detected (${results.tissues.Necrosis.toFixed(0)}%)` : 'Tissue: healthy granulation bed')}
                </span>
              </div>
              <div className="tg-indicator-row">
                <span>{hasEdgeConcerns ? '⚠️' : '✓'}</span>
                <span>
                  {explain('macerated', hasEdgeConcerns ? 'Wound Edge: uneven or macerated' : 'Wound Edge: well-defined flat edges')}
                </span>
              </div>
            </div>
          </div>

          {/* Tissue composition */}
          <div className="tg-glass-card">
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '16px' }}>
              Tissue Breakdown
            </div>
            <TissueChart tissues={results.tissues} />
            {explainMode && (
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '12px', textAlign: 'left', lineHeight: '1.4' }}>
                💡 <strong>Plain-English Guide:</strong><br />
                • Granulation: {explain('granulation', 'new, healthy red tissue forming inside')}<br />
                • Necrosis: {explain('necrosis', 'dead tissue the body cannot use')}<br />
                • Slough: {explain('slough', 'yellowish waste material that needs cleaning')}
              </div>
            )}
          </div>

        </div>

        {/* 3. Healing Streak / Calendar View */}
        <div className="tg-glass-card" style={{ marginBottom: '32px', textAlign: 'left' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            <div>
              <span className="tg-measurement-lbl" style={{ fontSize: '0.7rem' }}>Adherence Logging Calendar</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '4px' }}>
                12-Day Healing Tracking Streak 🔥
              </h4>
            </div>
            <div style={{ background: '#00d2ff20', color: '#00d2ff', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              Streak Active
            </div>
          </div>
          
          <div className="flex justify-between" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(displayHistory.length, 1)}, 1fr)`, gap: '8px', textAlign: 'center' }}>
            {displayHistory.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' }}>
                Complete your first assessment to start tracking.
              </div>
            ) : displayHistory.map((item, index) => (
              <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{item.day}</div>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: item.dot, margin: '0 auto 8px', boxShadow: `0 0 8px ${item.dot}` }} />
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="tg-glass-card" style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'hsl(var(--text-muted))', fontWeight: 700, marginBottom: '12px' }}>
            Physical Measurements
          </div>
          
          <div className="tg-measurements-row">
            <div className="tg-measurement-card">
              <div className="tg-measurement-val">{results.area} cm²</div>
              <div className="tg-measurement-lbl">Estimated Area</div>
            </div>
            <div className="tg-measurement-card">
              <div className="tg-measurement-val">{results.perimeter} cm</div>
              <div className="tg-measurement-lbl">Wound Perimeter</div>
            </div>
            <div className="tg-measurement-card">
              <div className="tg-measurement-val">{(results.perimeter / Math.PI).toFixed(1)} cm</div>
              <div className="tg-measurement-lbl">Max Diameter</div>
            </div>
          </div>
        </div>

        {/* 4. Dynamic Narrative Assessment */}
        <div className="tg-glass-card" style={{ borderLeft: '4px solid #00d2ff', paddingLeft: '24px', textAlign: 'left', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
            📋 Assessment Summary
          </h3>
          <p style={{ lineHeight: '1.7', color: 'white', fontSize: '0.98rem' }}>
            {explainMode 
              ? results.narrative
                  .replace(/granulation tissue/gi, 'healthy pink healing tissue')
                  .replace(/necrosis/gi, 'dead tissue')
                  .replace(/erythema/gi, 'spreading redness')
                  .replace(/exudate/gi, 'discharge fluid')
              : results.narrative
            }
          </p>
        </div>

        {/* 5. Emergency contact card & Action Recommendation */}
        <div className={`tg-glass-card ${recommendation.bg}`} style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div className="flex justify-between items-start" style={{ flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{recommendation.icon}</span> {recommendation.title}
              </h3>
              <p style={{ lineHeight: '1.6', color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
                {recommendation.text}
              </p>
            </div>

            {/* Emergency trigger for Critical / Severe category */}
            {(results.severity_score > 60) && (
              <div 
                className="w-full p-6 rounded-2xl" 
                style={{ 
                  background: 'rgba(244, 67, 54, 0.08)', 
                  border: '1px solid rgba(244, 67, 54, 0.25)', 
                  marginTop: '8px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ff8a80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🚨 Emergency Care Routing (Locale: {emergencyNum === '911' ? 'US/CA' : emergencyNum === '999' ? 'UK' : 'Global'})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  This wound requires urgent assessment to prevent complications. Click below to dial your local healthcare line.
                </div>
                <a 
                  href={`tel:${emergencyNum}`}
                  className="tg-button font-bold text-center"
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '14px',
                    boxShadow: '0 0 16px rgba(244, 67, 54, 0.4)'
                  }}
                >
                  📞 CALL LOCAL EMERGENCY ASSISTANCE ({emergencyNum})
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 6. Comparison collapsible card */}
        {comparison && (
          <div className="tg-glass-card tg-comparison-card" style={{ marginBottom: '32px' }}>
            <div className="tg-comparison-header" onClick={() => setCompareOpen(!compareOpen)}>
              <span>📅 Compare with Previous Assessment</span>
              <span>{compareOpen ? '▲' : '▼'}</span>
            </div>
            
            {compareOpen && (
              <div className="tg-comparison-content animate-fade-slide-up">
                <div className="tg-measurement-card" style={{ borderRight: 'none', background: 'hsl(var(--surface-alt))', borderRadius: '12px' }}>
                  <div className="tg-measurement-lbl">Area Delta</div>
                  <div className="tg-measurement-val" style={{ color: comparison.area_change_pct <= 0 ? 'hsl(var(--severity-green))' : 'hsl(var(--severity-red))', marginTop: '6px' }}>
                    {comparison.area_change_pct <= 0 ? '↓' : '↑'} {Math.abs(comparison.area_change_pct)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    ({comparison.area_change_cm2 > 0 ? '+' : ''}{comparison.area_change_cm2} cm²)
                  </div>
                </div>
                <div className="tg-measurement-card" style={{ borderRight: 'none', background: 'hsl(var(--surface-alt))', borderRadius: '12px' }}>
                  <div className="tg-measurement-lbl">Severity Delta</div>
                  <div className="tg-measurement-val" style={{
                    color: (results.severity_score - (comparison._prior_score ?? results.severity_score)) <= 0
                      ? 'hsl(var(--severity-green))' : 'hsl(var(--severity-red))',
                    marginTop: '6px'
                  }}>
                    {(() => {
                      const delta = results.severity_score - (comparison._prior_score ?? results.severity_score);
                      return `${delta > 0 ? '+' : ''}${delta} pts`;
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Score Change</div>
                </div>
                <div className="tg-measurement-card" style={{ borderRight: 'none', background: 'hsl(var(--surface-alt))', borderRadius: '12px' }}>
                  <div className="tg-measurement-lbl">Healing Trajectory</div>
                  <div className="tg-measurement-val" style={{ color: comparison.trajectory === 'ON TRACK' ? 'hsl(var(--severity-green))' : 'hsl(var(--severity-yellow))', marginTop: '6px' }}>
                    {comparison.trajectory}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Trajectory Trend</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons and disclaimer */}
        <div style={{ textAlign: 'center' }}>
          <div className="tg-action-panel">
            <button className="tg-button tg-button-primary" onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? 'Generating PDF...' : '📥 DOWNLOAD ASSESSMENT REPORT'}
            </button>
            <button className="tg-button tg-button-secondary" onClick={onNewAssessment}>
              🔄 NEW ASSESSMENT
            </button>
          </div>

          <p className="tg-footer-copy">
            * This tool provides early warning indicators. It is not a medical diagnosis. Always consult a healthcare provider.
          </p>
        </div>

      </div>
    </section>
  );
}
