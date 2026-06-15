# TOXIGLOW — WOUND EARLY WARNING PLATFORM

Build a single-page wound assessment application using **Streamlit + Python + Custom CSS/JS + Plotly + OpenCV + MobileSAM**.

---

## Global Design System

### Design Philosophy: "Clinical Compassion"

The interface must feel like a calm, well-lit examination room. Trustworthy. Clean. Human. Never cold, never alarmist. The UI communicates: "You are in safe hands. We will help you understand what's happening."

### Fonts
Google Fonts import: **Inter** (300, 400, 500, 600, 700) and **Instrument Serif** (400, 400 italic).
- `--font-body: 'Inter', sans-serif` → applied to all UI, labels, data, buttons, narrative text
- `--font-display: 'Instrument Serif', serif` → applied to section headings, large display numbers, severity score, hero headline

### CSS Custom Properties (HSL values — no `hsl()` wrapper)
```css
--bg:           210 20% 99%     /* near-white with blue undertone */
--surface:      0 0% 100%       /* pure white cards */
--surface-alt:  210 20% 96%     /* light gray-blue for alternate backgrounds */
--text:         220 20% 10%     /* near-black with blue depth */
--text-secondary: 215 15% 40%   /* muted blue-gray for descriptions */
--text-muted:   215 15% 60%     /* placeholder, captions */
--stroke:       215 20% 90%     /* subtle borders */
--stroke-hover: 215 20% 80%     /* hover borders */
--accent:       210 100% 40%    /* medical blue */
--accent-hover: 210 100% 33%    /* darker blue hover */
--accent-light: 210 100% 95%    /* light blue backgrounds */
--severity-green:  160 80% 35%  /* healthy, healing */
--severity-yellow: 38 90% 50%   /* caution */
--severity-orange: 28 90% 50%   /* warning */
--severity-red:    0 70% 45%    /* critical, urgent */
--overlay:       220 20% 10%    /* dark overlay */
```

### Custom CSS Utility Classes
- `.text-display` → `font-family: var(--font-display); font-style: italic;`
- `.accent-gradient` → `linear-gradient(135deg, #4E85BF 0%, #89AACC 100%)`
- `.severity-gradient-green` → `linear-gradient(135deg, #00A86B 0%, #00C853 100%)`
- `.severity-gradient-yellow` → `linear-gradient(135deg, #F5A623 0%, #FFD600 100%)`
- `.severity-gradient-orange` → `linear-gradient(135deg, #F57C00 0%, #FF9100 100%)`
- `.severity-gradient-red` → `linear-gradient(135deg, #D32F2F 0%, #FF1744 100%)`
- `.glass-card` → `background: hsl(var(--surface)); border: 1px solid hsl(var(--stroke)); backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);`
- `.glass-card-hover` → `.glass-card` + `transition: all 0.3s ease; &:hover { border-color: hsl(var(--accent) / 0.3); box-shadow: 0 2px 8px rgba(0,102,204,0.08), 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-2px); }`

### Custom Animations (injected via CSS)
```css
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-slide-down {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes draw-arc {
  to { stroke-dashoffset: 0; }
}

@keyframes severity-pulse {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--severity-red) / 0.4); }
  50% { box-shadow: 0 0 0 16px hsl(var(--severity-red) / 0); }
}

@keyframes scan-line {
  0% { top: 0%; }
  100% { top: 100%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
```

### Animation Utility Classes
- `.animate-fade-slide-up` → `animation: fade-slide-up 0.6s ease-out forwards`
- `.animate-fade-slide-down` → `animation: fade-slide-down 0.4s ease-out forwards`
- `.animate-breathe` → `animation: breathe 4s ease-in-out infinite`
- `.animate-severity-pulse` → `animation: severity-pulse 2s ease-in-out infinite`
- `.animate-float` → `animation: float 4s ease-in-out infinite`
- `.animate-float-delayed` → `animation: float 4s ease-in-out 1.5s infinite`
- `.stagger-1` → `animation-delay: 0.1s`
- `.stagger-2` → `animation-delay: 0.2s`
- `.stagger-3` → `animation-delay: 0.3s`
- `.stagger-4` → `animation-delay: 0.4s`

### Forced Clean Theme
No dark mode toggle. `body` gets `bg-[hsl(var(--bg))] text-[hsl(var(--text))] font-body antialiased`.

---

## Page Structure

