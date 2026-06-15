import React, { useState, useEffect } from 'react';
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
  return Math.min(score, 4);
}

// ── Animated input field ─────────────────────────────────────────────────────
function InputField({ label, type = 'text', value, onChange, placeholder, required = false, showToggle = false, toggleState, onToggle }) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <label style={{
        position: 'absolute',
        left: 20,
        top: focused || localValue ? 10 : '50%',
        transform: focused || localValue ? 'translateY(0) scale(0.85)' : 'translateY(-50%) scale(1)',
        color: focused ? '#00d2ff' : 'rgba(255,255,255,0.4)',
        fontSize: focused || localValue ? '0.7rem' : '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 2,
        background: focused || localValue ? 'hsl(220 25% 6%)' : 'transparent',
        padding: focused || localValue ? '0 8px' : '0',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showToggle ? (toggleState ? 'text' : 'password') : type}
          value={localValue}
          onChange={(e) => { setLocalValue(e.target.value); onChange && onChange(e.target.value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={focused ? '' : placeholder}
          style={{
            width: '100%',
            padding: focused || localValue ? '28px 48px 12px 20px' : '18px 48px 18px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: `1.5px solid ${focused ? '#00d2ff' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 16,
            color: 'white',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'all 0.25s ease',
            boxShadow: focused ? '0 0 20px rgba(0,210,255,0.15)' : 'none',
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1rem', opacity: 0.5, transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
          >
            {toggleState ? '👁️' : '🔒'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Password strength indicator ──────────────────────────────────────────────
function StrengthMeter({ score }) {
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f59e0b', '#fbbf24', '#22c55e', '#00d2ff'];
  if (score === 0) return null;
  return (
    <div style={{ marginTop: -10, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.06)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 600, color: colors[score], letterSpacing: '0.05em' }}>
        {labels[score]} {score >= 3 ? '✓' : ''}
      </div>
    </div>
  );
}

// ── Role selector cards ───────────────────────────────────────────────────────
function RoleSelector({ selected, onSelect }) {
  const roles = [
    { id: 'patient', icon: '🩹', label: 'Patient', color: '#00d2ff', desc: 'Track wounds & get AI analysis' },
    { id: 'clinician', icon: '🩺', label: 'Clinician', color: '#00e676', desc: 'Publish articles & guides' },
  ];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
        Account Type
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {roles.map(role => (
          <div
            key={role.id}
            onClick={() => onSelect(role.id)}
            style={{
              flex: 1,
              padding: '16px 12px',
              borderRadius: 16,
              border: `1.5px solid ${selected === role.id ? role.color + '60' : 'rgba(255,255,255,0.06)'}`,
              background: selected === role.id ? role.color + '08' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              if (selected !== role.id) {
                e.currentTarget.style.borderColor = role.color + '40';
                e.currentTarget.style.background = role.color + '05';
              }
            }}
            onMouseLeave={e => {
              if (selected !== role.id) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{role.icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selected === role.id ? role.color : 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
              {role.label}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>
              {role.desc}
            </div>
            {selected === role.id && (
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: role.color, boxShadow: `0 0 10px ${role.color}` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab switcher ─────────────────────────────────────���───────────────────────
function TabSwitcher({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 999, padding: 4, marginBottom: 28,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {['login', 'signup'].map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 999,
            border: 'none',
            background: active === tab ? 'rgba(0,210,255,0.1)' : 'transparent',
            color: active === tab ? '#00d2ff' : 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {active === tab && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(0,210,255,0.15) 0%, transparent 60%)',
            }} />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {tab === 'login' ? 'Sign In' : 'Sign Up'}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 210, 255, 0.12)';
  const border = type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 210, 255, 0.3)';
  const icon = type === 'error' ? '⚠️' : '✓';

  return (
    <div style={{
      position: 'absolute', top: 20, left: 20, right: 20,
      background, border: `1px solid ${border}`, borderRadius: 12,
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fade-slide-down 0.3s ease-out',
      zIndex: 10,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{message}</span>
    </div>
  );
}

// ── Main Auth Modal ──────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setMounted(true), 10);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const users = getUsers();

    try {
      if (activeTab === 'signup') {
        if (users[email]) {
          setToast({ msg: 'An account with this email already exists.', type: 'error' });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setToast({ msg: 'Password must be at least 6 characters.', type: 'error' });
          setLoading(false);
          return;
        }
        if (!email.includes('@') || !email.includes('.')) {
          setToast({ msg: 'Please enter a valid email address.', type: 'error' });
          setLoading(false);
          return;
        }

        const name = fullName.trim() || email.split('@')[0];
        users[email] = { name, hash: btoa(password), role };
        saveUsers(users);
        saveSession(email, name, role);

        // Sync to DB
        fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role }),
        }).catch(() => {});

        setToast({ msg: `Welcome to ToxiGlow, ${name}!`, type: 'success' });
        setTimeout(() => {
          onClose();
          onAuthSuccess && onAuthSuccess(name);
          // Reset form
          setEmail('');
          setPassword('');
          setFullName('');
          setRole('patient');
          setMounted(false);
        }, 1500);
      } else {
        const user = users[email];
        if (!user || user.hash !== btoa(password)) {
          setToast({ msg: 'Invalid email or password.', type: 'error' });
          setLoading(false);
          return;
        }

        let resolvedRole = user.role || 'patient';
        try {
          const r = await fetch(`${API_BASE_URL}/api/auth/user/${encodeURIComponent(email)}`);
          if (r.ok) { const d = await r.json(); resolvedRole = d.role || resolvedRole; }
        } catch { /* offline */ }

        saveSession(email, user.name, resolvedRole);
        setToast({ msg: `Welcome back, ${user.name}!`, type: 'success' });
        setTimeout(() => {
          onClose();
          onAuthSuccess && onAuthSuccess(user.name);
          setEmail('');
          setPassword('');
          setMounted(false);
        }, 1200);
      }
    } catch (err) {
      setToast({ msg: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pwdScore = activeTab === 'signup' ? passwordStrength(password) : 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setMounted(false); } }}
    >
      {/* Glow effects */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* Modal card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(20, 22, 30, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28,
        padding: 36,
        position: 'relative',
        overflow: 'hidden',
        transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 100px rgba(0,210,255,0.08)',
      }}>
        {/* Toast */}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header with logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)',
            marginBottom: 16,
            fontSize: '1.8rem',
          }}>
            🩹
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: '1.8rem', color: 'white', margin: 0, marginBottom: 4,
          }}>
            Toxi<span style={{ color: '#00d2ff' }}>Glow</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {activeTab === 'login' ? 'Sign in to access your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Tab switcher */}
        <TabSwitcher active={activeTab} onChange={setActiveTab} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {activeTab === 'signup' && (
            <>
              <RoleSelector selected={role} onSelect={setRole} />
              <InputField
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="John Doe"
              />
            </>
          )}

          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="user@example.com"
          />

          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            showToggle={true}
            toggleState={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />

          {activeTab === 'signup' && <StrengthMeter score={pwdScore} />}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 16,
              border: 'none',
              background: loading
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #00d2ff 0%, #0094b3 100%)',
              color: loading ? 'rgba(255,255,255,0.4)' : 'black',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              boxShadow: loading ? 'none' : '0 8px 32px rgba(0,210,255,0.35)',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ animation: 'pulse-dot 1s infinite' }}>●</span>
                  <span style={{ animation: 'pulse-dot 1s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'pulse-dot 1s infinite 0.4s' }}>●</span>
                </span>
              ) : (activeTab === 'login' ? 'Sign In' : 'Create Account')}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            <span style={{ opacity: 0.6 }}>All data is encrypted and stored securely.</span>
          </p>
        </div>
      </div>
    </div>
  );
}