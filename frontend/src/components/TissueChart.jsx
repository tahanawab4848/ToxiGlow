import React from 'react';

export default function TissueChart({ tissues }) {
  const colors = {
    Granulation: '#FF5252', // Red
    Slough: '#FFD600',      // Yellow
    Necrosis: '#3E2723',    // Dark Brown
    Epithelial: '#69F0AE'   // Light Green
  };

  const slices = Object.entries(tissues)
    .map(([name, pct]) => ({
      name,
      value: pct,
      color: colors[name] || '#999'
    }))
    .filter(slice => slice.value > 0);

  const radius = 45;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~282.74

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 120 120"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        >
          {/* Base Empty Circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="hsl(var(--stroke))"
            strokeWidth={strokeWidth}
          />
          
          {slices.map((slice, index) => {
            const strokeLength = (slice.value / 100) * circumference;
            const strokeOffset = circumference - ((accumulatedPercent / 100) * circumference);
            accumulatedPercent += slice.value;

            return (
              <circle
                key={index}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="butt"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wound</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text))' }}>Bed</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="tg-tissue-bars" style={{ width: '100%' }}>
        {Object.entries(tissues).map(([name, pct]) => (
          <div className="tg-tissue-row" key={name}>
            <div className="tg-tissue-header">
              <div className="tg-tissue-label">
                <span className="legend-swatch" style={{ background: colors[name] }}></span>
                {name}
              </div>
              <div className="tg-tissue-value">{pct.toFixed(0)}%</div>
            </div>
            <div className="tg-tissue-progress-bg">
              <div 
                className="tg-tissue-progress-fill" 
                style={{ 
                  width: `${pct}%`, 
                  background: colors[name] 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
