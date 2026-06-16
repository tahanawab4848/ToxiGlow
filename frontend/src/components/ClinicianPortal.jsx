import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

const CATEGORIES = [
  { value: 'tips',       label: 'Tips & Tricks',    icon: '💡', color: '#ffc107' },
  { value: 'blog',       label: 'Clinical Blog',     icon: '📝', color: '#00d2ff' },
  { value: 'research',   label: 'Research Update',   icon: '🔬', color: '#7c4dff' },
  { value: 'guide',      label: 'Clinical Guide',    icon: '📋', color: '#00e676' },
  { value: 'case-study', label: 'Case Study',        icon: '🩺', color: '#ff6d00' },
];

const getCat = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[1];

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const next = [...tags, input.trim()].join(', ');
      onChange(next);
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1).join(', '));
    }
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', alignItems: 'center',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, minHeight: 44
    }}>
      {tags.map((t, i) => (
        <span key={i} style={{
          background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)',
          color: '#00d2ff', borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6
        }}>
          {t}
          <button onClick={() => onChange(tags.filter((_, j) => j !== i).join(', '))}
            style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', lineHeight: 1, padding: 0, fontSize: '1rem' }}>
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={addTag}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)…' : ''}
        style={{ border: 'none', background: 'none', outline: 'none', color: 'white', fontSize: '0.82rem', minWidth: 120, flex: 1 }}
      />
    </div>
  );
}

