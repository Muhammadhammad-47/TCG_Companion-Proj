import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wifi, Swords, Shield, Skull, Zap, ScrollText, MessageSquare,
  Dices, Crown, Trophy, Layers, Clock, HelpCircle, X, Eye, Users, RefreshCw,
  Lock, Radio, AlertTriangle, Play, Sparkles, CheckCircle2, SkipForward, FastForward
} from 'lucide-react';
import { DynamicScaleWrapper } from '../../components/DynamicScaleWrapper';
import { soundFX } from '../utils/audio';
import { getAssetUrl } from '../data/characters';
import { KONTROLA_CHARACTERS, generateDeck, dealInitialHands, resolveTurn, rollDice } from './KontrolaEngine';
import {
  createMatch, joinMatch, subscribeToMatch, requestJoin, takeTurn, broadcastState,
  advertiseRoom, closeRoom, subscribeToGlobalLobby, broadcastLeave, requestSync,
  broadcastUIEvent, rejectJoin
} from './MultiplayerClient';
import { getCardGraphicUrl, getCharacterAttackGraphicUrl, getWildCardGraphicUrl } from './kontrolaAssets';
import KontrolaDiceRoller from './KontrolaDiceRoller';
import KontrolaChatModal from './KontrolaChatModal';
import KontrolaTauntModal from './KontrolaTauntModal';
import '../../pages/GamePage.css';

// Collision-proof unique player ID
const generateUniquePlayerId = () => {
  return 'warr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
};

