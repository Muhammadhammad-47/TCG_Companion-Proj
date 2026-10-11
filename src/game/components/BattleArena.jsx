import React, { useState, useEffect, useRef } from 'react';
import { CHARACTERS, ZOMBIE_PROFILE, getAssetUrl } from '../data/characters';
import { ACTION_CARDS, GAME_LIMITS } from '../data/cards';
import { resolveDiceCombat, advanceTurn, checkZombieStatus, drawRandomCards } from '../utils/gameEngine';
import { tradeWithAlly } from '../kontrola/KontrolaEngine';
import { soundFX } from '../utils/audio';
import { createGameRoom, updateGameRoom } from '../../services/roomService';
import WinnerModal from './WinnerModal';
import DiceRollerModal from './DiceRollerModal';
import CardActionModal from './CardActionModal';
import KontrolModal from './KontrolModal';
import BlitzModal from './BlitzModal';
import RetreatModal from './RetreatModal';
import TauntModal from './TauntModal';
import CharacterCardModal from './CharacterCardModal';
import CardZoneModal from './CardZoneModal';
import ZombieBanner from './ZombieBanner';
import LocalMatchChatModal from './LocalMatchChatModal';
import ReviveModal from './ReviveModal';
import XChangeModal from './XChangeModal';
import SoulAllianceTradeModal from './SoulAllianceTradeModal';
import SecretAllianceInviteModal from './SecretAllianceInviteModal';
import AllianceChatModal from './AllianceChatModal';
import AllianceStatusBadge from './AllianceStatusBadge';
import LevelDisplay from './LevelDisplay';
import LevelRequirementModal from './LevelRequirementModal';
import MusicPlayer from './MusicPlayer';
import CrystalSplitModal from './CrystalSplitModal';
import { Chat } from '../../App';

