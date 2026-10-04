import React, { useState, useRef } from 'react';
import { MessageSquare, Send, X, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { bugReportService } from '../services/bugReportService';

export default function BugReportButton({ 
  userId = null, 
  username = 'Guest Player',
  gameState = null,
  matchId = null,
  style = {},
  size = 'normal' // 'small' | 'normal' | 'large'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(''); // 'success' | 'error'
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotPreview(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const report = await bugReportService.submitBugReport({
        userId,
        username,
        errorType: 'manual',
        errorMessage: message.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        gameState,
        matchId,
        screenshot: screenshot || null
      });

      if (report) {
        setSubmitStatus('success');
        setMessage('');
        removeScreenshot();
        setTimeout(() => {
          setSubmitStatus('');
          setIsOpen(false);
        }, 2000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus(''), 3000);
      }
    } catch (err) {
      console.error('[ContactSupport] Submit failed:', err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Prominent Contact Support Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #0088ff 0%, #00ccff 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '0.5px',
          boxShadow: '0 0 20px rgba(0, 200, 255, 0.4)',
          padding: '10px 18px',
          fontSize: '0.9rem',
          ...style
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 200, 255, 0.7)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.4)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MessageSquare size={18} />
        <span>Contact Support</span>
      </button>

      {/* In-App Modal - Fixed to viewport */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
            backdropFilter: 'blur(4px)',
            overflow: 'auto'
          }}
          onClick={() => !isSubmitting && setIsOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(5, 10, 24, 0.98) 0%, rgba(10, 20, 40, 0.98) 100%)',
              border: '2px solid rgba(0, 200, 255, 0.5)',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '550px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 0 60px rgba(0, 200, 255, 0.3), inset 0 0 20px rgba(0, 200, 255, 0.1)',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 200, 255, 0.2) 0%, rgba(0, 150, 255, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0, 200, 255, 0.5)',
                    boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)'
                  }}
                >
                  <MessageSquare size={24} style={{ color: '#00ccff' }} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                    CONTACT SUPPORT
                  </h3>
                  <p style={{ color: 'rgba(0, 200, 255, 0.8)', margin: '4px 0 0 0', fontSize: '0.85rem', fontFamily: 'Rajdhani, sans-serif' }}>
                    We're here to help
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Message Input */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#00ccff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.5px'
                }}
              >
                YOUR MESSAGE *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you need help with or what issue you're experiencing..."
                rows={5}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(5, 10, 24, 0.8)',
                  border: '1.5px solid rgba(0, 200, 255, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '14px 16px',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.6)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 200, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Screenshot Section */}
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0, 200, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 200, 255, 0.15)' }}>
              <label style={{ display: 'block', color: '#00ccff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.5px' }}>
                📸 SCREENSHOT (Optional)
              </label>

              {!screenshotPreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 200, 255, 0.15)',
                    border: '1.5px dashed rgba(0, 200, 255, 0.4)',
                    borderRadius: '10px',
                    color: '#00ccff',
                    padding: '14px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                >
                  <Upload size={18} /> Click to upload screenshot
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <img
                    src={screenshotPreview}
                    alt="preview"
                    style={{
                      maxWidth: '100px',
                      maxHeight: '100px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 200, 255, 0.3)',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <p style={{ color: '#00ccff', fontSize: '0.85rem', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                      ✓ Screenshot attached
                    </p>
                    <button
                      onClick={removeScreenshot}
                      disabled={isSubmitting}
                      style={{
                        background: 'rgba(255, 100, 100, 0.15)',
                        border: '1px solid rgba(255, 100, 100, 0.3)',
                        color: '#ff8888',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        opacity: isSubmitting ? 0.5 : 1
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={isSubmitting}
              />
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div
                style={{
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid rgba(57, 255, 20, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  color: '#39ff14',
                  fontSize: '0.9rem',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                <CheckCircle size={18} />
                Your message has been sent! Our team will respond shortly.
              </div>
            )}

            {submitStatus === 'error' && (
              <div
                style={{
                  background: 'rgba(255, 100, 100, 0.1)',
                  border: '1px solid rgba(255, 100, 100, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  color: '#ff8888',
                  fontSize: '0.9rem',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                <AlertTriangle size={18} />
                {!message.trim() ? 'Please enter your message.' : 'Failed to send. Please try again.'}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease'
                }}
              >
                Close
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim()}
                style={{
                  background: isSubmitting || !message.trim()
                    ? 'rgba(0, 200, 255, 0.2)'
                    : 'linear-gradient(135deg, #0088ff 0%, #00ccff 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  padding: '12px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: (isSubmitting || !message.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || !message.trim()) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.5px',
                  boxShadow: '0 0 20px rgba(0, 200, 255, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={16} />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}