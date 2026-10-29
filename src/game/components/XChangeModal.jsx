import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { getCardGraphicUrl } from '../kontrola/kontrolaAssets';

export default function XChangeModal({
  isOpen,
  xChangeType = 'X1', // 'X1' or 'FULL'
  attackerHand = [],
  defenderHand = [],
  defenderName = 'Opponent',
  onConfirm,
  onCancel,
  timeLimit = 30
}) {
  // Track selections by index for reliable matching
  const [selectedAttackerIdx, setSelectedAttackerIdx] = useState(null);
  const [selectedDefenderIdx, setSelectedDefenderIdx] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showWarning, setShowWarning] = useState(false);

  const safeDefenderName = (typeof defenderName === 'string' && defenderName.trim()) 
    ? defenderName.trim() 
    : 'Opponent';

  const myCards = (attackerHand || []).filter(Boolean);
  const availableDefenderCards = (defenderHand || []).filter(Boolean);

  const selectedAttackerCard = selectedAttackerIdx !== null ? myCards[selectedAttackerIdx] : null;
  const selectedDefenderCard = selectedDefenderIdx !== null ? availableDefenderCards[selectedDefenderIdx] : null;

  const getCardName = (card) => {
    if (!card) return 'Action Card';
    if (typeof card === 'string') return card;
    return card.name || 'Action Card';
  };

  const getCardType = (card) => {
    if (!card || typeof card === 'string') return 'ACTION';
    return card.type || 'ACTION';
  };

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedAttackerIdx(null);
      setSelectedDefenderIdx(null);
      setTimeLeft(timeLimit);
      setShowWarning(false);
    }
  }, [isOpen, timeLimit]);

  // Dedicated timer countdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Handle timer expiration outside setState updater
  useEffect(() => {
    if (!isOpen) return;
    if (timeLeft === 0) {
      if (selectedAttackerCard && selectedDefenderCard) {
        handleConfirm();
      } else if (onCancel) {
        onCancel();
      }
    } else if (timeLeft <= 5) {
      setShowWarning(true);
    }
  }, [timeLeft, isOpen, selectedAttackerCard, selectedDefenderCard]);

  const handleConfirm = () => {
    if (!selectedAttackerCard || !selectedDefenderCard) {
      setShowWarning(true);
      return;
    }
    
    if (onConfirm) {
      onConfirm({
        attackerCard: selectedAttackerCard,
        defenderCard: selectedDefenderCard,
        attackerCardIdx: selectedAttackerIdx,
        defenderCardIdx: selectedDefenderIdx
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="xchange-modal-overlay">
      <div className="xchange-modal-container">
        <h2 className="xchange-modal-title">🔄 X-CHANGE CARD EXCHANGE</h2>
        <div className="xchange-modal-subtitle">
          View all of {safeDefenderName}&apos;s cards. Select 1 card to take and 1 card from your Action Card deck to discard/give.
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
                  const cName = getCardName(card);
                  const cType = getCardType(card);
                  const cImg = getCardGraphicUrl(cName);
                  const key = typeof card === 'object' && card?.id ? `my-${card.id}-${idx}` : `my-${cName}-${idx}`;
                  return (
                    <div
                      key={key}
                      className={`xchange-card-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAttackerIdx(idx);
                        setShowWarning(false);
                      }}
                    >
                      {cImg && (
                        <img
                          src={cImg}
                          alt={cName}
                          className="xchange-card-img"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="xchange-card-name">{cName}</div>
                      <div className="xchange-card-type">{cType}</div>
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
              {safeDefenderName.toUpperCase()}&apos;S ACTION CARDS (SELECT 1 TO TAKE)
            </h3>
            <div className="xchange-card-grid">
              {availableDefenderCards.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', padding: '12px' }}>
                  Opponent has no action cards in hand
                </div>
              ) : (
                availableDefenderCards.map((card, idx) => {
                  const isSelected = selectedDefenderIdx === idx;
                  const cName = getCardName(card);
                  const cType = getCardType(card);
                  const cImg = getCardGraphicUrl(cName);
                  const key = typeof card === 'object' && card?.id ? `opp-${card.id}-${idx}` : `opp-${cName}-${idx}`;
                  return (
                    <div
                      key={key}
                      className={`xchange-card-option opponent-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDefenderIdx(idx);
                        setShowWarning(false);
                      }}
                    >
                      {cImg && (
                        <img
                          src={cImg}
                          alt={cName}
                          className="xchange-card-img"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="xchange-card-name">{cName}</div>
                      <div className="xchange-card-type">{cType}</div>
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
                <span className="selection-value" style={{ color: '#ff8899' }}>{getCardName(selectedAttackerCard)}</span>
              </div>
              <div className="selection-arrow">🔄</div>
              <div className="selection-item">
                <span className="selection-label">Taking from Opponent:</span>
                <span className="selection-value" style={{ color: '#39ff14' }}>{getCardName(selectedDefenderCard)}</span>
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
            ⚠️ Please select a card from your hand to give!
          </div>
        )}
        {showWarning && !selectedDefenderCard && (
          <div className="xchange-warning">
            ⚠️ Please select a card from opponent to take!
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
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          backdrop-filter: blur(6px);
        }

        .xchange-modal-container {
          background: linear-gradient(135deg, #101828 0%, #0a0f1d 100%);
          border: 2px solid #00f0ff;
          border-radius: 16px;
          padding: 24px;
          max-width: 920px;
          width: 92%;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 0 35px rgba(0, 240, 255, 0.35), inset 0 0 20px rgba(0, 240, 255, 0.08);
          font-family: 'Barlow Condensed', sans-serif;
        }

        .xchange-modal-title {
          font-size: 26px;
          color: #00f0ff;
          text-align: center;
          margin: 0 0 6px 0;
          font-weight: 900;
          text-shadow: 0 0 12px rgba(0, 240, 255, 0.5);
          letter-spacing: 1px;
        }

        .xchange-modal-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
          text-align: center;
          margin: 0 0 14px 0;
        }

        .xchange-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          color: #00f0ff;
          font-weight: bold;
          margin: 0 auto 16px auto;
          max-width: 200px;
          padding: 6px 14px;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid #00f0ff;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .xchange-timer.warning {
          color: #ff2a55;
          border-color: #ff2a55;
          background: rgba(255, 42, 85, 0.15);
          animation: pulse 0.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .xchange-modal-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 16px 0;
        }

        @media (max-width: 768px) {
          .xchange-modal-content {
            grid-template-columns: 1fr;
          }
        }

        .xchange-section {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(0, 240, 255, 0.25);
          border-radius: 12px;
          padding: 14px;
        }

        .xchange-section-title {
          font-size: 13px;
          color: #00f0ff;
          font-weight: 800;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .xchange-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
          max-height: 38vh;
          overflow-y: auto;
          padding-right: 4px;
        }

        .xchange-card-option {
          background: linear-gradient(135deg, rgba(20, 28, 48, 0.95) 0%, rgba(12, 18, 32, 0.95) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .xchange-card-option:hover {
          border-color: #00f0ff;
          background: linear-gradient(135deg, rgba(26, 38, 66, 0.95) 0%, rgba(16, 25, 46, 0.95) 100%);
          transform: translateY(-2px);
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
        }

        .xchange-card-option.selected {
          border-color: #39ff14;
          background: linear-gradient(135deg, rgba(20, 60, 30, 0.95) 0%, rgba(10, 35, 18, 0.95) 100%);
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.45);
        }

        .xchange-card-option.opponent-card {
          border-color: rgba(251, 200, 13, 0.3);
        }

        .xchange-card-option.opponent-card:hover {
          border-color: #fbc80d;
          box-shadow: 0 0 12px rgba(251, 200, 13, 0.3);
        }

        .xchange-card-img {
          width: 100%;
          height: 100px;
          object-fit: contain;
          border-radius: 6px;
          margin-bottom: 6px;
          background: rgba(0, 0, 0, 0.3);
        }

        .xchange-card-name {
          font-size: 11px;
          color: #ffffff;
          font-weight: 800;
          margin: 0 0 2px 0;
          white-space: normal;
          line-height: 1.15;
          letter-spacing: 0.5px;
        }

        .xchange-card-type {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          margin: 0;
        }

        .xchange-card-check {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #39ff14;
          color: #000;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 11px;
          box-shadow: 0 0 8px rgba(57, 255, 20, 0.6);
        }

        .xchange-modal-selection {
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 10px;
          padding: 12px 16px;
          margin: 14px 0;
        }

        .xchange-selection-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .selection-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: center;
        }

        .selection-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .selection-value {
          font-size: 14px;
          color: #00f0ff;
          font-weight: bold;
        }

        .selection-arrow {
          font-size: 20px;
          color: #fbc80d;
          font-weight: bold;
        }

        .xchange-warning {
          background: rgba(255, 42, 85, 0.15);
          border: 1px solid #ff2a55;
          border-radius: 8px;
          padding: 8px 12px;
          color: #ff8899;
          font-size: 13px;
          margin: 10px 0;
          text-align: center;
          font-weight: bold;
        }

        .xchange-modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 16px;
        }

        .xchange-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 28px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: inherit;
        }

        .xchange-btn.cancel-btn {
          background: rgba(255, 42, 85, 0.18);
          color: #ff8899;
          border: 1px solid #ff2a55;
        }

        .xchange-btn.cancel-btn:hover {
          background: rgba(255, 42, 85, 0.3);
          box-shadow: 0 0 12px rgba(255, 42, 85, 0.35);
        }

        .xchange-btn.confirm-btn {
          background: linear-gradient(135deg, #39ff14 0%, #20c800 100%);
          color: #000;
          border: 1px solid #39ff14;
        }

        .xchange-btn.confirm-btn:hover:not(.disabled) {
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.6);
          transform: translateY(-1px);
        }

        .xchange-btn.confirm-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.6);
        }
      `}</style>
    </div>
  );
}