// Safe 6-character room code without ambiguous characters
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function KontrolaArena() {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [playerId] = useState(generateUniquePlayerId);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [error, setError] = useState(null);
  const [inAppNotice, setInAppNotice] = useState(null);

  // In-app floating alert/toast helper
  const showNotice = (msg, type = 'warning') => {
    setInAppNotice({ msg, type });
    setTimeout(() => {
      setInAppNotice(null);
    }, 4000);
  };

  // Lobby Tab Navigation ('browse' | 'create' | 'join')
  const [lobbyTab, setLobbyTab] = useState('browse');
  const [openRooms, setOpenRooms] = useState([]);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState('chynaman');
  const [isPremium, setIsPremium] = useState(false);

  const [selectedActionCard, setSelectedActionCard] = useState(null);
  const [selectedCharacterAttack, setSelectedCharacterAttack] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showTaunt, setShowTaunt] = useState(false);
  const [activeTauntBubble, setActiveTauntBubble] = useState(null);

  // Synchronized Combat Clash & Dice
  const [activeCombat, setActiveCombat] = useState(null);
  const [isDiceRollingSync, setIsDiceRollingSync] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [turnFlash, setTurnFlash] = useState(false);
  const [winner, setWinner] = useState(null);

  // Action resolution queue on Host to prevent race conditions
  const actionQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
  const prevTurnRef = useRef(null);

  // Persistent refs to prevent WebSocket reconnection loops on state changes
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;
  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;
  const selectedCharacterRef = useRef(selectedCharacter);
  selectedCharacterRef.current = selectedCharacter;
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  // Turn timer (60s) & Vision card reveal modal
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(60);
  const [revealedVision, setRevealedVision] = useState(null);

  // Hoisted Derived Match & Turn State (safe for all effects, handlers, and renders)
  const isMyTurn = Boolean(gameState?.turn === playerId && !isSpectator);
  const myCharacter = gameState?.characterStates?.[playerId] || KONTROLA_CHARACTERS[selectedCharacter];
  const myHand = gameState?.hands?.[playerId] || [];
  const opponents = gameState?.players ? gameState.players.filter((p) => p !== playerId) : [];
  const turnNum = gameState?.turnNumber || 1;
  const roundNum = gameState?.roundNumber || 1;
  const activeTurnPlayerName =
    gameState?.playerNames?.[gameState?.turn] ||
    gameState?.characterStates?.[gameState?.turn]?.name ||
    'Warrior';
  const activeTurnChar = gameState?.characterStates?.[gameState?.turn];

  // Sound effects on interaction
  const playClick = () => {
    if (soundFX?.playMenuHover) soundFX.playMenuHover();
  };

  // Turn flash animation trigger when turn changes
  useEffect(() => {
    if (gameState?.turn && gameState.turn !== prevTurnRef.current) {
      prevTurnRef.current = gameState.turn;
      setTurnFlash(true);
      if (soundFX?.playMenuHover) soundFX.playMenuHover();
      const timer = setTimeout(() => setTurnFlash(false), 900);
      return () => clearTimeout(timer);
    }
  }, [gameState?.turn]);

  // 60-Second turn countdown timer (resets on turn advance)
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;
    setTurnSecondsLeft(60);
    const timer = setInterval(() => {
      setTurnSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState?.turn, gameState?.turnNumber, gameState?.status]);

  // Auto-pass turn if active player timer runs out
  useEffect(() => {
    if (turnSecondsLeft === 0 && isMyTurn && gameState?.status === 'active') {
      handlePassTurn();
    }
  }, [turnSecondsLeft, isMyTurn, gameState?.status]);

  // Auto-expire revealed vision modal after 15 seconds
  useEffect(() => {
    if (!revealedVision) return;
    const timeRemaining = revealedVision.expiresAt - Date.now();
    if (timeRemaining <= 0) {
      setRevealedVision(null);
      return;
    }
    const timer = setTimeout(() => {
      setRevealedVision(null);
    }, timeRemaining);
    return () => clearTimeout(timer);
  }, [revealedVision]);

  // ==========================================
  // GLOBAL LOBBY SUBSCRIPTION (Ephemeral)
  // ==========================================
  useEffect(() => {
    const lobbySub = subscribeToGlobalLobby((event) => {
      if (event.type === 'ROOM_ADVERTISED') {
        const room = event.payload;
        if (!room || !room.roomCode) return;
        setOpenRooms((prev) => {
          const filtered = prev.filter(
            (r) => r.roomCode !== room.roomCode && Date.now() - (r.timestamp || 0) < 35000
          );
          if (room.status === 'waiting' && (room.playersCount || 0) < 7) {
            return [room, ...filtered];
          }
          return filtered;
        });
      } else if (event.type === 'ROOM_CLOSED') {
        const { roomCode } = event.payload || {};
        setOpenRooms((prev) => prev.filter((r) => r.roomCode !== roomCode));
      }
    });

    // Cleanup stale rooms periodically
    const cleaner = setInterval(() => {
      setOpenRooms((prev) => prev.filter((r) => Date.now() - (r.timestamp || 0) < 30000));
    }, 10000);

    return () => {
      lobbySub.unsubscribe();
      clearInterval(cleaner);
    };
  }, []);

  // Host continuously advertises open room to Global Lobby
  useEffect(() => {
    if (!isHost || !matchId || !gameState || gameState.status !== 'waiting') return;

    const interval = setInterval(() => {
      advertiseRoom({
        roomCode: matchId,
        hostName: playerName || 'Host',
        hostPlayerId: playerId,
        playersCount: gameState.players?.length || 1,
        maxPlayers: 7,
        status: 'waiting'
      });
    }, 7000);

    // Initial broadcast
    advertiseRoom({
      roomCode: matchId,
      hostName: playerName || 'Host',
      hostPlayerId: playerId,
      playersCount: gameState.players?.length || 1,
      maxPlayers: 7,
      status: 'waiting'
    });

    return () => clearInterval(interval);
  }, [isHost, matchId, gameState?.status, gameState?.players?.length, playerName, playerId]);

  // Handle window unload / leave cleanup (Strictly on browser unload, never on component re-render)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (matchIdRef.current && playerIdRef.current) {
        broadcastLeave(matchIdRef.current, playerIdRef.current);
        if (isHostRef.current) closeRoom(matchIdRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ==========================================
  // REAL-TIME SUPABASE MATCH EVENT LISTENER
  // ==========================================
  useEffect(() => {
    if (!matchId) return;

    const subscription = subscribeToMatch(
      matchId,
      (event) => {
        // 1. Peer Joined
        if (event.type === 'PLAYER_JOINED') {
          const { playerId: joinedId, characterId: joinedChar, playerName: joinedName } = event.payload || {};
          if (!joinedId) return;

          const currentGS = gameStateRef.current;
          if (isHostRef.current && currentGS) {
            // Check if game already started or room is full
            const isMatchActive = currentGS.status === 'active';
            const currentPlayers = currentGS.players || [];
            const isFull = currentPlayers.length >= 7;

            // Late joiner or overflow -> admit as Spectator
            if (isMatchActive || isFull) {
              const currentSpectators = currentGS.spectators || [];
              if (!currentSpectators.includes(joinedId)) {
                const updatedSpectatorState = {
                  ...currentGS,
                  spectators: [...currentSpectators, joinedId],
                  playerNames: {
                    ...(currentGS.playerNames || {}),
                    [joinedId]: joinedName || 'Spectator'
                  },
                  logs: [
                    `👁️ ${joinedName || 'A player'} entered as a Spectator!`,
                    ...(currentGS.logs || [])
                  ]
                };
                setGameState(updatedSpectatorState);
                broadcastState(matchId, updatedSpectatorState);
              }
              return;
            }

            // Normal lobby join
            if (!currentPlayers.includes(joinedId)) {
              const updatedPlayers = [...currentPlayers, joinedId];
              const updatedChars = {
                ...(currentGS.characterSelections || {}),
                [joinedId]: joinedChar || 'bee'
              };
              const updatedNames = {
                ...(currentGS.playerNames || {}),
                [joinedId]: joinedName || 'Warrior'
              };

              const updatedLobbyState = {
                ...currentGS,
                players: updatedPlayers,
                characterSelections: updatedChars,
                playerNames: updatedNames,
                logs: [`${joinedName || 'Warrior'} entered the lobby!`, ...(currentGS.logs || [])]
              };

              setGameState(updatedLobbyState);
              broadcastState(matchId, updatedLobbyState);
            }
          }
        }
        // 2. Full State Sync
        else if (event.type === 'SYNC_STATE') {
          const newState = event.payload;
          setGameState(newState);
          if (newState?.winner) {
            setWinner(newState.winner);
          }
          // If we joined and match is active but we are not in players list, we are a spectator
          if (newState?.status === 'active' && !newState.players?.includes(playerIdRef.current)) {
            setIsSpectator(true);
          }
        }
        // 3. Join Rejected
        else if (event.type === 'JOIN_REJECTED') {
          const { targetPlayerId, reason } = event.payload || {};
          if (targetPlayerId === playerIdRef.current) {
            setError(
              reason === 'ROOM_FULL'
                ? 'This room has reached the maximum capacity of 7 warriors.'
                : 'This match has already commenced and is locked.'
            );
            setGameState(null);
            setMatchId('');
          }
        }
        // 4. Request Sync (Peer asking for full state)
        else if (event.type === 'REQUEST_SYNC') {
          if (isHostRef.current && gameStateRef.current) {
            broadcastState(matchId, gameStateRef.current);
          }
        }
        // 5. Player Left / Disconnected
        else if (event.type === 'PLAYER_LEFT') {
          const { playerId: leftPlayerId } = event.payload || {};
          if (!leftPlayerId || leftPlayerId === playerIdRef.current) return;

          handlePlayerLeave(leftPlayerId);
        }
        // 6. Synchronized Dice Screen Open
        else if (event.type === 'DICE_SCREEN_OPEN') {
          setActiveCombat(event.payload);
          setIsDiceRollingSync(false);
        }
        // 7. Synchronized Dice Screen Roll
        else if (event.type === 'DICE_SCREEN_ROLLED') {
          if (event.payload?.precalculatedRolls) {
            setActiveCombat((prev) => prev ? { ...prev, precalculatedRolls: event.payload.precalculatedRolls } : prev);
          }
          setIsDiceRollingSync(true);
        }
        // 8. Synchronized Dice Screen Close
        else if (event.type === 'DICE_SCREEN_CLOSE') {
          const { resolved, combatData, precalculatedRolls } = event.payload || {};
          setActiveCombat(null);
          setIsDiceRollingSync(false);
          if (resolved && isHostRef.current && combatData) {
            enqueueHostAction(combatData, precalculatedRolls);
          }
        }
        // 9. Client Action received by Host
        else if (event.type === 'PLAYER_ACTION') {
          if (isHostRef.current) {
            enqueueHostAction(event.payload);
          }
        }
        // 10. Chat and Taunts
        else if (event.type === 'CHAT_MESSAGE') {
          setChatMessages((prev) => [...prev, event.payload]);
        } else if (event.type === 'PLAYER_TAUNT') {
          setActiveTauntBubble(event.payload);
          setTimeout(() => setActiveTauntBubble(null), 3500);
        }
      },
      () => {
        // Callback fired when channel is fully SUBSCRIBED
        if (isJoining) {
          requestJoin(matchId, {
            playerId: playerIdRef.current,
            characterId: selectedCharacterRef.current,
            playerName: playerNameRef.current.trim() || 'Warrior'
          });
          setIsJoining(false);
          // Request sync from host in case match is in progress
          requestSync(matchId, playerIdRef.current);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [matchId, isJoining]);

  // ==========================================
  // DISCONNECT & HOST PROMOTION HANDLER
  // ==========================================
  const handlePlayerLeave = (leftPlayerId) => {
    setGameState((currentGS) => {
      if (!currentGS) return currentGS;

      const leaverName = currentGS.playerNames?.[leftPlayerId] || 'A warrior';
      const isLeaverHost = currentGS.host === leftPlayerId;
      const remainingPlayers = (currentGS.players || []).filter((p) => p !== leftPlayerId);

      // If host left, promote the next player in line
      if (isLeaverHost) {
        const newHostId = remainingPlayers[0];
        if (newHostId === playerIdRef.current) {
          setIsHost(true);
        }
      }

      // If only 1 player remains in an active match, declare them winner!
      let defaultWinner = null;
      if (currentGS.status === 'active' && remainingPlayers.length === 1) {
        defaultWinner = currentGS.characterStates?.[remainingPlayers[0]] || {
          name: currentGS.playerNames?.[remainingPlayers[0]] || 'Last Standing Warrior'
        };
      }

      // Check if it was the leaver's active turn, advance turn if so
      let nextTurn = currentGS.turn;
      if (currentGS.turn === leftPlayerId && remainingPlayers.length > 0) {
        const livingRemaining = remainingPlayers.filter(
          (p) => !currentGS.characterStates?.[p]?.isDefeated
        );
        nextTurn = livingRemaining[0] || remainingPlayers[0];
      }

      const updatedState = {
        ...currentGS,
        host: isLeaverHost ? remainingPlayers[0] : currentGS.host,
        players: remainingPlayers,
        turn: nextTurn,
        logs: [
          `⚠️ ${leaverName} has left the match.${
            isLeaverHost ? ` New host is ${currentGS.playerNames?.[remainingPlayers[0]] || 'Warrior'}.` : ''
          }`,
          ...(currentGS.logs || [])
        ],
        winner: defaultWinner || currentGS.winner
      };

      if (isHostRef.current || (isLeaverHost && remainingPlayers[0] === playerIdRef.current)) {
        broadcastState(matchIdRef.current, updatedState);
      }
      if (defaultWinner) {
        setWinner(defaultWinner);
      }
      return updatedState;
    });
  };

  // ==========================================
  // HOST ACTION QUEUE
  // ==========================================
  const enqueueHostAction = (payload, precalculatedRolls = null) => {
    actionQueueRef.current.push({ payload, precalculatedRolls });
    processActionQueue();
  };

  const processActionQueue = async () => {
    if (isProcessingQueueRef.current || actionQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;

    while (actionQueueRef.current.length > 0) {
      const item = actionQueueRef.current.shift();
      executeActionResolution(item.payload, item.precalculatedRolls);
    }

    isProcessingQueueRef.current = false;
  };

  const executeActionResolution = (payload, precalculatedRolls = null) => {
    setGameState((currentState) => {
      if (!currentState || !currentState.characterStates) return currentState;
      const { actorId, actionCard, attackSelectionName, targetId } = payload;
      const attackerChar = currentState.characterStates[actorId];
      const defenderChar = targetId && targetId !== 'ALL' ? currentState.characterStates[targetId] : null;

      if (!attackerChar) return currentState;

      const isPass = actionCard?.type === 'PASS';
      let newAttackerState = { ...attackerChar };
      let newDefenderState = defenderChar ? { ...defenderChar } : null;
      let log = `${attackerChar.name} passed their turn.`;
      let newDeck = [...(currentState.deck || [])];
      let newHand = [...(currentState.hands?.[actorId] || [])];

      if (!isPass) {
        // Deduct ET Cost
        const cost = actionCard?.costET || (actionCard?.type === 'ATTACK' ? 1 : 0);
        newAttackerState.energyTokens = Math.max(0, (newAttackerState.energyTokens || 5) - cost);

        // Resolve Turn via Engine
        const resolved = resolveTurn(
          actionCard,
          KONTROLA_CHARACTERS[attackerChar.id] || attackerChar,
          newAttackerState,
          newDefenderState,
          attackSelectionName,
          precalculatedRolls
        );
        newAttackerState = resolved.newAttackerState;
        newDefenderState = resolved.newDefenderState;
        log = resolved.log;

        // Vision Card Check (reveal opponent's hand to attacker)
        if (actionCard.name.includes('VISION') && targetId && targetId !== 'ALL') {
          if (actorId === playerIdRef.current) {
            setRevealedVision({
              targetId,
              targetName: defenderChar?.name || 'Opponent',
              expiresAt: Date.now() + 15000,
              cards: currentState.hands?.[targetId] || []
            });
          }
        }

        // Visual shake on damage
        if (actionCard?.type === 'ATTACK') {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 800);
        }

        // Discard played card and replenish hand to exactly 10 cards
        newHand = newHand.filter((c) => c.id !== actionCard.id);
        if (newDeck.length > 0) {
          newHand.push(newDeck.shift());
        }
      }

      // Check if target was defeated and reward Stability Crystal
      let matchWinner = null;
      if (newDefenderState && newDefenderState.hp <= 0 && !newDefenderState.isDefeated) {
        newDefenderState.isDefeated = true;
        newAttackerState.crystals = (newAttackerState.crystals || 1) + (newDefenderState.crystals || 1);
        newDefenderState.crystals = 0;
        log += ` 💀 ${newDefenderState.name} was defeated! ${newAttackerState.name} claimed their Stability Crystals (Total: ${newAttackerState.crystals}).`;
        if (newAttackerState.crystals >= 3) {
          matchWinner = newAttackerState;
        }
      }

      const updatedStates = {
        ...currentState.characterStates,
        [actorId]: newAttackerState
      };
      if (targetId && targetId !== 'ALL' && newDefenderState) {
        updatedStates[targetId] = newDefenderState;
      }

      // Turn rotation (modulo next non-defeated player)
      const livingPlayers = currentState.players.filter(
        (pId) => !updatedStates[pId]?.isDefeated
      );

      let nextTurnPlayerId = actorId;
      const turnLogs = [log];

      if (livingPlayers.length <= 1) {
        matchWinner = updatedStates[livingPlayers[0]] || matchWinner;
        nextTurnPlayerId = livingPlayers[0] || actorId;
      } else {
        const currentIdx = livingPlayers.indexOf(actorId);
        nextTurnPlayerId = livingPlayers[(currentIdx + 1) % livingPlayers.length] || livingPlayers[0];

        // Check if next player is Asleep (Sleepy X1 / X2 / Shock)
        let checkedSleepCount = 0;
        while (updatedStates[nextTurnPlayerId]?.sleepTurns > 0 && checkedSleepCount < livingPlayers.length) {
          const sleepingChar = updatedStates[nextTurnPlayerId];
          sleepingChar.sleepTurns = Math.max(0, sleepingChar.sleepTurns - 1);
          turnLogs.unshift(`💤 ${sleepingChar.name} is asleep and skips their turn! (${sleepingChar.sleepTurns} turn(s) remaining)`);
          const sIdx = livingPlayers.indexOf(nextTurnPlayerId);
          nextTurnPlayerId = livingPlayers[(sIdx + 1) % livingPlayers.length];
          checkedSleepCount++;
        }

        // Check Poison damage tick on the player starting their turn (-10 HP per turn per poison stack)
        const incomingChar = updatedStates[nextTurnPlayerId];
        if (incomingChar && incomingChar.poisonCount > 0 && !incomingChar.isDefeated) {
          const poisonDmg = incomingChar.poisonCount * 10;
          incomingChar.hp = Math.max(0, incomingChar.hp - poisonDmg);
          turnLogs.unshift(`☠️ ${incomingChar.name} suffered ${poisonDmg} Poison damage (${incomingChar.poisonCount} stack${incomingChar.poisonCount > 1 ? 's' : ''})! HP: ${incomingChar.hp}`);
          if (incomingChar.hp <= 0) {
            incomingChar.isDefeated = true;
            turnLogs.unshift(`💀 ${incomingChar.name} succumbed to Poison and was eliminated!`);
            const remainingLiving = currentState.players.filter((pId) => !updatedStates[pId]?.isDefeated);
            if (remainingLiving.length === 1) {
              matchWinner = updatedStates[remainingLiving[0]];
            }
            const dIdx = livingPlayers.indexOf(nextTurnPlayerId);
            nextTurnPlayerId = livingPlayers[(dIdx + 1) % livingPlayers.length];
          }
        }

        // Refresh Energy Token claim flag for the active player's new turn
        if (updatedStates[nextTurnPlayerId]) {
          updatedStates[nextTurnPlayerId].claimedTurnET = false;
        }
      }

      const nextState = {
        ...currentState,
        turn: nextTurnPlayerId,
        turnNumber: (currentState.turnNumber || 1) + 1,
        deck: newDeck,
        hands: {
          ...(currentState.hands || {}),
          [actorId]: newHand
        },
        characterStates: updatedStates,
        logs: [...turnLogs, ...(currentState.logs || [])],
        winner: matchWinner
      };

      broadcastState(matchIdRef.current, nextState);
      if (matchWinner) setWinner(matchWinner);
      return nextState;
    });
  };

  // ==========================================
  // MATCH CREATION & JOINING
  // ==========================================
  const handleCreateMatch = async () => {
    playClick();
    if (!playerName.trim()) {
      setError('Please enter your warrior name first.');
      return;
    }
    try {
      const newMatchId = generateRoomCode();
      const initialState = await createMatch(newMatchId, playerId, selectedCharacter);
      initialState.isPremium = isPremium;
      initialState.playerNames = { [playerId]: playerName.trim() };

      setMatchId(newMatchId);
      setGameState(initialState);
      setIsHost(true);
      setIsSpectator(false);
      setError(null);

      // Advertise room immediately to global lobby
      advertiseRoom({
        roomCode: newMatchId,
        hostName: playerName.trim(),
        hostPlayerId: playerId,
        playersCount: 1,
        maxPlayers: 7,
        status: 'waiting'
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinByCode = async (codeToJoin = matchId) => {
    playClick();
    if (!playerName.trim()) {
      setError('Please enter your warrior name first.');
      return;
    }
    if (!codeToJoin) {
      setError('Please provide a valid 6-character room code.');
      return;
    }

    try {
      const cleanId = codeToJoin.trim().toUpperCase();
      setMatchId(cleanId);
      setIsHost(false);
      setIsJoining(true); // Triggers requestJoin inside useEffect once channel connects

      const tempState = await joinMatch(cleanId, playerId, selectedCharacter);
      tempState.playerNames = { [playerId]: playerName.trim() };
      setGameState(tempState);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Host Starts Game (Locks the room)
  const handleStartGame = () => {
    playClick();
    if (!gameState || !isHost) return;

    // Remove room from global lobby broadcast
    closeRoom(matchId);

    const deck = generateDeck(gameState.isPremium);
    const { updatedDeck, hands } = dealInitialHands(deck, gameState.players);

    // Initial starting crystals: 2 for 2-players, 1 for 3-7 players
    const startingCrystals = gameState.players.length === 2 ? 2 : 1;

    // Roll 2 dice for each player to determine starting player (Rulebook: highest 2-dice roll starts)
    let highestRoll = -1;
    let startingPlayerId = playerId;
    const rollBreakdowns = [];
    gameState.players.forEach((pId) => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const total = d1 + d2;
      const pName = gameState.playerNames?.[pId] || 'Warrior';
      rollBreakdowns.push(`${pName}: [${d1}+${d2}=${total}]`);
      if (total > highestRoll) {
        highestRoll = total;
        startingPlayerId = pId;
      }
    });
    const starterName = gameState.playerNames?.[startingPlayerId] || 'Warrior';

    const initialCharacterStates = {};
    gameState.players.forEach((pId) => {
      const charKey = gameState.characterSelections?.[pId] || 'chynaman';
      const customName = gameState.playerNames?.[pId];
      const template = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
      initialCharacterStates[pId] = {
        ...template,
        name: customName || template.name,
        playerId: pId,
        hp: template.maxHp,
        shield: 0,
        energyTokens: 5,
        crystals: startingCrystals,
        poisonCount: 0,
        sleepTurns: 0,
        isDefeated: false,
        claimedTurnET: false
      };
    });

    const activeState = {
      ...gameState,
      status: 'active',
      turn: startingPlayerId,
      turnNumber: 1,
      roundNumber: 1,
      deck: updatedDeck,
      hands: hands,
      characterStates: initialCharacterStates,
      logs: [
        `🎲 Starting Roll-off: ${rollBreakdowns.join(' · ')} ➔ ${starterName} won the roll and strikes first!`,
        `Match ${matchId} commenced! First warrior to collect 3 Stability Crystals wins.`
      ]
    };

    setGameState(activeState);
    broadcastState(matchId, activeState);
  };

  // Claim +1 ET on turn
  const handleClaimTurnET = () => {
    playClick();
    if (isSpectator) {
      showNotice('Spectators cannot claim Energy Tokens.', 'info');
      return;
    }
    if (!isMyTurn) {
      showNotice("Wait for your turn to claim your turn's Energy Token.", 'warning');
      return;
    }
    if (myCharacter?.claimedTurnET) {
      showNotice('You have already claimed your +1 Energy Token for this turn!', 'info');
      return;
    }
    if (!gameState) return;

    const updatedChar = {
      ...myCharacter,
      energyTokens: Math.min(10, (myCharacter.energyTokens || 0) + 1),
      claimedTurnET: true
    };

    const newState = {
      ...gameState,
      characterStates: {
        ...gameState.characterStates,
        [playerId]: updatedChar
      },
      logs: [`${myCharacter.name} claimed +1 Energy Token.`, ...(gameState.logs || [])]
    };

    setGameState(newState);
    broadcastState(matchId, newState);
  };

  // Pass turn without playing a card or consuming ET
  const handlePassTurn = () => {
    playClick();
    if (!isMyTurn || isSpectator) return;
    const payload = {
      actorId: playerId,
      actionCard: { name: 'PASS TURN', type: 'PASS' },
      targetId: null
    };
    if (isHost) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
    }
    setSelectedActionCard(null);
    setSelectedCharacterAttack(null);
    setSelectedTargetId(null);
  };

  // Host force skip for stalled / AFK player
  const handleForceSkipCurrentPlayer = () => {
    playClick();
    if (!isHost || isMyTurn || !gameState?.turn) return;
    const stalledPlayerId = gameState.turn;
    const payload = {
      actorId: stalledPlayerId,
      actionCard: { name: 'HOST SKIP (INACTIVE)', type: 'PASS' },
      targetId: null
    };
    enqueueHostAction(payload);
  };

  // ==========================================
  // PLAY ACTION & SYNCHRONIZED COMBAT CLASH
  // ==========================================
  const playTurn = () => {
    playClick();
    if (isSpectator) {
      showNotice('Spectator mode: you are observing this match.', 'info');
      return;
    }
    if (!isMyTurn) {
      showNotice("It's not your turn! Please wait for the current warrior.", 'warning');
      return;
    }
    if (!selectedActionCard) {
      showNotice('Please select an Action Card from your hand first.', 'warning');
      return;
    }

    const isAttack = selectedActionCard.type === 'ATTACK';
    const isAoE = selectedActionCard.name.includes('BLITZ');
    const isLightning = selectedActionCard.name.includes('LIGHTNING');

    // Level check for Vitality Gain V20
    if (selectedActionCard.name.includes('VITALITY GAIN V20') && (myCharacter.level || 1) < 2) {
      showNotice('VITALITY GAIN V20 requires your character to be at least Level 2!', 'warning');
      return;
    }

    if (isAttack && !isAoE && !selectedTargetId) {
      showNotice('Please select a target opponent warrior first!', 'warning');
      return; // Must select target
    }
    if (isAttack && !isAoE && !isLightning && !selectedCharacterAttack) {
      showNotice('Please select a character attack move to strike with!', 'warning');
      return;
    }

    const payload = {
      actorId: playerId,
      actionCard: selectedActionCard,
      attackSelectionName: isLightning ? null : selectedCharacterAttack,
      targetId: isAoE ? 'ALL' : selectedTargetId
    };

    if (isAttack) {
      const targetChar = gameState.characterStates[selectedTargetId];
      const precalculatedRolls = {
        attackerRoll: rollDice(2),
        defenderRoll: rollDice(2),
        kRoll: rollDice(1),
        dRoll: rollDice(1)
      };

      const clashData = {
        ...payload,
        attacker: myCharacter,
        defender: targetChar,
        attackerId: playerId,
        attackerPlayerName: myCharacter.name,
        defenderPlayerName: targetChar?.name || 'Defender',
        precalculatedRolls
      };

      // Broadcast to all clients so the dice screen opens on EVERY player's screen simultaneously!
      broadcastUIEvent(matchId, 'dice_screen_open', clashData);
      setActiveCombat(clashData);
      setIsDiceRollingSync(false);
    } else {
      if (isHost) {
        enqueueHostAction(payload);
      } else {
        takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
      }
    }

    setSelectedActionCard(null);
    setSelectedCharacterAttack(null);
    setSelectedTargetId(null);
  };

  // Triggered when attacker rolls the authentic pip dice (or re-rolls on tie)
  const handleTriggerDiceRoll = (newRolls = null) => {
    if (newRolls) {
      setActiveCombat((prev) => prev ? { ...prev, precalculatedRolls: newRolls } : prev);
      broadcastUIEvent(matchId, 'dice_screen_rolled', { timestamp: Date.now(), precalculatedRolls: newRolls });
    } else {
      broadcastUIEvent(matchId, 'dice_screen_rolled', { timestamp: Date.now() });
    }
    setIsDiceRollingSync(true);
  };

  // Triggered when dice screen is closed or finished
  const handleCloseDiceScreen = (resolved = false) => {
    broadcastUIEvent(matchId, 'dice_screen_close', {
      resolved,
      combatData: activeCombat,
      precalculatedRolls: activeCombat?.precalculatedRolls
    });
    setActiveCombat(null);
    setIsDiceRollingSync(false);
    if (resolved && isHost && activeCombat) {
      enqueueHostAction(activeCombat, activeCombat.precalculatedRolls);
    }
  };

  const handleSendMessage = (content) => {
    const msg = typeof content === 'object' && content !== null ? {
      id: content.id || 'msg_' + Date.now(),
      text: content.text || '',
      senderId: content.senderId || playerId,
      senderName: content.senderName || myCharacter?.name || playerName || 'Warrior',
      characterId: content.characterId || selectedCharacter,
      time: content.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } : {
      id: 'msg_' + Date.now(),
      text: String(content || ''),
      senderId: playerId,
      senderName: myCharacter?.name || playerName || 'Warrior',
      characterId: selectedCharacter,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, msg]);
    takeTurn(matchId, { type: 'CHAT_MESSAGE', payload: msg });
  };

  const handleSendTaunt = (tauntText) => {
    const msg = {
      text: tauntText,
      senderId: playerId,
      senderName: myCharacter?.name || playerName || 'Warrior'
    };
    setActiveTauntBubble(msg);
    setTimeout(() => setActiveTauntBubble(null), 3500);
    takeTurn(matchId, { type: 'PLAYER_TAUNT', payload: msg });
  };

  // ==========================================
  // VIEW 1: LOBBY & PRE-GAME SETUP
  // ==========================================
  if (!gameState || gameState.status === 'waiting' || gameState.status === 'joining') {
    return (
      <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <DynamicScaleWrapper>
          <div className="webgl-screen menu-screen" style={{ width: '100%', height: '100%', padding: '20px 28px', boxSizing: 'border-box', overflowY: 'auto' }}>
            {/* Ambient Streaks & Card Watermarks */}
            <div className="menu-bg-elements" style={{ width: '100%', height: '100%' }}>
              <div className="neon-streak-red" />
              <div className="neon-streak-blue" />
              <div className="subtle-watermark-card left-wm" />
              <div className="subtle-watermark-card right-wm" />
            </div>

            {/* Header Nav Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, marginBottom: '16px' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(10, 25, 50, 0.75)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
              >
                <ArrowLeft size={18} /> BACK TO HUB
              </button>
              <div className="brand-pill-badge" style={{ margin: 0, padding: '6px 16px', fontSize: '0.95rem' }}>
                ONLINE LOBBY
              </div>
            </div>

            {/* Title & Branding */}
            <div className="game-brand-block" style={{ marginBottom: '18px', textAlign: 'center' }}>
              <h1 className="game-main-title" style={{ margin: '0 0 4px 0' }}>
                <span className="title-dance" style={{ fontSize: '2.8rem', letterSpacing: '2px' }}>
                  KONTROLA MULTIPLAYER
                </span>
              </h1>
              <div className="brand-sub-row" style={{ justifyContent: 'center' }}>
                <span className="brand-tcg-text" style={{ fontSize: '1rem', letterSpacing: '3px' }}>
                  2–7 PLAYERS · REALTIME EPHEMERAL ARENA
                </span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(255, 51, 102, 0.15)',
                  border: '1.5px solid var(--neon-crimson)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  maxWidth: '700px',
                  margin: '0 auto 16px auto',
                  color: '#ff88aa',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                {error}
              </div>
            )}

            {!gameState ? (
              <div style={{ maxWidth: '900px', margin: '0 auto', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Player Name Input */}
                <div
                  style={{
                    background: 'rgba(14, 22, 42, 0.88)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '16px',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '1.15rem',
                        color: 'var(--neon-cyan)',
                        fontWeight: '900',
                        letterSpacing: '1px'
                      }}
                    >
                      YOUR WARRIOR CALLSIGN
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      Visible to all opponents across matches
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your name (Required)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={16}
                    style={{
                      width: '260px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: playerName.trim() ? '1.5px solid var(--neon-cyan)' : '1.5px solid rgba(255, 42, 85, 0.6)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Character Selection Carousel */}
                <div
                  style={{
                    background: 'rgba(14, 22, 42, 0.88)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '16px',
                    padding: '18px 20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        fontSize: '1.1rem',
                        color: 'var(--neon-cyan)',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                      }}
                    >
                      SELECT YOUR WARRIOR
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>7 Playable Characters</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '10px' }}>
                    {Object.values(KONTROLA_CHARACTERS).map((char) => {
                      const isSelected = selectedCharacter === char.id;
                      const isTaken = gameState && Object.entries(gameState.characterSelections || {}).some(([pId, cId]) => pId !== playerId && cId === char.id);
                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            if (isTaken) {
                              showNotice(`${char.name} has already been chosen by another warrior! Choose a different character.`, 'warning');
                              return;
                            }
                            playClick();
                            setSelectedCharacter(char.id);
                          }}
                          style={{
                            background: isTaken
                              ? 'rgba(30, 10, 20, 0.55)'
                              : isSelected
                              ? 'rgba(0, 240, 255, 0.18)'
                              : 'rgba(0, 0, 0, 0.45)',
                            border: isTaken
                              ? '1px dashed rgba(255, 42, 85, 0.5)'
                              : isSelected
                              ? `2px solid ${char.themeColor || 'var(--neon-cyan)'}`
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isSelected && !isTaken ? `0 0 16px ${char.themeColor || 'var(--neon-cyan)'}` : 'none',
                            borderRadius: '12px',
                            padding: '10px 8px',
                            textAlign: 'center',
                            cursor: isTaken ? 'not-allowed' : 'pointer',
                            opacity: isTaken ? 0.45 : 1,
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isTaken && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: '#ff2a55',
                                color: '#fff',
                                fontSize: '0.62rem',
                                fontWeight: '900',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px'
                              }}
                            >
                              TAKEN
                            </div>
                          )}
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '50%',
                              margin: '0 auto 6px auto',
                              overflow: 'hidden',
                              border: `2px solid ${char.themeColor}`
                            }}
                          >
                            <img
                              src={getAssetUrl(char.image)}
                              alt={char.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 'bold',
                              color: isTaken ? 'rgba(255,255,255,0.4)' : '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {char.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: isTaken ? '#ff6688' : char.themeColor, fontWeight: 'bold' }}>
                            {isTaken ? 'UNAVAILABLE' : char.element}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Three-Tab Lobby Navigation */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '8px' }}>
                  <button
                    onClick={() => { playClick(); setLobbyTab('browse'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'browse' ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'browse' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'browse' ? 'var(--neon-cyan)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Radio size={18} />
                    <span>BROWSE OPEN ROOMS ({openRooms.length})</span>
                  </button>

                  <button
                    onClick={() => { playClick(); setLobbyTab('create'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'create' ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'create' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'create' ? 'var(--neon-cyan)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Swords size={18} />
                    <span>CREATE PRIVATE ROOM</span>
                  </button>

                  <button
                    onClick={() => { playClick(); setLobbyTab('join'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'join' ? '1.5px solid var(--neon-gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'join' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'join' ? 'var(--neon-gold)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Rajdhani, sans-serif',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Wifi size={18} />
                    <span>JOIN WITH CODE</span>
                  </button>
                </div>

                {/* TAB 1: BROWSE OPEN ROOMS */}
                {lobbyTab === 'browse' && (
                  <div
                    style={{
                      background: 'rgba(14, 22, 42, 0.88)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '16px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                        Live ephemeral rooms actively broadcasting across the network
                      </span>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--neon-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Radio size={14} className="animate-pulse" /> LIVE BROADCAST
                      </span>
                    </div>

                    {openRooms.length === 0 ? (
                      <div
                        style={{
                          padding: '36px 20px',
                          textAlign: 'center',
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(255,255,255,0.15)'
                        }}
                      >
                        <Users size={36} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 10px auto' }} />
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                          No Public Rooms Currently Waiting
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                          Be the pioneer! Create a room and your match will be advertised here instantly.
                        </div>
                        <button
                          onClick={() => { playClick(); setLobbyTab('create'); }}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            background: 'var(--neon-cyan)',
                            color: '#000',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Create a Room Now
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {openRooms.map((room) => (
                          <div
                            key={room.roomCode}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(0, 0, 0, 0.5)',
                              border: '1px solid rgba(0, 240, 255, 0.2)',
                              borderRadius: '12px',
                              padding: '14px 18px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div
                                style={{
                                  background: 'rgba(0, 240, 255, 0.1)',
                                  border: '1px solid var(--neon-cyan)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '1.1rem',
                                  fontWeight: '900',
                                  fontFamily: 'Rajdhani, sans-serif',
                                  color: 'var(--neon-cyan)',
                                  letterSpacing: '2px'
                                }}
                              >
                                {room.roomCode}
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                                  Host: {room.hostName || 'Warrior'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                                  Lobby status: Waiting for players
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: 'var(--neon-gold)',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                <Users size={16} />
                                <span>{room.playersCount || 1}/7 Players</span>
                              </div>

                              <button
                                onClick={() => handleJoinByCode(room.roomCode)}
                                style={{
                                  background: 'linear-gradient(90deg, #00f0ff 0%, #0077ff 100%)',
                                  border: 'none',
                                  color: '#000',
                                  padding: '8px 20px',
                                  borderRadius: '8px',
                                  fontWeight: 'bold',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
                                }}
                              >
                                Join Match
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CREATE PRIVATE ROOM */}
                {lobbyTab === 'create' && (
                  <div
                    style={{
                      background: 'rgba(14, 22, 42, 0.88)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color: 'var(--neon-cyan)' }}>
                      HOST A NEW BATTLE ARENA
                    </h3>
                    <p style={{ margin: '0 0 18px 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
                      Supports 2 to 7 players. Once you commence the battle, the match locks to external players and late joiners become Spectators.
                    </p>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '22px' }}>
                      <input
                        type="checkbox"
                        checked={isPremium}
                        onChange={(e) => setIsPremium(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>Include 157-Card Premium Deck (with Kontrol Cards & Blitz Attacks)</span>
                    </label>

                    <button
                      onClick={handleCreateMatch}
                      className="btn-enter-game-cta"
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '1.15rem',
                        justifyContent: 'center',
                        letterSpacing: '1px'
                      }}
                    >
                      <Swords size={20} />
                      <span>CREATE ROOM AS HOST</span>
                    </button>
                  </div>
                )}

                {/* TAB 3: JOIN WITH CODE */}
                {lobbyTab === 'join' && (
                  <div
                    style={{
                      background: 'rgba(14, 22, 42, 0.88)',
                      border: '1px solid rgba(255, 230, 0, 0.3)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color: 'var(--neon-gold)' }}>
                      JOIN PRIVATE ROOM
                    </h3>
                    <p style={{ margin: '0 0 18px 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
                      Enter the 6-character Match Room code shared by your friend or tournament host.
                    </p>

                    <input
                      type="text"
                      placeholder="ENTER 6-CHARACTER CODE"
                      value={matchId}
                      onChange={(e) => setMatchId(e.target.value.toUpperCase())}
                      maxLength={6}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.65)',
                        border: '1.5px solid var(--neon-gold)',
                        borderRadius: '10px',
                        padding: '12px',
                        color: '#fff',
                        fontSize: '1.3rem',
                        textAlign: 'center',
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        boxSizing: 'border-box',
                        marginBottom: '20px'
                      }}
                    />

                    <button
                      onClick={() => handleJoinByCode(matchId)}
                      disabled={!matchId || matchId.length < 4}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: matchId && matchId.length >= 4 ? 'pointer' : 'not-allowed',
                        background:
                          matchId && matchId.length >= 4
                            ? 'linear-gradient(90deg, #ffd700 0%, #ff9900 100%)'
                            : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: matchId && matchId.length >= 4 ? '#000' : 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <Wifi size={20} />
                      <span>JOIN ROOM</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* In-Lobby Waiting Room View */
              <div
                style={{
                  maxWidth: '680px',
                  margin: '0 auto',
                  zIndex: 10,
                  background: 'rgba(14, 22, 42, 0.92)',
                  border: '1.5px solid var(--neon-cyan)',
                  borderRadius: '20px',
                  padding: '28px 32px',
                  textAlign: 'center',
                  boxShadow: '0 0 35px rgba(0, 240, 255, 0.25)'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '6px' }}>
                  MATCH CODE (SHARE WITH OPPONENTS)
                </div>
                <div
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: '900',
                    color: 'var(--neon-cyan)',
                    letterSpacing: '8px',
                    fontFamily: 'Rajdhani, sans-serif',
                    textShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
                    marginBottom: '20px'
                  }}
                >
                  {matchId}
                </div>

                {/* Player List (Up to 7) */}
                <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
                      paddingBottom: '8px',
                      marginBottom: '12px'
                    }}
                  >
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>WARRIORS IN LOBBY</strong>
                    <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                      {gameState.players?.length}/7 PLAYERS
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gameState.players?.map((pId, idx) => {
                      const charKey =
                        gameState.characterSelections?.[pId] ||
                        (pId === playerId ? selectedCharacter : 'chynaman');
                      const charData = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
                      const isMe = pId === playerId;
                      const isRoomHost = pId === (gameState.host || gameState.players[0]);

                      return (
                        <div
                          key={pId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isMe ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 0, 0, 0.45)',
                            border: isMe ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            padding: '10px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `2px solid ${charData.themeColor}`
                              }}
                            >
                              <img
                                src={getAssetUrl(charData.image)}
                                alt={charData.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>
                                {gameState.playerNames?.[pId] || charData.name} {isMe ? '(You)' : ''}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                                Character: {charData.name} · {charData.element}
                              </div>
                            </div>
                          </div>

                          {isRoomHost && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255, 230, 0, 0.15)',
                                border: '1px solid var(--neon-gold)',
                                color: 'var(--neon-gold)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 'bold'
                              }}
                            >
                              <Crown size={13} /> HOST
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isHost ? (
                  <button
                    onClick={handleStartGame}
                    disabled={gameState.players?.length < 2}
                    className="btn-end-turn-cta flashing-end-turn-cta"
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '14px',
                      fontSize: '1.3rem',
                      justifyContent: 'center',
                      cursor: gameState.players?.length >= 2 ? 'pointer' : 'not-allowed',
                      opacity: gameState.players?.length >= 2 ? 1 : 0.5
                    }}
                  >
                    <Swords size={24} />
                    <span>
                      {gameState.players?.length >= 2
                        ? 'COMMENCE BATTLE (LOCK ROOM)'
                        : 'WAITING FOR PLAYERS (MIN 2)...'}
                    </span>
                  </button>
                ) : (
                  <div
                    style={{
                      color: 'var(--neon-gold)',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      padding: '12px',
                      background: 'rgba(255, 230, 0, 0.08)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 230, 0, 0.2)'
                    }}
                  >
                    ⏳ Waiting for Room Host to commence battle...
                  </div>
                )}
              </div>
            )}
          </div>
        </DynamicScaleWrapper>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE MULTIPLAYER BATTLE ARENA
  // ==========================================

  return (
    <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <DynamicScaleWrapper>
        <div
          className={`webgl-screen arena-screen ${isShaking ? 'shake-animation damage-flash-overlay' : ''} ${turnFlash ? 'turn-flash-pulse' : ''}`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Floating In-App Notice / Toast (No Browser Alerts) */}
          {inAppNotice && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: inAppNotice.type === 'error'
                  ? 'linear-gradient(90deg, #ff2a55 0%, #c00028 100%)'
                  : inAppNotice.type === 'info'
                  ? 'linear-gradient(90deg, #00f0ff 0%, #0077ff 100%)'
                  : 'linear-gradient(90deg, #ffe600 0%, #ff9900 100%)',
                color: '#000',
                fontWeight: '900',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0, 240, 255, 0.4)',
                border: '1.5px solid rgba(255, 255, 255, 0.6)'
              }}
            >
              <AlertTriangle size={18} />
              <span>{inAppNotice.msg}</span>
              <button
                onClick={() => setInAppNotice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000',
                  cursor: 'pointer',
                  padding: '0 0 0 6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Leave Confirmation Modal */}
          {showLeaveConfirm && (
            <div className="arena-modal-backdrop" onClick={() => setShowLeaveConfirm(false)}>
              <div
                className="arena-modal-card"
                style={{ border: '2px solid var(--neon-crimson)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ color: 'var(--neon-crimson)', margin: '0 0 10px 0' }}>Forfeit Match?</h2>
                <p style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 20px 0' }}>
                  Are you sure you want to leave the arena? You will forfeit your place and other players will be notified.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLeaveConfirm(false);
                      broadcastLeave(matchId, playerId);
                      setGameState(null);
                      setMatchId('');
                      setIsSpectator(false);
                    }}
                    style={{
                      padding: '8px 20px',
                      background: 'var(--neon-crimson)',
                      border: 'none',
                      color: '#000',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Confirm Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Winner Modal */}
          {winner && (
            <div className="arena-modal-backdrop">
              <div
                className="arena-modal-card"
                style={{ border: '2px solid var(--neon-gold)', textAlign: 'center', padding: '32px' }}
              >
                <Trophy size={64} color="var(--neon-gold)" style={{ margin: '0 auto 16px auto' }} />
                <h1
                  style={{
                    color: 'var(--neon-gold)',
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '2.4rem',
                    margin: '0 0 8px 0'
                  }}
                >
                  VICTORY ACHIEVED!
                </h1>
                <p style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 24px 0' }}>
                  <strong>{winner.name}</strong> restored balance and emerged victorious in Kontrola!
                </p>
                <button
                  onClick={() => {
                    setGameState(null);
                    setMatchId('');
                    setWinner(null);
                    navigate('/');
                  }}
                  className="btn-enter-game-cta"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', justifyContent: 'center' }}
                >
                  RETURN TO HUB
                </button>
              </div>
            </div>
          )}

          {/* TOP HUD BAR WITH PROMINENT TURN STATUS */}
          <header className="arena-top-hud">
            <div className="hud-title-group">
              <span className="hud-sparkle">✦</span>
              <div className="hud-brand-title">
                <strong>ATTENTION 注意 TCG</strong>
                <span className="hud-format-tag">
                  {isSpectator ? 'SPECTATOR MODE' : 'KONTROLA MULTIPLAYER'}
                </span>
              </div>
            </div>

            {/* Glowing Turn Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 16px',
                borderRadius: '10px',
                background: isSpectator
                  ? 'rgba(0, 240, 255, 0.12)'
                  : isMyTurn
                  ? 'rgba(57, 255, 20, 0.15)'
                  : 'rgba(255, 51, 102, 0.12)',
                border: isSpectator
                  ? '1.5px solid var(--neon-cyan)'
                  : isMyTurn
                  ? '2px solid #39ff14'
                  : '1.5px solid rgba(255, 51, 102, 0.4)',
                boxShadow: isMyTurn ? '0 0 20px rgba(57, 255, 20, 0.4)' : 'none'
              }}
            >
              {isSpectator ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                  <Eye size={18} />
                  <span>SPECTATING · {activeTurnPlayerName}'S TURN</span>
                </div>
              ) : isMyTurn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#39ff14', fontWeight: 'bold' }}>
                  <Zap size={18} fill="#39ff14" />
                  <span style={{ fontSize: '0.95rem', letterSpacing: '1px' }}>⚡ YOUR TURN TO STRIKE!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff88aa', fontWeight: 'bold' }}>
                  <Clock size={16} />
                  <span>WAITING FOR {activeTurnPlayerName.toUpperCase()}...</span>
                </div>
              )}

              {/* Turn & Round Details */}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                T{turnNum} · R{roundNum}
              </span>

              {/* Room Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neon-cyan)', fontSize: '0.78rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                <Wifi size={13} /> {matchId}
              </div>

              {/* 60s Turn Countdown Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: turnSecondsLeft <= 15 ? 'rgba(255, 42, 85, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                  border: turnSecondsLeft <= 15 ? '1px solid #ff2a55' : '1px solid rgba(255,255,255,0.15)',
                  color: turnSecondsLeft <= 15 ? '#ff2a55' : 'var(--neon-cyan)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  fontFamily: 'Rajdhani, sans-serif'
                }}
                title="Turn time remaining"
              >
                <Clock size={13} />
                <span>{turnSecondsLeft}s</span>
              </div>

              {/* Host Skip Inactive Player Button (Unlocks after 30s of inactivity) */}
              {isHost && !isMyTurn && gameState?.status === 'active' && turnSecondsLeft <= 30 && (
                <button
                  onClick={handleForceSkipCurrentPlayer}
                  style={{
                    background: 'rgba(255, 51, 102, 0.2)',
                    border: '1px solid var(--neon-crimson)',
                    color: '#ff88aa',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Host skip inactive player to unblock match"
                >
                  <FastForward size={12} />
                  <span>SKIP INACTIVE ({turnSecondsLeft}s)</span>
                </button>
              )}

              {/* ET Claim Reminder */}
              {isMyTurn && !myCharacter?.claimedTurnET && !isSpectator && (
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
                onClick={() => setShowLeaveConfirm(true)}
                style={{ borderColor: 'var(--neon-crimson)', color: 'var(--neon-crimson)' }}
              >
                <ArrowLeft size={16} />
                <span>LEAVE</span>
              </button>
            </div>
          </header>

          {/* 3-COLUMN ARENA STAGE GRID */}
          <div className="arena-stage-grid">
            {/* Left Column: Scoreboard & Player Standings */}
            <aside className="arena-col-left">
              <div className="arena-panel scoreboard-panel">
                <div className="panel-title-bar">
                  <span className="panel-kicker">WARRIORS SCOREBOARD</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>
                    {gameState.players?.length} Players
                  </span>
                </div>

                <div className="arena-players-list">
                  {gameState.players?.map((pId, idx) => {
                    const pChar = gameState.characterStates?.[pId];
                    if (!pChar) return null;
                    const isActiveTurn = gameState.turn === pId;
                    const isMe = pId === playerId;

                    return (
                      <div
                        key={pId}
                        className={`arena-score-row ${isActiveTurn ? 'active-score-row' : ''} ${pChar.isDefeated ? 'player-defeated' : ''}`}
                        style={{ position: 'relative' }}
                      >
                        {activeTauntBubble && activeTauntBubble.senderId === pId && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-42px',
                              left: '10px',
                              background: '#fff',
                              color: '#000',
                              padding: '5px 12px',
                              borderRadius: '16px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              zIndex: 20,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                              border: '2px solid rgba(255,200,0,0.6)'
                            }}
                          >
                            🗣️ {activeTauntBubble.text}
                            <div
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                left: '18px',
                                width: 0,
                                height: 0,
                                borderLeft: '7px solid transparent',
                                borderRight: '7px solid transparent',
                                borderBottom: '8px solid #fff'
                              }}
                            />
                          </div>
                        )}

                        <div className={`arena-num-pill pill-${idx + 1}`}>{idx + 1}</div>

                        <div
                          className="arena-score-avatar"
                          style={{
                            borderColor: pChar.themeColor || 'var(--neon-cyan)',
                            overflow: 'hidden',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)'
                          }}
                        >
                          <img
                            src={getAssetUrl(pChar.image)}
                            alt={pChar.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div className="arena-score-meta" style={{ flex: 1, minWidth: 0 }}>
                          <strong className="arena-player-name" style={{ color: isMe ? 'var(--neon-cyan)' : '#fff' }}>
                            {pChar.name} {isMe ? '(You)' : ''}
                          </strong>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                            <span>⚡ {pChar.energyTokens || 0} ET</span>
                            <span>💎 {pChar.crystals || 0}/3</span>
                            {pChar.poisonCount > 0 && <span style={{ color: 'var(--neon-green)' }}>☠️ {pChar.poisonCount}</span>}
                          </div>
                        </div>

                        <div className="arena-score-val-block">
                          <span
                            className="arena-lp-number"
                            style={{ color: pChar.hp < 30 ? 'var(--neon-crimson)' : 'var(--neon-cyan)' }}
                          >
                            {pChar.hp}
                          </span>
                          <span className="arena-lp-tag">HP</span>
                        </div>

                        {isActiveTurn && (
                          <div className="arena-active-crown">
                            <Crown size={14} color="var(--neon-crimson)" fill="var(--neon-crimson)" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Effects Panel */}
              <div className="arena-panel active-effects-panel">
                <div className="panel-title-bar">
                  <span className="panel-kicker">YOUR ACTIVE STATUS</span>
                </div>
                <div className="effects-icons-row">
                  {myCharacter?.poisonCount > 0 && (
                    <div className="effect-chip effect-poison">
                      <Skull size={15} color="var(--neon-green)" />
                      <span className="effect-name">Poison</span>
                      <span className="effect-count">{myCharacter.poisonCount}</span>
                    </div>
                  )}
                  <div className="effect-chip effect-shield">
                    <Shield size={15} color="var(--neon-cyan)" />
                    <span className="effect-name">Shield</span>
                    <span className="effect-count">+{myCharacter?.shield || 0}</span>
                  </div>
                  <div className="effect-chip effect-atk">
                    <Zap size={15} color="var(--neon-gold)" />
                    <span className="effect-name">ET Fuel</span>
                    <span className="effect-count">{myCharacter?.energyTokens || 0}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Center Column: Combat Orbit Stage */}
            <main
              className="arena-col-center"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}
            >
              <div
                className="combat-orbit-stage"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
              >
                {/* Orbit Circle with Active Player Avatar & Turn Status */}
                <div
                  className="arena-orbit-ring"
                  style={{
                    position: 'relative',
                    width: '320px',
                    height: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(0,240,255,0.09) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    border: isMyTurn ? '2.5px dashed #39ff14' : '2px dashed rgba(255,255,255,0.15)',
                    boxShadow: isMyTurn ? '0 0 30px rgba(57, 255, 20, 0.25)' : 'none'
                  }}
                >
                  {activeTurnChar && (
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `2.5px solid ${activeTurnChar.themeColor || 'var(--neon-cyan)'}`,
                        boxShadow: `0 0 20px ${activeTurnChar.themeColor || 'var(--neon-cyan)'}`,
                        marginBottom: '10px'
                      }}
                    >
                      <img
                        src={getAssetUrl(activeTurnChar.image)}
                        alt={activeTurnChar.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: isMyTurn ? '#39ff14' : 'var(--neon-cyan)',
                      fontFamily: 'Rajdhani, sans-serif',
                      letterSpacing: '1px'
                    }}
                  >
                    {isSpectator
                      ? `SPECTATING · ${activeTurnPlayerName.toUpperCase()}`
                      : isMyTurn
                      ? '⚡ YOUR TURN TO STRIKE!'
                      : `${activeTurnPlayerName.toUpperCase()}'S TURN`}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginTop: '6px', textAlign: 'center', padding: '0 20px' }}>
                    {isSpectator
                      ? 'Observing realtime multiplayer combat clash'
                      : isMyTurn
                      ? 'Select an Action Card from your hand below'
                      : `Waiting for ${activeTurnPlayerName} to execute their turn...`}
                  </div>
                </div>
              </div>
            </main>

            {/* Right Column: Hand and Combat Actions */}
            <aside className="arena-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Hand of 10 Action Cards */}
              <div className="arena-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="panel-title-bar">
                  <span className="panel-kicker">
                    {isSpectator ? 'SPECTATOR VIEW' : `YOUR HAND (${myHand.length}/10 CARDS)`}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '10px',
                    overflowY: 'auto',
                    opacity: (!isMyTurn || isSpectator) ? 0.6 : 1,
                    pointerEvents: (!isMyTurn || isSpectator) ? 'none' : 'auto'
                  }}
                >
                  {myHand.map((card) => {
                    const isSelected = selectedActionCard?.id === card.id;
                    const cardArt = getCardGraphicUrl(card.name, myCharacter.id);

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (isMyTurn && !isSpectator) {
                            playClick();
                            setSelectedActionCard(card);
                          }
                        }}
                        style={{
                          background: isSelected ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 0, 0, 0.45)',
                          border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected ? '0 0 15px var(--neon-cyan)' : 'none',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: isMyTurn && !isSpectator ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ height: '70px', overflow: 'hidden', background: '#000' }}>
                          <img src={cardArt} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '6px', fontSize: '0.75rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {card.name}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', marginTop: '2px' }}>
                            <span>{card.type}</span>
                            <span>⚡ {card.costET || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target & Move Selection Panel (when Attack card is selected) */}
              {selectedActionCard?.type === 'ATTACK' && !isSpectator && (
                <div className="arena-panel" style={{ background: 'rgba(20, 10, 20, 0.95)', border: '1.5px solid var(--neon-crimson)', padding: '12px' }}>
                  <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                    <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>1. SELECT TARGET</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {opponents.map((oId) => {
                      const oChar = gameState.characterStates?.[oId];
                      if (!oChar || oChar.isDefeated) return null;
                      const isSelectedTarget = selectedTargetId === oId;

                      return (
                        <button
                          key={oId}
                          onClick={() => {
                            playClick();
                            setSelectedTargetId(oId);
                          }}
                          style={{
                            flex: '1 1 45%',
                            background: isSelectedTarget ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 0, 0, 0.55)',
                            border: isSelectedTarget ? '1.5px solid var(--neon-crimson)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isSelectedTarget ? 'var(--neon-crimson)' : '#fff',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 'bold'
                          }}
                        >
                          <div>{oChar.name}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{oChar.hp} HP</div>
                        </button>
                      );
                    })}
                  </div>

                  {!selectedActionCard?.name?.includes('LIGHTNING') && (
                    <>
                      <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                        <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>2. SELECT CHARACTER MOVE</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {Object.entries(myCharacter.attacks || {}).map(([atkName, atkData]) => {
                          const isSelectedAtk = selectedCharacterAttack === atkName;
                          return (
                            <button
                              key={atkName}
                              onClick={() => {
                                playClick();
                                setSelectedCharacterAttack(atkName);
                              }}
                              style={{
                                background: isSelectedAtk ? 'rgba(255, 51, 102, 0.25)' : 'rgba(0, 0, 0, 0.45)',
                                border: isSelectedAtk ? '1.5px solid var(--neon-crimson)' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: isSelectedAtk ? 'var(--neon-crimson)' : '#fff',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                textAlign: 'left'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{atkName}</div>
                                <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>{atkData.desc}</div>
                              </div>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{atkData.ap} AP</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </aside>
          </div>

          {/* Bottom Controls Bar */}
          <footer className="arena-bottom-controls">
            <div className="bottom-left-buttons">
              <button className="btn-arena-chat" onClick={() => { playClick(); setShowChat(true); }}>
                <MessageSquare size={16} />
                <span>CHAT</span>
              </button>
              {!isSpectator && (
                <button
                  className="btn-arena-chat"
                  onClick={() => { playClick(); setShowTaunt(true); }}
                  style={{ borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}
                >
                  <span>🗣️</span>
                  <span>TAUNT</span>
                </button>
              )}
            </div>

            <div className="bottom-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isSpectator ? (
                <div
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    color: 'var(--neon-cyan)',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Eye size={18} />
                  <span>SPECTATOR MODE (OBSERVING)</span>
                </div>
              ) : (
                <>
                  {isMyTurn && (
                    <button
                      className="btn-pass-turn"
                      onClick={handlePassTurn}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1.5px solid rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        padding: '12px 18px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.5px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Pass turn without playing any cards or spending energy"
                    >
                      <SkipForward size={16} />
                      <span>PASS / END TURN</span>
                    </button>
                  )}
                  <button
                    className={`btn-end-turn-cta ${isMyTurn && selectedActionCard ? 'flashing-end-turn-cta' : ''}`}
                    disabled={
                      !isMyTurn ||
                      !selectedActionCard ||
                      (selectedActionCard.type === 'ATTACK' &&
                        !selectedActionCard.name.includes('BLITZ') &&
                        !selectedActionCard.name.includes('LIGHTNING') &&
                        (!selectedCharacterAttack || !selectedTargetId)) ||
                      (selectedActionCard.name.includes('VITALITY GAIN V20') &&
                        (myCharacter?.level || 1) < 2)
                    }
                    onClick={playTurn}
                    style={{
                      boxShadow: isMyTurn && selectedActionCard ? '0 0 20px #39ff14' : 'none',
                      border: isMyTurn && selectedActionCard ? '2px solid #39ff14' : '2px solid rgba(255,255,255,0.1)',
                      background: isMyTurn && selectedActionCard ? 'rgba(57, 255, 20, 0.15)' : 'rgba(0,0,0,0.5)',
                      color: isMyTurn && selectedActionCard ? '#39ff14' : 'rgba(255,255,255,0.3)',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: isMyTurn && selectedActionCard ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    <Dices size={18} />
                    <span>{selectedActionCard?.type === 'ATTACK' ? 'ROLL COMBAT CLASH' : 'PLAY ACTION CARD'}</span>
                  </button>
                </>
              )}
            </div>
          </footer>

          {/* Chat Modal */}
          {showChat && (
            <KontrolaChatModal
              players={gameState.players.map((p) => ({
                id: p,
                name: gameState.playerNames?.[p] || gameState.characterStates?.[p]?.name
              }))}
              activePlayerIndex={gameState.players.indexOf(playerId)}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onClose={() => setShowChat(false)}
            />
          )}

          {/* Taunt Modal */}
          {showTaunt && (
            <KontrolaTauntModal
              activePlayerName={myCharacter?.name || playerName || 'Warrior'}
              onClose={() => setShowTaunt(false)}
              onTaunt={handleSendTaunt}
            />
          )}

          {/* VISION X1 REVEAL MODAL */}
          {revealedVision && (
            <div
              style={{
                position: 'absolute',
                top: '72px',
                right: '32px',
                width: '360px',
                maxHeight: '400px',
                background: 'rgba(10, 20, 40, 0.96)',
                border: '2px solid var(--neon-cyan)',
                borderRadius: '14px',
                padding: '16px',
                zIndex: 1500,
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.35)',
                fontFamily: 'Outfit, sans-serif',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.25)', paddingBottom: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                  <Eye size={18} />
                  <span>VISION X1 REVEAL ({revealedVision.targetName})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', fontWeight: 'bold' }}>
                  {Math.max(0, Math.ceil((revealedVision.expiresAt - Date.now()) / 1000))}s left
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxHeight: '290px', overflowY: 'auto' }}>
                {revealedVision.cards.map((c, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', marginTop: '2px' }}>{c.type} · ⚡{c.costET || 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SYNCHRONIZED AUTHENTIC PIP DICE COMBAT CLASH MODAL */}
          {activeCombat && (
            <KontrolaDiceRoller
              combatData={activeCombat}
              precalculatedRolls={activeCombat.precalculatedRolls}
              isAttacker={activeCombat.attackerId === playerId || (isHost && !activeCombat.attackerId)}
              isSpectator={isSpectator || (activeCombat.attackerId !== playerId && activeCombat.targetId !== playerId)}
              isExternallyRolling={isDiceRollingSync}
              onTriggerRoll={handleTriggerDiceRoll}
              onClose={() => handleCloseDiceScreen(false)}
              onForceClose={() => handleCloseDiceScreen(false)}
              onCombatComplete={() => handleCloseDiceScreen(true)}
            />
          )}
        </div>
      </DynamicScaleWrapper>
    </div>
  );
}

