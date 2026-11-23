import React from 'react';
import { Crown, Swords, Shield, Coins, AlertCircle, ArrowRight } from 'lucide-react';
import { soundFX } from '../utils/audio';

/**
 * EmpireMandateBanner
 * Non-intrusive top-level HUD component displaying active Master/Slave mandates
 * or Mercenary contracts without blocking active dice rolls or card menus.
 */
export default function EmpireMandateBanner({
  playerState,
  partnerState,
  onOpenMasterCommand = null,
  onOpenRebellionChat = null,
  onBreakAlliance = null
}) {
  if (!playerState) return null;

  const relType = playerState.relationshipType;
  const role = playerState.relationshipRole;

  if (!relType || relType === 'INDEPENDENT') return null;

  const partnerName = partnerState?.name || 'Partner';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto 10px',
        background: relType === 'SERVANT'
          ? (role === 'MASTER' ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(16, 24, 48, 0.8) 100%)' : 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(16, 24, 48, 0.8) 100%)')
          : relType === 'MERCENARY'
          ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.25) 0%, rgba(16, 24, 48, 0.8) 100%)'
          : 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 24, 48, 0.8) 100%)',
        border: `1.5px solid ${relType === 'SERVANT' ? '#f59e0b' : relType === 'MERCENARY' ? '#a855f7' : '#10b981'}80`,
        borderRadius: '10px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        zIndex: 50
      }}
    >
      {/* Left side: Role info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '1.4rem' }}>
          {relType === 'SERVANT' ? (role === 'MASTER' ? '👑' : '⛓️') : relType === 'MERCENARY' ? '⚔️' : '🤝'}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 'bold' }}>
            {relType === 'SERVANT' ? `Empire Era — ${role}` : relType === 'MERCENARY' ? `Mercenary Contract (${playerState.contractTurns || 3} Turns Left)` : 'Non-Sovereign Alliance'}
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>
            {relType === 'SERVANT' && role === 'MASTER' && (
              <span>Commanding Servant: <span style={{ color: '#f59e0b' }}>{partnerName}</span></span>
            )}
            {relType === 'SERVANT' && role === 'SLAVE' && (
              <span>Serving Master: <span style={{ color: '#f59e0b' }}>{partnerName}</span> ({playerState.activeTask || 'Follow Master’s Lead'})</span>
            )}
            {relType === 'MERCENARY' && (
              <span>Contract with <span style={{ color: '#a855f7' }}>{partnerName}</span> — Bounty: 2 ET in Escrow</span>
            )}
            {relType === 'ALLIANCE' && (
              <span>Allied with <span style={{ color: '#10b981' }}>{partnerName}</span> — Friendly Fire Locked</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {relType === 'SERVANT' && role === 'MASTER' && onOpenMasterCommand && (
          <button
            onClick={() => {
              try { soundFX.playMenuSelect(); } catch {}
              onOpenMasterCommand();
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid #f59e0b',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Assign Task
          </button>
        )}

        {onOpenRebellionChat && (
          <button
            onClick={() => {
              try { soundFX.playMenuSelect(); } catch {}
              onOpenRebellionChat();
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 240, 255, 0.5)',
              background: 'rgba(0, 240, 255, 0.15)',
              color: '#00f0ff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💬 Private Chat
          </button>
        )}

        {onBreakAlliance && (
          <button
            onClick={() => {
              try { soundFX.playDamage(); } catch {}
              onBreakAlliance();
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ff8888',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Break connection (Requires ABANDON or BACK STAB to evade -40 HP penalty)"
          >
            Breakup (-40 HP w/o Card)
          </button>
        )}
      </div>
    </div>
  );
}
