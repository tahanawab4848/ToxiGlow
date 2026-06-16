import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export default function AdminDashboard({ user, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      setTimeout(() => setError('Unauthorized: Admin access required'), 0);
      return;
    }
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/analytics?period=${filter}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, filter]);

  if (!analytics) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(220 25% 6%)', paddingTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: 24 }}>
            ← Back
          </button>
          <div style={{ fontSize: '2rem', marginBottom: 16, color: 'rgba(255,255,255,0.3)' }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>{loading ? 'Loading analytics...' : error || 'No data'}</p>
        </div>
      </div>
    );
  }

  const stats = analytics.stats || {};
  const diseaseBreakdown = analytics.disease_breakdown || [];
  const severityDistribution = analytics.severity_distribution || {};
  const topTissueTypes = analytics.top_tissues || [];

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 25% 6%)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: 24 }}>
            ← Back to Home
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'white', marginBottom: 8 }}>
            System Analytics
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
            Real-time insights from patient wound assessment data across the platform
          </p>
        </div>

        {/* Period Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {[['all', 'All Time'], ['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '8px 16px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease',
              background: filter === v ? '#00d2ff' : 'rgba(255,255,255,0.03)',
              color: filter === v ? 'black' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${filter === v ? '#00d2ff' : 'rgba(255,255,255,0.08)'}`,
            }}>{l}</button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Total Assessments', value: stats.total_assessments || 0, icon: '📋', color: '#00d2ff' },
            { label: 'Active Patients', value: stats.unique_patients || 0, icon: '👥', color: '#00e676' },
            { label: 'Active Clinicians', value: stats.active_clinicians || 0, icon: '👨‍⚕️', color: '#ff9800' },
            { label: 'Avg Severity', value: (stats.avg_severity || 0).toFixed(1), icon: '📊', color: '#f44336' },
          ].map((m, i) => (
            <div key={i} style={{
              background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 16,
              padding: '24px', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '2rem' }}>{m.icon}</span>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.label}</div>
              </div>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, color: m.color, lineHeight: 1 }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Severity Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          {/* Severity Breakdown */}
          <div style={{ background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Severity Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Mild (0-30)', key: 'mild', color: '#4caf50' },
                { label: 'Moderate (31-60)', key: 'moderate', color: '#ffc107' },
                { label: 'Severe (61-80)', key: 'severe', color: '#ff9800' },
                { label: 'Critical (81-100)', key: 'critical', color: '#f44336' },
              ].map(s => {
                const count = severityDistribution[s.key] || 0;
                const total = stats.total_assessments || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={s.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Tissue Types */}
          <div style={{ background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Tissue Types Detected</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topTissueTypes.length > 0 ? topTissueTypes.map((t, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid #00d2ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t.tissue_type}</span>
                    <span style={{ color: '#00d2ff', fontWeight: 700 }}>{t.count} cases</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    Avg: {t.avg_percentage.toFixed(1)}% of wound
                  </div>
                </div>
              )) : <p style={{ color: 'rgba(255,255,255,0.3)' }}>No tissue data available</p>}
            </div>
          </div>
        </div>

        {/* Disease/Condition Breakdown */}
        {diseaseBreakdown.length > 0 && (
          <div style={{ background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)', borderRadius: 16, padding: '24px', marginBottom: 40 }}>
            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Common Conditions (Inferred)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
              {diseaseBreakdown.map((disease, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.5rem' }}>🩹</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: 'white', margin: '0 0 2px 0', fontWeight: 700, fontSize: '0.95rem' }}>
                        {disease.condition}
                      </h4>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        {disease.cases} patients
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    <strong>Avg Severity:</strong> {disease.avg_severity.toFixed(1)}/100
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    <strong>Common Tissues:</strong> {disease.common_tissues.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Data Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              const csv = generateAnalyticsCSV(analytics);
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pathoglow-analytics-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            style={{
              padding: '12px 28px', borderRadius: 12, background: '#00d2ff', color: 'black',
              fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(0,210,255,0.3)'
            }}
          >
            📥 Export Analytics CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function generateAnalyticsCSV(analytics) {
  let csv = 'PathoGlow Analytics Report\n';
  csv += `Generated: ${new Date().toISOString()}\n\n`;
  
  csv += 'SUMMARY STATISTICS\n';
  csv += `Total Assessments,${analytics.stats.total_assessments}\n`;
  csv += `Unique Patients,${analytics.stats.unique_patients}\n`;
  csv += `Active Clinicians,${analytics.stats.active_clinicians}\n`;
  csv += `Average Severity,${analytics.stats.avg_severity.toFixed(2)}\n\n`;
  
  csv += 'SEVERITY DISTRIBUTION\n';
  csv += 'Category,Count,Percentage\n';
  Object.entries(analytics.severity_distribution).forEach(([cat, count]) => {
    const pct = ((count / analytics.stats.total_assessments) * 100).toFixed(1);
    csv += `${cat},${count},${pct}%\n`;
  });
  
  csv += '\nTISSUE TYPES\n';
  csv += 'Tissue Type,Cases,Average %\n';
  analytics.top_tissues.forEach(t => {
    csv += `${t.tissue_type},${t.count},${t.avg_percentage.toFixed(1)}%\n`;
  });
  
  csv += '\nCONDITIONS\n';
  csv += 'Condition,Cases,Avg Severity\n';
  analytics.disease_breakdown.forEach(d => {
    csv += `${d.condition},${d.cases},${d.avg_severity.toFixed(2)}\n`;
  });
  
  return csv;
}
