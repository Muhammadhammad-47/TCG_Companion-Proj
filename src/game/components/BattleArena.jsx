import React, { useState, useEffect } from 'react';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { ACTION_CARDS, GAME_LIMITS } from '../data/cards';
import { resolveDiceCombat, advanceTurn, checkZombieStatus } from '../utils/gameEngine';
import { soundFX } from '../utils/audio';
import WinnerModal from './WinnerModal';
import DiceRollerModal from './DiceRollerModal';
import CardActionModal from './CardActionModal';
import KontrolModal from './KontrolModal';
import BlitzModal from './BlitzModal';
import RetreatModal from './RetreatModal';
import ZombieBanner from './ZombieBanner';
import LocalMatchChatModal from './LocalMatchChatModal';
import { Chat } from '../../App';

import {
  Swords, Undo2, Menu, Shield, Skull, Zap, Gem,
  Clock, Play, Heart, Trophy, Crown, Dices,
  MessageSquare, Eye, Layers, ScrollText, FlaskConical,
  Maximize2, Minimize2, Sparkles, ChevronRight, Activity,
  X, Send, CheckCircle2, Flame, RefreshCw, AlertTriangle, HelpCircle
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
  // Modals state
  const [showCardActionModal, setShowCardActionModal] = useState(false);
  const [showCardZoneModal, setShowCardZoneModal] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [showInGameMenu, setShowInGameMenu] = useState(false);
  const [showRulesChatOverlay, setShowRulesChatOverlay] = useState(false);
  const [showLocalChat, setShowLocalChat] = useState(false);
  const [localChatMessages, setLocalChatMessages] = useState([
    {
      id: 'init_1',
      senderId: 'player_1',
      senderName: 'Chynaman',
      characterId: 'chynaman',
      text: '⚔️ Duel commenced! First to 3 Stability Crystals wins!',
      time: '12:00 PM'
    }
  ]);
  const [activeDiceCombatData, setActiveDiceCombatData] = useState(null);
  const [activeKontrolData, setActiveKontrolData] = useState(null);
  const [activeBlitzData, setActiveBlitzData] = useState(null);
  const [activeRetreatData, setActiveRetreatData] = useState(null);

  const [selectedEffectInfo, setSelectedEffectInfo] = useState(null);
  const [cardCategoryFilter, setCardCategoryFilter] = useState('ALL');
  const [floatingDamage, setFloatingDamage] = useState(null); // { targetId, text, type }
  const [turnAnnouncement, setTurnAnnouncement] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  const players = gameState?.players || [];
  const activeIdx = gameState?.activePlayerIndex || 0;
  const activePlayer = players[activeIdx] || players[0] || { name: 'Player 1', characterId: 'chynaman', hp: 100, energyTokens: 5, crystals: 1, poisonCards: 0 };
  const isZombie = activePlayer?.isZombie;
  const activeChar = isZombie ? ZOMBIE_PROFILE : (CHARACTERS[activePlayer?.characterId] || CHARACTERS.chynaman);
  const turnNum = gameState?.turnNumber || 1;
  const roundNum = gameState?.roundNumber || 1;
  const matchLogs = gameState?.history || [];

  // Default target is the next available non-defeated player
  const nonDefeatedOpponents = players.filter((p, i) => i !== activeIdx && !p.isDefeated);
  const defaultTarget = nonDefeatedOpponents[0] || players[(activeIdx + 1) % Math.max(1, players.length)] || activePlayer;
  const targetChar = defaultTarget?.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[defaultTarget?.characterId] || CHARACTERS.bee);

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

  // Claim +1 ET at turn start
  const handleClaimTurnET = () => {
    if (activePlayer.claimedTurnET) {
      alert('You have already claimed your +1 Energy Token for this turn!');
      return;
    }
    pushStateSnapshot();
    soundFX.playEnergy();

    const updatedPlayers = players.map((p, idx) => {
      if (idx === activeIdx) {
        return {
          ...p,
          energyTokens: Math.min(GAME_LIMITS.MAX_ET, (p.energyTokens || 0) + 1),
          claimedTurnET: true
        };
      }
      return p;
    });

    const newLog = {
      turn: turnNum,
      actor: activePlayer.name,
      action: 'Claimed +1 Energy Token (ET)',
      type: 'energy',
      amount: '+1 ET'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // Initiate Combat Clash -> Opens DiceRollerModal
  const handleInitiateCombat = ({ attacker, defender, actionCard, characterMove, amplifyBonus = 0 }) => {
    setShowCardActionModal(false);
    setShowCardZoneModal(false);

    // Verify ET cost
    const totalET = (actionCard?.costET || 0) + (characterMove?.costET || 0);
    if (attacker.energyTokens < totalET) {
      alert(`Insufficient Energy Tokens! Need ${totalET} ET, but you have ${attacker.energyTokens} ET.`);
      return;
    }

    setActiveDiceCombatData({
      attacker,
      defender,
      actionCard,
      characterMove,
      amplifyBonus,
      totalET
    });
  };

  // Complete Combat Clash resolution from DiceRollerModal
  const handleCompleteCombatResolution = ({ combatData, result }) => {
    pushStateSnapshot();
    setActiveDiceCombatData(null);

    const { attacker, defender, characterMove, totalET } = combatData;
    const damage = result.damageDealt;
    const isTargetZombie = defender.isZombie;

    let targetPoisonChange = 0;
    if (result.zombiePoisonCured && isTargetZombie) {
      targetPoisonChange = -1; // Fire/Lightning burns off 1 poison card from zombie
    } else if (result.appliesPoison) {
      targetPoisonChange = 1; // Venom strike applies +1 poison card
    }

    // Trigger visual feedback
    if (damage > 0) {
      setFloatingDamage({ targetId: defender.id, text: `-${damage} HP`, type: 'damage' });
      setIsShaking(true);
      setTimeout(() => {
        setFloatingDamage(null);
        setIsShaking(false);
      }, 1200);
    }

    // Update player stats
    const updatedPlayers = players.map(p => {
      if (p.id === attacker.id) {
        return {
          ...p,
          energyTokens: Math.max(0, p.energyTokens - totalET),
          stats: {
            ...p.stats,
            damageDealt: (p.stats?.damageDealt || 0) + damage,
            cardsPlayed: (p.stats?.cardsPlayed || 0) + 1,
            zombiesInfected: (p.stats?.zombiesInfected || 0) + (result.appliesPoison ? 1 : 0)
          }
        };
      }
      if (p.id === defender.id) {
        const nextRawHP = Math.max(0, p.hp - damage);
        let nextPoison = Math.max(0, (p.poisonCards || 0) + targetPoisonChange);
        let nextPlayerObj = {
          ...p,
          hp: nextRawHP,
          shield: result.newShield,
          poisonCards: nextPoison,
          isStunned: result.appliesStun ? true : p.isStunned,
          stats: {
            ...p.stats,
            damageTaken: (p.stats?.damageTaken || 0) + damage
          }
        };

        // Check Zombie lifecycle (5 poison trigger or revival at 0 HP)
        return checkZombieStatus(nextPlayerObj);
      }
      return p;
    });

    // Check defeated and stability crystal steal
    let crystalWinner = null;
    const finalPlayers = updatedPlayers.map(p => {
      if (p.id === defender.id && p.hp === 0 && !p.isZombie) {
        // Attacker captures 1 crystal from defeated defender
        return p;
      }
      return p;
    });

    const newLog = {
      turn: turnNum,
      actor: attacker.name,
      action: `Used ${characterMove?.name || 'Attack'} on ${defender.name}`,
      type: 'attack',
      amount: `-${damage} HP`
    };

    setGameState({
      ...gameState,
      players: finalPlayers,
      history: [newLog, ...(gameState.history || [])],
      lastActionLog: newLog
    });
  };

  // Instant card effect (Heal, Shield, Antidote, Poison, Amplify)
  const handleApplyInstantEffect = ({ type, sourcePlayerId, targetPlayerId, costET = 0, amount = 0, amplifyChoice = null }) => {
    pushStateSnapshot();
    setShowCardActionModal(false);
    setShowCardZoneModal(false);

    const sourcePlayer = players.find(p => p.id === sourcePlayerId);
    if (sourcePlayer.energyTokens < costET) {
      alert(`Need ${costET} ET to play this card.`);
      return;
    }

    soundFX.playCard();

    let logText = '';
    let logAmount = '';

    const updatedPlayers = players.map(p => {
      let updated = { ...p };

      // Deduct ET from source
      if (p.id === sourcePlayerId) {
        updated.energyTokens = Math.max(0, updated.energyTokens - costET);
      }

      // Apply effect to target
      if (p.id === targetPlayerId) {
        if (type === 'heal') {
          updated.hp = Math.min(updated.maxHP, updated.hp + (amount || 30));
          soundFX.playHeal();
          logText = `Used Heal on ${updated.name}`;
          logAmount = `+${amount || 30} HP`;
        } else if (type === 'shield') {
          updated.shield = (updated.shield || 0) + (amount || 30);
          soundFX.playEnergy();
          logText = `Deployed +${amount || 30} Shield barrier`;
          logAmount = `+${amount || 30} Shield`;
        } else if (type === 'antidote') {
          updated.poisonCards = Math.max(0, (updated.poisonCards || 0) - 1);
          updated.hp = Math.min(updated.maxHP, updated.hp + 20);
          soundFX.playHeal();
          logText = `Used Antidote: -1 Poison & +20 HP`;
          logAmount = `+20 HP`;
        } else if (type === 'poison') {
          updated.poisonCards = (updated.poisonCards || 0) + 1;
          soundFX.playDamage();
          logText = `Infected ${updated.name} with Poison`;
          logAmount = `+1 Poison`;
        } else if (type === 'amplify') {
          if (amplifyChoice === 'hp') {
            updated.hp = Math.min(updated.maxHP, updated.hp + 20);
            logText = `Amplify Surge: +20 HP`;
            logAmount = `+20 HP`;
          } else if (amplifyChoice === 'ap') {
            updated.buffAP = (updated.buffAP || 0) + 20;
            logText = `Amplify Surge: +20 AP attack boost`;
            logAmount = `+20 AP`;
          } else if (amplifyChoice === 'dp') {
            updated.buffDP = (updated.buffDP || 0) + 10;
            logText = `Amplify Surge: +10 DP defense armor`;
            logAmount = `+10 DP`;
          }
        }
      }

      return checkZombieStatus(updated);
    });

    const newLog = {
      turn: turnNum,
      actor: sourcePlayer.name,
      action: logText,
      type,
      amount: logAmount
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])],
      lastActionLog: newLog
    });
  };

  // Complete Kontrol Action
  const handleCompleteKontrol = ({ attackerId, targetId, success, chosenOption }) => {
    setActiveKontrolData(null);
    pushStateSnapshot();

    const attacker = players.find(p => p.id === attackerId);
    const target = players.find(p => p.id === targetId);

    const updatedPlayers = players.map(p => {
      if (p.id === attackerId) {
        return {
          ...p,
          energyTokens: Math.max(0, p.energyTokens - 3),
          kontrolUsesLeft: Math.max(0, (p.kontrolUsesLeft ?? 2) - 1)
        };
      }
      return p;
    });

    const actionText = success
      ? `Successfully Kontrolled ${target.name} (${chosenOption === 'steal_card' ? 'Stole 1 Action Card' : 'Forced attack on opponent'})`
      : `${target.name} resisted Mind Kontrol!`;

    const newLog = {
      turn: turnNum,
      actor: attacker.name,
      action: actionText,
      type: 'kontrol',
      amount: success ? 'SUCCESS' : 'FAILED'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // Complete Saigo No Blitz Action
  const handleCompleteBlitz = ({ attackerId, mode, targetId, damage = 200, splitDamage = 50 }) => {
    setActiveBlitzData(null);
    pushStateSnapshot();

    const attacker = players.find(p => p.id === attackerId);
    const hpSacrifice = Math.floor(attacker.hp * 0.5);

    const updatedPlayers = players.map(p => {
      if (p.id === attackerId) {
        return {
          ...p,
          hp: Math.max(1, p.hp - hpSacrifice),
          energyTokens: Math.max(0, p.energyTokens - 5),
          blitzUsesLeft: Math.max(0, (p.blitzUsesLeft ?? 2) - 1)
        };
      }
      if (mode === 'one_vs_one' && p.id === targetId) {
        const nextHP = Math.max(0, p.hp - damage);
        return checkZombieStatus({ ...p, hp: nextHP });
      }
      if (mode === 'one_vs_all' && p.id !== attackerId && !p.isDefeated) {
        const nextHP = Math.max(0, p.hp - splitDamage);
        return checkZombieStatus({ ...p, hp: nextHP });
      }
      return p;
    });

    const newLog = {
      turn: turnNum,
      actor: attacker.name,
      action: `Unleashed Saigo No Blitz (${mode === 'one_vs_one' ? '1v1 200 AP' : `1-vs-All ${splitDamage} AP each`})`,
      type: 'blitz',
      amount: '-200 AP'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // Complete Retreat Action
  const handleCompleteRetreat = ({ playerId, success }) => {
    setActiveRetreatData(null);
    pushStateSnapshot();

    const player = players.find(p => p.id === playerId);
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return { ...p, retreatedThisTurn: success };
      }
      return p;
    });

    const newLog = {
      turn: turnNum,
      actor: player.name,
      action: success ? `Successfully retreated from battle!` : `Retreat attempt failed! Must stay and fight.`,
      type: 'retreat',
      amount: success ? 'ESCAPED' : 'FAILED'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // End Turn
  const handleEndTurn = () => {
    soundFX.playMenuHover();
    pushStateSnapshot();

    const nextState = advanceTurn(gameState);
    setGameState(nextState);

    const nextActivePlayer = nextState.players[nextState.activePlayerIndex];
    setTurnAnnouncement({ turn: nextState.turnNumber, player: nextActivePlayer.name });
    setTimeout(() => setTurnAnnouncement(null), 2000);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className={`webgl-screen arena-screen ${isShaking ? 'shake-animation damage-flash-overlay' : ''}`}>
        
        {/* Turn Announcement Overlay */}
        {turnAnnouncement && (
          <div className="turn-announcement-overlay">
            <h1 className="turn-announce-title">TURN {turnAnnouncement.turn}</h1>
            <h2 className="turn-announce-player">{turnAnnouncement.player}'s Turn</h2>
          </div>
        )}

        {/* Zombie Transformation Alert */}
        {gameState.zombieTransformationAlert && (
          <div className="arena-modal-backdrop" onClick={() => setGameState({ ...gameState, zombieTransformationAlert: null })}>
            <div className="arena-modal-card" style={{ border: '2px solid #39ff14', background: 'rgba(10, 25, 10, 0.95)', textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '3rem', margin: '0 auto 10px' }}>🧟‍♂️☣️</div>
              <h2 style={{ color: '#39ff14', fontFamily: 'Orbitron, sans-serif', margin: '0 0 10px' }}>ZOMBIE INFECTION ALERT!</h2>
              <p style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 16px' }}>
                <strong>{gameState.zombieTransformationAlert.player}</strong> accumulated 5 Poison Cards and has transformed into an <strong>UNDEAD ZOMBIE</strong>!
              </p>
              <div style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)', borderRadius: '8px', padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#e0ffe0', marginBottom: '20px' }}>
                <div>• HP becomes <strong>40 HP</strong> with <strong>+10 HP auto-regeneration</strong> each round.</div>
                <div>• Character moves replaced with <strong>Venom Strike</strong> (+1 Poison on hit).</div>
                <div>• Immune to Kontrol and revives if reduced to 0 HP!</div>
                <div>• Fire & Lightning attacks strip 1 poison card on hit.</div>
              </div>
              <button
                className="btn-confirm-dice"
                style={{ background: '#39ff14', color: '#000', fontWeight: 'bold' }}
                onClick={() => setGameState({ ...gameState, zombieTransformationAlert: null })}
              >
                ENTER THE HORDE
              </button>
            </div>
          </div>
        )}

        {/* Top HUD Bar */}
        <header className="arena-top-hud">
          <div className="hud-title-group">
            <span className="hud-sparkle">✦</span>
            <div className="hud-brand-title">
              <strong>ATTENTION TCG</strong>
              <span className="hud-format-tag">Live Companion Arena</span>
            </div>
          </div>

          <div className="hud-turn-badge" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--neon-cyan)" />
              <span className="hud-turn-text">TURN {turnNum} · ROUND {roundNum}</span>
            </div>
            
            {/* ET Claim reminder button */}
            {!activePlayer.claimedTurnET && (
              <button
                onClick={handleClaimTurnET}
                style={{
                  background: 'linear-gradient(90deg, #ffd700, #ff9900)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)'
                }}
              >
                <Zap size={13} fill="#000" /> CLAIM +1 ET
              </button>
            )}
          </div>

          <div className="hud-actions-group">
            <button
              className="btn-hud-undo"
              onClick={() => setShowRulesChatOverlay(true)}
              style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
              title="Open Rules AI Assistant"
            >
              <HelpCircle size={16} />
              <span>RULES BOT</span>
            </button>

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
          {/* Left Column: Scoreboard & Player Standings */}
          <aside className="arena-col-left">
            <div className="arena-panel scoreboard-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">WARRIORS SCOREBOARD</span>
              </div>

              <div className="arena-players-list">
                {players.map((p, idx) => {
                  const c = p.isZombie ? ZOMBIE_PROFILE : (CHARACTERS[p.characterId] || CHARACTERS.chynaman);
                  const isActive = idx === activeIdx;
                  const isLvl2 = p.hp >= GAME_LIMITS.LEVEL_2_HP;

                  return (
                    <div
                      key={p.id}
                      className={`arena-score-row ${isActive ? 'active-score-row' : ''} ${p.isDefeated ? 'player-defeated' : ''}`}
                    >
                      <div className={`arena-num-pill pill-${idx + 1}`}>
                        {idx + 1}
                      </div>

                      <div className="arena-score-avatar" style={{ borderColor: c.themeColor, overflow: 'hidden', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                        <img
                          src={getAssetUrl(c.image || 'characters/chynaman.png')}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div className="arena-score-meta">
                        <strong className="arena-player-name">{p.name}</strong>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                          <span>⚡ {p.energyTokens} ET</span>
                          <span>💎 {p.crystals}/3</span>
                          {p.poisonCards > 0 && <span style={{ color: '#39ff14' }}>☠️ {p.poisonCards}</span>}
                        </div>
                      </div>

                      <div className="arena-score-val-block">
                        <span className="arena-lp-number" style={{ color: p.hp < 30 ? '#ff3366' : '#00f0ff' }}>
                          {p.hp}
                        </span>
                        <span className="arena-lp-tag">HP</span>
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
                <span>10 ACTION CARDS ZONE</span>
              </button>
            </div>

            {/* Active Status Effects Panel */}
            <div className="arena-panel active-effects-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">{activePlayer.name}'s ACTIVE STATUS</span>
              </div>

              <div className="effects-icons-row">
                <button
                  className="effect-chip effect-poison"
                  onClick={() => setSelectedEffectInfo({ name: 'Poison Stacks', desc: 'Deals -10 HP per stack at the start of each turn. Accumulating 5 poison cards transforms you into a Zombie!', count: `${activePlayer.poisonCards || 0}` })}
                >
                  <Skull size={15} color="#39ff14" />
                  <span className="effect-name">Poison</span>
                  <span className="effect-count">{activePlayer.poisonCards || 0}</span>
                </button>

                <button
                  className="effect-chip effect-shield"
                  onClick={() => setSelectedEffectInfo({ name: 'Shield Barrier', desc: 'Absorbs incoming attack damage before your HP is reduced.', count: `+${activePlayer.shield || 0}` })}
                >
                  <Shield size={15} color="#00f0ff" />
                  <span className="effect-name">Shield</span>
                  <span className="effect-count">+{activePlayer.shield || 0}</span>
                </button>

                <button
                  className="effect-chip effect-atk"
                  onClick={() => setSelectedEffectInfo({ name: 'Energy Tokens', desc: 'Fuel used for attacks and action cards. Claim +1 ET at the start of your turn (Max 10).', count: `${activePlayer.energyTokens}` })}
                >
                  <Zap size={15} color="#ffd700" />
                  <span className="effect-name">ET Fuel</span>
                  <span className="effect-count">{activePlayer.energyTokens}</span>
                </button>

                {activePlayer.hp >= GAME_LIMITS.LEVEL_2_HP && (
                  <button
                    className="effect-chip"
                    style={{ borderColor: '#a855f7', background: 'rgba(168, 85, 247, 0.15)' }}
                    onClick={() => setSelectedEffectInfo({ name: 'Level 2 Unlocked', desc: 'Having 150+ HP empowers your character with Level 2 advanced attack cards!', count: 'LVL 2' })}
                  >
                    <Sparkles size={15} color="#a855f7" />
                    <span className="effect-name">Level Up</span>
                    <span className="effect-count">LV 2</span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Center Column: Combat Orbit & Full-Art Hero Card */}
          <main className="arena-col-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div className="combat-orbit-stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', paddingBottom: '4px' }}>
              {/* Perfect Round Turn Orbit Circle (Grand, Responsive & Balanced) */}
              <div
                className="arena-orbit-ring"
                style={{
                  position: 'relative',
                  width: '320px',
                  height: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '4px 0 2px 0'
                }}
              >
                {/* True Circular Orbit Rings SVG */}
                <svg viewBox="0 0 320 320" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
                  <circle cx="160" cy="160" r="125" fill="rgba(0, 240, 255, 0.02)" stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1.5" strokeDasharray="5 4" />
                  <circle cx="160" cy="160" r="55" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="1" />
                </svg>

                {/* Seated Warriors around the Perfect Circle */}
                {players.map((p, i) => {
                  const angleDeg = (360 / players.length) * i - 90;
                  const radius = 125;
                  const x = Math.cos(angleDeg * (Math.PI / 180)) * radius;
                  const y = Math.sin(angleDeg * (Math.PI / 180)) * radius;
                  const isActive = i === activeIdx;
                  const realChar = CHARACTERS[p.characterId] || CHARACTERS.chynaman;

                  return (
                    <div
                      key={p.id}
                      className={`orbit-fighter-node ${isActive ? 'fighter-active' : ''}`}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) ${isActive ? 'scale(1.22)' : 'scale(0.95)'}`,
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: isActive ? 10 : 5
                      }}
                    >
                      {/* Player Seat Number */}
                      <div
                        className={`fighter-pill pill-${i + 1}`}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.68rem',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          zIndex: 3
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Circular Avatar Frame */}
                      <div
                        className={`fighter-avatar-frame ${p.isZombie ? 'ring-green' : 'ring-blue'}`}
                        style={{
                          borderColor: p.isZombie ? '#39ff14' : (isActive ? '#00f0ff' : realChar.themeColor),
                          boxShadow: isActive ? '0 0 18px #00f0ff, 0 0 28px rgba(0,240,255,0.45)' : (p.isZombie ? '0 0 14px #39ff14' : 'none'),
                          overflow: 'hidden',
                          width: '58px',
                          height: '58px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(2, 6, 20, 0.92)',
                          borderWidth: isActive ? '2.5px' : '1.5px'
                        }}
                      >
                        <img
                          src={getAssetUrl(realChar.image || 'characters/chynaman.png')}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      
                      {/* Compact, Clean, High-Contrast Stat Strip */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-14px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#071226',
                          border: isActive ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.22)',
                          borderRadius: '8px',
                          padding: '2px 7px',
                          fontSize: '0.68rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.9)',
                          zIndex: 3
                        }}
                      >
                        <span style={{ color: '#ffd700', fontWeight: 'bold' }}>⚡{p.energyTokens}</span>
                        <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>💎{p.crystals}</span>
                        {p.poisonCards > 0 && (
                          <span style={{ color: '#39ff14', fontWeight: 'bold' }}>☠️{p.poisonCards}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Massive Full-Art Combat Hero Card anchored gracefully */}
              <div
                className="hero-combat-card"
                style={{
                  position: 'relative',
                  width: '350px',
                  height: '445px',
                  marginTop: 'auto',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  border: isZombie ? '2.5px solid #39ff14' : `2.5px solid ${activeChar.themeColor || 'var(--neon-cyan)'}`,
                  boxShadow: isZombie ? '0 0 35px rgba(57, 255, 20, 0.45)' : '0 20px 50px rgba(0,0,0,0.9), 0 0 35px rgba(0, 240, 255, 0.35)',
                  background: isZombie ? 'linear-gradient(180deg, #091a04 0%, #030a01 100%)' : 'linear-gradient(180deg, #0f2248 0%, #050b18 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Full-Card Background Artwork (Perfectly masked to rounded container) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '22px',
                    background: activeChar.bgGradient || 'none'
                  }}
                >
                  <img
                    src={getAssetUrl((CHARACTERS[activePlayer?.characterId] || CHARACTERS.chynaman).image || 'characters/chynaman.png')}
                    alt={activeChar?.name || 'Warrior'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center 15%',
                      borderRadius: '22px',
                      filter: isZombie ? 'hue-rotate(90deg) saturate(1.4) drop-shadow(0 0 20px rgba(57,255,20,0.8))' : 'drop-shadow(0 0 20px rgba(0,0,0,0.8))'
                    }}
                  />

                  {/* Dark gradient scrim at the bottom for legibility */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '22px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.08) 40%, rgba(3,7,18,0.92) 74%, rgba(3,7,18,1) 100%)'
                    }}
                  />

                  {floatingDamage && (
                    <div className={`floating-combat-popup ${floatingDamage.type}`} style={{ zIndex: 10 }}>
                      {floatingDamage.text}
                    </div>
                  )}
                </div>

                {/* Top Card Header */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(6px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                    borderTopLeftRadius: '22px',
                    borderTopRightRadius: '22px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="hero-card-num-pill" style={{ background: '#00f0ff', color: '#000', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                      {activeIdx + 1}
                    </div>
                    <strong style={{ fontSize: '1.02rem', color: '#fff', letterSpacing: '0.5px' }}>
                      {activePlayer.name} {isZombie && '(ZOMBIE)'}
                    </strong>
                  </div>
                  <div style={{ fontSize: '1.3rem', color: 'var(--neon-gold)' }}>
                    {isZombie ? '☣️' : '❖'}
                  </div>
                </div>

                {/* Bottom Overlay: Stats & Quick Moves */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderBottomLeftRadius: '22px',
                    borderBottomRightRadius: '22px'
                  }}
                >
                  {/* Stats Row (HP & Defense Power) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      style={{
                        background: 'rgba(255, 51, 102, 0.25)',
                        border: '1px solid rgba(255, 51, 102, 0.6)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Heart size={15} color="var(--neon-pink)" fill="var(--neon-pink)" />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>HP</span>
                      </div>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{activePlayer.hp} / {activePlayer.maxHP}</strong>
                    </div>

                    <div
                      style={{
                        background: 'rgba(0, 240, 255, 0.2)',
                        border: '1px solid rgba(0, 240, 255, 0.5)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={15} color="var(--neon-cyan)" />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>DP</span>
                      </div>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>-{activeChar.defaultDP || 0} AP</strong>
                    </div>
                  </div>

                  {/* Interactive Moves List / Quick Attack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeChar.moves?.slice(0, 2).map(move => (
                      <button
                        key={move.id}
                        onClick={() => handleInitiateCombat({
                          attacker: activePlayer,
                          defender: defaultTarget,
                          actionCard: { id: 'atk_basic', name: 'Attack', costET: 0 },
                          characterMove: move
                        })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.09)',
                          border: '1px solid rgba(255, 255, 255, 0.22)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.86rem' }}>⚔️ {move.name}</span>
                        <span style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 'bold' }}>
                          {move.type === 'dice_mult' ? `🎲 × ${move.multiplier}` : `${move.baseAP} AP`} ({move.costET} ET)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Single-Row Unified Combat Action Deck */}
              <div
                className="hand-cards-deck"
                style={{
                  margin: '18px 0 6px 0',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.2fr 1.1fr 0.9fr',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '680px'
                }}
              >
                <button
                  className="btn-play-card-cta"
                  onClick={() => setShowCardActionModal(true)}
                  style={{ padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #00f0ff, #0077ff)', color: '#000', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Swords size={16} />
                  <span>PLAY ACTION CARD</span>
                </button>

                <button
                  className="btn-play-card-cta"
                  onClick={() => handleInitiateCombat({
                    attacker: activePlayer,
                    defender: defaultTarget,
                    actionCard: { id: 'atk_basic', name: 'Attack', costET: 0 },
                    characterMove: activeChar.moves?.[0] || { name: 'Basic Attack', baseAP: 25, type: 'flat' }
                  })}
                  style={{ padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #ff0055, #ff5500)', color: '#fff', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Dices size={16} />
                  <span>ROLL COMBAT DICE</span>
                </button>

                <button
                  className="btn-play-card-cta"
                  onClick={() => {
                    pushStateSnapshot();
                    const updated = players.map((p, idx) => {
                      if (idx === activeIdx) {
                        const nextZombie = !p.isZombie;
                        return {
                          ...p,
                          isZombie: nextZombie,
                          poisonCards: nextZombie ? Math.max(5, p.poisonCards || 5) : 0,
                          hp: nextZombie ? 40 : (p.preZombieHP || 100)
                        };
                      }
                      return p;
                    });
                    setGameState({
                      ...gameState,
                      players: updated,
                      zombieTransformationAlert: !activePlayer.isZombie ? { player: activePlayer.name, poisonCount: 5 } : null
                    });
                  }}
                  style={{ padding: '12px 8px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #39ff14, #008800)', color: '#000', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Skull size={16} />
                  <span>{activePlayer.isZombie ? 'CURE ZOMBIE' : 'ACTIVATE ZOMBIE'}</span>
                </button>

                <button
                  className="btn-play-card-cta"
                  onClick={() => {
                    handleApplyInstantEffect({
                      type: 'poison',
                      sourcePlayerId: activePlayer.id,
                      targetPlayerId: defaultTarget?.id || players.find(p => p.id !== activePlayer?.id)?.id,
                      costET: 0,
                      amount: 1
                    });
                  }}
                  style={{ padding: '12px 8px', fontSize: '0.82rem', background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                  title="Add 1 Poison card to target opponent"
                >
                  <Skull size={14} /> +1 POISON
                </button>
              </div>
            </div>
          </main>

          {/* Right Column: Live Match Log & Real-time Action Preview */}
          <aside className="arena-col-right">
            <div className="arena-panel match-history-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">REAL-TIME MATCH LOGS</span>
              </div>

              <div className="history-entries-list">
                {matchLogs.slice(0, 6).map((log, i) => (
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
                {matchLogs.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>
                    Match has begun. Take your action!
                  </div>
                )}
              </div>

              <button className="btn-view-full-history" onClick={() => setShowFullHistoryModal(true)}>
                <ScrollText size={15} />
                <span>COMPLETE MATCH HISTORY</span>
              </button>
            </div>

            {/* Quick GDD Rules Guide Card */}
            <div className="arena-panel turn-action-panel">
              <div className="panel-title-bar">
                <span className="panel-kicker">GDD RULES QUICK REFERENCE</span>
              </div>

              <div className="turn-action-content" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>• <strong>2-Dice Defense</strong>: Defender rolls $\ge 6$ on 2 Gold dice to trigger DP armor.</div>
                <div>• <strong>Zombie Mode</strong>: 5+ Poison cards transforms you into an Undead with 40 HP & auto-regen.</div>
                <div>• <strong>Victory</strong>: First warrior to capture 3 Stability Crystals wins the universe!</div>
                <button
                  onClick={() => setShowRulesChatOverlay(true)}
                  style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    padding: '8px',
                    borderRadius: '6px',
                    marginTop: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare size={14} /> ASK RULES ASSISTANT AI
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Arena Controls Bar */}
        <footer className="arena-bottom-controls">
          <div className="bottom-left-buttons">
            <button
              className="btn-arena-chat"
              onClick={() => setShowLocalChat(true)}
              style={{
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1.5px solid #00f0ff',
                color: '#00f0ff',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
                fontWeight: 'bold',
                padding: '8px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={16} />
              <span>💬 Match Chat (Local)</span>
            </button>
          </div>

          <div className="bottom-right-actions">
            <button className="btn-end-turn-cta" onClick={handleEndTurn}>
              <span>END TURN ({activePlayer.name})</span>
            </button>
          </div>
        </footer>

        {/* Local Match Chat Modal */}
        {showLocalChat && (
          <LocalMatchChatModal
            players={players}
            activePlayerIndex={activeIdx}
            chatMessages={localChatMessages}
            onSendMessage={(newMsg) => setLocalChatMessages(prev => [...prev, newMsg])}
            onClose={() => setShowLocalChat(false)}
          />
        )}

        {/* Action Selection Modal */}
        {showCardActionModal && (
          <CardActionModal
            activePlayer={activePlayer}
            allPlayers={players}
            onClose={() => setShowCardActionModal(false)}
            onInitiateCombat={handleInitiateCombat}
            onApplyInstantEffect={handleApplyInstantEffect}
            onOpenKontrol={(atk, targetId) => setActiveKontrolData({ attacker: atk, initialTargetId: targetId })}
            onOpenBlitz={(atk) => setActiveBlitzData({ attacker: atk })}
            onOpenRetreat={(atk) => setActiveRetreatData({ attacker: atk })}
          />
        )}

        {/* 10 Action Cards Deck Modal */}
        {showCardZoneModal && (
          <div className="arena-modal-backdrop" onClick={() => setShowCardZoneModal(false)}>
            <div className="arena-modal-card card-zone-full-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <div className="modal-title-wrap">
                  <Layers size={20} color="var(--neon-cyan)" />
                  <h3>OFFICIAL ACTION CARDS ZONE (10 CARDS)</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setShowCardZoneModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-cards-grid-10">
                {ACTION_CARDS.map(card => (
                  <div
                    key={card.id}
                    className="playable-card-item"
                    style={{ borderColor: card.color || 'var(--neon-cyan)' }}
                    onClick={() => {
                      setShowCardZoneModal(false);
                      setShowCardActionModal(true);
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
                      <span>SELECT TO PLAY</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Dice Roller Modal */}
        {activeDiceCombatData && (
          <DiceRollerModal
            combatData={activeDiceCombatData}
            onCombatComplete={handleCompleteCombatResolution}
            onClose={() => setActiveDiceCombatData(null)}
          />
        )}

        {/* Kontrol Modal */}
        {activeKontrolData && (
          <KontrolModal
            attacker={activeKontrolData.attacker}
            allPlayers={players}
            initialTargetId={activeKontrolData.initialTargetId}
            onClose={() => setActiveKontrolData(null)}
            onCompleteKontrol={handleCompleteKontrol}
          />
        )}

        {/* Blitz Modal */}
        {activeBlitzData && (
          <BlitzModal
            attacker={activeBlitzData.attacker}
            allPlayers={players}
            onClose={() => setActiveBlitzData(null)}
            onCompleteBlitz={handleCompleteBlitz}
          />
        )}

        {/* Retreat Modal */}
        {activeRetreatData && (
          <RetreatModal
            player={activeRetreatData.attacker}
            onClose={() => setActiveRetreatData(null)}
            onCompleteRetreat={handleCompleteRetreat}
          />
        )}

        {/* Rules Chatbot In-Game Overlay */}
        {showRulesChatOverlay && (
          <div className="arena-modal-backdrop" onClick={() => setShowRulesChatOverlay(false)}>
            <div
              className="arena-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{ width: '92%', maxWidth: '900px', height: '85vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <Chat onBack={() => setShowRulesChatOverlay(false)} isOverlay={true} />
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

                <button
                  className="menu-opt-btn"
                  onClick={() => {
                    setShowInGameMenu(false);
                    setShowRulesChatOverlay(true);
                  }}
                >
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
