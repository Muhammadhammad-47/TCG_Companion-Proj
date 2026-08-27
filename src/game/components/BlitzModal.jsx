import React, { useState } from 'react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Zap, X, AlertOctagon, Flame, Target } from 'lucide-react';

export default function BlitzModal({ attacker, allPlayers, onClose, onCompleteBlitz }) {
  const [mode, setMode] = useState('one_vs_one'); // 'one_vs_one' | 'one_vs_all'
  const [targetId, setTargetId] = useState(
    allPlayers.find(p => p.id !== attacker.id)?.id || ''
  );

  const canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5;
  const opponents = allPlayers.filter(p => p.id !== attacker.id && !p.isDefeated);
  const splitDamagePerOpponent = Math.floor(200 / Math.max(1, opponents.length));

  const handleExecuteBlitz = () => {
    if (!canUseBlitz) {
      alert('Saigo No Blitz requires HP < 50 and 5 ET.');
      return;
    }

    soundFX.playHit();
    onCompleteBlitz({
      attackerId: attacker.id,
      mode,
      targetId: mode === 'one_vs_one' ? targetId : null,
      damage: 200,
      splitDamage: splitDamagePerOpponent
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
          background: 'linear-gradient(180deg, #381204 0%, #170701 100%)',
          border: '1.5px solid #ff9d2d',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(255, 157, 45, 0.35)',
          width: '100%',
          maxWidth: '560px',
          padding: '20px',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 157, 45, 0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255, 157, 45, 0.2)', border: '1px solid #ff9d2d', color: '#ffb02e', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              ⚡ 5 ET · ULTIMATE
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>SAIGO NO BLITZ (200 AP)</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* HP Warning */}
        {attacker.hp >= 50 && (
          <div style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1px solid #ff3366', color: '#ff3366', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={16} />
            <span>Cannot unleash: Requires HP &lt; 50 (You have {attacker.hp} HP).</span>
          </div>
        )}

        <div style={{ background: 'rgba(255, 233, 61, 0.1)', border: '1px solid rgba(255, 233, 61, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#ffe93d', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Zap size={18} fill="#ffe93d" />
          <span>Cost: <strong>5 ET</strong> + Sacrifices 50% HP (<strong>-{Math.floor(attacker.hp * 0.5)} HP</strong>) for <strong>200 AP devastation</strong>.</span>
        </div>

        {/* Mode Selector */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.75rem', color: '#ffb02e', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SELECT ATTACK MODE</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setMode('one_vs_one')}
              style={{
                background: mode === 'one_vs_one' ? '#ff9d2d' : 'rgba(255,255,255,0.06)',
                color: mode === 'one_vs_one' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
            >
              🎯 1-vs-1 (200 AP Single Target)
            </button>
            <button
              onClick={() => setMode('one_vs_all')}
              style={{
                background: mode === 'one_vs_all' ? '#ff9d2d' : 'rgba(255,255,255,0.06)',
                color: mode === 'one_vs_all' ? '#000' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
            >
              💥 1-vs-All ({splitDamagePerOpponent} AP each)
            </button>
          </div>
        </div>

        {/* Target Selector for 1v1 */}
        {mode === 'one_vs_one' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', color: '#ffb02e', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CHOOSE TARGET DEFENDER</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {opponents.map(target => {
                const tChar = CHARACTERS[target.characterId] || CHARACTERS.chynaman;
                return (
                  <div
                    key={target.id}
                    onClick={() => setTargetId(target.id)}
                    style={{
                      background: targetId === target.id ? 'rgba(255, 157, 45, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: targetId === target.id ? '1.5px solid #ff9d2d' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #ff9d2d', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                      <img
                        src={getAssetUrl(tChar.image || 'characters/chynaman.png')}
                        alt={target.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.82rem', display: 'block' }}>{target.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#ff9d2d' }}>{target.hp} HP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleExecuteBlitz}
          disabled={!canUseBlitz}
          style={{
            width: '100%',
            padding: '14px',
            background: canUseBlitz ? 'linear-gradient(90deg, #ff5500, #ff0055)' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: canUseBlitz ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: canUseBlitz ? '0 0 20px rgba(255, 85, 0, 0.5)' : 'none'
          }}
        >
          <Flame size={20} fill="#fff" />
          <span>UNLEASH SAIGO NO BLITZ</span>
        </button>
      </div>
    </div>
  );
}
