import React, { useState } from 'react';
import { ACTION_CARDS } from '../data/cards';
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters';
import { soundFX } from '../utils/audio';
import { X, Zap, Shield, Sparkles, Flame, Brain, Skull, Heart, Award } from 'lucide-react';

export default function CardActionModal({
  activePlayer,
  allPlayers,
  onClose,
  onInitiateCombat,
  onApplyInstantEffect,
  onOpenKontrol,
  onOpenBlitz,
  onOpenRetreat
}) {
  const [selectedActionId, setSelectedActionId] = useState('atk_basic');
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState(
    allPlayers.find(p => p.id !== activePlayer.id)?.id || ''
  );
  const [amplifyChoice, setAmplifyChoice] = useState(null); // 'hp' | 'ap' | 'dp'

  const char = CHARACTERS[activePlayer.characterId] || CHARACTERS.chynaman;
  const isZombie = activePlayer.isZombie;
  const availableMoves = isZombie ? ZOMBIE_PROFILE.moves : char.moves;

  const currentAction = ACTION_CARDS.find(c => c.id === selectedActionId);
  const currentMove = availableMoves.find(m => m.id === selectedMoveId) || availableMoves[0];

  const handleActionClick = (card) => {
    soundFX.playCard();
    setSelectedActionId(card.id);

    // If card is special modal trigger
    if (card.id === 'kontrol_card') {
      onOpenKontrol(activePlayer, targetPlayerId);
      return;
    }
    if (card.id === 'blitz_card') {
      onOpenBlitz(activePlayer);
      return;
    }
    if (card.id === 'retreat_card') {
      onOpenRetreat(activePlayer);
      return;
    }
  };

  const handleConfirmAction = () => {
    if (!currentAction) return;

    // Check Energy Cost
    const totalETCost = (currentAction.costET || 0) + (currentMove?.costET || 0);
    if (activePlayer.energyTokens < totalETCost) {
      alert(`Not enough Energy Tokens! Required: ${totalETCost} ET. You have: ${activePlayer.energyTokens} ET.`);
      return;
    }

    const targetPlayer = allPlayers.find(p => p.id === targetPlayerId);

    // Handle Attacks
    if (currentAction.category === 'Attack' || isZombie) {
      if (!targetPlayer) {
        alert('Please select an opponent to target.');
        return;
      }
      onInitiateCombat({
        attacker: activePlayer,
        defender: targetPlayer,
        actionCard: currentAction,
        characterMove: currentMove,
        amplifyBonus: amplifyChoice === 'ap' ? 20 : 0
      });
      return;
    }

    // Handle Status / Poison
    if (currentAction.id === 'poison_card') {
      if (!targetPlayer) {
        alert('Select a target to poison.');
        return;
      }
      onApplyInstantEffect({
        type: 'poison',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: targetPlayer.id,
        costET: currentAction.costET,
        amount: 1
      });
      return;
    }

    // Handle Antidote
    if (currentAction.id === 'antidote_card') {
      onApplyInstantEffect({
        type: 'antidote',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET
      });
      return;
    }

    // Handle Heal
    if (currentAction.id === 'heal_card') {
      onApplyInstantEffect({
        type: 'heal',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET,
        amount: 30
      });
      return;
    }

    // Handle Shield
    if (currentAction.id === 'shield_card') {
      onApplyInstantEffect({
        type: 'shield',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        costET: currentAction.costET,
        amount: 30
      });
      return;
    }

    // Handle Amplify
    if (currentAction.id === 'amplify_card') {
      if (!amplifyChoice) {
        alert('Please choose an Amplify bonus (+20 HP, +20 AP, or +10 DP).');
        return;
      }
      onApplyInstantEffect({
        type: 'amplify',
        sourcePlayerId: activePlayer.id,
        targetPlayerId: activePlayer.id,
        amplifyChoice,
        costET: 0
      });
      return;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="card-action-modal">
        <div className="modal-header">
          <div className="header-title-box">
            <span className="step-pill">STEP 1: CARD & MOVE SELECTION</span>
            <h2>{activePlayer.name}'s Battle Move</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body-grid">
          {/* Left Column: Action Cards Hand */}
          <div className="hand-selection-col">
            <h3 className="section-title">1. Select Action Card</h3>
            <div className="action-cards-grid">
              {ACTION_CARDS.map(card => {
                const isSelected = selectedActionId === card.id;
                // If zombie, disable non-applicable cards
                const disabledForZombie = isZombie && (card.id === 'kontrol_card' || card.id === 'blitz_card');
                return (
                  <div
                    key={card.id}
                    className={`action-card-item ${isSelected ? 'selected' : ''} ${disabledForZombie ? 'disabled-card' : ''}`}
                    style={{ borderTopColor: card.color }}
                    onClick={() => !disabledForZombie && handleActionClick(card)}
                  >
                    <div className="card-item-top">
                      <span className="card-icon">{card.icon}</span>
                      <span className="card-cost" title="Energy Token Cost">
                        <Zap size={12} fill="#ffd700" color="#ffd700" /> {card.costET} ET
                      </span>
                    </div>
                    <h4 className="card-item-name">{card.name}</h4>
                    <p className="card-item-desc">{card.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Character Move & Target */}
          <div className="move-target-col">
            {/* If Amplify Card Selected */}
            {selectedActionId === 'amplify_card' && (
              <div className="amplify-box">
                <h4><Sparkles size={16} /> Choose Amplify Boost (Sue Ellen's V2)</h4>
                <div className="amplify-choices">
                  <button
                    className={`amp-choice ${amplifyChoice === 'hp' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('hp')}
                  >
                    💖 +20 HP (Vitality)
                  </button>
                  <button
                    className={`amp-choice ${amplifyChoice === 'ap' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('ap')}
                  >
                    ⚔️ +20 AP (Attack Power)
                  </button>
                  <button
                    className={`amp-choice ${amplifyChoice === 'dp' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('dp')}
                  >
                    🛡️ +10 DP (Defense Power)
                  </button>
                </div>
              </div>
            )}

            {/* Character Moves (if Attack or Zombie) */}
            {(currentAction?.category === 'Attack' || isZombie) && (
              <div className="character-moves-section">
                <h3 className="section-title">2. Pair with Character Technique</h3>
                <div className="moves-list">
                  {availableMoves.map(move => {
                    const isMoveSelected = (selectedMoveId || availableMoves[0].id) === move.id;
                    return (
                      <div
                        key={move.id}
                        className={`move-item ${isMoveSelected ? 'move-selected' : ''}`}
                        onClick={() => {
                          soundFX.playCard();
                          setSelectedMoveId(move.id);
                        }}
                      >
                        <div className="move-item-header">
                          <span className="move-name">{move.name}</span>
                          <span className="move-ap-badge">
                            {move.type === 'dice_mult' ? `1 Die × ${move.baseAP} AP` : `${move.baseAP} AP`}
                          </span>
                        </div>
                        <p className="move-desc">{move.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Opponent Selector */}
            {(currentAction?.category === 'Attack' || currentAction?.id === 'poison_card' || isZombie) && (
              <div className="target-select-section">
                <h3 className="section-title">3. Select Target Opponent</h3>
                <div className="targets-grid">
                  {allPlayers
                    .filter(p => p.id !== activePlayer.id)
                    .map(target => {
                      const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                      const isTargetSelected = targetPlayerId === target.id;
                      return (
                        <div
                          key={target.id}
                          className={`target-pill ${isTargetSelected ? 'target-selected' : ''}`}
                          onClick={() => {
                            soundFX.playCard();
                            setTargetPlayerId(target.id);
                          }}
                        >
                          <span className="target-avatar">{target.isZombie ? '🧟‍♂️' : tChar.avatar}</span>
                          <div className="target-info">
                            <span className="target-name">{target.name}</span>
                            <span className="target-hp">{target.hp} HP</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Execution Confirmation Button */}
            <div className="modal-footer-cta">
              <div className="cost-summary">
                <span>Total Energy Cost: </span>
                <strong className="cost-val">
                  {(currentAction?.costET || 0) + (currentMove?.costET || 0)} ET
                </strong>
                <span className="et-balance">(You have: {activePlayer.energyTokens} ET)</span>
              </div>

              <button className="btn-execute-action" onClick={handleConfirmAction}>
                <Sparkles size={18} /> CONFIRM & EXECUTE MOVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
