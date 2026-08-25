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
      alert('Cannot use Blitz: Requires HP < 50 and at least 5 Energy Tokens.');
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
            <span className="step-pill blitz-step"><Flame size={14} /> ULTIMATE DESTRUCTION (5 ET)</span>
            <h2>SAIGO NO BLITZ (200 AP)</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="special-modal-body">
          {/* HP Requirement Warning */}
          {attacker.hp >= 50 && (
            <div className="error-alert">
              <AlertOctagon size={18} />
              <span>
                <strong>Requirement Not Met:</strong> Saigo No Blitz can ONLY be triggered when HP is below 50. (Current HP: {attacker.hp})
              </span>
            </div>
          )}

          <div className="blitz-sacrifice-notice">
            <Zap size={18} color="#ffd700" />
            <span>
              <strong>Cost:</strong> 5 Energy Tokens + <strong>Lose 50% remaining HP</strong> (will lose {Math.floor(attacker.hp * 0.5)} HP).
            </span>
          </div>

          {/* Mode Selector */}
          <div className="setting-group">
            <label className="section-label">Select Attack Mode:</label>
            <div className="preset-buttons">
              <button
                className={`preset-btn ${mode === 'one_vs_one' ? 'selected' : ''}`}
                onClick={() => setMode('one_vs_one')}
              >
                🎯 1 vs. 1 (Single Target: Full 200 AP)
              </button>
              <button
                className={`preset-btn ${mode === 'one_vs_all' ? 'selected' : ''}`}
                onClick={() => setMode('one_vs_all')}
              >
                💥 1 vs. ALL (Split 200 AP = {splitDamagePerOpponent} AP each)
              </button>
            </div>
          </div>

          {/* Target Selector for 1v1 */}
          {mode === 'one_vs_one' && (
            <div className="target-select-section">
              <label className="section-label">Select Target to Annihilate:</label>
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
                      <span>{target.hp} HP</span>
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
            <Flame size={20} fill="#fff" /> UNLEASH 200 AP SAIGO NO BLITZ
          </button>
        </div>
      </div>
    </div>
  );
}
