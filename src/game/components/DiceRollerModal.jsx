import React, { useState } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, Flame, Skull, Sparkles, X, Heart, ShieldAlert } from 'lucide-react';

export default function DiceRollerModal({ combatData, onCombatComplete, onClose }) {
  const { attacker, defender, actionCard, characterMove, amplifyBonus = 0 } = combatData;
  const defChar = defender.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);
  const atkChar = attacker.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[attacker.characterId] || CHARACTERS.chynaman);

  const isMultiplier = characterMove?.type === 'dice_mult';

  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [attackerDice, setAttackerDice] = useState([3, 4]);
  const [defenderDice, setDefenderDice] = useState([3, 3]);
  const [result, setResult] = useState(null);

  const handleRollDice = () => {
    setIsRolling(true);
    soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setAttackerDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      setDefenderDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      count++;

      if (count >= 12) {
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
          amplifyBonus,
          isSingleDieMultiplier: isMultiplier
        });

        setResult(combatResult);
        setIsRolling(false);
        setHasRolled(true);

        if (combatResult.damageDealt > 0) {
          soundFX.playDamage();
        } else if (combatResult.defenseActivated) {
          soundFX.playHeal();
        }
      }
    }, 70);
  };

  const handleApplyDamage = () => {
    if (!result) return;
    onCombatComplete({
      combatData,
      result
    });
  };

  return (
    <div className="modal-backdrop cyber-modal-backdrop" onClick={onClose}>
      <div className="dice-combat-modal cyber-glass-dialog combat-clash-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '92%' }}>
        {/* Header */}
        <div className="modal-header combat-header cyber-dialog-header">
          <div className="combat-title-box dialog-title-group">
            <span className="combat-step-badge clash-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Dices size={15} /> OFFICIAL COMBAT CLASH
            </span>
            <h2 style={{ fontSize: '1.3rem', margin: '4px 0 0 0' }}>{attacker.name} vs {defender.name}</h2>
          </div>
          {onClose && (
            <button className="btn-close cyber-close-btn" onClick={onClose} title="Cancel">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Combatants Showcase Banner */}
        <div className="combatants-banner cyber-clash-banner" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center', margin: '14px 0' }}>
          {/* Attacker Box */}
          <div className="combatant-side attacker-side cyber-combatant-card" style={{ borderColor: 'var(--neon-pink)', padding: '12px', background: 'rgba(255, 51, 102, 0.08)', borderRadius: '10px', border: '1px solid #ff3366' }}>
            <div className="combatant-role-badge atk-badge" style={{ fontSize: '0.75rem', color: '#ff3366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Swords size={13} /> ATTACKER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
                <img
                  src={getAssetUrl(atkChar.image || 'characters/chynaman.png')}
                  alt={attacker.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{attacker.name}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--neon-pink)' }}>
                  {characterMove?.name || actionCard?.name || 'Standard Attack'}
                  <span style={{ marginLeft: '4px', opacity: 0.85 }}>
                    ({isMultiplier ? `1-Die × ${characterMove.multiplier} AP` : `${characterMove?.baseAP || 25} AP`})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Center Indicator */}
          <div className="vs-circle cyber-vs-node" style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '1rem', padding: '6px 10px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '50%', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
            VS
          </div>

          {/* Defender Box */}
          <div className="combatant-side defender-side cyber-combatant-card" style={{ borderColor: 'var(--neon-gold)', padding: '12px', background: 'rgba(255, 215, 0, 0.08)', borderRadius: '10px', border: '1px solid #ffd700' }}>
            <div className="combatant-role-badge def-badge" style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} /> DEFENDER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
                <img
                  src={getAssetUrl(defChar.image || 'characters/chynaman.png')}
                  alt={defender.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>{defender.name}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--neon-gold)' }}>
                  Innate DP: <strong>-{defChar.defaultDP} AP</strong>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Rolls 6+ to activate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dice Clash Arena */}
        <div className="dice-arena-grid cyber-dice-arena" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '14px 0' }}>
          {/* Attacker Dice (Red) */}
          <div className="dice-player-box attacker-dice-box cyber-dice-card" style={{ padding: '14px', background: 'rgba(10, 10, 20, 0.7)', borderRadius: '10px', border: '1px solid rgba(255, 51, 102, 0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#ff3366', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Swords size={14} /> OFFENSE ({isMultiplier ? '1 RED DIE' : '2 RED DICE'})
            </div>
            <div className="dice-pair" style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '10px 0' }}>
              <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`} style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ff1a4a, #800020)', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px solid #ff4d79', boxShadow: '0 0 10px rgba(255, 26, 74, 0.5)' }}>
                {attackerDice[0]}
              </div>
              {!isMultiplier && (
                <div className={`die red-die ${isRolling ? 'die-rolling' : ''}`} style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ff1a4a, #800020)', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px solid #ff4d79', boxShadow: '0 0 10px rgba(255, 26, 74, 0.5)' }}>
                  {attackerDice[1]}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              {isMultiplier ? (
                <span>Multiplier: <strong>{attackerDice[0]} × {characterMove.multiplier} = {attackerDice[0] * characterMove.multiplier} AP</strong></span>
              ) : (
                <span>Roll Sum: <strong>{attackerDice[0] + attackerDice[1]}</strong></span>
              )}
            </div>
          </div>

          {/* Defender Dice (Gold) */}
          <div className="dice-player-box defender-dice-box cyber-dice-card" style={{ padding: '14px', background: 'rgba(10, 10, 20, 0.7)', borderRadius: '10px', border: '1px solid rgba(255, 215, 0, 0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Shield size={14} /> DEFENSE (2 GOLD DICE)
            </div>
            <div className="dice-pair" style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '10px 0' }}>
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`} style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ffd700, #996500)', color: '#000', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px solid #fff066', boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                {defenderDice[0]}
              </div>
              <div className={`die gold-die ${isRolling ? 'die-rolling' : ''}`} style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #ffd700, #996500)', color: '#000', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px solid #fff066', boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                {defenderDice[1]}
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              Defense Roll Sum: <strong>{defenderDice[0] + defenderDice[1]}</strong> {defenderDice[0] + defenderDice[1] >= 6 ? ' (>= 6 DP PASS)' : ' (< 6 DP FAILED)'}
            </div>
          </div>
        </div>

        {/* Roll Action Button */}
        {!hasRolled && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            <button
              className="btn-roll-combat cyber-roll-btn"
              onClick={handleRollDice}
              disabled={isRolling}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(90deg, #ff0055, #ff5500)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 0 15px rgba(255, 0, 85, 0.4)'
              }}
            >
              <Dices size={22} />
              <span>{isRolling ? 'CASTING COMBAT DICE…' : 'ROLL COMBAT CLASH (2 RED vs 2 GOLD)'}</span>
            </button>
          </div>
        )}

        {/* Result Breakdown Card */}
        {hasRolled && result && (
          <div className="combat-result-breakdown cyber-result-card" style={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '1.1rem', color: result.defenseActivated ? 'var(--neon-cyan)' : '#ff3366', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {result.defenseActivated ? '🛡️ DEFENSE 6+ ACHIEVED: DP MITIGATION' : '💥 FULL DAMAGE PENETRATION'}
              </strong>
              <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                Defender Roll: {result.defenderDiceSum}
              </span>
            </div>

            {/* Visual Step-by-Step Calculation Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', margin: '10px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>BASE AP</div>
                <strong style={{ fontSize: '1rem', color: '#ff3366' }}>{result.rawAP} AP</strong>
              </div>

              {result.weaknessTriggered && (
                <div style={{ background: 'rgba(255, 157, 45, 0.15)', border: '1px solid #ff9d2d', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#ff9d2d' }}>⚡ WEAKNESS</div>
                  <strong style={{ fontSize: '1rem', color: '#ff9d2d' }}>+{result.weaknessBonus} AP</strong>
                </div>
              )}

              <div style={{ background: result.defenseActivated ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)', border: result.defenseActivated ? '1px solid var(--neon-cyan)' : 'none', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: result.defenseActivated ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.6)' }}>🛡️ DP REDUCTION</div>
                <strong style={{ fontSize: '1rem', color: result.defenseActivated ? 'var(--neon-cyan)' : '#888' }}>
                  {result.defenseActivated ? `-${result.innateDP} AP` : '0 (Failed)'}
                </strong>
              </div>

              {result.absorbedByShield > 0 && (
                <div style={{ background: 'rgba(59, 157, 255, 0.15)', border: '1px solid #3b9dff', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#3b9dff' }}>🔵 SHIELD ABSORBED</div>
                  <strong style={{ fontSize: '1rem', color: '#3b9dff' }}>-{result.absorbedByShield}</strong>
                </div>
              )}

              <div style={{ background: 'rgba(255, 51, 102, 0.2)', border: '1px solid #ff3366', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#ff3366' }}>NET HP DAMAGE</div>
                <strong style={{ fontSize: '1.1rem', color: '#ff3366' }}>-{result.damageDealt} HP</strong>
              </div>
            </div>

            {/* Special Triggers Alerts */}
            {result.zombiePoisonCured && (
              <div style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', padding: '8px', borderRadius: '6px', fontSize: '0.82rem', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} />
                <span><strong>Fire & Lightning Weakness:</strong> 1 Poison Card removed from {defender.name}!</span>
              </div>
            )}

            {result.appliesPoison && (
              <div style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', padding: '8px', borderRadius: '6px', fontSize: '0.82rem', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Skull size={16} />
                <span><strong>Venom Infliction:</strong> {defender.name} gains +1 Poison Card!</span>
              </div>
            )}

            {result.appliesStun && (
              <div style={{ background: 'rgba(255, 215, 0, 0.15)', border: '1px solid #ffd700', color: '#ffd700', padding: '8px', borderRadius: '6px', fontSize: '0.82rem', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span><strong>Paparazzi Stun:</strong> {defender.name} will lose their next turn!</span>
              </div>
            )}

            <button
              className="btn-apply-damage cyber-apply-btn"
              onClick={handleApplyDamage}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(90deg, #00f0ff, #0088ff)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Check size={20} />
              <span>APPLY COMBAT RESOLUTION (-{result.damageDealt} HP)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
