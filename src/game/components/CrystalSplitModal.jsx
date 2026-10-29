import React, { useState, useEffect } from 'react';
import { Gem, Swords, X, Check, ChevronRight, Zap } from 'lucide-react';
import { soundFX } from '../utils/audio';
import CrystalDiceRoller from './CrystalDiceRoller';

export default function CrystalSplitModal({
  isOpen,
  attackers,
  defeated,
  onSplitComplete,
  onClose
}) {
  const [phase, setPhase] = useState('initial'); // 'initial' | 'negotiate' | 'offer_review' | 'fight' | 'negotiation_result'
  const [currentOffererIdx, setCurrentOffererIdx] = useState(0);
  const [offer, setOffer] = useState({
    actionCards: [],
    energyTokens: 0,
    givesCrystal: false
  });
  const [pendingOffer, setPendingOffer] = useState(null);
  const [currentReviewerIdx, setCurrentReviewerIdx] = useState(
    currentOffererIdx === 0 ? 1 : 0
  );
  const [negotiationResult, setNegotiationResult] = useState(null);
  const [diceWinner, setDiceWinner] = useState(null);

  if (!isOpen || !attackers || attackers.length < 2) {
    return null;
  }

  const attacker1 = attackers[0];
  const attacker2 = attackers[1];
  const currentOfferer = currentOffererIdx === 0 ? attacker1 : attacker2;
  const currentReviewer = currentReviewerIdx === 0 ? attacker1 : attacker2;

  // Get available action cards from current offerer
  const getAvailableCards = (player) => {
    return (player.actionCardsHand || []).map((card, idx) => {
      const isStr = typeof card === 'string';
      const name = isStr ? card : (card?.name || `CARD ${idx + 1}`);
      const type = isStr
        ? (name.includes('SHIELD') || name.includes('DEFEN') ? 'DEFENSE' : name.includes('ATTACK') ? 'ATTACK' : 'SPECIAL')
        : (card?.type || 'SPECIAL');
      const id = isStr ? `c_${idx}_${name}` : (card?.id || `c_${idx}`);
      return {
        ...(isStr ? {} : card),
        id,
        name,
        type,
        instanceId: (isStr ? null : card?.instanceId) || `card_${idx}_${name}_${Date.now()}`
      };
    });
  };

  const availableCards = getAvailableCards(currentOfferer);
  const maxET = currentOfferer.energyTokens || 0;

  const handleStartNegotiate = () => {
    soundFX.playMenuHover?.();
    setPhase('negotiate');
    setOffer({
      actionCards: [],
      energyTokens: 0,
      givesCrystal: false
    });
  };

  const handleStartFight = () => {
    soundFX.playDiceRoll?.();
    setPhase('fight');
  };

  const handleToggleCard = (cardInstanceId) => {
    setOffer(prev => {
      const isSelected = prev.actionCards.some(c => c.instanceId === cardInstanceId);
      if (isSelected) {
        return {
          ...prev,
          actionCards: prev.actionCards.filter(c => c.instanceId !== cardInstanceId)
        };
      } else {
        const card = availableCards.find(c => c.instanceId === cardInstanceId);
        return {
          ...prev,
          actionCards: [...prev.actionCards, card]
        };
      }
    });
  };

  const handleSetET = (amount) => {
    setOffer(prev => ({
      ...prev,
      energyTokens: Math.min(Math.max(amount, 0), maxET)
    }));
  };

  const handleToggleCrystal = () => {
    setOffer(prev => ({
      ...prev,
      givesCrystal: !prev.givesCrystal
    }));
  };

  const handleSubmitOffer = () => {
    // Validate offer
    if (offer.actionCards.length === 0 && offer.energyTokens === 0 && !offer.givesCrystal) {
      soundFX.playMenuHover?.();
      return; // Empty offer not allowed
    }

    soundFX.playCard?.();
    setPendingOffer({
      offerer: currentOfferer,
      reviewer: currentReviewer,
      offer: offer
    });
    setPhase('offer_review');
  };

  const handleAcceptOffer = () => {
    soundFX.playCard?.();
    setNegotiationResult({
      accepted: true,
      winner: currentReviewer,
      loser: currentOfferer,
      offer: offer
    });
    setPhase('negotiation_result');
  };

  const handleRejectOffer = () => {
    soundFX.playMenuHover?.();
    setPendingOffer(null);
    setPhase('fight');
  };

  const handleDiceRollerComplete = (winner) => {
    soundFX.playVictory?.();
    setDiceWinner(winner);
    setNegotiationResult({
      accepted: false,
      winner: winner,
      loser: winner.id === attacker1.id ? attacker2 : attacker1,
      method: 'dice_roll'
    });
    setPhase('negotiation_result');
  };

  const handleConfirmResult = () => {
    if (negotiationResult) {
      onSplitComplete(negotiationResult);
    }
  };

  // ============= RENDER: Initial Screen =============
  if (phase === 'initial') {
    return (
      <div className="crystal-split-modal-overlay">
        <div className="crystal-split-modal-container">
          <div className="modal-header">
            <Gem size={48} className="header-gem-icon" />
            <h2 className="modal-title">Stability Crystal Earned!</h2>
          </div>

          <div className="initial-content">
            <p className="victory-text">
              <strong>{attacker1.name}</strong> and <strong>{attacker2.name}</strong> defeated <strong>{defeated.name}</strong>!
            </p>

            <div className="crystal-display">
              <Gem size={64} className="crystal-large" />
              <p className="crystal-text">1 Stability Crystal</p>
            </div>

            <p className="choice-prompt">How will you decide who gets it?</p>
          </div>

          <div className="initial-buttons">
            <button
              className="initial-btn negotiate-btn"
              onClick={handleStartNegotiate}
            >
              <div className="btn-icon">💰</div>
              <div className="btn-text">
                <div className="btn-label">NEGOTIATE SPLIT</div>
                <div className="btn-desc">Trade cards or ET for the crystal</div>
              </div>
              <ChevronRight size={20} />
            </button>

            <button
              className="initial-btn fight-btn"
              onClick={handleStartFight}
            >
              <div className="btn-icon">🎲</div>
              <div className="btn-text">
                <div className="btn-label">FIGHT FOR IT</div>
                <div className="btn-desc">Roll dice to determine the winner</div>
              </div>
              <ChevronRight size={20} />
            </button>
          </div>

          <style jsx>{`
            .crystal-split-modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.95);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10000;
              backdrop-filter: blur(8px);
              animation: fadeIn 0.3s ease-out;
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            .crystal-split-modal-container {
              background: linear-gradient(135deg, #2a2a1a 0%, #1a1a0a 100%);
              border: 3px solid #fbc80d;
              border-radius: 20px;
              padding: 40px 32px;
              max-width: 600px;
              width: 90%;
              box-shadow: 
                0 0 60px rgba(251, 200, 13, 0.4),
                inset 0 0 30px rgba(251, 200, 13, 0.1);
              animation: slideUp 0.4s ease-out;
            }

            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(40px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .modal-header {
              text-align: center;
              margin-bottom: 32px;
            }

            .header-gem-icon {
              color: #fbc80d;
              margin-bottom: 12px;
              animation: gemGlow 1.5s ease-in-out infinite;
            }

            @keyframes gemGlow {
              0%, 100% { filter: drop-shadow(0 0 10px rgba(251, 200, 13, 0.4)); }
              50% { filter: drop-shadow(0 0 20px rgba(251, 200, 13, 0.8)); }
            }

            .modal-title {
              font-size: 32px;
              color: #fbc80d;
              margin: 0;
              font-weight: bold;
              text-shadow: 0 0 20px rgba(251, 200, 13, 0.3);
              letter-spacing: 1px;
            }

            .initial-content {
              text-align: center;
              margin-bottom: 32px;
            }

            .victory-text {
              font-size: 18px;
              color: rgba(255, 255, 255, 0.9);
              margin: 0 0 24px 0;
              line-height: 1.6;
            }

            .victory-text strong {
              color: #39ff14;
              text-transform: uppercase;
              font-weight: bold;
            }

            .crystal-display {
              background: linear-gradient(135deg, rgba(251, 200, 13, 0.1) 0%, rgba(251, 200, 13, 0.05) 100%);
              border: 2px solid rgba(251, 200, 13, 0.3);
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }

            .crystal-large {
              color: #fbc80d;
              margin-bottom: 12px;
              animation: crystalBounce 1s ease-in-out infinite;
            }

            @keyframes crystalBounce {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-10px) scale(1.05); }
            }

            .crystal-text {
              margin: 0;
              font-size: 16px;
              color: #fbc80d;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .choice-prompt {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .initial-buttons {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-top: 32px;
            }

            .initial-btn {
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 20px;
              border: 2px solid;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: left;
              font-size: 14px;
              font-weight: bold;
              color: rgba(255, 255, 255, 0.9);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .initial-btn:hover {
              transform: translateX(8px);
            }

            .negotiate-btn {
              border-color: #39ff14;
              box-shadow: 0 0 20px rgba(57, 255, 20, 0.2);
            }

            .negotiate-btn:hover {
              background: rgba(57, 255, 20, 0.1);
              box-shadow: 0 0 30px rgba(57, 255, 20, 0.4);
            }

            .fight-btn {
              border-color: #fbc80d;
              box-shadow: 0 0 20px rgba(251, 200, 13, 0.2);
            }

            .fight-btn:hover {
              background: rgba(251, 200, 13, 0.1);
              box-shadow: 0 0 30px rgba(251, 200, 13, 0.4);
            }

            .btn-icon {
              font-size: 32px;
              min-width: 40px;
            }

            .btn-text {
              flex: 1;
            }

            .btn-label {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .btn-desc {
              font-size: 12px;
              opacity: 0.7;
              font-weight: normal;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ============= RENDER: Negotiate Screen =============
  if (phase === 'negotiate') {
    return (
      <div className="crystal-split-modal-overlay">
        <div className="crystal-split-modal-container negotiate-container">
          <div className="negotiate-header">
            <button className="close-btn" onClick={() => setPhase('initial')} title="Back">
              <ChevronRight size={24} />
            </button>
            <h2 className="negotiate-title">Negotiation Offer</h2>
            <div className="header-spacer"></div>
          </div>

          <div className="negotiate-content">
            <p className="offerer-label">
              <strong>{currentOfferer.name}</strong> is making an offer to <strong>{currentReviewer.name}</strong>
            </p>

            {/* Action Cards Selection */}
            <div className="section">
              <h3 className="section-title">📋 Action Cards to Offer</h3>
              <div className="cards-grid">
                {availableCards.length === 0 ? (
                  <p className="no-items">No action cards in hand</p>
                ) : (
                  availableCards.map(card => (
                    <button
                      key={card.instanceId}
                      className={`card-option ${offer.actionCards.some(c => c.instanceId === card.instanceId) ? 'selected' : ''}`}
                      onClick={() => handleToggleCard(card.instanceId)}
                      title={card.name}
                    >
                      <input
                        type="checkbox"
                        checked={offer.actionCards.some(c => c.instanceId === card.instanceId)}
                        onChange={() => {}}
                      />
                      <span className="card-name">{card.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Energy Tokens Selection */}
            <div className="section">
              <h3 className="section-title">⚡ Energy Tokens to Offer</h3>
              <div className="et-controls">
                <div className="et-slider-container">
                  <input
                    type="range"
                    min="0"
                    max={maxET}
                    value={offer.energyTokens}
                    onChange={(e) => handleSetET(parseInt(e.target.value))}
                    className="et-slider"
                  />
                </div>
                <div className="et-display">
                  <span className="et-value">{offer.energyTokens}</span>
                  <span className="et-label">/ {maxET} ET</span>
                </div>
              </div>
            </div>

            {/* Crystal Toggle */}
            <div className="section">
              <h3 className="section-title">💎 Stability Crystal</h3>
              <button
                className={`crystal-toggle ${offer.givesCrystal ? 'selected' : ''}`}
                onClick={handleToggleCrystal}
              >
                <input
                  type="checkbox"
                  checked={offer.givesCrystal}
                  onChange={() => {}}
                />
                <span>I give the Stability Crystal to {currentReviewer.name}</span>
              </button>
            </div>

            {/* Offer Summary */}
            <div className="offer-summary">
              <h4 className="summary-title">📝 Offer Summary</h4>
              <div className="summary-items">
                {offer.actionCards.length > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">📋 Cards:</span>
                    <span className="summary-value">{offer.actionCards.length}</span>
                  </div>
                )}
                {offer.energyTokens > 0 && (
                  <div className="summary-item">
                    <span className="summary-label">⚡ ET:</span>
                    <span className="summary-value">{offer.energyTokens}</span>
                  </div>
                )}
                {offer.givesCrystal && (
                  <div className="summary-item crystal-item">
                    <span className="summary-label">💎 Crystal:</span>
                    <span className="summary-value">YES</span>
                  </div>
                )}
                {offer.actionCards.length === 0 && offer.energyTokens === 0 && !offer.givesCrystal && (
                  <p className="empty-offer">Make an offer by selecting items above</p>
                )}
              </div>
            </div>
          </div>

          <div className="negotiate-buttons">
            <button
              className="negotiate-btn-cancel"
              onClick={() => setPhase('initial')}
            >
              <X size={18} /> CANCEL
            </button>
            <button
              className="negotiate-btn-submit"
              onClick={handleSubmitOffer}
              disabled={offer.actionCards.length === 0 && offer.energyTokens === 0 && !offer.givesCrystal}
            >
              <Check size={18} /> SUBMIT OFFER
            </button>
          </div>

          <style jsx>{`
            .negotiate-container {
              max-height: 90vh;
              overflow-y: auto;
            }

            .negotiate-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 1px solid rgba(251, 200, 13, 0.2);
            }

            .close-btn {
              background: none;
              border: none;
              color: #fbc80d;
              cursor: pointer;
              padding: 8px;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(180deg);
            }

            .close-btn:hover {
              transform: rotate(180deg) scale(1.2);
            }

            .header-spacer {
              width: 40px;
            }

            .negotiate-title {
              font-size: 24px;
              color: #fbc80d;
              margin: 0;
              text-align: center;
              flex: 1;
              font-weight: bold;
            }

            .negotiate-content {
              padding: 16px 0;
            }

            .offerer-label {
              text-align: center;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              margin: 0 0 24px 0;
              padding: 12px;
              background: rgba(251, 200, 13, 0.05);
              border-radius: 8px;
            }

            .offerer-label strong {
              color: #39ff14;
            }

            .section {
              margin-bottom: 24px;
            }

            .section-title {
              font-size: 14px;
              color: #fbc80d;
              margin: 0 0 12px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .cards-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 10px;
            }

            .card-option {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              border: 2px solid rgba(255, 255, 255, 0.2);
              background: rgba(255, 255, 255, 0.05);
              border-radius: 8px;
              color: rgba(255, 255, 255, 0.7);
              cursor: pointer;
              font-size: 12px;
              transition: all 0.2s ease;
              text-align: left;
              font-weight: 500;
            }

            .card-option:hover {
              border-color: #39ff14;
              background: rgba(57, 255, 20, 0.1);
              color: #39ff14;
            }

            .card-option.selected {
              border-color: #39ff14;
              background: rgba(57, 255, 20, 0.2);
              color: #39ff14;
            }

            .card-option input[type="checkbox"] {
              width: 16px;
              height: 16px;
              cursor: pointer;
            }

            .card-name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .no-items {
              color: rgba(255, 255, 255, 0.5);
              text-align: center;
              padding: 20px;
              font-style: italic;
            }

            .et-controls {
              display: flex;
              gap: 16px;
              align-items: center;
            }

            .et-slider-container {
              flex: 1;
            }

            .et-slider {
              width: 100%;
              height: 6px;
              border-radius: 3px;
              background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(57, 255, 20, 0.2) 100%);
              outline: none;
              -webkit-appearance: none;
              appearance: none;
            }

            .et-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #39ff14;
              cursor: pointer;
              box-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
            }

            .et-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #39ff14;
              cursor: pointer;
              border: none;
              box-shadow: 0 0 10px rgba(57, 255, 20, 0.6);
            }

            .et-display {
              display: flex;
              align-items: center;
              gap: 6px;
              min-width: 80px;
              padding: 8px 12px;
              background: rgba(57, 255, 20, 0.1);
              border: 1px solid rgba(57, 255, 20, 0.3);
              border-radius: 6px;
            }

            .et-value {
              font-size: 18px;
              font-weight: bold;
              color: #39ff14;
            }

            .et-label {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.6);
            }

            .crystal-toggle {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 14px 16px;
              border: 2px solid rgba(251, 200, 13, 0.3);
              background: rgba(251, 200, 13, 0.05);
              border-radius: 8px;
              color: rgba(255, 255, 255, 0.8);
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s ease;
              width: 100%;
              text-align: left;
            }

            .crystal-toggle:hover {
              border-color: #fbc80d;
              background: rgba(251, 200, 13, 0.15);
              color: #fbc80d;
            }

            .crystal-toggle.selected {
              border-color: #fbc80d;
              background: rgba(251, 200, 13, 0.25);
              color: #fbc80d;
              box-shadow: 0 0 15px rgba(251, 200, 13, 0.3);
            }

            .crystal-toggle input[type="checkbox"] {
              width: 18px;
              height: 18px;
              cursor: pointer;
            }

            .offer-summary {
              background: linear-gradient(135deg, rgba(57, 255, 20, 0.05) 0%, rgba(57, 255, 20, 0.02) 100%);
              border: 1px solid rgba(57, 255, 20, 0.2);
              border-radius: 8px;
              padding: 16px;
              margin-top: 24px;
            }

            .summary-title {
              font-size: 12px;
              color: #39ff14;
              margin: 0 0 12px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .summary-items {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .summary-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              font-size: 13px;
            }

            .summary-item.crystal-item {
              background: rgba(251, 200, 13, 0.1);
            }

            .summary-label {
              color: rgba(255, 255, 255, 0.6);
            }

            .summary-value {
              color: #39ff14;
              font-weight: bold;
            }

            .summary-item.crystal-item .summary-value {
              color: #fbc80d;
            }

            .empty-offer {
              color: rgba(255, 255, 255, 0.4);
              font-style: italic;
              text-align: center;
              padding: 12px;
              margin: 0;
              font-size: 13px;
            }

            .negotiate-buttons {
              display: flex;
              gap: 12px;
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid rgba(251, 200, 13, 0.2);
            }

            .negotiate-btn-cancel,
            .negotiate-btn-submit {
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

            .negotiate-btn-cancel {
              background: rgba(239, 68, 68, 0.2);
              color: #fca5a5;
              border: 1px solid #ef4444;
            }

            .negotiate-btn-cancel:hover {
              background: rgba(239, 68, 68, 0.3);
              box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }

            .negotiate-btn-submit {
              background: linear-gradient(135deg, #39ff14 0%, #2fe010 100%);
              color: #000;
              border: 1px solid #39ff14;
            }

            .negotiate-btn-submit:hover:not(:disabled) {
              box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
            }

            .negotiate-btn-submit:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ============= RENDER: Offer Review Screen =============
  if (phase === 'offer_review' && pendingOffer) {
    return (
      <div className="crystal-split-modal-overlay">
        <div className="crystal-split-modal-container review-container">
          <div className="review-header">
            <h2 className="review-title">Negotiation Offer</h2>
          </div>

          <div className="review-content">
            <p className="review-label">
              <strong>{pendingOffer.offerer.name}</strong> is offering <strong>{pendingOffer.reviewer.name}</strong>:
            </p>

            {/* What they're offering */}
            <div className="offer-section offering">
              <h3 className="offer-section-title">What {pendingOffer.offerer.name} Offers:</h3>
              <div className="offer-items">
                {pendingOffer.offer.actionCards.length > 0 && (
                  <div className="offer-item">
                    <span className="offer-icon">📋</span>
                    <span className="offer-text">
                      {pendingOffer.offer.actionCards.length} Action Card{pendingOffer.offer.actionCards.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {pendingOffer.offer.energyTokens > 0 && (
                  <div className="offer-item">
                    <span className="offer-icon">⚡</span>
                    <span className="offer-text">{pendingOffer.offer.energyTokens} Energy Token{pendingOffer.offer.energyTokens !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {!pendingOffer.offer.givesCrystal && (
                  <div className="offer-item placeholder">
                    <span className="offer-text">(No crystal included)</span>
                  </div>
                )}
              </div>
            </div>

            {/* What they want */}
            <div className="offer-section wanting">
              <h3 className="offer-section-title">In Exchange For:</h3>
              <div className="offer-items">
                {pendingOffer.offer.givesCrystal ? (
                  <div className="offer-item crystal">
                    <span className="offer-icon">💎</span>
                    <span className="offer-text">1 Stability Crystal</span>
                  </div>
                ) : (
                  <div className="offer-item placeholder">
                    <span className="offer-text">Nothing specified (they want the crystal)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="review-prompt">
              <p className="prompt-text">{pendingOffer.reviewer.name}, do you accept this offer?</p>
            </div>
          </div>

          <div className="review-buttons">
            <button
              className="review-btn-reject"
              onClick={handleRejectOffer}
            >
              <X size={18} /> REJECT
            </button>
            <button
              className="review-btn-accept"
              onClick={handleAcceptOffer}
            >
              <Check size={18} /> ACCEPT
            </button>
          </div>

          <style jsx>{`
            .review-container {
              max-width: 500px;
            }

            .review-header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 1px solid rgba(251, 200, 13, 0.2);
            }

            .review-title {
              font-size: 28px;
              color: #fbc80d;
              margin: 0;
              font-weight: bold;
              text-shadow: 0 0 20px rgba(251, 200, 13, 0.3);
            }

            .review-content {
              padding: 16px 0;
            }

            .review-label {
              text-align: center;
              font-size: 15px;
              color: rgba(255, 255, 255, 0.8);
              margin: 0 0 24px 0;
              padding: 12px;
              background: rgba(57, 255, 20, 0.05);
              border-radius: 8px;
              line-height: 1.5;
            }

            .review-label strong {
              color: #39ff14;
            }

            .offer-section {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }

            .offer-section.crystal {
              background: rgba(251, 200, 13, 0.1);
              border-color: rgba(251, 200, 13, 0.2);
            }

            .offer-section-title {
              font-size: 13px;
              color: #fbc80d;
              margin: 0 0 12px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .offer-items {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .offer-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 6px;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
            }

            .offer-item.crystal {
              background: rgba(251, 200, 13, 0.2);
              color: #fbc80d;
              font-weight: bold;
            }

            .offer-item.placeholder {
              color: rgba(255, 255, 255, 0.5);
              font-style: italic;
            }

            .offer-icon {
              font-size: 18px;
              min-width: 20px;
            }

            .offer-text {
              flex: 1;
            }

            .review-prompt {
              text-align: center;
              padding: 20px;
              background: rgba(251, 200, 13, 0.1);
              border: 2px solid rgba(251, 200, 13, 0.2);
              border-radius: 8px;
              margin: 24px 0;
            }

            .prompt-text {
              margin: 0;
              font-size: 16px;
              font-weight: bold;
              color: #fbc80d;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .review-buttons {
              display: flex;
              gap: 12px;
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid rgba(251, 200, 13, 0.2);
            }

            .review-btn-reject,
            .review-btn-accept {
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

            .review-btn-reject {
              background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%);
              color: #fca5a5;
              border: 1px solid #ef4444;
            }

            .review-btn-reject:hover {
              background: linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.4) 100%);
              box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }

            .review-btn-accept {
              background: linear-gradient(135deg, #39ff14 0%, #2fe010 100%);
              color: #000;
              border: 1px solid #39ff14;
            }

            .review-btn-accept:hover {
              box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ============= RENDER: Fight for Crystal Screen =============
  if (phase === 'fight') {
    return (
      <div className="crystal-split-modal-overlay">
        <div className="crystal-split-modal-container fight-container">
          <div className="fight-header">
            <h2 className="fight-title">Fight for Crystal</h2>
          </div>

          <div className="fight-content">
            <CrystalDiceRoller
              player1={attacker1}
              player2={attacker2}
              onRollComplete={handleDiceRollerComplete}
            />
          </div>

          <style jsx>{`
            .fight-container {
              max-width: 600px;
            }

            .fight-header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 1px solid rgba(251, 200, 13, 0.2);
            }

            .fight-title {
              font-size: 28px;
              color: #fbc80d;
              margin: 0;
              font-weight: bold;
              text-shadow: 0 0 20px rgba(251, 200, 13, 0.3);
            }

            .fight-content {
              padding: 16px 0;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ============= RENDER: Negotiation Result Screen =============
  if (phase === 'negotiation_result' && negotiationResult) {
    const isNegotiation = negotiationResult.accepted;
    const method = isNegotiation ? 'negotiation' : 'dice roll';
    const title = isNegotiation
      ? `${negotiationResult.winner.name} Accepted the Offer!`
      : `${negotiationResult.winner.name} Wins the Crystal!`;

    return (
      <div className="crystal-split-modal-overlay">
        <div className="crystal-split-modal-container result-container">
          <div className="result-header">
            {isNegotiation ? (
              <Check size={48} className="result-icon success" />
            ) : (
              <Trophy size={48} className="result-icon victory" />
            )}
            <h2 className="result-title">{title}</h2>
          </div>

          <div className="result-content">
            {isNegotiation && (
              <div className="result-section">
                <h3 className="result-section-title">Negotiation Details</h3>
                <div className="result-items">
                  <div className="result-item">
                    <span className="result-label">{negotiationResult.winner.name} receives:</span>
                  </div>
                  {negotiationResult.offer.actionCards.length > 0 && (
                    <div className="result-item sub">
                      <span className="result-icon-small">📋</span>
                      <span className="result-value">{negotiationResult.offer.actionCards.length} Action Card{negotiationResult.offer.actionCards.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {negotiationResult.offer.energyTokens > 0 && (
                    <div className="result-item sub">
                      <span className="result-icon-small">⚡</span>
                      <span className="result-value">{negotiationResult.offer.energyTokens} Energy Token{negotiationResult.offer.energyTokens !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {negotiationResult.offer.givesCrystal && (
                    <div className="result-item sub crystal">
                      <span className="result-icon-small">💎</span>
                      <span className="result-value">1 Stability Crystal</span>
                    </div>
                  )}

                  <div className="result-item">
                    <span className="result-label">{negotiationResult.loser.name} receives:</span>
                  </div>
                  {!negotiationResult.offer.givesCrystal && (
                    <div className="result-item sub">
                      <span className="result-icon-small">💎</span>
                      <span className="result-value">1 Stability Crystal</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isNegotiation && (
              <div className="result-section">
                <h3 className="result-section-title">Dice Roll Results</h3>
                <div className="dice-results">
                  <div className="dice-result-row">
                    <span className="result-label">{negotiationResult.winner.name}:</span>
                    <span className="result-value winner-value">Won! 🎲</span>
                  </div>
                  <div className="dice-result-row">
                    <span className="result-label">{negotiationResult.loser.name}:</span>
                    <span className="result-value loser-value">Lost</span>
                  </div>
                </div>
              </div>
            )}

            <div className="result-summary">
              <p className="summary-text">
                <strong>{negotiationResult.winner.name}</strong> wins the Stability Crystal!
              </p>
            </div>
          </div>

          <div className="result-buttons">
            <button
              className="result-btn-confirm"
              onClick={handleConfirmResult}
            >
              <Check size={18} /> CONTINUE GAME
            </button>
          </div>

          <style jsx>{`
            .result-container {
              max-width: 500px;
              animation: slideIn 0.4s ease-out;
            }

            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(40px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .result-header {
              text-align: center;
              margin-bottom: 32px;
            }

            .result-icon {
              margin-bottom: 12px;
            }

            .result-icon.success {
              color: #39ff14;
              animation: bounceIcon 0.6s ease-out;
            }

            .result-icon.victory {
              color: #fbc80d;
              animation: rotateIcon 0.6s ease-out;
            }

            @keyframes bounceIcon {
              0% {
                transform: scale(0);
              }
              50% {
                transform: scale(1.2);
              }
              100% {
                transform: scale(1);
              }
            }

            @keyframes rotateIcon {
              0% {
                transform: rotate(-20deg) scale(0);
              }
              100% {
                transform: rotate(0) scale(1);
              }
            }

            .result-title {
              font-size: 28px;
              color: #fbc80d;
              margin: 0;
              font-weight: bold;
              text-shadow: 0 0 20px rgba(251, 200, 13, 0.3);
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .result-content {
              padding: 16px 0;
            }

            .result-section {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(251, 200, 13, 0.2);
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }

            .result-section-title {
              font-size: 13px;
              color: #fbc80d;
              margin: 0 0 12px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .result-items,
            .dice-results {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .result-item {
              padding: 8px;
              font-size: 14px;
              color: rgba(255, 255, 255, 0.8);
            }

            .result-item.sub {
              display: flex;
              align-items: center;
              gap: 10px;
              padding-left: 20px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 4px;
            }

            .result-item.sub.crystal {
              background: rgba(251, 200, 13, 0.1);
              color: #fbc80d;
            }

            .result-label {
              color: rgba(255, 255, 255, 0.7);
            }

            .result-value {
              color: #39ff14;
              font-weight: bold;
            }

            .result-icon-small {
              font-size: 16px;
            }

            .dice-result-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 6px;
              font-size: 15px;
            }

            .winner-value {
              color: #39ff14;
              font-weight: bold;
            }

            .loser-value {
              color: rgba(255, 255, 255, 0.5);
            }

            .result-summary {
              background: linear-gradient(135deg, rgba(251, 200, 13, 0.1) 0%, rgba(57, 255, 20, 0.1) 100%);
              border: 2px solid rgba(251, 200, 13, 0.3);
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 24px 0;
            }

            .summary-text {
              margin: 0;
              font-size: 16px;
              font-weight: bold;
              color: #fbc80d;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .summary-text strong {
              color: #39ff14;
            }

            .result-buttons {
              display: flex;
              gap: 12px;
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid rgba(251, 200, 13, 0.2);
            }

            .result-btn-confirm {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 14px;
              background: linear-gradient(135deg, #39ff14 0%, #2fe010 100%);
              color: #000;
              border: 1px solid #39ff14;
              border-radius: 8px;
              font-size: 14px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .result-btn-confirm:hover {
              box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
              transform: translateY(-2px);
            }
          `}</style>
        </div>
      </div>
    );
  }

  return null;
}
