'react';

export default function Footer() {
  return (
    <footer className="tg-footer" id="footer">
      <div className="tg-section-container">
        
        <div className="footer-grid">
          <div>
            <h3>ToxiGlow</h3>
            <p>
              An early warning system for wound deterioration. Not a diagnostic device.
            </p>
          </div>
          <div>
            <h3>BioNova Innovathon 2026</h3>
            <p>
              Built with React, FastAPI, OpenCV, and clinical wound assessment frameworks.
            </p>
          </div>
          <div>
            <h3>Privacy</h3>
            <p>
              All processing happens on your device. Images are never uploaded or stored.
            </p>
          </div>
        </div>

        <div className="footer-bar">
          © 2026 ToxiGlow. In an emergency, call your local emergency services immediately.
        </div>

      </div>
    </footer>
  );
}
