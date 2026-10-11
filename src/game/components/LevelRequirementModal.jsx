import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function LevelRequirementModal({
  isOpen,
  cardName,
  currentLevel,
  requiredLevel,
  nextSteps,
  onClose
}) {
  const [autoClose, setAutoClose] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setAutoClose(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="level-req-overlay">
      <div className="level-req-container">
        <div className="level-req-header">
          <AlertTriangle size={32} className="warning-icon" />
          <h2 className="level-req-title">Level Requirement</h2>
        </div>

        <div className="level-req-content">
          <div className="card-name">{cardName}</div>

          <div className="level-info">
            <div className="level-item">
              <span className="level-label">Current Level:</span>
              <span className="level-value current">{currentLevel}</span>
            </div>

            <div className="arrow">→</div>

            <div className="level-item">
              <span className="level-label">Required Level:</span>
              <span className="level-value required">{requiredLevel}</span>
            </div>
          </div>

          <div className="level-gap-message">
            ⚠️ You need {requiredLevel - currentLevel} more level{requiredLevel - currentLevel !== 1 ? 's' : ''}
          </div>

          {nextSteps && (
            <div className="next-steps">
              <div className="steps-title">How to Level Up:</div>
              <ol className="steps-list">
                {nextSteps.map((step, idx) => (
                  <li key={idx} className="step-item">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="auto-close-counter">
            Auto-closing in {autoClose}s...
          </div>
        </div>

        <div className="level-req-buttons">
          <button className="close-btn" onClick={onClose}>
            <X size={18} /> Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .level-req-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9997;
          backdrop-filter: blur(5px);
        }

        .level-req-container {
          background: linear-gradient(135deg, #2a1a1a 0%, #1a0a0a 100%);
          border: 2px solid #ff9900;
          border-radius: 12px;
          padding: 28px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 0 30px rgba(255, 153, 0, 0.3);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .level-req-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          text-align: center;
        }

        .warning-icon {
          color: #ff9900;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .level-req-title {
          font-size: 22px;
          color: #ff9900;
          margin: 0;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 153, 0, 0.3);
        }

        .level-req-content {
          margin-bottom: 20px;
        }

        .card-name {
          text-align: center;
          font-size: 16px;
          color: #fbc80d;
          font-weight: bold;
          margin-bottom: 16px;
          padding: 10px;
          background: rgba(251, 200, 13, 0.1);
          border-radius: 6px;
        }

        .level-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .level-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }

        .level-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .level-value {
          font-size: 18px;
          font-weight: bold;
        }

        .level-value.current {
          color: #60a5fa;
        }

        .level-value.required {
          color: #fca5a5;
        }

        .arrow {
          font-size: 20px;
          color: #ff9900;
          font-weight: bold;
        }

        .level-gap-message {
          text-align: center;
          color: #ff9900;
          font-size: 14px;
          padding: 10px;
          background: rgba(255, 153, 0, 0.1);
          border: 1px solid rgba(255, 153, 0, 0.3);
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .next-steps {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid #60a5fa;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .steps-title {
          font-size: 12px;
          color: #60a5fa;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .steps-list {
          margin: 0;
          padding-left: 20px;
        }

        .step-item {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .step-item:last-child {
          margin-bottom: 0;
        }

        .auto-close-counter {
          text-align: center;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 12px;
          animation: pulse 1s infinite;
        }

        .level-req-buttons {
          display: flex;
          gap: 10px;
        }

        .close-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .close-btn:hover {
          box-shadow: 0 0 15px rgba(255, 153, 0, 0.5);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
