import React, { useState } from 'react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Brain, X, Dices, AlertTriangle, Check, Shield, Swords, Trophy } from 'lucide-react';

export default function KontrolModal({ attacker, allPlayers, initialTargetId, onClose, onCompleteKontrol }) {
  const [targetId, setTargetId] = useState(
    initialTargetId || allPlayers.find(p => p.id !== attacker.id)?.id || ''
  );
  
  // Best of 3 State
  const [atkWins, setAtkWins] = useState(0);
  const [defWins, setDefWins] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  
  const [currentAtkRoll, setCurrentAtkRoll] = useState(6);
  const [currentDefRoll, setCurrentDefRoll] = useState(6);
  const [roundResult, setRoundResult] = useState(''); // 'atk_win', 'def_win', 'tie'

  // FIX 3: Fate Card mode — defender rolls their own die against a Mind Strength threshold
  const [useFateCard, setUseFateCard] = useState(false);

  const [kontrolWinner, setKontrolWinner] = useState(null); // 'attacker' | 'defender'
  const [chosenOption, setChosenOption] = useState('steal_card'); // 'steal_card' | 'force_attack'
  const [selectedStolenCardId, setSelectedStolenCardId] = useState(null);
  const [forceAttackTargetId, setForceAttackTargetId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const targetPlayer = allPlayers.find(p => p.id === targetId);
  const targetChar = targetPlayer ? (CHARACTERS[targetPlayer.characterId] || CHARACTERS.chynaman) : null;
  const atkChar = CHARACTERS[attacker.characterId] || CHARACTERS.chynaman;

  const isTargetZombie = targetPlayer?.isZombie;

  // FIX 3: Fate Card threshold table — MS1→need 5+, MS2→4+, MS3→3+, MS4→2+, MS5→1+
  const defMindStrength = targetChar?.mindStrength || 1;
  const fateCardThreshold = Math.max(1, 6 - defMindStrength);

  const handleRoll = () => {
    if (isTargetZombie) {
      setErrorMsg('Zombies are immune to Kontrol.');
      return;
    }
    setErrorMsg('');

    setIsRolling(true);
    setRoundResult('');
    soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setCurrentAtkRoll(Math.floor(Math.random() * 6) + 1);
      setCurrentDefRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const finalAtk = Math.floor(Math.random() * 6) + 1;
        const finalDef = Math.floor(Math.random() * 6) + 1;
        
        setCurrentAtkRoll(finalAtk);
        setCurrentDefRoll(finalDef);
        setIsRolling(false);

        const atkBonus = atkChar.mindAtkBonus || 0;
        
        let newAtkWins = atkWins;
        let newDefWins = defWins;
        let newRoundNumber = roundNumber;

        if (useFateCard) {
          // FIX 3: Fate Card mode — defender rolls only. Must meet threshold to avoid control.
          if (finalDef >= fateCardThreshold) {
            // Defender resists — defender wins this round
            newDefWins += 1;
            setRoundResult('def_win');
            soundFX.playHit();
            newRoundNumber += 1;
          } else {
            // Defender fails to resist — attacker wins this round
            newAtkWins += 1;
            setRoundResult('atk_win');
            soundFX.playEnergy();
            newRoundNumber += 1;
          }
        } else {
          // FIX 3: Standard mode — both roll one die. Higher total wins. Tie → re-roll (no freeze).
          const atkTotal = finalAtk + atkBonus;
          const defTotal = finalDef;

          if (atkTotal > defTotal) {
            newAtkWins += 1;
            setRoundResult('atk_win');
            soundFX.playEnergy();
            newRoundNumber += 1;
          } else if (atkTotal < defTotal) {
            newDefWins += 1;
            setRoundResult('def_win');
            soundFX.playHit();
            newRoundNumber += 1;
          } else {
            // TIE — don't increment round or wins; allow re-roll without freeze
            setRoundResult('tie');
          }
        }

        setAtkWins(newAtkWins);
        setDefWins(newDefWins);
        setRoundNumber(newRoundNumber);

        if (newAtkWins >= 2) {
          setKontrolWinner('attacker');
        } else if (newDefWins >= 2) {
          setKontrolWinner('defender');
        }
      }
    }, 70);
  };

  const handleConfirm = () => {
    if (kontrolWinner === 'attacker' && chosenOption === 'steal_card' && !selectedStolenCardId) {
      setErrorMsg("Please select a card to steal!");
      return;
    }
    if (kontrolWinner === 'attacker' && chosenOption === 'force_attack' && !forceAttackTargetId) {
      setErrorMsg("Please select a target to force attack!");
      return;
    }

    onCompleteKontrol({
      attackerId: attacker.id,
      targetId: targetPlayer.id,
      success: kontrolWinner === 'attacker',
      chosenOption,
      stolenCardId: selectedStolenCardId,
      forcedTargetId: forceAttackTargetId
    });
  };

  const resetTarget = (id) => {
    setTargetId(id);
    setAtkWins(0);
    setDefWins(0);
    setRoundNumber(1);
    setRoundResult('');
    setKontrolWinner(null);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
          border: '1.5px solid var(--neon-gold)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(251, 200, 13, 0.3)',
          width: '100%',
          maxWidth: '600px',
          padding: '20px',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(251, 200, 13, 0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(251, 200, 13, 0.2)', border: '1px solid #FBC80D', color: '#FBC80D', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              🧠 3 ET · MIND KONTROL
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>KONTROL CLASH</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div style={{ background: 'rgba(237, 30, 36, 0.2)', border: '1px solid #ED1E24', color: '#ff6b8f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 14px 0' }}>
          <strong>Best of 3 Dice Roll Battle!</strong> Both players roll a die simultaneously. Higher roll wins the round. Ties re-roll. First to 2 wins takes the Kontrol.
        </p>

        {/* FIX 3: Fate Card toggle — only available before rolling starts */}
        {!(atkWins > 0 || defWins > 0) && !kontrolWinner && (
          <div style={{ marginBottom: '14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="fateCardToggle"
              checked={useFateCard}
              onChange={(e) => setUseFateCard(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <label htmlFor="fateCardToggle" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#93c5fd', fontWeight: 'bold' }}>
              🃏 Defender uses Fate Card (roll to resist mind control)?
            </label>
          </div>
        )}

        {/* Fate Card mode info banner */}
        {useFateCard && !(atkWins > 0 || defWins > 0) && targetChar && (
          <div style={{ marginBottom: '14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#93c5fd' }}>
            <strong>Fate Card Mode:</strong> Defender rolls their own die to resist. Mind Strength {defMindStrength} → must roll <strong>{fateCardThreshold}+</strong> to avoid control.
          </div>
        )}

        {/* Target Selector */}
        {!kontrolWinner && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.75rem', color: '#FBC80D', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SELECT TARGET OPPONENT</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {allPlayers.filter(p => p.id !== attacker.id).map(target => {
                const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                const isSelected = targetId === target.id;
                return (
                  <div
                    key={target.id}
                    onClick={() => resetTarget(target.id)}
                    style={{
                      background: isSelected ? 'rgba(251, 200, 13, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1.5px solid #FBC80D' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: atkWins > 0 || defWins > 0 ? (isSelected ? 1 : 0.4) : 1,
                      pointerEvents: atkWins > 0 || defWins > 0 ? 'none' : 'auto'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'visible', border: '1px solid #FBC80D', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                      <img
                        src={getAssetUrl(tChar.image || 'characters/chynaman.png')}
                        alt={target.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                      {/* Level Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        color: '#000',
                        border: '1.5px solid rgba(0,0,0,0.8)',
                        boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                        zIndex: 10
                      }}>
                        {target.level || 1}
                      </div>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{target.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#FBC80D' }}>
                        {target.isZombie ? 'IMMUNE' : `🧠 Mind: ${tChar.mindStrength}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Zombie Warning */}
        {isTargetZombie && (
          <div style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Zombies are mindless and immune to Kontrol.
          </div>
        )}

        {/* Scoreboard */}
        {targetPlayer && !isTargetZombie && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '14px', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
            {/* Attacker Stats */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px' }}>ATTACKER</div>
              <strong style={{ fontSize: '1.1rem', display: 'block', color: '#FBC80D' }}>{attacker.name}</strong>
              <div style={{ fontSize: '0.75rem', color: '#FBC80D', marginTop: '2px' }}>
                {atkChar.mindAtkBonus ? `+${atkChar.mindAtkBonus} Roll Bonus` : 'Base Roll'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: atkWins >= 1 ? '#FBC80D' : 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: atkWins >= 2 ? '#FBC80D' : 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>

            {/* VS Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', color: '#000', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>VS</div>
              {kontrolWinner === null && <div style={{ fontSize: '0.8rem', color: '#FBC80D', marginTop: '8px', fontWeight: 'bold' }}>ROUND {roundNumber}</div>}
            </div>

            {/* Defender Stats */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px' }}>DEFENDER</div>
              <strong style={{ fontSize: '1.1rem', display: 'block', color: '#3b82f6' }}>{targetPlayer.name}</strong>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }}>
                🧠 Mind Strength: {defMindStrength}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: defWins >= 1 ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: defWins >= 2 ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Dice Rolling Area */}
        {!isTargetZombie && kontrolWinner === null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '16px' }}>
              {/* Attacker Die */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #FBC80D, #FFD700)',
                    color: '#000',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '2px solid #FBC80D',
                    boxShadow: roundResult === 'atk_win' ? '0 0 20px #FBC80D' : '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease',
                    opacity: useFateCard ? 0.3 : 1
                  }}
                >
                  {useFateCard ? '—' : currentAtkRoll}
                </div>
                {!useFateCard && roundResult && (
                  <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#FBC80D' }}>
                    Total: {currentAtkRoll + (atkChar.mindAtkBonus || 0)}{atkChar.mindAtkBonus ? ` (+${atkChar.mindAtkBonus})` : ''}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', marginTop: '4px', color: 'rgba(255,255,255,0.5)' }}>
                  {useFateCard ? '(Not used)' : 'Attacker'}
                </div>
              </div>

              {/* Defender Die */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#fff',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '2px solid #60a5fa',
                    boxShadow: roundResult === 'def_win' ? '0 0 20px #3b82f6' : '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {currentDefRoll}
                </div>
                {roundResult && (
                  <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#60a5fa' }}>
                    {useFateCard ? `Need ${fateCardThreshold}+` : 'Rolled'}
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', marginTop: '4px', color: 'rgba(255,255,255,0.5)' }}>
                  {useFateCard ? `Fate Card (${fateCardThreshold}+)` : 'Defender'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                disabled={isRolling}
                style={{
                  width: '30%',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleRoll}
                disabled={isRolling}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(90deg, #FBC80D, #FFD700)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isRolling ? 0.7 : 1
                }}
              >
                <Dices size={20} />
                {isRolling ? 'ROLLING...' : (roundResult === 'tie' ? 'RE-ROLL (TIE)' : `ROLL ROUND ${roundNumber}`)}
              </button>
            </div>
          </div>
        )}

        {/* Winner & Outcome Area */}
        {kontrolWinner !== null && (
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: kontrolWinner === 'attacker' ? '#39ff14' : '#ED1E24', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {kontrolWinner === 'attacker' ? <><Trophy size={24} /> KONTROL SUCCESSFUL!</> : <><Shield size={24} /> OPPONENT RESISTED!</>}
            </div>

            {kontrolWinner === 'attacker' && (
              <div style={{ margin: '16px 0', textAlign: 'left', background: 'rgba(251, 200, 13, 0.1)', border: '1px solid #FBC80D', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#FBC80D', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>CHOOSE REWARD ACTION:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => setChosenOption('steal_card')}
                    style={{
                      background: chosenOption === 'steal_card' ? '#FBC80D' : 'rgba(255,255,255,0.06)',
                      color: chosenOption === 'steal_card' ? '#000' : '#fff',
                      border: chosenOption === 'steal_card' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    🃏 Steal 1 Action Card
                  </button>
                  <button
                    onClick={() => setChosenOption('force_attack')}
                    style={{
                      background: chosenOption === 'force_attack' ? '#FBC80D' : 'rgba(255,255,255,0.06)',
                      color: chosenOption === 'force_attack' ? '#000' : '#fff',
                      border: chosenOption === 'force_attack' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    ⚔️ Force Attack
                  </button>
                </div>

                {/* Steal Card UI */}
                {chosenOption === 'steal_card' && targetPlayer.actionCardsHand?.length > 0 && (
                  <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#FBC80D', marginBottom: '8px' }}>SELECT CARD TO STEAL:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {targetPlayer.actionCardsHand.map(card => (
                        <div
                          key={card.instanceId}
                          onClick={() => setSelectedStolenCardId(card.instanceId)}
                          style={{
                            border: selectedStolenCardId === card.instanceId ? '2px solid #39ff14' : '1px solid rgba(255,255,255,0.2)',
                            background: selectedStolenCardId === card.instanceId ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,255,255,0.05)',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#fff'
                          }}
                        >
                          <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{card.icon}</div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Force Attack UI */}
                {chosenOption === 'force_attack' && (
                  <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#FBC80D', marginBottom: '8px' }}>SELECT VICTIM TO ATTACK:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {allPlayers.filter(p => p.id !== targetPlayer.id).map(victim => (
                        <button
                          key={victim.id}
                          onClick={() => setForceAttackTargetId(victim.id)}
                          style={{
                            background: forceAttackTargetId === victim.id ? 'rgba(237, 30, 36, 0.2)' : 'rgba(255,255,255,0.1)',
                            border: forceAttackTargetId === victim.id ? '1.5px solid #ED1E24' : '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {victim.name} {victim.id === attacker.id ? '(Yourself)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirm}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px',
                background: kontrolWinner === 'attacker' ? 'linear-gradient(90deg, #FBC80D, #0088ff)' : 'rgba(237, 30, 36, 0.2)',
                color: kontrolWinner === 'attacker' ? '#000' : '#ED1E24',
                border: kontrolWinner === 'attacker' ? 'none' : '1px solid #ED1E24',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              APPLY KONTROL OUTCOME
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
