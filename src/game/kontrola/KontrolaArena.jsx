import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wifi, Swords, Shield, Skull, Zap, ScrollText, MessageSquare,
  Dices, Crown, Trophy, Layers, Clock, HelpCircle, X, Eye, Users, RefreshCw,
  Lock, Radio, AlertTriangle, Play, Sparkles, CheckCircle2, SkipForward, FastForward,
  Music, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { DynamicScaleWrapper } from '../../components/DynamicScaleWrapper';
import { soundFX } from '../utils/audio';
import { getAssetUrl } from '../data/characters';
import { KONTROLA_CHARACTERS, KONTROLA_ACTION_CARDS, generateDeck, dealInitialHands, resolveTurn, rollDice } from './KontrolaEngine';
import {
  createMatch, joinMatch, subscribeToMatch, requestJoin, takeTurn, broadcastState,
  advertiseRoom, closeRoom, subscribeToGlobalLobby, broadcastLeave, requestSync,
  broadcastUIEvent, rejectJoin
} from './MultiplayerClient';
import { authService } from '../../services/authService';
import { economyService } from '../../services/economyService';
import { musicService } from '../../services/musicService';
import { sessionService } from '../../services/preferenceService';
import { getCardGraphicUrl, getCharacterAttackGraphicUrl, getWildCardGraphicUrl } from './kontrolaAssets';
import KontrolaDiceRoller, { CanvasPipDie } from './KontrolaDiceRoller';
import KontrolaChatModal from './KontrolaChatModal';
import KontrolaTauntModal from './KontrolaTauntModal';
import { LeaderboardModal } from '../../components/LeaderboardModal';
// MusicPlayer replaced by native draggable widget
import SecretAllianceInviteModal from '../components/SecretAllianceInviteModal';
import AllianceChatModal from '../components/AllianceChatModal';
import AllianceStatusBadge from '../components/AllianceStatusBadge';
import CrystalSplitModal from '../components/CrystalSplitModal';
import CrystalDiceRoller from '../components/CrystalDiceRoller';
import ReconnectModal from '../components/ReconnectModal';
import XChangeModal from '../components/XChangeModal';
import SoulAllianceTradeModal from '../components/SoulAllianceTradeModal';
import { createGameRoom, updateGameRoom, fetchGameRoom } from '../../services/roomService';
import { tournamentService } from '../../services/tournamentService';
import KontrolaTournamentHub from './KontrolaTournamentHub';
import KontrolaBracketView from './KontrolaBracketView';
import { cosmeticsService } from '../../services/cosmeticsService';
import { characterLicenseService, FREE_USAGE_LIMIT } from '../../services/characterLicenseService';
import CharacterUnlockModal from '../../components/CharacterUnlockModal';
import CardVFXWrapper from './vfx/CardVFXWrapper';

import '../../pages/GamePage.css';

