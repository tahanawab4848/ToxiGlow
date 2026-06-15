import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, hasMediaDevices, hasSpeechSynthesis } from '../config';

export default function WoundScanner({ onImageSelected, onDemoTrigger, error, setError }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Voice Guidance state and refs
  const [voiceGuideActive, setVoiceGuideActive] = useState(true);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearVoiceTimers();
    };
  }, [stream]);

  const speak = (text) => {
    if (hasSpeechSynthesis() && voiceGuideActive) {
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearVoiceTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const activateCamera = async () => {
    setError('');
    clearVoiceTimers();
    try {
      if (!hasMediaDevices()) {
        setError('Camera not supported on this device or browser.');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);

      // Start voice-guided sequence
      if (voiceGuideActive && hasSpeechSynthesis()) {
        speak("Camera activated. Position the wound in the center of your screen.");

        const t1 = setTimeout(() => {
          speak("Move your phone a little closer...");
        }, 3200);

        const t2 = setTimeout(() => {
          speak("Good. Now hold steady and press Capture when ready.");
        }, 6500);

        timersRef.current = [t1, t2];
      }

    } catch (err) {
      console.error(err);
      setError('Could not access camera. Please verify permissions.');
      setCameraActive(false);
    }
  };

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const capturePhoto = () => {
    clearVoiceTimers();
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          onImageSelected(file);
          
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          setStream(null);
          setCameraActive(false);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Format not supported. Please upload JPEG or PNG.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerUploadAnalysis = () => {
    if (selectedFile) {
      onImageSelected(selectedFile);
    }
  };

  const toggleVoiceGuide = () => {
    const nextState = !voiceGuideActive;
    setVoiceGuideActive(nextState);
    if (!nextState) {
      clearVoiceTimers();
    } else if (cameraActive) {
      speak("Voice guide enabled.");
    }
  };

  return (
    <section className="tg-section section-capture" id="assess">
      <div className="tg-section-container">
        
        <div className="section-header">
          <div className="section-eyebrow-container">
            <div className="section-eyebrow-line"></div>
            <div className="section-eyebrow">CAPTURE</div>
          </div>
          <h2 className="section-title">
            Your wound, <span className="text-display">captured</span>
          </h2>
          <p className="section-copy">
            Position the wound in good light. Place a coin or ruler nearby for size. Hold steady.
          </p>
          
          {/* Voice Guide Toggle Pill */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={toggleVoiceGuide}
              className="liquid-glass rounded-full px-5 py-2 text-xs font-semibold tracking-wider uppercase transition-all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${voiceGuideActive ? '#00d2ff' : 'rgba(255,255,255,0.1)'}`,
                color: voiceGuideActive ? '#00d2ff' : 'rgba(255,255,255,0.6)'
              }}
            >
              <span>{voiceGuideActive ? '🔊' : '🔇'}</span>
              Voice Guide: {voiceGuideActive ? 'Active' : 'Muted'}
            </button>
          </div>
        </div>

        <div className="tg-capture-grid">
          
          {/* Column A: Webcam Card */}
          <div className="tg-glass-card tg-glass-card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
            {cameraActive ? (
              <div className="tg-camera-wrapper">
                <div className="tg-camera-feed-container">
                  <video ref={videoRef} autoPlay playsInline muted className="tg-camera-feed" />
                  <div className="tg-camera-live-badge">
                    <span className="tg-camera-live-dot"></span>
                    LIVE
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button className="tg-camera-btn-capture flex-1" onClick={capturePhoto}>
                    CAPTURE PHOTO
                  </button>
                  <button 
                    className="tg-button tg-button-secondary mt-4" 
                    style={{ marginTop: '16px', padding: '12px' }}
                    onClick={() => {
                      clearVoiceTimers();
                      if (stream) stream.getTracks().forEach(track => track.stop());
                      setStream(null);
                      setCameraActive(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="tg-camera-btn-activate" onClick={activateCamera}>
                <div className="tg-camera-icon">📷</div>
                <div className="tg-camera-label" style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  Click to activate camera
                </div>
              </div>
            )}
          </div>

          {/* Desktop OR Divider */}
          <div className="tg-or-divider">OR</div>

          {/* Column B: File Upload Card */}
          <div 
            className={`tg-glass-card tg-glass-card-hover ${selectedFile ? '' : 'drag-active'}`} 
            style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={filePreview} alt="Thumbnail preview" style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'contain', marginBottom: '16px' }} />
                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text))', fontWeight: 600, marginBottom: '4px' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <button className="tg-button tg-button-primary" style={{ width: '100%' }} onClick={triggerUploadAnalysis}>
                  USE THIS IMAGE
                </button>
                <button 
                  className="tg-button tg-button-secondary" 
                  style={{ width: '100%', marginTop: '8px', padding: '10px 20px' }} 
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="tg-dropzone" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png"
                />
                <div className="tg-dropzone-icon">☁️</div>
                <div className="tg-dropzone-title">Drag & drop or click to browse</div>
                <div className="tg-dropzone-subtitle">JPG, PNG — Max 20MB</div>
              </div>
            )}
          </div>

        </div>

        {error && (
          <div className="tg-error-card animate-fade-slide-up" style={{ maxWidth: '600px', margin: '24px auto 0' }}>
            <strong>Analysis Restricted</strong>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button className="tg-button tg-button-secondary" onClick={onDemoTrigger}>
            ✨ RUN ASSESSMENT DEMO
          </button>
        </div>

      </div>
    </section>
  );
}
