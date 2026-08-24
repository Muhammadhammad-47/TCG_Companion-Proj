import React, { useState, useEffect } from 'react';
import { Sparkles, Swords, Zap, Shield, Skull, Radio } from 'lucide-react';
import { soundFX } from '../utils/audio';

const LOADING_STEPS = [
  { text: 'Booting Dance With Mii! Combat Engine...', icon: <Zap size={16} /> },
  { text: 'Synthesizing 2-Dice Tabletop Roller...', icon: <Swords size={16} /> },
  { text: 'Awakening 7 Warrior Soul Archetypes...', icon: <Sparkles size={16} /> },
  { text: 'Calibrating Stability Crystals & ET Matrix...', icon: <Shield size={16} /> },
  { text: 'Arming Zombie Infection & Venom Protocols...', icon: <Skull size={16} /> },
  { text: 'All Anime Express TV Systems Online — Ready!', icon: <Radio size={16} /> }
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [readyToEnter, setReadyToEnter] = useState(false);

  useEffect(() => {
    // Increment progress smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReadyToEnter(true);
          soundFX.playPowerUp();
          return 100;
        }
        // Random incremental jumps for realistic game asset loading feel
        const jump = Math.floor(Math.random() * 14) + 8;
        const next = Math.min(100, prev + jump);
        
        // Update tip text index based on progress
        const nextStep = Math.min(
          LOADING_STEPS.length - 1,
          Math.floor((next / 100) * LOADING_STEPS.length)
        );
        setStepIndex(nextStep);

        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, []);

  const handleStartGame = () => {
    soundFX.playGameStart();
    soundFX.startBGM();
    onComplete();
  };

  return (
    <div className="game-loader-overlay dance-loader-theme">
      <div className="game-loader-cyber-bg">
        <div className="bg-glow-orb orb-magenta-top"></div>
        <div className="cyber-grid-plane"></div>
        <div className="neon-particles"></div>
      </div>

      <div className="game-loader-content">
        {/* Game Tag */}
        <div className="studio-tag">
          <span className="studio-pill">注意! ANIME EXPRESS TV</span>
          <span className="studio-sub">DANCE WITH MII • TCG ENGINE</span>
        </div>

        {/* Title Logo Card matching Figma */}
        <div className="dance-app-icon-card loader-icon-card">
          <div className="icon-kanji-badge">
            <span>注意!</span>
          </div>
          <div className="icon-dance-with-text">
            <span>Dance With</span>
          </div>
          <div className="icon-mii-logo">
            <span className="mii-text-front">Mii!</span>
            <span className="mii-text-glow">Mii!</span>
          </div>
        </div>

        {/* Loading Progress Bar Container */}
        <div className="game-loader-bar-wrap">
          <div className="loader-meta-row">
            <span className="loader-status-text">
              {LOADING_STEPS[stepIndex].icon}
              <span>{LOADING_STEPS[stepIndex].text}</span>
            </span>
            <span className="loader-percent">{progress}%</span>
          </div>

          <div className="game-progress-track">
            <div
              className="game-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-glow-tip"></div>
              <div className="progress-scanline"></div>
            </div>
          </div>

          {/* Segmented arcade notches */}
          <div className="loader-segments">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`segment-notch ${progress >= (i + 1) * 10 ? 'lit' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Press Start / Enter Button */}
        <div className="loader-action-area">
          {readyToEnter ? (
            <button
              className="btn-arcade-enter"
              onClick={handleStartGame}
              onMouseEnter={() => soundFX.playMenuHover()}
              autoFocus
            >
              <span className="btn-pulse-ring"></span>
              <Sparkles size={20} color="#ffe600" />
              <span>START DANCING • ENTER ARENA</span>
            </button>
          ) : (
            <div className="loader-system-initializing">
              <span className="blink-dot"></span>
              <span>CONNECTING TO DANCE WITH MII ARENA...</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="loader-footer-specs">
          <span>ANIME EXPRESS TV • 2-DICE RNG ENGINE • ZOMBIE MODE v1.0</span>
        </div>
      </div>
    </div>
  );
}
