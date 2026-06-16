'react';

export default function HowItWorks() {
  return (
    <section className="tg-section section-how-it-works" id="how-it-works">
      <div className="tg-section-container">
        
        <div className="section-header">
          <div className="section-eyebrow-container">
            <div className="section-eyebrow-line"></div>
            <div className="section-eyebrow">PROCESS</div>
          </div>
          <h2 className="section-title">
            How ToxiGlow <span className="text-display">works</span>
          </h2>
        </div>

        <div className="how-grid">
          
          <div className="how-card tg-glass-card tg-glass-card-hover">
            <div className="how-icon">📸</div>
            <h3>1. Capture</h3>
            <p>
              Take a clear photo of your wound with your phone or upload an existing image. Add a coin for automatic size measurement.
            </p>
          </div>

          <div className="how-card tg-glass-card tg-glass-card-hover">
            <div className="how-icon">🔬</div>
            <h3>2. Analyze</h3>
            <p>
              Our AI detects wound boundaries, classifies tissue types, and checks for visual signs of infection — all on your device, in seconds.
            </p>
          </div>

          <div className="how-card tg-glass-card tg-glass-card-hover">
            <div className="how-icon">🩺</div>
            <h3>3. Act</h3>
            <p>
              Get a clear, plain-language assessment with specific guidance: monitor, schedule a review, or seek urgent care.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
