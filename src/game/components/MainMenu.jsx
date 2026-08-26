import React, { useState, useRef, useEffect } from 'react';
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
  const [miniChat, setMiniChat] = useState([
    { isBot: true, text: "Need a rule clarification? I'm here to help!" }
  ]);
  const [turnCounter, setTurnCounter] = useState(12);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const chatScrollRef = useRef(null);

  const PHASES = ['Draw Phase', 'Main Phase 1', 'Battle Phase', 'Main Phase 2', 'End Phase'];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [miniChat]);

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
    const currIdx = charList.findIndex(c => c.id === selectedCharId);
    const nextIdx = (currIdx + 1) % charList.length;
    setSelectedCharId(charList[nextIdx].id);
  };

  const handleAskQuick = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    soundFX.playCard();
    const q = quickQuestion.toLowerCase();
    
    const newChat = [...miniChat, { isBot: false, text: quickQuestion }];
    setQuickQuestion('');
    
    let bestMatch = null;
    let maxScore = 0;
    
    RULES_KNOWLEDGE.forEach(rule => {
      let score = 0;
      rule.keywords.forEach(kw => {
        if (q.includes(kw.toLowerCase())) score++;
      });
      if (score > maxScore) {
        maxScore = score;
        bestMatch = rule;
      }
    });

    const answerText = maxScore > 0 ? bestMatch.shortAnswer : "I'm not sure. Try asking about poison, dice, ET, or winning!";
    setMiniChat([...newChat, { isBot: true, text: answerText }]);
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
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

            <div 
              className="mini-chat-history" 
              ref={chatScrollRef}
              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', paddingRight: '5px' }}
            >
              {miniChat.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.isBot ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    background: msg.isBot ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 51, 102, 0.15)',
                    border: `1px solid ${msg.isBot ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 51, 102, 0.3)'}`,
                    color: msg.isBot ? 'var(--neon-cyan)' : '#fff',
                    wordWrap: 'break-word'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAskQuick} className="bot-query-box" style={{ marginTop: 'auto' }}>
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
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div className="menu-footer">
          <p className="footer-tagline">✦ Built for Duelists. Designed for Victory. ✦</p>
          <div className="version-info">v1.0.0</div>
        </div>
      </div>
      
    </div>
  );
}
