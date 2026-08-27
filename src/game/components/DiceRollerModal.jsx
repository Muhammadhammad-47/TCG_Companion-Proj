import React, { useState } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, Flame, Skull, Sparkles, X, Heart, ShieldAlert } from 'lucide-react';
import ThreeDiceArena from './ThreeDiceArena';

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
  const pendingResultRef = React.useRef(null);

  const handleRollDice = () => {
    if (isRolling) return;
    
    // Generate true random target values
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

    pendingResultRef.current = combatResult;
    setIsRolling(true);
    soundFX.playDiceRoll();
  };

  const handlePhysicsRollComplete = () => {
    setIsRolling(false);
    setHasRolled(true);
    const combatResult = pendingResultRef.current;
    if (combatResult) {
      setResult(combatResult);
      if (combatResult.damageDealt > 0) {
        soundFX.playDamage();
      } else if (combatResult.defenseActivated) {
        soundFX.playHeal();
      }
    }
  };

  const handleApplyDamage = () => {
    if (!result) return;
    onCombatComplete({
      combatData,
      result
    });
  };

  return (
    <div
      className="modal-backdrop cyber-modal-backdrop dice-fullscreen-backdrop"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(10, 28, 65, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%)',
        backdropFilter: 'blur(16px)',
        padding: '20px 36px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div
        className="dice-combat-modal cyber-glass-dialog combat-clash-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0
        }}
      >
        {/* Full-Screen Clash Header */}
        <div className="modal-header combat-header cyber-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.25)', paddingBottom: '12px' }}>
          <div className="combat-title-box dialog-title-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="combat-step-badge clash-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 240, 255, 0.15)', border: '1.5px solid #00f0ff', color: '#00f0ff', padding: '6px 14px', borderRadius: '8px', fontWeight: '900', letterSpacing: '0.08em', fontSize: '0.88rem' }}>
              <Dices size={18} /> OFFICIAL COMBAT CLASH
            </span>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontFamily: 'Orbitron, sans-serif' }}>
              {attacker.name} <span style={{ color: 'var(--neon-pink)', margin: '0 8px' }}>⚔️</span> {defender.name}
            </h2>
          </div>
          {onClose && (
            <button
              className="btn-close cyber-close-btn"
              onClick={onClose}
              title="Close Combat"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>
          )}
        </div>

        {/* Combatants Showcase Banner */}
        <div className="combatants-banner cyber-clash-banner" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '18px', alignItems: 'center', margin: '12px 0' }}>
          {/* Attacker Box */}
          <div className="combatant-side attacker-side cyber-combatant-card" style={{ borderColor: 'var(--neon-pink)', padding: '14px 20px', background: 'rgba(255, 51, 102, 0.12)', borderRadius: '14px', border: '1.5px solid #ff3366', boxShadow: '0 0 20px rgba(255, 51, 102, 0.2)' }}>
            <div className="combatant-role-badge atk-badge" style={{ fontSize: '0.8rem', color: '#ff3366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
              <Swords size={15} /> ATTACKER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', flexShrink: 0, boxShadow: '0 0 15px rgba(255, 51, 102, 0.5)' }}>
                <img
                  src={getAssetUrl(atkChar.image || 'characters/chynaman.png')}
                  alt={attacker.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{attacker.name}</strong>
                <div style={{ fontSize: '0.92rem', color: 'var(--neon-pink)', marginTop: '2px' }}>
                  {characterMove?.name || actionCard?.name || 'Standard Attack'}
                  <span style={{ marginLeft: '6px', opacity: 0.9, fontWeight: 'bold' }}>
                    ({isMultiplier ? `1-Die × ${characterMove.multiplier} AP` : `${characterMove?.baseAP || 25} AP`})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VS Center Indicator */}
          <div className="vs-circle cyber-vs-node" style={{ fontWeight: '900', color: 'var(--neon-cyan)', fontSize: '1.2rem', padding: '10px 16px', background: 'rgba(0, 240, 255, 0.12)', borderRadius: '50%', border: '2px solid rgba(0, 240, 255, 0.5)', boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)', fontFamily: 'Orbitron, sans-serif' }}>
            VS
          </div>

          {/* Defender Box */}
          <div className="combatant-side defender-side cyber-combatant-card" style={{ borderColor: 'var(--neon-gold)', padding: '14px 20px', background: 'rgba(255, 215, 0, 0.12)', borderRadius: '14px', border: '1.5px solid #ffd700', boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)' }}>
            <div className="combatant-role-badge def-badge" style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
              <Shield size={15} /> DEFENDER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', flexShrink: 0, boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)' }}>
                <img
                  src={getAssetUrl(defChar.image || 'characters/chynaman.png')}
                  alt={defender.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{defender.name}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--neon-gold)', marginTop: '2px' }}>
                  Innate DP: <strong>-{defChar.defaultDP} AP</strong>
                  <span style={{ fontSize: '0.78rem', marginLeft: '6px', opacity: 0.85 }}>(Rolls 6+ to activate)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D WebGL Physics Dice Throw Arena */}
        <div style={{ position: 'relative', width: '100%', margin: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 'bold' }}>
            <span style={{ color: '#ff3366', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Swords size={13} /> OFFENSE ({isMultiplier ? '1 RED DIE' : '2 RED DICE'})
            </span>
            <span style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={13} /> DEFENSE (2 GOLD DICE)
            </span>
          </div>

          <ThreeDiceArena
            attackerValues={attackerDice}
            defenderValues={defenderDice}
            isRolling={isRolling}
            isMultiplier={isMultiplier}
            onRollComplete={handlePhysicsRollComplete}
          />

          {/* Dynamic Stat Summary Strip below 3D Arena */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            <div style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center', fontSize: '0.82rem' }}>
              {isMultiplier ? (
                <span>Multiplier: <strong style={{ color: '#ff3366' }}>{attackerDice[0]} × {characterMove.multiplier} = {attackerDice[0] * characterMove.multiplier} AP</strong></span>
              ) : (
                <span>Attack Roll Sum: <strong style={{ color: '#ff3366' }}>{attackerDice[0] + attackerDice[1]}</strong></span>
              )}
            </div>

            <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center', fontSize: '0.82rem' }}>
              <span>Defense Roll Sum: <strong style={{ color: '#ffd700' }}>{defenderDice[0] + defenderDice[1]}</strong> {defenderDice[0] + defenderDice[1] >= 6 ? ' (6+ DP PASS)' : ' (<6 DP FAIL)'}</span>
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
