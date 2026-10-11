import React, { useState, useEffect } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function SecretAllianceInviteModal({
  isOpen,
  activePlayer,
  allPlayers,
  onSendInvite,
  onCancel,
  existingAlliance,
  preselectedTargetId  // FIX #4: Pass target from SOUL ALLIANCE card
}) {
  const [selectedTargetId, setSelectedTargetId] = useState(preselectedTargetId || null);
  const [errorMsg, setErrorMsg] = useState(null);

  // FIX #4: Auto-select target if preselectedTargetId provided, and auto-send after brief delay
  useEffect(() => {
    if (preselectedTargetId && isOpen) {
      const target = allPlayers.find(p => p.id === preselectedTargetId);
      if (target) {
        setSelectedTargetId(preselectedTargetId);
        // Auto-send after short delay to let UI render
        const autoSendTimer = setTimeout(() => {
          handleSendInvite(preselectedTargetId);
        }, 500);
        return () => clearTimeout(autoSendTimer);
      }
    }
  }, [preselectedTargetId, isOpen]);

  // Only show players who are not defeated and not the active player
  const eligibleTargets = allPlayers.filter(
    p => p.id !== activePlayer.id && !p.isDefeated
  );

  // If there's an existing alliance, disable this invite
  if (existingAlliance) {
    return (
      <div className="secret-invite-modal-overlay">
        <div className="secret-invite-modal-container">
          <div className="modal-header">
            <h2 className="modal-title">🤝 SOUL ALLIANCE</h2>
            <button className="modal-close-btn" onClick={onCancel}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-content">
            <div className="alliance-exists-message">
              <Clock size={32} />
              <p>You already have an active alliance with <strong>{existingAlliance.allyName}</strong></p>
              <p className="expires-info">Expires in {existingAlliance.turnsRemaining} turn{existingAlliance.turnsRemaining !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="modal-buttons">
            <button className="btn-cancel" onClick={onCancel}>
              <X size={16} /> Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectTarget = (targetId) => {
    soundFX.playCard();
    setSelectedTargetId(targetId);
    setErrorMsg(null);
  };

  const handleSendInvite = (targetId) => {
    const finalTargetId = targetId || selectedTargetId;
    if (!finalTargetId) {
      setErrorMsg('Please select a target to invite');
      return;
    }

    soundFX.playMenuSelect();
    const target = allPlayers.find(p => p.id === finalTargetId);
    
    onSendInvite({
      fromPlayerId: activePlayer.id,
      fromPlayerName: activePlayer.name,
      toPlayerId: target.id,
      toPlayerName: target.name
    });
  };

  if (!isOpen) return null;

  return (
    <div className="secret-invite-modal-overlay">
      <div className="secret-invite-modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">🤝 SOUL ALLIANCE</h2>
          <button className="modal-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <p className="invite-subtitle">
            Who do you want to ally with? (Secret - Only visible to recipient)
          </p>

          {/* Target List */}
          <div className="target-list">
            {eligibleTargets.length > 0 ? (
              eligibleTargets.map(player => (
                <div
                  key={player.id}
                  className={`target-player-option ${selectedTargetId === player.id ? 'selected' : ''}`}
                  onClick={() => handleSelectTarget(player.id)}
                >
                  <div className="target-player-info">
                    <div className="target-name">{player.name}</div>
                    <div className="target-status">
                      HP: {player.hp}/{player.maxHp} | ET: {player.energyTokens}
                    </div>
                  </div>
                  {selectedTargetId === player.id && (
                    <div className="target-checkmark">
                      <Check size={20} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-targets-message">
                No eligible targets available
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="error-message">
              {errorMsg}
            </div>
          )}

          {/* Information Box */}
          <div className="invite-info-box">
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">Invite is private - only recipient sees it</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⏱️</span>
              <span className="info-text">Recipient has 30 seconds to accept or decline</span>
            </div>
            <div className="info-item">
              <span className="info-icon">💬</span>
              <span className="info-text">If accepted, opens private negotiation chat</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="modal-buttons">
          <button
            className="btn-cancel"
            onClick={onCancel}
          >
            <X size={16} /> Cancel
          </button>
          <button
            className="btn-send-invite"
            onClick={handleSendInvite}
            disabled={!selectedTargetId || eligibleTargets.length === 0}
          >
            <Check size={16} /> Send Invite
          </button>
        </div>
      </div>

      <style jsx>{`
        .secret-invite-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }

        .secret-invite-modal-container {
          background: linear-gradient(135deg, #1a2a3a 0%, #0f1a2a 100%);
          border: 2px solid #9d4edd;
          border-radius: 12px;
          padding: 20px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 0 30px rgba(157, 78, 221, 0.4);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(157, 78, 221, 0.3);
          padding-bottom: 12px;
        }

        .modal-title {
          font-size: 24px;
          color: #9d4edd;
          margin: 0;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(157, 78, 221, 0.5);
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          color: #9d4edd;
          transform: rotate(90deg);
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .invite-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin: 0 0 16px 0;
          font-weight: 500;
        }

        .target-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .target-player-option {
          background: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(157, 78, 221, 0.3);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .target-player-option:hover {
          border-color: #9d4edd;
          background: rgba(157, 78, 221, 0.1);
        }

        .target-player-option.selected {
          border-color: #39ff14;
          background: rgba(57, 255, 20, 0.1);
          box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
        }

        .target-player-info {
          flex: 1;
        }

        .target-name {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .target-status {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .target-checkmark {
          color: #39ff14;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .no-targets-message {
          text-align: center;
          color: #ff6b6b;
          padding: 16px;
          background: rgba(255, 107, 107, 0.1);
          border-radius: 6px;
          font-size: 14px;
        }

        .alliance-exists-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px;
          background: rgba(157, 78, 221, 0.1);
          border: 1px solid rgba(157, 78, 221, 0.3);
          border-radius: 8px;
          text-align: center;
        }

        .alliance-exists-message svg {
          color: #9d4edd;
        }

        .alliance-exists-message p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .alliance-exists-message strong {
          color: #39ff14;
        }

        .expires-info {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px !important;
        }

        .error-message {
          background: rgba(255, 107, 107, 0.15);
          border: 1px solid #ff6b6b;
          border-radius: 6px;
          color: #fca5a5;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        }

        .invite-info-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(157, 78, 221, 0.08);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .info-icon {
          font-size: 14px;
          min-width: 20px;
        }

        .info-text {
          flex: 1;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          border-top: 1px solid rgba(157, 78, 221, 0.2);
          padding-top: 12px;
        }

        .btn-cancel,
        .btn-send-invite {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 13px;
        }

        .btn-cancel {
          background: rgba(255, 107, 107, 0.2);
          color: #fca5a5;
          border: 1px solid #ff6b6b;
        }

        .btn-cancel:hover {
          background: rgba(255, 107, 107, 0.3);
        }

        .btn-send-invite {
          background: linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%);
          color: #fff;
          border: 1px solid #9d4edd;
        }

        .btn-send-invite:hover:not(:disabled) {
          box-shadow: 0 0 15px rgba(157, 78, 221, 0.6);
        }

        .btn-send-invite:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
