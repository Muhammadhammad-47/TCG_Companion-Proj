import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Skull, Swords, Zap, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

/**
 * FullScreenCinematics Component
 * Orchestrates full-screen cinematic events:
 * - Turn start banner slashes
 * - Super Move (40+ AP) screen dimming
 * - Saigo No Blitz (200 AP) screen shatter
 * - Kontrol mind-break psychic distortion
 * - Victory trophy fireworks & Defeat monochrome glitch
 */
export default function FullScreenCinematics({
  turnBanner = null, // { text: 'YOUR TURN', isMe: true }
  isDimmed = false,
  isShattered = false,
  isPsychicWarp = false,
  winnerData = null, // { isWinner: true, name: 'Chynaman' }
  onClearTurnBanner
}) {
  const [showBanner, setShowBanner] = useState(false);

  // Trigger turn banner animation
  useEffect(() => {
    if (turnBanner) {
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        if (onClearTurnBanner) onClearTurnBanner();
      }, 1900);
      return () => clearTimeout(timer);
    }
  }, [turnBanner, onClearTurnBanner]);

  // Trigger Victory Confetti
  useEffect(() => {
    if (winnerData && winnerData.isWinner) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FBC80D', '#00f0ff', '#ff0055', '#39ff14', '#ffffff']
        });
      } catch (e) {}
    }
  }, [winnerData]);

  return (
    <>
      {/* 1. Super Move Screen Dimming */}
      {isDimmed && (
        <div className="fullscreen-vfx-dim" />
      )}

      {/* 2. Turn Start Banner Slash */}
      {showBanner && turnBanner && (
        <div
          className="fullscreen-turn-banner"
          style={{
            borderTopColor: turnBanner.color || (turnBanner.isMe ? 'var(--neon-cyan, #00f0ff)' : '#ff2a55'),
            borderBottomColor: turnBanner.color || (turnBanner.isMe ? 'var(--neon-cyan, #00f0ff)' : '#ff2a55'),
            boxShadow: `0 0 50px ${turnBanner.color ? `${turnBanner.color}88` : 'rgba(251, 200, 13, 0.5)'}`
          }}
        >
          {turnBanner.badge && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 16px',
              borderRadius: '20px',
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.1rem',
              letterSpacing: '2px',
              background: 'rgba(0, 0, 0, 0.65)',
              border: `1.5px solid ${turnBanner.color || '#FBC80D'}`,
              color: turnBanner.color || '#FBC80D',
              marginBottom: '6px',
              textShadow: `0 0 10px ${turnBanner.color || '#FBC80D'}`
            }}>
              {turnBanner.isExtraTurn && <Zap size={18} />}
              <span>{turnBanner.badge}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '3.2rem',
            letterSpacing: '3px',
            color: turnBanner.color || (turnBanner.isMe ? 'var(--neon-cyan, #00f0ff)' : '#ff2a55'),
            textShadow: `0 0 24px ${turnBanner.color || (turnBanner.isMe ? 'rgba(0, 240, 255, 0.9)' : 'rgba(255, 42, 85, 0.9)')}`,
            lineHeight: 1.1
          }}>
            {turnBanner.isExtraTurn ? <Zap size={38} color={turnBanner.color || '#FBC80D'} /> : <Swords size={38} color={turnBanner.color || (turnBanner.isMe ? '#00f0ff' : '#ff2a55')} />}
            <span>{turnBanner.text}</span>
            <Sparkles size={34} color={turnBanner.color || 'var(--neon-gold, #FBC80D)'} />
          </div>
          {turnBanner.sub && (
            <div style={{
              fontSize: '1.15rem',
              color: '#ffffff',
              letterSpacing: '1px',
              marginTop: '6px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(0,0,0,0.8)'
            }}>
              {turnBanner.sub}
            </div>
          )}
          {turnBanner.detail && (
            <div style={{
              display: 'inline-block',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.85)',
              background: 'rgba(0, 0, 0, 0.55)',
              padding: '4px 14px',
              borderRadius: '6px',
              marginTop: '6px',
              border: '1px dashed rgba(255, 255, 255, 0.3)'
            }}>
              {turnBanner.detail}
            </div>
          )}
        </div>
      )}

      {/* 3. Saigo No Blitz (200 AP) Blinding Screen Shatter */}
      {isShattered && (
        <div className="fullscreen-shatter-flash">
          {/* SVG Spiderweb Shatter Lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="50" x2="0" y2="0" stroke="#ff0055" strokeWidth="0.8" />
            <line x1="50" y1="50" x2="100" y2="0" stroke="#00f0ff" strokeWidth="0.8" />
            <line x1="50" y1="50" x2="100" y2="100" stroke="#FBC80D" strokeWidth="0.8" />
            <line x1="50" y1="50" x2="0" y2="100" stroke="#ff0055" strokeWidth="0.8" />
            <line x1="50" y1="50" x2="50" y2="0" stroke="#fff" strokeWidth="1.2" />
            <line x1="50" y1="50" x2="50" y2="100" stroke="#fff" strokeWidth="1.2" />
          </svg>
        </div>
      )}

      {/* 4. Kontrol Mind-Break Psychic Distortion */}
      {isPsychicWarp && (
        <div className="fullscreen-psychic-warp" />
      )}
    </>
  );
}

