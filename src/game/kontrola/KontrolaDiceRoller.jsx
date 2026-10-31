import React, { useState, useEffect, useRef } from 'react';
import { soundFX } from '../utils/audio';
import { Dices, Shield, Swords, Check, Zap, X, Sparkles, AlertCircle, Clock, Eye, RotateCcw } from 'lucide-react';
import { getCardGraphicUrl, getCharacterAttackGraphicUrl } from './kontrolaAssets';
import { KONTROLA_CHARACTERS } from './KontrolaEngine';

// Helper to draw authentic dice face texture matching ThreeDiceArena.jsx exactly
function drawDiceFaceToCanvas(canvas, value, theme) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  const isRed = theme === 'red';

  // Base background radial gradient - rich, saturated jewel-tone to avoid center bloom blowout
  const bgGrad = ctx.createRadialGradient(128, 128, 15, 128, 128, 160);
  if (isRed) {
    bgGrad.addColorStop(0, '#e01840');
    bgGrad.addColorStop(0.5, '#b00024');
    bgGrad.addColorStop(1, '#500010');
  } else {
    bgGrad.addColorStop(0, '#ffe066');
    bgGrad.addColorStop(0.7, '#d4a017');
    bgGrad.addColorStop(1, '#805900');
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Outer beveled border
  ctx.strokeStyle = isRed ? 'rgba(255, 120, 150, 0.6)' : 'rgba(255, 245, 180, 0.7)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 242);

  // Inner subtle border
  ctx.strokeStyle = isRed ? 'rgba(0, 0, 0, 0.35)' : 'rgba(100, 70, 0, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 220, 220);

  // If unrolled (e.g. 0 or null), draw an elegant blank dice face
  if (!value || value < 1) {
    return;
  }

  // Pip drawing helper with authentic drop shadow & gradient
  const drawPip = (x, y) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);

    const pipGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 22);
    if (isRed) {
      pipGrad.addColorStop(0, '#ffffff');
      pipGrad.addColorStop(0.7, '#f5f5f5');
      pipGrad.addColorStop(1, '#e0e0e0');
    } else {
      pipGrad.addColorStop(0, '#332005');
      pipGrad.addColorStop(0.8, '#1a1000');
      pipGrad.addColorStop(1, '#050300');
    }

    ctx.fillStyle = pipGrad;
    ctx.shadowColor = isRed ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = isRed ? 8 : 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    // High contrast crisp dark border for red dice so pips never wash out against bright red background
    if (isRed) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#220006';
      ctx.stroke();
    }
    ctx.restore();
  };

  const c = 128;
  const l = 68;
  const r = 188;
  const t = 68;
  const b = 188;

  switch (value) {
    case 1:
      drawPip(c, c);
      break;
    case 2:
      drawPip(l, t);
      drawPip(r, b);
      break;
    case 3:
      drawPip(l, t);
      drawPip(c, c);
      drawPip(r, b);
      break;
    case 4:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 5:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(c, c);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 6:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(l, c);
      drawPip(r, c);
      drawPip(l, b);
      drawPip(r, b);
      break;
    default:
      drawPip(c, c);
  }
}

// Authentic Canvas Pip Die Component matching Score Calculator
export function CanvasPipDie({ value = 1, theme = 'red', isRolling = false, size = 68 }) {
  const canvasRef = useRef(null);
  const [displayVal, setDisplayVal] = useState(value);

  // During roll animation, rapidly cycle values
  useEffect(() => {
    let interval = null;
    if (isRolling) {
      interval = setInterval(() => {
        const rand = Math.floor(Math.random() * 6) + 1;
        setDisplayVal(rand);
      }, 60);
    } else {
      setDisplayVal(value);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRolling, value]);

  useEffect(() => {
    drawDiceFaceToCanvas(canvasRef.current, displayVal, theme);
  }, [displayVal, theme]);

  const isRed = theme === 'red';

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'inline-block',
        transform: isRolling ? 'rotate(8deg) scale(1.05)' : 'none',
        transition: 'transform 0.15s ease',
        filter: isRed
          ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
          : 'drop-shadow(0 6px 14px rgba(255, 224, 102, 0.35))'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '14px',
          display: 'block',
          boxShadow: isRolling
            ? '0 0 25px #FBC80D'
            : isRed
            ? '0 0 12px rgba(0, 0, 0, 0.6)'
            : '0 0 14px rgba(255, 224, 102, 0.25)',
          animation: isRolling ? 'diceWobble 0.2s infinite ease-in-out' : 'none'
        }}
      />
    </div>
  );
}

