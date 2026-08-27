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

  // Play sound on hover for buttons
  const playHoverSound = () => soundFX.playMenuHover();
  
  // Play sound on click for buttons
  const playClickSound = () => soundFX.playMenuSelect();
  
  // Custom click handler for Rules Bot
  const handleOpenRules = () => {
    playClickSound();
    if (onOpenRules) {
      onOpenRules();
    }
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

          {/* Center Column: Full-Art Active Player Spotlight Card */}
          <div className="menu-center-col" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="active-player-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span className="active-player-kicker" style={{ fontSize: '0.72rem', letterSpacing: '2px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                WARRIOR SPOTLIGHT
              </span>

              {/* Full-Art Combat Card matching the Match Screen */}
              <div
                className="hero-combat-card"
                style={{
                  position: 'relative',
                  width: '290px',
                  height: '380px',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  border: `2.5px solid ${activeChar.themeColor || 'var(--neon-crimson)'}`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 35px ${activeChar.themeColor ? activeChar.themeColor + '55' : 'rgba(255, 51, 102, 0.4)'}`,
                  background: 'linear-gradient(180deg, #0f2248 0%, #050b18 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Full-Card Background Artwork */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    background: activeChar.bgGradient || 'none'
                  }}
                >
                  <img
                    src={getAssetUrl(activeChar.image)}
                    alt={activeChar.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                      borderRadius: '20px',
                      filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.8))'
                    }}
                  />

                  {/* Dark gradient scrim at the bottom for legibility */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '20px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 40%, rgba(3,7,18,0.92) 75%, rgba(3,7,18,1) 100%)'
                    }}
                  />
                </div>

                {/* Top Card Header */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(6px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--neon-crimson)', color: '#fff', fontWeight: 'bold', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                      ★
                    </div>
                    <strong style={{ fontSize: '0.92rem', color: '#fff', letterSpacing: '0.5px' }}>
                      {activeChar.name}
                    </strong>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--neon-gold)' }}>
                    ❖
                  </div>
                </div>

                {/* Bottom Overlay: Stats, Signature Moves & Turn Button */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderBottomLeftRadius: '20px',
                    borderBottomRightRadius: '20px'
                  }}
                >
                  {/* Stats Row (100 Base HP & Defense Power) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      style={{
                        background: 'rgba(255, 51, 102, 0.25)',
                        border: '1px solid rgba(255, 51, 102, 0.6)',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>HP</span>
                      <strong style={{ fontSize: '0.88rem', color: '#fff' }}>100 / 200</strong>
                    </div>

                    <div
                      style={{
                        background: 'rgba(0, 240, 255, 0.2)',
                        border: '1px solid rgba(0, 240, 255, 0.5)',
                        borderRadius: '8px',
                        padding: '5px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>DP</span>
                      <strong style={{ fontSize: '0.88rem', color: '#fff' }}>-{activeChar.defaultDP || 10} AP</strong>
                    </div>
                  </div>

                  {/* Moves List Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activeChar.moves?.slice(0, 2).map(move => (
                      <div
                        key={move.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '5px 8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.76rem',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>⚔️ {move.name}</span>
                        <span style={{ color: '#ffd700', fontWeight: 'bold' }}>
                          {move.type === 'dice_mult' ? `🎲 × ${move.multiplier}` : `${move.baseAP} AP`} ({move.costET} ET)
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-next-turn-ribbon"
                    onClick={handleNextTurn}
                    style={{ marginTop: '2px', padding: '7px', fontSize: '0.8rem', borderRadius: '6px', background: 'linear-gradient(90deg, #ff0055, #ff5500)', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <span>NEXT WARRIOR (SWITCH)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Turn Dial Gauge Widget */}
            <div className="turn-dial-widget">
              <div className="dial-svg-container">
                <svg className="turn-dial-svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" className="dial-track-bg" />
                  <circle cx="60" cy="60" r="48" className="dial-arc-glow" strokeDasharray="210 300" strokeDashoffset="75" />
                  <path d="M 50 15 L 60 12 L 60 18 Z" fill="var(--neon-cyan)" opacity="0.8" />
                </svg>

                <div className="dial-center-content">
                  <span className="dial-turn-lbl">ROUND</span>
                  <span className="dial-turn-num">1</span>
                  <span className="dial-turn-infinity">/ 3 💎</span>
                </div>
              </div>

              <span className="dial-caption">CLOCKWISE DUEL ORDER</span>
            </div>
          </div>

          {/* Right Column: Score Summary Panel */}
          <div className="menu-right-col">
            <div className="score-summary-panel">
              <h3 className="score-summary-title">WARRIORS ROSTER</h3>

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
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="score-row-avatar-wrap" style={{ borderColor: char.themeColor, overflow: 'hidden', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                        <img
                          src={getAssetUrl(char.image)}
                          alt={char.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div className="score-row-names">
                        <strong className="score-player-name">{char.name}</strong>
                        <span className="score-player-format" style={{ color: 'var(--neon-gold)', fontSize: '0.7rem' }}>
                          DP: -{char.defaultDP} AP
                        </span>
                      </div>

                      <div className="score-row-lp">
                        <span className="score-lp-val" style={{ color: '#00f0ff', fontWeight: 'bold' }}>100</span>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginLeft: '2px' }}>HP</span>
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
          <div 
            className="rules-bot-card" 
            onClick={handleOpenRules}
            onMouseEnter={playHoverSound}
            style={{ marginLeft: 'auto', marginBottom: 0, padding: '10px 15px', height: '100%', flex: '0 1 350px', cursor: 'pointer', transition: 'all 0.3s ease' }}
          >
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
              style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', paddingRight: '5px', justifyContent: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: 'var(--neon-cyan)',
                  wordWrap: 'break-word',
                  textAlign: 'center'
                }}>
                  Need a rule clarification? Click here to open the full Rules Bot!
                </div>
              </div>
            </div>

            <div className="bot-query-box" style={{ marginTop: 'auto', pointerEvents: 'none', opacity: 0.7 }}>
              <div
                className="bot-input-field"
                style={{ padding: '10px', display: 'flex', alignItems: 'center', color: '#fff', fontSize: '0.9rem' }}
              >
                Open Rules Bot...
              </div>
              <button type="button" className="bot-send-btn" title="Open Bot">
                <Send size={15} />
              </button>
            </div>
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
