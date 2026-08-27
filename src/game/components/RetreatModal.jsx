import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Wind, X, Dices, Check } from 'lucide-react';

export default function RetreatModal({ player, onClose, onCompleteRetreat }) {
  const char = CHARACTERS[player.characterId] || CHARACTERS.chynaman;
  const targetRoll = player.isZombie ? 5 : (char.retreatTarget || 3);

  const [isRolling, setIsRolling] = useState(false);
  const [dieRoll, setDieRoll] = useState(1);
  const [hasRolled, setHasRolled] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRoll = () => {
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

        const isSuccess = finalRoll >= targetRoll;
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
    onCompleteRetreat({
      playerId: player.id,
      success
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
          background: 'linear-gradient(180deg, #092440 0%, #041020 100%)',
          border: '1.5px solid #00f0ff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(0, 240, 255, 0.3)',
          width: '100%',
          maxWidth: '480px',
          padding: '20px',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid #00f0ff', color: '#00f0ff', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              💨 0 ET · TACTICAL
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>RETREAT ROLL</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 16px 0' }}>
          Roll 1 Die. <strong>{player.name}</strong> needs to roll a <strong>{targetRoll}+</strong> to successfully escape combat without taking damage.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #00f0ff, #0077cc)',
                color: '#000',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                border: '2px solid #fff',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)'
              }}
            >
              {dieRoll}
            </div>
            <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)' }}>Target: {targetRoll}+</span>
          </div>

          {!hasRolled ? (
            <button
              onClick={handleRoll}
              disabled={isRolling}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Dices size={20} />
              <span>{isRolling ? 'ROLLING DIE…' : `ROLL 1 DIE (NEEDS ${targetRoll}+)`}</span>
            </button>
          ) : (
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: success ? '#39ff14' : '#ff3366', marginBottom: '12px' }}>
                {success ? '💨 RETREAT SUCCESSFUL (ESCAPED)' : '🛑 RETREAT FAILED (MUST STAY & FIGHT)'}
              </div>

              <button
                onClick={handleConfirm}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(90deg, #00f0ff, #0088ff)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                CONFIRM RETREAT RESULT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
