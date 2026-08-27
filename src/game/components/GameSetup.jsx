import React, { useState } from 'react';
import {
  Swords, Plus, Minus, ArrowLeft, RotateCw, RotateCcw,
  Crown, X, ChevronDown, ChevronUp, Users, Info
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';


export default function GameSetup({ onStartGame, onBack }) {
  const charKeys = ['chynaman', 'bee', 'katsumi', 'kiko'];
  
  const [players, setPlayers] = useState(
    charKeys.map((key, idx) => {
      const c = CHARACTERS[key] || CHARACTERS.chynaman;
      return {
        id: `p-${idx + 1}`,
        name: c.name,
        characterId: key,
        startingHP: 100,
        startingET: 5,
        startingCrystals: 1
      };
    })
  );

  const [startingLP, setStartingLP] = useState(100);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState('clockwise');
  const [selectedDeckProfile, setSelectedDeckProfile] = useState('Chynaman');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const availableChars = Object.values(CHARACTERS);

  const handleAddPlayer = () => {
    if (players.length >= 6) return;
    soundFX.playMenuHover();
    const usedCharIds = players.map(p => p.characterId);
    const availableChar = availableChars.find(c => !usedCharIds.includes(c.id)) || availableChars[0];

    setPlayers([
      ...players,
      {
        id: `p-${Date.now()}`,
        name: availableChar.name,
        characterId: availableChar.id,
        startingHP: startingLP,
        startingET: 5,
        startingCrystals: 1
      }
    ]);
  };

  const handleRemovePlayer = (idx) => {
    if (players.length <= 2) return;
    soundFX.playMenuHover();
    const next = players.filter((_, i) => i !== idx);
    setPlayers(next);
    if (startingPlayerIndex >= next.length) {
      setStartingPlayerIndex(0);
    }
  };

  const handleMovePlayer = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= players.length) return;
    soundFX.playMenuHover();
    const next = [...players];
    const item = next.splice(fromIdx, 1)[0];
    next.splice(toIdx, 0, item);
    setPlayers(next);
  };

  const handleAdjustLP = (delta) => {
    soundFX.playMenuHover();
    const nextVal = Math.max(50, Math.min(200, startingLP + delta));
    setStartingLP(nextVal);
    setPlayers(players.map(p => ({ ...p, startingHP: nextVal })));
  };

  const handleToggleTurnDirection = () => {
    soundFX.playMenuHover();
    setTurnDirection(prev => (prev === 'clockwise' ? 'counter-clockwise' : 'clockwise'));
  };

  const handleStart = () => {
    soundFX.playGameStart();
    let ordered = [...players];
    if (startingPlayerIndex > 0 && startingPlayerIndex < ordered.length) {
      ordered = [
        ...ordered.slice(startingPlayerIndex),
        ...ordered.slice(0, startingPlayerIndex)
      ];
    }
    onStartGame({
      players: ordered,
      direction: turnDirection,
      turnTimerDuration: 60
    });
  };

  const primaryProfileChar = CHARACTERS[players[0]?.characterId] || CHARACTERS.chynaman;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
      <div className="webgl-screen setup-screen">
        {/* Background diagonal neon streaks */}
        <div className="setup-bg-elements">
          <div className="setup-neon-red"></div>
          <div className="setup-neon-blue"></div>
        </div>

        {/* Top Header */}
        <header className="setup-top-header">
          <h1 className="setup-main-title">
            <span>Game Setup</span>
            <span className="setup-sparkle-icon">✦</span>
          </h1>
          <p className="setup-subtitle-bar">
            <span className="sparkle-cyan">✦</span>
            <span>CONFIGURE YOUR DUEL. SET PLAYERS, TURN ORDER, AND STARTING SCORE.</span>
          </p>
        </header>

        {/* 2-Column Main Setup Content */}
        <div className="setup-columns-grid">
          {/* Left Column: Game Profile & Players List */}
          <div className="setup-col-left">
            {/* Game Profile Section */}
            <div className="setup-profile-box">
              <span className="setup-section-label">GAME PROFILE</span>
              <div
                className="profile-selector-card"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="profile-avatar-holder">
                  <div className="profile-crown-mini">
                    <Crown size={14} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                  </div>
                  <img
                    src={getAssetUrl(primaryProfileChar.image)}
                    alt={primaryProfileChar.name}
                    className="profile-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="profile-emoji-fallback">{primaryProfileChar.avatar}</span>
                </div>

                <div className="profile-info-text">
                  <strong className="profile-deck-title">{primaryProfileChar.deckName || `${primaryProfileChar.name}'s Deck`}</strong>
                  <span className="profile-format-tag">{primaryProfileChar.deckFormat || 'Standard Format'}</span>
                </div>

                <ChevronDown size={18} className="profile-chevron" />
              </div>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  {availableChars.map(c => (
                    <div
                      key={c.id}
                      className="profile-option-row"
                      onClick={() => {
                        const next = [...players];
                        if (next[0]) next[0].characterId = c.id;
                        setPlayers(next);
                        setIsProfileDropdownOpen(false);
                      }}
                    >
                      <span className="opt-emoji">{c.avatar}</span>
                      <span className="opt-name">{c.name}'s Deck</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Players Roster Section */}
            <div className="setup-players-section">
              <div className="players-header-row">
                <span className="setup-section-label">PLAYERS ({players.length}/{availableChars.length})</span>
                <button
                  className="btn-add-player-outline"
                  onClick={handleAddPlayer}
                  disabled={players.length >= availableChars.length}
                >
                  <Plus size={14} />
                  <span>ADD PLAYER</span>
                </button>
              </div>

              <div className="setup-player-list">
                {players.map((p, idx) => {
                  const c = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                  const isFirst = idx === 0;
                  return (
                    <div key={p.id} className={`setup-player-row ${isFirst ? 'first-player-row' : ''}`}>
                      <div className={`player-num-pill pill-${idx + 1}`}>
                        {idx + 1}
                      </div>

                      <div className="player-row-avatar" style={{ borderColor: c.themeColor }}>
                        <img
                          src={getAssetUrl(c.image)}
                          alt={c.name}
                          className="player-avatar-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="avatar-emoji-fallback">{c.avatar}</span>
                      </div>

                      <div className="player-name-display">
                        <span className="player-name-text">{p.name || c.name}</span>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="player-reorder-controls">
                        {idx > 0 && (
                          <button
                            className="btn-reorder-arrow"
                            onClick={() => handleMovePlayer(idx, idx - 1)}
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                        )}
                        {idx < players.length - 1 && (
                          <button
                            className="btn-reorder-arrow"
                            onClick={() => handleMovePlayer(idx, idx + 1)}
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        )}
                      </div>

                      {players.length > 2 && (
                        <button
                          className="btn-remove-player"
                          onClick={() => handleRemovePlayer(idx)}
                          title="Remove Player"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="reorder-info-hint">
                <Info size={13} color="var(--neon-cyan)" />
                <span>Drag or use arrows to reorder players</span>
              </div>
            </div>
          </div>

          {/* Right Column: Starting Player, Turn Order Preview, Starting Score */}
          <div className="setup-col-right">
            {/* Starting Player Selector */}
            <div className="setup-box-block">
              <span className="setup-section-label">STARTING PLAYER</span>
              <div className="starting-player-dropdown-box">
                <div className="starting-player-selected">
                  <div className={`player-num-pill pill-${startingPlayerIndex + 1}`}>
                    {startingPlayerIndex + 1}
                  </div>
                  <span className="starting-name">
                    {players[startingPlayerIndex]?.name || 'Player 1'}
                  </span>
                </div>
                <div className="starting-quick-select-row">
                  {players.map((_, i) => (
                    <button
                      key={i}
                      className={`btn-start-choice ${i === startingPlayerIndex ? 'active-start-choice' : ''}`}
                      onClick={() => setStartingPlayerIndex(i)}
                    >
                      P{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Turn Order Preview Circle */}
            <div className="setup-box-block turn-preview-block" style={{ minHeight: '300px' }}>
              <span className="setup-section-label">TURN ORDER PREVIEW</span>

                <div className="turn-preview-stage">
                  <div className="turn-orbit-ring" style={{ position: 'relative', width: '220px', height: '220px' }}>
                    {players.map((p, i) => {
                      // Dynamically position players in a circle
                      const angleDeg = (360 / players.length) * i - 90; // Start at top (-90)
                      const radius = 82; // Distance from center
                      const x = Math.cos(angleDeg * (Math.PI / 180)) * radius;
                      const y = Math.sin(angleDeg * (Math.PI / 180)) * radius;
                      const c = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                      
                      return (
                        <div 
                          key={p.id} 
                          className="orbit-node" 
                          style={{ 
                            position: 'absolute', 
                            left: '50%', 
                            top: '50%', 
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}
                        >
                          <div className={`orbit-node-pill pill-${i + 1}`}>{i + 1}</div>
                          <div className="orbit-avatar-ring ring-blue" style={{ borderColor: c.themeColor, overflow: 'hidden', width: '40px', height: '40px', borderRadius: '50%', background: '#071226', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={getAssetUrl(c.image || 'characters/chynaman.png')}
                              alt={`P${i+1}`}
                              className="orbit-img"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <span className="orbit-label" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', marginTop: '2px', textShadow: '0 2px 4px #000' }}>
                            {p.name || c.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Center Direction Indicator */}
                    <div className="orbit-center-indicator" onClick={handleToggleTurnDirection} title="Click to reverse direction" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, cursor: 'pointer' }}>
                      <RotateCw size={22} className={`orbit-arrow-spin ${turnDirection === 'counter-clockwise' ? 'reverse-spin' : ''}`} />
                      <span className="orbit-direction-text" style={{ fontSize: '0.65rem' }}>
                        {turnDirection.toUpperCase()}
                      </span>
                    </div>

                    {/* SVG Circle background */}
                    <svg className="orbit-curved-arrows" viewBox="0 0 220 220" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <circle cx="110" cy="110" r="82" fill="none" stroke="var(--neon-cyan)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" />
                    </svg>
                  </div>
                </div>
            </div>

            {/* Starting Score (HP) */}
            <div className="setup-box-block">
              <span className="setup-section-label">STARTING SCORE (HP)</span>
              <div className="score-adjuster-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <div className="score-stepper-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    className="btn-score-adjust"
                    onClick={() => handleAdjustLP(-10)}
                    disabled={startingLP <= 50}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(0, 240, 255, 0.12)',
                      border: '1.5px solid rgba(0, 240, 255, 0.4)',
                      color: '#00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: startingLP <= 50 ? 'not-allowed' : 'pointer',
                      opacity: startingLP <= 50 ? 0.4 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Minus size={18} />
                  </button>

                  <div
                    className="score-display-field"
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px',
                      background: 'rgba(6, 14, 32, 0.85)',
                      border: '1.5px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '6px 20px',
                      minWidth: '130px',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="score-main-digits" style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', fontFamily: 'Orbitron, sans-serif' }}>
                      {startingLP}
                    </span>
                    <span className="score-unit" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--neon-crimson)' }}>
                      HP
                    </span>
                  </div>

                  <button
                    className="btn-score-adjust"
                    onClick={() => handleAdjustLP(10)}
                    disabled={startingLP >= 200}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(0, 240, 255, 0.12)',
                      border: '1.5px solid rgba(0, 240, 255, 0.4)',
                      color: '#00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: startingLP >= 200 ? 'not-allowed' : 'pointer',
                      opacity: startingLP >= 200 ? 0.4 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={18} />
                  </button>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                    {[
                      { label: '100 HP (Official)', val: 100 },
                      { label: '150 HP (Lvl 2)', val: 150 },
                      { label: '200 HP (Max)', val: 200 }
                    ].map(preset => (
                      <button
                        key={preset.val}
                        onClick={() => setStartingLP(preset.val)}
                        style={{
                          background: startingLP === preset.val ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: startingLP === preset.val ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: startingLP === preset.val ? '#00f0ff' : '#94a3b8',
                          fontSize: '0.74rem',
                          fontWeight: startingLP === preset.val ? 'bold' : 'normal',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="score-hint-text" style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  Official base HP is 100 (Max 200 HP). Level 2 unlocks at 150+ HP.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Setup Navigation Bar */}
        <div className="setup-bottom-bar">
          <button className="btn-setup-back" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>BACK</span>
          </button>

          <button className="btn-setup-start-cta" onClick={handleStart}>
            <Swords size={26} />
            <span className="start-cta-text">START MATCH</span>
            <Swords size={26} />
          </button>

          <div className="setup-version-label">v1.0.0</div>
        </div>
      </div>
      
    </div>
  );
}
