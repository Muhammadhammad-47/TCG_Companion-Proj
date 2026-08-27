import React, { useState } from 'react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Brain, X, Dices, AlertTriangle, Check, Shield, Swords } from 'lucide-react';

export default function KontrolModal({ attacker, allPlayers, initialTargetId, onClose, onCompleteKontrol }) {
  const [targetId, setTargetId] = useState(
    initialTargetId || allPlayers.find(p => p.id !== attacker.id)?.id || ''
  );
  const [isRolling, setIsRolling] = useState(false);
  const [dieRoll, setDieRoll] = useState(4);
  const [hasRolled, setHasRolled] = useState(false);
  const [success, setSuccess] = useState(false);
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
    soundFX.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setDieRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDieRoll(finalRoll);
        setIsRolling(false);
        setHasRolled(true);

        const atkBonus = atkChar.mindAtkBonus || 0; // Queeny +2
        const defBonus = targetChar?.mindDefBonus || 0; // Magical creatures +1
        const effectiveRoll = finalRoll + atkBonus;
        const targetThreshold = (targetChar?.mindStrength || 3) + defBonus;

        const isSuccess = effectiveRoll > targetThreshold;
        setSuccess(isSuccess);

        if (isSuccess) {
          soundFX.playEnergy();
        } else {
          soundFX.playHit();
        }
      }
    }, 70);
  };

  const handleConfirm = () => {
    onCompleteKontrol({
      attackerId: attacker.id,
      targetId: targetPlayer.id,
      success,
      chosenOption
    });
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
          maxWidth: '560px',
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
          Roll 1 Die strictly higher than the opponent's <strong>Mind Strength</strong> to take control of their mind.
        </p>

        {/* Target Selector */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SELECT TARGET OPPONENT</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
            {allPlayers.filter(p => p.id !== attacker.id).map(target => {
              const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
              const isSelected = targetId === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => { setTargetId(target.id); setHasRolled(false); }}
                  style={{
                    background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '1.5px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
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

        {/* Comparison Details */}
        {targetPlayer && !isTargetZombie && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '14px', textAlign: 'center', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Attacker:</span> <strong>{attacker.name}</strong>
              <div style={{ color: '#c084fc' }}>{atkChar.mindAtkBonus ? `🎲 +${atkChar.mindAtkBonus} Roll Bonus` : 'Standard Roll'}</div>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Defender:</span> <strong>{targetPlayer.name}</strong>
              <div style={{ color: '#ffd700' }}>🧠 Mind Strength: {targetChar.mindStrength}{targetChar.mindDefBonus ? ` (+${targetChar.mindDefBonus} Def)` : ''}</div>
            </div>
          </div>
        )}

        {isTargetZombie && (
          <div style={{ background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Zombies are mindless and immune to Kontrol.
          </div>
        )}

        {/* Rolling Area */}
        {!isTargetZombie && (
          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'linear-gradient(135deg, #a855f7, #6b21a8)',
                  color: '#fff',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  border: '2px solid #c084fc',
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)'
                }}
              >
                {dieRoll}
              </div>
            </div>

            {!hasRolled ? (
              <button
                onClick={handleRoll}
                disabled={isRolling}
                style={{
                  width: '100%',
                  padding: '12px',
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
                  gap: '8px'
                }}
              >
                <Dices size={20} />
                <span>{isRolling ? 'ROLLING MIND DIE…' : 'ROLL 1 DIE FOR KONTROL'}</span>
              </button>
            ) : (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: success ? '#39ff14' : '#ff3366', marginBottom: '10px' }}>
                  {success ? '🎉 KONTROL SUCCESSFUL!' : '❌ OPPONENT RESISTED!'}
                </div>

                {success && (
                  <div style={{ margin: '10px 0', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 'bold' }}>CHOOSE REWARD ACTION:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => setChosenOption('steal_card')}
                        style={{
                          background: chosenOption === 'steal_card' ? '#a855f7' : 'rgba(255,255,255,0.06)',
                          color: chosenOption === 'steal_card' ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}
                      >
                        🃏 Steal 1 Action Card
                      </button>
                      <button
                        onClick={() => setChosenOption('force_attack')}
                        style={{
                          background: chosenOption === 'force_attack' ? '#a855f7' : 'rgba(255,255,255,0.06)',
                          color: chosenOption === 'force_attack' ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}
                      >
                        ⚔️ Force Attack on Enemy
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px',
                    background: 'linear-gradient(90deg, #00f0ff, #0088ff)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  APPLY KONTROL OUTCOME
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
