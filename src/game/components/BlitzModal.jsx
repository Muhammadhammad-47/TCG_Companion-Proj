import React, { useState } from 'react';
import { soundFX } from '../utils/audio';
import { Zap, X, AlertOctagon, Check, Flame } from 'lucide-react';

export default function BlitzModal({ attacker, allPlayers, onClose, onCompleteBlitz }) {
  const [mode, setMode] = useState('one_vs_one'); // 'one_vs_one' | 'one_vs_all'
  const [targetId, setTargetId] = useState(
    allPlayers.find(p => p.id !== attacker.id)?.id || ''
  );

  const canUseBlitz = attacker.hp < 50 && attacker.energyTokens >= 5;
  const opponents = allPlayers.filter(p => p.id !== attacker.id);
  const splitDamagePerOpponent = Math.floor(200 / Math.max(1, opponents.length));

  const handleExecuteBlitz = () => {
    if (!canUseBlitz) {
      alert('Blitz needs HP < 50 and 5 ET.');
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
    <div className="modal-backdrop">
      <div className="special-card-modal blitz-modal">
        <div className="modal-header">
          <div className="header-title-box">
            <span className="step-pill blitz-step"><Flame size={14} /> 5 ET</span>
            <h2>BLITZ · 200 AP</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="special-modal-body">
          {/* HP Requirement Warning */}
          {attacker.hp >= 50 && (
            <div className="error-alert">
              <AlertOctagon size={18} />
              <span>Needs HP &lt; 50 — you have {attacker.hp}.</span>
            </div>
          )}

          <div className="blitz-sacrifice-notice">
            <Zap size={18} color="#ffe93d" />
            <span>5 ET + <strong>-{Math.floor(attacker.hp * 0.5)} HP</strong></span>
          </div>

          {/* Mode Selector */}
          <div className="setting-group">
            <label className="section-label">MODE</label>
            <div className="preset-buttons">
              <button
                className={`preset-btn ${mode === 'one_vs_one' ? 'selected' : ''}`}
                onClick={() => setMode('one_vs_one')}
              >
                🎯 1v1 · 200 AP
              </button>
              <button
                className={`preset-btn ${mode === 'one_vs_all' ? 'selected' : ''}`}
                onClick={() => setMode('one_vs_all')}
              >
                💥 ALL · {splitDamagePerOpponent} each
              </button>
            </div>
          </div>

          {/* Target Selector for 1v1 */}
          {mode === 'one_vs_one' && (
            <div className="target-select-section">
              <label className="section-label">TARGET</label>
              <div className="targets-grid">
                {opponents.map(target => (
                  <div
                    key={target.id}
                    className={`target-pill ${targetId === target.id ? 'target-selected' : ''}`}
                    onClick={() => setTargetId(target.id)}
                  >
                    <span>{target.isZombie ? '🧟‍♂️' : '⚔️'}</span>
                    <div>
                      <strong>{target.name}</strong>
                      <span>{target.hp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Button */}
          <button
            className="btn-execute-blitz"
            onClick={handleExecuteBlitz}
            disabled={!canUseBlitz}
          >
            <Flame size={20} fill="#fff" /> UNLEASH
          </button>
        </div>
      </div>
    </div>
  );
}
