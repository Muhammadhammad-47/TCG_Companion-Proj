import React, { useState } from 'react';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, X, Sparkles, AlertCircle } from 'lucide-react';
import { getCardGraphicUrl, getCharacterAttackGraphicUrl } from './kontrolaAssets';

export default function KontrolaDiceRoller({ combatData, onCombatComplete, onClose, precalculatedRolls }) {
  const { attacker, defender, actionCard, attackSelectionName } = combatData;
  const defChar = defender || { name: 'Defender', hp: 100 };
  const atkChar = attacker || { name: 'Attacker', hp: 100 };

  const [phase, setPhase] = useState('clash'); // 'clash' | 'clash_summary'
  const [isRolling, setIsRolling] = useState(false);
  const [clashAtkDice, setClashAtkDice] = useState([3, 4]);
  const [clashDefDice, setClashDefDice] = useState([2, 3]);

  // Dice visual representation helper (pips)
  const renderDiceFace = (val, color = 'red') => {
    const isRed = color === 'red';
    const bg = isRed 
      ? 'linear-gradient(135deg, #ff3366 0%, #990022 100%)' 
      : 'linear-gradient(135deg, #ffe600 0%, #cc9900 100%)';
    const textColor = isRed ? '#ffffff' : '#000000';
    const border = isRed ? '2px solid #ff6688' : '2px solid #fff388';
    const shadow = isRed ? '0 0 15px rgba(255, 51, 102, 0.5)' : '0 0 15px rgba(255, 230, 0, 0.5)';

    return (
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: bg,
          border: border,
          boxShadow: shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: '900',
          color: textColor,
          fontFamily: 'Rajdhani, sans-serif'
        }}
      >
        {val}
      </div>
    );
  };

  const handleRollClash = () => {
    if (isRolling || !precalculatedRolls) return;
    setClashAtkDice(precalculatedRolls.attackerRoll.rolls);
    setClashDefDice(precalculatedRolls.defenderRoll.rolls);
    setIsRolling(true);
    if (soundFX?.playDiceRoll) soundFX.playDiceRoll();

    setTimeout(() => {
      setIsRolling(false);
      setPhase('clash_summary');
    }, 800);
  };

  const atkSum = clashAtkDice[0] + clashAtkDice[1];
  const defSum = clashDefDice[0] + clashDefDice[1];
  const atkWon = atkSum >= defSum;

  const cardImg = attackSelectionName 
    ? getCharacterAttackGraphicUrl(attackSelectionName) 
    : getCardGraphicUrl(actionCard?.name, atkChar.id);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(10, 28, 65, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%)',
        backdropFilter: 'blur(16px)',
        padding: '24px 36px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'Outfit, sans-serif'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--neon-cyan)', fontSize: '1.4rem' }}>✦</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px', color: '#fff' }}>
              COMBAT CLASH RESOLUTION
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              ATTACKER 2 RED DICE · DEFENDER 2 GOLD DICE
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              padding: '6px 12px'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Grid: Card Art Preview + Dice Arena */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', flex: 1, alignItems: 'center' }}>
        {/* Left: Active Card Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
            {attackSelectionName || actionCard?.name}
          </div>
          <div style={{ width: '190px', height: '270px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
            <img
              src={cardImg}
              alt={actionCard?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Right: Dice Clash Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Attacker vs Defender Dice Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Attacker Section */}
            <div style={{ background: 'rgba(255, 51, 102, 0.08)', border: '1.5px solid rgba(255, 51, 102, 0.3)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--neon-crimson)', marginBottom: '12px' }}>
                ⚔️ {atkChar.name} (Attacker)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '12px' }}>
                {renderDiceFace(clashAtkDice[0], 'red')}
                {renderDiceFace(clashAtkDice[1], 'red')}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--neon-crimson)', fontFamily: 'Rajdhani, sans-serif' }}>
                TOTAL: {atkSum}
              </div>
            </div>

            {/* VS Badge */}
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Rajdhani, sans-serif' }}>
              VS
            </div>

            {/* Defender Section */}
            <div style={{ background: 'rgba(255, 230, 0, 0.08)', border: '1.5px solid rgba(255, 230, 0, 0.3)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--neon-gold)', marginBottom: '12px' }}>
                🛡️ {defChar.name} (Defender)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '12px' }}>
                {renderDiceFace(clashDefDice[0], 'gold')}
                {renderDiceFace(clashDefDice[1], 'gold')}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--neon-gold)', fontFamily: 'Rajdhani, sans-serif' }}>
                TOTAL: {defSum}
              </div>
            </div>
          </div>

          {/* Action Resolution Status / Roll Trigger */}
          {phase === 'clash' && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                onClick={handleRollClash}
                disabled={isRolling}
                style={{
                  background: 'linear-gradient(90deg, #00f0ff 0%, #0077ff 100%)',
                  border: 'none',
                  color: '#000',
                  padding: '16px 40px',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: isRolling ? 'wait' : 'pointer',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Dices size={24} />
                <span>{isRolling ? 'ROLLING DICE...' : 'ROLL CLASH DICE'}</span>
              </button>
            </div>
          )}

          {phase === 'clash_summary' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: atkWon ? '1.5px solid var(--neon-cyan)' : '1.5px solid var(--neon-gold)', borderRadius: '14px', padding: '16px 24px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: atkWon ? 'var(--neon-cyan)' : 'var(--neon-gold)', fontFamily: 'Rajdhani, sans-serif' }}>
                {atkWon ? '⚔️ ATTACK SUCCESSFUL!' : '🛡️ DEFENDER BLOCKED / DODGED!'}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#fff', opacity: 0.9 }}>
                {atkWon 
                  ? `Attacker total (${atkSum}) beat Defender (${defSum}). Damage will be calculated and applied!`
                  : `Defender total (${defSum}) resisted Attacker (${atkSum}). 0 damage dealt.`
                }
              </p>

              <button
                onClick={onCombatComplete}
                style={{
                  background: '#39ff14',
                  color: '#000',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)'
                }}
              >
                <Check size={20} />
                <span>APPLY RESULT & PROCEED</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}