```
app.py
├── Navigation Bar (fixed, glass)
├── Section 1: Hero
├── Section 2: Image Capture
├── Section 3: Processing (conditional)
├── Section 4: Results Dashboard (conditional)
│   ├── 4A: Annotated Image
│   ├── 4B: Metric Cards (Severity, Infection, Tissue)
│   ├── 4C: Measurements (conditional)
│   ├── 4D: Narrative Assessment
│   ├── 4E: Action Recommendation
│   ├── 4F: Comparison (conditional)
│   └── 4G: Action Buttons + Disclaimer
├── Section 5: How It Works
├── Section 6: Footer
└── Global States: Loading, Error, Empty, Edge Cases
```

---

## Section 0: Navigation Bar

Fixed top, z-50, full width.

**Default state (scrollY < 50):**
- `bg-transparent` → no background
- `py-5` → taller padding

**Scrolled state (scrollY ≥ 50):**
- `bg-[hsl(var(--surface))]/80 backdrop-blur-xl border-b border-[hsl(var(--stroke))]`
- `py-3` → compact padding
- `shadow-sm`
- Transition: all 0.3s ease

**Inner container:** `max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between`

**Left: Logo**
- A clean medical cross icon (➕) + "ToxiGlow" in `font-display italic text-xl text-[hsl(var(--text))]`
- Subtle accent gradient underline on hover (2px height, scales from 0→1 on hover)

**Right: Nav Links**
- `text-sm font-medium text-[hsl(var(--text-secondary))]` with `hover:text-[hsl(var(--accent))]` transition
- Links: "Assess" | "How It Works" | "About"
- Spacing: `gap-8`
- Active link: `text-[hsl(var(--accent))]` with a small dot indicator below
- Smooth scroll anchors to respective sections

**Mobile (<768px):**
- Logo centered
- Hamburger menu (three stacked lines, animates to X on open)
- Slide-down menu with same links, `bg-[hsl(var(--surface))] border-b border-[hsl(var(--stroke))]`

---

## Section 1: Hero

Full viewport height. `min-h-screen flex items-center justify-center relative overflow-hidden`.

### Background
- Clean gradient: `bg-[hsl(var(--bg))]` with a subtle radial glow centered at top-right
- Radial glow: `radial-gradient(ellipse 80% 60% at 70% 20%, hsl(210, 100%, 97%) 0%, transparent 60%)`
- Subtle grid pattern overlay: repeating 60px squares, 1px lines at `hsl(var(--stroke))` at 40% opacity
- Purely CSS, no video

### Floating Elements (Decorative)
- 6 floating circles/shapes with `.accent-gradient` at 8-15% opacity
- Each has `.animate-float` with different delays
- Sizes: 40px to 120px
- Scattered across the background, blurred (filter: blur(40px))
- Adds depth without distraction

### Center Content (z-10)
Stacked vertically, text-center, max-w-[650px]:

**Eyebrow:**
- `text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-muted))] mb-6`
- "EARLY WARNING SYSTEM"
- Class: `animate-fade-slide-down`

**Headline:**
- `text-5xl md:text-7xl lg:text-8xl font-display italic leading-[0.95] tracking-tight text-[hsl(var(--text))] mb-6`
- "The early warning <br/>your wound needs."
- Class: `animate-fade-slide-up` (name-reveal pattern)

**Subheadline:**
- `text-base md:text-lg text-[hsl(var(--text-secondary))] max-w-[480px] mx-auto mb-10 leading-relaxed`
- "Take a photo. Know within seconds whether your wound needs attention — before a small problem becomes an emergency."
- Class: `animate-fade-slide-up stagger-1`

**Trust Indicators (horizontal row, centered):**
- Three pills with `gap-3`
- Each: `px-4 py-2 rounded-full bg-[hsl(var(--accent-light))] text-[hsl(var(--accent))] text-xs font-medium`
- "📸 Instant photo analysis"
- "🩺 Clinically-grounded assessment"
- "🔒 Images never leave your device"
- Class: `animate-fade-slide-up stagger-2`

**CTA Button:**
- `mt-10`
- `px-8 py-4 rounded-full text-base font-semibold text-white`
- Background: `.accent-gradient`
- `hover:scale-105 hover:shadow-lg hover:shadow-[hsl(var(--accent))/0.3]`
- `transition-all duration-300 ease-out`
- Text: "ASSESS YOUR WOUND →"
- Arrow slides 6px right on hover
- Smooth scrolls to Section 2
- Class: `animate-fade-slide-up stagger-3`

