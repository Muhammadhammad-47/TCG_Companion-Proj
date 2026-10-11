import React from 'react';

export default function AllianceStatusBadge({
  playerName,
  allianceType,
  turnsRemaining,
  alliedWithName,
  isCurrentPlayer = false
}) {
  if (!allianceType || turnsRemaining <= 0) {
    return null;
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'CARD_SHARING':
        return '🎴';
      case 'JOINT_ATTACK':
        return '⚔️';
      case 'PROTECTION':
        return '🛡️';
      case 'MIXED':
        return '🔀';
      default:
        return '🤝';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'CARD_SHARING':
        return 'Card Sharing';
      case 'JOINT_ATTACK':
        return 'Joint Attack';
      case 'PROTECTION':
        return 'Protection';
      case 'MIXED':
        return 'Mixed Alliance';
      default:
        return 'Alliance';
    }
  };

  return (
    <div className={`alliance-badge ${isCurrentPlayer ? 'current-player' : ''}`}>
      <span className="alliance-badge-icon">🤝</span>
      <div className="alliance-badge-content">
        <div className="alliance-badge-title">ALLIED</div>
        <div className="alliance-badge-info">
          <span className="type-indicator">{getTypeIcon(allianceType)}</span>
          <span className="type-name">{getTypeLabel(allianceType)}</span>
          {alliedWithName && (
            <span className="ally-name">with {alliedWithName}</span>
          )}
        </div>
        {turnsRemaining > 0 && (
          <div className="alliance-expiry">
            ⏱️ Expires in {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <style jsx>{`
        .alliance-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(157, 78, 221, 0.1) 100%);
          border: 1px solid rgba(157, 78, 221, 0.4);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 11px;
          margin-top: 4px;
          animation: alliancePulse 2s ease-in-out infinite;
        }

        @keyframes alliancePulse {
          0%, 100% {
            box-shadow: 0 0 8px rgba(157, 78, 221, 0.3);
          }
          50% {
            box-shadow: 0 0 16px rgba(157, 78, 221, 0.5);
          }
        }

        .alliance-badge.current-player {
          background: linear-gradient(135deg, rgba(57, 255, 20, 0.15) 0%, rgba(57, 255, 20, 0.08) 100%);
          border-color: rgba(57, 255, 20, 0.4);
          animation: alliancePulseGreen 2s ease-in-out infinite;
        }

        @keyframes alliancePulseGreen {
          0%, 100% {
            box-shadow: 0 0 8px rgba(57, 255, 20, 0.3);
          }
          50% {
            box-shadow: 0 0 16px rgba(57, 255, 20, 0.5);
          }
        }

        .alliance-badge-icon {
          font-size: 14px;
          min-width: 14px;
        }

        .alliance-badge-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alliance-badge-title {
          font-weight: bold;
          color: #9d4edd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alliance-badge-info {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 10px;
        }

        .type-indicator {
          font-size: 11px;
        }

        .type-name {
          color: #9d4edd;
          font-weight: 600;
        }

        .ally-name {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }

        .alliance-expiry {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
