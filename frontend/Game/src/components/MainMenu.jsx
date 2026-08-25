import React, { useState } from 'react';
import { 
  Swords, Zap, Tv, Volume2, VolumeX, ArrowLeft, UserPlus
} from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';

export default function MainMenu({
  onStartCustomGame,
  onStartQuickDuel,
  tvMode,
  setTvMode,
  isMuted,
  onToggleMute
}) {
  const [selectedCharId, setSelectedCharId] = useState('chynaman');
  const charList = Object.values(CHARACTERS);
  const activeChar = CHARACTERS[selectedCharId] || charList[0];

  return (
    <div className="img-dashboard-container clean-dashboard">
      <div className="clean-top-nav">
        <button 
          className="clean-back-btn"
          onClick={() => { window.location.href = '../index.html'; }}
        >
          <ArrowLeft size={16} /> EXIT TO HUB
        </button>
        
        <div className="clean-brand">
          <div className="img-badge-attention">注意!</div>
          <h1 className="img-logo-dance-with">Dance With Mii!</h1>
          <span className="img-tcg-sub">TCG COMPANION</span>
        </div>
      </div>

      <div className="clean-center-layout">
        {/* Character Roster */}
        <div className="clean-roster">
          <h3>SELECT YOUR WARRIOR</h3>
          <div className="roster-grid">
            {charList.map((c) => (
              <div 
                key={c.id}
                className={`roster-char-item ${c.id === selectedCharId ? 'active' : ''}`}
                onClick={() => {
                  soundFX.playMenuHover();
                  setSelectedCharId(c.id);
                }}
                style={{ borderColor: c.id === selectedCharId ? c.themeColor : 'transparent' }}
              >
                <span>{c.avatar}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Player Spotlight */}
        <div className="img-hero-spotlight-card" style={{ '--hero-color': activeChar.themeColor }}>
          <div className="img-hero-avatar-wrap">
            <span className="img-hero-avatar-emoji">{activeChar.avatar}</span>
          </div>
          <div className="img-hero-info">
            <h2 className="img-hero-name">{activeChar.name}</h2>
            <div className="img-hero-meta-row" style={{ marginTop: '0.5rem' }}>
              <span className="img-meta-tag">🧠 Mind: {activeChar.mindStrength}</span>
              <span className="img-meta-tag">🛡️ DP -{activeChar.defaultDP} (6+)</span>
              <span className="img-meta-tag">⚡ Weak: {activeChar.weakness.type}</span>
            </div>
          </div>
          <div className="img-next-turn-ribbon" onClick={onStartCustomGame}>
            <span>START MATCH</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Cards */}
      <div className="clean-action-bar">
        <button className="img-action-btn primary-start" onClick={onStartCustomGame}>
          <div className="img-action-icon"><UserPlus size={24} /></div>
          <div className="img-action-text">
            <strong>CUSTOM MATCH</strong>
            <span>Set up your roster</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={onStartQuickDuel}>
          <div className="img-action-icon"><Zap size={22} color="#38bdf8" /></div>
          <div className="img-action-text">
            <strong>QUICK 1v1 DUEL</strong>
            <span>Chynaman vs. Bee</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={() => setTvMode(!tvMode)}>
          <div className="img-action-icon"><Tv size={22} color="#ffe600" /></div>
          <div className="img-action-text">
            <strong>CAST SCREEN</strong>
            <span>{tvMode ? 'TV Mode Active' : 'Tabletop Projector'}</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={onToggleMute}>
          <div className="img-action-icon">
            {isMuted ? <VolumeX size={22} color="#e11d48" /> : <Volume2 size={22} color="#22c55e" />}
          </div>
          <div className="img-action-text">
            <strong>SOUND FX</strong>
            <span>{isMuted ? 'Muted' : 'Enabled'}</span>
          </div>
        </button>
      </div>

      <div className="img-dashboard-footer">
        <span>✦ Built for Duelists. Designed for Victory. ✦</span>
        <span className="img-version-tag">v1.0.1</span>
      </div>
    </div>
  );
}
