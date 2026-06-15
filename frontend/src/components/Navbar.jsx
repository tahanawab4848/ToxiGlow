import React, { useState, useEffect } from 'react';

export default function Navbar({ user, onLogout, onAuthClick, onViewChange, currentView }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('assess');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 200);

      // Scroll spy — include results section
      const sections = ['assess', 'results', 'how-it-works', 'footer'];
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top && scrollPos < top + el.offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <nav
      className="tg-navbar tg-navbar-scrolled"
      style={{
        transform: 'translateY(0)',
        opacity: 1,
        pointerEvents: 'auto',
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        background: scrolled
          ? 'hsla(220, 20%, 9%, 0.85)'
          : 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="tg-navbar-inner">
        <a href="#hero" className="tg-navbar-logo" onClick={closeMenu}>
          <span style={{ marginRight: '6px' }}>➕</span>ToxiGlow
        </a>

        <div className="tg-navbar-links">
          <a href="#assess" className={activeSection === 'assess' ? 'active' : ''}>Assess</a>
          <a href="#how-it-works" className={activeSection === 'how-it-works' ? 'active' : ''}>How It Works</a>
          <button
            onClick={() => onViewChange && onViewChange('knowledge-hub')}
            style={{
              background: currentView === 'knowledge-hub' ? 'rgba(0,210,255,0.08)' : 'none',
              border: currentView === 'knowledge-hub' ? '1px solid rgba(0,210,255,0.2)' : 'none',
              color: currentView === 'knowledge-hub' ? '#00d2ff' : 'hsl(var(--text-secondary))',
              borderRadius: 999, padding: currentView === 'knowledge-hub' ? '4px 12px' : '0',
              fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Knowledge Hub
          </button>
        </div>

        {/* Auth + role-based nav area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {/* Patient: My Records */}
          {user?.role === 'patient' && (
            <button
              onClick={() => onViewChange && onViewChange(currentView === 'patient-dashboard' ? 'home' : 'patient-dashboard')}
              style={{
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: currentView === 'patient-dashboard' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${currentView === 'patient-dashboard' ? 'rgba(0,210,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: currentView === 'patient-dashboard' ? '#00d2ff' : 'rgba(255,255,255,0.55)',
                borderRadius: 999, padding: '6px 14px', transition: 'all 0.2s'
              }}
            >
              🩹 My Records
            </button>
          )}

          {/* Clinician: Portal */}
          {user?.role === 'clinician' && (
            <button
              onClick={() => onViewChange && onViewChange(currentView === 'clinician-portal' ? 'home' : 'clinician-portal')}
              style={{
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: currentView === 'clinician-portal' ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${currentView === 'clinician-portal' ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: currentView === 'clinician-portal' ? '#00e676' : 'rgba(255,255,255,0.55)',
                borderRadius: 999, padding: '6px 14px', transition: 'all 0.2s',
                boxShadow: currentView === 'clinician-portal' ? '0 0 12px rgba(0,230,118,0.2)' : 'none'
              }}
            >
              🩺 My Portal
            </button>
          )}

          {/* Admin: Analytics */}
          {user?.role === 'admin' && (
            <button
              onClick={() => onViewChange && onViewChange(currentView === 'admin-dashboard' ? 'home' : 'admin-dashboard')}
              style={{
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: currentView === 'admin-dashboard' ? 'rgba(255,152,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${currentView === 'admin-dashboard' ? 'rgba(255,152,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: currentView === 'admin-dashboard' ? '#ff9800' : 'rgba(255,255,255,0.55)',
                borderRadius: 999, padding: '6px 14px', transition: 'all 0.2s',
                boxShadow: currentView === 'admin-dashboard' ? '0 0 12px rgba(255,152,0,0.2)' : 'none'
              }}
            >
              📊 Analytics
            </button>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.25)',
                  borderRadius: 999, padding: '5px 12px 5px 5px', cursor: 'pointer',
                }}
                aria-label="User menu"
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00d2ff, #0094b3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: 'black', flexShrink: 0
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 200,
                  background: 'hsl(220 20% 9%)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '8px', minWidth: 160,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  animation: 'fade-slide-down 0.2s ease-out forwards'
                }}>
                  <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
                    {user.email}
                  </div>
                  <button
                    onClick={() => { onLogout && onLogout(); setUserMenuOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8,
                      fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => onAuthClick && onAuthClick('login')}
                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, cursor: 'pointer' }}
              >
                Login
              </button>
              <button
                onClick={() => onAuthClick && onAuthClick('signup')}
                style={{
                  fontSize: '0.8rem', fontWeight: 600, color: 'black', cursor: 'pointer',
                  background: '#00d2ff', borderRadius: 999, padding: '6px 16px',
                  boxShadow: '0 0 10px rgba(0,210,255,0.3)'
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        <button
          className={`tg-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`tg-mobile-menu ${mobileMenuOpen ? 'show' : ''}`}>
        <a href="#assess" onClick={closeMenu}>Assess</a>
        <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="#footer" onClick={closeMenu}>About</a>
        {user && (
          <button onClick={() => { onLogout && onLogout(); closeMenu(); }} style={{ display: 'block', padding: '12px 0', color: '#ff6b6b', fontWeight: 600, fontSize: '0.9rem', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid hsl(220 20% 12%)' }}>
            🚪 Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
