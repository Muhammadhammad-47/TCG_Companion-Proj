import React, { useState } from 'react';
import { Bug, Camera, Send, X, AlertTriangle } from 'lucide-react';
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
  const [reportText, setReportText] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(''); // 'success' | 'error'

  const handleSubmit = async () => {
    if (!reportText.trim()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      let screenshot = null;
      if (includeScreenshot) {
        screenshot = await bugReportService.captureScreenshot();
      }

      const report = await bugReportService.submitBugReport({
        userId,
        username,
        errorType: 'manual',
        errorMessage: reportText.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        gameState,
        matchId,
        screenshot
      });

      if (report) {
        setSubmitStatus('success');
        setReportText('');
        setTimeout(() => {
          setSubmitStatus('');
          setIsOpen(false);
        }, 2000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus(''), 3000);
      }
    } catch (err) {
      console.error('[BugReportButton] Submit failed:', err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonSizes = {
    small: { fontSize: '0.75rem', padding: '6px 12px', iconSize: 14 },
    normal: { fontSize: '0.85rem', padding: '8px 16px', iconSize: 16 },
    large: { fontSize: '1rem', padding: '12px 20px', iconSize: 18 }
  };

  const sizeConfig = buttonSizes[size] || buttonSizes.normal;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'rgba(255, 42, 85, 0.1)',
          border: '1px solid rgba(255, 42, 85, 0.3)',
          borderRadius: '8px',
          color: '#ff6b8b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          fontFamily: 'Rajdhani, sans-serif',
          letterSpacing: '0.5px',
          ...sizeConfig,
          ...style
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255, 42, 85, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(255, 42, 85, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 42, 85, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 42, 85, 0.3)';
        }}
      >
        <Bug size={sizeConfig.iconSize} />
        {size !== 'small' && 'Report Bug'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'rgba(14, 22, 42, 0.95)',
              border: '2px solid rgba(255, 42, 85, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 0 40px rgba(255, 42, 85, 0.25)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 42, 85, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 42, 85, 0.3)'
                  }}
                >
                  <Bug size={20} style={{ color: '#ff2a55' }} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Report a Bug
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '2px 0 0 0', fontSize: '0.85rem' }}>
                    Help us improve by describing the issue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                Describe the issue: *
              </label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="What happened? What were you trying to do? Any error messages?"
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(5, 10, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '12px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Screenshot Option */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem'
              }}
            >
              <input
                type="checkbox"
                checked={includeScreenshot}
                onChange={(e) => setIncludeScreenshot(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <Camera size={16} />
              Include screenshot (helps with debugging)
            </label>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div
                style={{
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#39ff14',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✅ Bug report submitted successfully! Thank you for helping us improve.
              </div>
            )}

            {submitStatus === 'error' && (
              <div
                style={{
                  background: 'rgba(255, 42, 85, 0.1)',
                  border: '1px solid rgba(255, 42, 85, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ff6b8b',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} />
                {!reportText.trim() ? 'Please describe the issue.' : 'Failed to submit report. Please try again.'}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !reportText.trim()}
                style={{
                  background: isSubmitting 
                    ? 'rgba(255, 42, 85, 0.3)' 
                    : 'linear-gradient(135deg, #ff2a55, #ff6b8b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: (isSubmitting || !reportText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || !reportText.trim()) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Send size={16} />
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}