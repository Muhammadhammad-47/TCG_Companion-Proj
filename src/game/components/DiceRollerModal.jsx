import React, { useState } from 'react';
import { resolveDiceCombat } from '../utils/gameEngine';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, Flame, Skull, X, RotateCcw } from 'lucide-react';
import ThreeDiceArena from './ThreeDiceArena';

export default function DiceRollerModal({ combatData, onCombatComplete, onClose, onExecuteRetreat = null }) {
  const { attacker, defender, actionCard, characterMove, amplifyBonus = 0, playerCount = 2, isBackStab = false } = combatData;
  const defChar = defender.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defender.characterId] || CHARACTERS.chynaman);
  const atkChar = attacker.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[attacker.characterId] || CHARACTERS.chynaman);

  const checkPlayerHasRetreat = (player) => {
    if (!player) return false;
    const cards = [
      ...(Array.isArray(player.actionCardsHand) ? player.actionCardsHand : []),
      ...(Array.isArray(player.actionCardDeck) ? player.actionCardDeck : []),
      ...(Array.isArray(player.hand) ? player.hand : []),
      ...(Array.isArray(player.deck) ? player.deck : [])
    ];
    return cards.some(c => {
      if (!c) return false;
      if (typeof c === 'string') return c.toUpperCase().includes('RETREAT');
      const name = String(c.name || '').toUpperCase();
      const id = String(c.id || '').toUpperCase();
      return name.includes('RETREAT') || id.includes('RETREAT');
    });
  };

  const attackerHasRetreat = checkPlayerHasRetreat(attacker);
  const defenderHasRetreat = checkPlayerHasRetreat(defender);

  const isMultiplier = characterMove?.type === 'dice_mult';

  const [phase, setPhase] = useState('clash'); // 'clash' | 'clash_summary' | 'multiplier' | 'result'
  const [hasAttackerRolled, setHasAttackerRolled] = useState(false);
  const [hasDefenderRolled, setHasDefenderRolled] = useState(false);
  const [rollingSide, setRollingSide] = useState('both');
  const [isRolling, setIsRolling] = useState(false);
  const [clashAtkDice, setClashAtkDice] = useState([3, 4]);
  const [clashDefDice, setClashDefDice] = useState([3, 3]);
  const [multDie, setMultDie] = useState(3);
  
  const [result, setResult] = useState(null);
  const pendingResultRef = React.useRef(null);
  
  const [doublesAlert, setDoublesAlert] = useState(false);

  const handleRollAttacker = () => {
    if (isRolling || hasAttackerRolled) return;
    const finalAtk = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    setClashAtkDice(finalAtk);
    setRollingSide('attacker');
    setIsRolling(true);
    soundFX.playDiceRoll();
  };

  const handleRollDefender = () => {
    if (isRolling || hasDefenderRolled) return;
    // User requirement:
    // Once defender rolls the dice, the Retreat button and option will disappear on BOTH sides.
    // "The Retreat button disappears on the Attacker’s side once the Defender has rolled."
    // "The Retreat button disappears on the Defender’s side once the Defender has rolled the dice."
    setHasDefenderRolled(true);
    const finalDef = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    setClashDefDice(finalDef);
    setRollingSide('defender');
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
      isSingleDieMultiplier: true,
      playerCount,
      isBackStab
    });

    pendingResultRef.current = combatResult;
    setIsRolling(true);
    soundFX.playDiceRoll();
  };

  const handlePhysicsRollComplete = () => {
    setIsRolling(false);
    
    if (phase === 'clash') {
      if (!hasAttackerRolled) {
        setHasAttackerRolled(true);
        return;
      }
      
      const atkHasDoubles = clashAtkDice[0] === clashAtkDice[1];
      const defHasDoubles = clashDefDice[0] === clashDefDice[1];
      
      if (atkHasDoubles && defHasDoubles) {
        setDoublesAlert('both');
      } else if (atkHasDoubles) {
        setDoublesAlert('attacker');
      } else if (defHasDoubles) {
        setDoublesAlert('defender');
      }

      // Stop at a summary phase so users can see the clash outcome
      setPhase('clash_summary');
      
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
        <div className="modal-header combat-header cyber-dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(251, 200, 13, 0.25)', paddingBottom: '12px' }}>
          <div className="combat-title-box dialog-title-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="combat-step-badge clash-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(251, 200, 13, 0.15)', border: '1.5px solid #FBC80D', color: '#FBC80D', padding: '6px 14px', borderRadius: '8px', fontWeight: '900', letterSpacing: '0.08em', fontSize: '0.88rem' }}>
              <Dices size={18} /> OFFICIAL COMBAT CLASH
            </span>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: '#ffffff', fontFamily: 'Orbitron, sans-serif' }}>
              {attacker.name} <span style={{ color: 'var(--neon-pink)', margin: '0 8px' }}>??</span> {defender.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(237, 30, 36, 0.2)', border: '1px solid #ED1E24', borderRadius: '8px', color: '#ED1E24', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
            <X size={16} /> CANCEL
          </button>
        </div>

        {/* Banner */}
        <div className="combatants-banner cyber-clash-banner" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '18px', alignItems: 'center', margin: '12px 0' }}>
          <div className="combatant-side attacker-side cyber-combatant-card" style={{ borderColor: 'var(--neon-pink)', padding: '14px 20px', background: 'rgba(237, 30, 36, 0.12)', borderRadius: '14px', border: '1.5px solid #ED1E24' }}>
            <div className="combatant-role-badge atk-badge" style={{ fontSize: '0.8rem', color: '#ED1E24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Swords size={15} /> ATTACKER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ED1E24', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                <img src={getAssetUrl(atkChar.image)} alt={attacker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{attacker.name}</strong>
                <div style={{ fontSize: '0.92rem', color: 'var(--neon-pink)', marginTop: '2px' }}>
                  {characterMove?.name || actionCard?.name || 'Standard Attack'}
                  <span style={{ marginLeft: '6px', opacity: 0.9, fontWeight: 'bold' }}>
                    ({isMultiplier ? `1-Die � ${characterMove.multiplier} AP` : `${characterMove?.baseAP || 25} AP`})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="vs-circle" style={{ fontWeight: '900', color: 'var(--neon-gold)', fontSize: '1.2rem', padding: '10px 16px', background: 'rgba(251, 200, 13, 0.12)', borderRadius: '50%', border: '2px solid rgba(251, 200, 13, 0.5)' }}>VS</div>
          <div className="combatant-side defender-side cyber-combatant-card" style={{ borderColor: 'var(--neon-gold)', padding: '14px 20px', background: 'rgba(251, 200, 13, 0.12)', borderRadius: '14px', border: '1.5px solid #FBC80D' }}>
            <div className="combatant-role-badge def-badge" style={{ fontSize: '0.8rem', color: '#FBC80D', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} /> DEFENDER
            </div>
            <div className="combatant-details" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #FBC80D', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
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
          <div style={{ margin: '0 auto 10px', background: 'rgba(251, 200, 13, 0.2)', border: '1px solid #FBC80D', padding: '10px 20px', borderRadius: '8px', color: '#FBC80D', fontWeight: 'bold', fontSize: '1.1rem', animation: 'pulse 1.5s infinite' }}>
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
            rollingSide={phase === 'multiplier' ? 'attacker' : rollingSide}
            onRollComplete={handlePhysicsRollComplete}
          />
        </div>

        {/* Action Buttons & Results */}
        {phase === 'clash' && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            {/* Step 1: Attacker has not rolled yet */}
            {!hasAttackerRolled && (
              <div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={onClose}
                    disabled={isRolling}
                    style={{
                      width: '30%', padding: '14px', background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleRollAttacker}
                    disabled={isRolling}
                    style={{
                      flex: 1, padding: '14px', background: 'linear-gradient(90deg, #ff0055, #ff5500)',
                      color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(255, 42, 85, 0.5)'
                    }}
                  >
                    <Dices size={22} style={{marginRight: '8px'}} />
                    {isRolling ? 'ROLLING ATTACK DICE...' : '🎲 ROLL ATTACK DICE (2 RED DICE)'}
                  </button>
                </div>
                {/* Retreat buttons: visible before attacker rolls */}
                {(attackerHasRetreat || defenderHasRetreat) && onExecuteRetreat && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {attackerHasRetreat && (
                      <button
                        onClick={() => onExecuteRetreat('attacker')}
                        disabled={isRolling}
                        style={{
                          flex: 1, padding: '12px 18px', background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
                          color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                          boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
                        }}
                        title="Attacker forfeits the attack completely"
                      >
                        💨 ATTACKER RETREAT (FORFEIT)
                      </button>
                    )}
                    {defenderHasRetreat && (
                      <button
                        onClick={() => onExecuteRetreat('defender')}
                        disabled={isRolling}
                        style={{
                          flex: 1, padding: '12px 18px', background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
                          color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                          boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
                        }}
                        title="Defender escapes battle safely"
                      >
                        💨 DEFENDER RETREAT (ESCAPE)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Attacker has rolled, Defender has not rolled yet */}
            {hasAttackerRolled && !hasDefenderRolled && (
              <div>
                <div style={{ color: 'var(--neon-pink)', fontWeight: 'bold', fontSize: '1.15rem', marginBottom: '10px' }}>
                  ⚔️ {attacker.name} rolled {clashAtkDice[0] + clashAtkDice[1]} ({clashAtkDice[0]} + {clashAtkDice[1]})! Waiting for {defender.name} to roll defense...
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={onClose}
                    disabled={isRolling}
                    style={{
                      width: '30%', padding: '14px', background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleRollDefender}
                    disabled={isRolling}
                    style={{
                      flex: 1, padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #ff9900)',
                      color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(251, 200, 13, 0.5)'
                    }}
                  >
                    <Shield size={22} style={{marginRight: '8px'}} />
                    {isRolling ? 'ROLLING DEFENSE DICE...' : '🎲 ROLL DEFENSE DICE (2 GOLD DICE)'}
                  </button>
                </div>
                {/* Retreat buttons: Attacker can still retreat before defender rolls; Defender can retreat before rolling */}
                {(attackerHasRetreat || defenderHasRetreat) && onExecuteRetreat && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {attackerHasRetreat && (
                      <button
                        onClick={() => onExecuteRetreat('attacker')}
                        disabled={isRolling}
                        style={{
                          flex: 1, padding: '12px 18px', background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
                          color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                          boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
                        }}
                        title="Attacker forfeits the attack completely before defender rolls"
                      >
                        💨 ATTACKER RETREAT (FORFEIT)
                      </button>
                    )}
                    {defenderHasRetreat && (
                      <button
                        onClick={() => onExecuteRetreat('defender')}
                        disabled={isRolling}
                        style={{
                          flex: 1, padding: '12px 18px', background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
                          color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
                          boxShadow: '0 0 15px rgba(0, 210, 255, 0.4)'
                        }}
                        title="Defender escapes battle safely before rolling"
                      >
                        💨 DEFENDER RETREAT (ESCAPE)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'clash_summary' && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            <div style={{ color: '#FBC80D', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              CLASH SUMMARY
            </div>
            
            {doublesAlert && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#FBC80D', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', background: 'rgba(251, 200, 13,0.1)', padding: '8px', borderRadius: '6px' }}>
                  {doublesAlert === 'both' ? 'Both players rolled doubles! Both claim 1 Chance Card & Re-roll available.' :
                   doublesAlert === 'attacker' ? 'Attacker rolled doubles! Attacker claims 1 Chance Card & Re-roll available.' :
                   'Defender rolled doubles! Defender claims 1 Chance Card & Re-roll available.'}
                </div>
                <button
                  onClick={() => {
                    setDoublesAlert(false);
                    setHasAttackerRolled(false);
                    setHasDefenderRolled(false);
                    setPhase('clash');
                  }}
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #ffaa00)',
                    color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
                  }}
                >
                  RE-ROLL DICE (DOUBLES BONUS)
                </button>
              </div>
            )}

            {clashAtkDice[0] + clashAtkDice[1] === clashDefDice[0] + clashDefDice[1] ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ color: 'var(--neon-gold)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px' }}>
                  ⚔️ CLASH TIED ({clashAtkDice[0] + clashAtkDice[1]} vs {clashDefDice[0] + clashDefDice[1]})! RE-ROLL REQUIRED!
                </div>
                <button
                  onClick={() => {
                    setHasAttackerRolled(false);
                    setHasDefenderRolled(false);
                    setPhase('clash');
                  }}
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #ff8800)',
                    color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  RE-ROLL CLASH DICE
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDoublesAlert(false);
                  const atkSum = clashAtkDice[0] + clashAtkDice[1];
                  const defSum = clashDefDice[0] + clashDefDice[1];
                  
                  if (atkSum > defSum) {
                     if (isMultiplier) {
                       setPhase('multiplier');
                     } else {
                       const combatResult = resolveDiceCombat({
                         attacker, defender, actionCard, characterMove,
                         attackerRoll: [0, 0], clashWon: true, clashDefSum: defSum,
                         amplifyBonus, isSingleDieMultiplier: false, playerCount, isBackStab
                       });
                       setResult(combatResult);
                       setPhase('result');
                       if (combatResult.damageDealt > 0) soundFX.playDamage();
                     }
                  } else {
                     const combatResult = resolveDiceCombat({
                       attacker, defender, actionCard, characterMove, clashWon: false, clashDefSum: defSum, playerCount, isBackStab
                     });
                     setResult(combatResult);
                     setPhase('result');
                  }
                }}
                style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #0077ff)',
                  color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
                }}
              >
                PROCEED TO RESOLUTION
              </button>
            )}
          </div>
        )}

        {phase === 'multiplier' && (
          <div style={{ textAlign: 'center', margin: '15px 0 8px' }}>
            <div style={{ color: '#FBC80D', marginBottom: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              CLASH WON! ROLL MULTIPLIER
            </div>
            <button
              onClick={handleRollMultiplier}
              disabled={isRolling}
              style={{
                width: '100%', padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #0077ff)',
                color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer'
              }}
            >
              <Zap size={22} style={{marginRight: '8px'}} />
              {isRolling ? 'ROLLING MULTIPLIER...' : 'ROLL AP MULTIPLIER (1 RED)'}
            </button>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="combat-result-breakdown" style={{ background: 'rgba(0, 0, 0, 0.75)', border: '1px solid rgba(251, 200, 13, 0.4)', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '1.15rem', color: result.isMiss ? '#888' : (result.defenseActivated ? 'var(--neon-gold)' : '#39ff14') }}>
                {result.isMiss ? '❌ ATTACK MISSED (CLASH DEFLECTED)' : (result.defenseActivated ? '🛡️ INNATE DEFENSE 6+ ACHIEVED' : '💥 FULL DAMAGE PENETRATION')}
              </strong>
              {result.weaknessTriggered && (
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff4d00', background: 'rgba(255, 77, 0, 0.2)', border: '1px solid #ff4d00', padding: '2px 8px', borderRadius: '6px' }}>
                  🎯 WEAKNESS HIT (+{result.weaknessBonus} AP)
                </span>
              )}
            </div>

            {!result.isMiss && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px', margin: '10px 0' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>BASE AP</div>
                    <strong style={{ fontSize: '1rem', color: '#ED1E24' }}>{result.rawAP} AP</strong>
                  </div>

                  {result.weaknessTriggered && (
                    <div style={{ background: 'rgba(255, 77, 0, 0.15)', border: '1px solid rgba(255, 77, 0, 0.4)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#ff7733' }}>WEAKNESS</div>
                      <strong style={{ fontSize: '1rem', color: '#ff4d00' }}>+{result.weaknessBonus} AP</strong>
                    </div>
                  )}

                  <div style={{ background: result.defenseActivated ? 'rgba(251, 200, 13, 0.15)' : 'rgba(255,255,255,0.05)', border: result.defenseActivated ? '1px solid var(--neon-gold)' : 'none', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: result.defenseActivated ? 'var(--neon-gold)' : 'rgba(255,255,255,0.6)' }}>🛡️ DP (6+ ROLL)</div>
                    <strong style={{ fontSize: '1rem', color: result.defenseActivated ? 'var(--neon-gold)' : '#888' }}>
                      {result.defenseActivated ? `-${result.innateDP} AP` : '0 (Failed)'}
                    </strong>
                  </div>

                  {result.absorbedByShield > 0 && (
                    <div style={{ background: 'rgba(0, 240, 255, 0.15)', border: '1px solid #00f0ff', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: '#00f0ff' }}>SHIELD BLOCKED</div>
                      <strong style={{ fontSize: '1rem', color: '#00f0ff' }}>-{result.absorbedByShield} AP</strong>
                    </div>
                  )}

                  <div style={{ background: 'rgba(237, 30, 36, 0.25)', border: '1px solid #ED1E24', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#ED1E24' }}>NET HP DAMAGE</div>
                    <strong style={{ fontSize: '1.1rem', color: '#ff3344' }}>-{result.damageDealt} HP</strong>
                  </div>
                </div>

                {/* HP State Preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 12px', marginTop: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{defender.name || 'Defender'} Health:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>{defender.hp} HP</span>
                    <span style={{ color: '#ED1E24', margin: '0 6px' }}>➔</span>
                    <span style={{ color: Math.max(0, defender.hp - result.damageDealt) < 30 ? '#ED1E24' : '#39ff14' }}>
                      {Math.max(0, defender.hp - result.damageDealt)} HP
                    </span>
                  </span>
                </div>
              </>
            )}

            <button
              onClick={handleApplyDamage}
              style={{
                width: '100%', padding: '14px', background: 'linear-gradient(90deg, #FBC80D, #39ff14)',
                color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '1.05rem', cursor: 'pointer', marginTop: '12px'
              }}
            >
              <Check size={20} style={{marginRight: '8px', verticalAlign: 'middle'}} />
              APPLY COMBAT RESOLUTION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


