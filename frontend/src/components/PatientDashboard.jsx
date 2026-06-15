import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const SEVERITY_COLOR = (s) =>
  s <= 30 ? '#4caf50' : s <= 60 ? '#ffc107' : s <= 80 ? '#ff9800' : '#f44336';

const SEVERITY_LABEL = (s) =>
  s <= 30 ? 'Mild' : s <= 60 ? 'Moderate' : s <= 80 ? 'Severe' : 'Critical';

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AssessmentCard({ record, onDelete, onView }) {
  const color = SEVERITY_COLOR(record.severity_score);
  const topTissue = record.tissues
    ? Object.entries(record.tissues).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div style={{
      background: 'hsl(220 20% 9%)',
      border: `1px solid hsl(220 15% 18%)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            {formatDate(record.created_at)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: color + '22', border: `1px solid ${color}44`,
              borderRadius: 999, padding: '2px 10px',
              fontSize: '0.72rem', fontWeight: 700, color
            }}>
              {SEVERITY_LABEL(record.severity_score)} — {record.severity_score}/100
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {record.risk_level} Risk
            </div>
          </div>
        </div>
        {/* Score ring */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: `3px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: `0 0 12px ${color}44`
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{record.severity_score}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Area</div>
          <div style={{ color: 'white', fontWeight: 600, marginTop: 2 }}>{record.area} cm²</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Perimeter</div>
          <div style={{ color: 'white', fontWeight: 600, marginTop: 2 }}>{record.perimeter} cm</div>
        </div>
        {topTissue && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dominant</div>
            <div style={{ color: '#00d2ff', fontWeight: 600, marginTop: 2 }}>{topTissue[0]} ({topTissue[1].toFixed(0)}%)</div>
          </div>
        )}
      </div>

      {/* Tissue mini-bars */}
      {record.tissues && (
        <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 4, overflow: 'hidden' }}>
          {Object.entries(record.tissues)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v], i) => {
              const tissueColors = { Granulation: '#4caf50', Slough: '#ffc107', Necrosis: '#f44336', Epithelial: '#00d2ff', Erythema: '#ff9800' };
              return (
                <div key={i} style={{ flex: v, background: tissueColors[k] || '#aaa', transition: 'flex 0.3s ease' }} title={`${k}: ${v.toFixed(0)}%`} />
              );
            })}
        </div>
      )}

      {/* Narrative preview */}
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {record.narrative}
      </p>

      {/* Annotated image thumbnail */}
      {record.annotated_image && (
        <img
          src={record.annotated_image}
          alt="Wound"
          style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}
        />
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => onView(record)}
          style={{
            flex: 1, padding: '8px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
            background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
            color: '#00d2ff', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,210,255,0.08)'}
        >
          View Details
        </button>
        <button
          onClick={() => onDelete(record.id)}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
            background: 'rgba(244,67,54,0.06)', border: '1px solid rgba(244,67,54,0.15)',
            color: '#ef5350', cursor: 'pointer', transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,67,54,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,67,54,0.06)'}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function DetailModal({ record, onClose }) {
  if (!record) return null;
  const color = SEVERITY_COLOR(record.severity_score);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'hsl(220 20% 9%)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, maxWidth: 680, width: '100%', maxHeight: '90vh',
        overflowY: 'auto', padding: '32px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,210,255,0.2) transparent'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{formatDate(record.created_at)}</div>
            <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem' }}>Assessment Report</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>

        {record.annotated_image && (
          <img src={record.annotated_image} alt="Wound" style={{ width: '100%', borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Severity', value: `${record.severity_score}/100`, sub: record.severity_cat },
            { label: 'Area', value: `${record.area} cm²` },
            { label: 'Infection Risk', value: record.risk_level, color: record.risk_level === 'High' ? '#ff9800' : record.risk_level === 'Moderate' ? '#ffc107' : '#4caf50' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: m.color || color }}>{m.value}</div>
              {m.sub && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(0,210,255,0.04)', borderLeft: '3px solid #00d2ff', borderRadius: '0 12px 12px 0', padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Clinical Narrative</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.88rem', margin: 0 }}>{record.narrative}</p>
        </div>

        {record.recommendation && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recommendation ({record.recommendation.tier})</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.85rem', margin: 0 }}>{record.recommendation.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientDashboard({ user, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/assessments/history?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => { setError('Could not load history. Is the backend running?'); setLoading(false); });
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment record?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/assessments/${id}?email=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const filtered = filterSeverity === 'all' ? history
    : history.filter(r => {
      if (filterSeverity === 'mild')     return r.severity_score <= 30;
      if (filterSeverity === 'moderate') return r.severity_score <= 60 && r.severity_score > 30;
      if (filterSeverity === 'severe')   return r.severity_score > 60;
      return true;
    });

  // Stats
  const avgScore = history.length ? Math.round(history.reduce((s, r) => s + r.severity_score, 0) / history.length) : 0;
  const trend = history.length >= 2 ? history[0].severity_score - history[1].severity_score : null;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 25% 6%)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </button>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>Patient Portal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', marginBottom: 8 }}>
            My Wound Records
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
            Logged in as <strong style={{ color: '#00d2ff' }}>{user?.name}</strong> · {history.length} assessment{history.length !== 1 ? 's' : ''} on file
          </p>
        </div>

        {/* Stats Strip */}
        {history.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {[
              { label: 'Total Sessions', value: history.length, icon: '📋' },
              { label: 'Avg Severity', value: `${avgScore}/100`, icon: '📊', color: SEVERITY_COLOR(avgScore) },
              { label: 'Recent Trend', value: trend === null ? '—' : trend < 0 ? `↓ ${Math.abs(trend)} pts` : trend > 0 ? `↑ ${trend} pts` : 'Stable', icon: trend < 0 ? '✅' : trend > 0 ? '⚠️' : '➡️', color: trend < 0 ? '#4caf50' : trend > 0 ? '#ff9800' : 'rgba(255,255,255,0.7)' }
            ].map((s, i) => (
              <div key={i} style={{ background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: s.color || 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Pills */}
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {[['all', 'All'], ['mild', 'Mild'], ['moderate', 'Moderate'], ['severe', 'Severe/Critical']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterSeverity(v)} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease',
                background: filterSeverity === v ? '#00d2ff' : 'rgba(255,255,255,0.04)',
                color: filterSeverity === v ? 'black' : 'rgba(255,255,255,0.55)',
                border: `1px solid ${filterSeverity === v ? '#00d2ff' : 'rgba(255,255,255,0.08)'}`,
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            Loading your records...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 12, padding: '20px 24px', color: '#ef5350', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🩹</div>
            <h3 style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontSize: '1.2rem' }}>No records yet</h3>
            <p style={{ fontSize: '0.9rem' }}>Run your first wound assessment and save it to start your history.</p>
            <button onClick={onBack} style={{ marginTop: 24, padding: '10px 28px', borderRadius: 999, background: '#00d2ff', color: 'black', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', border: 'none' }}>
              Start Assessment
            </button>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filtered.map(r => (
              <AssessmentCard key={r.id} record={r} onDelete={handleDelete} onView={setViewRecord} />
            ))}
          </div>
        )}
      </div>

      <DetailModal record={viewRecord} onClose={() => setViewRecord(null)} />
    </div>
  );
}
