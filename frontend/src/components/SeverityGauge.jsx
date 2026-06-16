import { useEffect, useState } from 'react';

export default function SeverityGauge({ score }) {
  const [rotation, setRotation] = useState(-90); // Start at 0% (-90deg)

  useEffect(() => {
    const targetRotation = -90 + (score / 100) * 180;
    const timer = setTimeout(() => {
      setRotation(targetRotation);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  // Color mapping based on score
  const getColor = () => {
    if (score <= 30) return 'hsl(var(--severity-green))';
    if (score <= 60) return 'hsl(var(--severity-yellow))';
    if (score <= 80) return 'hsl(var(--severity-orange))';
    return 'hsl(var(--severity-red))';
  };

  // Label mapping based on score
  const getLabel = () => {
    if (score <= 30) return 'Mild Concern';
    if (score <= 60) return 'Moderate Concern';
    if (score <= 80) return 'Significant Concern';
    return 'Critical Concern';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <div style={{ position: 'relative', width: '180px', height: '100px', overflow: 'hidden' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00A86B" />
              <stop offset="35%" stopColor="#F5A623" />
              <stop offset="70%" stopColor="#F57C00" />
              <stop offset="100%" stopColor="#D32F2F" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 15,90 A 75,75 0 0,1 165,90"
            fill="none"
            stroke="hsl(var(--stroke))"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Gradient Active Arc */}
          <path
            d="M 15,90 A 75,75 0 0,1 165,90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Center Hub */}
          <circle cx="90" cy="90" r="8" fill="hsl(var(--text))" />
          <circle cx="90" cy="90" r="3" fill="hsl(var(--surface))" />
        </svg>

        {/* Needle */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: 'calc(50% - 2px)',
            width: '4px',
            height: '75px',
            background: 'hsl(var(--text))',
            borderRadius: '4px',
            transformOrigin: '50% 80px',
            transform: `translateY(-10px) rotate(${rotation}deg)`,
            transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        />
      </div>

      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <div 
          className="text-display"
          style={{ 
            fontSize: '3.2rem', 
            fontWeight: '400',
            color: getColor(),
            lineHeight: 1
          }}
        >
          {score}
        </div>
        <div 
          style={{ 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            color: 'hsl(var(--text-secondary))',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '4px'
          }}
        >
          {getLabel()}
        </div>
      </div>
    </div>
  );
}
