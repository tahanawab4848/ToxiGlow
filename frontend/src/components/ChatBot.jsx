import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, hasSpeechSynthesis } from '../config';

// ── Suggestion chips shown in the empty state ────────────────────────────────
const SUGGESTIONS = [
  'What is granulation tissue?',
  'How do I clean my wound?',
  'What are signs of infection?',
  'What does my severity score mean?',
  'How long will my wound take to heal?',
  'Tell me about dressing changes',
];

// ── Lightweight markdown renderer (bold + line-breaks only) ──────────────────
function renderMarkdown(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldIdx = remaining.indexOf('**');
    const breakIdx = remaining.indexOf('\n');

    const nextSpecial = Math.min(
      boldIdx === -1 ? Infinity : boldIdx,
      breakIdx === -1 ? Infinity : breakIdx
    );

    if (nextSpecial === Infinity) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (nextSpecial === breakIdx && (boldIdx === -1 || breakIdx < boldIdx)) {
      if (breakIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, breakIdx)}</span>);
      parts.push(<br key={key++} />);
      remaining = remaining.slice(breakIdx + 1);
    } else {
      if (boldIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, boldIdx)}</span>);
      remaining = remaining.slice(boldIdx + 2);
      const closeIdx = remaining.indexOf('**');
      if (closeIdx === -1) {
        parts.push(<strong key={key++}>{remaining}</strong>);
        break;
      }
      parts.push(<strong key={key++}>{remaining.slice(0, closeIdx)}</strong>);
      remaining = remaining.slice(closeIdx + 2);
    }
  }
  return parts;
}

// ── Typing indicator dots ─────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00d2ff',
            opacity: 0.6,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main ChatBot component ────────────────────────────────────────────────────
export default function ChatBot({ assessmentContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **ToxiGlow AI**, your wound care assistant. Ask me anything about your wound, tissue types, infection signs, or dressing care.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    }
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          context: assessmentContext || null,
        }),
      });

      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I couldn\'t connect to the server. Please make sure the backend is running on port 8000.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes chat-slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chat-fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,210,255,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(0,210,255,0); }
        }
        .chat-user-bubble {
          background: linear-gradient(135deg, #00d2ff22, #00d2ff44);
          border: 1px solid rgba(0,210,255,0.3);
          border-radius: 20px 20px 4px 20px;
          padding: 10px 14px;
          max-width: 78%;
          align-self: flex-end;
          font-size: 0.875rem;
          line-height: 1.55;
          color: #fff;
          word-break: break-word;
        }
        .chat-bot-bubble {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px 20px 20px 4px;
          padding: 10px 14px;
          max-width: 88%;
          align-self: flex-start;
          font-size: 0.875rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.9);
          word-break: break-word;
        }
        .chat-suggestion-chip {
          background: rgba(0,210,255,0.06);
          border: 1px solid rgba(0,210,255,0.2);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .chat-suggestion-chip:hover {
          background: rgba(0,210,255,0.14);
          color: #fff;
          border-color: rgba(0,210,255,0.45);
        }
        .chat-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #00d2ff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease, opacity 0.2s ease;
          color: black;
        }
        .chat-send-btn:hover { transform: scale(1.08); }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        aria-label="Open wound care assistant"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d2ff, #0094b3)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,210,255,0.5)',
          animation: !open ? 'chat-fab-pulse 2.5s ease-in-out infinite' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(45deg) scale(0.9)' : 'rotate(0deg) scale(1)',
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Unread badge */}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#f44336', color: 'white',
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid black',
          }}>
            {unread}
          </div>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 28,
            zIndex: 9998,
            width: 380,
            maxWidth: 'calc(100vw - 40px)',
            height: 560,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10, 14, 22, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0,210,255,0.18)',
            borderRadius: 24,
            boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,210,255,0.06)',
            animation: 'chat-slide-up 0.28s cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(0,210,255,0.04)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d2ff, #0094b3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              🩺
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>ToxiGlow AI</div>
              <div style={{ fontSize: '0.7rem', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', display: 'inline-block' }} />
                Wound Care Assistant · Online
              </div>
            </div>
            {assessmentContext && (
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(0,210,255,0.1)',
                border: '1px solid rgba(0,210,255,0.2)',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: '0.65rem',
                color: '#00d2ff',
                fontWeight: 600,
              }}>
                Context loaded
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,210,255,0.2) transparent',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={msg.role === 'user' ? 'chat-user-bubble' : 'chat-bot-bubble'}>
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div className="chat-bot-bubble" style={{ padding: 0 }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Suggestions — only in empty/initial state */}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Quick questions
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="chat-suggestion-chip" onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Disclaimer strip */}
          <div style={{
            padding: '6px 16px',
            fontSize: '0.62rem',
            color: 'rgba(255,255,255,0.25)',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}>
            Not a substitute for professional medical advice.
          </div>

          {/* Input bar */}
          <div style={{
            padding: '10px 14px 14px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your wound..."
              rows={1}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '10px 14px',
                color: 'white',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
