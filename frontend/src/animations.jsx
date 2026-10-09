import React, { useState, useEffect, useRef } from 'react';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
export function useScrollReveal(threshold = 0.15) {
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
export function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
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
export function ParticleField() {
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
export function TypingText({ words, speed = 80, pause = 2000 }) {
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
