import React, { useState } from 'react';
import { Crown, Swords, Shield, Coins, CheckCircle2, X } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function MasterCommandModal({
  isOpen,
  slaveName = 'Servant',
  allOpponents = [],
  onIssueCommand = () => {},
  onClose = () => {}
}) {
  const [taskType, setTaskType] = useState('ATTACK_TARGET');
  const [targetOpponentId, setTargetOpponentId] = useState(allOpponents[0]?.id || '');
  const [rewardET, setRewardET] = useState(1);

  if (!isOpen) return null;

  const handleConfirm = () => {
    try { soundFX.playMenuSelect(); } catch {}
    const target = allOpponents.find((o) => o.id === targetOpponentId);
    let taskText = 'Serve your Master in battle';
    if (taskType === 'ATTACK_TARGET') {
      taskText = `Focus all attacks on ${target?.name || 'designated enemy'}`;
    } else if (taskType === 'DEFEND_MASTER') {
      taskText = 'Deploy shields and defense to protect Master';
    } else if (taskType === 'DISTRACT_ENEMY') {
      taskText = `Disrupt ${target?.name || 'enemy'} with status/elemental cards`;
    }

    onIssueCommand({
      taskType,
      targetId: targetOpponentId,
      taskText,
      rewardText: `+${rewardET} Energy Token on turn start`,
      rewardET
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 100002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(135deg, rgba(20, 24, 44, 0.98) 0%, rgba(10, 14, 28, 0.99) 100%)',
          border: '2px solid rgba(245, 158, 11, 0.7)',
          borderRadius: '16px',
          padding: '22px',
          color: '#fff',
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.35)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>👑</div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f59e0b', letterSpacing: '0.05em' }}>
            COMMAND SERVANT: {slaveName.toUpperCase()}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Issue a strategic mandate for your servant with an Energy Token bounty.
          </p>
        </div>

        {/* Task Selection */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
            1. SELECT MANDATE TYPE
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTaskType('ATTACK_TARGET')}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '8px',
                border: taskType === 'ATTACK_TARGET' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                background: taskType === 'ATTACK_TARGET' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚔️ Attack Target
            </button>
            <button
              onClick={() => setTaskType('DEFEND_MASTER')}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '8px',
                border: taskType === 'DEFEND_MASTER' ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                background: taskType === 'DEFEND_MASTER' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🛡️ Defend Master
            </button>
          </div>
        </div>

        {/* Target Picker if Attack */}
        {taskType === 'ATTACK_TARGET' && allOpponents.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
              2. DESIGNATED OPPONENT
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allOpponents.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => setTargetOpponentId(opp.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: targetOpponentId === opp.id ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: targetOpponentId === opp.id ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{opp.name} ({opp.characterId})</span>
                  <span style={{ fontSize: '0.72rem', color: '#FBC80D' }}>{opp.hp} HP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Settings */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
            3. STATED REWARD
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2].map((et) => (
              <button
                key={et}
                onClick={() => setRewardET(et)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: rewardET === et ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: rewardET === et ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: rewardET === et ? '#10b981' : '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                +{et} Energy Token / Turn
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleConfirm}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
          }}
        >
          ISSUE IMPERIAL MANDATE
        </button>
      </div>
    </div>
  );
}