### Scroll Indicator (bottom center)
- `absolute bottom-8 left-1/2 -translate-x-1/2`
- `text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--text-muted))]` — "SCROLL"
- Below: `w-px h-8 bg-[hsl(var(--stroke))] mx-auto mt-2 relative overflow-hidden`
- Inner animated line: `absolute top-0 left-0 w-full h-full bg-[hsl(var(--accent))] animate-[scroll-down_1.5s_ease-in-out_infinite]`
- Keyframe: translateY(-100%) → translateY(200%)

### Disclaimer (subtle, bottom of hero)
- `text-xs text-[hsl(var(--text-muted))] max-w-[420px] mx-auto text-center mt-12`
- "This tool provides early warning indicators. It is not a medical diagnosis. Always consult a healthcare provider."
- Class: `animate-fade-slide-up stagger-4`

---

## Section 2: Image Capture

`py-16 md:py-24 bg-[hsl(var(--surface-alt))]`

### Header (centered)
- `text-center mb-12`
- Eyebrow: `w-8 h-px bg-[hsl(var(--stroke))] mx-auto mb-4` + "CAPTURE" in `text-xs uppercase tracking-[0.3em] text-[hsl(var(--text-muted))]`
- Heading: "Your wound, *captured*" — "captured" in `font-display italic`
- `text-3xl md:text-4xl font-bold text-[hsl(var(--text))] mb-3`
- Subtext: "Position the wound in good light. Place a coin or ruler nearby for size. Hold steady."
- `text-base text-[hsl(var(--text-secondary))] max-w-[500px] mx-auto`

### Two-Column Layout
`max-w-[1000px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6`

**Column A: Webcam Capture**
- `.glass-card p-6 flex flex-col items-center`
- When INACTIVE:
  - Large camera icon (📷) `text-5xl opacity-30 mb-4`
  - "Click to activate camera" `text-sm text-[hsl(var(--text-muted))]`
  - Entire card clickable, `cursor-pointer`
- When ACTIVE:
  - Live video feed, `rounded-xl overflow-hidden border-2 border-[hsl(var(--accent))]`
  - "LIVE" indicator: `absolute top-3 left-3 flex items-center gap-2`
  - Red dot (8px, pulsing, `bg-[hsl(var(--severity-red))] rounded-full animate-pulse`) + "LIVE" `text-xs font-semibold text-[hsl(var(--severity-red))]`
- Button: "CAPTURE PHOTO" — `w-full mt-4 py-3 rounded-full font-semibold text-white bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] transition-all`

**Column B: File Upload**
- `.glass-card p-6 flex flex-col items-center justify-center min-h-[320px]`
- When EMPTY:
  - Upload icon (☁️) `text-5xl opacity-30 mb-4`
  - "Drag & drop or click to browse" `text-sm text-[hsl(var(--text-secondary))]`
  - "JPG, PNG, HEIC — Max 20MB" `text-xs text-[hsl(var(--text-muted))] mt-2`
  - `border-2 border-dashed border-[hsl(var(--stroke))] rounded-xl`
  - Drag-over state: `border-[hsl(var(--accent))] bg-[hsl(var(--accent-light))]`
- When FILE SELECTED:
  - `border-solid border-[hsl(var(--accent))]`
  - Image thumbnail: `max-h-[200px] rounded-lg object-contain mb-3`
  - Filename + size in `text-sm text-[hsl(var(--text))]`
  - "USE THIS IMAGE" button

**OR Divider (desktop):**
- `hidden md:flex absolute left-1/2 -translate-x-1/2`
- Vertical line + "OR" circle

---

## Section 3: Image Confirmation

Appears after capture/upload. `max-w-[700px] mx-auto px-6 py-12 text-center`.

- Captured image: `max-h-[450px] mx-auto rounded-2xl shadow-lg mb-8`
- Two buttons side-by-side:
  - "ANALYZE WOUND" — `py-4 px-8 rounded-full font-semibold text-white bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-hover))] transition-all` with 🔬 icon
  - "Retake" — `py-4 px-8 rounded-full font-medium text-[hsl(var(--text-secondary))] border-2 border-[hsl(var(--stroke))] hover:border-[hsl(var(--accent))] transition-all` with ↩️ icon
- Guidance: "Analysis is instant and stays on your device." `text-xs text-[hsl(var(--text-muted))] mt-4`

---

## Section 4: Processing

Appears after clicking ANALYZE. `max-w-[500px] mx-auto px-6 py-16 text-center`.

**Processing Animation:**
- NOT a spinner. A pulsing ring:
  - 3 concentric circles centered on a wound icon (🩹, 28px)
  - Each circle: `border-2 border-[hsl(var(--accent))] rounded-full absolute`
  - Animation: `pulse-ring 1.5s ease-out infinite`
  - Delays: 0s, 0.3s, 0.6s
  - Size: 60px, 80px, 100px diameters

