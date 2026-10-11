import React, { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';

export default function ReviveModal({
  isOpen,
  playerName,
  reviveHP,
  maxHP,
  onAccept,
  onReject
}) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-reject if timeout
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onReject]);

  if (!isOpen) return null;

  return (
    <div className="revive-modal-overlay">
      <div className="revive-modal-container">
        {/* Header with Icon */}
        <div className="revive-modal-header">
          <Heart size={40} className="revive-icon" />
          <h2 className="revive-modal-title">⚔️ YOU HAVE BEEN DEFEATED!</h2>
        </div>

        {/* Player Info */}
        <div className="revive-modal-info">
          <p className="revive-player-name">{playerName}</p>
          <p className="revive-text">You have a REVIVE card available!</p>
          <p className="revive-subtext">Would you like to use it to re-enter the game?</p>
        </div>

        {/* Revive Details */}
        <div className="revive-details">
          <div className="detail-row">
            <span className="detail-label">You will be restored to:</span>
            <span className="detail-value">{reviveHP} HP (50% of {maxHP})</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">✅ BACK IN GAME</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Turn:</span>
            <span className="detail-value">You may continue playing next turn</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="revive-countdown">
          <div className="countdown-text">Decision required in:</div>
          <div className={`countdown-number ${countdown <= 3 ? 'warning' : ''}`}>
            {countdown}s
          </div>
        </div>

        {/* Action Buttons */}
        <div className="revive-modal-buttons">
          <button
            className="revive-btn reject-btn"
            onClick={onReject}
          >
            <X size={20} /> Reject
          </button>
          <button
            className="revive-btn accept-btn"
            onClick={onAccept}
          >
            <Heart size={20} /> Accept Revive
          </button>
        </div>

        {/* Footer Note */}
        <div className="revive-footer">
          <small>💡 Note: You can only use REVIVE once per match. Choose wisely!</small>
        </div>
      </div>

      <style jsx>{`
        .revive-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(6px);
        }

        .revive-modal-container {
          background: linear-gradient(135deg, #2a1a1a 0%, #1a0a0a 100%);
          border: 3px solid #ff4444;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 
            0 0 40px rgba(255, 68, 68, 0.5),
            inset 0 0 20px rgba(255, 68, 68, 0.1);
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .revive-modal-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .revive-icon {
          color: #ff6b6b;
          margin-bottom: 12px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .revive-modal-title {
          font-size: 26px;
          color: #ff6b6b;
          margin: 0;
          font-weight: bold;
          text-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }

        .revive-modal-info {
          text-align: center;
          margin-bottom: 20px;
          padding: 16px;
          background: rgba(255, 68, 68, 0.05);
          border: 1px solid rgba(255, 68, 68, 0.2);
          border-radius: 8px;
        }

        .revive-player-name {
          font-size: 18px;
          color: #fbc80d;
          font-weight: bold;
          margin: 0 0 8px 0;
        }

        .revive-text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 6px 0;
        }

        .revive-subtext {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .revive-details {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 200, 13, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .detail-value {
          font-size: 14px;
          color: #39ff14;
          font-weight: bold;
        }

        .revive-countdown {
          text-align: center;
          padding: 16px;
          background: rgba(251, 200, 13, 0.1);
          border: 1px solid rgba(251, 200, 13, 0.3);
          border-radius: 8px;
          margin: 16px 0;
        }

        .countdown-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
        }

        .countdown-number {
          font-size: 28px;
          color: #fbc80d;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .countdown-number.warning {
          color: #ff6b6b;
          animation: pulse 0.5s infinite;
        }

        .revive-modal-buttons {
          display: flex;
          gap: 12px;
          margin: 24px 0 16px 0;
        }

        .revive-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .revive-btn.reject-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid #ef4444;
        }

        .revive-btn.reject-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
          transform: translateY(-2px);
        }

        .revive-btn.accept-btn {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff5555 100%);
          color: #fff;
          border: 1px solid #ff6b6b;
        }

        .revive-btn.accept-btn:hover {
          box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
          transform: translateY(-2px);
        }

        .revive-footer {
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 12px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
}
