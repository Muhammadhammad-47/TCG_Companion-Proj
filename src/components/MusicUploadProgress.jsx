import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function MusicUploadProgress({ isOpen, title, progress, status, message, onClose }) {
  if (!isOpen) return null;

  const statusColors = {
    uploading: '#00ccff',
    success: '#39ff14',
    error: '#ff8888'
  };

  const statusIcons = {
    uploading: null, // Will use spinner instead
    success: <CheckCircle size={48} />,
    error: <AlertCircle size={48} />
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(5, 10, 24, 0.98) 0%, rgba(10, 20, 40, 0.98) 100%)',
          border: '2px solid rgba(0, 200, 255, 0.5)',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 0 60px rgba(0, 200, 255, 0.3), inset 0 0 20px rgba(0, 200, 255, 0.1)',
          textAlign: 'center'
        }}
      >
        {/* Icon or Spinner */}
        <div
          style={{
            color: statusColors[status],
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            height: '64px',
            alignItems: 'center'
          }}
        >
          {status === 'uploading' ? (
            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
              <svg
                viewBox="0 0 64 64"
                style={{
                  width: '100%',
                  height: '100%',
                  animation: 'spin 2s linear infinite'
                }}
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(0, 200, 255, 0.2)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="url(#spinGradient)"
                  strokeWidth="4"
                  strokeDasharray="87.96"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="spinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0088ff" />
                    <stop offset="100%" stopColor="#00ccff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ) : (
            statusIcons[status]
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#fff',
            margin: '0 0 16px 0',
            fontFamily: 'Bebas Neue, sans-serif',
            letterSpacing: '1px'
          }}
        >
          {title}
        </h3>

        {/* Status Text */}
        <div
          style={{
            fontSize: '0.9rem',
            color: statusColors[status],
            fontWeight: 'bold',
            marginBottom: '12px',
            fontFamily: 'Bebas Neue, sans-serif'
          }}
        >
          {status === 'uploading' ? 'Uploading...' : status === 'success' ? '✓ Complete' : '✗ Failed'}
        </div>

        {/* Message */}
        {message && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 20px 0',
              lineHeight: '1.4'
            }}
          >
            {message}
          </p>
        )}

        {/* Close Button */}
        {status !== 'uploading' && (
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #0088ff 0%, #00ccff 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '0.5px',
              boxShadow: '0 0 20px rgba(0, 200, 255, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 200, 255, 0.6)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 200, 255, 0.4)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {status === 'success' ? 'Done' : 'Close'}
          </button>
        )}

        {/* Inline Styles for Animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

