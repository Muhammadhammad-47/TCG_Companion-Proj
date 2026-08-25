import React, { useState } from 'react';
import { ACTION_CARDS } from '../data/cards';
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters';
import { soundFX } from '../utils/audio';
import { X, Zap, Shield, Sparkles, Flame, Brain, Skull, Heart, Award, Swords, Target, Play } from 'lucide-react';

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

  // Only an attack pairs a Character technique with the Action Card
  const isAttackPlay = currentAction?.category === 'Attack' || isZombie;
  const totalETCost = (currentAction?.costET || 0) + (isAttackPlay ? (currentMove?.costET || 0) : 0);

  // Defeated warriors cannot be targeted
  const selectableTargets = allPlayers.filter(p => {
    if (p.isDefeated) return false;
    if (currentAction?.id === 'poison_card') return true;
    return p.id !== activePlayer.id;
  });

  const handleActionClick = (card) => {
    soundFX.playCard();
    setSelectedActionId(card.id);

    // Kontrol and Blitz are limited to 2 uses per match.
    if (card.id === 'kontrol_card' && (activePlayer.kontrolUsesLeft ?? 2) <= 0) {
      alert('No Kontrol uses left this match.');
      return;
    }
    if (card.id === 'blitz_card' && (activePlayer.blitzUsesLeft ?? 2) <= 0) {
      alert('No Blitz uses left this match.');
      return;
    }
    if (card.id === 'retreat_card' && activePlayer.retreatedThisTurn) {
      alert('Already retreated this turn.');
      return;
    }

    // Special card modal triggers
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
    if (activePlayer.energyTokens < totalETCost) {
      alert(`Need ${totalETCost} ET — you have ${activePlayer.energyTokens}.`);
      return;
    }

    const targetPlayer = selectableTargets.find(p => p.id === targetPlayerId)
      || selectableTargets.find(p => p.id !== activePlayer.id)
      || selectableTargets[0];

    // Handle Attacks
    if (currentAction.category === 'Attack' || isZombie) {
      if (!targetPlayer) {
        alert('Pick a target.');
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
        alert('Pick a target.');
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
        alert('Pick an Amplify bonus first.');
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
    <div className="modal-backdrop cyber-modal-backdrop">
      <div className="card-action-modal cyber-glass-dialog action-selection-dialog">
        {/* Dialog Header */}
        <div className="modal-header cyber-dialog-header">
          <div className="header-title-box dialog-title-group">
            <div className="avatar-chip" style={{ borderColor: char.themeColor }}>
              <span>{isZombie ? '🧟‍♂️' : char.avatar}</span>
            </div>
            <div>
              <span className="dialog-step-tag">COMBAT TACTICS</span>
              <h2>{activePlayer.name} · SELECT ACTION</h2>
            </div>
          </div>
          <button className="btn-close cyber-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Streamlined Grid */}
        <div className="modal-body-grid cyber-action-grid">
          {/* Left Column: Action Cards Selection */}
          <div className="hand-selection-col cyber-column">
            <div className="section-title-wrap">
              <span className="step-num">1</span>
              <h3 className="section-title">CHOOSE ACTION CARD</h3>
            </div>

            <div className="action-cards-grid cyber-cards-scroll">
              {ACTION_CARDS.map(card => {
                const isSelected = selectedActionId === card.id;
                const disabledForZombie = isZombie && (card.id === 'kontrol_card' || card.id === 'blitz_card');
                return (
                  <div
                    key={card.id}
                    className={`action-card-item cyber-tactical-card ${isSelected ? 'selected active-card-border' : ''} ${disabledForZombie ? 'disabled-card' : ''}`}
                    style={{ '--card-color': card.color }}
                    onClick={() => !disabledForZombie && handleActionClick(card)}
                  >
                    <div className="card-item-top">
                      <span className="card-icon">{card.icon}</span>
                      <span className="card-cost et-cost-badge" title="Energy cost">
                        <Zap size={11} fill="var(--neon-gold)" color="var(--neon-gold)" /> {card.costET} ET
                      </span>
                    </div>
                    <h4 className="card-item-name">{card.name}</h4>
                    <p className="card-item-desc">{card.desc}</p>
                    {isSelected && <div className="card-selection-glow"></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Technique & Target Selection */}
          <div className="move-target-col cyber-column">
            {/* Amplify Choices */}
            {selectedActionId === 'amplify_card' && (
              <div className="amplify-box cyber-glass-inner">
                <div className="section-title-wrap">
                  <Sparkles size={16} color="var(--neon-gold)" />
                  <h4>SELECT AMPLIFY BONUS</h4>
                </div>
                <div className="amplify-choices">
                  <button
                    className={`amp-choice cyber-choice-btn ${amplifyChoice === 'hp' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('hp')}
                  >
                    💖 +20 HP <small>Direct Heal</small>
                  </button>
                  <button
                    className={`amp-choice cyber-choice-btn ${amplifyChoice === 'ap' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('ap')}
                  >
                    ⚔️ +20 AP <small>Attack Boost</small>
                  </button>
                  <button
                    className={`amp-choice cyber-choice-btn ${amplifyChoice === 'dp' ? 'selected' : ''}`}
                    onClick={() => setAmplifyChoice('dp')}
                  >
                    🛡️ +10 DP <small>Defense Shield</small>
                  </button>
                </div>
              </div>
            )}

            {/* Character Moves */}
            {(currentAction?.category === 'Attack' || isZombie) && (
              <div className="character-moves-section cyber-glass-inner">
                <div className="section-title-wrap">
                  <span className="step-num">2</span>
                  <h3 className="section-title">PAIR WARRIOR TECHNIQUE</h3>
                </div>

                <div className="moves-list cyber-moves-scroll">
                  {availableMoves.map(move => {
                    const isMoveSelected = (selectedMoveId || availableMoves[0].id) === move.id;
                    return (
                      <div
                        key={move.id}
                        className={`move-item cyber-move-card ${isMoveSelected ? 'move-selected move-active-glow' : ''}`}
                        onClick={() => {
                          soundFX.playCard();
                          setSelectedMoveId(move.id);
                        }}
                      >
                        <div className="move-item-header">
                          <strong className="move-name">{move.name}</strong>
                          <span className="move-ap-badge">
                            {move.type === 'dice_mult' ? `🎲 × ${move.baseAP}` : `${move.baseAP} AP`}
                          </span>
                        </div>
                        {move.desc && <p className="move-desc">{move.desc}</p>}
                        <div className="move-cost-meta">
                          <Zap size={11} color="var(--neon-gold)" /> <span>Cost: {move.costET || 0} ET</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Target Opponent Selector */}
            {(currentAction?.category === 'Attack' || currentAction?.id === 'poison_card' || isZombie) && (
              <div className="target-select-section cyber-glass-inner">
                <div className="section-title-wrap">
                  <span className="step-num">3</span>
                  <h3 className="section-title">TARGET OPPONENT</h3>
                </div>

                <div className="targets-grid cyber-targets-grid">
                  {selectableTargets.map(target => {
                    const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                    const isTargetSelected = targetPlayerId === target.id;
                    return (
                      <div
                        key={target.id}
                        className={`target-pill cyber-target-card ${isTargetSelected ? 'target-selected target-active-glow' : ''}`}
                        onClick={() => {
                          soundFX.playCard();
                          setTargetPlayerId(target.id);
                        }}
                      >
                        <div className="target-avatar" style={{ borderColor: tChar.themeColor }}>
                          <span>{target.isZombie ? '🧟‍♂️' : tChar.avatar}</span>
                        </div>
                        <div className="target-info">
                          <span className="target-name">{target.name}</span>
                          <span className="target-hp">{target.hp} HP</span>
                        </div>
                        {isTargetSelected && <div className="target-crosshair"><Target size={14} color="var(--neon-cyan)" /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Execution Confirmation Footer */}
            <div className="modal-footer-cta cyber-cta-bar">
              <div className="cost-summary energy-summary-box">
                <div className="energy-icon-wrap">
                  <Zap size={16} fill="var(--neon-gold)" color="var(--neon-gold)" />
                </div>
                <div className="cost-labels">
                  <span className="cost-tag">ACTION COST</span>
                  <div className="cost-numbers">
                    <strong className="cost-val">{totalETCost} ET</strong>
                    <span className="et-balance">/ {activePlayer.energyTokens} Available</span>
                  </div>
                </div>
              </div>

              <button className="btn-execute-action cyber-confirm-btn" onClick={handleConfirmAction}>
                <Play size={18} fill="currentColor" />
                <span>CONFIRM & GO</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