// Collision-proof unique player ID � sourced from DB or generated fresh.
// generateUniquePlayerId is kept synchronous for useState initializer;
// sessionService.getPlayerId() is called after auth loads to upgrade to DB-sourced ID.
const generateUniquePlayerId = () => {
  try {
    let pid = sessionStorage.getItem('kontrola_player_id');
    if (!pid) {
      pid = localStorage.getItem('kontrola_player_id');
    }
    if (!pid) {
      pid = 'warr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('kontrola_player_id', pid);
    }
    return pid;
  } catch {
    return 'warr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }
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

// Bulletproof helpers to handle both string cards ('SHIELD BASIC') and card objects ({ id, name, type, costET })
export const getSafeCardName = (c) => typeof c === 'string' ? c : (c?.name || '');
export const getSafeCardType = (c) => {
  if (typeof c === 'object' && c?.type) return c.type;
  const name = getSafeCardName(c).toUpperCase();
  const found = KONTROLA_ACTION_CARDS.find(card => card.name.toUpperCase() === name);
  if (found?.type) return found.type;
  if (name.includes('DRAIN')) return 'ATTACK';
  if (name.includes('HEAL') || name.includes('REVIVE') || name.includes('ANTIDOTE') || name.includes('VITALITY')) return 'HEAL';
  if (name.includes('POISON') || name.includes('FREEZE') || name.includes('SLEEPY') || name.includes('BURN')) return 'STATUS';
  if (name.includes('X-CHANGE') || name.includes('VISION') || name.includes('SWAP') || name.includes('TIME MACHINE')) return 'OTHERS';
  if (name.includes('SHIELD') || name.includes('DEFENCE') || name.includes('DODGE') || name.includes('BOOMERANG')) return 'DEFENSE';
  if (name.includes('DRAIN') || name.includes('SOUL ALLIANCE') || name.includes('ABANDON') || name.includes('KONTROL') || name.includes('RETREAT')) return 'TACTICAL';
  return 'ATTACK';
};
export const getSafeCardId = (c, idx = 0) => (typeof c === 'object' && c?.id) ? c.id : `${getSafeCardName(c)}_${idx}`;
export const getSafeCardCost = (c) => typeof c === 'object' && typeof c?.costET === 'number' ? c.costET : 0;

export const findSafeCardIndex = (hand, identifier) => {
  if (!Array.isArray(hand) || !identifier) return -1;
  const targetName = typeof identifier === 'string' ? identifier : identifier?.name;
  const targetId = typeof identifier === 'object' ? identifier?.id : null;
  if (targetId) {
    const byId = hand.findIndex(c => typeof c === 'object' && c?.id === targetId);
    if (byId !== -1) return byId;
  }
  if (targetName) {
    return hand.findIndex(c => (typeof c === 'string' ? c : c?.name) === targetName);
  }
  return -1;
};

export default function KontrolaArena() {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState(() => {
    // Fast init from sessionStorage (tab-isolated); avoids auto-connecting to old rooms on new tabs
    try { return sessionStorage.getItem('kontrola_current_match') || ''; }
    catch (e) { return ''; }
  });
  const [gameState, setGameState] = useState(null);
  const [playerId] = useState(generateUniquePlayerId);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [playerName, setPlayerName] = useState(() => {
    try {
      const cached = localStorage.getItem('tcg_warrior_username');
      if (cached) return cached;
    } catch (e) {}
    return 'Player';
  });
  const [isHost, setIsHost] = useState(false);
  const isJoiningRef = useRef(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [error, setError] = useState(null);
  const [inAppNotice, setInAppNotice] = useState(null);
  const hasLoggedMatchRef = useRef(false);
  const disconnectTimeoutsRef = useRef({});

  // Auto-sync player username from logged-in account
  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        authService.getProfile(user.id).then((prof) => {
          if (prof) {
            setUserProfile(prof);
            if (prof.username) {
              setPlayerName(prof.username);
              try {
                localStorage.setItem('tcg_warrior_username', prof.username);
              } catch (e) {}
            }
          }
        });

        // Restore last session match ID from DB if not already set
        const currentMatchId = matchIdRef.current;
        if (!currentMatchId) {
          sessionService.getLastMatchId(user.id).then(async (savedMatchId) => {
            if (savedMatchId) {
              // Only show the rejoin banner if the game is still in-progress
              try {
                const result = await fetchGameRoom(savedMatchId);
                // Show rejoin only if room exists and is not ended/finished
                if (result && !result.error &&
                    result.gameState?.status !== 'ended' &&
                    result.gameState?.status !== 'finished' &&
                    result.gameState?.status !== 'completed' &&
                    result.gameState?.status !== 'game_over') {
                  setLastActiveMatchId(savedMatchId);
                }
              } catch {
                // If we can't verify, don't show the rejoin banner — avoid false positives
              }
            }
          });
        }
      }
    });

    // Load approved music tracks for gameplay
    musicService.getApprovedMusic().then((tracks) => {
      if (tracks && tracks.length > 0) {
        setMusicTracks(tracks);
      }
    }).catch(err => console.warn('Failed to load music tracks:', err));
  }, []);

  // In-app floating alert/toast helper
  const showNotice = (msg, type = 'warning') => {
    setInAppNotice({ msg, type });
    setTimeout(() => {
      setInAppNotice(null);
    }, 4000);
  };

  // Lobby Tab Navigation ('browse' | 'create' | 'join')
  const [lobbyTab, setLobbyTab] = useState('browse');
  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [tournamentMatchContext, setTournamentMatchContext] = useState(null);
  const [openRooms, setOpenRooms] = useState([]);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState(''); // separate from matchId to avoid pre-filling from localStorage

  const [selectedCharacter, setSelectedCharacter] = useState('chynaman');
  const [quotaUnlockChar, setQuotaUnlockChar] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [appSettings, setAppSettings] = useState({ match_cost: 1, premium_modules: ['kontrola'], module_costs: {} });

  // Ensure default selected character is a playable character (not exhausted)
  useEffect(() => {
    const lic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
    if (!lic.canPlay) {
      const firstPlayable = characterLicenseService.getFirstPlayableCharacter(currentUser?.id);
      if (firstPlayable) setSelectedCharacter(firstPlayable);
    }
  }, [currentUser]);

  useEffect(() => {
    economyService.getAppSettings().then(settings => {
      setAppSettings(settings);
    }).catch(err => console.warn('Failed fetching economy settings in Arena', err));
  }, []);

  // Set deck tier based on user's Pro/Basic status
  useEffect(() => {
    if (userProfile) {
      const isProUser = userProfile.is_premium === true;
      setIsPremium(isProUser);
      console.log(`?? Deck Mode: ${isProUser ? '?? PRO (157 cards - Basic + Premium + FLYER)' : '?? BASIC (100 cards)'} for ${userProfile.username}`);
    }
  }, [userProfile]);

  const [selectedActionCard, setSelectedActionCard] = useState(null);
  const [dissolvingCardId, setDissolvingCardId] = useState(null);
  const [selectedCharacterAttack, setSelectedCharacterAttack] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const showChatRef = useRef(false);
  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showTaunt, setShowTaunt] = useState(false);
  const [activeTauntBubble, setActiveTauntBubble] = useState(null);
  const [chatToasts, setChatToasts] = useState([]);

  // Music Player State
  const [musicTracks, setMusicTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Draggable Music Player State & Viewport Clamping
  const clampMusicPos = (x, y, isOpen) => {
    const width = isOpen ? 340 : 130;
    const height = isOpen ? 380 : 54;
    const maxX = Math.max(10, (typeof window !== 'undefined' ? window.innerWidth : 1200) - width - 15);
    const maxY = Math.max(10, (typeof window !== 'undefined' ? window.innerHeight : 800) - height - 15);
    return {
      x: Math.min(Math.max(15, x), maxX),
      y: Math.min(Math.max(15, y), maxY)
    };
  };

  const [musicPlayerPos, setMusicPlayerPos] = useState(() => {
    return { x: 24, y: 76 };
  });
  const [isDraggingMusic, setIsDraggingMusic] = useState(false);
  const musicDragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, hasMoved: false });

  useEffect(() => {
    const handleResize = () => {
      setMusicPlayerPos(curr => clampMusicPos(curr.x, curr.y, isMusicPlayerOpen));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMusicPlayerOpen]);

  const handleToggleMusicOpen = () => {
    setIsMusicPlayerOpen(prev => {
      const next = !prev;
      setMusicPlayerPos(curr => clampMusicPos(curr.x, curr.y, next));
      return next;
    });
  };

  const handleDragPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('.no-drag')) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = musicPlayerPos.x;
    const origY = musicPlayerPos.y;
    musicDragRef.current = { startX, startY, origX, origY, hasMoved: false };

    const onPointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      if (Math.hypot(dx, dy) > 4) {
        musicDragRef.current.hasMoved = true;
        setIsDraggingMusic(true);
        setMusicPlayerPos(clampMusicPos(origX + dx, origY + dy, isMusicPlayerOpen));
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setTimeout(() => {
        setIsDraggingMusic(false);
      }, 50);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };
  
  // NEW: Secret Alliance System State
  const [showSecretAllianceInviteModal, setShowSecretAllianceInviteModal] = useState(false);
  const [showAllianceChatModal, setShowAllianceChatModal] = useState(false);
  const [pendingAllianceInvite, setPendingAllianceInvite] = useState(null);
  const [activeAlliance, setActiveAlliance] = useState(null);
  const [allianceChatHistory, setAllianceChatHistory] = useState([]);
  const [selectedAllianceTerms, setSelectedAllianceTerms] = useState([]);
  const [allianceConfirmations, setAllianceConfirmations] = useState({ player1: false, player2: false });
  const [preselectedAllianceTargetId, setPreselectedAllianceTargetId] = useState(null);
  const inviteTimeoutRef = useRef(null);
  
  // NEW: Crystal Split System State
  const [showCrystalSplitModal, setShowCrystalSplitModal] = useState(false);
  const [crystalSplitData, setCrystalSplitData] = useState(null);

  // Interactive Card & Combat Modals
  const [xChangeModalData, setXChangeModalData] = useState(null); // { xChangeType, attackerHand, defenderHand, defenderName, targetId, actorId }
  const [soulAllianceTradeData, setSoulAllianceTradeData] = useState(null); // { allyId, allyName }
  const [pendingRevivePrompt, setPendingRevivePrompt] = useState(null); // { playerId, playerName, maxHp }
  // Burn Extinguish State (Nov 5 Update)
  const [hasAttemptedExtinguishThisTurn, setHasAttemptedExtinguishThisTurn] = useState(false);
  const [isExtinguishRolling, setIsExtinguishRolling] = useState(false);
  const [extinguishDice, setExtinguishDice] = useState(null);
  const [extinguishResult, setExtinguishResult] = useState(null);
  
  // Room Persistence State
  const [roomCode, setRoomCode] = useState(null);
  const [roomPersistenceError, setRoomPersistenceError] = useState(null);
  // Rejoin: non-null only when a previous in-progress game is detected on load
  const [lastActiveMatchId, setLastActiveMatchId] = useState(null);
  
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Synchronized Combat Clash & Dice
  const [activeCombat, setActiveCombat] = useState(null);
  const [isDiceRollingSync, setIsDiceRollingSync] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [turnFlash, setTurnFlash] = useState(false);
  const [winner, setWinner] = useState(null);

  // Automatically log match results to DB when a winner is declared (Host only)
  useEffect(() => {
    // Only the second guarded effect below handles match logging.
    // This block intentionally left empty to avoid duplicate DB writes.
  }, [winner, isHost, matchId]);

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [damagePopups, setDamagePopups] = useState([]); // [{id, value, isHeal, x, y}]

  // Helper: spawn a floating damage/heal number at a random position
  const spawnDamagePopup = (value, isHeal = false) => {
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40; // % from left
    const y = 30 + Math.random() * 30; // % from top
    setDamagePopups((prev) => [...prev, { id, value, isHeal, x, y }]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1700);
  };

  // Record match victory and award crystals � single guarded effect, DB only
  useEffect(() => {
    if (winner && !hasLoggedMatchRef.current) {
      hasLoggedMatchRef.current = true;
      const allPlayerIds = gameState?.players || [];
      const allPlayerNames = allPlayerIds.map(
        (pid) => gameState?.playerNames?.[pid] || gameState?.characterStates?.[pid]?.name || 'Player'
      );

      const doLog = async () => {
        try {
          // Host logs the global match record
          if (isHost) {
            await authService.logMatchResult({
              roomCode: matchIdRef.current || 'KONTROLA_ARENA',
              winnerId: currentUser?.id || null, // use Supabase UUID if available
              winnerName: winner.name || gameState?.playerNames?.[winner.playerId] || playerName || 'Player',
              playerIds: allPlayerIds,
              playerNames: allPlayerNames,
              gameMode: 'kontrola',
              crystalsAwarded: 3
            });
          }

          // Winner gets 3 crystals, loser gets 1 � only for authenticated users
          if (currentUser?.id) {
            const isWinner = winner.playerId === playerId;
            if (tournamentMatchContext) {
              const winnerUserId = isWinner ? currentUser?.id : (tournamentMatchContext.player1Id === currentUser?.id ? tournamentMatchContext.player2Id : tournamentMatchContext.player1Id);
              const winnerName = isWinner ? (playerName || 'Player') : (gameState?.playerNames?.[winner.playerId] || 'Opponent');

              if (isHost) {
                await tournamentService.recordGameResult({
                  tournamentId: tournamentMatchContext.tournamentId,
                  round: tournamentMatchContext.round,
                  matchIndex: tournamentMatchContext.matchIndex,
                  winnerUserId,
                  winnerName,
                  roomCode: matchIdRef.current,
                  callerId: currentUser?.id
                });
              }

              // Award match participation Gold faucet
              await authService.savePlayerMatchResult(currentUser.id, {
                won: isWinner,
                crystalsDelta: 0,
                goldDelta: isWinner ? 100 : 40,
                appSource: 'kontrola_tournament_match'
              });
            } else {
              await authService.savePlayerMatchResult(currentUser.id, {
                won: isWinner,
                crystalsDelta: isWinner ? 3 : 1,
                goldDelta: isWinner ? 100 : 40,
                appSource: 'kontrola'
              });
            }

            // Record match progress for daily quests & combat record
            cosmeticsService.recordMatchProgress(currentUser.id, isWinner);
            cosmeticsService.addSeasonXP(currentUser.id, isWinner ? 250 : 100);
          }
        } catch (e) {
          console.warn('Failed to log match result to DB:', e);
        }
      };

      doLog();
    }
  }, [winner, isHost, gameState, currentUser, playerName, playerId]);

  // Heartbeat: keep active_sessions row alive while in a match
  useEffect(() => {
    if (!matchId || !playerId || !gameState || gameState.status === 'finished') return;
    const interval = setInterval(() => {
      sessionService.heartbeat(matchId, playerId);
    }, 30_000);
    return () => clearInterval(interval);
  }, [matchId, playerId, gameState?.status]);

  // Action resolution queue on Host to prevent race conditions
  const actionQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
  // Tracks the most-recently-committed game state so queue items always see fresh state
  // even when React batches multiple setGameState calls in the same render cycle.
  const pendingStateRef = useRef(null);
  const prevTurnRef = useRef(null);
  const lastResolvedCombatIdRef = useRef(null);

  // Persistent refs to prevent WebSocket reconnection loops on state changes
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  // Clear pending state ref once React commits the real state — prevents stale pending state
  // leaking into future unrelated action resolutions
  if (pendingStateRef.current && gameState === pendingStateRef.current) {
    pendingStateRef.current = null;
  }
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

  const [turnSecondsLeft, setTurnSecondsLeft] = useState(60);
  const [revealedVision, setRevealedVision] = useState(null);
  const [visionSecondsLeft, setVisionSecondsLeft] = useState(15);

  const [defenseSeconds, setDefenseSeconds] = useState(15);

  // Hoisted Derived Match & Turn State (safe for all effects, handlers, and renders)
  const isMyTurn = Boolean(gameState?.turn === playerId && !isSpectator);
  const isPendingSecondAttack = Boolean(gameState?.pendingAttackX2For === playerId);
  const myCharacter = gameState?.characterStates?.[playerId] || KONTROLA_CHARACTERS[selectedCharacter];
  const myHand = gameState?.hands?.[playerId] || [];

  // Auto-select dummy card for 2nd hit of ATTACK X2
  useEffect(() => {
    if (isPendingSecondAttack && selectedActionCard?.id !== 'attack_x2_2nd') {
      setSelectedActionCard({ id: 'attack_x2_2nd', name: 'ATTACK X2 (2ND HIT)', type: 'ATTACK' });
    }
  }, [isPendingSecondAttack, selectedActionCard]);
  const opponents = gameState?.players ? gameState.players.filter((p) => p !== playerId).sort((a, b) => {
    const nameA = gameState.playerNames?.[a] || '';
    const nameB = gameState.playerNames?.[b] || '';
    return nameA.localeCompare(nameB);
  }) : [];
  const turnNum = gameState?.turnNumber || 1;
  const roundNum = gameState?.roundNumber || 1;
  const activeTurnPlayerName =
    gameState?.playerNames?.[gameState?.turn] ||
    gameState?.characterStates?.[gameState?.turn]?.name ||
    'Player';
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

  // Auto-expire revealed vision modal and live tick countdown
  useEffect(() => {
    if (!revealedVision) return;
    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil(((revealedVision.expiresAt || 0) - Date.now()) / 1000));
      setVisionSecondsLeft(remaining);
      if (remaining <= 0) {
        setRevealedVision(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [revealedVision]);

  // Auto-trigger Revive prompt whenever player reaches 0 HP / defeated and holds REVIVE in hand
  useEffect(() => {
    if (myCharacter && (myCharacter.hp <= 0 || myCharacter.isDefeated) && !pendingRevivePrompt) {
      const myHand = gameState?.hands?.[playerId] || [];
      const hasRevive = myHand.some(c => getSafeCardName(c).includes('REVIVE'));
      if (hasRevive) {
        setPendingRevivePrompt({
          victimId: playerId,
          victimName: myCharacter.name,
          maxHp: myCharacter.maxHp || 100
        });
      }
    }
  }, [myCharacter?.hp, myCharacter?.isDefeated, gameState?.hands, playerId, pendingRevivePrompt]);

  // Reset Burn Extinguish attempt on turn change
  useEffect(() => {
    setHasAttemptedExtinguishThisTurn(false);
    setExtinguishDice(null);
    setExtinguishResult(null);
    setIsExtinguishRolling(false);
  }, [gameState?.turn]);

  // Safety timeout: Auto-roll extinguish dice after 20s if player is AFK so turn never stalls
  useEffect(() => {
    if (isMyTurn && myCharacter && myCharacter.burnCount > 0 && !myCharacter.isDefeated && !hasAttemptedExtinguishThisTurn && !isExtinguishRolling && !extinguishResult && gameState?.status === 'active') {
      const timer = setTimeout(() => {
        handleRollExtinguishFire();
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, myCharacter?.burnCount, myCharacter?.isDefeated, hasAttemptedExtinguishThisTurn, isExtinguishRolling, extinguishResult, gameState?.status]);

  // Music player audio control
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.warn('Audio playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  // Update audio volume and mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // ==========================================


  useEffect(() => {
    if (gameState?.status === 'match_countdown') {
      const timer = setInterval(() => {
        setCountdownNumber((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdownNumber(3);
    }
  }, [gameState?.status]);
  
  useEffect(() => {
    let timer;
    if (gameState?.activeDefenseState) {
      setDefenseSeconds(15);
      timer = setInterval(() => {
        setDefenseSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (gameState.activeDefenseState.targetId === playerIdRef.current) {
              handleDefenseSelect(null);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState?.activeDefenseState]);

  const handleDefenseSelect = (card) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    playClick();
    
    console.log('[handleDefenseSelect] Defense card selected:', card?.name || 'SKIP');
    
    const payload = { actionType: 'DEFENSE_SELECTED', defenseCard: card };
    if (isHostRef.current) enqueueHostAction(payload);
    else takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    setTimeout(() => setIsProcessingAction(false), 2500);
  };



  // ==========================================
  // ROLL-OFF AND DIRECTION SELECT HANDLERS
  // ==========================================
  const [rollingOffPlayers, setRollingOffPlayers] = useState({});

  // Clear rolling animation when tiebreak is detected
  useEffect(() => {
    if (gameState?.tiebreakPool && gameState.tiebreakPool.length > 0) {
      // Clear rolling state for tied players so they can re-roll
      const tiedPlayerIds = gameState.tiebreakPool;
      setRollingOffPlayers(prev => {
        const updated = { ...prev };
        tiedPlayerIds.forEach(pId => {
          delete updated[pId];
        });
        return updated;
      });
    }
  }, [gameState?.tiebreakPool]);

  // Also clear isProcessingAction when tie is detected to unlock the button
  useEffect(() => {
    if (gameState?.tiebreakPool && gameState.tiebreakPool.includes(playerId)) {
      setIsProcessingAction(false);
    }
  }, [gameState?.tiebreakPool, playerId]);

  const handleRollOff = () => {
    if (isProcessingAction || rollingOffPlayers[playerId]) return;
    
    // Broadcast animation to everyone immediately (fire-and-forget, never block execution)
    broadcastUIEvent(matchIdRef.current, 'roll_off_animation', { actorId: playerId }).catch(() => {});
    
    // Trigger local animation with a guaranteed auto-release safety timeout
    setRollingOffPlayers(prev => ({ ...prev, [playerId]: true }));
    
    // Safety auto-clear timeout: never allow rolling animation to hang indefinitely
    const safetyTimer = setTimeout(() => {
      setRollingOffPlayers(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
      setIsProcessingAction(false);
    }, 4000);
    
    playClick();
    if (soundFX?.playDiceRoll) soundFX.playDiceRoll();
    setIsProcessingAction(true);
    
    // Animate dice rolling for 1.2s before submitting result
    setTimeout(() => {
      const d1 = rollDice(1).total;
      const d2 = rollDice(1).total;
      const total = d1 + d2;
      const payload = { actionType: 'ROLL_OFF', actorId: playerId, total, dice: [d1, d2] };
      
      const submitRoll = () => {
        if (isHostRef.current) {
          enqueueHostAction(payload);
        } else {
          takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload }).catch(err => {
            console.warn('[handleRollOff] takeTurn error:', err);
          });
        }
      };

      submitRoll();

      // Retry submission if host has not acknowledged roll after 2.2 seconds
      const retryTimer = setTimeout(() => {
        if (!gameStateRef.current?.rollOffs?.[playerId]) {
          console.warn('[handleRollOff] Re-sending unacknowledged roll to host...');
          submitRoll();
        }
      }, 2200);

      setTimeout(() => {
        clearTimeout(safetyTimer);
        clearTimeout(retryTimer);
        setIsProcessingAction(false);
      }, 3500);
    }, 1200);
  };



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

  // Host continuously advertises open room to Global Lobby (Casual open rooms only)
  useEffect(() => {
    if (!isHost || !matchId || !gameState || gameState.status !== 'waiting' || tournamentMatchContext || gameState.isTournamentMatch) return;

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
  }, [isHost, matchId, gameState?.status, gameState?.players?.length, playerName, playerId, tournamentMatchContext, gameState?.isTournamentMatch]);

  // Auto-join heartbeat while guest is waiting to be confirmed in the match lobby
  useEffect(() => {
    if (!matchId || isHost) return;
    // Once confirmed by host (host is set and players list includes playerId, and not in joining state), stop heartbeat
    if (gameState?.host && gameState?.players?.includes(playerId) && gameState?.status !== 'joining') return;

    // Quota Safeguard: Block join heartbeat if character or all characters are exhausted
    const charLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacterRef.current);
    if (!charLic.canPlay || !characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id)) {
      setError(`Cannot join match: ${charLic.characterName} has exhausted the 10-match free quota!`);
      setQuotaUnlockChar(selectedCharacterRef.current);
      setGameState(null);
      setMatchId(null);
      return;
    }

    const sendJoin = () => {
      if (matchIdRef.current && playerIdRef.current) {
        requestJoin(matchIdRef.current, {
          playerId: playerIdRef.current,
          characterId: selectedCharacterRef.current,
          playerName: (playerNameRef.current || 'Player').trim()
        });
        requestSync(matchIdRef.current, playerIdRef.current);
      }
    };

    sendJoin();
    const interval = setInterval(sendJoin, 1500);
    return () => clearInterval(interval);
  }, [matchId, isHost, gameState?.players, gameState?.host, gameState?.status, playerId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Tab became visible again → re-sync state from host (in case we missed updates)
      if (document.visibilityState === 'visible' && matchIdRef.current && playerIdRef.current) {
        requestSync(matchIdRef.current, playerIdRef.current);
      }
      // NOTE: Do NOT call broadcastLeave on tab hide/minimize.
      // visibilitychange and Supabase Presence 'leave' both fire on innocent tab switches.
      // Players are only removed via the explicit broadcastLeave() on confirmed leave
      // (Leave button → confirmation dialog) or actual page close (beforeunload).
    };

    // Only send leave signal on actual page/tab close — not on minimize or tab switch
    const handleBeforeUnload = () => {
      if (matchIdRef.current && playerIdRef.current) {
        broadcastLeave(matchIdRef.current, playerIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  useEffect(() => {
    if (!matchId) return;

    const subscription = subscribeToMatch(
      matchId,
      (event) => {
        // 1. Peer Joined
        if (event.type === 'PLAYER_JOINED') {
          const { playerId: joinedId, characterId: joinedChar, playerName: joinedName } = event.payload || {};
          if (!joinedId || joinedId === playerIdRef.current) return;

          const currentGS = gameStateRef.current;
          if (isHostRef.current && currentGS) {
            // Check if game already started or room is full
            const isMatchActive = currentGS.status === 'active';
            const currentPlayers = currentGS.players || [];
            const isFull = currentPlayers.length >= 7;

            // Existing player reconnecting
            if (currentPlayers.includes(joinedId)) {
              broadcastState(matchId, currentGS);
              return;
            }

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
                    `??? ${joinedName || 'A player'} entered as a Spectator!`,
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
                [joinedId]: joinedName || 'Player'
              };

              const updatedLobbyState = {
                ...currentGS,
                players: updatedPlayers,
                characterSelections: updatedChars,
                playerNames: updatedNames,
                logs: [`${joinedName || 'Player'} entered the lobby!`, ...(currentGS.logs || [])]
              };

              gameStateRef.current = updatedLobbyState;
              setGameState(updatedLobbyState);
              broadcastState(matchId, updatedLobbyState);
              advertiseRoom({
                roomCode: matchId,
                hostName: playerNameRef.current || 'Host',
                hostPlayerId: playerIdRef.current,
                playersCount: updatedPlayers.length,
                maxPlayers: 7,
                status: 'waiting'
              });
            }
          }
        }
        // 2. Full State Sync
        else if (event.type === 'SYNC_STATE') {
          const newState = event.payload;
          setGameState(newState);
          setIsProcessingAction(false); // Free the action lock on state sync
          if (newState?.rollOffs) {
            setRollingOffPlayers(prev => {
              const updated = { ...prev };
              Object.keys(newState.rollOffs).forEach(pId => {
                delete updated[pId];
              });
              return updated;
            });
          }
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
                ? 'This room has reached the maximum capacity of 7 players.'
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
          console.log('[DICE_SCREEN_OPEN] Received event with payload:', {
            actorId: event.payload?.actorId,
            targetId: event.payload?.targetId,
            actionCard: event.payload?.actionCard?.name,
            attackSelectionName: event.payload?.attackSelectionName,
            attackerPlayerId: event.payload?.attackerPlayerId,
            defenderPlayerId: event.payload?.defenderPlayerId,
            currentPlayerId: playerId,
            hasGameState: !!gameStateRef.current?.characterStates,
            characterCount: Object.keys(gameStateRef.current?.characterStates || {}).length
          });
          
          // CRITICAL FIX: Ensure all required fields exist with safe defaults BEFORE creating combatData
          // This prevents "Cannot access 'fe' before initialization" errors
          
          const actorId = event.payload?.actorId || null;
          const targetId = event.payload?.targetId || null;
          const attackerPlayerId = event.payload?.attackerPlayerId || actorId;
          const defenderPlayerId = event.payload?.defenderPlayerId || targetId;
          
          // Reconstruct character objects from current gameState
          const attacker = gameStateRef.current?.characterStates?.[actorId];
          const defender = gameStateRef.current?.characterStates?.[targetId];
          
          // Fallback: if character data is missing, use the names from broadcast
          // IMPORTANT: These must NEVER be undefined
          const attackerFallback = attacker || {
            name: event.payload?.attackerPlayerName || 'Attacker',
            hp: 100,
            energyTokens: 5,
            id: actorId,
            shield: 0,
            poisonCards: 0
          };
          const defenderFallback = defender || {
            name: event.payload?.defenderPlayerName || 'Defender',
            hp: 100,
            energyTokens: 5,
            id: targetId,
            shield: 0,
            poisonCards: 0
          };
          
          // Ensure actionCard exists
          const actionCard = event.payload?.actionCard || { name: 'ATTACK', ap: 5 };
          const attackSelectionName = event.payload?.attackSelectionName || null;
          const combatId = event.payload?.combatId || ('combat_' + (actorId || 'atk') + '_' + (targetId || 'def') + '_' + (actionCard?.id || actionCard?.name || 'action'));
          
          const combatData = {
            combatId,
            // Core IDs - NEVER null
            actorId: actorId || 'unknown-attacker',
            targetId: targetId || 'unknown-defender',
            attackerPlayerId: attackerPlayerId || 'unknown-attacker',
            defenderPlayerId: defenderPlayerId || 'unknown-defender',
            
            // Character data - NEVER null
            attacker: attackerFallback,
            defender: defenderFallback,
            attackerPlayerName: attackerFallback.name,
            defenderPlayerName: defenderFallback.name,
            
            // Card/Action data
            actionCard: actionCard,
            attackSelectionName: attackSelectionName,
            actionType: event.payload?.actionType || 'RESOLVE_COMBAT',
            defenseCard: event.payload?.defenseCard || null,
            
            // Rolls
            precalculatedRolls: event.payload?.precalculatedRolls || {}
          };
          
          console.log('[DICE_SCREEN_OPEN] Reconstructed combatData:', {
            hasAttacker: !!combatData.attacker,
            hasDefender: !!combatData.defender,
            attackerName: combatData.attacker?.name,
            defenderName: combatData.defender?.name,
            iAmAttacker: combatData.attackerPlayerId === playerId,
            iAmDefender: combatData.defenderPlayerId === playerId,
            allFieldsFilled: !![
              combatData.actorId,
              combatData.targetId,
              combatData.attacker?.name,
              combatData.defender?.name
            ].every(f => f)
          });
          
          setActiveCombat(combatData);
          setIsDiceRollingSync(false);
        }
        // 7. Synchronized Dice Screen Roll
        else if (event.type === 'DICE_SCREEN_ROLLED') {
          if (event.payload?.isReroll) {
            // Preserve defenseCard when re-rolling on a tie — only reset the dice rolls
            setActiveCombat((prev) => {
              const kept = { defenseCard: prev?.precalculatedRolls?.defenseCard ?? null };
              return prev ? { ...prev, precalculatedRolls: kept } : prev;
            });
            setIsDiceRollingSync(false);
            return;
          } else if (event.payload?.precalculatedRolls) {
            // Merge the incoming rolls into activeCombat.
            // NOTE: We always merge — the sync guard in KontrolaDiceRoller's useEffect
            // (hasAttackerRolled / hasDefenderRolled checks) prevents overwriting local
            // dice values that have already been committed, so the attacker's own echo
            // arriving here is harmless.
            setActiveCombat((prev) => prev ? {
              ...prev,
              precalculatedRolls: { ...(prev.precalculatedRolls || {}), ...event.payload.precalculatedRolls }
            } : prev);
          }
          setIsDiceRollingSync(true);
        }
        // 8. Synchronized Dice Screen Close
        else if (event.type === 'DICE_SCREEN_CLOSE') {
          const { resolved, combatData, precalculatedRolls, senderId } = event.payload || {};
          const cId = combatData?.combatId || (combatData?.actorId + '_' + combatData?.targetId + '_' + (combatData?.actionCard?.id || combatData?.actionCard?.name || 'combat'));
          setActiveCombat(null);
          setIsDiceRollingSync(false);
          // If the event was broadcast by this client (host), it was already handled locally - DO NOT re-enqueue
          if (senderId && senderId === playerIdRef.current) {
            return;
          }
          // If already resolved for this combatId, NEVER re-enqueue to prevent duplicate turn resolution
          if (cId && lastResolvedCombatIdRef.current === cId) {
            console.warn('[DICE_SCREEN_CLOSE] Combat already resolved for ID:', cId);
            return;
          }
          // If a non-host client finished combat, the host must execute RESOLVE_COMBAT
          if (resolved && isHostRef.current && combatData) {
            lastResolvedCombatIdRef.current = cId;
            const mergedRolls = {
              ...(activeCombat?.precalculatedRolls || {}),
              ...(precalculatedRolls || {})
            };
            enqueueHostAction({ ...combatData, combatId: cId, actionType: 'RESOLVE_COMBAT' }, mergedRolls);
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
          if (!showChatRef.current) {
            setUnreadChatCount((prev) => prev + 1);
            if (soundFX?.playMenuHover) soundFX.playMenuHover();
            const toastId = 'toast_' + Date.now() + Math.random();
            setChatToasts((prev) => [...prev, { ...event.payload, toastId, type: 'CHAT' }]);
            setTimeout(() => setChatToasts((prev) => prev.filter(t => t.toastId !== toastId)), 4500);
          }
        } else if (event.type === 'PLAYER_TAUNT') {
          setActiveTauntBubble(event.payload);
          setChatMessages((prev) => [...prev, { ...event.payload, text: `??? [TAUNT]: "${event.payload.text}"` }]);
          setTimeout(() => setActiveTauntBubble(null), 4500);
          
          if (!showChatRef.current) {
             const toastId = 'toast_' + Date.now() + Math.random();
             setChatToasts((prev) => [...prev, { ...event.payload, toastId, type: 'TAUNT' }]);
             setTimeout(() => setChatToasts((prev) => prev.filter(t => t.toastId !== toastId)), 4500);
          }
        }
        else if (event.type === 'ROLL_OFF_ANIMATION') {
          const { actorId } = event.payload || {};
          if (actorId) {
            setRollingOffPlayers(prev => ({ ...prev, [actorId]: true }));
            // Auto-clear after 3.5s so remote players never see dice roll indefinitely
            setTimeout(() => {
              setRollingOffPlayers(prev => {
                const next = { ...prev };
                delete next[actorId];
                return next;
              });
            }, 3500);
          }
        }
        // 11. Action Effects (Syncs Vision, Shakes, Sounds, Damage Popups)
        else if (event.type === 'ACTION_EFFECT') {
          const { actionType, actionName, dmgDealt, atkDmgDealt, healDelta, visionData, triggerXChange, triggerRevivePrompt } = event.payload || {};

          // Handle Vision Reveal for the player who played it (attacker only per Feedback Line 93)
          if (visionData && visionData.actorId === playerIdRef.current) {
            setRevealedVision(visionData);
          }

          // Handle interactive X-Change Modal for the actor who played it
          if (triggerXChange && triggerXChange.actorId === playerIdRef.current) {
            setXChangeModalData(triggerXChange);
          }

          // Handle Revive Prompt for the player who was defeated
          if (triggerRevivePrompt && triggerRevivePrompt.victimId === playerIdRef.current) {
            setPendingRevivePrompt(triggerRevivePrompt);
          }

          // Visual shake + contextual sound effects + damage number popup
          if (actionType === 'ATTACK') {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 800);
            soundFX.init();
            
            if (dmgDealt > 0) spawnDamagePopup(`-${dmgDealt}`, false);
            if (atkDmgDealt > 0) spawnDamagePopup(`-${atkDmgDealt}`, false);
            
            if (actionName && actionName.includes('FIRE FLAME')) {
              soundFX.playTimeout();
            } else if (actionName && actionName.includes('LIGHTNING')) {
              soundFX.playPowerUp();
            } else if (actionName && actionName.includes('BOOMERANG')) {
              // Boomerang � no hit, just a trap set
            } else {
              soundFX.playHit();
            }
          } else if (actionType === 'HEAL') {
            soundFX.init();
            soundFX.playHeal();
            if (healDelta > 0) spawnDamagePopup(`+${healDelta}`, true);
          } else if (actionType === 'DEFENSE') {
            soundFX.init();
            soundFX.playMenuSelect();
          } else if (actionType === 'STATUS') {
            soundFX.init();
            soundFX.playZombie();
          } else if (actionType === 'SPECIAL') {
            soundFX.init();
            soundFX.playPowerUp();
          }
        }
        else if (event.type === 'ALLIANCE_INVITE') {
          const invite = event.payload;
          if (invite && invite.toPlayerId === playerIdRef.current) {
            setPendingAllianceInvite(invite);
            soundFX.init?.();
            soundFX.playPowerUp?.();
          }
        }
        else if (event.type === 'ALLIANCE_RESPONSE') {
          const { fromPlayerId, toPlayerId, accepted, toPlayerName } = event.payload || {};
          if (fromPlayerId === playerIdRef.current) {
            if (accepted) {
              showNotice(`🤝 ${toPlayerName} accepted your Secret Soul Alliance!`, 'info');
              setActiveAlliance({
                player1Id: fromPlayerId,
                player1Name: myCharacter?.name || playerName || 'Player',
                player2Id: toPlayerId,
                player2Name: toPlayerName,
                type: null,
                terms: [],
                confirmations: {},
                createdTurn: gameStateRef.current?.turnNumber || 1,
                expiresAtTurn: (gameStateRef.current?.turnNumber || 1) + 1
              });
              setShowAllianceChatModal(true);
            } else {
              showNotice(`${toPlayerName} declined your Secret Soul Alliance offer.`, 'warning');
            }
          }
        }
        // 12. Player Disconnected (Presence)
        else if (event.type === 'PLAYER_DISCONNECTED' || event.type === 'PLAYER_PRESENCE_AWAY') {
          // PLAYER_PRESENCE_AWAY = Supabase Presence leave (fires on tab switch, minimize, brief network drop)
          // PLAYER_DISCONNECTED = legacy name, same source
          // We intentionally do NOT remove the player or start any kick timer here.
          // Players are only removed when they explicitly broadcast PLAYER_LEFT (leave button)
          // or when the host receives a PLAYER_LEFT broadcast.
          const { playerId: dId } = event.payload || {};
          if (!dId || dId === playerIdRef.current) return;
          // Silently ignore — no log spam, no kick timer
        }
        // 13. Player Reconnected (Presence)
        else if (event.type === 'PLAYER_RECONNECTED') {
          const { playerId: rId } = event.payload || {};
          if (!rId) return;

          setGameState(prev => prev ? {
            ...prev,
            logs: [`? ${prev.playerNames?.[rId] || 'A player'} reconnected!`, ...(prev.logs || [])]
          } : prev);

          if (isHostRef.current && disconnectTimeoutsRef.current[rId]) {
            clearTimeout(disconnectTimeoutsRef.current[rId]);
            delete disconnectTimeoutsRef.current[rId];
            
            // Broadcast state to the reconnected player just in case they missed something
            if (gameStateRef.current) {
               broadcastState(matchIdRef.current, gameStateRef.current);
            }
          }

          if (rId === playerIdRef.current && !isHostRef.current) {
             requestSync(matchIdRef.current, playerIdRef.current);
          }
        }
      },
      () => {
        // Callback fired when channel is fully SUBSCRIBED
        if (isJoiningRef.current) {
          const charLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacterRef.current);
          if (!charLic.canPlay || !characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id)) {
            setError(`Cannot join match: ${charLic.characterName} has exhausted the 10-match free quota!`);
            setQuotaUnlockChar(selectedCharacterRef.current);
            setGameState(null);
            setMatchId(null);
            isJoiningRef.current = false;
            return;
          }

          requestJoin(matchId, {
            playerId: playerIdRef.current,
            characterId: selectedCharacterRef.current,
            playerName: playerNameRef.current.trim() || 'Player'
          });
          requestSync(matchId, playerIdRef.current);
          isJoiningRef.current = false;
        }
      },
      playerIdRef.current
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [matchId]);

  // Quota Safeguard: Validate character and record match usage when match actually begins (roll_off or active)
  useEffect(() => {
    if (!matchId || !gameState) return;
    if (gameState.status !== 'roll_off' && gameState.status !== 'active') return;
    if (!gameState.players?.includes(playerId)) return;

    const charLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacterRef.current);
    if (!charLic.canPlay || !characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id)) {
      setError(`Cannot participate in match: ${charLic.characterName} has exhausted the 10-match free quota!`);
      setQuotaUnlockChar(selectedCharacterRef.current);
      handleLeaveRoom();
      return;
    }

    const storageKey = `kontrola_match_used_${matchId}_${playerId}`;
    try {
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, 'true');
        characterLicenseService.recordMatchUse(currentUser?.id, selectedCharacterRef.current);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, [matchId, gameState?.status, playerId, currentUser?.id]);

  // Safety timeout for joining state (especially for Safari / slow mobile connections)
  useEffect(() => {
    if (gameState?.status !== 'joining' || !matchId) return;

    let attempts = 0;
    const retryInterval = setInterval(() => {
      attempts += 1;
      if (attempts <= 3) {
        console.log(`[KontrolaArena] Retrying join request (attempt ${attempts}/3) for room ${matchId}...`);
        requestJoin(matchId, {
          playerId: playerIdRef.current,
          characterId: selectedCharacterRef.current,
          playerName: playerNameRef.current.trim() || 'Player'
        });
        requestSync(matchId, playerIdRef.current);
      } else {
        clearInterval(retryInterval);
        setError('Connection timed out. The host may be in a different match or unreachable. Please try again.');
        setGameState(null);
        setMatchId('');
      }
    }, 3000);

    return () => clearInterval(retryInterval);
  }, [gameState?.status, matchId]);

  // ==========================================
  // DISCONNECT & HOST PROMOTION HANDLER
  // ==========================================
  const handlePlayerLeave = (leftPlayerId) => {
    setGameState((currentGS) => {
      if (!currentGS) return currentGS;

      const leaverName = currentGS.playerNames?.[leftPlayerId] || 'A player';
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
          name: currentGS.playerNames?.[remainingPlayers[0]] || 'Last Standing Player'
        };
        defaultWinner.playerId = remainingPlayers[0];
      }

      // Check if it was the leaver's active turn, advance turn if so
      let nextTurn = currentGS.turn;
      if (currentGS.turn === leftPlayerId && remainingPlayers.length > 0) {
        const livingRemaining = remainingPlayers.filter(
          (p) => !currentGS.characterStates?.[p]?.isDefeated
        );
        nextTurn = livingRemaining[0] || remainingPlayers[0];
      }

      // Prevent roll-off phase stalling if last pending player leaves
      let updatedStatus = currentGS.status;
      let updatedRollOffs = { ...currentGS.rollOffs };
      let updatedTurn = nextTurn;
      if (currentGS.status === 'roll_off' && remainingPlayers.length > 0) {
        delete updatedRollOffs[leftPlayerId]; // Remove leaver's roll if any
        if (Object.keys(updatedRollOffs).length === remainingPlayers.length) {
          updatedStatus = 'roll_off_complete';
          let maxTotal = -1;
          for (const pId of remainingPlayers) {
            if ((updatedRollOffs[pId] || 0) > maxTotal) {
              maxTotal = updatedRollOffs[pId];
              updatedTurn = pId;
            }
          }
        }
      }

      const updatedState = {
        ...currentGS,
        status: updatedStatus,
        rollOffs: updatedRollOffs,
        host: isLeaverHost ? remainingPlayers[0] : currentGS.host,
        players: remainingPlayers,
        turn: updatedTurn,
        logs: [
          `?? ${leaverName} has left the match.${
            isLeaverHost ? ` New host is ${currentGS.playerNames?.[remainingPlayers[0]] || 'Player'}.` : ''
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

    try {
      while (actionQueueRef.current.length > 0) {
        const item = actionQueueRef.current.shift();
        executeActionResolution(item.payload, item.precalculatedRolls);
      }
    } catch (err) {
      console.error('[processActionQueue] Error during host resolution:', err);
    } finally {
      isProcessingQueueRef.current = false;
    }
  };

  const executeActionResolution = (payload, precalculatedRollsParam = null) => {
    setGameState((currentState) => {
      // Always use the most-recently-computed pending state when available.
      // This prevents the React batching bug where two sequential setGameState calls
      // in the same queue flush both receive the original stale currentState snapshot.
      const state = pendingStateRef.current || currentState;
      if (!state) return currentState;
      if (!['ROLL_OFF', 'CHARACTER_SELECT', 'RESOLVE_COMBAT'].includes(payload.actionType) && !state.characterStates) return currentState;

      // For RESOLVE_COMBAT, use rolls from payload.precalculatedRolls (set by dice screen)
      // or fallback to the parameter
      const precalculatedRolls = payload.actionType === 'RESOLVE_COMBAT'
        ? { ...(payload.precalculatedRolls || {}), ...(precalculatedRollsParam || {}) }
        : precalculatedRollsParam;

      // RESOLVE_COMBAT: falls through to the generic resolution block at the bottom of this function.
      // The payload already carries actorId, actionCard, targetId, attackSelectionName, and precalculatedRolls
      // from the original ATTACK_DECLARED spread � no special handling needed here.
      // IMPORTANT: do NOT add an early return inside this block or combat resolution will be skipped.
      if (payload.actionType === 'RESOLVE_COMBAT') {
        const combatId = payload.combatId || (payload.actorId + '_' + payload.targetId + '_' + (payload.actionCard?.id || payload.actionCard?.name || 'combat'));
        if (combatId && lastResolvedCombatIdRef.current === combatId) {
          console.warn('[RESOLVE_COMBAT] Skipping duplicate combat resolution for ID:', combatId);
          return currentState;
        }
        lastResolvedCombatIdRef.current = combatId;
        payload.combatId = combatId;
        payload = { ...payload }; // safe copy � avoid mutating the caller's object
      }

      if (payload.actionType === 'ROLL_OFF') {
        const updatedRollOffs = { ...(state.rollOffs || {}), [payload.actorId]: payload.total };
        const updatedRollOffDice = { ...(state.rollOffDice || {}), [payload.actorId]: payload.dice };
        // Immediately clear local rolling state for this roller
        setRollingOffPlayers(prev => {
          const next = { ...prev };
          delete next[payload.actorId];
          return next;
        });
        // tiebreakPool: if set, only players in this list need to re-roll
        const activePlayers = state.tiebreakPool || state.players;
        let nextState = { ...state, rollOffs: updatedRollOffs, rollOffDice: updatedRollOffDice };

        const allActiveRolled = activePlayers.every(pId => updatedRollOffs[pId] !== undefined);

        if (allActiveRolled) {
          // Find the highest total among active rollers
          let maxTotal = -1;
          for (const pId of activePlayers) {
            if (updatedRollOffs[pId] > maxTotal) maxTotal = updatedRollOffs[pId];
          }
          // Find all players who tied for the top spot
          const tiedPlayers = activePlayers.filter(pId => updatedRollOffs[pId] === maxTotal);

          if (tiedPlayers.length > 1) {
            // TIE — reset only the tied players and keep everyone else's rolls
            const resetRollOffs = { ...updatedRollOffs };
            const resetRollOffDice = { ...updatedRollOffDice };
            tiedPlayers.forEach(pId => {
              delete resetRollOffs[pId];
              delete resetRollOffDice[pId];
            });
            const tiedNames = tiedPlayers.map(pId => state.playerNames?.[pId] || 'Player').join(' & ');
            nextState.status = 'roll_off'; // back to rolling
            nextState.tiebreakPool = tiedPlayers; // only these players re-roll
            nextState.rollOffs = resetRollOffs;
            nextState.rollOffDice = resetRollOffDice;
            nextState.logs = [
              `🔄 TIE BREAKER! ${tiedNames} both rolled ${maxTotal}! Re-roll to determine who goes first!`,
              ...(state.logs || [])
            ];
          } else {
            // Clear winner
            const winnerId = tiedPlayers[0];
            nextState.status = 'roll_off_complete';
            nextState.tiebreakPool = null;
            nextState.rollOffWinner = winnerId;
            nextState.logs = [`🏆 Roll-off complete! ${state.playerNames?.[winnerId] || 'Player'} won with a ${maxTotal} and gets first pick! Transitioning in 3s...`, ...(state.logs || [])];

            if (isHostRef.current) {
              setTimeout(() => {
                enqueueHostAction({ actionType: 'SHOW_LEADERBOARD', winnerId });
              }, 3000);
            }
          }
        } else {
          nextState.logs = [`🎲 ${state.playerNames?.[payload.actorId] || 'Player'} rolled a ${payload.total}.`, ...(state.logs || [])];
        }
        pendingStateRef.current = nextState;
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }
      if (payload.actionType === 'SHOW_LEADERBOARD') {
        let nextState = { ...state };
        nextState.status = 'roll_off_leaderboard';
        nextState.turn = payload.winnerId;
        
        if (isHostRef.current) {
             setTimeout(() => {
                enqueueHostAction({ actionType: 'START_CHARACTER_SELECT', winnerId: payload.winnerId });
             }, 4000); // show leaderboard for 4 seconds
        }
        pendingStateRef.current = nextState;
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }
      if (payload.actionType === 'START_CHARACTER_SELECT') {
        let nextState = { ...state };
        
        // Sort players array based on rollOffs (highest first)
        nextState.players = [...state.players].sort((a, b) => {
          return (state.rollOffs?.[b] || 0) - (state.rollOffs?.[a] || 0);
        });
        
        nextState.status = 'character_select';
        nextState.turn = payload.winnerId;
        nextState.turnDirection = 'clockwise';
        nextState.logs = [`The Character Selection phase has begun!`, ...(state.logs || [])];
        pendingStateRef.current = nextState;
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'CHARACTER_SELECT') {
        const { actorId, characterId } = payload;
        
        const newSelections = { ...(currentState.characterSelections || {}), [actorId]: characterId };
        const turnLogs = [`? ${currentState.playerNames?.[actorId] || 'Player'} selected ${KONTROLA_CHARACTERS[characterId]?.name || 'a character'}!`, ...(currentState.logs || [])];

        let nextState = { ...currentState, characterSelections: newSelections, logs: turnLogs };

        // Has everyone picked?
        if (Object.keys(newSelections).length === currentState.players.length) {
            // Everyone picked! Initialize game state.
            const deck = generateDeck(currentState.isPremium, currentState.players?.length || 2);
            const { updatedDeck, hands } = dealInitialHands(deck, currentState.players);
            const startingCrystals = currentState.players.length === 2 ? 2 : 1;

            const initialCharacterStates = {};
            currentState.players.forEach((pId) => {
              const charKey = newSelections[pId] || 'chynaman';
              const customName = currentState.playerNames?.[pId];
              const template = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
              initialCharacterStates[pId] = {
                ...template,
                name: customName || template.name,
                playerId: pId,
                hp: template.hp || template.baseHP || 100,
                maxHp: template.maxHp || 100,
                level: 1,
                shield: 0,
                energyTokens: 5,
                crystals: startingCrystals,
                poisonCount: 0,
                burnCount: 0,
                sleepTurns: 0,
                isDefeated: false,
                claimedTurnET: false
              };
            });

            nextState.status = 'match_countdown';
            nextState.deck = updatedDeck;
            nextState.hands = hands;
            nextState.characterStates = initialCharacterStates;
            
            if (isHostRef.current) {
               setTimeout(() => {
                  enqueueHostAction({ actionType: 'START_MATCH' });
               }, 3000);
            }
            
            // Turn goes back to the winner (the first person who picked)
            let winnerId = null;
            let maxTotal = -1;
            for (const pId of currentState.players) {
              if ((currentState.rollOffs?.[pId] || 0) > maxTotal) {
                maxTotal = currentState.rollOffs[pId];
                winnerId = pId;
              }
            }
            nextState.turn = winnerId;
            nextState.logs.unshift(`?? All characters selected! The match begins!`);
        } else {
            // Advance turn to next player for character selection
            const currentIdx = currentState.players.indexOf(actorId);
            const step = currentState.turnDirection === 'counter' ? -1 : 1;
            let nextIdx = (currentIdx + step) % currentState.players.length;
            if (nextIdx < 0) nextIdx += currentState.players.length;
            nextState.turn = currentState.players[nextIdx] || currentState.players[0];
        }

        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }
      
      if (payload.actionType === 'START_MATCH') {
        let nextState = { ...currentState };
        if (!nextState.characterStates) {
          const selections = nextState.characterSelections || {};
          const deck = generateDeck(nextState.isPremium, nextState.players?.length || 2);
          const { updatedDeck, hands } = dealInitialHands(deck, nextState.players);
          const startingCrystals = nextState.players.length === 2 ? 2 : 1;
          const initialCharacterStates = {};
          nextState.players.forEach((pId) => {
            const charKey = selections[pId] || 'chynaman';
            const customName = nextState.playerNames?.[pId];
            const template = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
            initialCharacterStates[pId] = {
              ...template,
              name: customName || template.name,
              playerId: pId,
              hp: template.hp || template.baseHP || 100,
              maxHp: template.maxHp || 100,
              level: 1,
              shield: 0,
              energyTokens: 5,
              crystals: startingCrystals,
              poisonCount: 0,
              burnCount: 0,
              sleepTurns: 0,
              isDefeated: false,
              claimedTurnET: false
            };
          });
          nextState.deck = updatedDeck;
          nextState.hands = hands;
          nextState.characterStates = initialCharacterStates;
        }
        nextState.status = 'active';
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }
      if (payload.actionType === 'EXECUTE_XCHANGE') {
        const { actorId, targetId, giveCard, takeCard } = payload;
        const actorHand = [...(currentState.hands?.[actorId] || [])];
        const targetHand = [...(currentState.hands?.[targetId] || [])];
        const actorChar = currentState.characterStates?.[actorId];
        const targetChar = currentState.characterStates?.[targetId];

        const findCardIndex = (hand, cardToMatch) => {
          if (!hand || !cardToMatch) return -1;
          const matchId = typeof cardToMatch === 'object' ? cardToMatch?.id : null;
          const matchName = typeof cardToMatch === 'string' ? cardToMatch : (cardToMatch?.name || null);
          if (matchId) {
            const byId = hand.findIndex(c => typeof c === 'object' && c?.id === matchId);
            if (byId !== -1) return byId;
          }
          if (matchName) {
            const byName = hand.findIndex(c => {
              const cName = typeof c === 'string' ? c : c?.name;
              return cName === matchName;
            });
            if (byName !== -1) return byName;
          }
          return -1;
        };

        const giveIdx = findSafeCardIndex(actorHand, giveCard) !== -1 
          ? findSafeCardIndex(actorHand, giveCard)
          : actorHand.findIndex(c => getSafeCardName(c) === getSafeCardName(giveCard));

        const takeIdx = findSafeCardIndex(targetHand, takeCard) !== -1 
          ? findSafeCardIndex(targetHand, takeCard)
          : targetHand.findIndex(c => getSafeCardName(c) === getSafeCardName(takeCard));

        if (giveIdx !== -1 && takeIdx !== -1) {
          const [cardGiven] = actorHand.splice(giveIdx, 1);
          const [cardTaken] = targetHand.splice(takeIdx, 1);
          actorHand.push(cardTaken);
          targetHand.push(cardGiven);

          const givenName = typeof cardGiven === 'string' ? cardGiven : (cardGiven?.name || 'Action Card');
          const takenName = typeof cardTaken === 'string' ? cardTaken : (cardTaken?.name || 'Action Card');

          const livingPlayers = (currentState.players || []).filter(
            (pId) => !currentState.characterStates?.[pId]?.isDefeated
          );
          let turnId = currentState.turn;
          if (turnId === actorId && livingPlayers.length > 1) {
            const currentIdx = livingPlayers.indexOf(actorId);
            const step = currentState.turnDirection === 'counter' ? -1 : 1;
            let nextIdx = (currentIdx + step) % livingPlayers.length;
            if (nextIdx < 0) nextIdx += livingPlayers.length;
            turnId = livingPlayers[nextIdx] || livingPlayers[0];
          }

          const nextState = {
            ...currentState,
            turn: turnId,
            hands: {
              ...(currentState.hands || {}),
              [actorId]: actorHand,
              [targetId]: targetHand
            },
            logs: [
              `🔄 X-CHANGE: ${actorChar?.name || 'Player'} exchanged "${givenName}" with ${targetChar?.name || 'Opponent'}'s "${takenName}"!`,
              ...(currentState.logs || [])
            ]
          };
          broadcastState(matchIdRef.current, nextState);
          return nextState;
        }
        return currentState;
      }

      if (payload.actionType === 'EXECUTE_REVIVE') {
        const { victimId } = payload;
        const victimChar = currentState.characterStates?.[victimId];
        if (!victimChar) return currentState;

        const victimHand = [...(currentState.hands?.[victimId] || [])];
        const reviveIdx = findSafeCardIndex(victimHand, 'REVIVE') !== -1
          ? findSafeCardIndex(victimHand, 'REVIVE')
          : victimHand.findIndex(c => getSafeCardName(c).includes('REVIVE'));
        if (reviveIdx !== -1) {
          victimHand.splice(reviveIdx, 1);
          // Draw replacement from deck if available
          let deck = [...(currentState.deck || [])];
          if (deck.length > 0) {
            victimHand.push(deck.shift());
          }
        }

        const restoredHp = Math.max(1, Math.floor((victimChar.maxHp || 100) * 0.5));
        const updatedVictim = {
          ...victimChar,
          hp: restoredHp,
          isDefeated: false,
          crystals: Math.max(1, victimChar.crystals || 1)
        };

        const nextState = {
          ...currentState,
          deck: currentState.deck ? [...(currentState.deck || [])] : currentState.deck,
          hands: {
            ...(currentState.hands || {}),
            [victimId]: victimHand
          },
          characterStates: {
            ...currentState.characterStates,
            [victimId]: updatedVictim
          },
          logs: [
            `✨ REVIVE USED! ${victimChar.name} consumed their REVIVE card and re-entered the arena with ${restoredHp} HP (50%)!`,
            ...(currentState.logs || [])
          ]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'EXTINGUISH_BURN') {
        const { actorId, extinguished, rolls, damage } = payload;
        const char = currentState.characterStates?.[actorId];
        if (!char) return currentState;

        const updatedCharStates = { ...currentState.characterStates };
        let nextLogs = [...(currentState.logs || [])];
        let nextTurn = currentState.turn;
        let matchWinner = currentState.winner || null;

        if (extinguished) {
          updatedCharStates[actorId] = {
            ...char,
            burnCount: 0
          };
          nextLogs.unshift(`💧 ${char.name} rolled doubles [${rolls[0]}, ${rolls[1]}] and EXTINGUISHED the fire! 0 damage taken.`);
        } else {
          const dmg = damage || ((char.burnCount || 1) * 10);
          const newHp = Math.max(0, char.hp - dmg);
          const isDefeated = newHp <= 0;
          updatedCharStates[actorId] = {
            ...char,
            hp: newHp,
            isDefeated
          };
          if (rolls && rolls.length >= 2) {
            nextLogs.unshift(`🔥 ${char.name} rolled [${rolls[0]}, ${rolls[1]}] (failed to roll doubles) and took -${dmg} HP Burn damage! HP: ${newHp}`);
          } else {
            nextLogs.unshift(`🔥 ${char.name} chose not to extinguish the flames and took -${dmg} HP Burn damage! HP: ${newHp}`);
          }
          if (isDefeated) {
            nextLogs.unshift(`💀 ${char.name} was incinerated by Burn damage and eliminated!`);
            const livingPlayers = (currentState.players || []).filter(pId => !updatedCharStates[pId]?.isDefeated);
            if (livingPlayers.length === 1) {
              matchWinner = updatedCharStates[livingPlayers[0]] ? { ...updatedCharStates[livingPlayers[0]], playerId: livingPlayers[0] } : null;
            } else if (livingPlayers.length > 1) {
              const hasRevive = (currentState.hands?.[actorId] || []).some(c => getSafeCardName(c).toUpperCase().includes('REVIVE'));
              if (!hasRevive) {
                const pList = currentState.players || [];
                const currentIdx = pList.indexOf(actorId);
                const step = currentState.turnDirection === 'counter' ? -1 : 1;
                let nextIdx = (currentIdx + step) % pList.length;
                if (nextIdx < 0) nextIdx += pList.length;
                let attempts = 0;
                while (updatedCharStates[pList[nextIdx]]?.isDefeated && attempts < pList.length) {
                  nextIdx = (nextIdx + step) % pList.length;
                  if (nextIdx < 0) nextIdx += pList.length;
                  attempts++;
                }
                nextTurn = pList[nextIdx] || livingPlayers[0];
              }
            }
          }
        }

        const nextState = {
          ...currentState,
          characterStates: updatedCharStates,
          logs: nextLogs,
          turn: nextTurn,
          winner: matchWinner
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'DECLINE_REVIVE') {
        const victimId = payload.victimId;
        const livingPlayers = (currentState.players || []).filter(pId => !currentState.characterStates?.[pId]?.isDefeated && pId !== victimId);
        let nextTurn = currentState.turn;
        let matchWinner = currentState.winner || null;
        if (livingPlayers.length === 1) {
          matchWinner = currentState.characterStates?.[livingPlayers[0]] ? { ...currentState.characterStates[livingPlayers[0]], playerId: livingPlayers[0] } : null;
        } else if (livingPlayers.length > 1 && currentState.turn === victimId) {
          const pList = currentState.players || [];
          const currentIdx = pList.indexOf(victimId);
          const step = currentState.turnDirection === 'counter' ? -1 : 1;
          let nextIdx = (currentIdx + step) % pList.length;
          if (nextIdx < 0) nextIdx += pList.length;
          let attempts = 0;
          while (currentState.characterStates?.[pList[nextIdx]]?.isDefeated && attempts < pList.length) {
            nextIdx = (nextIdx + step) % pList.length;
            if (nextIdx < 0) nextIdx += pList.length;
            attempts++;
          }
          nextTurn = pList[nextIdx] || livingPlayers[0];
        }
        const nextState = {
          ...currentState,
          turn: nextTurn,
          winner: matchWinner,
          logs: [`💀 ${currentState.characterStates?.[victimId]?.name || 'Player'} opted out of reviving and was eliminated!`, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'EXECUTE_RETREAT') {
        const { retreatingPlayerId, role, reason } = payload;
        const char = currentState.characterStates?.[retreatingPlayerId];
        const pHand = [...(currentState.hands?.[retreatingPlayerId] || [])];
        const rIdx = findSafeCardIndex(pHand, 'RETREAT') !== -1
          ? findSafeCardIndex(pHand, 'RETREAT')
          : pHand.findIndex(c => getSafeCardName(c).includes('RETREAT'));
        if (rIdx !== -1) {
          pHand.splice(rIdx, 1);
          let deck = [...(currentState.deck || [])];
          if (deck.length > 0) {
            pHand.push(deck.shift());
          }
        }
        while (pHand.length > 10) pHand.pop();

        const livingPlayers = currentState.players.filter(pId => !currentState.characterStates?.[pId]?.isDefeated);
        const currentIdx = livingPlayers.indexOf(currentState.turn);
        const step = currentState.turnDirection === 'counter' ? -1 : 1;
        let nextIdx = (currentIdx + step) % livingPlayers.length;
        if (nextIdx < 0) nextIdx += livingPlayers.length;
        let nextTurnPlayerId = livingPlayers[nextIdx] || livingPlayers[0];

        const logMsg = role === 'attacker'
          ? `💨 ${char?.name || 'Attacker'} used RETREAT to disengage from combat! Turn ended without taking damage.`
          : `💨 ${char?.name || 'Defender'} used RETREAT to disengage from battle and safely escapes (loses next turn)!`;

        const updatedCharStates = { ...currentState.characterStates };
        if (role === 'defender' && updatedCharStates[retreatingPlayerId]) {
          updatedCharStates[retreatingPlayerId] = {
            ...updatedCharStates[retreatingPlayerId],
            sleepTurns: (updatedCharStates[retreatingPlayerId].sleepTurns || 0) + 1
          };
        }

        const nextState = {
          ...currentState,
          turn: nextTurnPlayerId,
          pendingAttackX2For: null,
          hands: {
            ...(currentState.hands || {}),
            [retreatingPlayerId]: pHand
          },
          characterStates: updatedCharStates,
          logs: [logMsg, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'EXECUTE_ALLIANCE_TRADE') {
        const { traderId, recipientId, tradeType, card, amount } = payload;
        const traderHand = [...(currentState.hands?.[traderId] || [])];
        const recipientHand = [...(currentState.hands?.[recipientId] || [])];
        const traderChar = { ...(currentState.characterStates?.[traderId] || {}) };
        const recipientChar = { ...(currentState.characterStates?.[recipientId] || {}) };

        let tradeLog = '';
        if (tradeType === 'REVIVE' && card) {
          const rIdx = findSafeCardIndex(traderHand, card);
          if (rIdx !== -1) {
            const [tradedCard] = traderHand.splice(rIdx, 1);
            recipientHand.push(tradedCard);
            tradeLog = `🤝 SOUL ALLIANCE TRADE: ${traderChar.name} traded REVIVE card to ${recipientChar.name}!`;
          }
        } else if (tradeType === 'ENERGY_TOKENS' && amount > 0) {
          const actualAmount = Math.min(amount, traderChar.energyTokens || 0);
          traderChar.energyTokens = Math.max(0, (traderChar.energyTokens || 0) - actualAmount);
          recipientChar.energyTokens = Math.min(10, (recipientChar.energyTokens || 0) + actualAmount);
          tradeLog = `🤝 SOUL ALLIANCE TRADE: ${traderChar.name} sent ${actualAmount} Energy Token(s) to ${recipientChar.name}!`;
        }

        const nextState = {
          ...currentState,
          hands: {
            ...(currentState.hands || {}),
            [traderId]: traderHand,
            [recipientId]: recipientHand
          },
          characterStates: {
            ...currentState.characterStates,
            [traderId]: traderChar,
            [recipientId]: recipientChar
          },
          logs: [tradeLog, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'DISCARD_AND_DRAW') {
        const { actorId, cardId, cardName } = payload;
        const actorHand = [...(currentState.hands?.[actorId] || [])];
        const actorChar = currentState.characterStates?.[actorId];
        const cIdx = findSafeCardIndex(actorHand, cardId ? { id: cardId, name: cardName } : cardName);
        let discardedCard = null;
        if (cIdx !== -1) {
          [discardedCard] = actorHand.splice(cIdx, 1);
        }
        let newDeck = [...(currentState.deck || [])];
        let drawnCard = null;
        if (newDeck.length > 0) {
          drawnCard = newDeck.shift();
          actorHand.push(drawnCard);
        }
        while (actorHand.length > 10) actorHand.pop();
        const livingPlayers = currentState.players.filter(pId => !currentState.characterStates?.[pId]?.isDefeated);
        const currentIdx = livingPlayers.indexOf(actorId);
        const step = currentState.turnDirection === 'counter' ? -1 : 1;
        let nextIdx = (currentIdx + step) % livingPlayers.length;
        if (nextIdx < 0) nextIdx += livingPlayers.length;
        let nextTurnPlayerId = livingPlayers[nextIdx] || livingPlayers[0];
        const logMsg = `${actorChar?.name || 'Player'} discarded "${discardedCard?.name || cardName || 'card'}" and drew a new Action Card (only move for this turn).`;
        const nextState = {
          ...currentState,
          turn: nextTurnPlayerId,
          pendingAttackX2For: null,
          deck: newDeck,
          hands: {
            ...(currentState.hands || {}),
            [actorId]: actorHand
          },
          logs: [logMsg, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'CLAIM_ET') {
        const char = currentState.characterStates[payload.actorId];
        if (!char || char.claimedTurnET) return currentState;
        
        const updatedChar = {
          ...char,
          energyTokens: Math.min(10, (char.energyTokens || 0) + 1),
          claimedTurnET: true
        };
        
        const nextState = {
          ...currentState,
          characterStates: {
            ...currentState.characterStates,
            [payload.actorId]: updatedChar
          },
          logs: [`${char.name} claimed +1 Energy Token.`, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'ATTACK_DECLARED') {
        console.log('[ATTACK_DECLARED] Received attack declaration:', {
          attackerPlayerName: payload.attackerPlayerName,
          defenderPlayerName: payload.defenderPlayerName,
          actionCard: payload.actionCard?.name,
          attackSelectionName: payload.attackSelectionName,
          actorId: payload.actorId,
          targetId: payload.targetId
        });
        
        const combatId = payload.combatId || ('combat_' + Date.now() + '_' + payload.actorId + '_' + payload.targetId);
        const nextState = {
          ...currentState,
          activeDefenseState: { ...payload, combatId, expiresAt: Date.now() + 15000 },
          logs: [`?? ${payload.attackerPlayerName} is attacking ${payload.defenderPlayerName}! Waiting for defender to prepare...`, ...(currentState.logs || [])]
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

      if (payload.actionType === 'DEFENSE_SELECTED') {
        const activeDefense = currentState.activeDefenseState;
        if (!activeDefense) {
          console.error('[DEFENSE_SELECTED] No activeDefenseState found! Defense action ignored.');
          return currentState;
        }

        // defenseCard goes into precalculatedRolls so the engine can read it
        // via precalculatedRolls?.defenseCard (null when defender skipped)
        const precalculatedRolls = {
          defenseCard: payload.defenseCard ?? null
        };
        
        // CRITICAL: Retrieve the actual character objects from characterStates
        // KontrolaDiceRoller needs these to display properly
        const attackerChar = currentState.characterStates[activeDefense.actorId];
        const defenderChar = currentState.characterStates[activeDefense.targetId];
        
        if (!attackerChar || !defenderChar) {
          console.error('[DEFENSE_SELECTED] Missing character data!', { 
            attackerChar, 
            defenderChar, 
            actorId: activeDefense.actorId, 
            targetId: activeDefense.targetId 
          });
        }
        
        // IMPORTANT: Don't send full character objects via WebSocket - they have complex data
        // Instead, send minimal data and let clients reconstruct from their gameState
        const combatId = activeDefense.combatId || ('combat_' + Date.now() + '_' + activeDefense.actorId + '_' + activeDefense.targetId);
        const activeCombat = {
          combatId,
          actorId: activeDefense.actorId,
          targetId: activeDefense.targetId,
          attackerPlayerId: activeDefense.actorId,
          defenderPlayerId: activeDefense.targetId,
          actionCard: activeDefense.actionCard,
          attackSelectionName: activeDefense.attackSelectionName,
          actionType: 'RESOLVE_COMBAT',
          attackerId: activeDefense.actorId,
          attackerPlayerName: attackerChar?.name || activeDefense.attackerPlayerName,
          defenderPlayerName: defenderChar?.name || activeDefense.defenderPlayerName,
          // Character objects for local use by host
          attacker: attackerChar,
          defender: defenderChar,
          precalculatedRolls,
          defenseCard: payload.defenseCard ?? null
        };
        
        console.log('[DEFENSE_SELECTED] Created activeCombat:', {
          hasAttacker: !!activeCombat.attacker,
          hasDefender: !!activeCombat.defender,
          actionCard: activeCombat.actionCard?.name,
          attackSelectionName: activeCombat.attackSelectionName,
          defenseCard: activeCombat.defenseCard?.name
        });

        // Broadcast lightweight data - clients will reconstruct character objects from their gameState
        const broadcastData = {
          combatId: activeCombat.combatId,
          actorId: activeCombat.actorId,
          targetId: activeCombat.targetId,
          actionCard: activeCombat.actionCard,
          attackSelectionName: activeCombat.attackSelectionName,
          actionType: 'RESOLVE_COMBAT',
          attackerId: activeCombat.attackerId,
          attackerPlayerName: activeCombat.attackerPlayerName,
          defenderPlayerName: activeCombat.defenderPlayerName,
          precalculatedRolls: activeCombat.precalculatedRolls,
          defenseCard: activeCombat.defenseCard,
          // FIX: Add explicit role assignments so defenders know immediately
          attackerPlayerId: activeCombat.actorId,
          defenderPlayerId: activeCombat.targetId
        };

        // FIX: Set local state IMMEDIATELY and broadcast simultaneously to prevent freeze
        setActiveCombat(activeCombat);
        
        console.log('[DEFENSE_SELECTED] Local state updated, broadcasting dice_screen_open event', {
          attackerPlayerId: activeCombat.actorId,
          defenderPlayerId: activeCombat.targetId,
          currentPlayerId: playerId,
          willBeDefender: activeCombat.targetId === playerId
        });
        
        // Broadcast to other clients (no delay - state already set locally)
        broadcastUIEvent(matchIdRef.current, 'dice_screen_open', broadcastData);

        const nextState = {
          ...currentState,
          activeDefenseState: null
        };
        broadcastState(matchIdRef.current, nextState);
        return nextState;
      }

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
      let resolved = {};
      let matchWinner = currentState.winner;
      let turnLogs = [log];
      let pendingAttackX2For = currentState.pendingAttackX2For || null;
      let nextTurnPlayerId = actorId;
      let updatedStates = { ...currentState.characterStates };
      let newDefenderHand = defenderChar ? [...(currentState.hands?.[targetId] || [])] : [];

      if (!isPass) {
        // Resolve Turn via Engine (ET cost deducted only after confirming not a tie)
        resolved = resolveTurn(
          actionCard,
          KONTROLA_CHARACTERS[attackerChar.id] || attackerChar,
          newAttackerState,
          newDefenderState,
          attackSelectionName,
          precalculatedRolls,
          currentState // Pass gameState for player count validation
        );

        // If the engine signals a tie, do NOT commit the result � the DiceRoller
        // will surface the re-roll button and the host will be called again with new rolls.
        // We also restore the ET cost so the attacker is not penalised for a re-roll.
        if (resolved.isTie) {
          const tieLogs = [resolved.log, ...(currentState.logs || [])];
          // Restore the ET that was deducted � tie should not cost ET
          const restoredAttackerState = {
            ...currentState.characterStates[actorId],
            energyTokens: (currentState.characterStates[actorId]?.energyTokens || 0)  // keep original, cost not yet written
          };
          const tieState = {
            ...currentState,
            logs: tieLogs,
            // keep characterStates untouched � ET cost not applied on tie
          };
          broadcastState(matchIdRef.current, tieState);
          return tieState;
        }

        // Commit turn resolution
        const attackSelectionUpper = (attackSelectionName || '').toUpperCase();
        const isSpecialETHandled = attackSelectionUpper.includes('BLITZ') || attackSelectionUpper.includes('KONTROL');
        
        newAttackerState = resolved.newAttackerState;
        newDefenderState = resolved.newDefenderState;
        log = resolved.log;
        
        // If not already deducted by special ability (Blitz -5 ET, Kontrol -3 ET), deduct standard card cost
        if (!isSpecialETHandled) {
          const cost = actionCard?.costET || (actionCard?.type === 'ATTACK' ? 1 : 0);
          newAttackerState.energyTokens = Math.max(0, (newAttackerState.energyTokens || 5) - cost);
        }

        if (resolved.stealActionCard && targetId && newDefenderHand && newDefenderHand.length > 0) {
          const randIdx = Math.floor(Math.random() * newDefenderHand.length);
          const [stolenCard] = newDefenderHand.splice(randIdx, 1);
          if (newHand.length < 10) {
            newHand.push(stolenCard);
          }
          const stolenName = getSafeCardName(stolenCard);
          log += ` 🧠 KONTROL: Stole "${stolenName}" from ${newDefenderState?.name || 'Defender'}!`;
        }

        // Broadcast UI effects to all clients (Shake, Sound, Damage Popups, Vision Modals)
        setTimeout(() => {
          let visionData = null;
          const playedCardName = getSafeCardName(actionCard);
          const playedCardType = getSafeCardType(actionCard);
          if (playedCardName.includes('VISION') || resolved?.revealTargetHand) {
            if (playedCardName.includes('VISION FULL')) {
              const allCards = [];
              Object.keys(currentState.hands || {}).forEach(pid => {
                if (pid !== actorId) {
                  allCards.push(...(currentState.hands[pid] || []));
                }
              });
              visionData = {
                targetId: 'ALL',
                targetName: 'All Opponents',
                isFull: true,
                expiresAt: Date.now() + 30000,
                cards: allCards,
                actorId
              };
            } else if (targetId && targetId !== 'ALL') {
              visionData = {
                targetId: (targetId && targetId !== 'ALL') ? targetId : (opponents[0] || Object.keys(currentState.hands || {}).find(p => p !== actorId)),
                isFull: false,
                isXChange: false,
                targetName: defenderChar?.name || 'Opponent',
                expiresAt: Date.now() + 15000,
                cards: currentState.hands?.[targetId] || [],
                actorId
              };
            }
          }

          if (visionData && visionData.actorId === playerIdRef.current) {
            setRevealedVision(visionData);
          }

          let dmgDealt = 0;
          let healDelta = 0;
          let atkDmgDealt = 0;
          if (playedCardType === 'ATTACK') {
             const prevDefHP = (currentState.characterStates?.[targetId]?.hp) ?? 0;
             const newDefHP = newDefenderState?.hp ?? 0;
             dmgDealt = Math.max(0, prevDefHP - newDefHP);

             const prevAtkHP = (currentState.characterStates?.[actorId]?.hp) ?? 0;
             const newAtkHP = newAttackerState?.hp ?? 0;
             atkDmgDealt = Math.max(0, prevAtkHP - newAtkHP);
          } else if (playedCardType === 'HEAL') {
             const prevAtkHP = (currentState.characterStates?.[actorId]?.hp) ?? 0;
             const newAtkHP = newAttackerState?.hp ?? 0;
             healDelta = Math.max(0, newAtkHP - prevAtkHP);
          }

          let triggerXChange = null;
          if (playedCardName.includes('X-CHANGE')) {
            // Filter out the played action card from the attacker's hand so they don't exchange the card they just spent
            const availableAttackerHand = newHand.filter(c => {
              const cName = getSafeCardName(c);
              const cId = typeof c === 'object' ? c?.id : null;
              if (actionCard?.id && cId) return cId !== actionCard.id;
              return cName !== playedCardName;
            });
            triggerXChange = {
              xChangeType: playedCardName.includes('FULL') ? 'FULL' : 'X1',
              actorId,
              targetId: (targetId && targetId !== 'ALL') ? targetId : (opponents[0] || Object.keys(currentState.hands || {}).find(p => p !== actorId)),
              defenderName: defenderChar?.name || 'Opponent',
              attackerHand: availableAttackerHand,
              defenderHand: (targetId && targetId !== 'ALL') ? newDefenderHand : (currentState.hands?.[opponents[0]] || newDefenderHand || [])
            };
          }

          if (triggerXChange && triggerXChange.actorId === playerIdRef.current) {
            setXChangeModalData(triggerXChange);
          }

          let triggerRevivePrompt = null;
          if (newDefenderState && newDefenderState.hp <= 0) {
            // Check if defender holds REVIVE card
            const hasRevive = (newDefenderHand || []).some(c => getSafeCardName(c).includes('REVIVE'));
            if (hasRevive) {
              triggerRevivePrompt = {
                victimId: targetId,
                victimName: newDefenderState.name,
                maxHp: newDefenderState.maxHp || 100
              };
            }
          }

          if (triggerRevivePrompt && triggerRevivePrompt.victimId === playerIdRef.current) {
            setPendingRevivePrompt(triggerRevivePrompt);
          }

          broadcastUIEvent(matchIdRef.current, 'action_effect', {
            actionType: actionCard?.type,
            actionName: actionCard?.name,
            dmgDealt,
            atkDmgDealt,
            healDelta,
            visionData,
            triggerXChange,
            triggerRevivePrompt
          });
        }, 100);

        // Discard played card and replenish hand to exactly 10 cards
        const playedIdx = findSafeCardIndex(newHand, actionCard);
        let discarded = false;
        if (playedIdx !== -1) {
          newHand.splice(playedIdx, 1);
          discarded = true;
        }
        if (discarded && newDeck.length > 0) {
          newHand.push(newDeck.shift());
        }
        // Strict invariant: hand size must never exceed 10 cards at any time per client specification
        while (newHand.length > 10) {
          newHand.pop();
        }
      }

      // Also discard the defender's card if they played one during the preparation window
      let defenderDiscarded = false;
      if (precalculatedRolls?.defenseCard) {
        const defCardIdx = findSafeCardIndex(newDefenderHand, precalculatedRolls.defenseCard);
        if (defCardIdx !== -1) {
          newDefenderHand.splice(defCardIdx, 1);
          defenderDiscarded = true;
        }
      }
      if (defenderDiscarded && newDeck.length > 0) {
        newDefenderHand.push(newDeck.shift());
      }
      while (newDefenderHand.length > 10) {
        newDefenderHand.pop();
      }

      // Check if target was defeated and reward Stability Crystal
      if (newDefenderState && newDefenderState.hp <= 0 && !newDefenderState.isDefeated) {
        newDefenderState.isDefeated = true;
        newAttackerState.crystals = (newAttackerState.crystals || 1) + (newDefenderState.crystals || 1);
        newDefenderState.crystals = 0;
        log += ` ?? ${newDefenderState.name} was defeated! ${newAttackerState.name} claimed their Stability Crystals (Total: ${newAttackerState.crystals}).`;
        if (newAttackerState.crystals >= 3) {
          matchWinner = { ...newAttackerState, playerId: actorId };
        }

        // ===== CRYSTAL SPLIT TRIGGER =====
        // If 3+ players and 2+ attackers involved, trigger crystal split negotiation
        const defenderStillDefeated = newDefenderState?.isDefeated === true;
        const playersCount = currentState.players?.length || 0;
        const livingPlayerIds = currentState.players.filter(
          (pId) => pId !== targetId && !currentState.characterStates[pId]?.isDefeated
        );
        const hasMultipleAttackers = livingPlayerIds.length >= 2; // At least 2 living players besides defender

        if (defenderStillDefeated && playersCount >= 3 && hasMultipleAttackers) {
          // Build list of attackers (all living players except the defender)
          const attackersList = livingPlayerIds.map(pId => ({
            id: pId,
            name: currentState.characterStates[pId]?.name || 'Unknown',
            hp: currentState.characterStates[pId]?.hp || 0,
            crystals: currentState.characterStates[pId]?.crystals || 0,
            energyTokens: currentState.characterStates[pId]?.energyTokens || 0,
            actionCardsHand: currentState.hands?.[pId] || [],
            isDefeated: false
          }));

          // Prepare crystal split data
          setCrystalSplitData({
            attacker: { id: actorId, name: newAttackerState.name, crystals: newAttackerState.crystals },
            defender: { id: targetId, name: newDefenderState.name, crystals: 0 },
            attackers: attackersList,
            updatedPlayers: { ...updatedStates }
          });
          setShowCrystalSplitModal(true);
          // Pause combat resolution until crystal split completes
          return;
        }
      }

      // Check if attacker was defeated (e.g. from Boomerang / Counter reflection)
      if (newAttackerState && newAttackerState.hp <= 0 && !newAttackerState.isDefeated) {
        newAttackerState.isDefeated = true;
        if (newDefenderState) {
          newDefenderState.crystals = (newDefenderState.crystals || 1) + (newAttackerState.crystals || 1);
          newAttackerState.crystals = 0;
          log += ` 💀 ${newAttackerState.name} was defeated by reflected damage! ${newDefenderState.name} claimed their Stability Crystals.`;
          if (newDefenderState.crystals >= 3) {
            matchWinner = { ...newDefenderState, playerId: targetId };
          }
        }
      }

      updatedStates = {
        ...updatedStates,
        [actorId]: newAttackerState
      };
      if (targetId && targetId !== 'ALL' && newDefenderState) {
        updatedStates[targetId] = newDefenderState;
      } else if (targetId === 'ALL' && resolved.aoeDamage) {
        // Count active defenders for AoE damage splitting
        const activeDefenders = currentState.players.filter(pId => 
          pId !== actorId && !currentState.characterStates[pId]?.isDefeated
        );
        const damagePerDefender = Math.ceil(resolved.aoeDamage / Math.max(1, activeDefenders.length));
        
        activeDefenders.forEach(pId => {
          const char = { ...currentState.characterStates[pId] };
          char.hp = Math.max(0, char.hp - damagePerDefender);
          if (char.hp <= 0 && !char.isDefeated) {
            char.isDefeated = true;
            newAttackerState.crystals = (newAttackerState.crystals || 1) + (char.crystals || 1);
            char.crystals = 0;
            log += ` ?? ${char.name} was defeated by AoE! ${newAttackerState.name} claimed their Crystals.`;
            if (newAttackerState.crystals >= 3) {
              matchWinner = { ...newAttackerState, playerId: actorId };
            }
          }
          updatedStates[pId] = char;
        });
        updatedStates[actorId] = newAttackerState; // ensure attacker crystals update is saved
      }

      // Turn rotation (modulo next non-defeated player)
      const livingPlayers = currentState.players.filter(
        (pId) => !updatedStates[pId]?.isDefeated
      );

      // Cards that should NEVER grant an extra turn regardless of resolved flags.
      // TIME MACHINE is type 'OTHERS' but is the sole exception � it explicitly grants an extra turn.
      // ATTACK X2 is type 'ATTACK' and handles its second-hit via triggerAttackX2SecondHit.
      const resolvedEndTurnCardType = getSafeCardType(actionCard);
      const resolvedEndTurnCardName = getSafeCardName(actionCard);
      const isStatusOrHealCard = Boolean(actionCard) &&
        ['STATUS', 'HEAL', 'OTHERS', 'TACTICAL', 'DEFENSE', 'SPECIAL'].includes(resolvedEndTurnCardType) &&
        resolvedEndTurnCardName !== 'TIME MACHINE';

      if (livingPlayers.length <= 1) {
        matchWinner = updatedStates[livingPlayers[0]] ? { ...updatedStates[livingPlayers[0]], playerId: livingPlayers[0] } : matchWinner;
        nextTurnPlayerId = livingPlayers[0] || actorId;
      } else {
        // STATUS/HEAL/OTHERS/TACTICAL/DEFENSE cards must ALWAYS advance the turn � never stay on same player
        const isAlreadySecondHit = currentState.pendingAttackX2For === actorId || (typeof actionCard === 'object' && actionCard?.id === 'attack_x2_2nd') || resolvedEndTurnCardName.includes('2ND HIT');
        const triggerSecondHit = !isAlreadySecondHit && Boolean(resolved.triggerAttackX2SecondHit);
        const grantExtraTurn = !isStatusOrHealCard && (resolved.extraTurnGranted || triggerSecondHit);

        if (grantExtraTurn) {
          nextTurnPlayerId = actorId;
          pendingAttackX2For = triggerSecondHit ? actorId : null;
        } else {
          pendingAttackX2For = null;
          const currentIdx = livingPlayers.indexOf(actorId);
          const step = currentState.turnDirection === 'counter' ? -1 : 1;
          let nextIdx = (currentIdx + step) % livingPlayers.length;
          if (nextIdx < 0) nextIdx += livingPlayers.length;
          nextTurnPlayerId = livingPlayers[nextIdx] || livingPlayers[0];
        }

        // Check if next player is Asleep (Sleepy X1 / X2 / Lightning X1/X2)
        // Process each sleeping player sequentially, decrementing sleep counter and advancing turn
        let checkedSleepCount = 0;
        while (updatedStates[nextTurnPlayerId]?.sleepTurns > 0 && checkedSleepCount < livingPlayers.length) {
          const sleepingChar = updatedStates[nextTurnPlayerId];
          sleepingChar.sleepTurns = Math.max(0, sleepingChar.sleepTurns - 1);
          turnLogs.unshift(`💤 ${sleepingChar.name} is asleep and skips their turn! (${sleepingChar.sleepTurns} turn(s) remaining)`);

          // Apply poison damage tick during skipped turn so poison continues to damage sleeping targets
          if (sleepingChar.poisonCount > 0 && !sleepingChar.isDefeated) {
            const pDmg = sleepingChar.poisonCount * 10;
            sleepingChar.hp = Math.max(0, sleepingChar.hp - pDmg);
            turnLogs.unshift(`☠️ ${sleepingChar.name} suffered ${pDmg} Poison damage while asleep! HP: ${sleepingChar.hp}`);
            if (sleepingChar.hp <= 0) {
              sleepingChar.isDefeated = true;
              turnLogs.unshift(`💀 ${sleepingChar.name} succumbed to Poison and was eliminated!`);
            }
          }

          // Apply burn damage tick during skipped turn
          if (typeof sleepingChar.burnCount === 'number' && sleepingChar.burnCount > 0 && !sleepingChar.isDefeated) {
            const bDmg = sleepingChar.burnCount * 10;
            sleepingChar.hp = Math.max(0, sleepingChar.hp - bDmg);
            turnLogs.unshift(`🔥 ${sleepingChar.name} suffered ${bDmg} Burn damage while asleep! HP: ${sleepingChar.hp}`);
            if (sleepingChar.hp <= 0) {
              sleepingChar.isDefeated = true;
              turnLogs.unshift(`💀 ${sleepingChar.name} was incinerated by Burn damage and eliminated!`);
            }
          }

          // Advance to next player for sleeping turn check
          const sIdx = livingPlayers.indexOf(nextTurnPlayerId);
          const step = currentState.turnDirection === 'counter' ? -1 : 1;
          let nextSIdx = (sIdx + step) % livingPlayers.length;
          if (nextSIdx < 0) nextSIdx += livingPlayers.length;
          nextTurnPlayerId = livingPlayers[nextSIdx];
          checkedSleepCount++;
        }
        
        // Safety: ensure we have a valid next player even if something went wrong
        if (!nextTurnPlayerId || !updatedStates[nextTurnPlayerId]) {
          nextTurnPlayerId = livingPlayers[0];
        }

        // Check Poison damage tick on the player starting their turn (-10 HP per turn per poison stack)
        const incomingChar = updatedStates[nextTurnPlayerId];
        if (incomingChar && incomingChar.poisonCount > 0 && !incomingChar.isDefeated) {
          const poisonDmg = incomingChar.poisonCount * 10;
          incomingChar.hp = Math.max(0, incomingChar.hp - poisonDmg);
          turnLogs.unshift(`?? ${incomingChar.name} suffered ${poisonDmg} Poison damage (${incomingChar.poisonCount} stack${incomingChar.poisonCount > 1 ? 's' : ''})! HP: ${incomingChar.hp}`);
          if (incomingChar.hp <= 0) {
            incomingChar.isDefeated = true;
            turnLogs.unshift(`?? ${incomingChar.name} succumbed to Poison and was eliminated!`);
            const remainingLiving = currentState.players.filter((pId) => !updatedStates[pId]?.isDefeated);
            if (remainingLiving.length === 1) {
              matchWinner = updatedStates[remainingLiving[0]] ? { ...updatedStates[remainingLiving[0]], playerId: remainingLiving[0] } : null;
            }
            const dIdx = livingPlayers.indexOf(nextTurnPlayerId);
            nextTurnPlayerId = livingPlayers[(dIdx + 1) % livingPlayers.length];
          }
        }

        // Note: Burn damage is resolved via the interactive Extinguish Roll prompt before the active player's move per Nov 5 specification.
        // Check Vampire drain effect (-10 HP, -1 ET per turn for 3 turns)
        if (incomingChar && typeof incomingChar.vampireStealTurnsLeft === 'number' && incomingChar.vampireStealTurnsLeft > 0 && !incomingChar.isDefeated) {
          const vampireDrain = Math.min(10, incomingChar.hp);
          const vampireETDrain = Math.min(1, incomingChar.energyTokens || 0);
          incomingChar.hp = Math.max(0, incomingChar.hp - vampireDrain);
          incomingChar.energyTokens = Math.max(0, (incomingChar.energyTokens || 0) - vampireETDrain);
          incomingChar.vampireStealTurnsLeft -= 1;

          // Transfer drained HP and Energy Token back to the Vampire attacker if present
          const vAttackerId = incomingChar.vampireAttackerId;
          if (vAttackerId && updatedStates[vAttackerId] && !updatedStates[vAttackerId].isDefeated) {
            const vAttacker = updatedStates[vAttackerId];
            vAttacker.hp = Math.min(vAttacker.maxHp || 100, (vAttacker.hp || 0) + vampireDrain);
            vAttacker.energyTokens = Math.min(10, (vAttacker.energyTokens || 0) + vampireETDrain);
          }

          turnLogs.unshift(`🧛 ${incomingChar.name} suffered ${vampireDrain} HP and ${vampireETDrain} ET drain from Vampire curse! (${incomingChar.vampireStealTurnsLeft} turn${incomingChar.vampireStealTurnsLeft === 1 ? '' : 's'} remaining)`);
          if (incomingChar.hp <= 0) {
            incomingChar.isDefeated = true;
            turnLogs.unshift(`💀 ${incomingChar.name} was drained to death by Vampire curse and eliminated!`);
            const remainingLiving = currentState.players.filter((pId) => !updatedStates[pId]?.isDefeated);
            if (remainingLiving.length === 1) {
              matchWinner = updatedStates[remainingLiving[0]] ? { ...updatedStates[remainingLiving[0]], playerId: remainingLiving[0] } : null;
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

      let updatedHands = {
        ...(currentState.hands || {}),
        [actorId]: newHand
      };
      if (defenderChar && targetId !== 'ALL') {
        updatedHands[targetId] = newDefenderHand;
      }

// X-CHANGE is handled interactively via EXECUTE_XCHANGE modal


      // Absolute maximum hand size limit for all players (Global Enforcer)
      Object.keys(updatedHands).forEach(pid => {
        if (updatedHands[pid] && updatedHands[pid].length > 10) {
          updatedHands[pid] = updatedHands[pid].slice(0, 10);
        }
      });

      // Update Match Summary Stats
      let updatedStats = { ...(currentState.stats || { damageDealt: {}, cardsPlayed: {}, turnsTaken: {} }) };
      
      // Cards Played
      if (!isPass) {
        updatedStats.cardsPlayed[actorId] = (updatedStats.cardsPlayed[actorId] || 0) + 1;
      }
      
      // Turns Taken
      updatedStats.turnsTaken[actorId] = (updatedStats.turnsTaken[actorId] || 0) + 1;

      // Damage Dealt (Compute from diff)
      if (!isPass && getSafeCardType(actionCard) === 'ATTACK') {
        let totalTurnDmg = 0;
        if (targetId && targetId !== 'ALL' && newDefenderState) {
           const prevDefHP = (currentState.characterStates?.[targetId]?.hp) ?? 0;
           totalTurnDmg = Math.max(0, prevDefHP - newDefenderState.hp);
        } else if (targetId === 'ALL' && resolved.aoeDamage) {
           // Calculate split damage per defender for AoE attacks
           const activeDefenders = currentState.players.filter(pId => 
             pId !== actorId && !currentState.characterStates[pId]?.isDefeated
           );
           const damagePerDefender = Math.ceil(resolved.aoeDamage / Math.max(1, activeDefenders.length));
           
           activeDefenders.forEach(pId => {
              const prevHp = currentState.characterStates[pId].hp;
              const newHp = Math.max(0, prevHp - damagePerDefender);
              totalTurnDmg += Math.max(0, prevHp - newHp);
           });
        }
        updatedStats.damageDealt[actorId] = (updatedStats.damageDealt[actorId] || 0) + totalTurnDmg;
      }

      const nextState = {
        ...currentState,
        turn: nextTurnPlayerId,
        pendingAttackX2For,
        turnNumber: (currentState.turnNumber || 1) + 1,
        deck: newDeck,
        hands: updatedHands,
        characterStates: updatedStates,
        stats: updatedStats,
        logs: [...turnLogs, ...(currentState.logs || [])],
        winner: matchWinner
      };

      broadcastState(matchIdRef.current, nextState);
      if (matchWinner) {
        setWinner(matchWinner);
        soundFX.init();
        if (matchWinner.playerId === playerIdRef.current) {
          soundFX.playVictory();
        } else {
          soundFX.playDefeat();
        }
      }
      return nextState;
    });
  };

  // ==========================================
  // TOURNAMENT MATCH LAUNCH HANDLER
  const handleLaunchTournamentMatch = async (tournament, match, spectator = false) => {
    playClick();
    const finalName = (playerName || userProfile?.username || currentUser?.user_metadata?.username || 'Player').trim();
    if (playerName !== finalName) setPlayerName(finalName);

    setTournamentMatchContext({
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      round: match.round,
      matchIndex: match.matchIndex,
      seriesFormat: match.seriesFormat,
      targetWins: match.targetWins,
      player1Id: match.player1?.id,
      player2Id: match.player2?.id
    });

    const isMatchHost = match.player1?.id === currentUser?.id;
    const roomCode = match.roomCode;

    if (spectator) {
      setIsSpectator(true);
      setIsHost(false);
      setMatchId(roomCode);
      return;
    }

    // Quota validation for tournament players
    const tournLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
    if (!tournLic.canPlay) {
      setError(`Cannot enter tournament match: ${tournLic.characterName} has exhausted the 10-match free quota!`);
      setQuotaUnlockChar(selectedCharacter);
      return;
    }

    if (isMatchHost) {
      try {
        const initialState = await createMatch(roomCode, playerId, selectedCharacter);
        initialState.isPremium = isPremium;
        initialState.playerNames = { [playerId]: finalName };
        initialState.isTournamentMatch = true;

        setMatchId(roomCode);
        setRoomCode(roomCode);
        setGameState(initialState);
        setIsHost(true);
        setIsSpectator(false);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        setIsHost(false);
        const tempState = await joinMatch(roomCode, playerId, selectedCharacter);
        tempState.playerNames = { [playerId]: finalName };
        tempState.isTournamentMatch = true;
        setGameState(tempState);
        setRoomCode(roomCode);
        setError(null);

        if (matchId === roomCode) {
          requestJoin(roomCode, {
            playerId: playerIdRef.current,
            characterId: selectedCharacterRef.current,
            playerName: finalName
          });
          requestSync(roomCode, playerIdRef.current);
        } else {
          isJoiningRef.current = true;
          setMatchId(roomCode);
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // MATCH CREATION & JOINING
  // ==========================================
  const handleCreateMatch = async () => {
    playClick();

    // 1. Quota Validation: Check if selected character is locked
    const charLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
    if (!charLic.canPlay) {
      setError(`Cannot create match: ${charLic.characterName} has exhausted the 10-match free quota!`);
      setQuotaUnlockChar(selectedCharacter);
      return;
    }
    // 2. Quota Validation: Check if user has ANY playable character available
    if (!characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id)) {
      setError('All your characters have exhausted their free 10-match quota. Please unlock a character to create matches.');
      setQuotaUnlockChar(selectedCharacter);
      return;
    }

    const finalName = (playerName || userProfile?.username || currentUser?.user_metadata?.username || 'Player').trim();
    if (playerName !== finalName) setPlayerName(finalName);

    try {
      // Premium match cost � only charge authenticated premium users (PRO bypass honored)
      if (isPremium && !userProfile?.is_premium && currentUser?.id) {
        const moduleCost = appSettings.module_costs?.kontrola ?? appSettings.match_cost;
        const success = await authService.savePlayerMatchResult(currentUser.id, {
          won: false,
          crystalsDelta: -moduleCost,
          appSource: 'kontrola_toll'
        });
        if (!success) {
          setError('Failed to deduct match cost. Please try again.');
          return;
        }
      }

      const newMatchId = generateRoomCode();
      const initialState = await createMatch(newMatchId, playerId, selectedCharacter);
      initialState.isPremium = isPremium;
      initialState.playerNames = { [playerId]: finalName };

      setMatchId(newMatchId);
      setRoomCode(newMatchId); // Set room code for reconnect feature
      setGameState(initialState);
      setIsHost(true);
      setIsSpectator(false);
      setTournamentMatchContext(null);
      setError(null);
      // Persist session to DB + localStorage
      sessionService.saveSession(newMatchId, playerId, 'host', currentUser?.id ?? null);

      // Advertise room immediately to global lobby
      advertiseRoom({
        roomCode: newMatchId,
        hostName: finalName,
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

    // 1. Quota Validation: Check if selected character is locked
    const charLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
    if (!charLic.canPlay) {
      setError(`Cannot join match: ${charLic.characterName} has exhausted the 10-match free quota!`);
      setQuotaUnlockChar(selectedCharacter);
      return;
    }
    // 2. Quota Validation: Check if user has ANY playable character available
    if (!characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id)) {
      setError('All your characters have exhausted their free 10-match quota. Please unlock a character to join matches.');
      setQuotaUnlockChar(selectedCharacter);
      return;
    }

    const finalName = (playerName || userProfile?.username || currentUser?.user_metadata?.username || 'Player').trim();
    if (playerName !== finalName) setPlayerName(finalName);

    if (!codeToJoin) {
      setError('Please provide a valid 6-character room code.');
      return;
    }

    try {
      const cleanId = codeToJoin.trim().toUpperCase();
      // Check last known match from session (DB or localStorage)
      const lastMatch = await sessionService.getLastMatchId(currentUser?.id ?? null, playerId);

      // Premium match cost � only charge authenticated premium users for NEW rooms (PRO bypass honored)
      if (isPremium && !userProfile?.is_premium && currentUser?.id && cleanId !== lastMatch) {
        const moduleCost = appSettings.module_costs?.kontrola ?? appSettings.match_cost;
        const success = await authService.savePlayerMatchResult(currentUser.id, {
          won: false,
          crystalsDelta: -moduleCost,
          appSource: 'kontrola_toll'
        });
        if (!success) {
          setError('Failed to deduct match cost. Please try again or purchase more Diamonds.');
          return;
        }
      }

      setIsHost(false);
      setIsSpectator(false);
      setTournamentMatchContext(null);
      
      const tempState = await joinMatch(cleanId, playerId, selectedCharacter);
      tempState.playerNames = { [playerId]: finalName };
      setGameState(tempState);
      setRoomCode(cleanId); // Set room code for reconnect feature
      setError(null);
      // Persist session to DB + localStorage
      sessionService.saveSession(cleanId, playerId, 'player', currentUser?.id ?? null);
      
      if (matchId === cleanId) {
        // Already subscribed to this room channel, but need to re-request join
        requestJoin(cleanId, {
          playerId: playerIdRef.current,
          characterId: selectedCharacterRef.current,
          playerName: finalName
        });
      } else {
        isJoiningRef.current = true; // Triggers requestJoin inside useEffect once channel connects
        setMatchId(cleanId);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartGame = () => {
    playClick();
    if (!gameState || !isHost) return;

    // Quota validation before launching multiplayer match
    const hostLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
    if (!hostLic.canPlay) {
      setError(`Cannot start match: Your character (${hostLic.characterName}) is locked (10/10 used).`);
      setQuotaUnlockChar(selectedCharacter);
      return;
    }

    // Record match usage for host (guarded by sessionStorage so useEffect won't double count)
    const hostStorageKey = `kontrola_match_used_${matchId}_${playerId}`;
    try { sessionStorage.setItem(hostStorageKey, 'true'); } catch {}
    characterLicenseService.recordMatchUse(currentUser?.id, selectedCharacter);

    // Remove room from global lobby broadcast
    closeRoom(matchId);

    const activeState = {
      ...gameState,
      status: 'roll_off',
      turnDirection: 'clockwise',
      rollOffs: {},
      characterSelections: {}, // Reset selections
      logs: [
        `?? MATCH STARTED! All players must roll 2 dice to determine who strikes first.`
      ]
    };

    setGameState(activeState);
    broadcastState(matchId, activeState);
  };

  // Claim +1 ET on turn
  const handleClaimTurnET = () => {
    if (isProcessingAction) return;
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

    setIsProcessingAction(true);
    const payload = { actionType: 'CLAIM_ET', actorId: playerId };
    if (isHost) enqueueHostAction(payload);
    else takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
    
    // Locally clear lock quickly since this doesn't pop up a modal
    setTimeout(() => setIsProcessingAction(false), 500);
  };

  // Pass turn without playing a card or consuming ET
  const handlePassTurn = () => {
    if (isProcessingAction) return;
    playClick();
    if (!isMyTurn || isSpectator) return;
    setIsProcessingAction(true);
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
    setTimeout(() => setIsProcessingAction(false), 2500);
    setSelectedActionCard(null);
    setSelectedCharacterAttack(null);
    setSelectedTargetId(null);
  };

  // Discard a selected card in your hand and pick a new one from Action Card deck as your ONLY turn move
  const handleDiscardActionCardTurn = () => {
    if (isProcessingAction) return;
    playClick();
    if (!isMyTurn || isSpectator) return;
    if (!selectedActionCard) {
      showNotice('Please select the Action Card you want to discard first.', 'warning');
      return;
    }
    setIsProcessingAction(true);
    const targetKey = typeof selectedActionCard === 'object' ? (selectedActionCard?.instanceId || selectedActionCard?.id || selectedActionCard?.name) : selectedActionCard;
    setDissolvingCardId(targetKey);

    const payload = {
      actionType: 'DISCARD_AND_DRAW',
      actorId: playerId,
      cardId: typeof selectedActionCard === 'object' ? selectedActionCard?.id : null,
      cardName: getSafeCardName(selectedActionCard)
    };
    if (isHost) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
    }
    setTimeout(() => {
      setIsProcessingAction(false);
      setDissolvingCardId(null);
      setSelectedActionCard(null);
      setSelectedCharacterAttack(null);
      setSelectedTargetId(null);
    }, 600);
  };

  // Host force skip for stalled / AFK player
  const handleForceSkipCurrentPlayer = () => {
    playClick();
    if (isProcessingAction) return;
    if (!isHost || isMyTurn || !gameState?.turn) return;
    
    setIsProcessingAction(true);
    setTimeout(() => setIsProcessingAction(false), 2000);
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
  const playTurn = async () => {
    console.log('[playTurn] Starting with state:', {
      isProcessingAction,
      isMyTurn,
      isSpectator,
      selectedActionCard: selectedActionCard?.name,
      selectedCharacterAttack,
      selectedTargetId,
      myCharacterName: myCharacter?.name
    });
    
    playClick();
    if (isProcessingAction) {
      console.log('[playTurn] BLOCKED: isProcessingAction is true');
      return;
    }
    if (isSpectator) {
      showNotice('Spectator mode: you are observing this match.', 'info');
      return;
    }
    if (!isMyTurn) {
      showNotice("It's not your turn! Please wait for the current player.", 'warning');
      return;
    }
    if (!selectedActionCard) {
      showNotice('Please select an Action Card from your hand first.', 'warning');
      return;
    }

    const cardName = getSafeCardName(selectedActionCard).toUpperCase();
    const isTrap = cardName.includes('BOOMERANG');
    const isDrain = cardName.includes('DRAIN');
    const isBackStab = cardName.includes('BACK STAB');
    const isFullXChange = cardName.includes('X-CHANGE') && cardName.includes('FULL');
    const isAttack = (selectedActionCard.type === 'ATTACK' || isBackStab || isDrain) && !isTrap;
    const isAoE = cardName.includes('BLITZ') || (selectedCharacterAttack && selectedCharacterAttack.includes('BLITZ')) || isFullXChange;
    const isLightning = cardName.includes('LIGHTNING');
    const isFire = cardName.includes('FIRE');
    const isVampire = cardName.includes('VAMPIRE');
    const isMisdirect = cardName.includes('MISDIRECT');

    console.log('[playTurn] Card type analysis:', {
      cardName,
      cardType: selectedActionCard.type,
      isAttack,
      isAoE,
      isLightning,
      isFire,
      isVampire,
      isBackStab,
      isDrain,
      isTrap
    });

    // Level check for Vitality Gain cards (V20 -> Level 2, V30 -> Level 3, V40 -> Level 4)
    const currentVLevel = myCharacter?.level || 1;
    if (cardName.includes('V20') && currentVLevel < 2) {
      showNotice('Only available in level 2! Vitality Gain V20 requires reaching 150 HP (Level 2).', 'warning');
      return;
    }
    if (cardName.includes('V30') && currentVLevel < 3) {
      showNotice('Only available in level 3! Vitality Gain V30 requires reaching 200 HP (Level 3).', 'warning');
      return;
    }
    if (cardName.includes('V40') && currentVLevel < 4) {
      showNotice('Only available in level 4! Vitality Gain V40 requires reaching Level 4.', 'warning');
      return;
    }

    if (isAttack && !isAoE && !selectedTargetId) {
      console.log('[playTurn] VALIDATION FAILED: Attack requires target');
      showNotice('Please select a target opponent player first!', 'warning');
      return; // Must select target
    }

    // 3+ Player check for Soul Alliance, Abandon, Back Stab & Misdirect
    const is3PlayerOnly = cardName.includes('BACK STAB') || cardName.includes('SOUL ALLIANCE') || cardName.includes('ABANDON') || cardName.includes('MISDIRECT');
    const totalMatchPlayers = (gameState?.players?.length) || 2;
    if (is3PlayerOnly && totalMatchPlayers <= 2) {
      if (cardName.includes('MISDIRECT')) {
        showNotice('⚠️ Valid only with more than two players! Requires 3+ players. (You can still discard & draw)', 'warning');
      } else {
        showNotice('⚠️ Only available in 3+ player matches! Cannot be played in a 1-on-1 duel.', 'warning');
      }
      return;
    }

    const needsTarget = ['POISON', 'SLEEPY', 'FREEZE', 'KONTROL', 'SOUL ALLIANCE', 'DRAIN', 'VAMPIRE'].some(kw => cardName.includes(kw)) ||
      (cardName.includes('X-CHANGE') && !cardName.includes('FULL')) ||
      (cardName.includes('VISION') && !cardName.includes('FULL'));
    if (needsTarget && !selectedTargetId) {
      showNotice('Please select a target player first!', 'warning');
      return;
    }

    if (isAttack && !isAoE && !isLightning && !isFire && !isVampire && !isBackStab && !isMisdirect && !isDrain && !selectedCharacterAttack) {
      console.log('[playTurn] VALIDATION FAILED: Attack requires character move selection');
      showNotice('Please select a character attack move to strike with!', 'warning');
      return;
    }

    const payload = {
      actorId: playerId,
      actionCard: selectedActionCard,
      attackSelectionName: (isLightning || isFire || isVampire || isBackStab || isMisdirect || isDrain) ? null : selectedCharacterAttack,
      targetId: isAoE ? 'ALL' : selectedTargetId
    };

    console.log('[playTurn] Payload created:', payload);

    if (currentUser?.id) {
      cosmeticsService.recordCardPlayed(currentUser.id);
    }

    if (isAttack) {
      if (isAoE) {
        // Synthesize valid defender object for AoE so 3D Dice screen never crashes on undefined target
        const targetChar = (selectedTargetId && gameState.characterStates[selectedTargetId]) ? gameState.characterStates[selectedTargetId] : {
          id: 'ALL',
          name: 'ALL OPPONENTS',
          image: 'Kontrolla_Data/Graphics/CARDS/SHIELD ADVANCE +100HP CARD.png',
          themeColor: '#FF9900',
          mind: 3
        };
        const precalculatedRolls = {};
        const clashData = {
          ...payload,
          attacker: myCharacter,
          defender: targetChar,
          attackerId: playerId,
          attackerPlayerName: myCharacter?.name || playerName || 'Attacker',
          defenderPlayerName: 'ALL OPPONENTS',
          precalculatedRolls,
          attackerPlayerId: playerId,
          defenderPlayerId: 'ALL'
        };
        console.log('[playTurn] AoE Attack - Opening dice screen immediately');
        await broadcastUIEvent(matchId, 'dice_screen_open', clashData);
        setActiveCombat(clashData);
        setIsDiceRollingSync(false);
      } else {
        const targetChar = gameState.characterStates[selectedTargetId];
        if (!targetChar) {
          console.error('[playTurn] ERROR: Target character not found in gameState!', {
            selectedTargetId,
            availableCharacters: Object.keys(gameState.characterStates || {})
          });
          showNotice('Target player not found in game state!', 'error');
          return;
        }
        
        const clashData = {
          ...payload,
          actionType: 'ATTACK_DECLARED',
          attacker: myCharacter,
          defender: targetChar,
          attackerId: playerId,
          attackerPlayerName: myCharacter?.name || playerName || 'Attacker',
          defenderPlayerName: targetChar?.name || 'Defender'
        };
        
        console.log('[playTurn] Regular Attack - Broadcasting ATTACK_DECLARED:', {
          attackerName: clashData.attackerPlayerName,
          defenderName: clashData.defenderPlayerName,
          actionCard: clashData.actionCard.name,
          attackSelectionName: clashData.attackSelectionName,
          isHost
        });
        
        if (isHost) enqueueHostAction(clashData);
        else takeTurn(matchId, { type: 'PLAYER_ACTION', payload: clashData });
      }
    } else {
      console.log('[playTurn] Non-attack card - Resolving immediately');
      if (isHost) {
        enqueueHostAction(payload);
      } else {
        takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
      }
    }

    setIsProcessingAction(true);
    setTimeout(() => setIsProcessingAction(false), 2500); // Wait for SYNC_STATE

    setSelectedActionCard(null);
    setSelectedCharacterAttack(null);
    setSelectedTargetId(null);
    
    console.log('[playTurn] Action sent, state cleared, processing lock set for 2.5s');
  };

  // Triggered when attacker rolls the authentic pip dice (or re-rolls on tie)
  const handleTriggerDiceRoll = async (newRolls = null, isReroll = false) => {
    if (newRolls) {
      // Log doubles detection if present
      if (newRolls.attackerDouble) {
        console.log('[Fate Card] Attacker rolled doubles!', { rolls: newRolls.attackerRoll });
      }
      if (newRolls.defenderDouble) {
        console.log('[Fate Card] Defender rolled doubles!', { rolls: newRolls.defenderRoll });
      }

      setActiveCombat((prev) => prev ? { ...prev, precalculatedRolls: { ...(prev.precalculatedRolls || {}), ...newRolls } } : prev);
      await broadcastUIEvent(matchId, 'dice_screen_rolled', { timestamp: Date.now(), precalculatedRolls: newRolls });
      // Set sync flag AFTER broadcast, not before — prevents re-render race where
      // hasAttackerRolled state hasn't committed yet when the sync useEffect re-runs
      setIsDiceRollingSync(true);
    } else if (isReroll) {
      // Preserve defenseCard when re-rolling on a tie — only reset the dice rolls
      setActiveCombat((prev) => {
        const kept = { defenseCard: prev?.precalculatedRolls?.defenseCard ?? null };
        return prev ? { ...prev, precalculatedRolls: kept } : prev;
      });
      await broadcastUIEvent(matchId, 'dice_screen_rolled', { timestamp: Date.now(), isReroll: true });
      setIsDiceRollingSync(false);
    } else {
      await broadcastUIEvent(matchId, 'dice_screen_rolled', { timestamp: Date.now() });
      setIsDiceRollingSync(true);
    }
  };

  // Triggered when dice screen is closed or finished
  const handleCloseDiceScreen = async (resolved = false, finalRolls = null) => {
    const rollsToApply = {
      ...(activeCombat?.precalculatedRolls || {}),
      ...(finalRolls || {})
    };
    const cId = activeCombat?.combatId || (activeCombat?.actorId + '_' + activeCombat?.targetId + '_' + (activeCombat?.actionCard?.id || activeCombat?.actionCard?.name || 'combat'));
    await broadcastUIEvent(matchId, 'dice_screen_close', {
      resolved,
      combatData: activeCombat ? { ...activeCombat, combatId: cId } : null,
      precalculatedRolls: rollsToApply,
      senderId: playerIdRef.current
    });
    setActiveCombat(null);
    setIsDiceRollingSync(false);
    if (resolved && isHost && activeCombat) {
      if (cId && lastResolvedCombatIdRef.current === cId) {
        console.warn('[handleCloseDiceScreen] Combat already resolved for ID:', cId);
      } else {
        lastResolvedCombatIdRef.current = cId;
        enqueueHostAction({ ...activeCombat, combatId: cId, actionType: 'RESOLVE_COMBAT' }, rollsToApply);
      }
    }
  };

  // Disengage from combat using RETREAT card (Attacker after rolling, Defender after attacker rolls)
  const handleExecuteRetreat = async (role = 'attacker') => {
    playClick();
    const payload = {
      actionType: 'EXECUTE_RETREAT',
      retreatingPlayerId: playerId,
      role
    };
    await broadcastUIEvent(matchId, 'dice_screen_close', {
      resolved: false,
      combatData: activeCombat,
      retreat: true
    });
    setActiveCombat(null);
    setIsDiceRollingSync(false);
    if (isHost) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
    }
  };

  const handleCharacterSelect = (charId) => {
    if (isProcessingAction) return;

    // Quota validation
    const lic = characterLicenseService.getLicenseSync(currentUser?.id, charId);
    if (!lic.canPlay) {
      playClick();
      showNotice(`${lic.characterName} has exhausted the 10-match free quota!`, 'warning');
      setQuotaUnlockChar(charId);
      return;
    }

    setIsProcessingAction(true);
    playClick();
    const payload = { actionType: 'CHARACTER_SELECT', actorId: playerId, characterId: charId };
    if (isHostRef.current) enqueueHostAction(payload);
    else takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    setTimeout(() => setIsProcessingAction(false), 2500);
  };

  const handleSendMessage = (content) => {
    const msg = typeof content === 'object' && content !== null ? {
      id: content.id || 'msg_' + Date.now(),
      text: content.text || '',
      senderId: content.senderId || playerId,
      senderName: content.senderName || myCharacter?.name || playerName || 'Player',
      characterId: content.characterId || selectedCharacter,
      time: content.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } : {
      id: 'msg_' + Date.now(),
      text: String(content || ''),
      senderId: playerId,
      senderName: myCharacter?.name || playerName || 'Player',
      characterId: selectedCharacter,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, msg]);
    broadcastUIEvent(matchIdRef.current, 'chat_message', msg);
    
    if (!showChatRef.current) {
      const toastId = 'toast_' + Date.now() + Math.random();
      setChatToasts((prev) => [...prev, { ...msg, toastId, type: 'CHAT' }]);
      setTimeout(() => setChatToasts((prev) => prev.filter(t => t.toastId !== toastId)), 4500);
    }
  };

  const handleSendTaunt = (tauntText) => {
    if (!tauntText || !tauntText.trim()) return;
    const msg = {
      text: tauntText.trim(),
      senderId: playerId,
      senderName: myCharacter?.name || playerName || 'Player',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setActiveTauntBubble(msg);
    setChatMessages((prev) => [...prev, { ...msg, text: `??? [TAUNT]: "${msg.text}"` }]);
    setTimeout(() => setActiveTauntBubble(null), 4500);
    broadcastUIEvent(matchIdRef.current, 'player_taunt', msg);
    
    if (!showChatRef.current) {
      const toastId = 'toast_' + Date.now() + Math.random();
      setChatToasts((prev) => [...prev, { ...msg, toastId, type: 'TAUNT' }]);
      setTimeout(() => setChatToasts((prev) => prev.filter(t => t.toastId !== toastId)), 4500);
    }
  };

  // ==========================================
  // SECRET ALLIANCE HANDLERS
  // ==========================================
  const handleOpenSecretAllianceInvite = (cardInstanceId, targetPlayerId) => {
    setPreselectedAllianceTargetId(targetPlayerId || null);
    setShowSecretAllianceInviteModal(true);
  };

  const handleSendAllianceInvite = (inviteData) => {
    soundFX.playMenuSelect?.();
    const packet = {
      fromPlayerId: inviteData.fromPlayerId,
      fromPlayerName: inviteData.fromPlayerName,
      toPlayerId: inviteData.toPlayerId,
      toPlayerName: inviteData.toPlayerName,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 1000)
    };
    broadcastUIEvent(matchIdRef.current, 'alliance_invite', packet);
    setShowSecretAllianceInviteModal(false);
    showNotice(`Secret alliance proposal sent to ${inviteData.toPlayerName}!`, 'info');
  };

  const handleAcceptAllianceInvite = () => {
    if (!pendingAllianceInvite) return;
    soundFX.playMenuSelect?.();
    
    if (inviteTimeoutRef.current) {
      clearTimeout(inviteTimeoutRef.current);
      inviteTimeoutRef.current = null;
    }

    broadcastUIEvent(matchIdRef.current, 'alliance_response', {
      fromPlayerId: pendingAllianceInvite.fromPlayerId,
      toPlayerId: pendingAllianceInvite.toPlayerId,
      accepted: true,
      toPlayerName: myCharacter?.name || playerName || 'Player'
    });

    setActiveAlliance({
      player1Id: pendingAllianceInvite.fromPlayerId,
      player1Name: pendingAllianceInvite.fromPlayerName,
      player2Id: pendingAllianceInvite.toPlayerId,
      player2Name: pendingAllianceInvite.toPlayerName,
      type: null,
      terms: [],
      confirmations: {},
      createdTurn: gameState?.turnNumber || 1,
      expiresAtTurn: (gameState?.turnNumber || 1) + 1
    });

    setShowAllianceChatModal(true);
    setAllianceChatHistory([]);
    setSelectedAllianceTerms([]);
    setAllianceConfirmations({ player1: false, player2: false });
    setPendingAllianceInvite(null);
  };

  const handleDeclineAllianceInvite = () => {
    soundFX.playCard?.();
    if (pendingAllianceInvite) {
      broadcastUIEvent(matchIdRef.current, 'alliance_response', {
        fromPlayerId: pendingAllianceInvite.fromPlayerId,
        toPlayerId: pendingAllianceInvite.toPlayerId,
        accepted: false,
        toPlayerName: myCharacter?.name || playerName || 'Player'
      });
    }
    setPendingAllianceInvite(null);
  };

  const handleSendAllianceChatMessage = (text) => {
    if (!activeAlliance || !text.trim()) return;
    const newMessage = {
      senderId: playerId,
      senderName: myCharacter?.name || playerName || 'Player',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAllianceChatHistory(prev => [...prev, newMessage]);
  };

  const handleSelectAllianceTerm = (termType) => {
    setSelectedAllianceTerms(prev => {
      if (prev.includes(termType)) {
        return prev.filter(t => t !== termType);
      } else {
        return [...prev, termType];
      }
    });
  };

  const handleRemoveAllianceTerm = (termType) => {
    setSelectedAllianceTerms(prev => prev.filter(t => t !== termType));
  };

  const handleConfirmAllianceAgreement = () => {
    if (!activeAlliance || selectedAllianceTerms.length === 0) return;
    soundFX.playMenuSelect?.();

    const playerKey = playerId === activeAlliance.player1Id ? 'player1' : 'player2';
    const newConfirmations = { ...allianceConfirmations };
    newConfirmations[playerKey] = !newConfirmations[playerKey];
    setAllianceConfirmations(newConfirmations);

    if (newConfirmations.player1 && newConfirmations.player2) {
      let allianceType = 'MIXED';
      if (selectedAllianceTerms.length === 1) {
        allianceType = selectedAllianceTerms[0];
      }

      const establishedAlliance = {
        player1Id: activeAlliance.player1Id,
        player1Name: activeAlliance.player1Name,
        player2Id: activeAlliance.player2Id,
        player2Name: activeAlliance.player2Name,
        type: allianceType,
        terms: selectedAllianceTerms,
        status: 'active',
        createdTurn: gameState?.turnNumber || 1,
        expiresAtTurn: (gameState?.turnNumber || 1) + 1
      };

      setGameState(prev => ({
        ...prev,
        alliances: [...(prev?.alliances || []), establishedAlliance]
      }));

      setChatMessages(prev => [...prev, {
        id: `alliance_${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        text: `🤝 ${establishedAlliance.player1Name} and ${establishedAlliance.player2Name} have formed a secret alliance!`,
        time: new Date().toLocaleTimeString()
      }]);

      setTimeout(() => {
        setShowAllianceChatModal(false);
        setActiveAlliance(null);
      }, 1500);
    }
  };

  const handleCancelAllianceFormation = () => {
    setPendingAllianceInvite(null);
    setShowSecretAllianceInviteModal(false);
    setShowAllianceChatModal(false);
    setAllianceChatHistory([]);
    setSelectedAllianceTerms([]);
    setAllianceConfirmations({ player1: false, player2: false });
  };

  // ==========================================
  // X-CHANGE, REVIVE & ALLIANCE TRADE HANDLERS
  // ==========================================
  const handleConfirmXChange = ({ attackerCard, defenderCard }) => {
    if (!xChangeModalData) return;
    soundFX.playCard?.();
    const payload = {
      actionType: 'EXECUTE_XCHANGE',
      actorId: xChangeModalData.actorId,
      targetId: xChangeModalData.targetId,
      giveCard: attackerCard,
      takeCard: defenderCard
    };
    if (isHostRef.current) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    }
    setXChangeModalData(null);
  };

  const handleConfirmRevive = () => {
    if (!pendingRevivePrompt) return;
    soundFX.playHeal?.();
    const payload = {
      actionType: 'EXECUTE_REVIVE',
      victimId: pendingRevivePrompt.victimId
    };
    if (isHostRef.current) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    }
    setPendingRevivePrompt(null);
  };

  const handleDeclineRevive = () => {
    if (pendingRevivePrompt && gameState?.turn === pendingRevivePrompt.victimId) {
      const payload = { actionType: 'DECLINE_REVIVE', victimId: pendingRevivePrompt.victimId };
      if (isHostRef.current) enqueueHostAction(payload);
      else takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    }
    setPendingRevivePrompt(null);
  };

  const handleRollExtinguishFire = () => {
    if (isExtinguishRolling || hasAttemptedExtinguishThisTurn || !myCharacter) return;
    setIsExtinguishRolling(true);
    soundFX.playDiceRoll?.();

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setExtinguishDice([d1, d2]);

    setTimeout(() => {
      const isDoubles = (d1 === d2);
      const burnDmg = (myCharacter.burnCount || 1) * 10;
      setIsExtinguishRolling(false);
      setExtinguishResult({ success: isDoubles, d1, d2, damage: isDoubles ? 0 : burnDmg });

      const payload = {
        actionType: 'EXTINGUISH_BURN',
        actorId: playerId,
        extinguished: isDoubles,
        rolls: [d1, d2],
        damage: isDoubles ? 0 : burnDmg
      };

      if (isHostRef.current) {
        enqueueHostAction(payload);
      } else {
        takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
      }

      setTimeout(() => {
        setHasAttemptedExtinguishThisTurn(true);
        setExtinguishResult(null);
      }, 1800);
    }, 800);
  };

  const handleDeclineExtinguishFire = () => {
    if (!myCharacter || isExtinguishRolling) return;
    const burnDmg = (myCharacter.burnCount || 1) * 10;
    const payload = {
      actionType: 'EXTINGUISH_BURN',
      actorId: playerId,
      extinguished: false,
      rolls: null,
      damage: burnDmg,
      skippedRoll: true
    };

    if (isHostRef.current) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    }
    setHasAttemptedExtinguishThisTurn(true);
  };

  const handleConfirmAllianceTrade = (tradeData) => {
    if (!soulAllianceTradeData) return;
    soundFX.playMenuSelect?.();
    const payload = {
      actionType: 'EXECUTE_ALLIANCE_TRADE',
      traderId: playerId,
      recipientId: soulAllianceTradeData.allyId,
      tradeType: tradeData.type,
      card: tradeData.card || null,
      amount: tradeData.amount || 0
    };
    if (isHostRef.current) {
      enqueueHostAction(payload);
    } else {
      takeTurn(matchIdRef.current, { type: 'PLAYER_ACTION', payload });
    }
    setSoulAllianceTradeData(null);
  };

  // ==========================================
  // CRYSTAL SPLIT HANDLERS
  // ==========================================
  const handleCrystalSplitComplete = (result) => {
    setShowCrystalSplitModal(false);
    setCrystalSplitData(null);

    const { winner, loser, offer, method } = result;
    
    setGameState(prev => {
      if (!prev) return prev;
      const updatedPlayers = { ...prev.characterStates };

      if (updatedPlayers[winner.id]) {
        const newCrystals = (updatedPlayers[winner.id].crystals || 0) + 1;
        updatedPlayers[winner.id] = {
          ...updatedPlayers[winner.id],
          crystals: newCrystals
        };

        if (newCrystals >= 3) {
          return { ...prev, characterStates: updatedPlayers, status: 'finished', winner: { ...updatedPlayers[winner.id], playerId: winner.id } };
        }
      }

      if (updatedPlayers[loser.id]) {
        updatedPlayers[loser.id] = {
          ...updatedPlayers[loser.id],
          crystals: Math.max(0, (updatedPlayers[loser.id].crystals || 0) - 1)
        };
      }

      const methodText = result.accepted ? 'Negotiation' : 'Dice Roll';
      const newLog = `💎 ${winner.name} won crystal via ${methodText} (defeated ${loser.name})`;

      return {
        ...prev,
        characterStates: updatedPlayers,
        logs: [newLog, ...(prev.logs || [])]
      };
    });
  };

  // ==========================================
  // VIEW 1: LOBBY & PRE-GAME SETUP
  // ==========================================
  if (!gameState || gameState.status === 'waiting' || gameState.status === 'joining') {
    return (
      <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Leaderboard modal must live here too so it works in the lobby view */}
        <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
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
                  background: 'rgba(0, 0, 0, 0.75)',
                  border: '1px solid rgba(251, 200, 13, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'Bebas Neue, sans-serif'
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
                  2�7 PLAYERS � REALTIME EPHEMERAL ARENA
                </span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(237, 30, 36, 0.15)',
                  border: '1.5px solid var(--neon-crimson)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  maxWidth: '700px',
                  margin: '0 auto 16px auto',
                  color: '#ff6b8f',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                {error}
              </div>
            )}

            {!gameState ? (
              <div style={{ maxWidth: '900px', margin: '0 auto', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Verified Player Username Badge */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid rgba(251, 200, 13, 0.3)',
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
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '1.15rem',
                        color: 'var(--neon-cyan)',
                        fontWeight: '900',
                        letterSpacing: '1px'
                      }}
                    >
                      PLAYER USERNAME
                    </label>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      Authenticated identity linked to your Attention TCG profile
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.65)',
                        border: '1.5px solid var(--neon-cyan)',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        color: '#fff',
                        fontSize: '1.15rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Crown size={18} color="var(--neon-gold)" />
                      <span>{playerName || 'Player'}</span>
                    </div>
                    <span
                      style={{
                        background: 'rgba(57, 255, 20, 0.15)',
                        border: '1px solid #39ff14',
                        color: '#39ff14',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                      }}
                    >
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* Removed Character Selection Carousel from Lobby */}

                {/* 3. Leaderboard Button */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => { playClick(); setIsLeaderboardOpen(true); }}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: '2px solid var(--neon-gold)',
                      background: 'linear-gradient(135deg, rgba(251, 200, 13, 0.2) 0%, rgba(255, 200, 0, 0.1) 100%)',
                      color: 'var(--neon-gold)',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(251, 200, 13, 0.2)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(251, 200, 13, 0.3) 0%, rgba(255, 200, 0, 0.2) 100%)';
                      e.target.style.boxShadow = '0 6px 20px rgba(251, 200, 13, 0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(251, 200, 13, 0.2) 0%, rgba(255, 200, 0, 0.1) 100%)';
                      e.target.style.boxShadow = '0 4px 15px rgba(251, 200, 13, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <Trophy size={24} />
                    <span>VIEW LEADERBOARD</span>
                    <Crown size={20} />
                  </button>
                </div>

                {/* Character Quota Warning in Lobby */}
                {(() => {
                  const lic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
                  const hasAny = characterLicenseService.hasAnyPlayableCharacterSync(currentUser?.id);
                  if (!hasAny) {
                    return (
                      <div style={{
                        marginBottom: '16px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1.5px solid rgba(239, 68, 68, 0.6)',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lock size={16} color="#ef4444" />
                          <span>All 7 characters have reached their 10-match quota! Unlock a character to host or join matches.</span>
                        </div>
                        <button
                          onClick={() => setQuotaUnlockChar(selectedCharacter)}
                          style={{
                            padding: '6px 14px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}
                        >
                          UNLOCK ACCESS
                        </button>
                      </div>
                    );
                  }
                  if (!lic.canPlay) {
                    return (
                      <div style={{
                        marginBottom: '16px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        fontWeight: 'bold'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lock size={15} color="#ef4444" />
                          <span>Active Warrior ({lic.characterName}) is Locked (10/10 Used). Unlock or choose another warrior to host or join.</span>
                        </div>
                        <button
                          onClick={() => setQuotaUnlockChar(selectedCharacter)}
                          style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.72rem'
                          }}
                        >
                          UNLOCK
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 4. Three-Tab Lobby Navigation */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(251, 200, 13, 0.2)', paddingBottom: '8px' }}>
                  <button
                    onClick={() => { playClick(); setLobbyTab('browse'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'browse' ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'browse' ? 'rgba(251, 200, 13, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'browse' ? 'var(--neon-cyan)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
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
                      background: lobbyTab === 'create' ? 'rgba(251, 200, 13, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'create' ? 'var(--neon-cyan)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
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
                    onClick={() => { playClick(); setLobbyTab('tournaments'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'tournaments' ? '1.5px solid var(--neon-gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'tournaments' ? 'rgba(251, 200, 13, 0.2)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'tournaments' ? 'var(--neon-gold)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Trophy size={18} />
                    <span>TOURNAMENTS</span>
                  </button>

                  <button
                    onClick={() => { playClick(); setLobbyTab('join'); }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: lobbyTab === 'join' ? '1.5px solid var(--neon-gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: lobbyTab === 'join' ? 'rgba(251, 200, 13, 0.15)' : 'rgba(0,0,0,0.4)',
                      color: lobbyTab === 'join' ? 'var(--neon-gold)' : '#fff',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
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
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(251, 200, 13, 0.25)',
                      borderRadius: '16px',
                      padding: '20px'
                    }}
                  >
                    {/* ── Rejoin banner: only shown when a previous in-progress game is detected ── */}
                    {lastActiveMatchId && (
                      <div style={{
                        background: 'rgba(251,200,13,0.1)',
                        border: '1.5px solid rgba(251,200,13,0.5)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ color: '#FBC80D', fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.5px' }}>
                            ⚔️ GAME IN PROGRESS
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: '2px' }}>
                            Room <span style={{ color: '#FBC80D', fontWeight: 700, letterSpacing: '2px' }}>{lastActiveMatchId}</span> is still ongoing
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setMatchId(lastActiveMatchId);
                              handleJoinByCode(lastActiveMatchId);
                              setLastActiveMatchId(null);
                            }}
                            style={{
                              padding: '9px 18px',
                              background: 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)',
                              border: 'none', borderRadius: '8px',
                              color: '#000', fontWeight: 900,
                              fontFamily: 'Bebas Neue, sans-serif',
                              fontSize: '0.9rem', letterSpacing: '0.5px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            REJOIN NOW
                          </button>
                          <button
                            onClick={() => setLastActiveMatchId(null)}
                            style={{
                              padding: '9px 14px',
                              background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
                              cursor: 'pointer', fontSize: '0.8rem'
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
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
                              border: '1px solid rgba(251, 200, 13, 0.2)',
                              borderRadius: '12px',
                              padding: '14px 18px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div
                                style={{
                                  background: 'rgba(251, 200, 13, 0.1)',
                                  border: '1px solid var(--neon-cyan)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '1.1rem',
                                  fontWeight: '900',
                                  fontFamily: 'Bebas Neue, sans-serif',
                                  color: 'var(--neon-cyan)',
                                  letterSpacing: '2px'
                                }}
                              >
                                {room.roomCode}
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                                  Host: {room.hostName || 'Player'}
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
                                  background: 'linear-gradient(90deg, #FBC80D 0%, #0077ff 100%)',
                                  border: 'none',
                                  color: '#000',
                                  padding: '8px 20px',
                                  borderRadius: '8px',
                                  fontWeight: 'bold',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 0 15px rgba(251, 200, 13, 0.4)'
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
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(251, 200, 13, 0.25)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}
                  >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--neon-cyan)' }}>
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
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(251, 200, 13, 0.3)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}
                  >
                    {/* ── Rejoin banner: only shown when a previous in-progress game is detected ── */}
                    {lastActiveMatchId && (
                      <div style={{
                        background: 'rgba(251,200,13,0.1)',
                        border: '1.5px solid rgba(251,200,13,0.5)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ color: '#FBC80D', fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.5px' }}>
                            ⚔️ GAME IN PROGRESS
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: '2px' }}>
                            Room <span style={{ color: '#FBC80D', fontWeight: 700, letterSpacing: '2px' }}>{lastActiveMatchId}</span> is still ongoing
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setMatchId(lastActiveMatchId);
                              handleJoinByCode(lastActiveMatchId);
                              setLastActiveMatchId(null);
                            }}
                            style={{
                              padding: '9px 18px',
                              background: 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)',
                              border: 'none', borderRadius: '8px',
                              color: '#000', fontWeight: 900,
                              fontFamily: 'Bebas Neue, sans-serif',
                              fontSize: '0.9rem', letterSpacing: '0.5px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            REJOIN NOW
                          </button>
                          <button
                            onClick={() => setLastActiveMatchId(null)}
                            style={{
                              padding: '9px 14px',
                              background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '8px', color: 'rgba(255,255,255,0.6)',
                              cursor: 'pointer', fontSize: '0.8rem'
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Bebas Neue, sans-serif', color: 'var(--neon-gold)' }}>
                      JOIN PRIVATE ROOM
                    </h3>
                    <p style={{ margin: '0 0 18px 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>
                      Enter the 6-character Match Room code shared by your friend or tournament host.
                    </p>

                    <input
                      type="text"
                      placeholder="ENTER 6-CHARACTER CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
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
                      onClick={() => handleJoinByCode(joinCodeInput)}
                      disabled={!joinCodeInput || joinCodeInput.length < 4}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: joinCodeInput && joinCodeInput.length >= 4 ? 'pointer' : 'not-allowed',
                        background:
                          joinCodeInput && joinCodeInput.length >= 4
                            ? 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)'
                            : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: joinCodeInput && joinCodeInput.length >= 4 ? '#000' : 'rgba(255,255,255,0.4)',
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

                {/* TAB 4: TOURNAMENTS */}
                {lobbyTab === 'tournaments' && (
                  <div style={{ marginTop: '10px' }}>
                    {activeTournamentId ? (
                      <KontrolaBracketView
                        tournamentId={activeTournamentId}
                        currentUser={currentUser}
                        userProfile={userProfile}
                        onLaunchMatch={handleLaunchTournamentMatch}
                        onBack={() => setActiveTournamentId(null)}
                      />
                    ) : (
                      <KontrolaTournamentHub
                        currentUser={currentUser}
                        userProfile={userProfile}
                        adminSettings={appSettings}
                        onSelectTournament={(tId) => setActiveTournamentId(tId)}
                      />
                    )}
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
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--neon-cyan)',
                  borderRadius: '20px',
                  padding: '28px 32px',
                  textAlign: 'center',
                  boxShadow: '0 0 35px rgba(251, 200, 13, 0.25)'
                }}
              >
                {tournamentMatchContext && (
                  <div style={{ background: 'rgba(251, 200, 13, 0.15)', border: '1px solid var(--neon-gold)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: 'var(--neon-gold)', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Trophy size={18} />
                    <span>{tournamentMatchContext.tournamentTitle || 'TOURNAMENT MATCH'} • ROUND {tournamentMatchContext.round} (Best of {tournamentMatchContext.seriesFormat === 'bo5' ? 5 : tournamentMatchContext.seriesFormat === 'bo3' ? 3 : 1})</span>
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '6px' }}>
                  MATCH CODE (SHARE WITH OPPONENTS)
                </div>
                <div
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: '900',
                    color: 'var(--neon-cyan)',
                    letterSpacing: '8px',
                    fontFamily: 'Bebas Neue, sans-serif',
                    textShadow: '0 0 20px rgba(251, 200, 13, 0.6)',
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
                      borderBottom: '1px solid rgba(251, 200, 13, 0.2)',
                      paddingBottom: '8px',
                      marginBottom: '12px'
                    }}
                  >
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>PLAYERS IN LOBBY</strong>
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
                            background: isMe ? 'rgba(251, 200, 13, 0.12)' : 'rgba(0, 0, 0, 0.45)',
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
                                overflow: 'visible',
                                border: `2px solid ${charData.themeColor}`,
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img
                                src={getAssetUrl(charData.image)}
                                alt={charData.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
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
                                {gameState.characterStates?.[pId]?.level || 1}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>
                                {gameState.playerNames?.[pId] || charData.name} {isMe ? '(You)' : ''}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                                Character: {charData.name} � {charData.element}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isRoomHost && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(251, 200, 13, 0.15)',
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
                            {isHostRef.current && pId !== playerId && (
                              <button
                                onClick={() => enqueueHostAction({ actionType: 'PLAYER_LEAVE', playerId: pId })}
                                style={{
                                  background: 'rgba(255, 0, 50, 0.2)',
                                  border: '1px solid rgba(255, 0, 50, 0.8)',
                                  color: '#ff2a55',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Kick Player"
                              >
                                <X size={13} /> KICK
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isHost ? (() => {
                  const hostLic = characterLicenseService.getLicenseSync(currentUser?.id, selectedCharacter);
                  const isHostCharLocked = !hostLic.canPlay;
                  return (
                    <button
                      onClick={isHostCharLocked ? () => setQuotaUnlockChar(selectedCharacter) : handleStartGame}
                      disabled={!isHostCharLocked && gameState.players?.length < 2}
                      className="btn-end-turn-cta flashing-end-turn-cta"
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '14px',
                        fontSize: '1.3rem',
                        justifyContent: 'center',
                        cursor: (isHostCharLocked || gameState.players?.length >= 2) ? 'pointer' : 'not-allowed',
                        opacity: (isHostCharLocked || gameState.players?.length >= 2) ? 1 : 0.5,
                        background: isHostCharLocked ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : undefined,
                        boxShadow: isHostCharLocked ? '0 0 25px rgba(239, 68, 68, 0.6)' : undefined,
                        border: isHostCharLocked ? '1.5px solid #f87171' : undefined
                      }}
                    >
                      {isHostCharLocked ? <Lock size={24} /> : <Swords size={24} />}
                      <span>
                        {isHostCharLocked
                          ? `WARRIOR LOCKED (${hostLic.characterName.toUpperCase()}) - UNLOCK TO BATTLE`
                          : gameState.players?.length >= 2
                          ? 'COMMENCE BATTLE (LOCK ROOM)'
                          : 'WAITING FOR PLAYERS (MIN 2)...'}
                      </span>
                    </button>
                  );
                })() : (
                  <div
                    style={{
                      color: 'var(--neon-gold)',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      padding: '12px',
                      background: 'rgba(251, 200, 13, 0.08)',
                      borderRadius: '10px',
                      border: '1px solid rgba(251, 200, 13, 0.2)'
                    }}
                  >
                    ? Waiting for Room Host to commence battle...
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
          {/* Floating Damage / Heal Number Popups */}
          {damagePopups.map((popup) => (
            <div
              key={popup.id}
              className={`damage-number-pop${popup.isHeal ? ' heal' : ''}`}
              style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
            >
              {popup.value}
            </div>
          ))}

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
                  ? 'linear-gradient(90deg, #FBC80D 0%, #0077ff 100%)'
                  : 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)',
                color: '#000',
                fontWeight: '900',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(251, 200, 13, 0.4)',
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

          {/* Chat & Taunt Toasts Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none'
          }}>
            {chatToasts.map(toast => (
               <div key={toast.toastId} style={{
                 background: toast.type === 'TAUNT' ? 'linear-gradient(90deg, #ff2a55 0%, #880022 100%)' : 'rgba(10, 20, 35, 0.9)',
                 border: toast.type === 'TAUNT' ? '2px solid #ff8899' : '1px solid rgba(251, 200, 13, 0.4)',
                 borderRadius: '12px',
                 padding: '10px 15px',
                 color: '#fff',
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '4px',
                 boxShadow: '0 5px 15px rgba(0,0,0,0.6)',
                 animation: 'slideInLeft 0.3s ease-out, fadeOut 0.3s ease-in 4.2s forwards'
               }}>
                 <span style={{ fontSize: '0.75rem', color: toast.type === 'TAUNT' ? '#FBC80D' : '#FBC80D', fontWeight: 'bold' }}>
                   {toast.type === 'TAUNT' ? '??? TAUNT' : '?? MSG'} � {toast.senderName}
                 </span>
                 <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                   {toast.text.replace('??? [TAUNT]: "', '').replace('"', '')}
                 </span>
               </div>
            ))}
          </div>
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
                      setTournamentMatchContext(null);
                      // Clear session from DB + localStorage
                      sessionService.clearSession(matchId, playerId);
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

          {/* Detailed Scoreboard & Winner Modal */}
          {winner && (
            <div className="arena-modal-backdrop" style={{ zIndex: 999999 }}>
              <div
                className="arena-modal-card"
                style={{ border: '2px solid var(--neon-gold)', textAlign: 'center', padding: '32px', width: '100%', maxWidth: '500px' }}
              >
                <Trophy size={64} color="var(--neon-gold)" style={{ margin: '0 auto 16px auto' }} />
                <h1
                  style={{
                    color: 'var(--neon-gold)',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '2.4rem',
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase'
                  }}
                >
                  {winner.playerId === playerId ? 'VICTORY ACHIEVED!' : 'MATCH CONCLUDED'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', margin: '0 0 24px 0' }}>
                  <strong>{gameState?.playerNames?.[winner.playerId] || winner.name}</strong> emerged victorious in Kontrola!
                </p>

                {/* Match Economy Rewards Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(251, 200, 13, 0.15) 0%, rgba(0, 240, 255, 0.1) 100%)',
                  border: '1px solid rgba(251, 200, 13, 0.4)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>🪙</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: 'var(--neon-gold, #FBC80D)', fontWeight: 'bold', fontSize: '1.05rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.8px' }}>
                      {winner.playerId === playerId ? '+100 GOLD AWARDED FOR VICTORY' : '+40 GOLD AWARDED FOR PARTICIPATION'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {winner.playerId === playerId ? 'First daily victory also earns +200 bonus Gold!' : 'Keep battling to earn more Gold & unlock packs!'}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: 'var(--neon-cyan)', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>MATCH SCOREBOARD</h3>
                  {gameState?.players?.map((pid, idx) => {
                    const charState = gameState?.characterStates?.[pid];
                    const isWinner = pid === winner.playerId;
                    const pName = gameState?.playerNames?.[pid] || 'Anonymous';
                    const dmg = gameState?.stats?.damageDealt?.[pid] || 0;
                    const cards = gameState?.stats?.cardsPlayed?.[pid] || 0;
                    const turns = gameState?.stats?.turnsTaken?.[pid] || 0;
                    return (
                      <div key={pid} style={{ background: isWinner ? 'rgba(251, 200, 13, 0.15)' : 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', marginBottom: '8px', border: isWinner ? '1px solid var(--neon-gold)' : '1px solid transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: isWinner ? '#FBC80D' : '#fff' }}>{idx + 1}. {pName}</span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{charState?.name}</span>
                          </div>
                          <div style={{ fontWeight: 'bold', color: charState?.hp > 0 ? '#39ff14' : '#ff4444' }}>
                            {charState?.hp > 0 ? `${charState.hp} HP` : 'ELIMINATED'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                          <span>?? DMG: <strong style={{color: '#fff'}}>{dmg}</strong></span>
                          <span>?? Cards: <strong style={{color: '#fff'}}>{cards}</strong></span>
                          <span>? Turns: <strong style={{color: '#fff'}}>{turns}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {tournamentMatchContext ? (
                  <button
                    onClick={() => {
                      setGameState(null);
                      setMatchId('');
                      setWinner(null);
                      setTournamentMatchContext(null);
                      try { localStorage.removeItem('kontrola_current_match'); } catch(e) {}
                      setLobbyTab('tournaments');
                    }}
                    className="btn-enter-game-cta"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', justifyContent: 'center' }}
                  >
                    RETURN TO TOURNAMENT BRACKET
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          )}

          {/* TOP HUD BAR WITH PROMINENT TURN STATUS */}
          <header className="arena-top-hud">
            <div className="hud-title-group">
              <span className="hud-sparkle">?</span>
              <div className="hud-brand-title">
                <strong>ATTENTION ?? TCG</strong>
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
                  ? 'rgba(251, 200, 13, 0.12)'
                  : isMyTurn
                  ? 'rgba(57, 255, 20, 0.15)'
                  : 'rgba(237, 30, 36, 0.12)',
                border: isSpectator
                  ? '1.5px solid var(--neon-cyan)'
                  : isMyTurn
                  ? '2px solid #39ff14'
                  : '1.5px solid rgba(237, 30, 36, 0.4)',
                boxShadow: isMyTurn ? '0 0 20px rgba(57, 255, 20, 0.4)' : 'none'
              }}
            >
              {isSpectator ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                  <Eye size={18} />
                  <span>SPECTATING � {activeTurnPlayerName}'S TURN</span>
                </div>
              ) : isMyTurn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#39ff14', fontWeight: 'bold' }}>
                  <Zap size={18} fill="#39ff14" />
                  <span style={{ fontSize: '0.95rem', letterSpacing: '1px' }}>? YOUR TURN TO STRIKE!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b8f', fontWeight: 'bold' }}>
                  <Clock size={16} />
                  <span>WAITING FOR {activeTurnPlayerName.toUpperCase()}...</span>
                </div>
              )}

              {/* Turn & Round Details */}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                T{turnNum} � R{roundNum}
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
                  fontFamily: 'Bebas Neue, sans-serif'
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
                    background: 'rgba(237, 30, 36, 0.2)',
                    border: '1px solid var(--neon-crimson)',
                    color: '#ff6b8f',
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
                onClick={() => setIsLeaderboardOpen(true)}
                style={{ borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}
                title="View Match Rankings"
              >
                <Trophy size={16} />
                <span>RANK</span>
              </button>
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

          <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />

          {/* Floating Arena Taunt Toast Banner */}
          {activeTauntBubble && (
            <div
              style={{
                position: 'fixed',
                top: '90px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.98))',
                border: '3px solid #FBC80D',
                borderRadius: '40px',
                padding: '16px 36px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 40px rgba(251, 200, 13, 0.6)',
                pointerEvents: 'none',
                animation: 'tauntPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
              }}
            >
              <span style={{ fontSize: '2.2rem', animation: 'wiggle 2s ease-in-out infinite' }}>???</span>
              <span style={{ color: '#FBC80D', fontWeight: 'bold', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {activeTauntBubble.senderName}:
              </span>
              <span style={{ color: '#fff', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: '900', textShadow: '0 0 10px rgba(255,255,255,0.4)' }}>
                "{activeTauntBubble.text}"
              </span>
            </div>
          )}

          {/* 3-COLUMN ARENA STAGE GRID */}
          <div className="arena-stage-grid">
            {/* Left Column: Scoreboard & Player Standings */}
            <aside className="arena-col-left">
              <div className="arena-panel scoreboard-panel">
                <div className="panel-title-bar">
                  <span className="panel-kicker">PLAYERS SCOREBOARD</span>
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
                            ??? {activeTauntBubble.text}
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
                            overflow: 'visible',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={getAssetUrl(pChar.image)}
                            alt={pChar.name}
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
                            {pChar.level || 1}
                          </div>
                        </div>

                        <div className="arena-score-meta" style={{ flex: 1, minWidth: 0 }}>
                          <strong className="arena-player-name" style={{ color: isMe ? 'var(--neon-cyan)' : '#fff' }}>
                            {pChar.name} {isMe ? '(You)' : ''}
                          </strong>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                            <span>? {pChar.energyTokens || 0} ET</span>
                            <span>?? {pChar.crystals || 0}/3</span>
                            {pChar.poisonCount > 0 && <span style={{ color: 'var(--neon-green)' }}>?? {pChar.poisonCount}</span>}
                            {typeof pChar.burnCount === 'number' && pChar.burnCount > 0 && <span style={{ color: '#ff4d00' }}>?? {pChar.burnCount}</span>}
                            {typeof pChar.vampireStealTurnsLeft === 'number' && pChar.vampireStealTurnsLeft > 0 && <span style={{ color: '#ff2a6d' }}>🦹 {pChar.vampireStealTurnsLeft}t</span>}
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
                  {typeof myCharacter?.burnCount === 'number' && myCharacter.burnCount > 0 && (
                    <div className="effect-chip effect-poison" style={{ borderColor: 'rgba(255, 77, 0, 0.4)', background: 'rgba(255, 77, 0, 0.08)' }}>
                      <span style={{ fontSize: '15px' }}>??</span>
                      <span className="effect-name" style={{ color: '#ff4d00' }}>Burn</span>
                      <span className="effect-count" style={{ color: '#ff4d00' }}>{myCharacter.burnCount}</span>
                    </div>
                  )}
                  {typeof myCharacter?.vampireStealTurnsLeft === 'number' && myCharacter.vampireStealTurnsLeft > 0 && (
                    <div className="effect-chip effect-poison" style={{ borderColor: 'rgba(255, 42, 109, 0.5)', background: 'rgba(255, 42, 109, 0.12)' }}>
                      <span style={{ fontSize: '15px' }}>🦹</span>
                      <span className="effect-name" style={{ color: '#ff2a6d' }}>Vampire</span>
                      <span className="effect-count" style={{ color: '#ff2a6d' }}>{myCharacter.vampireStealTurnsLeft}t (-10HP)</span>
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
              className="arena-col-center phase2-restructure"
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}
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
                        overflow: 'visible',
                        border: `2.5px solid ${activeTurnChar.themeColor || 'var(--neon-cyan)'}`,
                        boxShadow: `0 0 20px ${activeTurnChar.themeColor || 'var(--neon-cyan)'}`,
                        marginBottom: '10px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={getAssetUrl(activeTurnChar.image)}
                        alt={activeTurnChar.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                      {/* Level Badge - Active Turn Character */}
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#000',
                        border: '2px solid rgba(0,0,0,0.8)',
                        boxShadow: '0 0 12px rgba(255, 215, 0, 0.8)',
                        zIndex: 15
                      }}>
                        {activeTurnChar.level || 1}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: '900',
                      color: isMyTurn ? '#39ff14' : 'var(--neon-cyan)',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px'
                    }}
                  >
                    {isSpectator
                      ? `SPECTATING � ${activeTurnPlayerName.toUpperCase()}`
                      : isMyTurn
                      ? '? YOUR TURN TO STRIKE!'
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

              {/* Phase 2: Action Cards UNO Fan */}
              {!isSpectator && myHand.length > 0 && (
                <div className="action-cards-fan-container" style={{ opacity: (!isMyTurn || isPendingSecondAttack) ? 0.6 : 1 }}>
                  {myHand.map((card, index) => {
                    const mid = Math.floor(myHand.length / 2);
                    const rotation = (index - mid) * 4; 
                    const yOffset = Math.abs(index - mid) * 2; 
                    const cName = getSafeCardName(card);
                    const cType = getSafeCardType(card);
                    const cId = getSafeCardId(card, index);
                    const cCost = getSafeCardCost(card);
                    const isSelected = selectedActionCard && (
                      (selectedActionCard.id && selectedActionCard.id === cId) ||
                      getSafeCardName(selectedActionCard) === cName
                    );
                    const cardArt = getCardGraphicUrl(cName, myCharacter?.id);
                    const cardObj = typeof card === 'object' ? card : { id: cId, name: cName, type: cType, costET: cCost };
                    
                    // Level Lock Verification (Feedback Lines 6 & 15, AI Breakdowns Lines 346-356)
                    const pLevel = myCharacter?.level || 1;
                    const upperCardName = cName.toUpperCase();
                    const isV20Locked = upperCardName.includes('VITALITY') && upperCardName.includes('V20') && pLevel < 2;
                    const isV30Locked = upperCardName.includes('VITALITY') && upperCardName.includes('V30') && pLevel < 3;
                    const isV40Locked = upperCardName.includes('VITALITY') && upperCardName.includes('V40') && pLevel < 4;
                    const is3PlayerLocked = (upperCardName.includes('BACK STAB') || upperCardName.includes('SOUL ALLIANCE') || upperCardName.includes('ABANDON') || upperCardName.includes('MISDIRECT')) && (gameState?.players?.length || 2) <= 2;
                    const isReviveLocked = upperCardName.includes('REVIVE') && (myCharacter?.hp || 0) > 0;
                    const isCardLocked = isV20Locked || isV30Locked || isV40Locked || is3PlayerLocked || isReviveLocked;
                    const reqLvl = isV20Locked ? 2 : isV30Locked ? 3 : isV40Locked ? 4 : null;
                    
                    return (
                      <div 
                        key={cId} 
                        className={`uno-action-card ${isSelected ? 'selected' : ''} ${isCardLocked ? 'locked-level-card' : ''}`}
                        style={{
                          transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
                          zIndex: isSelected ? 100 : index,
                          marginLeft: index === 0 ? '0' : '-25px',
                          opacity: isCardLocked ? (is3PlayerLocked ? 0.45 : 0.55) : 1,
                          position: 'relative',
                          filter: isCardLocked ? 'grayscale(0.4)' : 'none'
                        }}
                        onClick={() => {
                          if (isMyTurn && !isPendingSecondAttack) {
                            playClick();
                            setSelectedActionCard(cardObj);
                            if (isCardLocked) {
                              if (isReviveLocked) {
                                showNotice('🔒 REVIVE can only be used when your character reaches 0 HP! (You can still discard & draw)', 'info');
                              } else if (is3PlayerLocked) {
                                if (upperCardName.includes('MISDIRECT')) {
                                  showNotice('⚠️ Valid only with more than two players! Requires 3+ players. (You can still discard & draw)', 'info');
                                } else {
                                  showNotice('⚠️ Requires 3+ players to attack! (You can still discard & draw)', 'info');
                                }                              } else {
                                showNotice(`🔒 Requires Level ${reqLvl} to play! (Reach Level ${reqLvl} first. You can still discard & draw)`, 'info');
                              }
                            }
                          }
                        }}
                      >
                        {isCardLocked && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0, 0, 0, 0.85)',
                            border: '1px solid #FF4444',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.8)'
                          }}>
                            <span style={{ fontSize: '11px' }}>{isReviveLocked ? '💀' : (is3PlayerLocked ? '👥' : '🔒')}</span>
                            <span style={{ fontSize: '10px', color: '#FF7777', fontWeight: 'bold' }}>{isReviveLocked ? '0 HP ONLY' : (is3PlayerLocked ? ('3+ PLY') : `LVL ${reqLvl}`)}</span>
                          </div>
                        )}
                        <CardVFXWrapper
                          cardName={cName}
                          isSelected={isSelected}
                          isDissolving={dissolvingCardId === (cardObj.instanceId || cardObj.id || cName) || dissolvingCardId === cName}
                        >
                          <div className="uno-card-art">
                            <img src={cardArt} alt={cName} loading="eager" decoding="async" />
                          </div>
                          <div className="uno-card-info">
                            <div className="uno-card-title">{cName}</div>
                            <div className="uno-card-meta">
                              <span>{cType}</span>
                              <span>⚡ {cCost}</span>
                            </div>
                          </div>
                        </CardVFXWrapper>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>

            {/* Right Column: Active Profile and Combat Actions */}
            <aside className="arena-col-right phase2-restructure">
              {/* Phase 2: Active Character Profile */}
              {myCharacter && !isSpectator && (
                <div className="phase2-active-profile">
                  <div className="phase2-profile-avatar" style={{ borderColor: myCharacter.themeColor || 'var(--neon-cyan)', position: 'relative' }}>
                    <img src={getAssetUrl(myCharacter.image)} alt={myCharacter.name} />
                    {/* Level Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: '#000',
                      border: '2px solid rgba(0,0,0,0.8)',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.7)',
                      zIndex: 10
                    }}>
                      {myCharacter.level || 1}
                    </div>
                  </div>
                  <div className="phase2-profile-stats">
                    <div className="phase2-profile-name">{myCharacter.name} (You)</div>
                    <div className="phase2-profile-metrics">
                      <span style={{ color: 'var(--neon-crimson)' }}>?? {myCharacter.hp}</span>
                      <span style={{ color: 'var(--neon-gold)' }}>? {myCharacter.energyTokens || 0}</span>
                      <span style={{ color: 'var(--neon-cyan)' }}>??? {myCharacter.shield || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Target & Move Selection Panel */}
              {selectedActionCard && !isSpectator && (
                ((selectedActionCard.type === 'ATTACK' || getSafeCardName(selectedActionCard).toUpperCase().includes('BACK STAB')) && !['BOOMERANG'].some(kw => getSafeCardName(selectedActionCard).toUpperCase().includes(kw))) ||
                ['POISON', 'SLEEPY', 'FREEZE', 'X-CHANGE', 'KONTROL', 'SOUL ALLIANCE', 'DRAIN', 'VAMPIRE'].some(kw => getSafeCardName(selectedActionCard).toUpperCase().includes(kw)) ||
                (getSafeCardName(selectedActionCard).toUpperCase().includes('VISION') && !getSafeCardName(selectedActionCard).toUpperCase().includes('FULL'))
              ) && (
                <div className="arena-panel" style={{ background: 'rgba(20, 10, 20, 0.95)', border: '1.5px solid var(--neon-crimson)', padding: '12px' }}>
                  {/* Staged Card Visual Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', background: 'rgba(0,0,0,0.5)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <CardVFXWrapper
                      cardName={getSafeCardName(selectedActionCard)}
                      isSelected={true}
                      style={{
                        width: '38px',
                        height: '54px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={getCardGraphicUrl(getSafeCardName(selectedActionCard))}
                        alt={getSafeCardName(selectedActionCard)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </CardVFXWrapper>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--neon-gold)', textTransform: 'uppercase' }}>
                        {getSafeCardName(selectedActionCard)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                        Action Staged  Choose target opponent below
                      </div>
                    </div>
                  </div>

                  <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                    <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>1. SELECT TARGET</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {(getSafeCardName(selectedActionCard).toUpperCase().includes('POISON') ? [...opponents, playerId] : opponents).map((oId) => {
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
                            background: isSelectedTarget ? 'rgba(237, 30, 36, 0.3)' : 'rgba(0, 0, 0, 0.55)',
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

                  {(selectedActionCard?.type === 'ATTACK' || getSafeCardName(selectedActionCard).toUpperCase().includes('BACK STAB')) && !['LIGHTNING', 'FIRE FLAME', 'VAMPIRE', 'DRAIN', 'BACK STAB', 'BOOMERANG', 'MISDIRECT', 'BLITZ'].some(kw => getSafeCardName(selectedActionCard).toUpperCase().includes(kw)) && (
                    <>
                      <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                        <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>2. SELECT CHARACTER MOVE</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {Object.entries(myCharacter.attacks || {}).map(([atkName, atkData]) => {
                          const isSelectedAtk = selectedCharacterAttack === atkName;
                          const atkUpper = atkName.toUpperCase();
                          const isBlitzMove = atkUpper.includes('BLITZ');
                          const isKontrolMove = atkUpper.includes('KONTROL');

                          const hasBlitzInHand = myHand.some(c => getSafeCardName(c).toUpperCase().includes('BLITZ'));
                          const isBlitzHpEligible = (myCharacter?.hp || 0) <= 50;
                          const isBlitzLocked = isBlitzMove && (!hasBlitzInHand || !isBlitzHpEligible);

                          const hasKontrolInHand = myHand.some(c => getSafeCardName(c).toUpperCase().includes('KONTROL'));
                          const isKontrolLocked = isKontrolMove && !hasKontrolInHand;

                          const isMoveLocked = isBlitzLocked || isKontrolLocked;
                          return (
                            <button
                              key={atkName}
                              disabled={isMoveLocked}
                              onClick={() => {
                                playClick();
                                if (isMoveLocked) {
                                  if (isBlitzLocked) {
                                    showNotice(!hasBlitzInHand ? '🔒 SAIGO NO BLITZ requires having the Blitz card in hand!' : '🔒 SAIGO NO BLITZ requires HP ≤ 50!', 'warning');
                                  } else {
                                    showNotice('🔒 KONTROL requires having the Kontrol card in hand!', 'warning');
                                  }
                                  return;
                                }
                                setSelectedCharacterAttack(atkName);
                              }}
                              style={{
                                background: isSelectedAtk ? 'rgba(237, 30, 36, 0.25)' : (isMoveLocked ? 'rgba(0,0,0,0.2)' : 'rgba(0, 0, 0, 0.45)'),
                                border: isSelectedAtk ? '1.5px solid var(--neon-crimson)' : (isMoveLocked ? '1px dashed rgba(255, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'),
                                color: isSelectedAtk ? 'var(--neon-crimson)' : (isMoveLocked ? '#888' : '#fff'),
                                borderRadius: '8px',
                                padding: '8px 10px',
                                cursor: isMoveLocked ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                textAlign: 'left',
                                opacity: isMoveLocked ? 0.5 : 1
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{atkName}</div>
                                <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>{atkData.desc}</div>
                              </div>
                              {isMoveLocked ? (
                                <span style={{ color: '#FF4444', fontSize: '0.68rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Lock size={11} /> {isBlitzLocked ? (!hasBlitzInHand ? 'CARD REQ' : 'HP ≤ 50') : 'CARD REQ'}
                                </span>
                              ) : (
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{atkData.ap} AP</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Bottom Right Actions (Moved from footer to prevent UI collision) */}
              <div className="bottom-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {isSpectator ? (
                  <div
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      background: 'rgba(251, 200, 13, 0.1)',
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
                    {isMyTurn && (
                      <button
                        className="btn-discard-turn"
                        onClick={handleDiscardActionCardTurn}
                        disabled={!selectedActionCard}
                        style={{
                          background: selectedActionCard ? 'rgba(251, 200, 13, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: selectedActionCard ? '1.5px solid var(--neon-gold)' : '1.5px solid rgba(255, 255, 255, 0.15)',
                          color: selectedActionCard ? 'var(--neon-gold)' : 'rgba(255, 255, 255, 0.3)',
                          padding: '12px 18px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: selectedActionCard ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          letterSpacing: '0.5px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Discard selected card in hand & pick one from Action Deck (counts as your only move for this turn)"
                      >
                        <Trash2 size={16} />
                        <span>DISCARD & DRAW (TURN MOVE)</span>
                      </button>
                    )}
                    {(() => {
                      const selCardUpper = getSafeCardName(selectedActionCard).toUpperCase();
                      const isV20Blocked = selCardUpper.includes('V20') && (myCharacter?.level || 1) < 2;
                      const isV30Blocked = selCardUpper.includes('V30') && (myCharacter?.level || 1) < 3;
                      const isV40Blocked = selCardUpper.includes('V40') && (myCharacter?.level || 1) < 4;
                      const is3PlayerBlocked = ['BACK STAB', 'SOUL ALLIANCE', 'ABANDON', 'MISDIRECT'].some(kw => selCardUpper.includes(kw)) && ((gameState?.players?.length) || 2) <= 2;
                      const isReviveBlocked = selCardUpper.includes('REVIVE') && (myCharacter?.hp || 0) > 0;
                      const isCtaCardLocked = isV20Blocked || isV30Blocked || isV40Blocked || is3PlayerBlocked || isReviveBlocked;

                      const selMoveUpper = (selectedCharacterAttack || '').toUpperCase();
                      const isSelBlitzLocked = selMoveUpper.includes('BLITZ') && (!myHand.some(c => getSafeCardName(c).toUpperCase().includes('BLITZ')) || (myCharacter?.hp || 0) > 50);
                      const isSelKontrolLocked = selMoveUpper.includes('KONTROL') && !myHand.some(c => getSafeCardName(c).toUpperCase().includes('KONTROL'));
                      const isSelMoveLocked = isSelBlitzLocked || isSelKontrolLocked;

                      const isCtaDisabled = !isMyTurn || !selectedActionCard || isCtaCardLocked || isSelMoveLocked || (
                        selectedActionCard.type === 'ATTACK' &&
                        !['BLITZ', 'LIGHTNING', 'FIRE FLAME', 'VAMPIRE', 'DRAIN', 'BACK STAB', 'BOOMERANG', 'MISDIRECT'].some(kw => selCardUpper.includes(kw)) &&
                        (!selectedCharacterAttack || !selectedTargetId)
                      ) || (selCardUpper.includes('BACK STAB') && !selectedTargetId) ||
                      (['POISON', 'SLEEPY', 'FREEZE', 'X-CHANGE', 'KONTROL', 'SOUL ALLIANCE', 'DRAIN', 'VAMPIRE', 'MISDIRECT', 'LIGHTNING', 'FIRE FLAME'].some(kw => selCardUpper.includes(kw)) && !selectedTargetId) ||
                      (selCardUpper.includes('VISION') && !selCardUpper.includes('FULL') && !selectedTargetId);

                      const buttonText = isReviveBlocked
                        ? '🔒 REVIVE ONLY AT 0 HP'
                        : isV20Blocked
                        ? '🔒 REQUIRES LEVEL 2'
                        : isV30Blocked
                        ? '🔒 REQUIRES LEVEL 3'
                        : isV40Blocked
                        ? '🔒 REQUIRES LEVEL 4'
                        : is3PlayerBlocked
                        ? ('🔒 REQUIRES 3+ PLAYERS')
                        : isSelMoveLocked
                        ? '🔒 MOVE LOCKED'
                        : selectedActionCard?.type === 'ATTACK'
                        ? 'ROLL COMBAT CLASH'
                        : 'PLAY ACTION CARD';

                      return (
                        <button
                          className={`btn-end-turn-cta ${isMyTurn && selectedActionCard && !isCtaDisabled ? 'flashing-end-turn-cta' : ''}`}
                          disabled={isCtaDisabled}
                          onClick={playTurn}
                          style={{
                            boxShadow: isMyTurn && selectedActionCard && !isCtaDisabled ? '0 0 20px #39ff14' : 'none',
                            border: isCtaCardLocked ? '1.5px solid rgba(255, 68, 68, 0.4)' : (isMyTurn && selectedActionCard && !isCtaDisabled ? '2px solid #39ff14' : '2px solid rgba(255,255,255,0.1)'),
                            background: isCtaCardLocked ? 'rgba(255, 68, 68, 0.08)' : (isMyTurn && selectedActionCard && !isCtaDisabled ? 'rgba(57, 255, 20, 0.15)' : 'rgba(0,0,0,0.5)'),
                            color: isCtaCardLocked ? '#ff6666' : (isMyTurn && selectedActionCard && !isCtaDisabled ? '#39ff14' : 'rgba(255,255,255,0.3)'),
                            padding: '12px 28px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: isMyTurn && selectedActionCard && !isCtaDisabled ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          <Dices size={18} />
                          <span>{buttonText}</span>
                        </button>
                      );
                    })()}
                  </>
                )}
              </div>
            </aside>
          </div>

          {/* Bottom Controls Bar */}
          <footer className="arena-bottom-controls" style={{ justifyContent: 'flex-start', marginTop: '12px' }}>
            <div className="bottom-left-buttons">
              <button 
                className="btn-arena-chat" 
                onClick={() => { playClick(); setShowChat(true); setUnreadChatCount(0); }}
                style={{ position: 'relative' }}
              >
                <MessageSquare size={16} />
                <span>CHAT</span>
                {unreadChatCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--neon-crimson)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px var(--neon-crimson)',
                    animation: 'bounce 0.4s ease-out'
                  }}>
                    {unreadChatCount}
                  </div>
                )}
              </button>
              {!isSpectator && (
                <button
                  className="btn-arena-chat"
                  onClick={() => { playClick(); setShowTaunt(true); }}
                  style={{ borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}
                >
                  <span>???</span>
                  <span>TAUNT</span>
                </button>
              )}
              {!isSpectator && gameState?.alliances && gameState.alliances.length > 0 && (() => {
                const myAlliance = gameState.alliances.find(a => 
                  a.status === 'active' && (a.player1Id === playerId || a.player2Id === playerId)
                );
                if (!myAlliance) return null;
                const allyId = myAlliance.player1Id === playerId ? myAlliance.player2Id : myAlliance.player1Id;
                const allyName = myAlliance.player1Id === playerId ? myAlliance.player2Name : myAlliance.player1Name;
                return (
                  <button
                    className="btn-arena-chat"
                    onClick={() => {
                      playClick();
                      setSoulAllianceTradeData({ allyId, allyName });
                    }}
                    style={{ borderColor: '#9d4edd', color: '#9d4edd' }}
                    title="Trade REVIVE cards or Energy Tokens with your Soul Alliance partner"
                  >
                    <span>🤝</span>
                    <span>ALLIANCE TRADE</span>
                  </button>
                );
              })()}
            </div>

              {/* Action buttons moved to arena-col-right above */}

          </footer>

          {/* Chat Modal */}
          {showChat && (
            <KontrolaChatModal
              players={[{
                id: playerId,
                name: gameState.playerNames?.[playerId] || gameState.characterStates?.[playerId]?.name || playerName,
                characterId: selectedCharacterRef.current
              }]}
              activePlayerIndex={0}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onClose={() => setShowChat(false)}
            />
          )}

          {/* Taunt Modal */}
          {showTaunt && (
            <KontrolaTauntModal
              activePlayerName={myCharacter?.name || playerName || 'Player'}
              onClose={() => setShowTaunt(false)}
              onTaunt={handleSendTaunt}
            />
          )}

          {/* Secret Alliance Invite Modal */}
          {showSecretAllianceInviteModal && !tournamentMatchContext && (
            <SecretAllianceInviteModal
              isOpen={showSecretAllianceInviteModal}
              activePlayer={{ id: playerId, name: myCharacter?.name || playerName || 'Player' }}
              allPlayers={gameState?.players?.map(pid => ({
                id: pid,
                name: gameState?.playerNames?.[pid] || gameState?.characterStates?.[pid]?.name || 'Player',
                isDefeated: gameState?.characterStates?.[pid]?.isDefeated || false
              })) || []}
              onSendInvite={handleSendAllianceInvite}
              onCancel={() => setShowSecretAllianceInviteModal(false)}
              preselectedTargetId={preselectedAllianceTargetId}
            />
          )}

          {/* Alliance Chat Modal */}
          {showAllianceChatModal && activeAlliance && (
            <AllianceChatModal
              isOpen={showAllianceChatModal}
              player1={{ id: activeAlliance.player1Id, name: activeAlliance.player1Name }}
              player2={{ id: activeAlliance.player2Id, name: activeAlliance.player2Name }}
              currentPlayerId={playerId}
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

          {/* Pending Alliance Invite Notification */}
          {pendingAllianceInvite && playerId === pendingAllianceInvite.toPlayerId && (
            <div className="alliance-notification-overlay" style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 10000,
              background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.95) 0%, rgba(157, 78, 221, 0.85) 100%)',
              border: '2px solid #9d4edd',
              borderRadius: '10px',
              padding: '16px',
              minWidth: '300px',
              maxWidth: '350px',
              boxShadow: '0 0 30px rgba(157, 78, 221, 0.6)'
            }}>
              <div style={{ color: '#fff', marginBottom: '12px' }}>
                <strong>{pendingAllianceInvite.fromPlayerName}</strong> sent you a secret alliance invite!
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDeclineAllianceInvite}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptAllianceInvite}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#39ff14',
                    border: '1px solid #39ff14',
                    color: '#000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* Crystal Split Modal */}
          {showCrystalSplitModal && !tournamentMatchContext && crystalSplitData && (
            <CrystalSplitModal
              isOpen={showCrystalSplitModal}
              attackers={[crystalSplitData.attacker, ...(gameState?.players?.filter(p => p !== crystalSplitData.attacker.id && gameState?.characterStates?.[p]?.isDefeated === false) || []).map(pid => gameState?.characterStates?.[pid]) || []]}
              defeated={crystalSplitData.defender}
              onSplitComplete={handleCrystalSplitComplete}
              onClose={() => {
                setShowCrystalSplitModal(false);
                setCrystalSplitData(null);
              }}
            />
          )}

          {/* Interactive X-CHANGE Modal */}
          {xChangeModalData && (
            <XChangeModal
              isOpen={Boolean(xChangeModalData)}
              xChangeType={xChangeModalData.xChangeType || 'X1'}
              attackerHand={xChangeModalData.attackerHand || myHand}
              defenderHand={xChangeModalData.defenderHand || gameState?.hands?.[xChangeModalData.targetId] || []}
              defenderName={xChangeModalData.defenderName || gameState?.characterStates?.[xChangeModalData.targetId]?.name || 'Opponent'}
              onConfirm={handleConfirmXChange}
              onCancel={() => setXChangeModalData(null)}
              timeLimit={30}
            />
          )}

          {/* Soul Alliance Trade Modal */}
          {soulAllianceTradeData && (
            <SoulAllianceTradeModal
              isOpen={Boolean(soulAllianceTradeData)}
              playerName={myCharacter?.name || playerName || 'Player'}
              allyName={soulAllianceTradeData.allyName || 'Ally'}
              playerHand={myHand}
              playerEnergyTokens={myCharacter?.energyTokens || 0}
              onTrade={handleConfirmAllianceTrade}
              onCancel={() => setSoulAllianceTradeData(null)}
            />
          )}

          {/* REVIVE Prompt Modal */}
          {pendingRevivePrompt && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 11000,
              background: 'rgba(5, 10, 25, 0.92)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.98) 0%, rgba(10, 15, 35, 0.99) 100%)',
                border: '2px solid #39ff14',
                borderRadius: '16px',
                padding: '32px 36px',
                maxWidth: '460px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(57, 255, 20, 0.45)',
                fontFamily: 'Barlow Condensed, sans-serif',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✨</div>
                <h2 style={{
                  color: '#39ff14',
                  fontSize: '2rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1.5px',
                  margin: '0 0 8px 0',
                  textShadow: '0 0 20px rgba(57, 255, 20, 0.6)'
                }}>
                  QUIT OR BE REVIVED?
                </h2>
                <p style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  You have fallen in battle! Would you like to consume your <strong>REVIVE</strong> card to re-enter the game at <strong>50% HP ({Math.floor((pendingRevivePrompt.maxHp || 100) * 0.5)} HP)</strong>?
                </p>
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                  <button
                    onClick={handleDeclineRevive}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px'
                    }}
                  >
                    QUIT (ACCEPT DEFEAT)
                  </button>
                  <button
                    onClick={handleConfirmRevive}
                    style={{
                      background: '#39ff14',
                      border: 'none',
                      color: '#000',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: '900',
                      cursor: 'pointer',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px',
                      boxShadow: '0 0 25px rgba(57, 255, 20, 0.6)'
                    }}
                  >
                    BE REVIVED (50% HP)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BURN EXTINGUISH PROMPT MODAL */}
          {isMyTurn && myCharacter && myCharacter.burnCount > 0 && !myCharacter.isDefeated && !hasAttemptedExtinguishThisTurn && !pendingRevivePrompt && gameState?.status === 'active' && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 11000,
              background: 'rgba(25, 5, 0, 0.92)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(50, 15, 5, 0.98) 0%, rgba(25, 5, 0, 0.99) 100%)',
                border: '2px solid #ff4d00',
                borderRadius: '16px',
                padding: '32px 36px',
                maxWidth: '460px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(255, 77, 0, 0.55)',
                fontFamily: 'Barlow Condensed, sans-serif',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🔥</div>
                <h2 style={{
                  color: '#ff7700',
                  fontSize: '2.2rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1.5px',
                  margin: '0 0 8px 0',
                  textShadow: '0 0 20px rgba(255, 77, 0, 0.8)'
                }}>
                  WOULD YOU LIKE TO EXTINGUISH THE FLAME?
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  margin: '0 0 20px 0',
                  lineHeight: '1.4'
                }}>
                  You have <strong style={{ color: '#ff4d00' }}>{myCharacter.burnCount} Burn stack{myCharacter.burnCount > 1 ? 's' : ''}</strong>!
                  <br />
                  Extinguish requires rolling doubles on 2 dice.
                  <br />
                  <strong style={{ color: '#00f0ff' }}>Must roll doubles</strong> to extinguish. If you fail (or skip roll), you take <strong style={{ color: '#ff4d00' }}>-{(myCharacter.burnCount || 1) * 10} HP</strong> burn damage!
                </p>

                {extinguishDice && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    margin: '16px 0',
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#fff'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: '#1a1a2e',
                      border: '2px solid #ff4d00',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: '#ff7700'
                    }}>
                      {extinguishDice[0]}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>+</span>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: '#1a1a2e',
                      border: '2px solid #ff4d00',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: '#ff7700'
                    }}>
                      {extinguishDice[1]}
                    </div>
                  </div>
                )}

                {extinguishResult && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    margin: '12px 0',
                    fontSize: '1.15rem',
                    fontWeight: 'bold',
                    background: extinguishResult.success ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 60, 60, 0.15)',
                    border: extinguishResult.success ? '1px solid #00f0ff' : '1px solid #ff4444',
                    color: extinguishResult.success ? '#00f0ff' : '#ff6666'
                  }}>
                    {extinguishResult.success
                      ? `💧 DOUBLES! Rolled ${extinguishResult.d1} & ${extinguishResult.d2}! Fire extinguished (0 damage)!`
                      : `🔥 FAILED! Rolled ${extinguishResult.d1} & ${extinguishResult.d2}. Took -${extinguishResult.damage} HP Burn damage!`}
                  </div>
                )}

                {!extinguishResult && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={handleRollExtinguishFire}
                      disabled={isExtinguishRolling}
                      style={{
                        width: '100%',
                        background: isExtinguishRolling ? '#666' : 'linear-gradient(90deg, #ff4d00 0%, #ff8800 100%)',
                        border: 'none',
                        color: '#fff',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        fontSize: '1.2rem',
                        fontWeight: '900',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '1px',
                        cursor: isExtinguishRolling ? 'wait' : 'pointer',
                        boxShadow: '0 0 20px rgba(255, 77, 0, 0.6)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isExtinguishRolling ? '🎲 ROLLING DICE...' : '🎲 YES (ROLL DOUBLES)'}
                    </button>
                    <button
                      onClick={handleDeclineExtinguishFire}
                      disabled={isExtinguishRolling}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '1px',
                        cursor: isExtinguishRolling ? 'not-allowed' : 'pointer'
                      }}
                    >
                      NO (TAKE -{(myCharacter.burnCount || 1) * 10} HP & CONTINUE BURNING)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ROLL-OFF MODAL */}
          {(gameState?.status === 'roll_off' || gameState?.status === 'roll_off_complete') && (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse at center, rgba(15, 20, 35, 0.98) 0%, rgba(5, 8, 15, 0.99) 100%)', 
                zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              {/* Title � changes to TIEBREAKER when applicable */}
              {gameState.tiebreakPool ? (
                <>
                  <h2 style={{ color: '#ff2a55', fontSize: '2.8rem', marginBottom: '10px', textShadow: '0 0 20px #ff2a55' }}>?? TIE BREAKER ??</h2>
                  <p style={{ fontSize: '1.1rem', marginBottom: '40px', color: '#ff8899', background: 'rgba(255, 42, 85, 0.1)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255, 42, 85, 0.4)' }}>
                    {gameState.tiebreakPool.map(pId => gameState.playerNames?.[pId] || 'Player').join(' & ')} tied! Re-roll to decide who picks first.
                  </p>
                </>
              ) : (
                <>
                  <h2 style={{ color: 'var(--neon-gold)', fontSize: '2.8rem', marginBottom: '10px', textShadow: '0 0 20px var(--neon-gold)' }}>?? ROLL-OFF ??</h2>
                  <p style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#FBC80D', background: 'rgba(251, 200, 13, 0.1)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(251, 200, 13, 0.3)' }}>
                    All players must roll 2 dice to determine who picks their character first!
                  </p>
                </>
              )}
              
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '50px' }}>
                {[...gameState.players]
                  .sort((a, b) => {
                    if (gameState.status === 'roll_off_complete') {
                      return (gameState.rollOffs?.[b] || 0) - (gameState.rollOffs?.[a] || 0);
                    }
                    return 0;
                  })
                  .map((pId, idx) => {
                  const isTiebreakParticipant = !gameState.tiebreakPool || gameState.tiebreakPool.includes(pId);
                  const hasRolled = Boolean(gameState.rollOffs?.[pId]);
                  const isRolling = Boolean(rollingOffPlayers[pId]) && !hasRolled;
                  // Players sitting out a tiebreak are shown greyed-out with their previous roll
                  const isSittingOut = gameState.tiebreakPool && !gameState.tiebreakPool.includes(pId);
                  return (
                    <div key={pId} style={{ 
                      background: isSittingOut ? 'rgba(0,0,0,0.3)' : hasRolled ? 'rgba(57, 255, 20, 0.08)' : 'rgba(0,0,0,0.6)', 
                      padding: '25px 35px', 
                      borderRadius: '16px', 
                      border: isSittingOut ? '1px solid rgba(255,255,255,0.08)' : hasRolled ? '2px solid #39ff14' : '1px solid rgba(255,255,255,0.2)', 
                      minWidth: '180px', 
                      textAlign: 'center',
                      opacity: isSittingOut ? 0.45 : 1,
                      boxShadow: hasRolled && !isSittingOut ? '0 0 20px rgba(57, 255, 20, 0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ fontWeight: '900', fontSize: '1.2rem', marginBottom: '15px', color: pId === playerId ? 'var(--neon-cyan)' : '#fff', position: 'relative' }}>
                        {gameState.status === 'roll_off_complete' && (
                          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: idx === 0 ? 'var(--neon-gold)' : '#333', color: idx === 0 ? '#000' : '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '1rem', boxShadow: idx === 0 ? '0 0 10px var(--neon-gold)' : 'none' }}>
                            #{idx + 1}
                          </div>
                        )}
                        {gameState.playerNames?.[pId] || 'Player'}
                        {pId === playerId && ' (You)'}
                        {isSittingOut && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Sitting out</div>}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', minHeight: '60px', alignItems: 'center' }}>
                        {hasRolled ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                              <CanvasPipDie value={gameState.rollOffDice?.[pId]?.[0] || 1} theme="red" isRolling={false} size={55} />
                              <CanvasPipDie value={gameState.rollOffDice?.[pId]?.[1] || 1} theme="red" isRolling={false} size={55} />
                            </div>
                            <div style={{ fontSize: '1.2rem', color: isSittingOut ? 'rgba(255,255,255,0.4)' : '#39ff14', fontWeight: 'bold', textShadow: isSittingOut ? 'none' : '0 0 10px rgba(57, 255, 20, 0.4)' }}>
                              Total: {gameState.rollOffs[pId]}
                            </div>
                          </div>
                        ) : isRolling ? (
                          <>
                            <CanvasPipDie value={Math.floor(Math.random() * 6) + 1} theme="red" isRolling={true} size={55} />
                            <CanvasPipDie value={Math.floor(Math.random() * 6) + 1} theme="red" isRolling={true} size={55} />
                          </>
                        ) : (
                          <div style={{ fontSize: '2.5rem', color: 'rgba(255,255,255,0.2)' }}>?</div>
                        )}
                      </div>
                      
                      {hasRolled && !isSittingOut && <div style={{ marginTop: '10px', color: '#39ff14', fontSize: '0.9rem' }}>Roll Complete</div>}
                      {isRolling && <div style={{ marginTop: '10px', color: '#ff2a55', fontSize: '0.9rem', animation: 'pulse 0.5s infinite alternate' }}>Rolling...</div>}
                      {!hasRolled && !isRolling && isTiebreakParticipant && <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Waiting...</div>}
                    </div>
                  );
                })}
              </div>

              {/* Show roll button only if: not spectator, haven't rolled yet, AND either no tiebreak or you're in the tiebreak pool */}
              {!isSpectator && !gameState.rollOffs?.[playerId] && (!gameState.tiebreakPool || gameState.tiebreakPool.includes(playerId)) && (
                <button
                  onClick={handleRollOff}
                  disabled={Boolean(rollingOffPlayers[playerId]) || isProcessingAction}
                  style={{
                    background: gameState.tiebreakPool
                      ? 'linear-gradient(180deg, #ff2a55 0%, #a80022 100%)'
                      : 'linear-gradient(180deg, #ff2a55 0%, #a80022 100%)',
                    border: gameState.tiebreakPool ? '2px solid #ff8899' : '2px solid #ff8899',
                    borderRadius: '12px', padding: '18px 50px',
                    color: '#fff', fontSize: '1.5rem', fontWeight: '900', 
                    cursor: (rollingOffPlayers[playerId] || isProcessingAction) ? 'wait' : 'pointer',
                    boxShadow: '0 0 30px rgba(255, 42, 85, 0.6)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    letterSpacing: '1px', textTransform: 'uppercase'
                  }}
                >
                  <Dices size={28} />
                  {rollingOffPlayers[playerId] ? 'ROLLING DICE...' : gameState.tiebreakPool ? '🎲 RE-ROLL TO BREAK TIE' : 'ROLL 2 DICE'}
                </button>
              )}
              {/* Sitting-out players see a waiting message */}
              {!isSpectator && gameState.tiebreakPool && !gameState.tiebreakPool.includes(playerId) && (
                <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} /> Waiting for the tied players to re-roll...
                </div>
              )}
              {gameState.rollOffs?.[playerId] && (!gameState.tiebreakPool || !gameState.tiebreakPool.includes(playerId) || gameState.rollOffs?.[playerId]) && (
                <div style={{ fontSize: '1.3rem', color: '#39ff14', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', animation: 'pulse 1.5s infinite alternate' }}>
                  <CheckCircle2 size={24} /> Waiting for others to roll...
                </div>
              )}
            </div>
          )}

          {/* DEFENDER PREPARATION MODAL */}
          {gameState?.activeDefenseState && (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(10, 3, 3, 0.97)',
                zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                fontFamily: 'Barlow Condensed, sans-serif'
              }}
            >
              {/* Animated threat banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '14px',
                animation: 'pulse 1s ease-in-out infinite alternate'
              }}>
                <span style={{ fontSize: '2.2rem' }}>??</span>
                <h2 style={{
                  color: 'var(--neon-crimson)', fontSize: '2rem', margin: 0,
                  textShadow: '0 0 20px var(--neon-crimson), 0 0 40px rgba(255,30,30,0.4)',
                  letterSpacing: '0.08em'
                }}>INCOMING ATTACK</h2>
                <span style={{ fontSize: '2.2rem' }}>??</span>
              </div>

              {/* Incoming card pill */}
              {gameState.activeDefenseState.actionCard && (
                <div style={{
                  background: 'rgba(255, 40, 40, 0.12)',
                  border: '1.5px solid rgba(255, 80, 80, 0.5)',
                  borderRadius: '10px',
                  padding: '8px 22px',
                  marginBottom: '22px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>??</span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff', letterSpacing: '0.04em' }}>
                      {getSafeCardName(gameState.activeDefenseState.actionCard)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,160,160,0.8)', marginTop: '2px' }}>
                      {getSafeCardType(gameState.activeDefenseState.actionCard)} � Cost {getSafeCardCost(gameState.activeDefenseState.actionCard)} ET
                    </div>
                  </div>
                </div>
              )}

              {gameState.activeDefenseState.targetId === playerId ? (
                <>
                  <p style={{ fontSize: '1.15rem', marginBottom: '6px', textAlign: 'center' }}>
                    <strong style={{ color: 'var(--neon-gold)' }}>{gameState.activeDefenseState.attackerPlayerName}</strong>
                    {' '}is attacking <strong style={{ color: 'var(--neon-crimson)' }}>YOU</strong>!
                  </p>
                  {gameState.activeDefenseState.attackSelectionName && (
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,200,100,0.8)', marginBottom: '6px' }}>
                      Using move: <em>{gameState.activeDefenseState.attackSelectionName}</em>
                    </p>
                  )}
                  <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)', marginBottom: '22px' }}>
                    Play a Defense Card from your hand, or take the hit.
                  </p>

                  {/* Countdown */}
                  <div style={{
                    fontSize: '2.6rem', fontWeight: 'bold', marginBottom: '26px',
                    color: defenseSeconds <= 5 ? '#ff4444' : defenseSeconds <= 10 ? '#ffaa00' : '#ffffff',
                    textShadow: defenseSeconds <= 5 ? '0 0 20px #ff4444' : 'none',
                    transition: 'color 0.3s, text-shadow 0.3s',
                    letterSpacing: '0.05em'
                  }}>
                    {defenseSeconds}s
                  </div>

                  {/* Defense cards in hand */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '820px', marginBottom: '32px' }}>
                    {myHand.filter(c => ['SHIELD', 'BOOMERANG', 'DEFENCE', 'DODGE', '+DEFENCE'].some(kw => getSafeCardName(c).toUpperCase().includes(kw))).map((card, idx) => {
                      const cName = getSafeCardName(card);
                      const cType = getSafeCardType(card);
                      const cId = getSafeCardId(card, idx);
                      return (
                        <button
                          key={cId}
                          onClick={() => handleDefenseSelect(typeof card === 'object' ? card : { id: cId, name: cName, type: cType })}
                          style={{
                            background: 'rgba(0, 0, 0, 0.85)',
                            border: '2px solid #39ff14',
                            borderRadius: '10px',
                            padding: '12px 10px',
                            width: '130px',
                            cursor: 'pointer',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 0 18px rgba(57, 255, 20, 0.25)',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(57,255,20,0.5)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(57,255,20,0.25)'; }}
                        >
                          <div style={{ fontSize: '1.4rem' }}>
                            {cName.toUpperCase().includes('BOOMERANG') ? '🪃'
                              : cName.toUpperCase().includes('DODGE') ? '💨'
                              : cName.toUpperCase().includes('COUNTER') ? '⚡'
                              : '🛡️'}
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center', lineHeight: '1.2' }}>{cName}</div>
                          <div style={{
                            fontSize: '0.62rem', color: '#39ff14',
                            background: 'rgba(57,255,20,0.12)', borderRadius: '4px',
                            padding: '2px 6px'
                          }}>{cType}</div>
                        </button>
                      );
                    })}
                    {myHand.filter(c => ['SHIELD', 'BOOMERANG', 'DEFENCE', 'DODGE', '+DEFENCE'].some(kw => getSafeCardName(c).toUpperCase().includes(kw))).length === 0 && (
                      <div style={{
                        color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', padding: '20px 40px',
                        border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px'
                      }}>No defensive cards in hand.</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDefenseSelect(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '8px',
                      padding: '12px 36px',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'border-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                  >
                    ? SKIP � TAKE THE HIT
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
                    <strong style={{ color: 'var(--neon-gold)' }}>{gameState.activeDefenseState.attackerPlayerName}</strong>
                    {' '}is attacking{' '}
                    <strong style={{ color: '#FBC80D' }}>{gameState.activeDefenseState.defenderPlayerName}</strong>!
                  </p>
                  <p style={{ fontSize: '1.3rem', color: 'var(--neon-crimson)', fontWeight: 'bold' }}>
                    ? Waiting for {gameState.activeDefenseState.defenderPlayerName} to prepare defense...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ROLL OFF LEADERBOARD POPUP */}
          {gameState?.status === 'roll_off_leaderboard' && (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-card)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <h2 style={{ color: 'var(--neon-gold)', fontSize: '3rem', marginBottom: '30px', textShadow: '0 0 20px var(--neon-gold)' }}>
                ?? TURN ORDER LEADERBOARD ??
              </h2>
              <div style={{
                background: 'rgba(0,0,0,0.8)', border: '2px solid var(--neon-gold)', borderRadius: '16px',
                padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '400px',
                boxShadow: '0 0 40px rgba(251, 200, 13, 0.3)'
              }}>
                {[...gameState.players].sort((a,b) => (gameState.rollOffs?.[b] || 0) - (gameState.rollOffs?.[a] || 0)).map((pId, idx) => (
                  <div key={pId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                    borderLeft: idx === 0 ? '6px solid var(--neon-gold)' : '6px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ color: idx === 0 ? 'var(--neon-gold)' : '#fff', fontWeight: '900', fontSize: '1.5rem' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: pId === playerId ? 'var(--neon-cyan)' : '#fff' }}>
                        {gameState.playerNames?.[pId] || 'Player'} {pId === playerId && '(You)'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--neon-green)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      Roll: {gameState.rollOffs?.[pId]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MATCH COUNTDOWN OVERLAY */}
          {gameState?.status === 'match_countdown' && (
            <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)', zIndex: 99999,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}
            >
              <h1 style={{
                color: 'var(--neon-cyan)', fontSize: '8rem', margin: 0,
                textShadow: '0 0 50px var(--neon-cyan)', animation: 'pulse 1s infinite'
              }}>
                {countdownNumber > 0 ? countdownNumber : 'START!'}
              </h1>
              <p style={{ fontSize: '2rem', color: '#fff', marginTop: '20px' }}>The match is starting...</p>
            </div>
          )}

          {/* CHARACTER SELECT MODAL */}
          {gameState?.status === 'character_select' && (
             <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-card)', zIndex: 10000,
                display: 'flex', color: '#fff'
              }}
             >
                {/* LEFT DOCK - TURN ORDER LEADERBOARD */}
                <div style={{
                  width: '320px', background: 'rgba(0,0,0,0.8)', borderRight: '1px solid rgba(255,255,255,0.1)',
                  padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '15px'
                }}>
                  <h3 style={{ color: 'var(--neon-gold)', textShadow: '0 0 10px var(--neon-gold)', textAlign: 'center', marginBottom: '20px' }}>TURN ORDER</h3>
                  {[...gameState.players].sort((a,b) => (gameState.rollOffs?.[b] || 0) - (gameState.rollOffs?.[a] || 0)).map((pId, idx) => {
                    const charId = gameState.characterSelections?.[pId];
                    const charObj = charId ? KONTROLA_CHARACTERS[charId] : null;
                    return (
                      <div key={pId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                        borderLeft: gameState.turn === pId ? '4px solid var(--neon-cyan)' : '4px solid transparent',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--neon-gold)', fontWeight: 'bold' }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 'bold', color: gameState.turn === pId ? 'var(--neon-cyan)' : '#fff' }}>
                            {gameState.playerNames?.[pId] || 'Player'}
                          </span>
                        </div>
                        <div style={{
                          width: '45px', height: '45px', borderRadius: '50%', background: charObj ? 'transparent' : 'rgba(255,255,255,0.1)',
                          border: charObj ? `2px solid ${charObj.themeColor}` : '2px dashed rgba(255,255,255,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                        }}>
                          {charObj ? <img src={getAssetUrl(charObj.image)} alt="char" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>?</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* RIGHT SIDE - CHARACTER SELECTION GRID */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                  <h2 style={{ color: 'var(--neon-cyan)', fontSize: '2.5rem', marginBottom: '20px', textShadow: '0 0 20px var(--neon-cyan)' }}>? CHARACTER SELECTION ?</h2>
                  {isHost && (
                    <button
                      onClick={() => {
                        playClick();
                        enqueueHostAction({ actionType: 'START_MATCH' });
                      }}
                      style={{
                        background: 'linear-gradient(90deg, #FBC80D, #ff8800)',
                        border: 'none',
                        color: '#000',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 0 15px rgba(251, 200, 13, 0.5)'
                      }}
                    >
                      ⚡ START MATCH NOW
                    </button>
                  )}
                  
                  {gameState.turn === playerId ? (
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#fff' }}>
                      It's your turn to choose a character!
                    </p>
                  ) : (
                    <p style={{ fontSize: '1.5rem', color: 'var(--neon-cyan)', fontWeight: 'bold', marginBottom: '30px' }}>
                      Waiting for {gameState.playerNames?.[gameState.turn] || 'the next player'} to choose a character...
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '900px' }}>
                    {Object.values(KONTROLA_CHARACTERS).map((char) => {
                      const isTaken = gameState && Object.values(gameState.characterSelections || {}).includes(char.id);
                      let ownerName = null;
                      if (isTaken) {
                         const ownerId = Object.keys(gameState.characterSelections).find(id => gameState.characterSelections[id] === char.id);
                         ownerName = gameState.playerNames?.[ownerId] || 'Taken';
                      }

                      const lic = characterLicenseService.getLicenseSync(currentUser?.id, char.id);
                      const isLockedByQuota = !lic.canPlay;

                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            if (isLockedByQuota) {
                              playClick();
                              showNotice(`${char.name} has exhausted the 10-match free quota!`, 'warning');
                              setQuotaUnlockChar(char.id);
                              return;
                            }
                            if (gameState.turn !== playerId) return;
                            if (isTaken) {
                              showNotice(`${char.name} has already been chosen!`, 'warning');
                              return;
                            }
                            handleCharacterSelect(char.id);
                          }}
                          style={{
                            background: isLockedByQuota ? 'rgba(30, 5, 10, 0.65)' : isTaken ? 'rgba(30, 10, 20, 0.55)' : 'rgba(0, 0, 0, 0.45)',
                            border: isLockedByQuota ? '1.5px solid rgba(239, 68, 68, 0.6)' : isTaken ? '1px dashed rgba(255, 42, 85, 0.5)' : `2px solid ${char.themeColor || 'var(--neon-cyan)'}`,
                            borderRadius: '12px',
                            padding: '15px',
                            textAlign: 'center',
                            cursor: isLockedByQuota ? 'pointer' : (gameState.turn === playerId && !isTaken ? 'pointer' : 'not-allowed'),
                            opacity: isTaken ? 0.45 : (isLockedByQuota ? 0.8 : 1),
                            width: '140px',
                            transition: 'transform 0.2s',
                            position: 'relative'
                          }}
                        >
                          {isTaken && (
                            <div style={{ position: 'absolute', top: -10, right: -10, background: '#ff2a55', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 10 }}>
                              {ownerName}
                            </div>
                          )}
                          {isLockedByQuota && (
                            <div style={{ position: 'absolute', top: -10, left: -10, background: '#ef4444', color: '#fff', padding: '3px 7px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', zIndex: 10, display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                              <Lock size={10} /> 10/10
                            </div>
                          )}
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={getAssetUrl(char.image)} alt={char.name} style={{ width: '85px', height: '85px', borderRadius: '50%', border: `2px solid ${char.themeColor}`, filter: isLockedByQuota ? 'grayscale(0.5)' : 'none' }} />
                            {/* Level Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: 'linear-gradient(135deg, #FBC80D 0%, #FF7700 100%)',
                              width: '24px',
                              height: '24px',
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
                              1
                            </div>
                          </div>
                          <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{char.name}</div>
                          <div style={{ fontSize: '0.8rem', color: char.themeColor }}>{char.element}</div>
                          <div style={{ fontSize: '0.65rem', marginTop: '4px', fontWeight: 'bold' }}>
                            {lic.isUnlocked ? (
                              <span style={{ color: '#10b981' }}>👑 UNLIMITED</span>
                            ) : isLockedByQuota ? (
                              <span style={{ color: '#ef4444' }}>🔒 LOCKED</span>
                            ) : (
                              <span style={{ color: '#00f0ff' }}>⚡ {lic.usesRemaining}/10 Left</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
             </div>
          )}

          {/* MATCH COUNTDOWN MODAL */}
          {gameState?.status === 'match_countdown' && (
             <div
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-card)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}
             >
                <h1 style={{ 
                  fontSize: '8rem', 
                  color: 'var(--neon-gold)', 
                  textShadow: '0 0 30px var(--neon-gold)',
                  animation: 'zoomIn 0.5s ease-out'
                }}>
                  {countdownNumber > 0 ? countdownNumber : 'START!'}
                </h1>
                <p style={{ fontSize: '1.5rem', marginTop: '20px', color: 'var(--neon-cyan)' }}>
                  Prepare for battle...
                </p>
             </div>
          )}

          {/* VISION REVEAL MODAL */}
          {revealedVision && (revealedVision.actorId === playerId) && (
            <div
              style={{
                position: 'fixed',
                top: '80px',
                right: '32px',
                width: '420px',
                maxHeight: '80vh',
                background: 'rgba(10, 18, 36, 0.98)',
                border: '2px solid var(--neon-cyan)',
                borderRadius: '16px',
                padding: '16px',
                zIndex: 10000,
                boxShadow: '0 0 35px rgba(0, 240, 255, 0.45)',
                fontFamily: 'Barlow Condensed, sans-serif',
                animation: 'fadeIn 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.3)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <Eye size={22} />
                  <span>{revealedVision.isFull ? 'VISION FULL REVEAL' : 'VISION X1 REVEAL'} ({revealedVision.targetName})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--neon-gold)', fontWeight: 'bold', background: 'rgba(251, 200, 13, 0.15)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(251, 200, 13, 0.4)' }}>
                    {visionSecondsLeft ?? 15}s left
                  </div>
                  <button
                    onClick={() => setRevealedVision(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    title="Dismiss Vision"
                  >
                    ×
                  </button>
                </div>
              </div>

              {(!revealedVision.cards || revealedVision.cards.length === 0) ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '24px 0', fontSize: '0.95rem' }}>
                  Opponent has no Action Cards in hand!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '4px' }}>
                  {(Array.isArray(revealedVision?.cards) ? revealedVision.cards.filter(Boolean) : []).map((c, i) => {
                    const cardName = typeof c === 'string' ? c : (c?.name || 'Action Card');
                    const cardType = typeof c === 'object' ? (c?.type || 'ACTION') : 'ACTION';
                    const cardOwner = typeof c === 'object' ? c?.ownerName : null;
                    const cardImgUrl = getCardGraphicUrl(cardName);
                    return (
                      <div
                        key={i}
                        style={{
                          background: 'linear-gradient(135deg, rgba(20, 25, 45, 0.95) 0%, rgba(10, 15, 30, 0.95) 100%)',
                          border: '1.5px solid rgba(0, 240, 255, 0.25)',
                          borderRadius: '10px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {cardImgUrl && (
                          <div style={{ width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={cardImgUrl}
                              alt={cardName}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem', lineHeight: 1.2 }}>
                            {cardName}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.72rem' }}>
                            <span style={{ color: 'var(--neon-cyan)' }}>{cardType}</span>
                            {cardOwner && (
                              <span style={{ color: 'var(--neon-gold)', opacity: 0.9 }}>{cardOwner}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SYNCHRONIZED AUTHENTIC PIP DICE COMBAT CLASH MODAL */}
          {activeCombat && (
            <KontrolaDiceRoller
              combatData={activeCombat}
              precalculatedRolls={activeCombat.precalculatedRolls}
              isAttacker={activeCombat.attackerPlayerId === playerId}
              isDefender={
                activeCombat.defenderPlayerId === playerId || 
                (activeCombat.defenderPlayerId === 'ALL' && activeCombat.attackerPlayerId !== playerId)
              }
              isSpectator={activeCombat.attackerPlayerId !== playerId && activeCombat.defenderPlayerId !== playerId && activeCombat.defenderPlayerId !== 'ALL'}
              isHost={isHost}
              isExternallyRolling={isDiceRollingSync}
              onTriggerRoll={handleTriggerDiceRoll}
              onClose={async () => await handleCloseDiceScreen(false)}
              onForceClose={async () => await handleCloseDiceScreen(false)}
              onCombatComplete={async (finalRolls) => await handleCloseDiceScreen(true, finalRolls)}
              playerHand={myHand}
              onExecuteRetreat={handleExecuteRetreat}
            />
          )}

                  </div>
      </DynamicScaleWrapper>

      {/* Floating Music Player Widget (Positioned outside DynamicScaleWrapper for 1:1 true viewport tracking) */}
      {musicTracks.length > 0 && (
        <div
          onPointerDown={!isMusicPlayerOpen ? handleDragPointerDown : undefined}
          onClick={!isMusicPlayerOpen ? () => {
            if (!musicDragRef.current.hasMoved) {
              handleToggleMusicOpen();
            }
          } : undefined}
          style={{
            position: 'fixed',
            left: `${musicPlayerPos.x}px`,
            top: `${musicPlayerPos.y}px`,
            background: 'var(--bg-card)',
            border: '2px solid rgba(251, 200, 13, 0.6)',
            borderRadius: '16px',
            padding: isMusicPlayerOpen ? '16px' : '10px 16px',
            minWidth: isMusicPlayerOpen ? '320px' : 'auto',
            maxWidth: '350px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.85)',
            zIndex: 99999,
            backdropFilter: 'blur(12px)',
            transition: isDraggingMusic ? 'none' : 'box-shadow 0.2s ease',
            fontFamily: 'Bebas Neue, sans-serif',
            cursor: !isMusicPlayerOpen ? (isDraggingMusic ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
            touchAction: 'none'
          }}
          title={!isMusicPlayerOpen ? 'Click to open playlist • Drag to move' : undefined}
        >
          {/* Minimized Pill View */}
          {!isMusicPlayerOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBC80D' }}>
              <Music size={22} />
              <span style={{ fontWeight: 'bold', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                PLAYLIST
              </span>
              {isPlaying && (
                <span style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#39ff14',
                  boxShadow: '0 0 6px #39ff14'
                }} />
              )}
            </div>
          ) : (
            /* Expanded Player View */
            <>
              {/* Draggable Header */}
              <div
                onPointerDown={handleDragPointerDown}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  cursor: isDraggingMusic ? 'grabbing' : 'grab',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
                title="Drag header to move"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBC80D' }}>
                  <Music size={20} />
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                    MUSIC PLAYLIST
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>
                    (DRAG)
                  </span>
                </div>
                <button
                  className="no-drag"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMusicOpen();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(251,200,13,0.3)',
                    borderRadius: '6px',
                    color: '#FBC80D',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Minimize to pill"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Track info */}
              <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {musicTracks[currentTrackIndex]?.title || 'No Track'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  by {musicTracks[currentTrackIndex]?.username || 'Unknown'}
                </div>
              </div>

              {/* Playback controls */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <button
                  className="no-drag"
                  onClick={() => {
                    const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : musicTracks.length - 1;
                    setCurrentTrackIndex(newIndex);
                    setIsPlaying(true);
                  }}
                  style={{ background: 'rgba(251,200,13,0.2)', border: '1px solid rgba(251,200,13,0.4)', color: '#FBC80D', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Previous"
                >
                  <SkipForward size={18} style={{ transform: 'rotate(180deg)' }} />
                </button>

                <button
                  className="no-drag"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ background: 'linear-gradient(135deg, #FBC80D, #FFD700)', border: 'none', color: '#000', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(251,200,13,0.4)' }}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <button
                  className="no-drag"
                  onClick={() => {
                    const newIndex = currentTrackIndex < musicTracks.length - 1 ? currentTrackIndex + 1 : 0;
                    setCurrentTrackIndex(newIndex);
                    setIsPlaying(true);
                  }}
                  style={{ background: 'rgba(251,200,13,0.2)', border: '1px solid rgba(251,200,13,0.4)', color: '#FBC80D', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Next"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Volume control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <button
                  className="no-drag"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{ background: 'none', border: 'none', color: isMuted ? '#ff6b8f' : '#FBC80D', cursor: 'pointer', padding: '4px' }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  className="no-drag"
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: '#FBC80D' }}
                  title="Volume"
                />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', minWidth: '35px' }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Playlist */}
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                PLAYLIST ({musicTracks.length})
              </div>
              <div className="no-drag" style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '6px' }}>
                {musicTracks.map((track, idx) => (
                  <button
                    key={track.id || idx}
                    className="no-drag"
                    onClick={() => {
                      setCurrentTrackIndex(idx);
                      setIsPlaying(true);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: idx === currentTrackIndex ? 'rgba(251,200,13,0.2)' : 'transparent',
                      border: idx === currentTrackIndex ? '1px solid rgba(251,200,13,0.4)' : '1px solid transparent',
                      color: idx === currentTrackIndex ? '#FBC80D' : 'rgba(255,255,255,0.7)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      fontSize: '0.8rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      if (idx !== currentTrackIndex) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseOut={e => {
                      if (idx !== currentTrackIndex) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {idx === currentTrackIndex ? '▶ ' : ''}{track.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                      by {track.username || 'Unknown'}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={musicTracks[currentTrackIndex]?.music_url}
            autoPlay={isPlaying}
            loop={false}
            volume={isMuted ? 0 : volume}
            onEnded={() => {
              const nextIndex = currentTrackIndex < musicTracks.length - 1 ? currentTrackIndex + 1 : 0;
              setCurrentTrackIndex(nextIndex);
              setIsPlaying(true);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Character Unlock Modal (Store buy, QR scan, Admin grant) */}
      <CharacterUnlockModal
        isOpen={Boolean(quotaUnlockChar)}
        onClose={() => setQuotaUnlockChar(null)}
        characterId={quotaUnlockChar}
        userId={currentUser?.id}
        userProfile={userProfile || currentUser}
        onUnlockSuccess={() => {
          setQuotaUnlockChar(null);
        }}
      />
    </div>
  );
}






