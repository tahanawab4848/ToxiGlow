import React, { useState, useEffect, useRef } from 'react';

// Custom lightweight SVG Icons to ensure zero compile warnings
const GlobeIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const InstagramIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const ArrowRightIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function Hero({ onAuthClick }) {
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const opacityRef = useRef(0);
  const animationFrameId = useRef(null);
  const fadingOutRef = useRef(false);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' or 'clinician'

  // Fade loop animator using requestAnimationFrame
  const fadeTo = (targetOpacity, durationMs) => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    const startOpacity = opacityRef.current;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
      setOpacity(currentOpacity);
      opacityRef.current = currentOpacity;

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    animationFrameId.current = requestAnimationFrame(animate);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const duration = video.duration;
    if (!duration) return;

    const timeLeft = duration - video.currentTime;

    // Fade out 0.50 - 0.55s before loop end
    if (timeLeft <= 0.55 && !fadingOutRef.current) {
      fadingOutRef.current = true;
      fadeTo(0, 500);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    setOpacity(0);
    opacityRef.current = 0;

    // Wait 100ms, then reset, play, and fade back in
    setTimeout(() => {
      video.currentTime = 0;
      video.play()
        .then(() => {
          fadingOutRef.current = false;
          fadeTo(1, 500);
        })
        .catch(err => console.error('Video replay blocked:', err));
    }, 100);
  };

  const handleLoadedData = () => {
    // Fade in on load
    fadeTo(1, 500);
  };

  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  // Determine dynamic highlight colors
  const accentColor = role === 'patient' ? '#00d2ff' : '#00e676';
  const rolePlaceholder = role === 'patient'
    ? 'Enter patient email to receive wound telemetry...'
    : 'Enter clinician email for medical workspace...';

  return (
    <section className="relative min-h-screen bg-black overflow-hidden flex flex-col" id="hero">
      
      {/* 1. Looping background video */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4"
          muted
          autoPlay
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'translateY(17%)', // cropped top portion
            opacity: opacity,
          }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedData={handleLoadedData}
        />
        {/* Glow overlay */}
        <div className="hero-glow"></div>
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* 2. Medical HUD Visual Additions */}
      <div className={`hud-scanline ${role === 'clinician' ? 'hud-scanline-clinician' : ''}`} />
      
      <div className="hud-corner hud-corner-tl" style={{ borderColor: accentColor }} />
      <div className="hud-corner hud-corner-tr" style={{ borderColor: accentColor }} />
      <div className="hud-corner hud-corner-bl" style={{ borderColor: accentColor }} />
      <div className="hud-corner hud-corner-br" style={{ borderColor: accentColor }} />

      {/* HUD Telemetry coordinate labels */}
      <div className="absolute hidden md:block text-[9px] text-white/30 font-mono tracking-wider pointer-events-none" style={{ top: '48px', left: '60px', zIndex: 10 }}>
        [ LAT_37.7725 / LON_-122.4140 ]
      </div>
      <div className="absolute hidden md:block text-[9px] text-white/30 font-mono tracking-wider pointer-events-none" style={{ top: '48px', right: '60px', zIndex: 10 }}>
        [ SYS_STATUS: ACTIVE_HUD_OK ]
      </div>

      {/* Animated Heartbeat ECG Line */}
      <svg className="pulse-svg hidden lg:block" viewBox="0 0 100 50">
        <path
          className="pulse-path"
          d="M0,25 L30,25 L35,10 L40,40 L45,20 L50,30 L55,25 L100,25"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
        />
      </svg>

      {/* 3. Navigation bar (relative z-20) */}
      <header className="relative z-20 px-6 py-6" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
          
          <div className="flex items-center gap-2" style={{ gap: '0.5rem' }}>
            <GlobeIcon size={24} style={{ color: accentColor }} />
            <span className="text-white font-semibold text-lg" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              ToxiGlow
            </span>
          </div>

          <nav className="hidden md:flex gap-8" style={{ gap: '2rem' }}>
            <a href="#assess" className="text-white/80 hover:text-white transition-colors text-sm font-medium" style={{ fontSize: '0.875rem' }}>Assess</a>
            <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors text-sm font-medium" style={{ fontSize: '0.875rem' }}>How It Works</a>
            <a href="#footer" className="text-white/80 hover:text-white transition-colors text-sm font-medium" style={{ fontSize: '0.875rem' }}>About</a>
          </nav>

          <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
            <button 
              onClick={() => onAuthClick && onAuthClick('signup')}
              className="text-white text-sm font-medium hover:text-white/80 transition-colors" 
              style={{ fontSize: '0.875rem' }}
            >
              Sign Up
            </button>
            <button 
              onClick={() => onAuthClick && onAuthClick('login')}
              className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-all" 
              style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.875rem' }}
            >
              Login
            </button>
          </div>

        </div>
      </header>

      {/* 4. Hero content area (relative z-10) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center" style={{ transform: 'translateY(-5%)', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '3rem', paddingBottom: '3rem' }}>
        
        {/* Dynamic Patient/Clinician workspace selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="mode-toggle-pill">
            <button 
              type="button"
              className={`mode-toggle-btn ${role === 'patient' ? 'active-patient' : ''}`}
              onClick={() => setRole('patient')}
            >
              Patient
            </button>
            <button 
              type="button"
              className={`mode-toggle-btn ${role === 'clinician' ? 'active-clinician' : ''}`}
              onClick={() => setRole('clinician')}
            >
              Clinician
            </button>
          </div>
        </div>

        <h1 
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
          style={{ 
            fontFamily: "'Instrument Serif', serif", 
            fontStyle: 'italic',
            marginBottom: '1.5rem',
            letterSpacing: '-0.025em'
          }}
        >
          The early warning your wound needs.
        </h1>

        <div className="max-w-xl w-full space-y-4 mx-auto" style={{ maxWidth: '36rem' }}>
          
          {/* Email input bar with dynamically updated state colors */}
          <form onSubmit={handleSubscribe} className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3" style={{ paddingLeft: '1.5rem', paddingRight: '0.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.75rem', transition: 'border-color 0.4s ease' }}>
            <input
              type="email"
              placeholder={rolePlaceholder}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-white placeholder:text-white/40 text-base"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem' }}
            />
            <button 
              type="submit" 
              className="rounded-full p-3 text-black hover:opacity-90 transition-all" 
              style={{ 
                padding: '0.75rem', 
                borderRadius: '9999px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: accentColor,
                boxShadow: `0 0 12px ${accentColor}80`,
                transition: 'background-color 0.4s ease, box-shadow 0.4s ease'
              }}
            >
              <ArrowRightIcon size={20} />
            </button>
          </form>

          {/* Subscribe feedback */}
          {subscribed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
              background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)',
              borderRadius: 12, padding: '10px 20px', fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.9)', animation: 'fade-slide-up 0.3s ease-out'
            }}>
              ✅ You're on the list! We'll be in touch soon.
            </div>
          )}

          {/* Subtitle text */}
          <p className="text-white text-sm leading-relaxed px-4" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: '1.625', paddingLeft: '1rem', paddingRight: '1rem' }}>
            Stay updated with clinical telemetry assessments. Subscribe to our newsletter today and never miss out on critical early warning updates.
          </p>

          {/* Manifesto button */}
          <div style={{ paddingTop: '1.5rem' }}>
            <a 
              href="#assess" 
              className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors"
              style={{ 
                display: 'inline-block', 
                paddingLeft: '2rem', 
                paddingRight: '2rem', 
                paddingTop: '0.75rem', 
                paddingBottom: '0.75rem', 
                fontSize: '0.875rem',
                border: `1px solid ${accentColor}40`
              }}
            >
              LAUNCH WOUND TELEMETRY
            </a>
          </div>

        </div>
      </div>

      {/* 5. Social icons footer */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12" style={{ gap: '1rem', paddingBottom: '3rem' }}>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all" style={{ padding: '1rem', borderRadius: '9999px', display: 'inline-flex' }} aria-label="Instagram">
          <InstagramIcon size={20} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all" style={{ padding: '1rem', borderRadius: '9999px', display: 'inline-flex' }} aria-label="Twitter">
          <TwitterIcon size={20} />
        </a>
        <a href="#footer" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all" style={{ padding: '1rem', borderRadius: '9999px', display: 'inline-flex' }} aria-label="Website">
          <GlobeIcon size={20} />
        </a>
      </footer>

    </section>
  );
}
