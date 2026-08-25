import React, { useState, useEffect } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Sparkles, Check, AlertTriangle, Flame, Zap, X } from 'lucide-react';

export default function DiceRollerModal({ combatData, onCombatComplete, onClose }) {
  const { attacker, defender, actionCard, characterMove, amplifyBonus = 0 } = combatData;
  const defChar = CHARACTERS[defender.characterId] || CHARACTERS.chynaman;
  const atkChar = CHARACTERS[attacker.characterId] || CHARACTERS.chynaman;

  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [attackerDice, setAttackerDice] = useState([3, 4]);
  const [defenderDice, setDefenderDice] = useState([3, 3]);
  const [result, setResult] = useState(null);

  const handleRollDice = () => {
    setIsRolling(true);
    soundFX.playDiceRoll();

    // Tumbling animation intervals
    let count = 0;
    const interval = setInterval(() => {
      setAttackerDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      setDefenderDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const finalAtk = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        const finalDef = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        setAttackerDice(finalAtk);
        setDefenderDice(finalDef);

        const combatResult = resolveDiceCombat({
          attacker,
          defender,
          actionCard,
          characterMove,
          attackerRoll: finalAtk,
          defenderRoll: finalDef,
          amplifyBonus
        });

        setResult(combatResult);
        setIsRolling(false);
        setHasRolled(true);

        if (combatResult.damageDealt > 0) {
          soundFX.playHit();
        } else {
          soundFX.playHeal();
        }
      }
    }, 80);
  };

  const handleApplyDamage = () => {
    if (!result) return;
    onCombatComplete({
      combatData,
      result
    });
  };

  return (
    <div className="modal-backdrop cyber-modal-backdrop">
      <div className="dice-combat-modal cyber-glass-dialog combat-clash-dialog">
        {/* Header */}
        <div className="modal-header combat-header cyber-dialog-header">
          <div className="combat-title-box dialog-title-group">
            <span className="combat-step-badge clash-badge"><Dices size={14} /> COMBAT RESOLUTION</span>
            <h2>{attacker.name} vs {defender.name}</h2>
          </div>
          {onClose && (
            <button className="btn-close cyber-close-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Combatants Showcase Banner */}
        <div className="combatants-banner cyber-clash-banner">
          {/* Attacker Box */}
          <div className="combatant-side attacker-side cyber-combatant-card" style={{ borderColor: 'var(--neon-pink)' }}>
            <div className="combatant-role-badge atk-badge">
              <Swords size={14} /> ATTACKER
            </div>
            <div className="combatant-details">
              <div className="combatant-avatar" style={{ borderColor: 'var(--neon-pink)' }}>
                <span>{attacker.isZombie ? '🧟‍♂️' : atkChar.avatar}</span>
              </div>
              <div className="combatant-meta">
                <h4 className="combatant-name">{attacker.name}</h4>
                <div className="move-title-badge">
                  <span>{characterMove.name}</span>
                  <span className="ap-val">({characterMove.baseAP} AP)</span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Center Clashing Indicator */}
          <div className="vs-circle cyber-vs-node">
            <div className="vs-glow-ring"></div>
            <span>VS</span>
          </div>

          {/* Defender Box */}
          <div className="combatant-side defender-side cyber-combatant-card" style={{ borderColor: 'var(--neon-gold)' }}>
            <div className="combatant-role-badge def-badge">
              <Shield size={14} /> DEFENDER
            </div>
            <div className="combatant-details">
              <div className="combatant-avatar" style={{ borderColor: 'var(--neon-gold)' }}>
                <span>{defender.isZombie ? '🧟‍♂️' : defChar.avatar}</span>
              </div>
              <div className="combatant-meta">
                <h4 className="combatant-name">{defender.name}</h4>
                <div className="dp-info-badge">
                  <span>Innate DP: -{defChar.defaultDP}</span>
                  <small>(Roll 6+ to trigger)</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dice Arena Clash Grid */}
        <div className="dice-arena-grid cyber-dice-arena">
          {/* Attacker Dice (Red Dice) */}
          <div className="dice-player-box attacker-dice-box cyber-dice-card">
            <div className="dice-box-title">
              <Swords size={16} color="var(--neon-pink)" />
              <span>OFFENSE (2 RED DICE)</span>
            </div>
            <div className="dice-pair">
              <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`}>{attackerDice[0]}</div>
              <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`}>{attackerDice[1]}</div>
            </div>
            <div className="dice-sum-box">
              <span className="sum-lbl">ROLL TOTAL:</span>
              <strong className="dice-sum">{attackerDice[0] + attackerDice[1]}</strong>
            </div>
          </div>

          {/* Defender Dice (Gold Dice) */}
          <div className="dice-player-box defender-dice-box cyber-dice-card">
            <div className="dice-box-title">
              <Shield size={16} color="var(--neon-gold)" />
              <span>DEFENSE (2 GOLD DICE)</span>
            </div>
            <div className="dice-pair">
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`}>{defenderDice[0]}</div>
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`}>{defenderDice[1]}</div>
            </div>
            <div className="dice-sum-box">
              <span className="sum-lbl">ROLL TOTAL:</span>
              <strong className="dice-sum">{defenderDice[0] + defenderDice[1]}</strong>
            </div>
          </div>
        </div>

        {/* Roll Action Button */}
        {!hasRolled && (
          <div className="roll-action-center cyber-roll-cta">
            <button className="btn-roll-combat cyber-roll-btn" onClick={handleRollDice} disabled={isRolling}>
              <Dices size={24} />
              <span>{isRolling ? 'CASTING DICE…' : 'ROLL COMBAT DICE'}</span>
            </button>
          </div>
        )}

        {/* Result Breakdown Card */}
        {hasRolled && result && (
          <div className="combat-result-breakdown cyber-result-card">
            <div className="result-headline-row">
              <h4 className={`result-header ${result.isAttackSuccessful ? 'hit-success' : 'def-blocked'}`}>
                {result.isAttackSuccessful ? '💥 IMPACT CONFIRMED' : '🛡️ ATTACK MITIGATED'}
              </h4>
              <span className="combat-summary-tag">
                {result.defenseActivated ? `Defender rolled ${result.defenderDiceSum} (DP Activated)` : `Defender rolled ${result.defenderDiceSum} (No DP)`}
              </span>
            </div>

            <div className="breakdown-pills-row cyber-calc-grid">
              <div className="calc-pill">
                <span className="pill-title">BASE AP</span>
                <strong className="pill-value">{result.rawAP}</strong>
              </div>

              {result.weaknessTriggered && (
                <div className="calc-pill weakness-pill">
                  <span className="pill-title">⚡ {defChar.weakness.type}</span>
                  <strong className="pill-value">+{result.weaknessBonus} AP</strong>
                </div>
              )}

              <div className={`calc-pill ${result.defenseActivated ? 'dp-pill-active' : 'dp-pill-failed'}`}>
                <span className="pill-title">🛡️ DP REDUCTION</span>
                <strong className="pill-value">{result.defenseActivated ? `-${result.innateDP} DP` : '0 (Failed)'}</strong>
              </div>

              <div className="calc-pill net-dmg-pill">
                <span className="pill-title">TOTAL DAMAGE</span>
                <strong className="net-dmg-val">-{result.damageDealt} HP</strong>
              </div>
            </div>

            {result.zombiePoisonCured && (
              <div className="zombie-cure-alert">
                ⚡ Elemental burn stripped 1 Poison Card from {defender.name}!
              </div>
            )}

            <button className="btn-apply-damage cyber-apply-btn" onClick={handleApplyDamage}>
              <Check size={20} />
              <span>APPLY RESOLUTION (-{result.damageDealt} HP)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