**Title:** "Analyzing your wound..." `text-lg font-semibold mt-8 mb-6`

**Stage Indicators (vertical list):**
Each row: `flex items-center gap-3 text-sm text-[hsl(var(--text-secondary))] mb-3`

1. "Detecting wound boundaries..." → becomes "✓ Wound mapped" in `text-[hsl(var(--severity-green))]`
2. "Classifying tissue types..." → becomes "✓ Tissue analyzed"
3. "Checking infection indicators..." → becomes "✓ Indicators checked"
4. "Generating your assessment..." → becomes "✓ Assessment ready"

Stages complete sequentially. Checkmark draws itself with SVG stroke animation.

**Timeout (>30s):**
- ⚠️ icon, "Taking longer than expected..."
- "Try again" button

**Error:**
- ⚠️ icon, specific error message, retry guidance

---

## Section 5: Results Dashboard

Appears after processing. Smooth fade-slide-up. `max-w-[1100px] mx-auto px-6 py-12`.

---

### 5A: Annotated Wound Image

`.glass-card overflow-hidden relative mb-8`

- User's image: `max-h-[500px] w-full object-contain rounded-xl`
- **Overlays rendered ON the image:**
  - Wound boundary: `3px solid #00BCD4` with `box-shadow: 0 0 12px rgba(0,188,212,0.3)`
  - Tissue classification overlay at 40% opacity:
    - Red (#FF5252) = Granulation
    - Yellow (#FFD600) = Slough
    - Dark brown (#3E2723) = Necrosis
    - Light green (#69F0AE) = Epithelial
  - Scale bar (bottom-left): `bg-black/60 text-white text-xs px-3 py-1.5 rounded-md` — "├── 1 cm ──┤" (only if reference detected)
  - Tissue legend (top-right): small white card with 4 color swatches + labels

**If no wound detected:** Banner across top: "No clear wound boundary detected." `bg-amber-50 text-amber-700`

---

### 5B: Metric Cards

`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8`

**Card 1: Severity Score**
- `.glass-card p-6 text-center`
- Title: "Severity Score" `text-xs uppercase tracking-[0.2em] text-[hsl(var(--text-muted))] mb-6`
- SVG gauge: semi-circular arc with gradient color bands
  - 0–30: `hsl(var(--severity-green))`
  - 31–60: `hsl(var(--severity-yellow))`
  - 61–80: `hsl(var(--severity-orange))`
  - 81–100: `hsl(var(--severity-red))`
  - Needle animates from 0 to score over 1.2s, `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Score number: `text-5xl font-display italic` in severity color
- Label: "Mild Concern" / "Moderate" / "Significant" / "Critical" `text-lg font-semibold`

**Card 2: Infection Indicators**
- `.glass-card p-6`
- Title: same style
- Risk icon (large, centered, 40px):
  - Low: 🛡️ green
  - Moderate: ⚠️ yellow
  - High: 🟠 orange
  - Critical: 🔴 red
- Risk text: "Low Risk" / "Moderate Risk" / "High Risk" / "Critical Risk"
- Indicator checklist:
  - Erythema: ✓ or ⚠️ with cm measurement
  - Exudate: ✓ or ⚠️ with description
  - Tissue health: ✓ or ⚠️ with necrosis %
  - Wound edge: ✓ or ⚠️

**Card 3: Tissue Composition**
- `.glass-card p-6 text-center`
- Title: same style
- Plotly donut chart (clean, white bg, no gridlines)
- Segments animate on draw
- Center text: "Wound Bed"
- Legend below with percentages and explanations

---

### 5C: Measurements (Conditional)

`mb-8` — only if reference object detected.
- `.glass-card p-6`
- Three inline stats: "X.X cm² Area" | "X.X cm Perimeter" | "X.X cm Max Diameter"
- If no reference: informational note "Add a coin or ruler next time for measurements"

---

### 5D: Narrative Assessment

`.glass-card p-6 mb-8 border-l-4 border-[hsl(var(--accent))]`

- Title: "📋 Assessment Summary" `text-lg font-semibold mb-4`
- Body: 4–6 sentence plain-language paragraph
  - 6th-grade reading level
  - Never says "diagnosis"
  - Uses "signs consistent with..." / "may indicate..." / "suggests..."
  - Mentions healthy findings first, then concerns
  - Ends with clear guidance
  - `text-base leading-relaxed text-[hsl(var(--text))]`

---

### 5E: Action Recommendation

`.glass-card p-6 mb-8` with colored left border (6px)

**Four variants:**

| Severity | Background | Border | Icon | Title |
|---|---|---|---|---|
| Mild (0–30) | `bg-green-50` | `hsl(var(--severity-green))` | ✅ | "Continue Monitoring — Healing as Expected" |
| Moderate (31–60) | `bg-amber-50` | `hsl(var(--severity-yellow))` | ⚠️ | "Schedule a Clinical Review — Moderate Concern" |
| Severe (61–80) | `bg-orange-50` | `hsl(var(--severity-orange))` | 🟠 | "Seek Medical Attention Within 24 Hours" |
| Critical (81–100) | `bg-red-50` | `hsl(var(--severity-red))` | 🔴 | "URGENT — Seek Emergency Care Immediately" |

Critical variant: `.animate-severity-pulse` on the border.

Body text: specific, actionable, calm but clear. Mentions specific findings. Gives timeframe.

---

### 5F: Comparison (Conditional)

Collapsible `.glass-card p-6 mb-8`.
- Header: "📅 Compare with Previous Assessment"
- Expanded: side-by-side images, delta indicators
  - Area: ↓ XX% (green) or ↑ XX% (red)
  - Tissue changes
  - Healing trajectory: ON TRACK / SLOW / STALLED / DETERIORATING

---

### 5G: Action Buttons + Disclaimer

`text-center`

- "📥 DOWNLOAD ASSESSMENT REPORT" — `py-4 px-8 rounded-full font-semibold text-white bg-[hsl(var(--accent))]`
- "🔄 NEW ASSESSMENT" — `py-4 px-8 rounded-full font-medium border-2 border-[hsl(var(--stroke))]`
- Disclaimer: `text-xs text-[hsl(var(--text-muted))] max-w-[600px] mx-auto mt-6`

---

## Section 6: How It Works

`py-16 md:py-24 bg-[hsl(var(--surface-alt))]`

### Header
- Eyebrow + "How ToxiGlow *works*" (italic)

**Three Cards (grid grid-cols-1 md:grid-cols-3 gap-6):**
Each: `.glass-card-hover p-8 text-center`

1. **📸 Capture** — "Take a clear photo of your wound with your phone or upload an existing image. Add a coin for automatic size measurement."
2. **🔬 Analyze** — "Our AI detects wound boundaries, classifies tissue types, and checks for visual signs of infection — all on your device, in seconds."
3. **🩺 Act** — "Get a clear, plain-language assessment with specific guidance: monitor, schedule a review, or seek urgent care."

Connecting arrows between cards (desktop): SVG dashed lines with animated flow.

---

## Section 7: Footer

`bg-[hsl(var(--text))] text-[hsl(var(--text-muted))] py-12`

Three columns:
1. **ToxiGlow** — "An early warning system for wound deterioration. Not a diagnostic device."
2. **BioNova Innovathon 2026** — "Built with Streamlit, OpenCV, MobileSAM, and clinical wound assessment frameworks."
3. **Privacy** — "All processing happens on your device. Images are never uploaded or stored."

Bottom bar: "© 2026 ToxiGlow. In an emergency, call your local emergency services immediately."

---

## Global States

### Loading (Initial Page Load)
- Full-screen white overlay
- Centered: ToxiGlow logo with subtle breathe animation
- Fades out over 0.6s

### Error States
- Specific, helpful messages. Never generic "Something went wrong."
- Always offer a retry path.
- Friendly tone, not technical blame.

### Empty States
- Informational, not broken. Guide the user to the next step.

### Edge Cases
- No wound detected: clear message, retry guidance
- Poor image quality: specific reason (blurry/dark/bright), retry guidance
- No reference object: informational note, not an error
- Webcam denied: alternative upload path
- File too large / wrong format: specific error

---

## Technical Stack
- **Framework:** Streamlit
- **Computer Vision:** OpenCV, scikit-image, MobileSAM, scikit-learn
- **Numerical:** NumPy, SciPy
- **Charts:** Plotly (clean theme, transparent backgrounds)
- **PDF:** fpdf2
- **Custom Styling:** Injected CSS via `st.markdown(unsafe_allow_html=True)`
- **Custom JS:** Scroll animations, SVG gauge, counters via `st.components.v1.html()`

---

## Build This Exactly

Every section specified. Every state defined. Every animation choreographed. Every pixel intentional. ToxiGlow is an early warning system that feels like a trusted medical instrument — precise, calm, and genuinely helpful to someone who is worried and needs clear guidance.
