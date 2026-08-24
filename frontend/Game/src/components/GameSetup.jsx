import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { GAME_LIMITS } from '../data/cards';
import { soundFX } from '../utils/audio';
import { Swords, Plus, Trash2, ArrowLeft, RotateCw, Dices } from 'lucide-react';

const DEFAULT_PLAYERS = [
  { name: 'Kaito', characterId: 'chynaman' },
  { name: 'Haru', characterId: 'bee' },
  { name: 'Ren', characterId: 'katsumi' },
  { name: 'Mio', characterId: 'kiko' }
];

export default function GameSetup({ onStartGame, onBack }) {
  const [players, setPlayers] = useState(
    DEFAULT_PLAYERS.map(p => ({
      name: p.name,
      characterId: p.characterId,
      startingHP: 100,
      startingET: 5,
      startingCrystals: 1
    }))
  );

  const [startingHP, setStartingHP] = useState(100);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [targetCrystals, setTargetCrystals] = useState(1);
  const [turnDirection, setTurnDirection] = useState('clockwise');

  const charList = Object.values(CHARACTERS);

  const handleAddPlayer = () => {
    if (players.length >= GAME_LIMITS.MAX_PLAYERS) return;
    soundFX.playMenuHover();
    const usedCharIds = players.map(p => p.characterId);
    const availableChar = charList.find(c => !usedCharIds.includes(c.id)) || charList[0];

    setPlayers([
      ...players,
      {
        name: `Player ${players.length + 1}`,
        characterId: availableChar.id,
        startingHP: startingHP,
        startingET: 5,
        startingCrystals: targetCrystals
      }
    ]);
  };

  const handleRemovePlayer = (idx) => {
    if (players.length <= GAME_LIMITS.MIN_PLAYERS) return;
    soundFX.playMenuHover();
    const next = players.filter((_, i) => i !== idx);
    setPlayers(next);
    if (startingPlayerIndex >= next.length) {
      setStartingPlayerIndex(0);
    }
  };

  const handleUpdatePlayer = (idx, field, value) => {
    const next = [...players];
    next[idx] = { ...next[idx], [field]: value };
    setPlayers(next);
  };

  const handleAdjustHP = (delta) => {
    soundFX.playMenuHover();
    const nextHP = Math.max(10, startingHP + delta);
    setStartingHP(nextHP);
    setPlayers(players.map(p => ({ ...p, startingHP: nextHP })));
  };

  const handleStart = () => {
    soundFX.playGameStart();
    let ordered = [...players];
    if (startingPlayerIndex > 0) {
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

  return (
    <div className="img-setup-container">
      {/* Header matching Image 2 */}
      <div className="img-setup-header">
        <h1 className="img-setup-title">Game Setup</h1>
        <p className="img-setup-subtitle">✦ CONFIGURE YOUR DUEL. SET PLAYERS, TURN ORDER, AND STARTING SCORE.</p>
      </div>

      {/* 2-Column Setup Grid matching Image 2 */}
      <div className="img-setup-grid">
        {/* Left Column: Game Profile & Players */}
        <div className="img-setup-col-left">
          {/* Game Profile Box */}
          <div className="img-profile-card">
            <span className="img-profile-label">GAME PROFILE</span>
            <div className="img-profile-select-box">
              <div className="img-profile-avatar">🎴</div>
              <div className="img-profile-text">
                <strong>Attention TCG (Official Rules)</strong>
                <span>2-Dice Combat • 10 Action Cards Hand • Zombie Mode</span>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="img-players-section">
            <div className="img-players-hdr-row">
              <span className="img-p-title">PLAYERS ({players.length}/{GAME_LIMITS.MAX_PLAYERS})</span>
              <button
                className="img-btn-add-p"
                onClick={handleAddPlayer}
                disabled={players.length >= GAME_LIMITS.MAX_PLAYERS}
              >
                <Plus size={14} /> ADD PLAYER
              </button>
            </div>

            <div className="img-players-list">
              {players.map((p, idx) => {
                const char = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                return (
                  <div key={idx} className="img-player-item-row">
                    <span className={`img-p-order-pill ${idx === startingPlayerIndex ? 'start-1' : 'order-n'}`}>
                      {idx + 1}
                    </span>

                    <div className="img-p-avatar-circle" style={{ borderColor: char.themeColor }}>
                      <span>{char.avatar}</span>
                    </div>

                    <input
                      type="text"
                      className="img-p-name-input"
                      value={p.name}
                      onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                    />

                    <select
                      className="img-p-char-select"
                      value={p.characterId}
                      onChange={(e) => handleUpdatePlayer(idx, 'characterId', e.target.value)}
                    >
                      {charList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.avatar} {c.name}
                        </option>
                      ))}
                    </select>

                    {players.length > GAME_LIMITS.MIN_PLAYERS && (
                      <button
                        className="img-btn-del-p"
                        onClick={() => handleRemovePlayer(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="img-drag-hint">
              <span>ⓘ Click player node on right or enter starting player to adjust turn rotation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Starting Player, Orbit Preview, Starting Score */}
        <div className="img-setup-col-right">
          {/* Starting Player Dropdown */}
          <div className="img-start-player-box">
            <span className="img-setting-label">STARTING PLAYER</span>
            <select
              className="img-start-player-select"
              value={startingPlayerIndex}
              onChange={(e) => setStartingPlayerIndex(Number(e.target.value))}
            >
              {players.map((p, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}  {p.name} ({CHARACTERS[p.characterId]?.name})
                </option>
              ))}
            </select>
          </div>

          {/* Turn Order Orbit Preview matching Image 2 */}
          <div className="img-orbit-preview-card">
            <span className="img-orbit-title">TURN ORDER PREVIEW</span>
            <div className="img-orbit-diagram">
              {/* Top Node */}
              {players[0] && (
                <div 
                  className={`img-orbit-node node-top ${startingPlayerIndex === 0 ? 'node-active' : ''}`}
                  onClick={() => setStartingPlayerIndex(0)}
                >
                  <span className="node-num">1</span>
                  <div className="node-avatar-circle">{CHARACTERS[players[0].characterId]?.avatar}</div>
                  <span className="node-name">{players[0].name}</span>
                </div>
              )}

              {/* Right Node */}
              {players[1] && (
                <div 
                  className={`img-orbit-node node-right ${startingPlayerIndex === 1 ? 'node-active' : ''}`}
                  onClick={() => setStartingPlayerIndex(1)}
                >
                  <span className="node-num">2</span>
                  <div className="node-avatar-circle">{CHARACTERS[players[1].characterId]?.avatar}</div>
                  <span className="node-name">{players[1].name}</span>
                </div>
              )}

              {/* Bottom Node */}
              {players[2] && (
                <div 
                  className={`img-orbit-node node-bottom ${startingPlayerIndex === 2 ? 'node-active' : ''}`}
                  onClick={() => setStartingPlayerIndex(2)}
                >
                  <span className="node-num">3</span>
                  <div className="node-avatar-circle">{CHARACTERS[players[2].characterId]?.avatar}</div>
                  <span className="node-name">{players[2].name}</span>
                </div>
              )}

              {/* Left Node */}
              {players[3] && (
                <div 
                  className={`img-orbit-node node-left ${startingPlayerIndex === 3 ? 'node-active' : ''}`}
                  onClick={() => setStartingPlayerIndex(3)}
                >
                  <span className="node-num">4</span>
                  <div className="node-avatar-circle">{CHARACTERS[players[3].characterId]?.avatar}</div>
                  <span className="node-name">{players[3].name}</span>
                </div>
              )}

              {/* Center Clockwise Indicator */}
              <div className="img-orbit-center-arrow">
                <RotateCw size={28} className="spin-orbit" color="#38bdf8" />
                <span>CLOCKWISE</span>
              </div>
            </div>
          </div>

          {/* Starting Score (HP) Stepper */}
          <div className="img-starting-score-card">
            <span className="img-setting-label">STARTING SCORE / HEALTH (HP)</span>
            <div className="img-stepper-row">
              <button className="img-btn-step" onClick={() => handleAdjustHP(-10)}>-</button>
              <div className="img-score-display-box">{startingHP}</div>
              <button className="img-btn-step" onClick={() => handleAdjustHP(+10)}>+</button>
            </div>
            <div className="img-preset-pills">
              <button className={`preset-pill ${startingHP === 100 ? 'active' : ''}`} onClick={() => setStartingHP(100)}>100 HP</button>
              <button className={`preset-pill ${startingHP === 150 ? 'active' : ''}`} onClick={() => setStartingHP(150)}>150 HP (Lvl 2)</button>
              <button className={`preset-pill ${startingHP === 80 ? 'active' : ''}`} onClick={() => setStartingHP(80)}>80 HP (Fast)</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Action Bar matching Image 2 */}
      <div className="img-setup-bottom-bar">
        <button className="img-btn-back" onClick={onBack}>
          <ArrowLeft size={16} /> BACK
        </button>

        <button className="img-btn-start-match-capsule" onClick={handleStart}>
          <Swords size={22} />
          <span>START MATCH</span>
          <Swords size={22} />
        </button>

        <span className="img-version-pill">v1.0.0</span>
      </div>
    </div>
  );
}
