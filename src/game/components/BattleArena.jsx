import React, { useState, useEffect } from 'react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { ACTION_CARDS } from '../data/cards';
import { soundFX } from '../utils/audio';
import WinnerModal from './WinnerModal';

import {
  Swords, Undo2, Menu, Shield, Skull, Zap, Gem,
  Clock, Play, Heart, Trophy, Crown, Dices,
  MessageSquare, Eye, Layers, ScrollText, FlaskConical,
  Maximize2, Minimize2, Sparkles, ChevronRight, Activity,
  X, Send, CheckCircle2, Flame, RefreshCw
} from 'lucide-react';

export default function BattleArena({
  gameState,
  setGameState,
  historyStack,
  setHistoryStack,
  tvMode,
  setTvMode,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  setIsMuted,
  onRematch,
  onOpenNewMatch,
  onOpenRules,
  onGoToMenu
}) {
  const [showCardZoneModal, setShowCardZoneModal] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showInGameMenu, setShowInGameMenu] = useState(false);
  const [combatDiceModal, setCombatDiceModal] = useState(null); // { attacker, defender, move, redDice, goldDice, netDamage, ... }
  const [floatingDamage, setFloatingDamage] = useState(null); // { targetId, text, type: 'damage' | 'heal' | 'shield' }
  const [turnAnnouncement, setTurnAnnouncement] = useState(null); // { turn: number, player: string }
  const [isShaking, setIsShaking] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { sender: 'Haru', text: 'Good luck duelists!', time: '10:20 AM' },
    { sender: 'Kaito', text: 'Activating Shadow Strike this round.', time: '10:24 AM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [matchLogs, setMatchLogs] = useState([
    { turn: 7, actor: 'Chynaman', action: 'Activated Shadow Strike', type: 'special', icon: 'sparkle' },
    { turn: 7, actor: 'Chynaman', action: 'Applied Poison to Bee', type: 'poison', icon: 'skull' },
    { turn: 6, actor: 'Bee', action: 'Played Azure Guard', type: 'defense', icon: 'shield' },
    { turn: 6, actor: 'Bee', action: 'Gained 300 Shield', type: 'shield', icon: 'shield', amount: '+300' },
    { turn: 5, actor: 'Katsumi', action: 'Attacked Chynaman', type: 'attack', icon: 'sword', amount: '-500' }
  ]);

  const [turnActionPreview, setTurnActionPreview] = useState({
    actor: 'Chynaman',
    ability: 'Shadow Strike',
    target: 'Bee',
    desc: 'Deals 500 damage and applies Poison.',
    result: '💀 1 → 2'
  });

  const [selectedEffectInfo, setSelectedEffectInfo] = useState(null);
  const [cardCategoryFilter, setCardCategoryFilter] = useState('ALL');

  const players = gameState?.players || [];
  const activeIdx = gameState?.activePlayerIndex || 0;
  const activePlayer = players[activeIdx] || players[0];
  const activeChar = CHARACTERS[activePlayer?.characterId] || CHARACTERS.chynaman;
  const turnNum = gameState?.turnNumber || 1;
  const maxTurns = 20;

  // Find target player (next active in clockwise order)
  const targetIdx = (activeIdx + 1) % players.length;
  const targetPlayer = players[targetIdx] || players[0];
  const targetChar = CHARACTERS[targetPlayer?.characterId] || CHARACTERS.bee;

  const pushStateSnapshot = () => {
    setHistoryStack(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
  };

  const handleUndo = () => {
    if (!historyStack.length) return;
    soundFX.playMenuHover();
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(historyStack.slice(0, -1));
    setGameState(previous);
  };

  // Play Action / Spell / Attack
  const handleExecuteAttack = (cardName = 'Shadow Strike', baseDmg = 500, applyPoison = true, applyShield = 0) => {
    pushStateSnapshot();
    soundFX.playAttack();

    // Roll 2 Red dice vs 2 Gold dice
    const red1 = Math.floor(Math.random() * 6) + 1;
    const red2 = Math.floor(Math.random() * 6) + 1;
    const gold1 = Math.floor(Math.random() * 6) + 1;
    const gold2 = Math.floor(Math.random() * 6) + 1;

    const redTotal = red1 + red2;
    const goldTotal = gold1 + gold2;

    // Defense 6+ Rule: if gold >= 6, DP triggers (-15% or -200 dmg)
    const dpTriggered = goldTotal >= 6;
    const dpReduction = dpTriggered ? (targetChar.defaultDP ? targetChar.defaultDP * 20 : 200) : 0;
    
    // Shield absorption
    let currentShield = targetPlayer.shield || (targetChar.status?.shield || 0);
    let netDmg = Math.max(0, baseDmg - dpReduction);
    
    if (currentShield > 0) {
      if (currentShield >= netDmg) {
        currentShield -= netDmg;
        netDmg = 0;
      } else {
        netDmg -= currentShield;
        currentShield = 0;
      }
    }

    const nextHP = Math.max(0, targetPlayer.hp - netDmg);

    // Show floating damage and screen shake
    if (netDmg > 0) {
      setFloatingDamage({ targetId: targetPlayer.id, text: `-${netDmg} LP`, type: 'damage' });
      setIsShaking(true);
      setTimeout(() => {
        setFloatingDamage(null);
        setIsShaking(false);
      }, 1400);
    }

    // Update player stats
    const updatedPlayers = players.map((p, i) => {
      if (i === targetIdx) {
        return {
          ...p,
          hp: nextHP,
          shield: currentShield,
          poison: applyPoison ? (p.poison || 0) + 1 : (p.poison || 0)
        };
      }
      if (i === activeIdx && applyShield > 0) {
        return {
          ...p,
          shield: (p.shield || 0) + applyShield
        };
      }
      return p;
    });

    // Check winner
    const alive = updatedPlayers.filter(p => p.hp > 0);
    let winner = null;
    if (alive.length === 1 && players.length > 1) {
      winner = alive[0];
    }

    // Set dice modal
    setCombatDiceModal({
      actor: activePlayer.name,
      target: targetPlayer.name,
      cardName,
      redDice: [red1, red2],
      goldDice: [gold1, gold2],
      dpTriggered,
      dpReduction,
      damageDealt: netDmg,
      appliedPoison: applyPoison,
      appliedShield: applyShield
    });

    // Logs
    const log1 = {
      turn: turnNum,
      actor: activePlayer.name,
      action: `Used ${cardName} on ${targetPlayer.name}`,
      type: 'attack',
      icon: 'sword',
      amount: `-${netDmg}`
    };

    setMatchLogs([log1, ...matchLogs]);
    setTurnActionPreview({
      actor: activePlayer.name,
      ability: cardName,
      target: targetPlayer.name,
      desc: `Dealt ${netDmg} damage (Blocked ${dpReduction} via DP).`,
      result: `HP: ${targetPlayer.hp} → ${nextHP}`
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      winner: winner || gameState.winner
    });
  };

  const handleEndTurn = () => {
    soundFX.playMenuHover();
    pushStateSnapshot();

    const nextActiveIdx = (activeIdx + 1) % players.length;
    const nextTurnNum = nextActiveIdx === 0 ? turnNum + 1 : turnNum;

    // Poison tick on the incoming player
    const incomingPlayer = players[nextActiveIdx];
    let poisonDmg = (incomingPlayer.poison || (CHARACTERS[incomingPlayer.characterId]?.status?.poison || 0)) * 250;
    
    let updatedPlayers = [...players];
    if (poisonDmg > 0) {
      soundFX.playDamage();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      updatedPlayers = updatedPlayers.map((p, i) => {
        if (i === nextActiveIdx) {
          const nextHP = Math.max(0, p.hp - poisonDmg);
          return { ...p, hp: nextHP };
        }
        return p;
      });
    }

    // Check game over
    const alivePlayers = updatedPlayers.filter(p => p.hp > 0);
    let winner = null;
    if (alivePlayers.length === 1 && players.length > 1) {
      winner = alivePlayers[0];
    } else if (nextTurnNum > maxTurns) {
      const sorted = [...updatedPlayers].sort((a, b) => b.hp - a.hp);
      winner = sorted[0];
    }

    const nextPlayerObj = updatedPlayers[nextActiveIdx];
    const newLog = {
      turn: nextTurnNum,
      actor: nextPlayerObj.name,
      action: `Turn started (Poison tick: -${poisonDmg} LP)`,
      type: 'turn',
      icon: 'clock'
    };

    setMatchLogs([newLog, ...matchLogs]);
    setTurnActionPreview({
      actor: nextPlayerObj.name,
      ability: CHARACTERS[nextPlayerObj.characterId]?.signatureMove || 'Turn Phase',
      target: players[(nextActiveIdx + 1) % players.length]?.name || 'Opponent',
      desc: `Draw Phase completed. Ready for action!`,
      result: `TURN ${nextTurnNum}`
    });

    setGameState({
      ...gameState,
      turnNumber: nextTurnNum,
      activePlayerIndex: nextActiveIdx,
      players: updatedPlayers,
      winner: winner || gameState.winner
    });

    setTurnAnnouncement({ turn: nextTurnNum, player: nextPlayerObj.name });
    setTimeout(() => setTurnAnnouncement(null), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundFX.playCard();
    setChatMessages(prev => [
      ...prev,
      { sender: activePlayer.name, text: chatInput, time: 'Just now' }
    ]);
    setChatInput('');
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      
      <div className={`webgl-screen arena-screen ${isShaking ? 'shake-animation damage-flash-overlay' : ''}`}>
        
        {turnAnnouncement && (
          <div className="turn-announcement-overlay">
            <h1 className="turn-announce-title">TURN {turnAnnouncement.turn}</h1>
            <h2 className="turn-announce-player">{turnAnnouncement.player}'s Turn</h2>
          </div>
        )}

        {/* Top HUD Bar */}
        <header className="arena-top-hud">
          <div className="hud-title-group">
            <span className="hud-sparkle">✦</span>
            <div className="hud-brand-title">
              <strong>LIVE MATCH</strong>
              <span className="hud-format-tag">Standard Format</span>
            </div>
          </div>

          <div className="hud-turn-badge">
            <Clock size={16} color="var(--neon-cyan)" />
            <span className="hud-turn-text">TURN {turnNum} / {maxTurns}</span>
          </div>

          <div className="hud-actions-group">
            <button
              className="btn-hud-undo"
              onClick={handleUndo}
              disabled={!historyStack.length}
              title="Undo last action"
            >
              <Undo2 size={16} />
              <span>UNDO</span>
            </button>

            <button
              className="btn-hud-menu"
              onClick={() => setShowInGameMenu(true)}
              title="Game Menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* 3-Column Arena Stage Layout */}
        <div className="arena-stage-grid">
          {/* Left Column: Scoreboard & Active Effects */}
          <aside className="arena-col-left">
            {/* Scoreboard Panel */}
            <div className="arena-panel scoreboard-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">SCOREBOARD (LP)</span>
              </div>

              <div className="arena-players-list">
                {players.slice(0, 4).map((p, idx) => {
                  const c = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                  const isActive = idx === activeIdx;
                  return (
                    <div
                      key={p.id}
                      className={`arena-score-row ${isActive ? 'active-score-row' : ''}`}
                    >
                      <div className={`arena-num-pill pill-${idx + 1}`}>
                        {idx + 1}
                      </div>

                      <div className="arena-score-avatar" style={{ borderColor: c.themeColor }}>
                        <img
                          src={getAssetUrl(c.image)}
                          alt={c.name}
                          className="arena-avatar-thumb"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="arena-emoji-fallback">{c.avatar}</span>
                      </div>

                      <div className="arena-score-meta">
                        <strong className="arena-player-name">{p.name}</strong>
                        <span className="arena-lp-tag">LP</span>
                      </div>

                      <div className="arena-score-val-block">
                        <span className="arena-lp-number">{p.hp}</span>
                      </div>

                      {isActive && (
                        <div className="arena-active-crown">
                          <Crown size={14} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="btn-view-card-zone" onClick={() => setShowCardZoneModal(true)}>
                <Layers size={16} />
                <span>VIEW CARD ZONE</span>
              </button>
            </div>

            {/* Active Effects Panel */}
            <div className="arena-panel active-effects-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">ACTIVE EFFECTS</span>
              </div>

              <div className="effects-icons-row">
                <button
                  className="effect-chip effect-poison"
                  onClick={() => setSelectedEffectInfo({ name: 'Poison', desc: 'Deals 250 damage per stack at the start of each turn.', count: '2' })}
                >
                  <Skull size={16} color="#ff3366" />
                  <span className="effect-name">Poison</span>
                  <span className="effect-count">2</span>
                </button>

                <button
                  className="effect-chip effect-antidote"
                  onClick={() => {
                    handleExecuteAttack('Antidote Elixir', 0, false, 300);
                  }}
                  title="Click to cleanse & restore shield"
                >
                  <FlaskConical size={16} color="#39ff14" />
                  <span className="effect-name">Antidote</span>
                  <span className="effect-count">1</span>
                </button>

                <button
                  className="effect-chip effect-atk"
                  onClick={() => handleExecuteAttack('Empowered Strike', 700, true, 0)}
                  title="Click to perform boosted attack"
                >
                  <Swords size={16} color="#ff3366" />
                  <span className="effect-name">Atk Boost</span>
                  <span className="effect-count">+500</span>
                </button>

                <button
                  className="effect-chip effect-shield"
                  onClick={() => setSelectedEffectInfo({ name: 'Shield', desc: 'Absorbs 300 incoming damage.', count: '+300' })}
                >
                  <Shield size={16} color="#00f0ff" />
                  <span className="effect-name">Shield</span>
                  <span className="effect-count">+300</span>
                </button>

                <button
                  className="effect-chip effect-stun"
                  onClick={() => setSelectedEffectInfo({ name: 'Stun', desc: 'Forces target to skip action phase.', count: '1' })}
                >
                  <Zap size={16} color="#ffd700" />
                  <span className="effect-name">Stun</span>
                  <span className="effect-count">1</span>
                </button>
              </div>

              <span className="effects-footer-hint">Tap an effect for details</span>
            </div>
          </aside>

          {/* Center Column: Combat Orbit & Massive Hero Card */}
          <main className="arena-col-center">
            <div className="combat-orbit-stage">
              {/* Circular Turn Ring (Wide 440px arena layout) */}
              {/* Circular Turn Ring (Wide 440px arena layout) */}
              <div 
                className="arena-orbit-ring" 
                style={{ 
                  position: 'relative', 
                  width: '440px', 
                  height: '440px',
                  // The active player should be at the bottom (90 degrees).
                  // Natural angle of player i is (360/N) * i - 90.
                  // We rotate the entire ring so active player is at the bottom.
                  transform: `rotate(${-(360 / players.length) * activeIdx}deg)`,
                  transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                
                {/* Connecting Directional Orbit Lines */}
                <svg className="arena-orbit-lines-svg" viewBox="0 0 440 440" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                  <circle
                    cx="220"
                    cy="220"
                    r="190"
                    fill="none"
                    stroke="rgba(0, 240, 255, 0.22)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <path
                    d="M 330 90 A 190 190 0 0 1 410 220"
                    fill="none"
                    stroke="var(--neon-crimson)"
                    strokeWidth="3.5"
                    filter="drop-shadow(0 0 8px var(--neon-crimson))"
                  />
                </svg>

                {players.map((p, i) => {
                  const angleDeg = (360 / players.length) * i + 90; // Starting anchor at bottom
                  const radius = 190;
                  const x = Math.cos(angleDeg * (Math.PI / 180)) * radius;
                  const y = Math.sin(angleDeg * (Math.PI / 180)) * radius;
                  const isActive = i === activeIdx;

                  // We counter-rotate the node so the avatar stands upright
                  const counterRotation = (360 / players.length) * activeIdx;

                  return (
                    <div 
                      key={p.id} 
                      className={`orbit-fighter-node ${isActive ? 'fighter-active' : ''}`}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        // If active, override scale transform from CSS using custom property or let css handle it
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${counterRotation}deg) ${isActive ? 'scale(1.4)' : ''}`,
                        transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: isActive ? 10 : 5
                      }}
                    >
                      <div className={`fighter-pill pill-${i + 1}`}>{i + 1}</div>
                      <div className={`fighter-avatar-frame ${p.isZombie ? 'ring-green' : 'ring-blue'}`} style={p.isZombie ? { borderColor: '#39ff14', boxShadow: '0 0 15px #39ff14' } : {}}>
                        <img
                          src={getAssetUrl(CHARACTERS[p.characterId]?.image)}
                          alt={`P${i+1}`}
                          className="fighter-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="fighter-emoji">{p.isZombie ? '🧟' : CHARACTERS[p.characterId]?.avatar}</span>
                      </div>
                      
                      {/* Buff pills for ET and Crystals */}
                      <div className="fighter-buff-pill" style={{ top: '-15px', right: '-15px', backgroundColor: 'var(--space-bg)', border: '1px solid var(--neon-yellow)' }}>
                        <Zap size={11} color="var(--neon-yellow)"/> {p.energyTokens}
                      </div>
                      <div className="fighter-buff-pill" style={{ bottom: '-15px', left: '-15px', backgroundColor: 'var(--space-bg)', border: '1px solid var(--neon-cyan)' }}>
                        <Gem size={11} color="var(--neon-cyan)"/> {p.crystals}
                      </div>
                      
                      {p.poisonCards > 0 && (
                        <div className="fighter-buff-pill poison-buff" style={{ bottom: '-15px', right: '-15px' }}>
                          <Skull size={11} /> {p.poisonCards}
                        </div>
                      )}

                      <span className="fighter-name" style={{ position: 'absolute', top: '100%', whiteSpace: 'nowrap', left: '50%', transform: 'translateX(-50%)' }}>
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Massive Combat Hero Card */}
              <div className="hero-combat-card">
                <div className="hero-card-crown">
                  <Crown size={20} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                </div>

                <div className="hero-card-header">
                  <div className="hero-card-num-pill">
                    {activeIdx + 1}
                  </div>
                  <strong className="hero-card-player-name">{activePlayer.name}</strong>
                  <div className="hero-card-crest">❖</div>
                </div>

                {/* Character Art Showcase */}
                <div className="hero-card-art-frame">
                  <img
                    src={getAssetUrl(activeChar.image)}
                    alt={activeChar.name}
                    className="hero-card-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="hero-card-emoji">{activeChar.avatar}</div>
                  <div className="hero-energy-arcs"></div>

                  {floatingDamage && (
                    <div className={`floating-combat-popup ${floatingDamage.type}`}>
                      {floatingDamage.text}
                    </div>
                  )}
                </div>

                {/* Stats Bar (ATK & DEF) */}
                <div className="hero-card-stats-row">
                  <div className="hero-stat-item atk-stat">
                    <Swords size={16} color="var(--neon-crimson)" />
                    <strong>{activeChar.atk || 2800}</strong>
                    <span>ATK</span>
                  </div>

                  <div className="hero-stat-item def-stat">
                    <Shield size={16} color="var(--neon-cyan)" />
                    <strong>{activeChar.def || 2400}</strong>
                    <span>DEF</span>
                  </div>
                </div>

                {/* Interactive Ability Box */}
                <div
                  className="hero-card-ability-box interactive-ability"
                  onClick={() => handleExecuteAttack(activeChar.signatureMove || 'Shadow Strike', 500, true)}
                  title="Click to activate technique against opponent!"
                >
                  <div className="ability-title-row">
                    <strong className="ability-title">{activeChar.signatureMove || 'Shadow Strike'}</strong>
                    <span className="ability-cost-pill">1 ET</span>
                  </div>
                  <p className="ability-description">
                    {activeChar.signatureDesc || 'Deal 500 damage to target enemy and apply Poison.'}
                  </p>
                </div>

                {/* Status Badges Row */}
                <div className="hero-card-status-bar">
                  <div className="status-mini-pill p-poison"><Skull size={11} /> 2</div>
                  <div className="status-mini-pill p-antidote"><FlaskConical size={11} /> 1</div>
                  <div className="status-mini-pill p-atk"><Swords size={11} /> +500</div>
                  <div className="status-mini-pill p-shield"><Shield size={11} /> +300</div>
                  <div className="status-mini-pill p-stun"><Zap size={11} /> 1</div>
                </div>
              </div>

              {/* Your Turn Glowing Banner */}
              <div className="your-turn-ribbon">
                <span className="ribbon-arrow">««</span>
                <span className="ribbon-text">YOUR TURN</span>
                <span className="ribbon-arrow">»»</span>
              </div>

              {/* Hand of Cards at Bottom */}
              <div className="hand-cards-deck">
                {[
                  { name: 'Venomous Spore', icon: '🧪', cost: 1, action: () => handleExecuteAttack('Venomous Spore', 400, true) },
                  { name: 'Azure Guard', icon: '🛡️', cost: 1, action: () => handleExecuteAttack('Azure Guard', 0, false, 300) },
                  { name: 'Antidote Elixir', icon: '🧴', cost: 1, action: () => handleExecuteAttack('Antidote Elixir', 0, false, 200) },
                  { name: 'Shadow Strike', icon: '⚔️', cost: 2, action: () => handleExecuteAttack('Shadow Strike', 600, true) }
                ].map((card, i) => (
                  <div
                    key={i}
                    className="card-hand-playable-item"
                    onClick={card.action}
                    title={`Play ${card.name} (${card.cost} ET)`}
                  >
                    <span className="hand-card-icon">{card.icon}</span>
                    <span className="hand-card-name">{card.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Column: Match History & Turn Action Preview */}
          <aside className="arena-col-right">
            {/* Match History */}
            <div className="arena-panel match-history-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">MATCH HISTORY</span>
              </div>

              <div className="history-entries-list">
                {matchLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="history-entry-item">
                    <div className="history-actor-avatar">
                      <span className="hist-avatar-dot"></span>
                    </div>
                    <div className="history-entry-content">
                      <span className="hist-turn-label">Turn {log.turn} • {log.actor}</span>
                      <strong className="hist-action-text">{log.action}</strong>
                    </div>
                    {log.amount && (
                      <span className={`hist-amount-tag ${log.amount.startsWith('+') ? 'tag-plus' : 'tag-minus'}`}>
                        {log.amount}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn-view-full-history" onClick={() => setShowFullHistoryModal(true)}>
                <ScrollText size={15} />
                <span>VIEW FULL HISTORY</span>
              </button>
            </div>

            {/* Turn Action Result Box */}
            <div className="arena-panel turn-action-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">TURN {turnNum} ACTION</span>
              </div>

              <div className="turn-action-content">
                <div className="action-actor-row">
                  <div className="action-avatar-circle">
                    <img
                      src={getAssetUrl(activeChar.image)}
                      alt={activeChar.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <strong className="action-actor-name">{turnActionPreview.actor}</strong>
                    <span className="action-ability-name">{turnActionPreview.ability}</span>
                  </div>
                </div>

                <div className="action-target-row">
                  <span className="target-arrow">→</span>
                  <span className="target-name">{turnActionPreview.target}</span>
                </div>

                <p className="action-desc-text">{turnActionPreview.desc}</p>

                <div className="action-result-pill">
                  <span className="result-label">RESULT</span>
                  <strong className="result-val">{turnActionPreview.result}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Arena Controls Bar */}
        <footer className="arena-bottom-controls">
          <div className="bottom-left-buttons">
            <button className="btn-arena-chat" onClick={() => setShowChatDrawer(!showChatDrawer)}>
              <MessageSquare size={16} />
              <span>Match Chat</span>
              <span className="chat-red-dot"></span>
            </button>

            <div className="spectators-badge">
              <Eye size={15} />
              <span>4 Watching</span>
            </div>
          </div>

          <div className="bottom-right-actions">
            <button className="btn-end-turn-cta" onClick={handleEndTurn}>
              <span>END TURN</span>
            </button>
          </div>
        </footer>

        {/* Dice Combat Resolution Modal */}
        {combatDiceModal && (
          <div className="arena-modal-backdrop" onClick={() => setCombatDiceModal(null)}>
            <div className="arena-modal-card combat-dice-result-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <div className="modal-title-wrap">
                  <Swords size={20} color="var(--neon-crimson)" />
                  <h3>COMBAT RESOLUTION</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setCombatDiceModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="combat-dice-stage">
                <div className="dice-team-box attacker-dice-box">
                  <span className="dice-team-title">⚔ {combatDiceModal.actor} (Offense)</span>
                  <div className="dice-pair-display">
                    <span className="combat-die red-die">{combatDiceModal.redDice[0]}</span>
                    <span className="combat-die red-die">{combatDiceModal.redDice[1]}</span>
                  </div>
                  <span className="dice-total-tag">Total: {combatDiceModal.redDice[0] + combatDiceModal.redDice[1]}</span>
                </div>

                <div className="vs-emblem">VS</div>

                <div className="dice-team-box defender-dice-box">
                  <span className="dice-team-title">🛡 {combatDiceModal.target} (Defense)</span>
                  <div className="dice-pair-display">
                    <span className="combat-die gold-die">{combatDiceModal.goldDice[0]}</span>
                    <span className="combat-die gold-die">{combatDiceModal.goldDice[1]}</span>
                  </div>
                  <span className="dice-total-tag">Total: {combatDiceModal.goldDice[0] + combatDiceModal.goldDice[1]}</span>
                </div>
              </div>

              <div className="dice-outcome-summary">
                {combatDiceModal.dpTriggered ? (
                  <div className="outcome-alert dp-success">
                    <Shield size={16} />
                    <span>DEFENSE 6+ ACHIEVED: DP Mitigated -{combatDiceModal.dpReduction} AP Damage!</span>
                  </div>
                ) : (
                  <div className="outcome-alert dp-fail">
                    <span>Defense roll &lt; 6: Full technique damage penetrates!</span>
                  </div>
                )}

                <div className="final-dmg-row">
                  <span>Net Damage to LP:</span>
                  <strong className="net-dmg-highlight">-{combatDiceModal.damageDealt} LP</strong>
                </div>
              </div>

              <button className="btn-confirm-dice" onClick={() => setCombatDiceModal(null)}>
                CONTINUE MATCH
              </button>
            </div>
          </div>
        )}

        {/* Card Zone Modal (10 Action Cards from TCG Rules Doc) */}
        {showCardZoneModal && (
          <div className="arena-modal-backdrop" onClick={() => setShowCardZoneModal(false)}>
            <div className="arena-modal-card card-zone-full-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <div className="modal-title-wrap">
                  <Layers size={20} color="var(--neon-cyan)" />
                  <h3>CARD ZONE & DECK (10 ACTION CARDS)</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setShowCardZoneModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="card-filter-tabs-row">
                {['ALL', 'Attack', 'Defense', 'Status', 'Heal', 'Special', 'Ultimate'].map(cat => (
                  <button
                    key={cat}
                    className={`card-filter-btn ${cardCategoryFilter === cat ? 'active-filter' : ''}`}
                    onClick={() => setCardCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="modal-cards-grid-10">
                {ACTION_CARDS
                  .filter(c => cardCategoryFilter === 'ALL' || c.category === cardCategoryFilter)
                  .map(card => (
                    <div
                      key={card.id}
                      className="playable-card-item"
                      style={{ borderColor: card.color || 'var(--neon-cyan)' }}
                      onClick={() => {
                        setShowCardZoneModal(false);
                        if (card.id === 'atk_basic') handleExecuteAttack('Basic Attack', 400, false);
                        else if (card.id === 'atk_super') handleExecuteAttack('Super Attack', 700, false);
                        else if (card.id === 'poison_card') handleExecuteAttack('Poison Spore', 250, true);
                        else if (card.id === 'antidote_card') handleExecuteAttack('Antidote Elixir', 0, false, 300);
                        else if (card.id === 'shield_card') handleExecuteAttack('Shield Barrier', 0, false, 400);
                        else if (card.id === 'heal_card') handleExecuteAttack('Vitality Heal', 0, false, 500);
                        else if (card.id === 'kontrol_card') handleExecuteAttack('Mind Kontrol', 600, false);
                        else if (card.id === 'blitz_card') handleExecuteAttack('Saigo No Blitz', 1200, true);
                        else if (card.id === 'amplify_card') handleExecuteAttack('Amplify Surge', 300, false, 200);
                        else if (card.id === 'retreat_card') handleExecuteAttack('Tactical Retreat', 0, false, 0);
                      }}
                    >
                      <div className="p-card-top-bar">
                        <span className="p-card-icon">{card.icon}</span>
                        <span className="p-card-cat-badge">{card.category}</span>
                        <span className="p-card-cost-pill">{card.costET} ET</span>
                      </div>
                      <strong className="p-card-name">{card.name}</strong>
                      <p className="p-card-description">{card.desc}</p>
                      <button className="btn-play-card-cta">
                        <span>PLAY CARD</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Full History Modal */}
        {showFullHistoryModal && (
          <div className="arena-modal-backdrop" onClick={() => setShowFullHistoryModal(false)}>
            <div className="arena-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <div className="modal-title-wrap">
                  <ScrollText size={20} color="var(--neon-cyan)" />
                  <h3>COMPLETE MATCH LOG</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setShowFullHistoryModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="full-history-list">
                {matchLogs.map((log, i) => (
                  <div key={i} className="full-history-item">
                    <span className="f-turn">Turn {log.turn}</span>
                    <strong className="f-actor">{log.actor}</strong>
                    <span className="f-action">{log.action}</span>
                    {log.amount && <span className="f-amount">{log.amount}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* In-Game Menu Modal */}
        {showInGameMenu && (
          <div className="arena-modal-backdrop" onClick={() => setShowInGameMenu(false)}>
            <div className="arena-modal-card in-game-menu-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3>MATCH MENU</h3>
                <button className="btn-close-modal" onClick={() => setShowInGameMenu(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="in-game-menu-options">
                <button
                  className="menu-opt-btn primary"
                  onClick={() => {
                    setShowInGameMenu(false);
                    setGameState({ ...gameState, winner: activePlayer });
                  }}
                >
                  <Trophy size={20} />
                  <span>DECLARE VICTORY</span>
                </button>

                <button className="menu-opt-btn" onClick={onOpenRules}>
                  <ScrollText size={20} />
                  <span>CHECK RULES ASSISTANT</span>
                </button>

                <button className="menu-opt-btn" onClick={onRematch}>
                  <Undo2 size={20} />
                  <span>RESTART MATCH</span>
                </button>

                <button className="menu-opt-btn" onClick={onGoToMenu}>
                  <X size={20} />
                  <span>QUIT TO MAIN MENU</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Effect details popup */}
        {selectedEffectInfo && (
          <div className="arena-modal-backdrop" onClick={() => setSelectedEffectInfo(null)}>
            <div className="arena-modal-card effect-details-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3>{selectedEffectInfo.name} ({selectedEffectInfo.count})</h3>
                <button className="btn-close-modal" onClick={() => setSelectedEffectInfo(null)}>
                  <X size={18} />
                </button>
              </div>
              <p className="effect-detail-desc">{selectedEffectInfo.desc}</p>
            </div>
          </div>
        )}

        {/* Winner Screen Modal */}
        {gameState?.winner && (
          <WinnerModal
            winner={gameState.winner}
            players={players}
            turnNumber={turnNum}
            onRematch={onRematch}
            onHome={onGoToMenu}
          />
        )}
      </div>
      
    </div>
  );
}
