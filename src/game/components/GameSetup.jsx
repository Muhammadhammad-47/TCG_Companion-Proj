import React, { useState } from 'react';
import {
  Swords, Plus, ArrowLeft, RotateCw, RotateCcw,
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
        startingHP: 8000,
        startingET: 5,
        startingCrystals: 1
      };
    })
  );

  const [startingLP, setStartingLP] = useState(8000);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState('clockwise');
  const [selectedDeckProfile, setSelectedDeckProfile] = useState('Chynaman');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const availableChars = Object.values(CHARACTERS);

  const handleAddPlayer = () => {
    if (players.length >= 8) return;
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
    const nextVal = Math.max(1000, Math.min(99999, startingLP + delta));
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
            <div className="setup-box-block turn-preview-block">
              <span className="setup-section-label">TURN ORDER PREVIEW</span>

                <div className="turn-preview-stage">
                  <div className="turn-orbit-ring" style={{ position: 'relative' }}>
                    {players.map((p, i) => {
                      // Dynamically position players in a circle
                      const angleDeg = (360 / players.length) * i - 90; // Start at top (-90)
                      const radius = 80; // Distance from center
                      const x = Math.cos(angleDeg * (Math.PI / 180)) * radius;
                      const y = Math.sin(angleDeg * (Math.PI / 180)) * radius;
                      
                      return (
                        <div 
                          key={p.id} 
                          className="orbit-node" 
                          style={{ 
                            position: 'absolute', 
                            left: '50%', 
                            top: '50%', 
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                          }}
                        >
                          <div className={`orbit-node-pill pill-${i + 1}`}>{i + 1}</div>
                          <div className="orbit-avatar-ring ring-blue">
                            <img
                              src={getAssetUrl(CHARACTERS[p.characterId]?.image)}
                              alt={`P${i+1}`}
                              className="orbit-img"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="orbit-emoji">{CHARACTERS[p.characterId]?.avatar}</span>
                          </div>
                          <span className="orbit-label" style={{ position: 'absolute', top: '100%', whiteSpace: 'nowrap', left: '50%', transform: 'translateX(-50%)' }}>
                            {p.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Center Direction Indicator */}
                    <div className="orbit-center-indicator" onClick={handleToggleTurnDirection} title="Click to reverse direction" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                      <RotateCw size={24} className={`orbit-arrow-spin ${turnDirection === 'counter-clockwise' ? 'reverse-spin' : ''}`} />
                      <span className="orbit-direction-text">
                        {turnDirection.toUpperCase()}
                      </span>
                    </div>

                    {/* SVG Circle background instead of hardcoded arcs */}
                    <svg className="orbit-curved-arrows" viewBox="0 0 200 200" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--neon-cyan)" strokeWidth="2.5" strokeDasharray="4 8" opacity="0.5" />
                    </svg>
                  </div>
                </div>
            </div>

            {/* Starting Score (LP) */}
            <div className="setup-box-block">
              <span className="setup-section-label">STARTING SCORE (LP)</span>
              <div className="starting-score-stepper-row">
                <div className="score-stepper-controls">
                  <button className="btn-stepper-step" onClick={() => handleAdjustLP(-1000)}>
                    –
                  </button>
                  <div className="score-display-box">
                    <span className="score-main-digits">{startingLP}</span>
                  </div>
                  <button className="btn-stepper-step" onClick={() => handleAdjustLP(1000)}>
                    +
                  </button>
                </div>

                <div className="score-range-note">
                  <span>Common starting LP range is 1000 – 99999.</span>
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
