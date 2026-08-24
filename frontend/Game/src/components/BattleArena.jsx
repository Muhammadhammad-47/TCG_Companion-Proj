import React, { useState, useEffect } from 'react';
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters';
import { ACTION_CARDS, GAME_LIMITS } from '../data/cards';
import { advanceTurn } from '../utils/gameEngine';
import { soundFX } from '../utils/audio';
import CardActionModal from './CardActionModal';
import DiceRollerModal from './DiceRollerModal';
import KontrolModal from './KontrolModal';
import BlitzModal from './BlitzModal';
import RetreatModal from './RetreatModal';
import WinnerModal from './WinnerModal';
import { 
  Swords, Undo2, Menu, Shield, Skull, Zap, Gem, 
  Clock, Play, Pause, Flame, Sparkles, ArrowRight, 
  RotateCw, MessageSquare, Eye 
} from 'lucide-react';

export default function BattleArena({
  gameState,
  setGameState,
  historyStack,
  setHistoryStack,
  tvMode,
  onRematch,
  onOpenNewMatch
}) {
  const [activeCombatData, setActiveCombatData] = useState(null);
  const [activeKontrolData, setActiveKontrolData] = useState(null);
  const [activeBlitzData, setActiveBlitzData] = useState(null);
  const [activeRetreatData, setActiveRetreatData] = useState(null);
  const [selectedPlayerForAction, setSelectedPlayerForAction] = useState(null);
  const [lastActionResult, setLastActionResult] = useState(null);

  const [turnDuration, setTurnDuration] = useState(gameState?.turnDuration || 60);
  const [timeLeft, setTimeLeft] = useState(gameState?.turnDuration || 60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const activeChar = CHARACTERS[activePlayer.characterId] || CHARACTERS.chynaman;

  // Countdown timer
  useEffect(() => {
    if (turnDuration <= 0 || isTimerPaused || !!gameState.winner) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          soundFX.playTurnWarning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turnDuration, isTimerPaused, gameState.turnNumber, gameState.activePlayerIndex, gameState.winner]);

  useEffect(() => {
    setTimeLeft(turnDuration);
  }, [gameState.turnNumber, gameState.activePlayerIndex, turnDuration]);

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

  const handleAdjustHP = (playerId, delta) => {
    pushStateSnapshot();
    if (delta > 0) soundFX.playHeal();
    else soundFX.playDamage();

    const updated = gameState.players.map(p => {
      if (p.id === playerId) {
        const maxHP = p.isZombie ? ZOMBIE_PROFILE.baseHP : 150;
        const newHP = Math.min(maxHP, Math.max(0, p.hp + delta));
        return { ...p, hp: newHP };
      }
      return p;
    });

    setGameState({ ...gameState, players: updated });
  };

  const handleClaimTurnET = () => {
    if (activePlayer.claimedTurnET || activePlayer.energyTokens >= GAME_LIMITS.MAX_ET) return;
    pushStateSnapshot();
    soundFX.playEnergy();

    const updated = gameState.players.map(p => {
      if (p.id === activePlayer.id) {
        return {
          ...p,
          energyTokens: Math.min(GAME_LIMITS.MAX_ET, p.energyTokens + 1),
          claimedTurnET: true
        };
      }
      return p;
    });

    setGameState({ ...gameState, players: updated });
  };

  const handleEndTurn = () => {
    pushStateSnapshot();
    soundFX.playCard();
    const nextState = advanceTurn(gameState);
    setGameState(nextState);
  };

  const handleCombatComplete = ({ combatData, result }) => {
    pushStateSnapshot();
    const { attacker, defender, characterMove, actionCard } = combatData;
    const totalETCost = (actionCard?.costET || 0) + (characterMove?.costET || 0);

    let winnerFound = null;

    const updatedPlayers = gameState.players.map(p => {
      if (p.id === attacker.id) {
        return {
          ...p,
          energyTokens: Math.max(0, p.energyTokens - totalETCost),
          stats: {
            ...p.stats,
            damageDealt: p.stats.damageDealt + result.damageDealt,
            cardsPlayed: p.stats.cardsPlayed + 1
          }
        };
      }

      if (p.id === defender.id) {
        let newHP = Math.max(0, p.hp - result.damageDealt);
        let updatedDef = {
          ...p,
          hp: newHP,
          stats: {
            ...p.stats,
            damageTaken: p.stats.damageTaken + result.damageDealt
          }
        };

        if (result.poisonApplied) {
          updatedDef.poisonCards = Math.min(10, updatedDef.poisonCards + 1);
        }

        if (newHP <= 0) {
          soundFX.playDefeat();
          const attackerPlayer = gameState.players.find(pl => pl.id === attacker.id);
          const newAttackerCrystals = (attackerPlayer?.crystals || 0) + 1;
          if (newAttackerCrystals >= (attackerPlayer?.targetCrystals || 1)) {
            winnerFound = attackerPlayer;
          }
        }

        return updatedDef;
      }

      return p;
    });

    const summaryText = `${attacker.name} activated ${characterMove.name} against ${defender.name}! Result: ${result.damageDealt} Net Damage${result.mitigatedByDP > 0 ? ` (-${result.mitigatedByDP} DP)` : ''}${result.poisonApplied ? ' (Poison Applied)' : ''}.`;

    setLastActionResult({
      attackerName: attacker.name,
      defenderName: defender.name,
      moveName: characterMove.name,
      damage: result.damageDealt,
      mitigated: result.mitigatedByDP,
      poison: result.poisonApplied
    });

    setActiveCombatData(null);
    setSelectedPlayerForAction(null);

    setGameState({
      ...gameState,
      players: updatedPlayers,
      winner: winnerFound || gameState.winner,
      history: [...gameState.history, { turn: gameState.turnNumber, text: summaryText }]
    });
  };

  const handleInitiateCardPlay = (payload) => {
    const { actionCard, characterMove, targetPlayer, isAmplify } = payload;
    const attacker = selectedPlayerForAction;

    if (actionCard.id === 'kontrol_card') {
      setActiveKontrolData({ attacker, target: targetPlayer });
      return;
    }
    if (actionCard.id === 'blitz_card') {
      setActiveBlitzData({ attacker, allPlayers: gameState.players });
      return;
    }
    if (actionCard.id === 'retreat_card') {
      setActiveRetreatData({ player: attacker });
      return;
    }

    setActiveCombatData({
      attacker,
      defender: targetPlayer,
      characterMove,
      actionCard,
      isAmplify
    });
  };

  const sortedPlayers = [...gameState.players].sort((a, b) => (b.crystals - a.crystals) || (b.hp - a.hp));
  const otherPlayers = gameState.players.filter(p => p.id !== activePlayer.id);

  return (
    <div className="img-arena-container">
      {/* Top Header Bar matching Image 3 */}
      <header className="img-arena-header">
        <div className="img-header-left">
          <span className="img-live-sparkle">✦</span>
          <h2 className="img-live-title">LIVE MATCH</h2>
          <span className="img-format-tag">• Standard Format</span>
        </div>

        <div className="img-header-center">
          <div className="img-turn-badge-capsule">
            <span className="turn-icon">🎲</span>
            <span className="turn-label">TURN</span>
            <span className="turn-val">{gameState.turnNumber}</span>
          </div>

          {turnDuration > 0 && (
            <div className={`img-header-timer-pill ${timeLeft <= 10 ? 'crit-time' : ''}`}>
              <Clock size={13} />
              <span>{isTimerPaused ? 'PAUSED' : `${timeLeft}s`}</span>
            </div>
          )}
        </div>

        <div className="img-header-right">
          <button
            className="img-header-btn"
            onClick={handleUndo}
            disabled={!historyStack.length}
            title="Undo Last Action"
          >
            <Undo2 size={15} /> UNDO
          </button>

          {onOpenNewMatch && (
            <button
              className="img-header-btn btn-menu-dialog"
              onClick={onOpenNewMatch}
              title="Menu / End Match Options"
            >
              <Menu size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main 3-Column Tabletop Arena Grid matching Image 3 */}
      <div className="img-arena-3col-grid">
        {/* Left Column: Scoreboard (LP/HP) & Active Effects */}
        <div className="img-col-panel img-col-left">
          {/* Scoreboard Box */}
          <div className="img-scoreboard-box">
            <div className="img-panel-title-row">
              <span className="title-text">SCOREBOARD (HP)</span>
            </div>

            <div className="img-score-items-list">
              {sortedPlayers.map((p, idx) => {
                const char = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                const isActive = p.id === activePlayer.id;
                return (
                  <div key={p.id} className={`img-scoreboard-row ${isActive ? 'active-hero' : ''}`}>
                    <span className={`img-rank-num-badge ${idx === 0 ? 'first' : ''}`}>{idx + 1}</span>

                    <div className="img-row-avatar-box" style={{ borderColor: char.themeColor }}>
                      <span>{p.isZombie ? '🧟‍♂️' : char.avatar}</span>
                    </div>

                    <div className="img-row-name-col">
                      <strong className="p-name">{p.name}</strong>
                      <span className="p-char">{char.name}</span>
                    </div>

                    <div className="img-row-score-col">
                      <strong className="p-hp-num">{p.hp}</strong>
                      {idx === 0 && <span className="crown-icon">👑</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="img-view-zone-strip">
              <span>🗂️ VIEW CARD ZONE</span>
            </div>
          </div>

          {/* Active Effects Box */}
          <div className="img-active-effects-box">
            <span className="effects-title">ACTIVE EFFECTS</span>
            <div className="img-effects-grid">
              <div className="effect-cell">
                <Skull size={14} color="#e11d48" />
                <span className="eff-name">Poison</span>
                <strong className="eff-val">{gameState.players.reduce((a, b) => a + b.poisonCards, 0)}</strong>
              </div>
              <div className="effect-cell">
                <span className="eff-icon">🧪</span>
                <span className="eff-name">Antidote</span>
                <strong className="eff-val">1</strong>
              </div>
              <div className="effect-cell">
                <Swords size={14} color="#e11d48" />
                <span className="eff-name">Attack</span>
                <strong className="eff-val">+500</strong>
              </div>
              <div className="effect-cell">
                <Shield size={14} color="#38bdf8" />
                <span className="eff-name">Shield</span>
                <strong className="eff-val">+{gameState.players.reduce((a, b) => a + (b.shield || 0), 0)}</strong>
              </div>
              <div className="effect-cell">
                <Zap size={14} color="#ffe600" />
                <span className="eff-name">Stun</span>
                <strong className="eff-val">{gameState.players.filter(p => p.isStunned).length}</strong>
              </div>
            </div>
            <span className="eff-hint">Tap an effect for details</span>
          </div>

          {/* Bottom Live Tools */}
          <div className="img-left-bottom-tools">
            <div className="tool-pill"><MessageSquare size={13} /> Match Chat</div>
            <div className="tool-pill"><Eye size={13} /> 4 Watching</div>
          </div>
        </div>

        {/* Center Column: Circular Tabletop Orbit & Active Card Stage */}
        <div className="img-col-panel img-col-center">
          {/* Circular Tabletop Orbit Arena matching Image 3 */}
          <div className="img-tabletop-orbit-stage">
            {/* Top Orbit Node */}
            {gameState.players[0] && (
              <div className={`img-orbit-player-pin pin-top ${activePlayer.id === gameState.players[0].id ? 'pin-active' : ''}`}>
                <span className="pin-badge">1</span>
                <div className="pin-avatar">{CHARACTERS[gameState.players[0].characterId]?.avatar}</div>
                <span className="pin-name">{gameState.players[0].name}</span>
              </div>
            )}

            {/* Right Orbit Node */}
            {gameState.players[1] && (
              <div className={`img-orbit-player-pin pin-right ${activePlayer.id === gameState.players[1].id ? 'pin-active' : ''}`}>
                <span className="pin-badge">2</span>
                <div className="pin-avatar">{CHARACTERS[gameState.players[1].characterId]?.avatar}</div>
                <span className="pin-name">{gameState.players[1].name}</span>
                <span className="pin-shield-tag">+300</span>
              </div>
            )}

            {/* Bottom Orbit Node */}
            {gameState.players[2] && (
              <div className={`img-orbit-player-pin pin-bottom ${activePlayer.id === gameState.players[2].id ? 'pin-active' : ''}`}>
                <span className="pin-badge">3</span>
                <div className="pin-avatar">{CHARACTERS[gameState.players[2].characterId]?.avatar}</div>
                <span className="pin-name">{gameState.players[2].name}</span>
                <span className="pin-atk-tag">+500</span>
              </div>
            )}

            {/* Left Orbit Node */}
            {gameState.players[3] && (
              <div className={`img-orbit-player-pin pin-left ${activePlayer.id === gameState.players[3].id ? 'pin-active' : ''}`}>
                <span className="pin-badge">4</span>
                <div className="pin-avatar">{CHARACTERS[gameState.players[3].characterId]?.avatar}</div>
                <span className="pin-name">{gameState.players[3].name}</span>
                <span className="pin-poison-tag">☠️ {gameState.players[3].poisonCards}</span>
              </div>
            )}

            {/* Center Active Player Combat Card matching Image 3 */}
            <div className="img-center-combat-card" style={{ '--active-border': activeChar.themeColor }}>
              <div className="card-top-header">
                <span className="card-rank-badge">1</span>
                <strong className="card-player-name">{activePlayer.name}</strong>
                <span className="card-top-icon">👑</span>
              </div>

              <div className="card-portrait-box">
                <span className="portrait-emoji">{activePlayer.isZombie ? '🧟‍♂️' : activeChar.avatar}</span>
              </div>

              <div className="card-power-stats-row">
                <div className="power-box atk">
                  <span className="p-lbl">⚔️ HP / HEALTH</span>
                  <strong className="p-val">{activePlayer.hp}</strong>
                </div>
                <div className="power-box def">
                  <span className="p-lbl">🛡️ DP (6+)</span>
                  <strong className="p-val">-{activeChar.defaultDP} AP</strong>
                </div>
              </div>

              <div className="card-technique-desc">
                <strong>{activeChar.moves[0]?.name || 'Signature Strike'}:</strong>
                <span>{activeChar.moves[0]?.desc || 'Deal damage to target.'}</span>
              </div>

              {/* Status Row */}
              <div className="card-status-badges-strip">
                <span className="badge-pill poison">☠️ {activePlayer.poisonCards}/10</span>
                <span className="badge-pill et">⚡ {activePlayer.energyTokens}/10 ET</span>
                <span className="badge-pill crystals">💎 {activePlayer.crystals}/3</span>
                {!activePlayer.claimedTurnET && activePlayer.energyTokens < 10 && (
                  <button className="badge-pill claim-et-btn" onClick={handleClaimTurnET}>
                    +1 ET
                  </button>
                )}
              </div>

              {/* Quick HP Adjust Buttons */}
              <div className="card-quick-hp-row">
                <button className="btn-hp-q dmg" onClick={() => handleAdjustHP(activePlayer.id, -10)}>-10</button>
                <button className="btn-hp-q dmg" onClick={() => handleAdjustHP(activePlayer.id, -5)}>-5</button>
                <button className="btn-hp-q heal" onClick={() => handleAdjustHP(activePlayer.id, +10)}>+10</button>
                <button className="btn-hp-q heal" onClick={() => handleAdjustHP(activePlayer.id, +20)}>+20</button>
              </div>

              {/* Play Action Button */}
              <button
                className="img-btn-play-card-action"
                onClick={() => {
                  soundFX.playCard();
                  setSelectedPlayerForAction(activePlayer);
                }}
              >
                <Swords size={18} />
                <span>PLAY ACTION CARD</span>
              </button>
            </div>
          </div>

          {/* Bottom Tabletop Area with Cards Hand & End Turn matching Image 3 */}
          <div className="img-tabletop-bottom-dock">
            <div className="img-your-turn-label">
              <span>« YOUR TURN »</span>
            </div>

            {/* Hand of 10 Card Backs */}
            <div className="img-hand-cards-row">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="img-card-back-item" title={`Card ${i + 1} in Hand`}>
                  <div className="card-back-pattern">✦</div>
                </div>
              ))}
            </div>

            {/* End Turn Capsule Button */}
            <button className="img-btn-end-turn-capsule" onClick={handleEndTurn}>
              <span>END TURN</span>
            </button>
          </div>
        </div>

        {/* Right Column: Match History & Turn Action Result */}
        <div className="img-col-panel img-col-right">
          {/* Match History Box */}
          <div className="img-history-box">
            <div className="img-panel-title-row">
              <span className="title-text">MATCH HISTORY</span>
            </div>

            <div className="img-history-feed-list">
              {gameState.history.slice().reverse().map((h, idx) => (
                <div key={idx} className="img-history-row-item">
                  <div className="h-avatar-box">🎴</div>
                  <div className="h-text-col">
                    <span className="h-turn-lbl">Turn {h.turn}</span>
                    <span className="h-action-text">{h.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="img-view-zone-strip">
              <span>🗂️ VIEW FULL HISTORY</span>
            </div>
          </div>

          {/* Turn Action Outcome Card matching Image 3 */}
          {lastActionResult && (
            <div className="img-turn-action-card">
              <span className="turn-action-title">TURN {gameState.turnNumber} ACTION</span>
              <div className="turn-action-body">
                <div className="action-actors">
                  <strong>{lastActionResult.attackerName}</strong>
                  <span>{lastActionResult.moveName}</span>
                </div>
                <div className="action-target">
                  <span>➔ {lastActionResult.defenderName}</span>
                  <p>Deals <strong>{lastActionResult.damage}</strong> damage{lastActionResult.poison ? ' and applies Poison.' : '.'}</p>
                </div>
                <div className="action-result-pill">
                  <span className="res-lbl">RESULT</span>
                  <span className="res-val">☠️ 1 ➔ ☠️ 2</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Pairing Modal */}
      {selectedPlayerForAction && (
        <CardActionModal
          activePlayer={selectedPlayerForAction}
          allPlayers={gameState.players}
          onClose={() => setSelectedPlayerForAction(null)}
          onInitiateCombat={({ attacker, defender, actionCard, characterMove, amplifyBonus }) => {
            setSelectedPlayerForAction(null);
            setActiveCombatData({
              attacker,
              defender,
              actionCard,
              characterMove,
              isAmplify: !!amplifyBonus
            });
          }}
          onApplyInstantEffect={({ type, sourcePlayerId, targetPlayerId, costET, amount, amplifyChoice }) => {
            setSelectedPlayerForAction(null);
            pushStateSnapshot();
            soundFX.playCard();
            const updated = gameState.players.map(p => {
              if (p.id === sourcePlayerId && costET > 0) {
                p.energyTokens = Math.max(0, p.energyTokens - costET);
              }
              if (type === 'heal' && p.id === targetPlayerId) {
                p.hp = Math.min(150, p.hp + (amount || 30));
              }
              if (type === 'shield' && p.id === targetPlayerId) {
                p.shield = (p.shield || 0) + (amount || 30);
              }
              if (type === 'poison' && p.id === targetPlayerId) {
                p.poisonCards = Math.min(10, p.poisonCards + (amount || 1));
              }
              if (type === 'antidote' && p.id === targetPlayerId) {
                p.poisonCards = Math.max(0, p.poisonCards - 1);
                p.hp = Math.min(150, p.hp + 20);
              }
              if (type === 'amplify' && p.id === targetPlayerId) {
                if (amplifyChoice === 'hp') p.hp = Math.min(150, p.hp + 20);
                if (amplifyChoice === 'dp') p.shield = (p.shield || 0) + 10;
              }
              return p;
            });
            setGameState({
              ...gameState,
              players: updated,
              history: [...gameState.history, { turn: gameState.turnNumber, text: `${activePlayer.name} played ${type.toUpperCase()} card!` }]
            });
          }}
          onOpenKontrol={(attacker, targetId) => {
            setSelectedPlayerForAction(null);
            const target = gameState.players.find(p => p.id === targetId);
            setActiveKontrolData({ attacker, target });
          }}
          onOpenBlitz={(attacker) => {
            setSelectedPlayerForAction(null);
            setActiveBlitzData({ attacker, allPlayers: gameState.players });
          }}
          onOpenRetreat={(player) => {
            setSelectedPlayerForAction(null);
            setActiveRetreatData({ player });
          }}
        />
      )}

      {/* 2-Dice Roller Modal */}
      {activeCombatData && (
        <DiceRollerModal
          combatData={activeCombatData}
          onComplete={handleCombatComplete}
          onClose={() => setActiveCombatData(null)}
        />
      )}

      {/* Special Modals */}
      {activeKontrolData && (
        <KontrolModal
          attacker={activeKontrolData.attacker}
          target={activeKontrolData.target}
          onComplete={() => setActiveKontrolData(null)}
          onClose={() => setActiveKontrolData(null)}
        />
      )}

      {activeBlitzData && (
        <BlitzModal
          attacker={activeBlitzData.attacker}
          allPlayers={activeBlitzData.allPlayers}
          onComplete={() => setActiveBlitzData(null)}
          onClose={() => setActiveBlitzData(null)}
        />
      )}

      {activeRetreatData && (
        <RetreatModal
          player={activeRetreatData.player}
          onComplete={() => setActiveRetreatData(null)}
          onClose={() => setActiveRetreatData(null)}
        />
      )}

      {/* Winner Victory Modal matching Image 4 */}
      {gameState.winner && (
        <WinnerModal
          winner={gameState.winner}
          players={gameState.players}
          turnNumber={gameState.turnNumber}
          onRematch={onRematch}
          onHome={onOpenNewMatch}
        />
      )}
    </div>
  );
}
