import React, { useState } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, Flame, Skull, X } from 'lucide-react';
import ThreeDiceArena from './ThreeDiceArena';

export default function DiceRollerModal({ combatData, onCombatComplete, onClose }) {
  const { attacker, defender, actionCard, characterMove, amplifyBonus = 0 } = combatData;
  const defChar = defender.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);
  const atkChar = attacker.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[attacker.characterId] || CHARACTERS.chynaman);

  const isMultiplier = characterMove?.type === 'dice_mult';

  const [phase, setPhase] = useState('clash'); // 'clash' | 'multiplier' | 'result'
  const [isRolling, setIsRolling] = useState(false);
  const [clashAtkDice, setClashAtkDice] = useState([3, 4]);
  const [clashDefDice, setClashDefDice] = useState([3, 3]);
  const [multDie, setMultDie] = useState(3);
  
  const [result, setResult] = useState(null);
  const pendingResultRef = React.useRef(null);
  
  const [doublesAlert, setDoublesAlert] = useState(false);

  const handleRollClash = () => {
    if (isRolling) return;
    const finalAtk = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    const finalDef = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    
    setClashAtkDice(finalAtk);
    setClashDefDice(finalDef);
    setIsRolling(true);
    soundFX.playDiceRoll();
  };

  const handleRollMultiplier = () => {
    if (isRolling) return;
    const finalMult = Math.floor(Math.random() * 6) + 1;
    setMultDie(finalMult);
    
    const atkSum = clashAtkDice[0] + clashAtkDice[1];
    const defSum = clashDefDice[0] + clashDefDice[1];

    const combatResult = resolveDiceCombat({
      attacker,
      defender,
      actionCard,
      characterMove,
      attackerRoll: [finalMult], // The multiplier roll
      clashWon: true,
      clashDefSum: defSum,
      amplifyBonus,
      isSingleDieMultiplier: true
    });

    pendingResultRef.current = combatResult;
    setIsRolling(true);
    soundFX.playDiceRoll();
  };

  const handlePhysicsRollComplete = () => {
    setIsRolling(false);
    
    if (phase === 'clash') {
      const atkSum = clashAtkDice[0] + clashAtkDice[1];
      const defSum = clashDefDice[0] + clashDefDice[1];
      
      if (clashAtkDice[0] === clashAtkDice[1]) {
        setDoublesAlert(true);
      }

      if (atkSum > defSum) {
        if (isMultiplier) {
          setPhase('multiplier');
        } else {
          // Flat damage, go straight to result
          const combatResult = resolveDiceCombat({
            attacker,
            defender,
            actionCard,
            characterMove,
            attackerRoll: [0, 0], // Not used for flat
            clashWon: true,
            clashDefSum: defSum,
            amplifyBonus,
            isSingleDieMultiplier: false
          });
          setResult(combatResult);
          setPhase('result');
          if (combatResult.damageDealt > 0) soundFX.playDamage();
        }
      } else {
        // Miss or Tie (Tie counts as Miss for clash in this version unless explicitly requested, 
        // wait, we can just say Miss to prevent infinite loops)
        const combatResult = resolveDiceCombat({
          attacker, defender, actionCard, characterMove,
          clashWon: false
        });
        setResult(combatResult);
        setPhase('result');
      }
    } else if (phase === 'multiplier') {
      const combatResult = pendingResultRef.current;
      setResult(combatResult);
      setPhase('result');
      if (combatResult?.damageDealt > 0) soundFX.playDamage();
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
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2000,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(10, 28, 65, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%)',
        backdropFilter: 'blur(16px)', padding: '20px 36px', boxSizing: 'border-box',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}
    >
      <div
        className="dice-combat-modal cyber-glass-dialog combat-clash-dialog"
        style={{
          width: '100%', maxWidth: '1280px', margin: '0 auto', height: '100%',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: 'transparent', border: 'none', boxShadow: 'none', padding: 0
        }}
      >
        {/* Header */}
        <div className="modal-header combat-header cyber-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.25)', paddingBottom: '12px' }}>
          <div className="combat-title-box dialog-title-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="combat-step-badge clash-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 240, 255, 0.15)', border: '1.5px solid #00f0ff', color: '#00f0ff', padding: '6px 14px', borderRadius: '8px', fontWeight: '900', letterSpacing: '0.08em', fontSize: '0.88rem' }}>
              <Dices size={18} /> OFFICIAL COMBAT CLASH
            </span>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontFamily: 'Orbitron, sans-serif' }}>
              {attacker.name} <span style={{ color: 'var(--neon-pink)', margin: '0 8px' }}>⚔️</span> {defender.name}
            </h2>
          </div>
        </div>

        {/* Banner */}
        <div className="combatants-banner cyber-clash-banner" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '18px', alignItems: 'center', margin: '12px 0' }}>
          <div className="combatant-side attacker-side cyber-combatant-card" style={{ borderColor: 'var(--neon-pink)', padding: '14px 20px', background: 'rgba(255, 51, 102, 0.12)', borderRadius: '14px', border: '1.5px solid #ff3366' }}>
            <div className="combatant-role-badge atk-badge" style={{ fontSize: '0.8rem', color: '#ff3366', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Swords size={15} /> ATTACKER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                <img src={getAssetUrl(atkChar.image)} alt={attacker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div className="vs-circle" style={{ fontWeight: '900', color: 'var(--neon-cyan)', fontSize: '1.2rem', padding: '10px 16px', background: 'rgba(0, 240, 255, 0.12)', borderRadius: '50%', border: '2px solid rgba(0, 240, 255, 0.5)' }}>VS</div>
          <div className="combatant-side defender-side cyber-combatant-card" style={{ borderColor: 'var(--neon-gold)', padding: '14px 20px', background: 'rgba(255, 215, 0, 0.12)', borderRadius: '14px', border: '1.5px solid #ffd700' }}>
            <div className="combatant-role-badge def-badge" style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} /> DEFENDER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                <img src={getAssetUrl(defChar.image)} alt={defender.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{defender.name}</strong>
                <div style={{ fontSize: '0.9rem', color: 'var(--neon-gold)', marginTop: '2px' }}>
                  Innate DP: <strong>-{defChar.defaultDP} AP</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {doublesAlert && (
          <div style={{ margin: '0 auto 10px', background: 'rgba(255, 215, 0, 0.2)', border: '1px solid #ffd700', padding: '10px 20px', borderRadius: '8px', color: '#ffd700', fontWeight: 'bold', fontSize: '1.1rem', animation: 'pulse 1.5s infinite' }}>
            DOUBLES! Claim 1 Chance Card and Re-roll!
          </div>
        )}

        {/* 3D WebGL Physics Dice Throw Arena */}
        <div style={{ position: 'relative', width: '100%', margin: '10px 0' }}>
          <ThreeDiceArena
            attackerValues={phase === 'multiplier' ? [multDie, 1] : clashAtkDice}
            defenderValues={clashDefDice}
            isRolling={isRolling}
            isMultiplier={phase === 'multiplier'}
            onRollComplete={handlePhysicsRollComplete}
          />
        </div>

        {/* Action Buttons & Results */}
        {phase === 'clash' && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            <button
              onClick={handleRollClash}
              disabled={isRolling}
              style={{
                width: '100%', padding: '14px', background: 'linear-gradient(90deg, #ff0055, #ff5500)',
                color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
              }}
            >
              <Dices size={22} style={{marginRight: '8px'}} />
              {isRolling ? 'CASTING CLASH...' : 'ROLL CLASH (2 RED vs 2 GOLD)'}
            </button>
          </div>
        )}

        {phase === 'multiplier' && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            <div style={{ color: '#00f0ff', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              CLASH WON! ROLL MULTIPLIER
            </div>
            <button
              onClick={handleRollMultiplier}
              disabled={isRolling}
              style={{
                width: '100%', padding: '14px', background: 'linear-gradient(90deg, #00f0ff, #0077ff)',
                color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
              }}
            >
              <Zap size={22} style={{marginRight: '8px'}} />
              {isRolling ? 'ROLLING MULTIPLIER...' : 'ROLL AP MULTIPLIER (1 RED)'}
            </button>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="combat-result-breakdown" style={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '1.1rem', color: result.isMiss ? '#888' : (result.defenseActivated ? 'var(--neon-cyan)' : '#ff3366') }}>
                {result.isMiss ? '❌ ATTACK MISSED (CLASH LOST)' : (result.defenseActivated ? '🛡️ DEFENSE 6+ ACHIEVED' : '💥 FULL DAMAGE PENETRATION')}
              </strong>
            </div>

            {!result.isMiss && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', margin: '10px 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>BASE AP</div>
                  <strong style={{ fontSize: '1rem', color: '#ff3366' }}>{result.rawAP} AP</strong>
                </div>

                <div style={{ background: result.defenseActivated ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)', border: result.defenseActivated ? '1px solid var(--neon-cyan)' : 'none', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: result.defenseActivated ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.6)' }}>🛡️ DP REDUCTION</div>
                  <strong style={{ fontSize: '1rem', color: result.defenseActivated ? 'var(--neon-cyan)' : '#888' }}>
                    {result.defenseActivated ? `-${result.innateDP} AP` : '0 (Failed)'}
                  </strong>
                </div>

                <div style={{ background: 'rgba(255, 51, 102, 0.2)', border: '1px solid #ff3366', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#ff3366' }}>NET HP DAMAGE</div>
                  <strong style={{ fontSize: '1.1rem', color: '#ff3366' }}>-{result.damageDealt} HP</strong>
                </div>
              </div>
            )}

            <button
              onClick={handleApplyDamage}
              style={{
                width: '100%', padding: '12px', background: 'linear-gradient(90deg, #00f0ff, #0088ff)',
                color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px'
              }}
            >
              <Check size={20} style={{marginRight: '8px'}} />
              APPLY COMBAT RESOLUTION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}