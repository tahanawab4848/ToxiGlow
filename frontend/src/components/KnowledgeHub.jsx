import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const CATEGORIES = [
  { value: 'all',        label: 'All',            icon: '🌐', color: '#00d2ff' },
  { value: 'tips',       label: 'Tips & Tricks',  icon: '💡', color: '#ffc107' },
  { value: 'blog',       label: 'Clinical Blog',  icon: '📝', color: '#00d2ff' },
  { value: 'research',   label: 'Research',       icon: '🔬', color: '#7c4dff' },
  { value: 'guide',      label: 'Guides',         icon: '📋', color: '#00e676' },
  { value: 'case-study', label: 'Case Studies',   icon: '🩺', color: '#ff6d00' },
];

const getCat = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[2];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function excerpt(text, len = 160) {
  if (!text) return '';
  const plain = text.replace(/^#+\s+/gm, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ');
  return plain.length > len ? plain.slice(0, len) + '…' : plain;
}

function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} style={{ color: 'white', margin: '16px 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>{line.slice(4)}</h3>;
    if (line.startsWith('## '))  return <h2 key={i} style={{ color: 'white', margin: '20px 0 10px', fontSize: '1.3rem', fontWeight: 700 }}>{line.slice(3)}</h2>;
    if (line.startsWith('# '))   return <h1 key={i} style={{ color: 'white', margin: '24px 0 12px', fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{line.slice(2)}</h1>;
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i} style={{ color: 'rgba(255,255,255,0.78)', marginBottom: 6, marginLeft: 24, lineHeight: 1.7 }}>{line.slice(2)}</li>;
    if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
    // Inline bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, marginBottom: 4 }}>
        {parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} style={{ color: 'white', fontWeight: 700 }}>{p}</strong>)}
      </p>
    );
  });
}

function ArticleModal({ article, onClose }) {
  if (!article) return null;
  const cat = getCat(article.category);
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'hsl(220 20% 9%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
        maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '40px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        animation: 'fade-slide-up 0.3s ease-out'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ float: 'right', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>×</button>

        {/* Category + Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ background: cat.color + '18', border: `1px solid ${cat.color}40`, color: cat.color, borderRadius: 999, padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {cat.icon} {cat.label}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{formatDate(article.created_at)}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
          {article.title}
        </h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e676, #00b248)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 700, color: 'black', flexShrink: 0
          }}>
            {(article.author_name || 'Dr').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>Dr. {article.author_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Clinician · PathoGlow</div>
          </div>
        </div>

        {/* Content */}
        <div>{renderMarkdown(article.content)}</div>

        {/* Tags */}
        {article.tags && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {article.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
              <span key={i} style={{ background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.15)', color: '#00d2ff', borderRadius: 999, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 600 }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, onOpen }) {
  const cat = getCat(article.category);
  return (
    <div
      onClick={() => onOpen(article)}
      style={{
        background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)',
        borderRadius: 18, padding: '24px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = cat.color + '50';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${cat.color}20`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'hsl(220 15% 18%)';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Category badge */}
      <div>
        <span style={{
          background: cat.color + '18', border: `1px solid ${cat.color}40`,
          color: cat.color, borderRadius: 999, padding: '3px 12px',
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          {cat.icon} {cat.label}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ color: 'white', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
        {article.title}
      </h3>

      {/* Excerpt */}
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.65, margin: 0, flex: 1 }}>
        {excerpt(article.content)}
      </p>

      {/* Tags */}
      {article.tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {article.tags.split(',').slice(0, 3).map(t => t.trim()).filter(Boolean).map((t, i) => (
            <span key={i} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', borderRadius: 999, padding: '2px 8px', fontSize: '0.65rem' }}>#{t}</span>
          ))}
        </div>
      )}

      {/* Footer: author + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e676, #00b248)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, color: 'black', flexShrink: 0
        }}>
          {(article.author_name || 'Dr').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>Dr. {article.author_name}</div>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{formatDate(article.created_at)}</div>
        <span style={{ color: cat.color, fontSize: '0.7rem', fontWeight: 700 }}>Read →</span>
      </div>
    </div>
  );
}

export default function KnowledgeHub({ onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState(null);

  useEffect(() => {
    setTimeout(() => setLoading(true), 0);
    const url = category !== 'all'
      ? `${API_BASE_URL}/api/articles?category=${category}`
      : `${API_BASE_URL}/api/articles`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setArticles([]); setLoading(false); });
  }, [category]);

  const filtered = search.trim()
    ? articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.content || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.tags || '').toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 25% 6%)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: 20 }}>
            ← Back to Home
          </button>
          <div style={{ fontSize: '0.7rem', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>Patient Resources</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'white', marginBottom: 16, lineHeight: 1.1 }}>
            Knowledge Hub
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1rem', maxWidth: 540 }}>
            Expert articles, tips, research updates and clinical guides — curated by our clinician network.
          </p>
        </div>

        {/* Search + Filter Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles, topics, tags…"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999, padding: '12px 16px 12px 44px', color: 'white',
                fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: category === c.value ? c.color + '20' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${category === c.value ? c.color + '55' : 'rgba(255,255,255,0.07)'}`,
                  color: category === c.value ? c.color : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.2s'
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div> Loading articles…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', marginBottom: 8 }}>
              {articles.length === 0 ? 'No articles published yet' : 'No results found'}
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              {articles.length === 0
                ? "Clinicians haven't published anything yet. Check back soon!"
                : 'Try a different search term or category.'}
            </p>
          </div>
        )}

        {/* Featured Article */}
        {!loading && featured && !search && (
          <div
            onClick={() => setOpenArticle(featured)}
            style={{
              background: 'hsl(220 20% 9%)',
              border: `1px solid ${getCat(featured.category).color}35`,
              borderRadius: 20, padding: '36px', marginBottom: 40, cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 16px 60px rgba(0,0,0,0.5), 0 0 0 1px ${getCat(featured.category).color}25`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: `radial-gradient(circle at top right, ${getCat(featured.category).color}0a, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ background: '#00d2ff22', border: '1px solid #00d2ff40', color: '#00d2ff', borderRadius: 999, padding: '3px 14px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em' }}>✨ FEATURED</span>
              <span style={{ background: getCat(featured.category).color + '18', border: `1px solid ${getCat(featured.category).color}40`, color: getCat(featured.category).color, borderRadius: 999, padding: '3px 12px', fontSize: '0.68rem', fontWeight: 700 }}>
                {getCat(featured.category).icon} {getCat(featured.category).label}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: 'white', lineHeight: 1.2, marginBottom: 14 }}>
              {featured.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 640, marginBottom: 20 }}>
              {excerpt(featured.content, 220)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #00e676, #00b248)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'black' }}>
                {(featured.author_name || 'Dr').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Dr. {featured.author_name}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>{formatDate(featured.created_at)}</span>
              <span style={{ marginLeft: 'auto', color: '#00d2ff', fontWeight: 700, fontSize: '0.85rem' }}>Read Full Article →</span>
            </div>
          </div>
        )}

        {/* Article Grid */}
        {!loading && (search ? filtered : rest).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {(search ? filtered : rest).map(a => (
              <ArticleCard key={a.id} article={a} onOpen={setOpenArticle} />
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem' }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''} {search ? 'matching your search' : 'in this collection'}
          </div>
        )}
      </div>

      <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
    </div>
  );
}
