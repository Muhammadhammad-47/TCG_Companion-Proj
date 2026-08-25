import React, { useState, useEffect } from 'react';
import { Swords, Zap, Shield, Skull, Dices, Play } from 'lucide-react';
import { soundFX } from '../utils/audio';

const LOADING_STEPS = [
  { text: 'Loading Tactical Engine...', icon: <Zap size={16} color="var(--neon-cyan)" /> },
  { text: 'Calibrating Red & Gold Dice...', icon: <Dices size={16} color="var(--neon-crimson)" /> },
  { text: 'Syncing Action Deck & Cards...', icon: <Swords size={16} color="#ffd700" /> },
  { text: 'Charging Stability Crystals...', icon: <Shield size={16} color="var(--neon-cyan)" /> },
  { text: 'Scanning Zombie Bio-Threats...', icon: <Skull size={16} color="#39ff14" /> },
  { text: 'Battlefield Ready!', icon: <Play size={16} color="#ffffff" /> }
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [readyToEnter, setReadyToEnter] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReadyToEnter(true);
          soundFX.playPowerUp();
          return 100;
        }
        const jump = Math.floor(Math.random() * 12) + 10;
        const next = Math.min(100, prev + jump);

        const nextStep = Math.min(
          LOADING_STEPS.length - 1,
          Math.floor((next / 100) * LOADING_STEPS.length)
        );
        setStepIndex(nextStep);

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  const handleStartGame = () => {
    soundFX.playGameStart();
    soundFX.startBGM();
    onComplete();
  };

  return (
    <div className="webgl-canvas-frame">
      <div className="webgl-screen loader-screen">
        {/* Background Neon Elements */}
        <div className="menu-bg-elements">
          <div className="neon-streak-red"></div>
          <div className="neon-streak-blue"></div>
          <div className="subtle-watermark-card left-wm"></div>
          <div className="subtle-watermark-card right-wm"></div>
        </div>

        <div className="loader-center-content">
          {/* Brand Banner */}
          <div className="loader-brand-card">
            <div className="brand-pill-badge">注意!</div>
            <h1 className="game-main-title">
              <span className="title-dance">Dance With</span>
              <span className="title-mii">Mii!</span>
            </h1>
            <span className="brand-tcg-text">TCG COMPANION</span>
            <p className="brand-slogan">Track. Play. Win Together.</p>
          </div>

          {/* Progress Section */}
          <div className="loader-progress-box">
            <div className="loader-status-row">
              <div className="step-info-group">
                {LOADING_STEPS[stepIndex].icon}
                <span className="step-text">{LOADING_STEPS[stepIndex].text}</span>
              </div>
              <span className="loader-percentage-text">{progress}%</span>
            </div>

            <div className="loader-track-bar">
              <div
                className="loader-fill-bar"
                style={{ width: `${progress}%` }}
              >
                <div className="loader-fill-glow"></div>
              </div>
            </div>

            {/* Segment Notches */}
            <div className="loader-notches-row">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`notch-item ${progress >= (i + 1) * 10 ? 'notch-active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Action Area */}
          <div className="loader-action-container">
            {readyToEnter ? (
              <button
                className="btn-enter-game-cta"
                onClick={handleStartGame}
                autoFocus
              >
                <Play size={22} fill="currentColor" />
                <span>ENTER ARENA</span>
                <Play size={22} fill="currentColor" />
              </button>
            ) : (
              <div className="loader-pulsing-tag">
                <span className="pulse-dot"></span>
                <span>INITIALIZING WEBGL ARENA...</span>
              </div>
            )}
          </div>
        </div>

        <footer className="menu-footer">
          <span className="footer-sparkle">✦ Built for Duelists. Designed for Victory. ✦</span>
          <span className="footer-version-tag">v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
