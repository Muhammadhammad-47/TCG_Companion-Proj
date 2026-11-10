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
        <div className="fullscreen-turn-banner">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '3rem',
            letterSpacing: '3px',
            color: turnBanner.isMe ? 'var(--neon-cyan, #00f0ff)' : '#ff2a55',
            textShadow: turnBanner.isMe ? '0 0 20px rgba(0, 240, 255, 0.8)' : '0 0 20px rgba(255, 42, 85, 0.8)'
          }}>
            <Swords size={36} color={turnBanner.isMe ? '#00f0ff' : '#ff2a55'} />
            <span>{turnBanner.text}</span>
            <Sparkles size={32} color="var(--neon-gold, #FBC80D)" />
          </div>
          {turnBanner.sub && (
            <div style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '1.5px',
              marginTop: '4px',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              {turnBanner.sub}
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