function ArticleListItem({ article, selected, onSelect, onDelete, onTogglePublish }) {
  const cat = getCat(article.category);
  return (
    <div
      onClick={() => onSelect(article)}
      style={{
        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        background: selected ? 'rgba(0,210,255,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(0,210,255,0.25)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s ease', marginBottom: 8
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem' }}>{cat.icon}</span>
            <span style={{ fontSize: '0.62rem', color: cat.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.label}</span>
            {!article.published && (
              <span style={{ fontSize: '0.6rem', color: '#ffc107', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: 999, padding: '1px 7px', fontWeight: 700 }}>DRAFT</span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {article.title}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onTogglePublish(article); }}
            title={article.published ? 'Unpublish' : 'Publish'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: article.published ? '#4caf50' : 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            {article.published ? '✅' : '⭕'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(article.id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,67,54,0.6)', fontSize: '0.9rem' }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { title: '', content: '', category: 'blog', tags: '', published: true };

export default function ClinicianPortal({ user, onBack }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(false);
  const contentRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchArticles = () => {
    setTimeout(() => setLoading(true), 0);
    fetch(`${API_BASE_URL}/api/articles?author_email=${encodeURIComponent(user.email)}&include_drafts=true`)
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => {
    if (!user?.email) return;
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleSelect = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || '',
      published: article.published,
    });
    setPreview(false);
  };

  const handleNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPreview(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required.', 'error'); return; }
    if (!form.content.trim()) { showToast('Content cannot be empty.', 'error'); return; }
    setSaving(true);

    try {
      if (editingId) {
        // Update
        const res = await fetch(`${API_BASE_URL}/api/articles/${editingId}?author_email=${encodeURIComponent(user.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        showToast('Article updated!');
      } else {
        // Create
        const res = await fetch(`${API_BASE_URL}/api/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            author_email: user.email,
            author_name: user.name,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed');
        }
        showToast('Article published!');
        handleNew();
      }
      fetchArticles();
    } catch (e) {
      showToast(e.message || 'Save failed. Check if backend is running.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this article?')) return;
    await fetch(`${API_BASE_URL}/api/articles/${id}?author_email=${encodeURIComponent(user.email)}`, { method: 'DELETE' });
    if (editingId === id) { handleNew(); }
    fetchArticles();
    showToast('Article deleted.');
  };

  const handleTogglePublish = async (article) => {
    await fetch(`${API_BASE_URL}/api/articles/${article.id}?author_email=${encodeURIComponent(user.email)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !article.published }),
    });
    fetchArticles();
    showToast(article.published ? 'Saved as draft.' : 'Published!');
  };

  const cat = getCat(form.category);
  const charCount = form.content.length;

  // Simple markdown renderer for preview
  const renderPreview = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} style={{ color: 'white', margin: '16px 0 8px', fontSize: '1.1rem' }}>{line.slice(4)}</h3>;
      if (line.startsWith('## '))  return <h2 key={i} style={{ color: 'white', margin: '20px 0 10px', fontSize: '1.3rem' }}>{line.slice(3)}</h2>;
      if (line.startsWith('# '))   return <h1 key={i} style={{ color: 'white', margin: '24px 0 12px', fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* '))
        return <li key={i} style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 4, marginLeft: 20 }}>{line.slice(2)}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 6 }}>{line}</p>;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 25% 6%)', paddingTop: 80 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 90, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(244,67,54,0.9)' : 'rgba(0,200,83,0.9)',
          color: 'white', borderRadius: 12, padding: '12px 20px',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fade-slide-down 0.3s ease-out'
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Home
          </button>
          <div style={{ fontSize: '0.7rem', color: '#00e676', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>Clinician Portal</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', marginBottom: 8 }}>
            Knowledge Base Editor
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
            Dr. <strong style={{ color: '#00e676' }}>{user?.name}</strong> · Share clinical insights, tips, research & case studies with patients
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 28, alignItems: 'start' }}>

          {/* ── Left sidebar: article list ── */}
          <div>
            <button
              onClick={handleNew}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, marginBottom: 16,
                background: 'linear-gradient(135deg, #00e676, #00b248)',
                color: 'black', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(0,230,118,0.3)'
              }}
            >
              ✏️ New Article
            </button>

            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, padding: '0 4px' }}>
              Your Articles ({articles.length})
            </div>

            {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', padding: '16px 4px' }}>Loading…</div>}

            {!loading && articles.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', padding: '20px 4px', textAlign: 'center', lineHeight: 1.6 }}>
                No articles yet.<br />Click "New Article" to start writing.
              </div>
            )}

            <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {articles.map(a => (
                <ArticleListItem
                  key={a.id}
                  article={a}
                  selected={editingId === a.id}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          </div>

          {/* ── Right: Editor ── */}
          <div style={{
            background: 'hsl(220 20% 9%)', border: '1px solid hsl(220 15% 18%)',
            borderRadius: 20, padding: '32px', position: 'sticky', top: 90
          }}>
            {/* Editor header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                {editingId ? '✏️ Editing Article' : '✨ New Article'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPreview(false)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    background: !preview ? 'rgba(0,210,255,0.12)' : 'transparent',
                    border: `1px solid ${!preview ? 'rgba(0,210,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: !preview ? '#00d2ff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  ✏️ Write
                </button>
                <button
                  onClick={() => setPreview(true)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    background: preview ? 'rgba(0,210,255,0.12)' : 'transparent',
                    border: `1px solid ${preview ? 'rgba(0,210,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: preview ? '#00d2ff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  👁 Preview
                </button>
              </div>
            </div>

            {!preview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Title */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, display: 'block', marginBottom: 8 }}>Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Enter article title…"
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: '1rem', fontWeight: 600, outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, display: 'block', marginBottom: 8 }}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setForm(f => ({ ...f, category: c.value }))}
                        style={{
                          padding: '6px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          background: form.category === c.value ? c.color + '22' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${form.category === c.value ? c.color + '60' : 'rgba(255,255,255,0.07)'}`,
                          color: form.category === c.value ? c.color : 'rgba(255,255,255,0.45)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, display: 'block', marginBottom: 8 }}>Tags</label>
                  <TagInput value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} />
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Content * (Markdown supported)</label>
                    <span style={{ fontSize: '0.65rem', color: charCount > 5000 ? '#ff9800' : 'rgba(255,255,255,0.25)' }}>{charCount.toLocaleString()} chars</span>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={'# Article Title\n\n## Introduction\n\nWrite your clinical content here. Markdown is supported.\n\n- Bullet points work\n- Keep it clear and concise\n\n## Key Points\n\nAdd your main insights...'}
                    rows={16}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12, padding: '14px 16px', color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.88rem', lineHeight: 1.7, resize: 'vertical',
                      outline: 'none', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                </div>

                {/* Publish toggle + Save */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                      borderRadius: 10, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                      background: form.published ? 'rgba(76,175,80,0.1)' : 'rgba(255,193,7,0.08)',
                      border: `1px solid ${form.published ? 'rgba(76,175,80,0.3)' : 'rgba(255,193,7,0.2)'}`,
                      color: form.published ? '#4caf50' : '#ffc107', transition: 'all 0.2s'
                    }}
                  >
                    {form.published ? '✅ Published' : '📝 Draft'}
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: '0.9rem',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: saving ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00d2ff, #0094b3)',
                      color: saving ? 'rgba(255,255,255,0.3)' : 'black', border: 'none',
                      boxShadow: saving ? 'none' : '0 4px 16px rgba(0,210,255,0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {saving ? 'Saving…' : editingId ? '💾 Update Article' : '🚀 Publish Article'}
                  </button>
                </div>
              </div>
            ) : (
              // Preview mode
              <div>
                <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat.label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>by Dr. {user?.name}</span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '2rem', color: 'white', marginBottom: 24 }}>
                  {form.title || 'Untitled Article'}
                </h1>
                <div style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.75)' }}>
                  {renderPreview(form.content || '*No content yet.*')}
                </div>
                {form.tags && (
                  <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {form.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i} style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.15)', color: '#00d2ff', borderRadius: 999, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 600 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