export default function KontrolaDiceRoller({
  combatData,
  onCombatComplete = () => {},
  onClose = () => {},
  precalculatedRolls,
  isAttacker = true,
  isDefender = false,
  isSpectator = false,
  isHost = false,
  isExternallyRolling = false,
  onTriggerRoll = null,
  onForceClose = null,
  playerHand = [],
  onExecuteRetreat = null
}) {
  const hasRetreatCard = Array.isArray(playerHand) && playerHand.some(c => 
    (typeof c === 'string' ? c : (c?.name || '')).toUpperCase().includes('RETREAT')
  );
  // SAFETY: Ensure combatData and all required properties exist before using them
  // This prevents "Cannot access X before initialization" errors during build minification
  if (!combatData) {
    console.error('[KontrolaDiceRoller] ERROR: combatData is null/undefined!');
    return null;
  }
  
  console.log('[KontrolaDiceRoller] Component mounted with combatData:', {
    hasAttacker: !!combatData?.attacker,
    hasDefender: !!combatData?.defender,
    attackerPlayerName: combatData?.attacker?.name || combatData?.attackerPlayerName,
    defenderPlayerName: combatData?.defender?.name || combatData?.defenderPlayerName,
    actionCard: typeof combatData?.actionCard === 'string' ? combatData.actionCard : combatData?.actionCard?.name,
    attackSelectionName: combatData?.attackSelectionName,
    isAttacker,
    isDefender,
    isSpectator,
    isHost,
    allPropsValid: !![combatData?.attacker, combatData?.defender, combatData?.actionCard].every(p => p)
  });
  
  const { attacker, defender, actionCard, attackSelectionName, attackerPlayerName, defenderPlayerName } = combatData || {};
  const resolvedCardName = typeof actionCard === 'string' ? actionCard : (actionCard?.name || '');
  
  // CRITICAL FIX: Ensure these NEVER become undefined to prevent minification variable errors
  const defChar = defender || { 
    name: defenderPlayerName || 'Defender', 
    hp: 100,
    energyTokens: 5
  };
  const atkChar = attacker || { 
    name: attackerPlayerName || 'Attacker', 
    hp: 100,
    energyTokens: 5
  };

  const [phase, setPhase] = useState('clash'); // 'clash' | 'clash_summary'
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [rerollKey, setRerollKey] = useState(0);

  // Independent roll completion states per client specification
  const [hasAttackerRolled, setHasAttackerRolled] = useState(
    Boolean(precalculatedRolls?.attackerRoll?.rolls)
  );
  const [hasDefenderRolled, setHasDefenderRolled] = useState(
    Boolean(precalculatedRolls?.defenderRoll?.rolls)
  );
  const [isAttackerRolling, setIsAttackerRolling] = useState(false);
  const [isDefenderRolling, setIsDefenderRolling] = useState(false);

  // Active dice values (null until rolled)
  const [clashAtkDice, setClashAtkDice] = useState(
    precalculatedRolls?.attackerRoll?.rolls || null
  );
  const [clashDefDice, setClashDefDice] = useState(
    precalculatedRolls?.defenderRoll?.rolls || null
  );

  // Interactive 2nd-stage multiplier die for character "PER" attacks
  const [hasRolledMultiplier, setHasRolledMultiplier] = useState(false);
  const [isRollingMultiplier, setIsRollingMultiplier] = useState(false);
  const [multiplierDie, setMultiplierDie] = useState(precalculatedRolls?.dRoll?.total || 1);

  // Fate Card states for doubles detection
  const [attackerFateCard, setAttackerFateCard] = useState(false);
  const [defenderFateCard, setDefenderFateCard] = useState(false);
  const [showRerollOption, setShowRerollOption] = useState(false);

  // Authoritative dice sources: local clash dice OR precalculated broadcast dice
  const activeAtkDice = clashAtkDice || precalculatedRolls?.attackerRoll?.rolls || null;
  const activeDefDice = clashDefDice || precalculatedRolls?.defenderRoll?.rolls || null;

  const isRolling = isAttackerRolling || isDefenderRolling || (isExternallyRolling && phase === 'clash');

  const atkSum = activeAtkDice ? (activeAtkDice[0] + activeAtkDice[1]) : 0;
  const defSum = activeDefDice ? (activeDefDice[0] + activeDefDice[1]) : 0;
  const isTie = hasAttackerRolled && hasDefenderRolled && atkSum === defSum;
  const atkWon = hasAttackerRolled && hasDefenderRolled && !isTie && atkSum > defSum;
  const defWon = hasAttackerRolled && hasDefenderRolled && !isTie && defSum > atkSum;

  // Robust attack info lookup with character template fallback
  const charKey = atkChar?.id || combatData?.attackerId || combatData?.actorId || 'chynaman';
  const charTemplate = KONTROLA_CHARACTERS[charKey] || Object.values(KONTROLA_CHARACTERS).find(c => c.name?.toLowerCase() === atkChar?.name?.toLowerCase());
  const selectedAttackInfo = atkChar?.attacks?.[attackSelectionName] || charTemplate?.attacks?.[attackSelectionName];
  const hasMultiplierDie = Boolean(selectedAttackInfo && selectedAttackInfo.dice > 0);

  const handleFinishCombat = () => {
    const finalAtkRolls = activeAtkDice || [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    const finalAtkTotal = finalAtkRolls[0] + finalAtkRolls[1];

    const finalDefRolls = activeDefDice || [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
    const finalDefTotal = finalDefRolls[0] + finalDefRolls[1];

    const finalRolls = {
      attackerRoll: { rolls: finalAtkRolls, total: finalAtkTotal },
      defenderRoll: { rolls: finalDefRolls, total: finalDefTotal },
      dRoll: hasMultiplierDie ? { rolls: [multiplierDie], total: multiplierDie } : undefined,
      defenseCard: combatData?.defenseCard || precalculatedRolls?.defenseCard || null
    };
    if (typeof onCombatComplete === 'function') {
      onCombatComplete(finalRolls);
    }
  };

  function handleReRoll() {
    if (isAttackerRolling || isDefenderRolling) return;
    // Reset internal state for re-rolling on tie
    setPhase('clash');
    setRerollKey(k => k + 1);
    setHasAttackerRolled(false);
    setHasDefenderRolled(false);
    setClashAtkDice(null);
    setClashDefDice(null);
    setIsAttackerRolling(false);
    setIsDefenderRolling(false);
    setShowRerollOption(false);
    setAttackerFateCard(false);
    setDefenderFateCard(false);
    
    if (onTriggerRoll) {
      onTriggerRoll(null, true); // Signal reroll reset to parent
    }
  }

  // Detect if player rolled doubles and award Fate Card
  function handleDoubleDetection(dice1, dice2) {
    const hasDouble = dice1 === dice2;
    if (hasDouble) {
      console.log('[Dice] Double detected!', { dice1, dice2, total: dice1 + dice2 });
      return true;
    }
    return false;
  }

  // ─── ATTACKER ROLLS ────────────────────────────────────────────────────────
  // Flow:
  //   1. Generate the result locally
  //   2. Immediately broadcast it to ALL players (including self via RPC echo)
  //   3. Start the animation on this client (everyone else starts on receipt)
  //   4. When animation ends, APPLY the broadcast value (authoritative) — not
  //      the locally-stored one — so every screen lands on the identical number.
  function handleRollAttacker() {
    if (isAttackerRolling || hasAttackerRolled) return;

    // 1. Generate result
    const atkRolls = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];

    // 2. Broadcast immediately (before animation finishes)
    if (onTriggerRoll) {
      onTriggerRoll({
        attackerRoll: { rolls: atkRolls, total: atkRolls[0] + atkRolls[1] },
        attackerDouble: handleDoubleDetection(atkRolls[0], atkRolls[1])
      });
    }

    // 3. Start animation on this client (keep dice spinning, don't reveal yet)
    setIsAttackerRolling(true);
    if (soundFX?.playDiceRoll) soundFX.playDiceRoll();

    // 4. Animation ends → apply the authoritative value we already broadcast
    setTimeout(() => {
      setClashAtkDice(atkRolls);
      setIsAttackerRolling(false);
      setHasAttackerRolled(true);

      const hasDouble = handleDoubleDetection(atkRolls[0], atkRolls[1]);
      if (hasDouble) { setAttackerFateCard(true); setShowRerollOption(true); }
    }, 900);
  }

  // ─── DEFENDER ROLLS ────────────────────────────────────────────────────────
  // Same flow as attacker: generate → broadcast → animate → apply broadcast value.
  function handleRollDefender() {
    if (isDefenderRolling || hasDefenderRolled) return;

    // 1. Generate result
    const defRolls = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];

    // 2. Broadcast immediately
    if (onTriggerRoll) {
      onTriggerRoll({
        defenderRoll: { rolls: defRolls, total: defRolls[0] + defRolls[1] },
        defenderDouble: handleDoubleDetection(defRolls[0], defRolls[1])
      });
    }

    // 3. Start animation
    setIsDefenderRolling(true);
    if (soundFX?.playDiceRoll) soundFX.playDiceRoll();

    // 4. Apply authoritative value when animation ends
    setTimeout(() => {
      setClashDefDice(defRolls);
      setIsDefenderRolling(false);
      setHasDefenderRolled(true);

      const hasDouble = handleDoubleDetection(defRolls[0], defRolls[1]);
      if (hasDouble) { setDefenderFateCard(true); setShowRerollOption(true); }
    }, 900);
  }

  // Interactive 2nd-stage multiplier die for "PER" character moves
  function handleRollMultiplierDie() {
    if (isRollingMultiplier || hasRolledMultiplier) return;
    setIsRollingMultiplier(true);
    if (soundFX?.playDiceRoll) soundFX.playDiceRoll();
    const roll = Math.floor(Math.random() * 6) + 1;
    setTimeout(() => {
      setMultiplierDie(roll);
      setIsRollingMultiplier(false);
      setHasRolledMultiplier(true);
      if (onTriggerRoll) {
        onTriggerRoll({
          dRoll: { rolls: [roll], total: roll }
        });
      }
    }, 850);
  }

  // 15-Second safety auto-roll countdown to prevent combat stalling
  const autoRollRef = useRef({});
  
  // Keep refs up to date without triggering useEffect re-runs
  useEffect(() => {
    autoRollRef.current = {
      isAttacker, hasAttackerRolled, handleRollAttacker,
      isDefender, hasDefenderRolled, handleRollDefender,
      phase, hasRolledMultiplier, handleRollMultiplierDie, handleFinishCombat,
      isHost, isTie, handleReRoll
    };
  }, [isAttacker, hasAttackerRolled, handleRollAttacker, isDefender, hasDefenderRolled, handleRollDefender, phase, hasRolledMultiplier, handleRollMultiplierDie, handleFinishCombat, isHost, isTie, handleReRoll]);

  useEffect(() => {
    setSecondsRemaining(15);
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const refs = autoRollRef.current;
          
          if (refs.phase === 'clash') {
            if (!refs.hasAttackerRolled) {
              // Only attacker rolls; host only rolls as fallback if not the attacker
              if (refs.isAttacker) refs.handleRollAttacker();
              else if (refs.isHost && !refs.isDefender) refs.handleRollAttacker();
            } else if (!refs.hasDefenderRolled) {
              // Only defender rolls; host only rolls as fallback if not the defender
              if (refs.isDefender) refs.handleRollDefender();
              else if (refs.isHost && !refs.isAttacker) refs.handleRollDefender();
            }
          } else if (refs.phase === 'clash_summary') {
            if (refs.isAttacker || refs.isHost) {
              if (refs.isTie) refs.handleReRoll();
              else if (refs.hasRolledMultiplier === false) refs.handleRollMultiplierDie();
              else if (showRerollOption && (attackerFateCard || defenderFateCard)) { /* Wait for player to choose re-roll */ }
              else if (typeof refs.handleFinishCombat === 'function') refs.handleFinishCombat();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, rerollKey]);

  // Sync rolls when precalculatedRolls updates from peer broadcast
  // ─── RPC receive path ──────────────────────────────────────────────────────
  useEffect(() => {
    const hasNoDiceRolls = !precalculatedRolls ||
      (!precalculatedRolls.attackerRoll?.rolls && !precalculatedRolls.defenderRoll?.rolls);

    if (hasNoDiceRolls) {
      // Re-roll / tie reset broadcast received: wipe all client dice and return to clash phase
      setClashAtkDice(null);
      setClashDefDice(null);
      setHasAttackerRolled(false);
      setHasDefenderRolled(false);
      setIsAttackerRolling(false);
      setIsDefenderRolling(false);
      setShowRerollOption(false);
      setAttackerFateCard(false);
      setDefenderFateCard(false);
      setSecondsRemaining(15);
      setRerollKey(k => k + 1);
      setPhase('clash');
      return;
    }

    // Attacker roll arrived via broadcast
    if (precalculatedRolls?.attackerRoll?.rolls) {
      const rolls = precalculatedRolls.attackerRoll.rolls;
      if (precalculatedRolls.attackerDouble || (rolls[0] === rolls[1])) {
        setAttackerFateCard(true);
        setShowRerollOption(true);
      }

      if (!isAttacker) {
        // Remote client (defender/spectator): start animation if not rolling, then apply value
        if (!hasAttackerRolled && !isAttackerRolling) {
          setIsAttackerRolling(true);
          if (soundFX?.playDiceRoll) soundFX.playDiceRoll();
          setTimeout(() => {
            setClashAtkDice(rolls);
            setIsAttackerRolling(false);
            setHasAttackerRolled(true);
          }, 900);
        } else {
          // Keep clashAtkDice in sync with authoritative broadcast
          setClashAtkDice(rolls);
          setIsAttackerRolling(false);
          setHasAttackerRolled(true);
        }
      } else {
        setClashAtkDice(rolls);
      }
    }

    // Defender roll arrived via broadcast
    if (precalculatedRolls?.defenderRoll?.rolls) {
      const rolls = precalculatedRolls.defenderRoll.rolls;
      if (precalculatedRolls.defenderDouble || (rolls[0] === rolls[1])) {
        setDefenderFateCard(true);
        setShowRerollOption(true);
      }

      if (!isDefender) {
        // Remote client (attacker/spectator): start animation if not rolling, then apply value
        if (!hasDefenderRolled && !isDefenderRolling) {
          setIsDefenderRolling(true);
          if (soundFX?.playDiceRoll) soundFX.playDiceRoll();
          setTimeout(() => {
            setClashDefDice(rolls);
            setIsDefenderRolling(false);
            setHasDefenderRolled(true);
          }, 900);
        } else {
          setClashDefDice(rolls);
          setIsDefenderRolling(false);
          setHasDefenderRolled(true);
        }
      } else {
        setClashDefDice(rolls);
      }
    }

    if (precalculatedRolls?.dRoll?.total && !hasRolledMultiplier && !isRollingMultiplier) {
      setMultiplierDie(precalculatedRolls.dRoll.total);
      setHasRolledMultiplier(true);
    }
  }, [precalculatedRolls, hasAttackerRolled, isAttackerRolling, isAttacker, hasDefenderRolled, isDefenderRolling, isDefender, hasRolledMultiplier, isRollingMultiplier]);

  // Transition to summary once both players have completed their roll
  useEffect(() => {
    if (hasAttackerRolled && hasDefenderRolled && phase === 'clash') {
      const timer = setTimeout(() => {
        setPhase('clash_summary');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [hasAttackerRolled, hasDefenderRolled, phase]);

  const cardImg = attackSelectionName
    ? getCharacterAttackGraphicUrl(attackSelectionName)
    : getCardGraphicUrl(resolvedCardName, atkChar?.id);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(10, 24, 52, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        padding: '24px 32px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'Barlow Condensed, sans-serif',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <style>{`
        @keyframes diceWobble {
          0% { transform: rotate(-5deg) scale(1.02); }
          50% { transform: rotate(5deg) scale(1.08); }
          100% { transform: rotate(-5deg) scale(1.02); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>

      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(251, 200, 13, 0.25)',
          paddingBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,119,255,0.4))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0,240,255,0.5)',
              color: 'var(--neon-cyan)'
            }}
          >
            <Dices size={24} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.4rem',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '1.5px',
                color: '#fff',
                fontWeight: '900'
              }}
            >
              KONTROLA CLASH ARENA
            </h2>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--neon-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>ATTACKER 2 RED PIP DICE</span>
              <span>�</span>
              <span>DEFENDER 2 GOLD PIP DICE</span>
            </div>
          </div>
        </div>

        {/* Right side: Countdown Timer & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: secondsRemaining <= 10 ? 'rgba(255, 42, 85, 0.2)' : 'rgba(251, 200, 13, 0.1)',
              border: secondsRemaining <= 10 ? '1px solid rgba(255, 42, 85, 0.5)' : '1px solid rgba(251, 200, 13, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: secondsRemaining <= 10 ? 'var(--neon-crimson)' : 'var(--neon-cyan)',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              fontFamily: 'Bebas Neue, sans-serif'
            }}
          >
            <Clock size={16} />
            <span>AUTO-RESOLVE: {secondsRemaining}s</span>
          </div>

          {onClose && (
            <button
              onClick={() => {
                if (onForceClose) onForceClose();
                else onClose();
              }}
              title="Close/Cancel Clash Screen"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Attack Card Preview + Dice Faceoff */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '28px',
          flex: 1,
          alignItems: 'center'
        }}
      >
        {/* Left: Combat Card Preview */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(251, 200, 13, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--neon-cyan)',
              fontWeight: '900',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center'
            }}
          >
            ⚔️ {attackSelectionName || resolvedCardName || 'ATTACK CLASH'}
          </div>
          <div
            style={{
              width: '200px',
              height: '280px',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '2px solid rgba(251, 200, 13, 0.4)',
              boxShadow: '0 0 25px rgba(251, 200, 13, 0.25)',
              background: '#0a0f1d'
            }}
          >
            <img
              src={cardImg}
              alt={resolvedCardName || 'Combat Action'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center'
            }}
          >
            Initiated by <strong style={{ color: '#fff' }}>{atkChar.name}</strong>
          </div>
        </div>

        {/* Right: Authentic Pip Dice Clash Arena */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Dice faceoff comparison */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '24px',
              alignItems: 'center'
            }}
          >
            {/* Attacker (Red Authentic Dice) */}
            <div
              style={{
                background: 'rgba(255, 42, 85, 0.08)',
                border: '1.5px solid rgba(255, 42, 85, 0.4)',
                borderRadius: '18px',
                padding: '22px',
                textAlign: 'center',
                boxShadow: '0 0 25px rgba(255, 42, 85, 0.15)'
              }}
            >
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '900',
                  color: 'var(--neon-crimson)',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                <Swords size={20} />
                <span>{atkChar.name} (Attacker)</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '18px',
                  marginBottom: '16px'
                }}
              >
                <CanvasPipDie value={activeAtkDice ? activeAtkDice[0] : 0} theme="red" isRolling={isAttackerRolling} size={76} />
                <CanvasPipDie value={activeAtkDice ? activeAtkDice[1] : 0} theme="red" isRolling={isAttackerRolling} size={76} />
              </div>

              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: '900',
                  color: 'var(--neon-crimson)',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1px'
                }}
              >
                TOTAL: {!hasAttackerRolled ? (isAttackerRolling ? '...' : '--') : atkSum}
              </div>
            </div>

            {/* VS Badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <div
                style={{
                  fontSize: '2.2rem',
                  fontWeight: '900',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Bebas Neue, sans-serif'
                }}
              >
                VS
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '1px'
                }}
              >
                DICE CLASH
              </div>
            </div>

            {/* Defender (Gold Authentic Dice) */}
            <div
              style={{
                background: 'rgba(255, 224, 102, 0.08)',
                border: '1.5px solid rgba(255, 224, 102, 0.4)',
                borderRadius: '18px',
                padding: '22px',
                textAlign: 'center',
                boxShadow: '0 0 25px rgba(255, 224, 102, 0.15)'
              }}
            >
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '900',
                  color: 'var(--neon-gold)',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                <Shield size={20} />
                <span>{defChar.name} (Defender)</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '18px',
                  marginBottom: '16px'
                }}
              >
                <CanvasPipDie value={activeDefDice ? activeDefDice[0] : 0} theme="gold" isRolling={isDefenderRolling} size={76} />
                <CanvasPipDie value={activeDefDice ? activeDefDice[1] : 0} theme="gold" isRolling={isDefenderRolling} size={76} />
              </div>

              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: '900',
                  color: 'var(--neon-gold)',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1px'
                }}
              >
                TOTAL: {!hasDefenderRolled ? (isDefenderRolling ? '...' : '--') : defSum}
              </div>
            </div>
          </div>

          {/* Action Resolution Status / Roll Trigger */}
          {phase === 'clash' && (
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              {/* Step 1: Attacker has not rolled */}
              {!hasAttackerRolled && (
                isAttacker ? (
                  <button
                    onClick={handleRollAttacker}
                    disabled={isAttackerRolling}
                    style={{
                      background: 'linear-gradient(90deg, #ff2a55 0%, #ff6b8b 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '16px 44px',
                      borderRadius: '12px',
                      fontSize: '1.25rem',
                      fontWeight: '900',
                      cursor: isAttackerRolling ? 'wait' : 'pointer',
                      boxShadow: '0 0 30px rgba(255, 42, 85, 0.6)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Dices size={26} />
                    <span>{isAttackerRolling ? 'ROLLING ATTACK DICE...' : '?? ROLL ATTACK DICE'}</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      background: 'rgba(255, 42, 85, 0.08)',
                      border: '1.5px solid rgba(255, 42, 85, 0.3)',
                      color: '#ff8899',
                      fontSize: '1.1rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px'
                    }}
                  >
                    <Swords size={22} />
                    <span>? WAITING FOR {atkChar.name.toUpperCase()} TO ROLL ATTACK DICE...</span>
                  </div>
                )
              )}

              {/* Step 2: Attacker has rolled — defender rolls their own dice */}
              {hasAttackerRolled && !hasDefenderRolled && (
                isDefender ? (
                  <button
                    onClick={handleRollDefender}
                    disabled={isDefenderRolling}
                    style={{
                      background: 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)',
                      border: 'none',
                      color: '#000',
                      padding: '16px 44px',
                      borderRadius: '12px',
                      fontSize: '1.25rem',
                      fontWeight: '900',
                      cursor: isDefenderRolling ? 'wait' : 'pointer',
                      boxShadow: '0 0 30px rgba(251, 200, 13, 0.6)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '14px',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Shield size={26} />
                    <span>{isDefenderRolling ? 'ROLLING DEFENSE DICE...' : '🎲 ROLL DEFENSE DICE'}</span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      background: 'rgba(251, 200, 13, 0.08)',
                      border: '1.5px solid rgba(251, 200, 13, 0.3)',
                      color: 'var(--neon-gold)',
                      fontSize: '1.1rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px'
                    }}
                  >
                    <Shield size={22} />
                    <span>⚡ Attacker rolled {atkSum}! Waiting for {defChar.name} to roll defense...</span>
                  </div>
                )
              )}
            </div>
          )}

          {phase === 'clash_summary' && (
            <div
              style={{
                background: isTie
                  ? 'rgba(251, 200, 13, 0.12)'
                  : atkWon
                  ? 'rgba(251, 200, 13, 0.12)'
                  : 'rgba(255, 42, 85, 0.12)',
                border: isTie
                  ? '2px solid var(--neon-gold)'
                  : atkWon
                  ? '2px solid var(--neon-cyan)'
                  : '2px solid #ff2a55',
                borderRadius: '16px',
                padding: '20px 28px',
                textAlign: 'center',
                boxShadow: isTie
                  ? '0 0 30px rgba(251, 200, 13, 0.25)'
                  : atkWon
                  ? '0 0 30px rgba(251, 200, 13, 0.25)'
                  : '0 0 30px rgba(255, 42, 85, 0.25)'
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.6rem',
                  color: isTie ? 'var(--neon-gold)' : atkWon ? 'var(--neon-cyan)' : '#ff8899',
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontWeight: '900',
                  letterSpacing: '1px'
                }}
              >
                {isTie ? '?? CLASH TIED! (STALEMATE)' : atkWon ? '?? ATTACK SUCCESSFUL!' : '??? DEFENDER RESISTED / BLOCKED!'}
              </h3>
              <p
                style={{
                  margin: '0 0 14px 0',
                  fontSize: '1rem',
                  color: '#fff',
                  opacity: 0.95
                }}
              >
                {isTie
                  ? `Both players rolled ${atkSum}! Stalemate reached. Re-roll the dice to determine who prevails!`
                  : atkWon
                  ? `Attacker roll (${atkSum}) beat Defender roll (${defSum}). Combat damage will be resolved!`
                  : `Defender roll (${defSum}) resisted Attacker roll (${atkSum}). Attack deflected!`
                }
              </p>

              {/* Rule of 6+ Basic Defense Rule Banner */}
              {defSum >= 6 && (
                <div
                  style={{
                    margin: '0 auto 16px auto',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: 'rgba(251, 200, 13, 0.15)',
                    border: '1px solid var(--neon-gold)',
                    color: 'var(--neon-gold)',
                    fontWeight: 'bold',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Shield size={16} />
                  <span>??? RULE OF 6+ ACTIVATED! Defender rolled {defSum} (=6): Innate Base Defense activated!</span>
                </div>
              )}

{/* Doubles Detected Banner */}
              {(attackerFateCard || defenderFateCard) && (
                <div
                  style={{
                    margin: '0 auto 16px auto',
                    padding: '12px 22px',
                    borderRadius: '10px',
                    background: 'rgba(251, 200, 13, 0.15)',
                    border: '1px solid rgba(251, 200, 13, 0.7)',
                    color: 'var(--neon-gold)',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'pulseGlow 0.6s ease-in-out infinite'
                  }}
                >
                  <Sparkles size={18} />
                  <span>
                    {attackerFateCard && !defenderFateCard && `${atkChar.name} ROLLED DOUBLES! You may re-roll or accept your roll.`}
                    {defenderFateCard && !attackerFateCard && `${defChar.name} ROLLED DOUBLES! You may re-roll or accept your roll.`}
                    {defenderFateCard && attackerFateCard && `BOTH PLAYERS ROLLED DOUBLES! Eligible to re-roll or accept roll.`}
                  </span>
                </div>
              )}

              {/* Show Multiplier Die Section if Attacker Won and move has "PER" dice multiplier */}
              {atkWon && hasMultiplierDie && (
                <div
                  style={{
                    margin: '10px auto 20px auto',
                    padding: '14px 22px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(251, 200, 13, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                    ?? 2ND STAGE: ROLL 1 DIE FOR "{attackSelectionName}" (PER ATTACK)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <CanvasPipDie value={multiplierDie} theme="red" isRolling={isRollingMultiplier} size={54} />
                                        <div style={{ textAlign: 'left' }}>
                      {(() => {
                        const isAtkX2 = resolvedCardName.includes('ATTACK X2');
                        const perAp = isAtkX2 ? (selectedAttackInfo.ap * 2) : selectedAttackInfo.ap;
                        const total = multiplierDie * perAp;
                        return (
                          <div style={{ fontSize: '1rem', color: '#fff' }}>
                            Roll: <strong>{multiplierDie}</strong> × {perAp} AP {isAtkX2 ? '(Attack X2 doubled)' : ''} = <strong style={{ color: '#39ff14' }}>{total} Total AP</strong>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {isAttacker && !hasRolledMultiplier && (
                    <button
                      onClick={handleRollMultiplierDie}
                      disabled={isRollingMultiplier}
                      style={{
                        background: 'linear-gradient(90deg, #FBC80D, #0088ff)',
                        border: 'none',
                        color: '#000',
                        fontWeight: 'bold',
                        padding: '8px 22px',
                        borderRadius: '8px',
                        cursor: isRollingMultiplier ? 'wait' : 'pointer',
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '0.95rem'
                      }}
                    >
                      {isRollingMultiplier ? 'Rolling 1 Die...' : '?? ROLL 1 MULTIPLIER DIE'}
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div>
                {isTie ? (
                  isAttacker ? (
                    <button
                      onClick={handleReRoll}
                      style={{
                        background: 'linear-gradient(135deg, #FBC80D, #ff8800)',
                        color: '#000',
                        border: 'none',
                        padding: '14px 38px',
                        borderRadius: '12px',
                        fontSize: '1.15rem',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '1px',
                        boxShadow: '0 0 25px rgba(251, 200, 13, 0.55)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <RotateCcw size={22} />
                      <span>🔄 RE-ROLL CLASH</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        color: '#FBC80D',
                        fontStyle: 'italic',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <RotateCcw size={18} />
                      <span>⏳ Stalemate! Waiting for Attacker to re-roll...</span>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    {/* Doubles Re-Roll Bonus Option */}
                    {((attackerFateCard && isAttacker) || (defenderFateCard && isDefender) || ((attackerFateCard || defenderFateCard) && isHost)) && !resolvedCardName?.includes('FIRE FLAME') && !resolvedCardName?.includes('LIGHTNING') && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                        <button
                          onClick={handleReRoll}
                          style={{
                            background: 'linear-gradient(135deg, #FBC80D, #ff8800)',
                            color: '#000',
                            border: 'none',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontFamily: 'Bebas Neue, sans-serif',
                            letterSpacing: '1px',
                            boxShadow: '0 0 20px rgba(251, 200, 13, 0.5)'
                          }}
                        >
                          <RotateCcw size={20} />
                          <span>🔄 RE-ROLL (DOUBLES BONUS)</span>
                        </button>
                      </div>
                    )}

                    {(atkWon && hasMultiplierDie && !hasRolledMultiplier) ? (
                      isAttacker ? (
                        <button
                          onClick={handleRollMultiplierDie}
                          disabled={isRollingMultiplier}
                          style={{
                            background: 'linear-gradient(135deg, #FBC80D, #ff8800)',
                            color: '#000',
                            border: 'none',
                            padding: '14px 38px',
                            borderRadius: '12px',
                            fontSize: '1.15rem',
                            fontWeight: '900',
                            cursor: isRollingMultiplier ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontFamily: 'Bebas Neue, sans-serif',
                            letterSpacing: '1px',
                            boxShadow: '0 0 25px rgba(251, 200, 13, 0.55)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Sparkles size={22} />
                          <span>{isRollingMultiplier ? 'ROLLING MULTIPLIER DIE...' : 'ROLL 1 MULTIPLIER DIE'}</span>
                        </button>
                      ) : (
                        <div
                          style={{
                            color: '#FBC80D',
                            fontStyle: 'italic',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <Clock size={18} />
                          <span>Attacker won clash! Waiting for attacker to roll multiplier die...</span>
                        </div>
                      )
                    ) : null}
                    {hasRetreatCard && onExecuteRetreat && (isAttacker || isDefender) && (
                      <button
                        onClick={() => onExecuteRetreat(isAttacker ? 'attacker' : 'defender')}
                        style={{
                          background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 28px',
                          borderRadius: '12px',
                          fontSize: '1.1rem',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontFamily: 'Bebas Neue, sans-serif',
                          letterSpacing: '1px',
                          boxShadow: '0 0 20px rgba(0, 210, 255, 0.45)'
                        }}
                        title={isAttacker ? 'Disengage attack without taking damage' : 'Disengage battle and safely escape (lose next turn)'}
                      >
                        <span>💨 PLAY RETREAT CARD ({isAttacker ? 'ATTACKER DISENGAGE' : 'DEFENDER ESCAPE -1 TURN'})</span>
                      </button>
                    )}
                    <button
                      onClick={handleFinishCombat}
                      style={{
                        background: '#39ff14',
                        color: '#000',
                        border: 'none',
                        padding: '14px 38px',
                        borderRadius: '12px',
                        fontSize: '1.15rem',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '1px',
                        boxShadow: '0 0 25px rgba(57, 255, 20, 0.45)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Check size={22} />
                      <span>APPLY RESULT & CONTINUE</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



