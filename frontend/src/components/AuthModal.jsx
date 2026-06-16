import { useState, useEffect } from 'react';
import { API_BASE_URL, safeLocalStorage } from '../config';

// ── Helpers ──────────────────────────────────────────────────────────────────
const SESSION_KEY = 'tg_session';
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

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <label style={{
        position: 'absolute',
        left: 20,
        top: focused || value ? 10 : '50%',
        transform: focused || value ? 'translateY(0) scale(0.85)' : 'translateY(-50%) scale(1)',
        color: focused ? '#00d2ff' : 'rgba(255,255,255,0.4)',
        fontSize: focused || value ? '0.7rem' : '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 2,
        background: focused || value ? 'hsl(220 25% 6%)' : 'transparent',
        padding: focused || value ? '0 8px' : '0',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showToggle ? (toggleState ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => { onChange && onChange(e.target.value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={focused ? '' : placeholder}
          style={{
            width: '100%',
            padding: focused || value ? '28px 48px 12px 20px' : '18px 48px 18px 20px',
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
      setTimeout(() => setMounted(false), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (!email || !email.includes('@') || !email.includes('.')) {
        setToast({ msg: 'Please enter a valid email address.', type: 'error' });
        setLoading(false);
        return;
      }
      if (!password || password.length < 6) {
        setToast({ msg: 'Password must be at least 6 characters.', type: 'error' });
        setLoading(false);
        return;
      }

      if (activeTab === 'signup') {
        const name = fullName.trim() || email.split('@')[0];
        
        // Sync to DB
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
        
        if (!res.ok) {
            const err = await res.json();
            const errorMsg = typeof err.detail === 'string' ? err.detail : (Array.isArray(err.detail) ? err.detail[0].msg : 'Registration failed');
            throw new Error(errorMsg);
        }
        
        const data = await res.json();

        saveSession(data.email, data.name, data.role);

        setToast({ msg: `Welcome to ToxiGlow, ${data.name}!`, type: 'success' });
        setTimeout(() => {
          onClose();
          onAuthSuccess && onAuthSuccess(data.name);
          // Reset form
          setEmail('');
          setPassword('');
          setFullName('');
          setRole('patient');
          setMounted(false);
        }, 1500);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        if (!res.ok) {
            const err = await res.json();
            const errorMsg = typeof err.detail === 'string' ? err.detail : 'Invalid email or password';
            throw new Error(errorMsg);
        }
        
        const data = await res.json();

        saveSession(data.email, data.name, data.role);
        setToast({ msg: `Welcome back, ${data.name}!`, type: 'success' });
        setTimeout(() => {
          onClose();
          onAuthSuccess && onAuthSuccess(data.name);
          setEmail('');
          setPassword('');
          setMounted(false);
        }, 1200);
      }
    } catch (err) {
      setToast({ msg: err.message || 'Something went wrong. Please try again.', type: 'error' });
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
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s ease',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); setMounted(false); } }}
    >
      {/* Background Orbs */}
      <div style={{
        position: 'absolute', width: '60vw', height: '60vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,210,255,0.05) 0%, transparent 60%)',
        top: '50%', left: '30%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,230,118,0.03) 0%, transparent 60%)',
        bottom: '-10%', right: '10%', transform: 'translate(50%, 50%)',
        pointerEvents: 'none',
      }} />

      {/* Main Split Card */}
      <div style={{
        width: '100%', maxWidth: 880,
        display: 'flex', flexDirection: 'row',
        background: 'rgba(20, 22, 30, 0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(20px)',
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>
        
        {/* Explicit Close Button */}
        <button
          onClick={() => { onClose(); setMounted(false); }}
          style={{
            position: 'absolute', top: 20, right: 20, zIndex: 50,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.2rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          ×
        </button>

        {/* Left Side: Branding / Illustration (Hidden on very small screens) */}
        <div style={{
          flex: '1', display: window.innerWidth > 768 ? 'flex' : 'none',
          flexDirection: 'column', justifyContent: 'space-between',
          padding: 40, background: 'rgba(0, 0, 0, 0.4)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(0,210,255,0.05))',
              border: '1px solid rgba(0,210,255,0.3)',
              marginBottom: 24, fontSize: '1.5rem',
            }}>
              ➕
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic',
              fontSize: '2.4rem', color: 'white', margin: '0 0 16px', lineHeight: 1.1
            }}>
              Welcome to <br/><span style={{ color: '#00d2ff' }}>PathoGlow</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 300 }}>
              Join the cutting-edge clinical compassion platform. Track wound healing with AI, publish clinical insights, and manage patient care.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0.8 }}>
              <div style={{ display: 'flex' }}>
                {['#00d2ff', '#00e676', '#7c4dff'].map((color, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color}, transparent)`,
                    border: `1px solid ${color}`,
                    marginLeft: i > 0 ? -12 : 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Trusted by 10k+ Clinicians</span>
            </div>
          </div>

          {/* Decorative graphic */}
          <div style={{
            position: 'absolute', bottom: -50, right: -50, width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(0,210,255,0.1)', borderRadius: '50%',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Right Side: Form */}
        <div style={{ flex: '1', padding: '40px', position: 'relative' }}>

          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            {toast && (
              <div style={{
                background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 210, 255, 0.15)',
                border: `1px solid ${toast.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 210, 255, 0.4)'}`,
                borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 20,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{toast.type === 'error' ? '⚠️' : '✓'}</span>
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{toast.msg}</span>
              </div>
            )}

            <TabSwitcher active={activeTab} onChange={setActiveTab} />

            <form onSubmit={handleSubmit}>
              {activeTab === 'signup' && (
                <div style={{ animation: 'fade-slide-up 0.3s ease-out forwards' }}>
                  <RoleSelector selected={role} onSelect={setRole} />
                  <InputField
                    label="Full Name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>
              )}

              <InputField
                label="Email Address"
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

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00d2ff 0%, #0094b3 100%)',
                  color: loading ? 'rgba(255,255,255,0.4)' : 'black',
                  fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.05em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 12, boxShadow: loading ? 'none' : '0 8px 32px rgba(0,210,255,0.35)',
                  transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ animation: 'pulse-dot 1s infinite' }}>●</span>
                    <span style={{ animation: 'pulse-dot 1s infinite 0.2s' }}>●</span>
                    <span style={{ animation: 'pulse-dot 1s infinite 0.4s' }}>●</span>
                  </span>
                ) : (activeTab === 'login' ? 'Sign In to Dashboard' : 'Create Secure Account')}
              </button>
            </form>

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
                <br />All data is securely encrypted.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}