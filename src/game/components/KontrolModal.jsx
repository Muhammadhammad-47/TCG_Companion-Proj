import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Brain, X, Dices, AlertTriangle, Check } from 'lucide-react';

export default function KontrolModal({ attacker, allPlayers, initialTargetId, onClose, onCompleteKontrol }) {
  const [targetId, setTargetId] = useState(
    initialTargetId || allPlayers.find(p => p.id !== attacker.id)?.id || ''
  );
  const [isRolling, setIsRolling] = useState(false);
  const [dieRoll, setDieRoll] = useState(4);
  const [hasRolled, setHasRolled] = useState(false);
  const [success, setSuccess] = useState(false);
  const [chosenOption, setChosenOption] = useState('steal_card'); // 'steal_card' | 'force_attack'

  const targetPlayer = allPlayers.find(p => p.id === targetId);
  const targetChar = targetPlayer ? (CHARACTERS[targetPlayer.characterId] || CHARACTERS.chynaman) : null;
  const atkChar = CHARACTERS[attacker.characterId] || CHARACTERS.chynaman;

  const isTargetZombie = targetPlayer?.isZombie;

  const handleRoll = () => {
    if (isTargetZombie) {
      alert('Zombies are immune to Kontrol.');
      return;
    }

    setIsRolling(true);
    soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setDieRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDieRoll(finalRoll);
        setIsRolling(false);
        setHasRolled(true);

        // Calculate modifiers
        const atkBonus = atkChar.mindAtkBonus || 0; // Queeny +2
        const defBonus = targetChar?.mindDefBonus || 0; // Magical creatures +1
        const effectiveRoll = finalRoll + atkBonus;
        const targetThreshold = (targetChar?.mindStrength || 3) + defBonus;

        const isSuccess = effectiveRoll > targetThreshold;
        setSuccess(isSuccess);

        if (isSuccess) {
          soundFX.playEnergy();
        } else {
          soundFX.playHit();
        }
      }
    }, 80);
  };

  const handleConfirm = () => {
    onCompleteKontrol({
      attackerId: attacker.id,
      targetId: targetPlayer.id,
      success,
      chosenOption
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="special-card-modal kontrol-modal">
        <div className="modal-header">
          <div className="header-title-box">
            <span className="step-pill"><Brain size={14} /> 3 ET</span>
            <h2>KONTROL</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="special-modal-body">
          <p className="special-desc">
            Beat their <strong>Mind</strong> to take a card or a move.
          </p>

          {/* Target Selector */}
          <div className="target-select-section">
            <label className="section-label">TARGET</label>
            <div className="targets-grid">
              {allPlayers
                .filter(p => p.id !== attacker.id)
                .map(target => {
                  const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                  return (
                    <div
                      key={target.id}
                      className={`target-pill ${targetId === target.id ? 'target-selected' : ''}`}
                      onClick={() => {
                        setTargetId(target.id);
                        setHasRolled(false);
                      }}
                    >
                      <span>{target.isZombie ? '🧟‍♂️' : tChar.avatar}</span>
                      <div>
                        <strong>{target.name}</strong>
                        <span className="mind-stat">
                          {target.isZombie ? 'IMMUNE' : `🧠 ${tChar.mindStrength}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Mind comparison summary */}
          {targetPlayer && !isTargetZombie && (
            <div className="mind-rules-summary">
              <div className="mind-badge-box">
                <span>{attacker.name}</span>
                <strong>{atkChar.mindAtkBonus ? `🎲 +${atkChar.mindAtkBonus}` : '🎲'}</strong>
              </div>
              <div className="mind-badge-box">
                <span>{targetPlayer.name}</span>
                <strong>
                  🧠 {targetChar.mindStrength}
                  {targetChar.mindDefBonus ? ` +${targetChar.mindDefBonus}` : ''}
                </strong>
              </div>
            </div>
          )}

          {isTargetZombie && (
            <div className="error-alert">
              <AlertTriangle size={18} /> Zombies are immune.
            </div>
          )}

          {/* Dice Roll Center */}
          {!isTargetZombie && (
            <div className="kontrol-roll-arena">
              <div className="single-die-box">
                <div className={`die purple-die ${isRolling ? 'die-rolling' : ''}`}>{dieRoll}</div>
                <span>🎲</span>
              </div>

              {!hasRolled ? (
                <button className="btn-roll-combat" onClick={handleRoll} disabled={isRolling}>
                  <Dices size={20} /> {isRolling ? '…' : 'ROLL'}
                </button>
              ) : (
                <div className="kontrol-outcome-box">
                  <h4 className={success ? 'text-success' : 'text-danger'}>
                    {success ? '🎉 KONTROLLED' : '❌ RESISTED'}
                  </h4>

                  {success && (
                    <div className="kontrol-reward-picker">
                      <label>REWARD</label>
                      <div className="choice-buttons">
                        <button
                          className={`choice-btn ${chosenOption === 'steal_card' ? 'selected' : ''}`}
                          onClick={() => setChosenOption('steal_card')}
                        >
                          🃏 Take a card
                        </button>
                        <button
                          className={`choice-btn ${chosenOption === 'force_attack' ? 'selected' : ''}`}
                          onClick={() => setChosenOption('force_attack')}
                        >
                          ⚔️ Force an attack
                        </button>
                      </div>
                    </div>
                  )}

                  <button className="btn-apply-damage" onClick={handleConfirm}>
                    <Check size={18} /> OK
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
