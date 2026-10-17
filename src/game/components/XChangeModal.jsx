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
  // Track selections by index for reliable matching even without unique IDs
  const [selectedAttackerIdx, setSelectedAttackerIdx] = useState(null);
  const [selectedDefenderIdx, setSelectedDefenderIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showWarning, setShowWarning] = useState(false);

  const isX1 = xChangeType === 'X1';
  const availableDefenderCards = defenderHand || [];
  const myCards = attackerHand || [];

  const selectedAttackerCard = selectedAttackerIdx !== null ? myCards[selectedAttackerIdx] : null;
  const selectedDefenderCard = selectedDefenderIdx !== null ? availableDefenderCards[selectedDefenderIdx] : null;

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
      defenderCard: selectedDefenderCard,
      attackerCardIdx: selectedAttackerIdx,
      defenderCardIdx: selectedDefenderIdx
    });
  };

  if (!isOpen) return null;

  return (
    <div className="xchange-modal-overlay">
      <div className="xchange-modal-container">
        <h2 className="xchange-modal-title">🔄 X-CHANGE CARD EXCHANGE</h2>
        <div className="xchange-modal-subtitle">
          View all of {defenderName}&apos;s cards. Select 1 card to take and 1 card from your Action Card deck to discard/give.
        </div>

        {/* Timer */}
        <div className={`xchange-timer ${showWarning ? 'warning' : ''}`}>
          <Clock size={20} />
          <span>{timeLeft}s remaining</span>
        </div>

        <div className="xchange-modal-content">
          {/* Attacker's Hand (Card Selection) */}
          <div className="xchange-section">
            <h3 className="xchange-section-title">YOUR ACTION CARDS (SELECT 1 TO GIVE)</h3>
            <div className="xchange-card-grid">
              {myCards.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', padding: '12px' }}>
                  No action cards available in hand
                </div>
              ) : (
                myCards.map((card, idx) => {
                  const isSelected = selectedAttackerIdx === idx;
                  return (
                    <div
                      key={`my-${card.id || idx}-${idx}`}
                      className={`xchange-card-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAttackerIdx(idx);
                        setShowWarning(false);
                      }}
                    >
                      <div className="xchange-card-name">{card.name}</div>
                      <div className="xchange-card-type">{card.type}</div>
                      {isSelected && (
                        <div className="xchange-card-check">✓</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Defender's Hand (Card Selection) */}
          <div className="xchange-section">
            <h3 className="xchange-section-title">
              {defenderName.toUpperCase()}&apos;S ACTION CARDS (SELECT 1 TO TAKE)
            </h3>
            <div className="xchange-card-grid">
              {availableDefenderCards.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', padding: '12px' }}>
                  Opponent has no action cards in hand
                </div>
              ) : (
                availableDefenderCards.map((card, idx) => {
                  const isSelected = selectedDefenderIdx === idx;
                  return (
                    <div
                      key={`opp-${card.id || idx}-${idx}`}
                      className={`xchange-card-option opponent-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDefenderIdx(idx);
                        setShowWarning(false);
                      }}
                    >
                      <div className="xchange-card-name">{card.name}</div>
                      <div className="xchange-card-type">{card.type}</div>
                      {isSelected && (
                        <div className="xchange-card-check">✓</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selection Confirmation */}
        <div className="xchange-modal-selection">
          {selectedAttackerCard && selectedDefenderCard ? (
            <div className="xchange-selection-info">
              <div className="selection-item">
                <span className="selection-label">Giving / Discarding:</span>
                <span className="selection-value" style={{ color: '#ff8899' }}>{selectedAttackerCard.name}</span>
              </div>
              <div className="selection-arrow">🔄</div>
              <div className="selection-item">
                <span className="selection-label">Taking from Opponent:</span>
                <span className="selection-value" style={{ color: '#39ff14' }}>{selectedDefenderCard.name}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              {!selectedAttackerCard && !selectedDefenderCard
                ? '👉 Click 1 card from your hand to give, and 1 card from opponent to take.'
                : !selectedAttackerCard
                ? '👉 Click 1 card from your hand to give.'
                : '👉 Click 1 card from opponent hand to take.'}
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
