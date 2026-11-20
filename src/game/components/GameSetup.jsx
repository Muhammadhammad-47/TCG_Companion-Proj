import React, { useState, useEffect } from 'react';
import {
  Swords, Plus, Minus, ArrowLeft, RotateCw, RotateCcw,
  Crown, X, ChevronDown, ChevronUp, Users, Info, GripVertical, Edit2,
  Shield, Dices, Lock, Unlock, QrCode, Upload, Sparkles, Image
} from 'lucide-react';
import { APP_CONFIG } from '../../config';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import { authService } from '../../services/authService';
import { characterLicenseService, FREE_USAGE_LIMIT } from '../../services/characterLicenseService';
import CharacterUnlockModal from '../../components/CharacterUnlockModal';


export default function GameSetup({ onStartGame, onBack }) {
  const charKeys = ['chynaman', 'bee', 'katsumi', 'kiko'];
  const [currentUser, setCurrentUser] = useState(null);

  const [players, setPlayers] = useState(() =>
    charKeys.map((key, idx) => {
      const c = CHARACTERS[key] || CHARACTERS.chynaman;
      return {
        id: `p-${idx + 1}`,
        name: c.name,
        characterId: key,
        startingHP: c.baseHP || 100,
        startingET: 5,
        startingCrystals: 1
      };
    })
  );

  // Load authenticated user and patch Player 1's name and custom avatar from DB profile or localStorage
  useEffect(() => {
    const savedCustomAvatar = localStorage.getItem('tcg_custom_avatar_character');
    if (savedCustomAvatar) {
      setPlayers(prev => prev.map((p, idx) => (idx === 0 ? { ...p, customAvatar: savedCustomAvatar } : p)));
    }

    authService.getCurrentUser().then(async (user) => {
      if (!user) return;
      setCurrentUser(user);
      // Prefer DB profile username over auth metadata
      const profile = await authService.getProfile(user.id);
      const username =
        profile?.username ||
        user.user_metadata?.username ||
        user.email?.split('@')[0] ||
        null;
      const avatarId = profile?.avatar_id || profile?.avatar_url;
      const isCustomAvatar = avatarId && (avatarId.startsWith('data:') || avatarId.startsWith('http://') || avatarId.startsWith('https://') || avatarId.startsWith('blob:'));
      
      setPlayers(prev =>
        prev.map((p, idx) => (idx === 0 ? {
          ...p,
          name: username || p.name,
          customAvatar: savedCustomAvatar || (isCustomAvatar ? avatarId : p.customAvatar)
        } : p))
      );
    });
  }, []);

  // Handle uploading user's own Avatar character
  const handleUploadCustomAvatar = (e, playerIdx = 0) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Image file size must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const dim = 256;
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, dim, dim);
        const dataUrl = canvas.toDataURL('image/png', 0.92);

        soundFX.playCard();
        setPlayers(prev => {
          const next = [...prev];
          if (next[playerIdx]) {
            next[playerIdx] = { ...next[playerIdx], customAvatar: dataUrl };
          }
          return next;
        });

        // Save into local storage
        try {
          localStorage.setItem('tcg_custom_avatar_character', dataUrl);
          const customKey = `tcg_custom_avatars_${currentUser?.id || 'guest'}`;
          const currentList = JSON.parse(localStorage.getItem(customKey) || '[]');
          const updatedList = [dataUrl, ...currentList.filter(u => u !== dataUrl)].slice(0, 12);
          localStorage.setItem(customKey, JSON.stringify(updatedList));
          localStorage.setItem(`tcg_active_avatar_${currentUser?.id || 'guest'}`, dataUrl);
          window.dispatchEvent(new CustomEvent('tcg_avatar_updated', { detail: { avatar: dataUrl } }));
        } catch (err) {
          console.warn('LocalStorage save failed for custom avatar:', err);
        }

        if (currentUser?.id) {
          authService.updateProfile(currentUser.id, { avatar_id: dataUrl }).catch(() => {});
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Character Quotas & Licenses State
  const [licenses, setLicenses] = useState({});
  const [unlockModalChar, setUnlockModalChar] = useState(null);

  const refreshLicenses = async (uId) => {
    const lics = await characterLicenseService.getAllCharacterLicenses(uId);
    setLicenses(lics);
  };

  useEffect(() => {
    refreshLicenses(currentUser?.id);
    const unsub = characterLicenseService.subscribe(() => {
      refreshLicenses(currentUser?.id);
    });
    return () => unsub();
  }, [currentUser]);

  const [showConfig, setShowConfig] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    const newPlayers = [...players];
    const item = newPlayers.splice(draggedIdx, 1)[0];
    newPlayers.splice(targetIdx, 0, item);
    
    setPlayers(newPlayers);
    setDraggedIdx(null);
  };
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [firstPlayerRolls, setFirstPlayerRolls] = useState(null);
  const [isRollingFirst, setIsRollingFirst] = useState(false);
  const [tieAlert, setTieAlert] = useState(null);

  const handleRollForFirstPlayer = () => {
    soundFX.playDiceRoll();
    setIsRollingFirst(true);
    setTieAlert(null);
    
    const performRoll = () => {
      let rolls = {};
      let highestRoll = -1;
      let winnersAtHighest = [];
      
      players.forEach((p, idx) => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        rolls[idx] = { d1, d2, total };
        
        if (total > highestRoll) {
          highestRoll = total;
          winnersAtHighest = [idx];
        } else if (total === highestRoll) {
          winnersAtHighest.push(idx);
        }
      });
      
      setFirstPlayerRolls(rolls);
      
      // If there's a tie, re-roll only the tied players
      if (winnersAtHighest.length > 1) {
        const tiedPlayerNames = winnersAtHighest.map(i => `P${i + 1}`).join(' & ');
        setTieAlert(`TIE between ${tiedPlayerNames} (${highestRoll}) — Re-rolling tied players...`);
        console.log(`[DICE ROLL] TIE: Players ${winnersAtHighest.map(i => i + 1).join(', ')} all rolled ${highestRoll}. Re-rolling tied players...`);
        setTimeout(() => {
          performRoll(); // Recursive re-roll for tied players
        }, 1200);
      } else {
        // Single winner found
        setStartingPlayerIndex(winnersAtHighest[0]);
        setIsRollingFirst(false);
        setTieAlert(null);
      }
    };
    
    setTimeout(() => {
      performRoll();
    }, 800);
  };
  const [turnDirection, setTurnDirection] = useState('clockwise');
  const [selectedDeckProfile, setSelectedDeckProfile] = useState('Chynaman');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [startingLP, setStartingLP] = useState(() => {
    const firstChar = CHARACTERS[charKeys[0]] || CHARACTERS.chynaman;
    return firstChar.baseHP || 100;
  });

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
        startingHP: availableChar.baseHP || 100,
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
    const nextVal = Math.max(1, Math.min(9999, startingLP + delta));
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
  const hasPlayable = characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id);
  const isPrimaryLocked = (() => {
    const lic = licenses[primaryProfileChar.id] || characterLicenseService.getLicenseSync(currentUser?.id, primaryProfileChar.id);
    return !lic.canPlay;
  })();

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
            <span className="setup-sparkle-icon">?</span>
          </h1>
          <p className="setup-subtitle-bar">
            <span className="sparkle-cyan">?</span>
            <span>CONFIGURE YOUR DUEL. SET PLAYERS, TURN ORDER, AND STARTING SCORE.</span>
          </p>
        </header>

        {/* 2-Column Main Setup Content */}
        <div className="setup-columns-grid">
          {/* Left Column: Game Profile & Players List */}
          <div className="setup-col-left">
            {/* Game Profile Section */}
            <div className="setup-profile-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="setup-section-label" style={{ margin: 0 }}>GAME PROFILE</span>
                <label
                  style={{
                    background: 'linear-gradient(135deg, #FBC80D 0%, #ff8800 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '0.6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(251, 200, 13, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  title="Upload your own avatar character image from your device"
                >
                  <Upload size={13} />
                  <span>UPLOAD OWN AVATAR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadCustomAvatar(e, 0)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div
                className="profile-selector-card"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="profile-avatar-holder" style={{ position: 'relative' }}>
                  <div className="profile-crown-mini">
                    <Crown size={14} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                  </div>
                  <img
                    src={players[0]?.customAvatar || getAssetUrl(primaryProfileChar.image)}
                    alt={primaryProfileChar.name}
                    className="profile-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="profile-emoji-fallback">{primaryProfileChar.avatar}</span>
                  {/* Level Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    color: '#000',
                    border: '1.5px solid rgba(0,0,0,0.8)',
                    boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)',
                    zIndex: 10
                  }}>
                    {players[0]?.level || 1}
                  </div>
                </div>

                <div className="profile-info-text">
                  <strong className="profile-deck-title">{primaryProfileChar.deckName || `${primaryProfileChar.name}'s Deck`}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span className="profile-format-tag">{primaryProfileChar.deckFormat || 'Standard Format'}</span>
                    {(() => {
                      const lic = licenses[primaryProfileChar.id] || characterLicenseService.getLicenseSync(currentUser?.id, primaryProfileChar.id);
                      if (lic.isUnlocked) {
                        return (
                          <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.25)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.45)', fontWeight: 'bold' }}>
                            👑 UNLIMITED
                          </span>
                        );
                      }
                      return (
                        <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.4)', fontWeight: 'bold' }}>
                          🎴 10 Moves / Match
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <ChevronDown size={18} className="profile-chevron" />
              </div>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  {availableChars.map(c => {
                    const lic = licenses[c.id] || characterLicenseService.getLicenseSync(currentUser?.id, c.id);

                    return (
                      <div
                        key={c.id}
                        className="profile-option-row"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onClick={() => {
                          const next = [...players];
                          if (next[0]) next[0].characterId = c.id;
                          setPlayers(next);
                          setIsProfileDropdownOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="opt-emoji">{c.avatar}</span>
                          <span className="opt-name">{c.name}'s Deck</span>
                        </div>
                        {lic.isUnlocked ? (
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 'bold' }}>
                            👑 FULL DECK
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', fontWeight: 'bold' }}>
                            🎴 10 Moves
                          </span>
                        )}
                      </div>
                    );
                  })}
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
                    <div 
                      key={p.id} 
                      className={`setup-player-row ${isFirst ? 'first-player-row' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{ cursor: 'grab', opacity: draggedIdx === idx ? 0.5 : 1 }}
                    >
                      <div className={`player-num-pill pill-${idx + 1}`}>
                        {idx + 1}
                      </div>

                      <label
                        className="player-row-avatar"
                        style={{ borderColor: c.themeColor, position: 'relative', cursor: 'pointer' }}
                        title="Click to upload custom avatar character"
                      >
                        <img
                          src={p.customAvatar || getAssetUrl(c.image)}
                          alt={p.name || c.name}
                          className="player-avatar-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="avatar-emoji-fallback">{c.avatar}</span>
                        {/* Level Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          fontWeight: 'bold',
                          color: '#000',
                          border: '1.5px solid rgba(0,0,0,0.8)',
                          boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                          zIndex: 10
                        }}>
                          {p.level || 1}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadCustomAvatar(e, idx)}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <div className="player-name-display" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingRight: '12px' }}>
                        <Edit2 size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            const next = [...players];
                            next[idx].name = newName;
                            setPlayers(next);
                            // Names are now only stored in-memory for this game session
                            // Player profiles are DB-first on authentication
                          }}
                          className="player-name-text"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            fontSize: 'inherit',
                            fontFamily: 'inherit',
                            width: '100%',
                            outline: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.2)'
                          }}
                          title="Click to edit name (in-game only)"
                        />
                      </div>

                      {/* Drag Handle Icon */}
                      <div style={{ padding: '0 8px', color: 'rgba(255,255,255,0.3)', cursor: 'grab' }} title="Drag to reorder">
                        <GripVertical size={16} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="setup-section-label" style={{ margin: 0 }}>STARTING PLAYER</span>
                <button
                  onClick={handleRollForFirstPlayer}
                  disabled={isRollingFirst}
                  style={{
                    background: isRollingFirst ? 'rgba(251, 200, 13, 0.3)' : 'rgba(251, 200, 13, 0.15)',
                    border: '1.5px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isRollingFirst ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 10px rgba(251, 200, 13, 0.2)'
                  }}
                  title="Roll 2 dice for each player to decide who goes first per official rules"
                >
                  <Dices size={14} className={isRollingFirst ? 'animate-spin' : ''} />
                  <span>{isRollingFirst ? 'ROLLING 2 DICE...' : 'ROLL 2 DICE TO DECIDE'}</span>
                </button>
              </div>

              {firstPlayerRolls && (
                <div style={{ background: 'rgba(251, 200, 13, 0.08)', border: '1px solid rgba(251, 200, 13, 0.3)', borderRadius: '8px', padding: '6px 10px', marginBottom: '10px', fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {tieAlert ? (
                    <span style={{ color: 'var(--neon-gold)', fontWeight: 'bold' }}>⚠️ {tieAlert}</span>
                  ) : (
                    <>
                      <span style={{ color: 'var(--neon-gold)', fontWeight: 'bold' }}>?? Dice Roll-Off:</span>
                      {players.map((p, i) => (
                        <span key={i} style={{ color: i === startingPlayerIndex ? '#39ff14' : 'rgba(255,255,255,0.7)', fontWeight: i === startingPlayerIndex ? 'bold' : 'normal' }}>
                          P{i + 1} ({firstPlayerRolls[i]?.d1}+{firstPlayerRolls[i]?.d2}={firstPlayerRolls[i]?.total}) {i === startingPlayerIndex ? '?? Winner!' : ''}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              )}

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
                            alignItems: 'center',
                            width: '80px'
                          }}
                        >
                          <div style={{ position: 'relative' }}>
                            <div className={`orbit-node-pill pill-${i + 1}`} style={{ position: 'absolute', top: '-6px', left: '-6px', zIndex: 10 }}>{i + 1}</div>
                            <div className="orbit-avatar-ring ring-blue" style={{ borderColor: c.themeColor, overflow: 'visible', width: '40px', height: '40px', borderRadius: '50%', background: '#071226', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              <img
                                src={p.customAvatar || getAssetUrl(c.image || 'characters/chynaman.png')}
                                alt={`P${i+1}`}
                                className="orbit-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
                              {/* Level Badge */}
                              <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.55rem',
                                fontWeight: 'bold',
                                color: '#000',
                                border: '1.5px solid rgba(0,0,0,0.8)',
                                boxShadow: '0 0 8px rgba(255, 215, 0, 0.7)',
                                zIndex: 15
                              }}>
                                {p.level || 1}
                              </div>
                            </div>
                          </div>
                          <span className="orbit-label" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', marginTop: '4px', textShadow: '0 2px 4px #000', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    onClick={() => handleAdjustLP(-5)}
                    disabled={startingLP <= 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(251, 200, 13, 0.12)',
                      border: '1.5px solid rgba(251, 200, 13, 0.4)',
                      color: '#FBC80D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: startingLP <= 1 ? 'not-allowed' : 'pointer',
                      opacity: startingLP <= 1 ? 0.4 : 1,
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
                      border: '1.5px solid rgba(251, 200, 13, 0.3)',
                      borderRadius: '10px',
                      padding: '6px 20px',
                      minWidth: '130px',
                      justifyContent: 'center'
                    }}
                  >
                    <input
                      type="number"
                      className="score-main-digits"
                      value={startingLP}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setStartingLP(val);
                        setPlayers(players.map(p => ({ ...p, startingHP: val })));
                      }}
                      style={{ 
                        fontSize: '1.6rem', 
                        fontWeight: '900', 
                        color: '#ffffff', 
                        fontFamily: 'Orbitron, sans-serif',
                        background: 'transparent',
                        border: 'none',
                        width: '80px',
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <span className="score-unit" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--neon-crimson)' }}>
                      HP
                    </span>
                  </div>

                  <button
                    className="btn-score-adjust"
                    onClick={() => handleAdjustLP(5)}
                    disabled={startingLP >= 9999}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(251, 200, 13, 0.12)',
                      border: '1.5px solid rgba(251, 200, 13, 0.4)',
                      color: '#FBC80D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: startingLP >= 9999 ? 'not-allowed' : 'pointer',
                      opacity: startingLP >= 9999 ? 0.4 : 1,
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
                          background: startingLP === preset.val ? 'rgba(251, 200, 13, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: startingLP === preset.val ? '1.5px solid #FBC80D' : '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: startingLP === preset.val ? '#FBC80D' : '#CBD5E1',
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

                <div className="score-hint-text" style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '2px' }}>
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

          <button
            className="btn-setup-start-cta"
            onClick={handleStart}
            style={{
              opacity: (!hasPlayable || isPrimaryLocked) ? 0.7 : 1,
              filter: (!hasPlayable || isPrimaryLocked) ? 'grayscale(0.35)' : 'none'
            }}
          >
            {(!hasPlayable || isPrimaryLocked) ? <Lock size={22} color="#f87171" /> : <Swords size={26} />}
            <span className="start-cta-text">
              {!hasPlayable ? 'QUOTA EXHAUSTED - UNLOCK TO PLAY' : isPrimaryLocked ? 'CHARACTER LOCKED - UNLOCK' : 'START MATCH'}
            </span>
            {(!hasPlayable || isPrimaryLocked) ? <Lock size={22} color="#f87171" /> : <Swords size={26} />}
          </button>

          <div className="setup-version-label">{APP_CONFIG.version}</div>
        </div>
      </div>
      
      {/* Character Unlock Modal (Store buy, QR scan, Admin grant) */}
      <CharacterUnlockModal
        isOpen={Boolean(unlockModalChar)}
        onClose={() => setUnlockModalChar(null)}
        characterId={unlockModalChar}
        userId={currentUser?.id}
        userProfile={currentUser}
        onUnlockSuccess={() => {
          refreshLicenses(currentUser?.id);
        }}
      />
    </div>
  );
}



