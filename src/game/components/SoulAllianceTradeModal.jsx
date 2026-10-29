import React, { useState } from 'react';
import { Gift, Zap, X, Check } from 'lucide-react';

export default function SoulAllianceTradeModal({
  isOpen,
  playerName,
  allyName,
  playerHand,
  playerEnergyTokens,
  onTrade,
  onCancel
}) {
  const [tradeType, setTradeType] = useState('REVIVE'); // 'REVIVE' or 'ENERGY_TOKENS'
  const [selectedReviveCard, setSelectedReviveCard] = useState(null);
  const [energyAmount, setEnergyAmount] = useState(1);

  const getCardName = (c) => typeof c === 'string' ? c : (c?.name || 'REVIVE');
  const getCardType = (c) => typeof c === 'object' && c?.type ? c.type : 'HEAL';

  const reviveCards = playerHand?.filter(c => getCardName(c).toUpperCase().includes('REVIVE')) || [];
  const hasReviveCards = reviveCards.length > 0;

  const handleTrade = () => {
    if (tradeType === 'REVIVE') {
      if (!selectedReviveCard) {
        alert('Please select a REVIVE card to trade');
        return;
      }
      onTrade({ type: 'REVIVE', card: selectedReviveCard });
    } else if (tradeType === 'ENERGY_TOKENS') {
      if (energyAmount <= 0 || energyAmount > playerEnergyTokens) {
        alert(`Please select valid amount (1-${playerEnergyTokens})`);
        return;
      }
      onTrade({ type: 'ENERGY_TOKENS', amount: energyAmount });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trade-modal-overlay">
      <div className="trade-modal-container">
        <h2 className="trade-modal-title">🤝 SOUL ALLIANCE TRADE</h2>
        <p className="trade-modal-subtitle">
          Trade with {allyName}
        </p>

        {/* Trade Type Selection */}
        <div className="trade-type-selector">
          <button
            className={`trade-type-btn ${tradeType === 'REVIVE' ? 'active' : ''}`}
            onClick={() => {
              setTradeType('REVIVE');
              setSelectedReviveCard(null);
            }}
            disabled={!hasReviveCards}
          >
            💀 REVIVE Card
          </button>
          <button
            className={`trade-type-btn ${tradeType === 'ENERGY_TOKENS' ? 'active' : ''}`}
            onClick={() => setTradeType('ENERGY_TOKENS')}
            disabled={playerEnergyTokens <= 0}
          >
            ⚡ Energy Tokens
          </button>
        </div>

        {/* REVIVE Card Selection */}
        {tradeType === 'REVIVE' && (
          <div className="trade-content">
            <h3 className="trade-section-title">Select REVIVE Card to Trade</h3>
            {hasReviveCards ? (
              <div className="revive-card-grid">
                {reviveCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`revive-option ${selectedReviveCard === card ? 'selected' : ''}`}
                    onClick={() => setSelectedReviveCard(card)}
                  >
                    <div className="card-icon">💀</div>
                    <div className="card-name">{getCardName(card)}</div>
                    <div className="card-type">{getCardType(card)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-cards-message">
                ⚠️ You don't have any REVIVE cards to trade.
              </div>
            )}
            {selectedReviveCard && (
              <div className="trade-preview">
                <strong>Sending to {allyName}:</strong> {getCardName(selectedReviveCard)}
              </div>
            )}
          </div>
        )}

        {/* Energy Token Selection */}
        {tradeType === 'ENERGY_TOKENS' && (
          <div className="trade-content">
            <h3 className="trade-section-title">Select Energy Tokens to Trade</h3>
            <div className="energy-selector">
              <div className="available-tokens">
                You have: <strong>{playerEnergyTokens} ET</strong>
              </div>
              <div className="energy-input-group">
                <label>Amount to trade:</label>
                <div className="energy-controls">
                  <button
                    className="energy-btn"
                    onClick={() => setEnergyAmount(Math.max(1, energyAmount - 1))}
                    disabled={energyAmount <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={playerEnergyTokens}
                    value={energyAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setEnergyAmount(Math.max(1, Math.min(val, playerEnergyTokens)));
                    }}
                    className="energy-input"
                  />
                  <button
                    className="energy-btn"
                    onClick={() => setEnergyAmount(Math.min(playerEnergyTokens, energyAmount + 1))}
                    disabled={energyAmount >= playerEnergyTokens}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="trade-preview">
                <strong>Sending to {allyName}:</strong> {energyAmount} Energy Token{energyAmount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="trade-modal-buttons">
          <button
            className="trade-btn cancel-btn"
            onClick={onCancel}
          >
            <X size={18} /> Cancel
          </button>
          <button
            className="trade-btn confirm-btn"
            onClick={handleTrade}
            disabled={
              (tradeType === 'REVIVE' && !selectedReviveCard) ||
              (tradeType === 'ENERGY_TOKENS' && (energyAmount <= 0 || energyAmount > playerEnergyTokens))
            }
          >
            <Check size={18} /> Confirm Trade
          </button>
        </div>
      </div>

      <style jsx>{`
        .trade-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          backdrop-filter: blur(4px);
        }

        .trade-modal-container {
          background: linear-gradient(135deg, #1a2a3a 0%, #0f1a2a 100%);
          border: 2px solid #fbc80d;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 0 30px rgba(251, 200, 13, 0.3);
        }

        .trade-modal-title {
          font-size: 24px;
          color: #fbc80d;
          text-align: center;
          margin: 0 0 8px 0;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(251, 200, 13, 0.5);
        }

        .trade-modal-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          margin: 0 0 16px 0;
        }

        .trade-type-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .trade-type-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid rgba(251, 200, 13, 0.3);
          background: rgba(0, 0, 0, 0.3);
          color: rgba(255, 255, 255, 0.6);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: bold;
        }

        .trade-type-btn:hover:not(:disabled) {
          border-color: #fbc80d;
          color: #fbc80d;
        }

        .trade-type-btn.active {
          border-color: #39ff14;
          background: rgba(57, 255, 20, 0.1);
          color: #39ff14;
        }

        .trade-type-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .trade-content {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(251, 200, 13, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .trade-section-title {
          font-size: 14px;
          color: #fbc80d;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .revive-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .revive-option {
          background: linear-gradient(135deg, #2a2a3e 0%, #1f1f2e 100%);
          border: 2px solid rgba(251, 200, 13, 0.2);
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .revive-option:hover {
          border-color: #fbc80d;
          background: linear-gradient(135deg, #3a3a4e 0%, #2f2f3e 100%);
        }

        .revive-option.selected {
          border-color: #39ff14;
          background: linear-gradient(135deg, #3a4e2e 0%, #2f3e1f 100%);
          box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
        }

        .card-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .card-name {
          font-size: 11px;
          color: #fff;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .card-type {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
        }

        .no-cards-message {
          text-align: center;
          color: #ff6b6b;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 6px;
        }

        .energy-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .available-tokens {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .energy-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .energy-input-group label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }

        .energy-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .energy-btn {
          background: rgba(251, 200, 13, 0.2);
          border: 1px solid rgba(251, 200, 13, 0.4);
          color: #fbc80d;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .energy-btn:hover:not(:disabled) {
          background: rgba(251, 200, 13, 0.3);
          border-color: #fbc80d;
        }

        .energy-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .energy-input {
          flex: 1;
          padding: 8px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(251, 200, 13, 0.3);
          border-radius: 6px;
          color: #fbc80d;
          font-weight: bold;
          text-align: center;
        }

        .energy-input:focus {
          outline: none;
          border-color: #fbc80d;
        }

        .trade-preview {
          background: rgba(96, 165, 250, 0.1);
          border: 1px solid #60a5fa;
          border-radius: 6px;
          padding: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
        }

        .trade-modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .trade-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .trade-btn.cancel-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid #ef4444;
        }

        .trade-btn.cancel-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .trade-btn.confirm-btn {
          background: linear-gradient(135deg, #39ff14 0%, #2adf0f 100%);
          color: #000;
          border: 1px solid #39ff14;
        }

        .trade-btn.confirm-btn:hover:not(:disabled) {
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
        }

        .trade-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