import {
  Swords, Undo2, Menu, Shield, Skull, Zap, Gem,
  Clock, Play, Heart, Trophy, Crown, Dices,
  MessageSquare, Eye, Layers, ScrollText, FlaskConical,
  Maximize2, Minimize2, Sparkles, ChevronRight, Activity,
  X, Send, CheckCircle2, Flame, RefreshCw, AlertTriangle, HelpCircle, Trash2
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
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [showInGameMenu, setShowInGameMenu] = useState(false);
  const [showRulesChatOverlay, setShowRulesChatOverlay] = useState(false);
  const [showLocalChat, setShowLocalChat] = useState(false);
  const [showTauntModal, setShowTauntModal] = useState(false);
  const [showCharacterCardModal, setShowCharacterCardModal] = useState(false);
  
  // NEW: Crystal Split Modal State
  const [showCrystalSplitModal, setShowCrystalSplitModal] = useState(false);
  const [crystalSplitData, setCrystalSplitData] = useState(null);
  
  // NEW: Action Card Modal States
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [reviveModalData, setReviveModalData] = useState({ playerName: '', reviveHP: 50, maxHP: 100, playerId: null });
  
  const [showXChangeModal, setShowXChangeModal] = useState(false);
  const [xChangeModalData, setXChangeModalData] = useState({
    xChangeType: 'X1',
    attackerHand: [],
    defenderHand: [],
    defenderName: '',
    initiatorId: null
  });
  
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeModalData, setTradeModalData] = useState({
    playerName: '',
    allyName: '',
    playerHand: [],
    playerEnergyTokens: 0
  });
  
  // NEW: Level Requirement Modal State
  const [showLevelReqModal, setShowLevelReqModal] = useState(false);
  const [levelReqModalData, setLevelReqModalData] = useState({
    cardName: '',
    currentLevel: 1,
    requiredLevel: 2,
    nextSteps: []
  });

  // NEW: Secret Alliance Modals State
  const [showSecretAllianceInviteModal, setShowSecretAllianceInviteModal] = useState(false);
  const [showAllianceChatModal, setShowAllianceChatModal] = useState(false);
  const [pendingAllianceInvite, setPendingAllianceInvite] = useState(null); // { from, to, createdAt }
  const [activeAlliance, setActiveAlliance] = useState(null); // { player1, player2, type, terms, chat: [], confirmations: {} }
  const [allianceChatHistory, setAllianceChatHistory] = useState([]);
  const [selectedAllianceTerms, setSelectedAllianceTerms] = useState([]);
  const [allianceConfirmations, setAllianceConfirmations] = useState({ player1: false, player2: false });
  const [allianceSoulAllianceCardInstanceId, setAllianceSoulAllianceCardInstanceId] = useState(null);
  
  const [activeTauntBubble, setActiveTauntBubble] = useState(null);
  const [systemError, setSystemError] = useState(null);
  const [roomCode, setRoomCode] = useState(null); // Room code for persistence
  const [roomPersistenceError, setRoomPersistenceError] = useState(null);
  const inviteTimeoutRef = useRef(null); // FIX #1: Track alliance invite timeout
  const [preselectedAllianceTargetId, setPreselectedAllianceTargetId] = useState(null); // FIX #4: Track target from SOUL ALLIANCE card
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

  const [lastSnapshotTime, setLastSnapshotTime] = useState(null);
  const [warnIdleCleanup, setWarnIdleCleanup] = useState(false);

  // EFFECT: Monitor for defeated players and show REVIVE modal
  useEffect(() => {
    if (!gameState?.characterStates) return;
    
    const activePlayerId = gameState.players?.[gameState.activePlayerIndex];
    const charState = gameState.characterStates?.[activePlayerId];
    
    if (charState?.hp <= 0 && charState?.isDefeated && !charState?.reviveUsed && !showReviveModal) {
      const reviveHP = Math.floor((charState.maxHp || 100) * 0.5);
      setReviveModalData({
        playerName: charState.name,
        reviveHP: reviveHP,
        maxHP: charState.maxHp || 100,
        playerId: activePlayerId
      });
      setShowReviveModal(true);
    }
  }, [gameState?.characterStates, gameState?.activePlayerIndex]);

  // EFFECT: Create game room on first load
  useEffect(() => {
    if (!roomCode && gameState?.players && gameState.players.length > 0) {
      const initRoom = async () => {
        const result = await createGameRoom(gameState);
        if (result.roomCode) {
          setRoomCode(result.roomCode);
          // Show room code to players (optional: can display in UI)
          console.log('Game room created with code:', result.roomCode);
        } else if (result.error) {
          setRoomPersistenceError('Room creation failed: ' + result.error);
        }
      };
      initRoom();
    }
  }, []); // Only run once on mount

  // EFFECT: Persist game state to room every 5 seconds
  useEffect(() => {
    if (!roomCode || !gameState) return;

    const interval = setInterval(async () => {
      const result = await updateGameRoom(roomCode, gameState);
      if (result.error) {
        console.warn('Failed to persist game state:', result.error);
        // Don't show error UI every 5 seconds, just log it
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [roomCode, gameState]);

  useEffect(() => {
    if (!lastSnapshotTime || historyStack.length === 0) return;

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastSnapshotTime;
      
      // Warn at 9 minutes (540000 ms)
      if (idleTime >= 540000 && !warnIdleCleanup) {
        setWarnIdleCleanup(true);
      }
      
      // Clear at 10 minutes (600000 ms)
      if (idleTime >= 600000) {
        setHistoryStack([]);
        setLastSnapshotTime(null);
        setWarnIdleCleanup(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSnapshotTime, historyStack, warnIdleCleanup]);

  const pushStateSnapshot = () => {
    setHistoryStack(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
    setLastSnapshotTime(Date.now());
    setWarnIdleCleanup(false);
  };

  const handleUndo = () => {
    if (!historyStack.length) return;
    soundFX.playMenuHover();
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(historyStack.slice(0, -1));
    setGameState(previous);
    setLastSnapshotTime(null);
  };

  // Claim +1 ET at turn start
  const handleClaimTurnET = () => {
    if (activePlayer.claimedTurnET) {
      setSystemError('You have already claimed your +1 Energy Token for this turn!');
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

  // REVIVE MODAL: Handle accept revive
  const handleReviveAccept = () => {
    if (!reviveModalData.playerId) return;
    
    const updatedStates = { ...gameState.characterStates };
    const charState = updatedStates[reviveModalData.playerId];
    
    if (charState) {
      charState.isDefeated = false;
      charState.reviveUsed = true;
      charState.hp = reviveModalData.reviveHP;
    }
    
    setGameState({ ...gameState, characterStates: updatedStates });
    setShowReviveModal(false);
    
    const log = `${reviveModalData.playerName} used REVIVE and re-entered the game!`;
    setLocalChatMessages(prev => [...prev, {
      id: `revive_${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      text: `💀 ${log}`,
      time: new Date().toLocaleTimeString()
    }]);
  };

  // REVIVE MODAL: Handle reject revive
  const handleReviveReject = () => {
    setShowReviveModal(false);
    setLocalChatMessages(prev => [...prev, {
      id: `revive_reject_${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      text: `💔 ${reviveModalData.playerName} declined REVIVE and was eliminated.`,
      time: new Date().toLocaleTimeString()
    }]);
  };

  // X-CHANGE MODAL: Handle card exchange
  const handleXChangeConfirm = (exchangeData) => {
    if (!exchangeData.attackerCard || !exchangeData.defenderCard) return;
    
    const updatedStates = { ...gameState.characterStates };
    const attacker = updatedStates[xChangeModalData.initiatorId];
    const defender = Object.values(gameState.characterStates).find(c => 
      c.id !== xChangeModalData.initiatorId && c.actionCardsHand?.length > 0
    );
    
    if (attacker && defender) {
      const attackerCardIdx = attacker.actionCardsHand.findIndex(c => c.id === exchangeData.attackerCard.id);
      const defenderCardIdx = defender.actionCardsHand.findIndex(c => c.id === exchangeData.defenderCard.id);
      
      if (attackerCardIdx !== -1 && defenderCardIdx !== -1) {
        const [attackerCardToGive] = attacker.actionCardsHand.splice(attackerCardIdx, 1);
        const [defenderCardToGive] = defender.actionCardsHand.splice(defenderCardIdx, 1);
        
        attacker.actionCardsHand.push(defenderCardToGive);
        defender.actionCardsHand.push(attackerCardToGive);
        
        setGameState({ ...gameState, characterStates: updatedStates });
        
        setLocalChatMessages(prev => [...prev, {
          id: `xchange_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          text: `🔄 X-CHANGE: ${attacker.name} traded "${attackerCardToGive.name}" for "${defenderCardToGive.name}"`,
          time: new Date().toLocaleTimeString()
        }]);
      }
    }
    
    setShowXChangeModal(false);
  };

  // X-CHANGE MODAL: Handle cancel
  const handleXChangeCancel = () => {
    setShowXChangeModal(false);
  };

  // SOUL ALLIANCE TRADE: Handle trade confirmation
  const handleTradeConfirm = (tradeData) => {
    const traderPlayerId = Object.keys(gameState.characterStates).find(id => 
      gameState.characterStates[id].name === tradeModalData.playerName
    );
    const allyPlayerId = Object.keys(gameState.characterStates).find(id => 
      gameState.characterStates[id].name === tradeModalData.allyName
    );
    
    if (!traderPlayerId || !allyPlayerId) return;
    
    const traderState = gameState.characterStates[traderPlayerId];
    const allyState = gameState.characterStates[allyPlayerId];
    
    const result = tradeWithAlly(traderState, allyState, tradeData);
    
    if (result.success) {
      const updatedStates = { ...gameState.characterStates };
      updatedStates[traderPlayerId] = result.updatedTrader;
      updatedStates[allyPlayerId] = result.updatedRecipient;
      
      setGameState({ ...gameState, characterStates: updatedStates });
      
      setLocalChatMessages(prev => [...prev, {
        id: `trade_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `🤝 ${result.log}`,
        time: new Date().toLocaleTimeString()
      }]);
    }
    
    setShowTradeModal(false);
  };

  // SOUL ALLIANCE TRADE: Handle cancel
  const handleTradeCancel = () => {
    setShowTradeModal(false);
  };

  // ===== SECRET ALLIANCE HANDLERS =====
  
  // Open secret alliance invite modal
  const handleOpenSecretAllianceInvite = (cardInstanceId, targetPlayerId) => {
    setAllianceSoulAllianceCardInstanceId(cardInstanceId);
    setPreselectedAllianceTargetId(targetPlayerId || null); // FIX #4: Store target if provided
    setShowSecretAllianceInviteModal(true);
  };

  // Send secret alliance invite
  const handleSendAllianceInvite = (inviteData) => {
    soundFX.playMenuSelect();
    
    // Create pending invite that only recipient can see
    setPendingAllianceInvite({
      fromPlayerId: inviteData.fromPlayerId,
      fromPlayerName: inviteData.fromPlayerName,
      toPlayerId: inviteData.toPlayerId,
      toPlayerName: inviteData.toPlayerName,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 1000) // 30 second timeout
    });

    // Hide the invite modal
    setShowSecretAllianceInviteModal(false);

    // FIX #1: Auto-decline after 30 seconds if no response (cleared on accept)
    inviteTimeoutRef.current = setTimeout(() => {
      setPendingAllianceInvite(null);
    }, 30000);
  };

  // Recipient accepts the alliance invite
  const handleAcceptAllianceInvite = () => {
    if (!pendingAllianceInvite) return;

    soundFX.playMenuSelect();

    // FIX #1: Clear the timeout so it doesn't fire after acceptance
    if (inviteTimeoutRef.current) {
      clearTimeout(inviteTimeoutRef.current);
      inviteTimeoutRef.current = null;
    }

    // Initialize alliance with both players
    setActiveAlliance({
      player1Id: pendingAllianceInvite.fromPlayerId,
      player1Name: pendingAllianceInvite.fromPlayerName,
      player2Id: pendingAllianceInvite.toPlayerId,
      player2Name: pendingAllianceInvite.toPlayerName,
      type: null, // Will be set when terms are confirmed
      terms: [],
      customTerms: '',
      chat: [],
      confirmations: { [pendingAllianceInvite.fromPlayerId]: false, [pendingAllianceInvite.toPlayerId]: false },
      createdTurn: turnNum,
      expiresAtTurn: turnNum + 1
    });

    // Open alliance chat modal
    setShowAllianceChatModal(true);
    setAllianceChatHistory([]);
    setSelectedAllianceTerms([]);
    setAllianceConfirmations({ player1: false, player2: false });

    // Clear pending invite
    setPendingAllianceInvite(null);
  };

  // Recipient declines the alliance invite
  const handleDeclineAllianceInvite = () => {
    soundFX.playCard();
    setPendingAllianceInvite(null);
  };

  // Send message in alliance chat
  const handleSendAllianceChatMessage = (text) => {
    if (!activeAlliance || !text.trim()) return;

    const newMessage = {
      senderId: activePlayer.id,
      senderName: activePlayer.name,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAllianceChatHistory(prev => [...prev, newMessage]);
  };

  // Toggle alliance term selection
  const handleSelectAllianceTerm = (termType) => {
    setSelectedAllianceTerms(prev => {
      if (prev.includes(termType)) {
        return prev.filter(t => t !== termType);
      } else {
        return [...prev, termType];
      }
    });
  };

  // Remove a selected term
  const handleRemoveAllianceTerm = (termType) => {
    setSelectedAllianceTerms(prev => prev.filter(t => t !== termType));
  };

  // Confirm alliance agreement
  const handleConfirmAllianceAgreement = () => {
    if (!activeAlliance || selectedAllianceTerms.length === 0) return;

    soundFX.playMenuSelect();

    // Toggle confirmation for current player
    const playerKey = activePlayer.id === activeAlliance.player1Id ? 'player1' : 'player2';
    const newConfirmations = { ...allianceConfirmations };
    newConfirmations[playerKey] = !newConfirmations[playerKey];
    setAllianceConfirmations(newConfirmations);

    // If both players confirmed, establish the alliance
    if (newConfirmations.player1 && newConfirmations.player2) {
      // Determine alliance type from selected terms
      let allianceType = 'MIXED';
      if (selectedAllianceTerms.length === 1) {
        allianceType = selectedAllianceTerms[0];
      }

      // Update game state with established alliance
      const establishedAlliance = {
        ...activeAlliance,
        type: allianceType,
        terms: selectedAllianceTerms,
        status: 'active'
      };

      // Register in gameState.alliances (for future reference)
      const updatedGameState = { ...gameState };
      if (!updatedGameState.alliances) {
        updatedGameState.alliances = [];
      }
      updatedGameState.alliances.push(establishedAlliance);

      // Mark both players as allied
      const player1Idx = players.findIndex(p => p.id === establishedAlliance.player1Id);
      const player2Idx = players.findIndex(p => p.id === establishedAlliance.player2Id);

      if (player1Idx >= 0) {
        updatedGameState.players[player1Idx].allianceId = establishedAlliance.id || `alliance_${Date.now()}`;
        updatedGameState.players[player1Idx].alliedWith = establishedAlliance.player2Id;
      }
      if (player2Idx >= 0) {
        updatedGameState.players[player2Idx].allianceId = establishedAlliance.id || `alliance_${Date.now()}`;
        updatedGameState.players[player2Idx].alliedWith = establishedAlliance.player1Id;
      }

      setGameState(updatedGameState);

      // Add system message to game chat
      setLocalChatMessages(prev => [...prev, {
        id: `alliance_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `🤝 ${establishedAlliance.player1Name} and ${establishedAlliance.player2Name} have formed a secret alliance!`,
        time: new Date().toLocaleTimeString()
      }]);

      // Close the alliance chat after a brief delay
      setTimeout(() => {
        setShowAllianceChatModal(false);
        setActiveAlliance(null);
      }, 1500);
    }
  };

  // Cancel alliance formation
  const handleCancelAllianceFormation = () => {
    setPendingAllianceInvite(null);
    setShowSecretAllianceInviteModal(false);
    setShowAllianceChatModal(false);
    setActiveAlliance(null);
    setAllianceChatHistory([]);
    setSelectedAllianceTerms([]);
    setAllianceConfirmations({ player1: false, player2: false });
  };

  // LEVEL REQUIREMENT: Show modal when card requires higher level
  const showLevelRequirementError = (cardName, currentLevel, requiredLevel, steps) => {
    setLevelReqModalData({
      cardName,
      currentLevel,
      requiredLevel,
      nextSteps: steps
    });
    setShowLevelReqModal(true);
  };

  // Initiate Combat Clash -> Opens DiceRollerModal
  const handleInitiateCombat = ({ attacker, defender, actionCard, characterMove, amplifyBonus = 0, playerCount = 2, isBackStab = false }) => {
    setShowCardActionModal(false);
    setShowCardZoneModal(false);

    // FIX #3: Secondary BACK STAB gate (defense-in-depth)
    if (isBackStab && players.length <= 2) {
      setSystemError('BACK STAB only available in 3+ player matches.');
      return;
    }

    // Verify ET cost
    const totalET = (actionCard?.costET || 0) + (characterMove?.costET || 0);
    if (attacker.energyTokens < totalET) {
      setSystemError(`Insufficient Energy Tokens! Need ${totalET} ET, but you have ${attacker.energyTokens} ET.`);
      return;
    }

    setActiveDiceCombatData({
      attacker,
      defender,
      actionCard,
      characterMove,
      amplifyBonus,
      totalET,
      playerCount: players.length,
      isBackStab
    });
  };

  // Complete Combat Clash resolution from DiceRollerModal
  const handleCompleteCombatResolution = ({ combatData, result }) => {
    pushStateSnapshot();
    setActiveDiceCombatData(null);

    const { attacker, defender, actionCard, characterMove, totalET } = combatData;
    const damage = result.damageDealt;
    const isTargetZombie = defender.isZombie;

    let targetPoisonChange = 0;
    let targetBurnChange = result.burnStacks || 0;
    let stolenET = 0;
    let stolenHP = 0;

    if (result.isDrain) {
      stolenET = defender.energyTokens || 0;
    } else if (result.isVampire) {
      stolenET = Math.min(1, defender.energyTokens || 0);
      stolenHP = Math.min(10, defender.hp);
    }

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
        let newHand = p.actionCardsHand || [];
        if (actionCard?.instanceId) {
          newHand = newHand.filter(c => c.instanceId !== actionCard.instanceId);
          newHand.push(...drawRandomCards(1));
        }

        return {
          ...p,
          energyTokens: Math.max(0, p.energyTokens - totalET) + stolenET,
          hp: Math.min(p.maxHp || 100, p.hp + stolenHP + (result.isMiss ? 0 : (result.healsAttacker || 0))),
          turnActionCompleted: (characterMove?.name?.includes('LIGHTNING') || !result.extraTurnGranted) ? true : false,
          actionCardsHand: newHand,
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
        let nextBurn = Math.max(0, (p.burnCount || 0) + targetBurnChange);
        // FIX 1: Lightning X2 → sleepTurns:2, Lightning X1 → sleepTurns:1 (replaces, not stacks).
        // If sleepTurns > 0, do NOT also set isStunned to prevent double-consuming.
        const moveName = characterMove?.name || '';
        const cardName = actionCard?.name || '';
        const isLightningX2 = cardName.includes('LIGHTNING X2') || moveName.includes('LIGHTNING X2');
        const isLightningX1 = cardName.includes('LIGHTNING X1') || moveName.includes('LIGHTNING X1');
        const hasLightningSleep = result.sleepTurns > 0;

        // FIX 1: Replace sleepTurns (don't accumulate) — a new Lightning hit resets the counter
        const newSleepTurns = hasLightningSleep ? result.sleepTurns : (p.sleepTurns || 0);

        let nextPlayerObj = {
          ...p,
          hp: Math.max(0, nextRawHP - stolenHP),
          energyTokens: Math.max(0, (p.energyTokens || 0) - stolenET),
          shield: result.newShield,
          poisonCards: nextPoison,
          burnCount: nextBurn,
          // Only set isStunned when sleepTurns is NOT handling it (avoids double-skip)
          isStunned: hasLightningSleep ? false : (result.appliesStun ? true : p.isStunned),
          sleepTurns: newSleepTurns,
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
    let didTransferCrystal = false;

    const defenderDefeated = updatedPlayers.find(p => p.id === defender.id && p.hp === 0 && !p.isZombie);

    // Check if we should show crystal split modal
    // Show modal when: 2+ players in game AND opponent defeated AND crystal available
    const otherPlayers = updatedPlayers.filter(p => p.id !== attacker.id && !p.isDefeated);
    const defenderStillDefeated = updatedPlayers.find(p => p.id === defender.id && p.hp === 0);
    const shouldShowCrystalSplitModal = 
      defenderDefeated && 
      defender.crystals > 0 && 
      otherPlayers.length > 0;

    // FIX #2: Validate defender is still defeated before showing crystal split modal
    if (shouldShowCrystalSplitModal && updatedPlayers.length >= 3 && defenderStillDefeated) {
      // Store combat data and show modal - defer crystal transfer
      setCrystalSplitData({
        attacker,
        defender,
        updatedPlayers,
        combatLog: {
          characterMove,
          damage
        }
      });
      setShowCrystalSplitModal(true);
      return;
    }

    // Normal crystal transfer (no split needed - single attacker situation or 2 player game)
    const finalPlayers = updatedPlayers.map(p => {
      if (defenderDefeated) {
        if (p.id === defender.id) {
          return { ...p, crystals: Math.max(0, p.crystals - 1) };
        }
        if (p.id === attacker.id) {
          const newCrystals = p.crystals + 1;
          didTransferCrystal = true;
          if (newCrystals >= 3) {
            crystalWinner = p;
          }
          return { ...p, crystals: newCrystals };
        }
      }
      return p;
    });

    if (crystalWinner) {
      setGameState({
        ...gameState,
        players: finalPlayers,
        phase: 'game_over',
        winner: crystalWinner
      });
      soundFX.playVictory(); // Assuming victory sound exists, or just use general sound
      return;
    }

    const newLogs = [];
    newLogs.push({
      turn: turnNum,
      actor: attacker.name,
      action: `Used ${characterMove?.name || 'Attack'} on ${defender.name}`,
      type: 'attack',
      amount: `-${damage} HP`
    });

    // Log healing if the move heals the attacker
    if (result.healsAttacker > 0) {
      newLogs.push({
        turn: turnNum,
        actor: attacker.name,
        action: `${characterMove?.name} healed ${attacker.name}!`,
        type: 'heal',
        amount: `+${result.healsAttacker} HP`
      });
    }

    // Log stun if applied
    if (result.appliesStun) {
      newLogs.push({
        turn: turnNum,
        actor: attacker.name,
        action: `${defender.name} was put to sleep by ${characterMove?.name}!`,
        type: 'stun',
        amount: 'Loses 1 turn'
      });
    }

    if (didTransferCrystal) {
      newLogs.push({
        turn: turnNum,
        actor: attacker.name,
        action: `Defeated ${defender.name} and claimed 1 Stability Crystal!`,
        type: 'crystal_steal',
        amount: '+1 Crystal'
      });
    }

    setGameState({
      ...gameState,
      players: finalPlayers,
      history: [...newLogs, ...(gameState.history || [])],
      lastActionLog: newLogs[0]
    });
  };

  // Instant card effect (Heal, Shield, Antidote, Poison, Amplify, VITALITY)
  const handleApplyInstantEffect = ({ type, sourcePlayerId, targetPlayerId, costET = 0, amount = 0, amplifyChoice = null, cardName = null, playedInstanceId }) => {
    pushStateSnapshot();
    setShowCardActionModal(false);
    setShowCardZoneModal(false);

    const sourcePlayer = players.find(p => p.id === sourcePlayerId);
    if (sourcePlayer.energyTokens < costET) {
      setSystemError(`Need ${costET} ET to play this card.`);
      return;
    }

    soundFX.playCard();

    let logText = '';
    let logAmount = '';

    const updatedPlayers = players.map(p => {
      let updated = { ...p };

      // Deduct ET and consume card from source
      if (p.id === sourcePlayerId) {
        updated.energyTokens = Math.max(0, updated.energyTokens - costET);
        updated.turnActionCompleted = true;
        if (playedInstanceId) {
          updated.actionCardsHand = (updated.actionCardsHand || []).filter(c => c.instanceId !== playedInstanceId);
          updated.actionCardsHand.push(...drawRandomCards(1));
        }
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
        } else if (type === 'vitality') {
          // VITALITY GAIN cards - increase max HP and apply level up
          const vitAmount = cardName?.includes('V10') ? 10 : 
                            cardName?.includes('V20') ? 20 : 
                            cardName?.includes('V30') ? 30 : 
                            cardName?.includes('V40') ? 40 : 10;
          
          updated.maxHP = (updated.maxHP || 100) + vitAmount;
          updated.hp = Math.min(updated.maxHP, updated.hp + vitAmount);
          updated.level = (updated.level || 1) + 1;
          
          soundFX.playHeal();
          logText = `${updated.name} used ${cardName}!`;
          logAmount = `+${vitAmount} Max HP, Lv.${updated.level}`;
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
  const handleCompleteKontrol = ({ attackerId, targetId, success, chosenOption, stolenCardId, forcedTargetId }) => {
    const playedInstanceId = activeKontrolData?.playedInstanceId;
    setActiveKontrolData(null);
    pushStateSnapshot();

    const attacker = players.find(p => p.id === attackerId);
    const target = players.find(p => p.id === targetId);

    let stolenCard = null;
    let forceAttackVictim = null;
    
    if (success && chosenOption === 'steal_card' && stolenCardId) {
      const targetHand = target.actionCardsHand || [];
      stolenCard = targetHand.find(c => c.instanceId === stolenCardId);
    }
    if (success && chosenOption === 'force_attack' && forcedTargetId) {
      forceAttackVictim = players.find(p => p.id === forcedTargetId);
    }

    const updatedPlayers = players.map(p => {
      let updated = { ...p };
      
      // Attacker costs & rewards
      if (p.id === attackerId) {
        let newHand = updated.actionCardsHand || [];
        if (playedInstanceId) {
          newHand = newHand.filter(c => c.instanceId !== playedInstanceId);
          newHand.push(...drawRandomCards(1));
        }
        if (stolenCard) {
          newHand.push({ ...stolenCard, instanceId: `stolen_${Date.now()}_${Math.random()}` });
        }
        
        updated.energyTokens = Math.max(0, updated.energyTokens - 3);
        updated.turnActionCompleted = true;
        updated.actionCardsHand = newHand;
        updated.kontrolUsesLeft = Math.max(0, (updated.kontrolUsesLeft ?? 2) - 1);
        updated.kontrolCooldown = 5; // 5-turn cooldown after Kontrol use
      }
      
      // Target penalties
      if (p.id === targetId) {
        if (stolenCard) {
          let newHand = (updated.actionCardsHand || []).filter(c => c.instanceId !== stolenCard.instanceId);
          newHand.push(...drawRandomCards(1)); // Replenish their hand
          updated.actionCardsHand = newHand;
        }
        if (forceAttackVictim && forceAttackVictim.id === targetId) {
          // Hit themselves
          updated.hp = Math.max(0, updated.hp - 25);
          updated = checkZombieStatus(updated);
        }
      }
      
      // Other victim (if multiplayer)
      if (forceAttackVictim && p.id === forceAttackVictim.id && forceAttackVictim.id !== targetId) {
        updated.hp = Math.max(0, updated.hp - 25);
        updated = checkZombieStatus(updated);
      }
      
      return updated;
    });

    let actionText = `${target.name} resisted Mind Kontrol!`;
    if (success) {
      if (chosenOption === 'steal_card') {
        actionText = `Successfully Kontrolled ${target.name} (Stole 1 Action Card: ${stolenCard?.name || 'None'})`;
      } else {
        actionText = `Successfully Kontrolled ${target.name} (Forced them to attack ${forceAttackVictim.name} for 25 AP)`;
      }
    }

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
    const playedInstanceId = activeBlitzData?.playedInstanceId;
    setActiveBlitzData(null);
    pushStateSnapshot();

    const attacker = players.find(p => p.id === attackerId);
    const hpSacrifice = Math.floor(attacker.hp * 0.5);

    const updatedPlayers = players.map(p => {
      if (p.id === attackerId) {
        let newHand = p.actionCardsHand || [];
        if (playedInstanceId) {
          newHand = newHand.filter(c => c.instanceId !== playedInstanceId);
          newHand.push(...drawRandomCards(1));
        }
        return {
          ...p,
          hp: Math.max(1, p.hp - hpSacrifice),
          energyTokens: Math.max(0, p.energyTokens - 5),
          turnActionCompleted: true,
          actionCardsHand: newHand,
          blitzUsesLeft: Math.max(0, (p.blitzUsesLeft ?? 2) - 1),
          blitzCooldown: 5 // 5-turn cooldown after Blitz use
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

    // BUG 4 FIX: Check for defeated opponents and transfer stability crystals (same as combat resolution)
    let crystalWinner = null;
    let didTransferCrystal = false;

    const targetsDefeated = updatedPlayers.filter(p =>
      p.id !== attackerId && p.hp === 0 && !p.isZombie
    );

    const finalPlayers = updatedPlayers.map(p => {
      const wasDefeated = targetsDefeated.find(d => d.id === p.id);
      if (wasDefeated) {
        return { ...p, crystals: Math.max(0, p.crystals - 1) };
      }
      if (p.id === attackerId && targetsDefeated.length > 0) {
        const newCrystals = p.crystals + targetsDefeated.length;
        didTransferCrystal = true;
        if (newCrystals >= 3) crystalWinner = { ...p, crystals: newCrystals };
        return { ...p, crystals: newCrystals };
      }
      return p;
    });

    if (crystalWinner) {
      setGameState({
        ...gameState,
        players: finalPlayers,
        phase: 'game_over',
        winner: crystalWinner,
        history: [newLog, ...(gameState.history || [])]
      });
      return;
    }

    setGameState({
      ...gameState,
      players: finalPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // Complete Retreat Action
  const handleCompleteRetreat = ({ playerId, success }) => {
    const playedInstanceId = activeRetreatData?.playedInstanceId;
    setActiveRetreatData(null);
    pushStateSnapshot();

    const player = players.find(p => p.id === playerId);
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        let newHand = p.actionCardsHand || [];
        if (playedInstanceId) {
          newHand = newHand.filter(c => c.instanceId !== playedInstanceId);
          newHand.push(...drawRandomCards(1));
        }
        return { 
          ...p, 
          retreatedThisTurn: success,
          actionCardsHand: newHand
        };
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

  // Complete Crystal Split Negotiation
  const handleCrystalSplitComplete = (result) => {
    setShowCrystalSplitModal(false);
    setCrystalSplitData(null);
    pushStateSnapshot();

    const { winner, loser, offer, method } = result;
    
    // Update game state with crystal and item transfers
    const updatedPlayers = players.map(p => {
      if (p.id === winner.id) {
        // Winner gets the crystal
        let updatedCards = p.actionCardsHand || [];
        
        // FIX #7: Safely access offer (may be null if fight outcome)
        // If negotiation was accepted, add offered items
        if (result.accepted && offer) {
          // Add offered cards from loser
          if (offer.actionCards && offer.actionCards.length > 0) {
            updatedCards = [...updatedCards, ...offer.actionCards.map(card => ({
              ...card,
              instanceId: `transferred_${Date.now()}_${Math.random()}`
            }))];
          }
        }

        // Check if winner already has 3 crystals (would win game)
        const newCrystals = p.crystals + 1;
        const isGameWinner = newCrystals >= 3 && !p.isZombie;

        return {
          ...p,
          crystals: newCrystals,
          energyTokens: (p.energyTokens || 0) + (offer?.energyTokens || 0),
          actionCardsHand: updatedCards,
          stats: {
            ...p.stats,
            crystalsWon: (p.stats?.crystalsWon || 0) + 1
          }
        };
      }

      if (p.id === loser.id) {
        // Loser loses the crystal
        let updatedCards = p.actionCardsHand || [];
        
        // If negotiation was accepted, remove offered items
        if (result.accepted && offer) {
          if (offer.actionCards && offer.actionCards.length > 0) {
            const cardIdsToRemove = new Set(offer.actionCards.map(c => c.instanceId));
            updatedCards = updatedCards.filter(c => !cardIdsToRemove.has(c.instanceId));
          }
        }

        return {
          ...p,
          crystals: Math.max(0, p.crystals - 1),
          energyTokens: Math.max(0, (p.energyTokens || 0) - (offer?.energyTokens || 0)),
          actionCardsHand: updatedCards
        };
      }

      return p;
    });

    // Check if anyone won the game
    let gameWinner = null;
    for (const p of updatedPlayers) {
      if (p.crystals >= 3 && !p.isZombie) {
        gameWinner = p;
        break;
      }
    }

    if (gameWinner) {
      setGameState({
        ...gameState,
        players: updatedPlayers,
        phase: 'game_over',
        winner: gameWinner
      });
      soundFX.playVictory?.();
      return;
    }

    // Log the crystal split result
    const methodText = result.accepted ? 'Negotiation' : 'Dice Roll';
    const newLog = {
      turn: turnNum,
      actor: winner.name,
      action: `Won Stability Crystal via ${methodText} (defeated ${loser.name})`,
      type: 'crystal_split',
      amount: '+1 Crystal'
    };

    setGameState({
      ...gameState,
      players: updatedPlayers,
      history: [newLog, ...(gameState.history || [])]
    });
  };

  // Discard Action Card
  const handleDiscardActionCard = (cardToDiscard) => {
    soundFX.playCard();
    pushStateSnapshot();

    const player = players.find(p => p.id === activePlayer.id);
    if (!player || !cardToDiscard) return;

    const updatedPlayers = players.map(p => {
      if (p.id === activePlayer.id) {
        let newHand = p.actionCardsHand || [];
        // Remove the discarded card
        newHand = newHand.filter(c => c.instanceId !== cardToDiscard.instanceId);
        // Draw a new card
        newHand.push(...drawRandomCards(1));
        
        return {
          ...p,
          actionCardsHand: newHand,
          turnActionCompleted: true // Action is done, turn can end
        };
      }
      return p;
    });

    const newLog = {
      turn: turnNum,
      actor: player.name,
      action: `Discarded ${cardToDiscard.name} and drew a new card.`,
      type: 'discard',
      amount: cardToDiscard.name
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

  const handleTaunt = () => {
    soundFX.playMenuHover();
    setShowTauntModal(true);
  };

  const handleSendTaunt = (msg) => {
    pushStateSnapshot();
    setShowTauntModal(false);

    const newLog = {
      turn: turnNum,
      actor: activePlayer.name,
      action: `TAUNTED: "${msg}"`,
      type: 'chat',
      amount: ''
    };

    setGameState({
      ...gameState,
      history: [newLog, ...(gameState.history || [])]
    });

    setActiveTauntBubble({ playerId: activePlayer.id, message: msg });
    setTimeout(() => {
      setActiveTauntBubble(null);
    }, 3500);
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

        {/* Idle Cleanup Warning */}
        {warnIdleCleanup && (
          <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(251,200,13,0.95)', color: '#000', padding: '8px 20px',
            borderRadius: '8px', fontWeight: 'bold', zIndex: 9999 }}>
            ⚠️ Undo history will clear in 1 minute due to inactivity.
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
                  background: 'linear-gradient(90deg, #FBC80D, #ff9900)',
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
                  boxShadow: '0 0 10px rgba(251, 200, 13, 0.4)'
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
              style={{ borderColor: 'var(--neon-gold, #FBC80D)', color: 'var(--neon-gold, #FBC80D)' }}
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
                <span className="panel-kicker">PLAYERS SCOREBOARD</span>
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

                      <div className="arena-score-avatar" style={{ borderColor: c.themeColor, overflow: 'visible', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                        <img
                          src={getAssetUrl(c.image || 'characters/chynaman.png')}
                          alt={c.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                        {/* Level Badge - Top Right Corner */}
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          color: '#000',
                          border: '2px solid rgba(0,0,0,0.8)',
                          boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
                          zIndex: 10
                        }}>
                          {p.level || 1}
                        </div>
                      </div>

                      <div className="arena-score-meta" style={{ flex: 1, minWidth: 0 }}>
                        <strong className="arena-player-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '140px' }}>{p.name}</strong>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                          <span>⚡ {p.energyTokens} ET</span>
                          <span>💎 {p.crystals}/3</span>
                          {p.poisonCards > 0 && <span style={{ color: '#39ff14' }}>☠️ {p.poisonCards}</span>}
                        </div>
                      </div>

                      <div className="arena-score-val-block">
                        <span className="arena-lp-number" style={{ color: p.hp < 30 ? '#ED1E24' : '#FBC80D' }}>
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
                {activePlayer.poisonCards > 0 && (
                  <div
                    className="effect-chip effect-poison"
                    style={{ cursor: 'default' }}
                  >
                    <Skull size={15} color="#39ff14" />
                    <span className="effect-name">Poison</span>
                    <span className="effect-count">{activePlayer.poisonCards}</span>
                  </div>
                )}
                <button
                  className="effect-chip effect-shield"
                  onClick={() => setSelectedEffectInfo({ name: 'Shield Barrier', desc: 'Absorbs incoming attack damage before your HP is reduced.', count: `+${activePlayer.shield || 0}` })}
                >
                  <Shield size={15} color="#FBC80D" />
                  <span className="effect-name">Shield</span>
                  <span className="effect-count">+{activePlayer.shield || 0}</span>
                </button>

                <button
                  className="effect-chip effect-atk"
                  onClick={() => setSelectedEffectInfo({ name: 'Energy Tokens', desc: 'Fuel used for attacks and action cards. Claim +1 ET at the start of your turn (Max 10).', count: `${activePlayer.energyTokens}` })}
                >
                  <Zap size={15} color="#FBC80D" />
                  <span className="effect-name">ET Fuel</span>
                  <span className="effect-count">{activePlayer.energyTokens}</span>
                </button>

                {activePlayer.hp >= GAME_LIMITS.LEVEL_2_HP && (
                  <button
                    className="effect-chip"
                    style={{ borderColor: '#FBC80D', background: 'rgba(251, 200, 13, 0.15)' }}
                    onClick={() => setSelectedEffectInfo({ name: 'Level 2 Unlocked', desc: 'Having 150+ HP empowers your character with Level 2 advanced attack cards!', count: 'LVL 2' })}
                  >
                    <Sparkles size={15} color="#FBC80D" />
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
                  <circle cx="160" cy="160" r="125" fill="rgba(251, 200, 13, 0.02)" stroke="rgba(251, 200, 13, 0.35)" strokeWidth="1.5" strokeDasharray="5 4" />
                  <circle cx="160" cy="160" r="55" fill="none" stroke="rgba(251, 200, 13, 0.12)" strokeWidth="1" />
                </svg>

                {/* Seated Players around the Perfect Circle */}
                {players.map((p, i) => {
                  const isActive = i === activeIdx;
                  let x = 0;
                  let y = 0;
                  
                  if (!isActive) {
                    let relativeIdx = i;
                    if (i > activeIdx) relativeIdx--;
                    const totalOthers = Math.max(1, players.length - 1);
                    const angleDeg = (360 / totalOthers) * relativeIdx - 90;
                    const radius = 125;
                    x = Math.cos(angleDeg * (Math.PI / 180)) * radius;
                    y = Math.sin(angleDeg * (Math.PI / 180)) * radius;
                  }

                  const realChar = CHARACTERS[p.characterId] || CHARACTERS.chynaman;

                  return (
                    <div
                      key={p.id}
                      className={`orbit-fighter-node ${isActive ? 'fighter-active' : ''}`}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) ${isActive ? 'scale(1.4)' : 'scale(0.95)'}`,
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

                      {/* Taunt Speech Bubble */}
                      {activeTauntBubble && activeTauntBubble.playerId === p.id && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            marginBottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fff',
                            color: '#000',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: isActive ? '0.75rem' : '0.65rem',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 20,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            animation: 'bounce 0.5s ease infinite alternate'
                          }}
                        >
                          <div style={{
                            position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                            width: '8px', height: '8px', background: '#fff'
                          }} />
                          {activeTauntBubble.message}
                        </div>
                      )}

                      {/* Circular Avatar Frame */}
                      <div
                        className={`fighter-avatar-frame ${p.isZombie ? 'ring-green' : 'ring-blue'}`}
                        style={{
                          borderColor: p.isZombie ? '#39ff14' : (isActive ? '#FBC80D' : realChar.themeColor),
                          boxShadow: isActive ? '0 0 18px #FBC80D, 0 0 28px rgba(0,240,255,0.45)' : (p.isZombie ? '0 0 14px #39ff14' : 'none'),
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
                          border: isActive ? '1px solid #FBC80D' : '1px solid rgba(255, 255, 255, 0.22)',
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
                        <span style={{ color: '#FBC80D', fontWeight: 'bold' }}>⚡{p.energyTokens}</span>
                        <span style={{ color: '#FBC80D', fontWeight: 'bold' }}>💎{p.crystals}</span>
                        {p.poisonCards > 0 && (
                          <span style={{ color: '#39ff14', fontWeight: 'bold' }}>☠️{p.poisonCards}</span>
                        )}
                        {p.burnCount > 0 && (
                          <span style={{ color: '#ff4d00', fontWeight: 'bold' }}>🔥{p.burnCount}</span>
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
                  boxShadow: isZombie ? '0 0 35px rgba(57, 255, 20, 0.45)' : '0 20px 50px rgba(0,0,0,0.9), 0 0 35px rgba(251, 200, 13, 0.35)',
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
                    alt={activeChar?.name || 'Player'}
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
                    <div className="hero-card-num-pill" style={{ background: '#FBC80D', color: '#000', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
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
                        background: 'rgba(237, 30, 36, 0.25)',
                        border: '1px solid rgba(237, 30, 36, 0.6)',
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

                    {/* Level Display */}
                    <div
                      style={{
                        background: 'rgba(251, 200, 13, 0.15)',
                        border: '1px solid rgba(251, 200, 13, 0.4)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Level</span>
                      <strong style={{ fontSize: '0.95rem', color: '#fbc80d' }}>Lv.{activePlayer.level || 1}</strong>
                    </div>

                    <div
                      style={{
                        background: 'rgba(251, 200, 13, 0.2)',
                        border: '1px solid rgba(251, 200, 13, 0.5)',
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
                        <span style={{ fontSize: '0.8rem', color: '#FBC80D', fontWeight: 'bold' }}>
                          {move.type === 'dice_mult' ? `🎲 × ${move.multiplier}` : `${move.baseAP} AP`} ({move.costET} ET)
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCharacterCardModal(true)}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '8px',
                      background: 'linear-gradient(90deg, #FBC80D, #FFD700)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={16} /> VIEW CHARACTER CARD
                  </button>
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
                  disabled={activePlayer.turnActionCompleted}
                  onClick={() => setShowCardActionModal(true)}
                  style={{ opacity: activePlayer.turnActionCompleted ? 0.4 : 1, cursor: activePlayer.turnActionCompleted ? 'not-allowed' : 'pointer', padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #FBC80D, #0077ff)', color: '#000', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Swords size={16} />
                  <span>PLAY ACTION CARD</span>
                </button>

                <button
                  className="btn-play-card-cta"
                  disabled={activePlayer.turnActionCompleted}
                  onClick={() => handleInitiateCombat({
                    attacker: activePlayer,
                    defender: defaultTarget,
                    actionCard: { id: 'atk_basic', name: 'Attack', costET: 0 },
                    characterMove: activeChar.moves?.[0] || { name: 'Basic Attack', baseAP: 25, type: 'flat' }
                  })}
                  style={{ opacity: activePlayer.turnActionCompleted ? 0.4 : 1, cursor: activePlayer.turnActionCompleted ? 'not-allowed' : 'pointer', padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #ff0055, #ff5500)', color: '#fff', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Dices size={16} />
                  <span>ROLL COMBAT DICE</span>
                </button>

                <button
                  className="btn-play-card-cta"
                  disabled={activePlayer.turnActionCompleted}
                  onClick={() => setShowDiscardModal(true)}
                  style={{ opacity: activePlayer.turnActionCompleted ? 0.4 : 1, cursor: activePlayer.turnActionCompleted ? 'not-allowed' : 'pointer', padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #999999, #666666)', color: '#fff', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <Trash2 size={16} />
                  <span>DISCARD CARD</span>
                </button>

                {!activePlayer.claimedTurnET && (
                  <button
                    className="btn-play-card-cta"
                    onClick={() => {
                      pushStateSnapshot();
                      const updated = players.map(p => {
                        if (p.id === activePlayer.id) {
                          return { ...p, energyTokens: Math.min(10, p.energyTokens + 1), claimedTurnET: true };
                        }
                        return p;
                      });
                      setGameState({ ...gameState, players: updated });
                      soundFX.playEnergy();
                    }}
                    style={{ padding: '12px 10px', fontSize: '0.82rem', background: 'linear-gradient(90deg, #FBC80D, #ffaa00)', color: '#000', fontWeight: 'bold', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Zap size={16} />
                    <span>CLAIM 1 ET</span>
                  </button>
                )}



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
                <div>• <strong>Victory</strong>: First player to capture 3 Stability Crystals wins the universe!</div>
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
                background: 'rgba(251, 200, 13, 0.12)',
                border: '1.5px solid #FBC80D',
                color: '#FBC80D',
                boxShadow: '0 0 12px rgba(251, 200, 13, 0.25)',
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

            <button
              className="btn-arena-chat"
              onClick={handleTaunt}
              style={{
                background: 'rgba(255, 153, 0, 0.12)',
                border: '1.5px solid #ff9900',
                color: '#ff9900',
                boxShadow: '0 0 12px rgba(255, 153, 0, 0.25)',
                fontWeight: 'bold',
                padding: '8px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '16px' }}>🗣️</span>
              <span>TAUNT</span>
            </button>
          </div>

          <div className="bottom-right-actions">
            {activePlayer.turnActionCompleted && (
              <div style={{ color: '#39ff14', fontSize: '0.9rem', fontWeight: 'bold', marginRight: '15px', animation: 'pulse 1s infinite' }}>
                Action Completed! Please End Turn ➔
              </div>
            )}
            <button 
              className={`btn-end-turn-cta ${activePlayer.turnActionCompleted ? 'flashing-end-turn-cta' : ''}`}
              style={{
                boxShadow: activePlayer.turnActionCompleted ? '0 0 20px #39ff14' : 'none',
                border: activePlayer.turnActionCompleted ? '2px solid #39ff14' : 'none'
              }}
              onClick={handleEndTurn}
            >
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
            onOpenKontrol={(atk, targetId, playedInstanceId) => setActiveKontrolData({ attacker: atk, initialTargetId: targetId, playedInstanceId })}
            onOpenBlitz={(atk, playedInstanceId) => setActiveBlitzData({ attacker: atk, playedInstanceId })}
            onOpenRetreat={(atk) => setActiveRetreatData({ attacker: atk })}
            onShowLevelRequirement={showLevelRequirementError}
            onDiscardCard={(card) => { handleDiscardActionCard(card); setShowCardActionModal(false); }}
            onOpenSecretAllianceInvite={handleOpenSecretAllianceInvite}
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
                {(activePlayer.actionCardsHand || []).map(card => (
                  <div
                    key={card.instanceId}
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

        {/* Crystal Split Modal */}
        {showCrystalSplitModal && crystalSplitData && (
          <CrystalSplitModal
            isOpen={showCrystalSplitModal}
            attackers={[crystalSplitData.attacker, ...players.filter(p => p.id !== crystalSplitData.attacker.id && !p.isDefeated)]}
            defeated={crystalSplitData.defender}
            onSplitComplete={handleCrystalSplitComplete}
            onClose={() => {
              setShowCrystalSplitModal(false);
              setCrystalSplitData(null);
            }}
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

        {/* Player Modals & Overlays */}
        {showCharacterCardModal && (
          <CharacterCardModal
            characterId={activePlayer.characterId}
            onClose={() => setShowCharacterCardModal(false)}
          />
        )}
        {showCardZoneModal && (
          <CardZoneModal
            player={activePlayer}
            onClose={() => setShowCardZoneModal(false)}
          />
        )}

        {/* Discard Modal */}
        {showDiscardModal && (
          <div className="arena-modal-backdrop" onClick={() => setShowDiscardModal(false)}>
            <div className="arena-modal-card card-zone-full-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <div className="modal-title-wrap">
                  <Trash2 size={20} color="var(--neon-gold)" />
                  <h3>DISCARD ACTION CARD</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setShowDiscardModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <p>Select a card to discard. You will draw a new card to replace it, and your turn will end.</p>
              </div>

              <div className="modal-cards-grid-10">
                {(activePlayer.actionCardsHand || []).map(card => (
                  <div
                    key={card.instanceId}
                    className="modal-card-item"
                    style={{ borderColor: card.color || 'var(--neon-cyan)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => {
                      handleDiscardActionCard(card);
                      setShowDiscardModal(false);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                      {card.icon}
                    </div>
                    <div className="card-name" style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>
                      {card.name}
                    </div>
                    <div className="card-cost" style={{ fontSize: '0.75rem', color: 'var(--neon-gold)' }}>
                      {card.costET || 0} ET
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontStyle: 'italic' }}>
                      Click to Discard
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '16px' }}>
                <button
                  onClick={() => setShowDiscardModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {showTauntModal && (
          <TauntModal
            activePlayerName={activePlayer.name}
            onClose={() => setShowTauntModal(false)}
            onTaunt={handleSendTaunt}
          />
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

        {/* System Error Modal */}
        {systemError && (
          <div className="arena-modal-backdrop" style={{ zIndex: 9999 }} onClick={() => setSystemError(null)}>
            <div className="arena-modal-card" style={{ maxWidth: '400px', textAlign: 'center', border: '1px solid #ED1E24', boxShadow: '0 0 20px rgba(237, 30, 36, 0.4)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: '#ED1E24', marginTop: 0 }}>ACTION FAILED</h3>
              <p style={{ color: '#fff', fontSize: '0.95rem', margin: '15px 0' }}>{systemError}</p>
              <button
                className="btn-play-card-cta"
                onClick={() => setSystemError(null)}
                style={{ width: '100%', padding: '12px', marginTop: '10px', background: 'linear-gradient(90deg, #ED1E24, #ff0055)' }}
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        )}

        {/* Winner Screen Modal */}
        {gameState?.winner && (
          <WinnerModal
            winner={gameState.winner}
            players={players}
            turnNumber={turnNum}
            gameStats={gameState.winner.stats || {}}
            onRematch={onRematch}
            onHome={onGoToMenu}
            onContinue={() => setGameState({ ...gameState, winner: null })}
          />
        )}

        {/* REVIVE Modal */}
        <ReviveModal
          isOpen={showReviveModal}
          playerName={reviveModalData.playerName}
          reviveHP={reviveModalData.reviveHP}
          maxHP={reviveModalData.maxHP}
          onAccept={handleReviveAccept}
          onReject={handleReviveReject}
        />

        {/* X-CHANGE Modal */}
        <XChangeModal
          isOpen={showXChangeModal}
          xChangeType={xChangeModalData.xChangeType}
          attackerHand={xChangeModalData.attackerHand}
          defenderHand={xChangeModalData.defenderHand}
          defenderName={xChangeModalData.defenderName}
          onConfirm={handleXChangeConfirm}
          onCancel={handleXChangeCancel}
        />

        {/* Soul Alliance Trade Modal */}
        <SoulAllianceTradeModal
          isOpen={showTradeModal}
          playerName={tradeModalData.playerName}
          allyName={tradeModalData.allyName}
          playerHand={tradeModalData.playerHand}
          playerEnergyTokens={tradeModalData.playerEnergyTokens}
          onTrade={handleTradeConfirm}
          onCancel={handleTradeCancel}
        />

        {/* Level Requirement Modal */}
        <LevelRequirementModal
          isOpen={showLevelReqModal}
          cardName={levelReqModalData.cardName}
          currentLevel={levelReqModalData.currentLevel}
          requiredLevel={levelReqModalData.requiredLevel}
          nextSteps={levelReqModalData.nextSteps}
          onClose={() => setShowLevelReqModal(false)}
        />

        {/* Secret Alliance Invite Modal - Only shown to potential ally, not to sender */}
        {pendingAllianceInvite && activePlayer.id === pendingAllianceInvite.toPlayerId && (
          <div className="alliance-notification-overlay">
            <div className="alliance-notification-box">
              <div className="notification-content">
                <span className="notification-icon">🤝</span>
                <p className="notification-text">
                  <strong>{pendingAllianceInvite.fromPlayerName}</strong> sent you a secret alliance invite!
                </p>
              </div>
              <div className="notification-buttons">
                <button
                  className="notification-btn decline"
                  onClick={handleDeclineAllianceInvite}
                >
                  Decline
                </button>
                <button
                  className="notification-btn accept"
                  onClick={handleAcceptAllianceInvite}
                >
                  Accept
                </button>
              </div>

              <style jsx>{`
                .alliance-notification-overlay {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  z-index: 10000;
                  animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                  from {
                    transform: translateX(400px);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }

                .alliance-notification-box {
                  background: linear-gradient(135deg, rgba(157, 78, 221, 0.95) 0%, rgba(157, 78, 221, 0.85) 100%);
                  border: 2px solid #9d4edd;
                  border-radius: 10px;
                  padding: 16px;
                  box-shadow: 0 0 30px rgba(157, 78, 221, 0.6);
                  min-width: 300px;
                  max-width: 350px;
                }

                .notification-content {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 12px;
                  padding-bottom: 12px;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }

                .notification-icon {
                  font-size: 28px;
                }

                .notification-text {
                  margin: 0;
                  color: #fff;
                  font-size: 14px;
                  font-weight: 500;
                }

                .notification-text strong {
                  color: #39ff14;
                }

                .notification-buttons {
                  display: flex;
                  gap: 8px;
                }

                .notification-btn {
                  flex: 1;
                  padding: 10px;
                  border: none;
                  border-radius: 6px;
                  font-weight: bold;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }

                .notification-btn.decline {
                  background: rgba(255, 255, 255, 0.1);
                  color: rgba(255, 255, 255, 0.8);
                  border: 1px solid rgba(255, 255, 255, 0.3);
                }

                .notification-btn.decline:hover {
                  background: rgba(255, 255, 255, 0.2);
                }

                .notification-btn.accept {
                  background: #39ff14;
                  color: #000;
                  border: 1px solid #39ff14;
                }

                .notification-btn.accept:hover {
                  box-shadow: 0 0 15px rgba(57, 255, 20, 0.6);
                }
              `}</style>
            </div>
          </div>
        )}

        {/* Secret Alliance Invite Modal */}
        {showSecretAllianceInviteModal && (
          <SecretAllianceInviteModal
            isOpen={showSecretAllianceInviteModal}
            activePlayer={activePlayer}
            allPlayers={players}
            onSendInvite={handleSendAllianceInvite}
            onCancel={() => {
              setShowSecretAllianceInviteModal(false);
              setPreselectedAllianceTargetId(null); // FIX #4: Clear preselection on cancel
            }}
            existingAlliance={
              activePlayer.allianceId
                ? {
                    id: activePlayer.allianceId,
                    allyName: players.find(p => p.id === activePlayer.alliedWith)?.name,
                    turnsRemaining: 1
                  }
                : null
            }
            preselectedTargetId={preselectedAllianceTargetId}
          />
        )}

        {/* Alliance Chat Modal */}
        {showAllianceChatModal && activeAlliance && (
          <AllianceChatModal
            isOpen={showAllianceChatModal}
            player1={{ id: activeAlliance.player1Id, name: activeAlliance.player1Name }}
            player2={{ id: activeAlliance.player2Id, name: activeAlliance.player2Name }}
            currentPlayerId={activePlayer.id}
            chatHistory={allianceChatHistory}
            selectedTerms={selectedAllianceTerms}
            confirmationStatus={allianceConfirmations}
            onSendMessage={handleSendAllianceChatMessage}
            onSelectTerm={handleSelectAllianceTerm}
            onRemoveTerm={handleRemoveAllianceTerm}
            onConfirmAgreement={handleConfirmAllianceAgreement}
            onCancel={handleCancelAllianceFormation}
          />
        )}

        {/* Music Player */}
        <MusicPlayer />
      </div>
    </div>
  );
}



