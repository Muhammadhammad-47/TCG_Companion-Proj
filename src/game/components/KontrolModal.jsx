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

  const [kontrolWinner, setKontrolWinner] = useState(null); // 'attacker' | 'defender'
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
        const defBonus = targetChar?.mindDefBonus || 0;
        const effectiveAtk = finalAtk + atkBonus;
        const effectiveDef = finalDef + defBonus;
        
        let newAtkWins = atkWins;
        let newDefWins = defWins;

        if (effectiveAtk > effectiveDef) {
          newAtkWins += 1;
          setRoundResult('atk_win');
          soundFX.playEnergy();
        } else if (effectiveDef > effectiveAtk) {
          newDefWins += 1;
          setRoundResult('def_win');
          soundFX.playHit();
        } else {
          setRoundResult('tie');
        }

        setAtkWins(newAtkWins);
        setDefWins(newDefWins);

        if (newAtkWins >= 2) {
          setKontrolWinner('attacker');
        } else if (newDefWins >= 2) {
          setKontrolWinner('defender');
        } else {
          if (effectiveAtk !== effectiveDef) {
            setRoundNumber(r => r + 1);
          }
        }
      }
    }, 70);
  };

  const handleConfirm = () => {
    onCompleteKontrol({
      attackerId: attacker.id,
      targetId: targetPlayer.id,
      success: kontrolWinner === 'attacker',
      chosenOption
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
          background: 'linear-gradient(180deg, #1a0b2e 0%, #0c0517 100%)',
          border: '1.5px solid #a855f7',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(168, 85, 247, 0.3)',
          width: '100%',
          maxWidth: '600px',
          padding: '20px',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', color: '#c084fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              🧠 3 ET · MIND KONTROL
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>KONTROL CLASH</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 14px 0' }}>
          <strong>Best of 3 Dice Roll Battle!</strong> Both players roll a die simultaneously. The first to win 2 rounds wins the Kontrol.
        </p>

        {/* Target Selector */}
        {!kontrolWinner && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SELECT TARGET OPPONENT</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {allPlayers.filter(p => p.id !== attacker.id).map(target => {
                const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                const isSelected = targetId === target.id;
                return (
                  <div
                    key={target.id}
                    onClick={() => resetTarget(target.id)}
                    style={{
                      background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
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
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                      <img
                        src={getAssetUrl(tChar.image || 'characters/chynaman.png')}
                        alt={target.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{target.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#c084fc' }}>
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
              <strong style={{ fontSize: '1.1rem', display: 'block', color: '#a855f7' }}>{attacker.name}</strong>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '2px' }}>
                {atkChar.mindAtkBonus ? `+${atkChar.mindAtkBonus} Roll Bonus` : 'No Bonus'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: atkWins >= 1 ? '#a855f7' : 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: atkWins >= 2 ? '#a855f7' : 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>

            {/* VS Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', color: '#000', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>VS</div>
              {kontrolWinner === null && <div style={{ fontSize: '0.8rem', color: '#ffd700', marginTop: '8px', fontWeight: 'bold' }}>ROUND {roundNumber}</div>}
            </div>

            {/* Defender Stats */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '4px' }}>DEFENDER</div>
              <strong style={{ fontSize: '1.1rem', display: 'block', color: '#3b82f6' }}>{targetPlayer.name}</strong>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '2px' }}>
                {targetChar.mindDefBonus ? `+${targetChar.mindDefBonus} Def Bonus` : 'No Bonus'}
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
                    background: 'linear-gradient(135deg, #a855f7, #6b21a8)',
                    color: '#fff',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    border: '2px solid #c084fc',
                    boxShadow: roundResult === 'atk_win' ? '0 0 20px #a855f7' : '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {currentAtkRoll}
                </div>
                {roundResult && <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#c084fc' }}>Total: {currentAtkRoll + (atkChar.mindAtkBonus || 0)}</div>}
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
                {roundResult && <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#60a5fa' }}>Total: {currentDefRoll + (targetChar?.mindDefBonus || 0)}</div>}
              </div>
            </div>
            
            {roundResult === 'tie' && (
              <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', animation: 'pulse 1s infinite' }}>TIE! RE-ROLL ROUND.</div>
            )}

            <button
              onClick={handleRoll}
              disabled={isRolling}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                color: '#fff',
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
              <span>{isRolling ? 'ROLLING DICE…' : `ROLL ROUND ${roundNumber}`}</span>
            </button>
          </div>
        )}

        {/* Winner & Outcome Area */}
        {kontrolWinner !== null && (
          <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: kontrolWinner === 'attacker' ? '#39ff14' : '#ff3366', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {kontrolWinner === 'attacker' ? <><Trophy size={24} /> KONTROL SUCCESSFUL!</> : <><Shield size={24} /> OPPONENT RESISTED!</>}
            </div>

            {kontrolWinner === 'attacker' && (
              <div style={{ margin: '16px 0', textAlign: 'left', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>CHOOSE REWARD ACTION:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => setChosenOption('steal_card')}
                    style={{
                      background: chosenOption === 'steal_card' ? '#a855f7' : 'rgba(255,255,255,0.06)',
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
                      background: chosenOption === 'force_attack' ? '#a855f7' : 'rgba(255,255,255,0.06)',
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
              </div>
            )}

            <button
              onClick={handleConfirm}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '14px',
                background: kontrolWinner === 'attacker' ? 'linear-gradient(90deg, #00f0ff, #0088ff)' : 'rgba(255, 51, 102, 0.2)',
                color: kontrolWinner === 'attacker' ? '#000' : '#ff3366',
                border: kontrolWinner === 'attacker' ? 'none' : '1px solid #ff3366',
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
