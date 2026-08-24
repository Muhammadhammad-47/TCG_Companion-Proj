import React, { useState, useEffect } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Sparkles, Check, AlertTriangle } from 'lucide-react';

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
    <div className="modal-backdrop">
      <div className="dice-combat-modal">
        {/* Header */}
        <div className="modal-header combat-header">
          <div className="combat-title-box">
            <span className="combat-step-badge">2-DICE COMBAT RESOLUTION</span>
            <h2>{attacker.name} vs. {defender.name}</h2>
          </div>
        </div>

        {/* Combatants preview */}
        <div className="combatants-banner">
          <div className="combatant-side attacker-side">
            <span className="combatant-role">ATTACKER</span>
            <div className="combatant-details">
              <span className="combatant-avatar">{attacker.isZombie ? '🧟‍♂️' : atkChar.avatar}</span>
              <div>
                <h4 className="combatant-name">{attacker.name}</h4>
                <span className="move-title-badge">Move: {characterMove.name}</span>
              </div>
            </div>
          </div>

          <div className="vs-circle">VS</div>

          <div className="combatant-side defender-side">
            <span className="combatant-role">DEFENDER</span>
            <div className="combatant-details">
              <span className="combatant-avatar">{defender.isZombie ? '🧟‍♂️' : defChar.avatar}</span>
              <div>
                <h4 className="combatant-name">{defender.name}</h4>
                <span className="dp-info-badge">Innate DP: -{defChar.defaultDP} (on 6+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dice Arena */}
        <div className="dice-arena-grid">
          {/* Attacker Dice (Red) */}
          <div className="dice-player-box attacker-dice-box">
            <div className="dice-box-title">
              <Swords size={16} color="#ff4d4f" />
              <span>Attacker's Red Dice</span>
            </div>
            <div className="dice-pair">
              <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`}>{attackerDice[0]}</div>
              <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`}>{attackerDice[1]}</div>
            </div>
            <span className="dice-sum">Total Roll: {attackerDice[0] + attackerDice[1]}</span>
          </div>

          {/* Defender Dice (Gold) */}
          <div className="dice-player-box defender-dice-box">
            <div className="dice-box-title">
              <Shield size={16} color="#ffd700" />
              <span>Defender's Gold Dice</span>
            </div>
            <div className="dice-pair">
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`}>{defenderDice[0]}</div>
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`}>{defenderDice[1]}</div>
            </div>
            <span className="dice-sum">Total Roll: {defenderDice[0] + defenderDice[1]}</span>
          </div>
        </div>

        {/* Roll Action Button */}
        {!hasRolled && (
          <div className="roll-action-center">
            <button className="btn-roll-combat" onClick={handleRollDice} disabled={isRolling}>
              <Dices size={24} /> {isRolling ? 'ROLLING DICE...' : 'ROLL 2 RED & 2 GOLD DICE'}
            </button>
          </div>
        )}

        {/* Result Breakdown Card */}
        {hasRolled && result && (
          <div className="combat-result-breakdown">
            <h4 className="result-header">
              {result.isAttackSuccessful ? '💥 ATTACK CONNECTED!' : '🛡️ ATTACK BLOCKED / EVADED!'}
            </h4>

            <div className="breakdown-pills-row">
              <div className="calc-pill">
                <span>Base AP:</span>
                <strong>{result.rawAP}</strong>
              </div>

              {result.weaknessTriggered && (
                <div className="calc-pill weakness-pill">
                  <span>Weakness Bonus ({defChar.weakness.type}):</span>
                  <strong>+{result.weaknessBonus} AP</strong>
                </div>
              )}

              <div className={`calc-pill ${result.defenseActivated ? 'dp-pill-active' : 'dp-pill-failed'}`}>
                <span>Defender Roll ({result.defenderDiceSum} ≥ 6):</span>
                <strong>{result.defenseActivated ? `DP Active (-${result.innateDP} AP)` : 'DP Failed (Took Full AP)'}</strong>
              </div>

              <div className="calc-pill net-dmg-pill">
                <span>Net Damage Dealt:</span>
                <strong className="net-dmg-val">{result.damageDealt} HP</strong>
              </div>
            </div>

            {result.zombiePoisonCured && (
              <div className="zombie-cure-alert">
                ⚡ Fire/Lightning attack cured 1 Poison Card from Zombie {defender.name}!
              </div>
            )}

            <button className="btn-apply-damage" onClick={handleApplyDamage}>
              <Check size={20} /> APPLY {result.damageDealt} DAMAGE TO {defender.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
