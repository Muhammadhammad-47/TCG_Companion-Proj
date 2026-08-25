import React, { useState } from 'react';
import {
  Swords, HelpCircle, UserPlus, Cast, Send, Crown, Sparkles, ChevronRight,
  RotateCw, Bot, Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';

export default function MainMenu({
  onStartCustomGame,
  onStartQuickDuel,
  onOpenRules,
  tvMode,
  setTvMode,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  onToggleMute
}) {
  const [selectedCharId, setSelectedCharId] = useState('chynaman');
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [turnCounter, setTurnCounter] = useState(12);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const PHASES = ['Draw Phase', 'Main Phase 1', 'Battle Phase', 'Main Phase 2', 'End Phase'];

  const charList = [
    CHARACTERS.chynaman,
    CHARACTERS.bee,
    CHARACTERS.katsumi,
    CHARACTERS.kiko
  ].filter(Boolean);

  const activeChar = CHARACTERS[selectedCharId] || charList[0];

  const handleNextTurn = () => {
    soundFX.playMenuHover();
    setTurnCounter(prev => prev + 1);
    setPhaseIndex(prev => (prev + 1) % PHASES.length);
    // Cycle selected character
    const currIdx = charList.findIndex(c => c.id === selectedCharId);
    const nextIdx = (currIdx + 1) % charList.length;
    setSelectedCharId(charList[nextIdx].id);
  };

  const handleAskQuick = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    soundFX.playCard();
    const q = quickQuestion.toLowerCase();
    if (q.includes('poison')) {
      setQuickAnswer('Poison deals damage at the start of your turn. 5 Poison activates Zombie Mode!');
    } else if (q.includes('dp') || q.includes('defense')) {
      setQuickAnswer('Roll 6+ on 2 Gold dice to activate innate Defense Power (DP) damage reduction.');
    } else if (q.includes('et') || q.includes('energy')) {
      setQuickAnswer('Start with 5 ET. Regular attacks cost 1, Super 2, Kontrol 3, Blitz 5.');
    } else if (q.includes('crystal') || q.includes('win')) {
      setQuickAnswer('Claim 3 Stability Crystals or reduce all opponents to 0 LP to win!');
    } else {
      setQuickAnswer('Match pairs Action Cards with Hero techniques. Click to view full rulebook!');
    }
  };

  return (
    <div className="webgl-canvas-frame">
      <div className="webgl-screen menu-screen">
        {/* Background diagonal neon streaks & particle glow */}
        <div className="menu-bg-elements">
          <div className="neon-streak-red"></div>
          <div className="neon-streak-blue"></div>
          <div className="subtle-watermark-card left-wm"></div>
          <div className="subtle-watermark-card right-wm"></div>
        </div>



        {/* Main 3-Column Center Stage */}
        <div className="menu-main-stage">
          {/* Left Column: Brand Logo */}
          <div className="menu-left-col">
            <div className="game-brand-block">
              <div className="brand-pill-badge">注意!</div>
              <h1 className="game-main-title">
                <span className="title-dance">注意 TCG</span>
              </h1>
              <div className="brand-sub-row">
                <span className="brand-tcg-text">COMPANION APP</span>
              </div>
              <p className="brand-slogan">Track. Play. Win Together.</p>
            </div>
          </div>

          {/* Center Column: Active Player Spotlight Card */}
          <div className="menu-center-col">
            <div className="active-player-wrapper">
              <span className="active-player-kicker">ACTIVE PLAYER</span>

              <div className="active-player-card">
                <div className="active-crown-badge">
                  <Crown size={20} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                </div>

                <div className="active-character-portrait-frame">
                  <img
                    src={getAssetUrl(activeChar.image)}
                    alt={activeChar.name}
                    className="active-character-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="portrait-fallback-avatar">{activeChar.avatar}</div>
                  <div className="portrait-inner-glow"></div>
                </div>

                <div className="active-player-meta">
                  <h2 className="active-player-name">{activeChar.name}</h2>
                  <div className="active-lp-row">
                    <span className="active-lp-label">LP</span>
                    <span className="active-lp-value">{activeChar.defaultLP || 8000}</span>
                  </div>

                  <button className="btn-next-turn-ribbon" onClick={handleNextTurn}>
                    <span>NEXT TURN</span>
                  </button>

                  <div className="active-phase-tag">{PHASES[phaseIndex]}</div>
                </div>
              </div>
            </div>

            {/* Turn Dial Gauge Widget */}
            <div className="turn-dial-widget">
              <div className="dial-svg-container">
                <svg className="turn-dial-svg" viewBox="0 0 120 120">
                  {/* Outer Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="dial-track-bg"
                  />
                  {/* Segmented Glowing Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="dial-arc-glow"
                    strokeDasharray="210 300"
                    strokeDashoffset="75"
                  />
                  {/* Arrow Indicator */}
                  <path
                    d="M 50 15 L 60 12 L 60 18 Z"
                    fill="var(--neon-cyan)"
                    opacity="0.8"
                  />
                </svg>

                <div className="dial-center-content">
                  <span className="dial-turn-lbl">TURN</span>
                  <span className="dial-turn-num">{turnCounter}</span>
                  <span className="dial-turn-infinity">/ ∞</span>
                </div>
              </div>

              <span className="dial-caption">CLOCKWISE TURN ORDER</span>
            </div>
          </div>

          {/* Right Column: Score Summary Panel */}
          <div className="menu-right-col">
            <div className="score-summary-panel">
              <h3 className="score-summary-title">SCORE SUMMARY</h3>

              <div className="score-summary-list">
                {charList.map((char, idx) => {
                  const isActive = char.id === activeChar.id;
                  const rankNum = idx + 1;
                  return (
                    <div
                      key={char.id}
                      className={`score-summary-row ${isActive ? 'active-player-row' : ''}`}
                      onClick={() => {
                        soundFX.playMenuHover();
                        setSelectedCharId(char.id);
                      }}
                    >
                      <div className="score-row-avatar-wrap" style={{ borderColor: char.themeColor }}>
                        <img
                          src={getAssetUrl(char.image)}
                          alt={char.name}
                          className="score-row-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="score-row-emoji">{char.avatar}</span>
                      </div>

                      <div className="score-row-names">
                        <strong className="score-player-name">{char.name}</strong>
                        <span className="score-player-format">LP</span>
                      </div>

                      <div className="score-row-lp">
                        <span className="score-lp-val">{char.defaultLP || 8000}</span>
                      </div>

                      <div className={`score-rank-badge rank-${rankNum} ${isActive ? 'rank-active' : ''}`}>
                        {rankNum}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Buttons Bar */}
        <div className="menu-bottom-actions-bar">
          {/* 1. Start Match (Primary Crimson Glow) */}
          <button className="menu-action-btn btn-start-match" onClick={onStartCustomGame}>
            <div className="action-btn-icon">
              <Swords size={28} />
            </div>
            <div className="action-btn-text">
              <strong className="action-btn-title">START MATCH</strong>
              <span className="action-btn-subtitle">Begin a new duel</span>
            </div>
          </button>



          {/* 3. Add Player */}
          <button className="menu-action-btn btn-add-player" onClick={onStartCustomGame}>
            <div className="action-btn-icon">
              <UserPlus size={26} />
            </div>
            <div className="action-btn-text">
              <strong className="action-btn-title">ADD PLAYER</strong>
              <span className="action-btn-subtitle">Invite to the match</span>
            </div>
          </button>

          {/* 4. Cast Screen */}
          <button
            className={`menu-action-btn btn-cast-screen ${tvMode ? 'cast-active' : ''}`}
            onClick={() => setTvMode(!tvMode)}
          >
            <div className="action-btn-icon">
              <Cast size={26} />
            </div>
            <div className="action-btn-text">
              <strong className="action-btn-title">{tvMode ? 'CASTING ON' : 'CAST SCREEN'}</strong>
              <span className="action-btn-subtitle">Share to another device</span>
            </div>
          </button>

          {/* Rules Bot Beta Card (Moved to bottom right empty space) */}
          <div className="rules-bot-card" style={{ marginLeft: 'auto', marginBottom: 0, padding: '10px 15px', height: '100%', flex: '0 1 350px' }}>
            <div className="rules-bot-header" style={{ marginBottom: '8px' }}>
              <div className="bot-avatar-wrap" style={{ width: '35px', height: '35px' }}>
                <div className="bot-robot-icon">
                  <Bot size={20} color="var(--neon-cyan)" />
                </div>
              </div>
              <div className="bot-info-meta">
                <div className="bot-title-row">
                  <strong className="bot-title" style={{ fontSize: '0.9rem' }}>RULES BOT</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleAskQuick} className="bot-query-box">
              <input
                type="text"
                className="bot-input-field"
                placeholder="Ask a question..."
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
              />
              <button type="submit" className="bot-send-btn" title="Submit Question">
                <Send size={15} />
              </button>
            </form>

            {quickAnswer && (
              <div className="bot-quick-response" onClick={onOpenRules} title="Open full rulebook">
                <Sparkles size={14} className="sparkle-cyan" />
                <span>{quickAnswer}</span>
                <ChevronRight size={14} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Credit */}
        <footer className="menu-footer">
          <div className="footer-built-with">
            <span className="footer-sparkle">✦</span>
            <span>Built for Duelists. Designed for Victory.</span>
            <span className="footer-sparkle">✦</span>
          </div>
          <span className="footer-version-tag">v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
