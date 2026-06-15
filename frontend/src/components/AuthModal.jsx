import React, { useState } from 'react';
import { API_BASE_URL, safeLocalStorage } from '../config';

// ── Helpers ──────────────────────────────────────────────────────────────────
const USERS_KEY = 'tg_users';
const SESSION_KEY = 'tg_session';

function getUsers() {
  try { return JSON.parse(safeLocalStorage.getItem(USERS_KEY) || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { safeLocalStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function saveSession(email, name, role = 'patient') {
  safeLocalStorage.setItem(SESSION_KEY, JSON.stringify({ email, name, role, token: `tg_${Date.now()}` }));
}

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-4
}

// ── Toast component ───────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type === 'error' ? 'rgba(220,38,38,0.15)' : 'rgba(0,210,255,0.12)';
  const border = type === 'error' ? 'rgba(220,38,38,0.4)' : 'rgba(0,210,255,0.3)';
  const icon = type === 'error' ? '⚠️' : '✅';
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 12,
      padding: '10px 16px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)',
      display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16,
      animation: 'fade-slide-down 0.3s ease-out forwards'
    }}>
      <span>{icon}</span> {msg}
    </div>
  );
}

// ── Strength bar ──────────────────────────────────────────────────────────────
function StrengthBar({ score }) {
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#00d2ff'];
  if (!score) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 9999,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s ease'
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: colors[score], fontWeight: 600 }}>
        {labels[score]}
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');  // 'patient' | 'clinician'
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const users = getUsers();

    try {
      if (activeTab === 'signup') {
        if (users[email]) { showToast('An account with this email already exists.'); setLoading(false); return; }
        if (password.length < 6) { showToast('Password must be at least 6 characters.'); setLoading(false); return; }
        const name = fullName.trim() || email.split('@')[0];
        users[email] = { name, hash: btoa(password), role };
        saveUsers(users);
        saveSession(email, name, role);

        // Sync to DB (best-effort — don't block on failure)
        fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role }),
        }).catch(() => {});

        showToast(`Welcome, ${name}! Your ${role} account is ready.`, 'success');
        setTimeout(() => { onClose(); onAuthSuccess && onAuthSuccess(name); }, 1400);
      } else {
        const user = users[email];
        if (!user || user.hash !== btoa(password)) {
          showToast('Incorrect email or password.'); setLoading(false); return;
        }
        // Fetch role from DB in case it was changed; fallback to localStorage
        let resolvedRole = user.role || 'patient';
        try {
          const r = await fetch(`${API_BASE_URL}/api/auth/user/${encodeURIComponent(email)}`);
          if (r.ok) { const d = await r.json(); resolvedRole = d.role || resolvedRole; }
        } catch { /* offline */ }

        saveSession(email, user.name, resolvedRole);
        showToast(`Welcome back, ${user.name}!`, 'success');
        setTimeout(() => { onClose(); onAuthSuccess && onAuthSuccess(user.name); }, 1200);
      }
    } finally {
      setLoading(false);
    }
  };


  const pwdScore = activeTab === 'signup' ? passwordStrength(password) : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="liquid-glass w-full max-w-md p-8 rounded-3xl"
        style={{
          boxShadow: '0 24px 64px rgba(0, 210, 255, 0.15)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Toast */}
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        {/* Header Tabs */}
        <div className="flex border-b border-white/10 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === 'login' ? 'text-white border-b-2' : 'text-white/40 hover:text-white/60'
            }`}
            style={{
              borderBottom: activeTab === 'login' ? '2px solid #00d2ff' : 'none',
              paddingBottom: '0.75rem'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 pb-3 text-sm font-semibold tracking-wider uppercase transition-colors ${
              activeTab === 'signup' ? 'text-white border-b-2' : 'text-white/40 hover:text-white/60'
            }`}
            style={{
              borderBottom: activeTab === 'signup' ? '2px solid #00d2ff' : 'none',
              paddingBottom: '0.75rem'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {activeTab === 'signup' && (
            <>
              {/* Role selector */}
              <div>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-mono" style={{ display: 'block', marginBottom: 8 }}>I am a…</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { v: 'patient',   label: '🩹 Patient',   accent: '#00d2ff' },
                    { v: 'clinician', label: '🩺 Clinician', accent: '#00e676' },
                  ].map(({ v, label, accent }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRole(v)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        background: role === v ? accent + '18' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${role === v ? accent + '60' : 'rgba(255,255,255,0.07)'}`,
                        color: role === v ? accent : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.2s ease',
                        boxShadow: role === v ? `0 0 12px ${accent}25` : 'none',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {role === 'clinician' && (
                  <div style={{ fontSize: '0.68rem', color: '#00e676', marginTop: 6, paddingLeft: 4 }}>
                    ✓ Clinician accounts can publish articles to the Knowledge Hub
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="liquid-glass rounded-full px-5 py-3 text-white placeholder:text-white/20 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    outline: 'none'
                  }}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="liquid-glass rounded-full px-5 py-3 text-white placeholder:text-white/20 text-sm"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                outline: 'none'
              }}
            />
          </div>

          <div className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="liquid-glass rounded-full px-5 py-3 text-white placeholder:text-white/20 text-sm"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  outline: 'none',
                  paddingRight: '3rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {activeTab === 'signup' && <StrengthBar score={pwdScore} />}
          </div>

          <div style={{ paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="liquid-glass rounded-full flex-1 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
              style={{
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full flex-1 py-3 text-black text-sm font-semibold"
              style={{
                backgroundColor: '#00d2ff',
                boxShadow: '0 0 16px rgba(0, 210, 255, 0.4)',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease'
              }}
            >
              {loading ? '...' : activeTab === 'login' ? 'Access Portal' : 'Create Account'}
            </button>
          </div>

        </form>

        {/* HUD Subtext status */}
        <div className="mt-6 text-center text-[9px] text-white/30 font-mono tracking-wider" style={{ marginTop: '1.5rem' }}>
          [ AUTH_PROTOCOL: TLS_1.3_ENCRYPTED ]
        </div>
      </div>
    </div>
  );
}
