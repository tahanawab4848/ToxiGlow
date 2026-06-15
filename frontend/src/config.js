// Centralized API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Safe localStorage access with fallback
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }
};

// Browser API feature detection
export const hasMediaDevices = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const hasSpeechSynthesis = () => {
  return !!(window.speechSynthesis);
};
