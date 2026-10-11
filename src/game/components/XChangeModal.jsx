import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';

export default function XChangeModal({
  isOpen,
  xChangeType, // 'X1' or 'FULL'
  attackerHand,
  defenderHand,
  defenderName,
  onConfirm,
  onCancel,
  timeLimit = 30
}) {
  const [selectedAttackerCard, setSelectedAttackerCard] = useState(null);
  const [selectedDefenderCard, setSelectedDefenderCard] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showWarning, setShowWarning] = useState(false);

  const isX1 = xChangeType === 'X1';
  const availableDefenderCards = isX1 ? (defenderHand || []).slice(0, 1) : (defenderHand || []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-select if time runs out
          if (selectedAttackerCard && selectedDefenderCard) {
            handleConfirm();
          } else {
            onCancel();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAttackerCard, selectedDefenderCard]);

  useEffect(() => {
    if (timeLeft <= 5) {
      setShowWarning(true);
    }
  }, [timeLeft]);

  const handleConfirm = () => {
    if (!selectedAttackerCard || !selectedDefenderCard) {
      setShowWarning(true);
      return;
    }
    
    onConfirm({
      attackerCard: selectedAttackerCard,
      defenderCard: selectedDefenderCard
    });
  };

  if (!isOpen) return null;

  return (
    <div className="xchange-modal-overlay">
      <div className="xchange-modal-container">
        <h2 className="xchange-modal-title">🔄 X-CHANGE EXCHANGE</h2>
        <div className="xchange-modal-subtitle">
          {isX1 
            ? `Choose 1 card from your hand and 1 from ${defenderName}'s revealed card.`
            : `Exchange action cards with ${defenderName}!`
          }
        </div>

        {/* Timer */}
        <div className={`xchange-timer ${showWarning ? 'warning' : ''}`}>
          <Clock size={20} />
          <span>{timeLeft}s</span>
        </div>

        <div className="xchange-modal-content">
          {/* Attacker's Hand (Card Selection) */}
          <div className="xchange-section">
            <h3 className="xchange-section-title">YOUR ACTION CARDS</h3>
            <div className="xchange-card-grid">
              {(attackerHand || []).map((card, idx) => (
                <div
                  key={idx}
                  className={`xchange-card-option ${selectedAttackerCard?.id === card.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAttackerCard(card)}
                >
                  <div className="xchange-card-name">{card.name}</div>
                  <div className="xchange-card-type">{card.type}</div>
                  {selectedAttackerCard?.id === card.id && (
                    <div className="xchange-card-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Defender's Hand (Card Selection) - Limited visibility for X1 */}
          <div className="xchange-section">
            <h3 className="xchange-section-title">
              {isX1 ? `${defenderName}'S REVEALED CARD` : `${defenderName}'S ACTION CARDS`}
            </h3>
            <div className="xchange-card-grid">
              {availableDefenderCards.map((card, idx) => (
                <div
                  key={idx}
                  className={`xchange-card-option opponent-card ${selectedDefenderCard?.id === card.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDefenderCard(card)}
                >
                  <div className="xchange-card-name">{card.name}</div>
                  <div className="xchange-card-type">{card.type}</div>
                  {selectedDefenderCard?.id === card.id && (
                    <div className="xchange-card-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selection Confirmation */}
        <div className="xchange-modal-selection">
          {selectedAttackerCard && selectedDefenderCard && (
            <div className="xchange-selection-info">
              <div className="selection-item">
                <span className="selection-label">Giving:</span>
                <span className="selection-value">{selectedAttackerCard.name}</span>
              </div>
              <div className="selection-arrow">→</div>
              <div className="selection-item">
                <span className="selection-label">Receiving:</span>
                <span className="selection-value">{selectedDefenderCard.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        {showWarning && !selectedAttackerCard && (
          <div className="xchange-warning">
            ⚠️ Please select a card from your hand!
          </div>
        )}
        {showWarning && !selectedDefenderCard && (
          <div className="xchange-warning">
            ⚠️ Please select a card to receive!
          </div>
        )}

        {/* Action Buttons */}
        <div className="xchange-modal-buttons">
          <button
            className="xchange-btn cancel-btn"
            onClick={onCancel}
          >
            <X size={18} /> Cancel
          </button>
          <button
            className={`xchange-btn confirm-btn ${(!selectedAttackerCard || !selectedDefenderCard) ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!selectedAttackerCard || !selectedDefenderCard}
          >
            <Check size={18} /> Confirm Exchange
          </button>
        </div>
      </div>

      <style jsx>{`
        .xchange-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .xchange-modal-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #fbc80d;
          border-radius: 12px;
          padding: 24px;
          max-width: 900px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 0 30px rgba(251, 200, 13, 0.3), inset 0 0 20px rgba(251, 200, 13, 0.1);
        }

        .xchange-modal-title {
          font-size: 28px;
          color: #fbc80d;
          text-align: center;
          margin: 0 0 8px 0;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(251, 200, 13, 0.5);
        }

        .xchange-modal-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          margin: 0 0 16px 0;
        }

        .xchange-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 18px;
          color: #60a5fa;
          font-weight: bold;
          margin: 0 0 16px 0;
          padding: 8px 16px;
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid #60a5fa;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .xchange-timer.warning {
          color: #ef4444;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          animation: pulse 0.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .xchange-modal-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin: 20px 0;
        }

        @media (max-width: 768px) {
          .xchange-modal-content {
            grid-template-columns: 1fr;
          }
        }

        .xchange-section {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(251, 200, 13, 0.3);
          border-radius: 8px;
          padding: 16px;
        }

        .xchange-section-title {
          font-size: 14px;
          color: #fbc80d;
          font-weight: bold;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .xchange-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }

        .xchange-card-option {
          background: linear-gradient(135deg, #2a2a3e 0%, #1f1f2e 100%);
          border: 2px solid rgba(251, 200, 13, 0.2);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          text-align: center;
        }

        .xchange-card-option:hover {
          border-color: #fbc80d;
          background: linear-gradient(135deg, #3a3a4e 0%, #2f2f3e 100%);
          transform: translateY(-2px);
          box-shadow: 0 0 10px rgba(251, 200, 13, 0.2);
        }

        .xchange-card-option.selected {
          border-color: #39ff14;
          background: linear-gradient(135deg, #3a4e2e 0%, #2f3e1f 100%);
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
        }

        .xchange-card-option.opponent-card {
          opacity: 0.8;
        }

        .xchange-card-name {
          font-size: 12px;
          color: #ffffff;
          font-weight: bold;
          margin: 0 0 4px 0;
          white-space: normal;
          line-height: 1.2;
        }

        .xchange-card-type {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .xchange-card-check {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #39ff14;
          color: #000;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }

        .xchange-modal-selection {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid #60a5fa;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .xchange-selection-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .selection-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }

        .selection-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .selection-value {
          font-size: 14px;
          color: #60a5fa;
          font-weight: bold;
        }

        .selection-arrow {
          font-size: 20px;
          color: #fbc80d;
          font-weight: bold;
        }

        .xchange-warning {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 6px;
          padding: 10px;
          color: #fca5a5;
          font-size: 13px;
          margin: 12px 0;
          text-align: center;
        }

        .xchange-modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }

        .xchange-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .xchange-btn.cancel-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid #ef4444;
        }

        .xchange-btn.cancel-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }

        .xchange-btn.confirm-btn {
          background: linear-gradient(135deg, #39ff14 0%, #2adf0f 100%);
          color: #000;
          border: 1px solid #39ff14;
        }

        .xchange-btn.confirm-btn:hover:not(.disabled) {
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
          transform: translateY(-2px);
        }

        .xchange-btn.confirm-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
