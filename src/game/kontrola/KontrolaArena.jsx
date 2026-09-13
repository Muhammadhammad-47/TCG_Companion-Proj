import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, Swords, Shield, Skull, Zap, ScrollText, MessageSquare, Dices, Crown, Trophy, Layers, Clock, HelpCircle, X } from 'lucide-react';
import { DynamicScaleWrapper } from '../../components/DynamicScaleWrapper';
import { soundFX } from '../utils/audio';
import { getAssetUrl } from '../data/characters';
import { KONTROLA_CHARACTERS, generateDeck, dealInitialHands, resolveTurn, rollDice } from './KontrolaEngine';
import { createMatch, joinMatch, subscribeToMatch, requestJoin, takeTurn, broadcastState } from './MultiplayerClient';
import { getCardGraphicUrl, getCharacterAttackGraphicUrl, getWildCardGraphicUrl } from './kontrolaAssets';
import KontrolaDiceRoller from './KontrolaDiceRoller';
import KontrolaChatModal from './KontrolaChatModal';
import KontrolaTauntModal from './KontrolaTauntModal';
import '../../pages/GamePage.css';

export default function KontrolaArena() {
  const navigate = useNavigate();
  const [matchId, setMatchId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(() => `warrior_${Math.floor(100 + Math.random() * 900)}`);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCharacter, setSelectedCharacter] = useState('chynaman');
  const [isPremium, setIsPremium] = useState(false);
  
  const [selectedActionCard, setSelectedActionCard] = useState(null);
  const [selectedCharacterAttack, setSelectedCharacterAttack] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showTaunt, setShowTaunt] = useState(false);
  const [activeTauntBubble, setActiveTauntBubble] = useState(null);
  
  const [activeCombat, setActiveCombat] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [winner, setWinner] = useState(null);

  // Sound effects on interaction
  const playClick = () => {
    if (soundFX?.playMenuHover) soundFX.playMenuHover();
  };

  // Real-time Supabase Event Listener
  useEffect(() => {
    if (!matchId) return;
    
    const subscription = subscribeToMatch(matchId, (event) => {
      // 1. Peer Joined
      if (event.type === 'PLAYER_JOINED') {
        const { playerId: joinedId, characterId: joinedChar } = event.payload || {};
        if (!joinedId) return;

        if (isHost && gameState) {
          const currentPlayers = gameState.players || [];
          if (!currentPlayers.includes(joinedId)) {
            const updatedPlayers = [...currentPlayers, joinedId];
            const updatedChars = {
              ...(gameState.characterSelections || {}),
              [joinedId]: joinedChar || 'bee'
            };

            const updatedLobbyState = {
              ...gameState,
              players: updatedPlayers,
              characterSelections: updatedChars,
              logs: [...(gameState.logs || []), `Player ${joinedId} entered the lobby!`]
            };

            setGameState(updatedLobbyState);
            broadcastState(matchId, updatedLobbyState);
          }
        }
      } 
      // 2. Full State Sync
      else if (event.type === 'SYNC_STATE') {
        setGameState(event.payload);
        if (event.payload?.winner) {
          setWinner(event.payload.winner);
        }
      }
      // 3. Client Action received by Host
      else if (event.type === 'PLAYER_ACTION') {
        if (isHost) {
          handleActionResolution(event.payload);
        }
      }
      // 4. Initiate Synchronized Clash Modal
      else if (event.type === 'INITIATE_CLASH') {
        setActiveCombat(event.payload);
      }
      // 5. Clash Complete Triggered
      else if (event.type === 'CLASH_COMPLETE') {
        if (isHost) {
          handleActionResolution(event.payload.combatData, event.payload.precalculatedRolls);
        }
      }
      // 6. Chat and Taunts
      else if (event.type === 'CHAT_MESSAGE') {
        setChatMessages(prev => [...prev, event.payload]);
      } else if (event.type === 'PLAYER_TAUNT') {
        setActiveTauntBubble(event.payload);
        setTimeout(() => setActiveTauntBubble(null), 3500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [matchId, isHost, gameState, playerId]);

  // Host Action Resolution
  const handleActionResolution = (payload, precalculatedRolls = null) => {
    if (!gameState || !gameState.characterStates) return;
    const { actorId, actionCard, attackSelectionName, targetId } = payload;
    const attackerChar = gameState.characterStates[actorId];
    const defenderChar = targetId ? gameState.characterStates[targetId] : null;

    if (!attackerChar) return;

    // Deduct ET Cost
    const cost = actionCard.costET || (actionCard.type === 'ATTACK' ? 1 : 0);
    attackerChar.energyTokens = Math.max(0, (attackerChar.energyTokens || 5) - cost);

    // Resolve Turn via Engine
    const { newAttackerState, newDefenderState, log } = resolveTurn(
      actionCard,
      KONTROLA_CHARACTERS[attackerChar.id] || attackerChar,
      attackerChar,
      defenderChar,
      attackSelectionName,
      precalculatedRolls
    );

    // Visual shake on damage
    if (actionCard.type === 'ATTACK') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 900);
    }

    // Discard played card and replenish hand to exactly 10 cards
    let newDeck = [...(gameState.deck || [])];
    let newHand = [...(gameState.hands?.[actorId] || [])].filter(c => c.id !== actionCard.id);
    if (newDeck.length > 0) {
      newHand.push(newDeck.shift());
    }

    // Check if target was defeated and reward Stability Crystal
    let matchWinner = null;
    if (newDefenderState && newDefenderState.hp <= 0 && !newDefenderState.isDefeated) {
      newDefenderState.isDefeated = true;
      newAttackerState.crystals = (newAttackerState.crystals || 1) + (newDefenderState.crystals || 1);
      newDefenderState.crystals = 0;
      if (newAttackerState.crystals >= 3) {
        matchWinner = newAttackerState;
      }
    }

    // Turn rotation (modulo next non-defeated player)
    const livingPlayers = gameState.players.filter(pId => !gameState.characterStates[pId]?.isDefeated);
    const currentIdx = livingPlayers.indexOf(actorId);
    const nextTurnPlayerId = livingPlayers[(currentIdx + 1) % livingPlayers.length] || livingPlayers[0];

    const updatedStates = {
      ...gameState.characterStates,
      [actorId]: newAttackerState
    };
    if (targetId && newDefenderState) {
      updatedStates[targetId] = newDefenderState;
    }

    const nextState = {
      ...gameState,
      turn: nextTurnPlayerId,
      turnNumber: (gameState.turnNumber || 1) + 1,
      deck: newDeck,
      hands: {
        ...(gameState.hands || {}),
        [actorId]: newHand
      },
      characterStates: updatedStates,
      logs: [log, ...(gameState.logs || [])],
      winner: matchWinner
    };

    setGameState(nextState);
    broadcastState(matchId, nextState);
    setActiveCombat(null);
    if (matchWinner) setWinner(matchWinner);
  };

  // Host Creates Match
  const handleCreateMatch = async () => {
    playClick();
    try {
      const newMatchId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const initialState = await createMatch(newMatchId, playerId, selectedCharacter);
      initialState.isPremium = isPremium;
      setMatchId(newMatchId);
      setGameState(initialState);
      setIsHost(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Peer Joins Match
  const handleJoinMatch = async (e) => {
    if (e) e.preventDefault();
    playClick();
    if (!matchId) return;

    try {
      const cleanId = matchId.trim().toUpperCase();
      setMatchId(cleanId);
      setIsHost(false);
      
      const tempState = await joinMatch(cleanId, playerId, selectedCharacter);
      setGameState(tempState);
      
      setTimeout(async () => {
        await requestJoin(cleanId, { playerId, characterId: selectedCharacter });
      }, 400);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Host Starts Game
  const handleStartGame = () => {
    playClick();
    if (!gameState || !isHost) return;

    const deck = generateDeck(gameState.isPremium);
    const { updatedDeck, hands } = dealInitialHands(deck, gameState.players);
    
    // Initial starting crystals: 2 for 2-players, 1 for 3-7 players
    const startingCrystals = gameState.players.length === 2 ? 2 : 1;

    const initialCharacterStates = {};
    gameState.players.forEach((pId) => {
      const charKey = gameState.characterSelections?.[pId] || 'chynaman';
      const template = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
      initialCharacterStates[pId] = {
        ...template,
        playerId: pId,
        hp: template.maxHp,
        shield: 0,
        energyTokens: 5,
        crystals: startingCrystals,
        poisonCount: 0,
        isDefeated: false,
        claimedTurnET: false
      };
    });

    const activeState = {
      ...gameState,
      status: 'active',
      turn: playerId,
      turnNumber: 1,
      roundNumber: 1,
      deck: updatedDeck,
      hands: hands,
      characterStates: initialCharacterStates,
      logs: [`Match ${matchId} commenced! First warrior to collect 3 Stability Crystals wins.`]
    };
    
    setGameState(activeState);
    broadcastState(matchId, activeState);
  };

  // Claim +1 ET on turn
  const handleClaimTurnET = () => {
    playClick();
    if (!gameState || !isMyTurn || myCharacter?.claimedTurnET) return;

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

  // Execute Selected Action
  const playTurn = () => {
    playClick();
    if (!selectedActionCard || !isMyTurn) return;

    const isAttack = selectedActionCard.type === 'ATTACK';
    const isAoE = selectedActionCard.name.includes('BLITZ');

    if (isAttack && !isAoE && !selectedTargetId) {
      return; // Must select target
    }

    const payload = {
      actorId: playerId,
      actionCard: selectedActionCard,
      attackSelectionName: selectedCharacterAttack,
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
        precalculatedRolls
      };

      if (isHost) {
        takeTurn(matchId, { type: 'INITIATE_CLASH', payload: clashData });
        setActiveCombat(clashData);
      } else {
        takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
      }
    } else {
      if (isHost) {
        handleActionResolution(payload);
      } else {
        takeTurn(matchId, { type: 'PLAYER_ACTION', payload });
      }
    }

    setSelectedActionCard(null);
    setSelectedCharacterAttack(null);
    setSelectedTargetId(null);
  };

  const handleSendMessage = (text) => {
    const msg = { text, senderId: playerId, senderName: myCharacter?.name || 'Warrior', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, msg]);
    takeTurn(matchId, { type: 'CHAT_MESSAGE', payload: msg });
  };

  const handleSendTaunt = (tauntText) => {
    const msg = { text: tauntText, senderId: playerId, senderName: myCharacter?.name || 'Warrior' };
    setActiveTauntBubble(msg);
    setTimeout(() => setActiveTauntBubble(null), 3500);
    takeTurn(matchId, { type: 'PLAYER_TAUNT', payload: msg });
  };

  // ==========================================
  // VIEW 1: LOBBY & PRE-GAME SETUP
  // Replicates GameSetup.jsx & MainMenu.jsx
  // ==========================================
  if (!gameState || gameState.status === 'waiting' || gameState.status === 'joining') {
    return (
      <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <DynamicScaleWrapper>
          <div className="webgl-screen menu-screen" style={{ width: '100%', height: '100%', padding: '24px 32px', boxSizing: 'border-box', overflowY: 'auto' }}>
            
            {/* Ambient Streaks & Card Watermarks */}
            <div className="menu-bg-elements" style={{ width: '100%', height: '100%' }}>
              <div className="neon-streak-red" />
              <div className="neon-streak-blue" />
              <div className="subtle-watermark-card left-wm" />
              <div className="subtle-watermark-card right-wm" />
            </div>

            {/* Header Nav Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, marginBottom: '20px' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'rgba(10, 25, 50, 0.7)',
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
              <div className="brand-pill-badge" style={{ margin: 0, padding: '6px 16px', fontSize: '1rem' }}>注意!</div>
            </div>

            {/* Title & Branding */}
            <div className="game-brand-block" style={{ marginBottom: '25px', textAlign: 'center' }}>
              <h1 className="game-main-title" style={{ margin: '0 0 4px 0' }}>
                <span className="title-dance" style={{ fontSize: '3.2rem', letterSpacing: '2px' }}>KONTROLA MULTIPLAYER</span>
              </h1>
              <div className="brand-sub-row" style={{ justifyContent: 'center' }}>
                <span className="brand-tcg-text" style={{ fontSize: '1.1rem', letterSpacing: '3px' }}>2–7 PLAYER ONLINE BATTLE ARENA</span>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1.5px solid var(--neon-crimson)', borderRadius: '12px', padding: '12px 20px', maxWidth: '650px', margin: '0 auto 20px auto', color: '#ff88aa', textAlign: 'center', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            {!gameState ? (
              <div style={{ maxWidth: '900px', margin: '0 auto', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Character Selection Carousel */}
                <div style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '18px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '1.1rem', color: 'var(--neon-cyan)', fontWeight: 'bold', letterSpacing: '1px' }}>
                      SELECT YOUR WARRIOR
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>7 Playable Characters</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                    {Object.values(KONTROLA_CHARACTERS).map(char => {
                      const isSelected = selectedCharacter === char.id;
                      return (
                        <div
                          key={char.id}
                          onClick={() => { playClick(); setSelectedCharacter(char.id); }}
                          style={{
                            background: isSelected ? 'rgba(0, 240, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                            border: isSelected ? `2px solid ${char.themeColor || 'var(--neon-cyan)'}` : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isSelected ? `0 0 15px ${char.themeColor || 'var(--neon-cyan)'}` : 'none',
                            borderRadius: '12px',
                            padding: '10px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 8px auto', overflow: 'hidden', border: `2px solid ${char.themeColor}` }}>
                            <img src={getAssetUrl(char.image)} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {char.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: char.themeColor, fontWeight: 'bold' }}>
                            {char.element}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Host vs Join Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Host Card */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color: 'var(--neon-cyan)' }}>
                        HOST NEW MATCH
                      </h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Create a room for up to 7 players. You control match settings and deck rules.
                      </p>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '18px' }}>
                        <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                        <span>Use 157-Card Premium Deck (with Kontrol & Blitz)</span>
                      </label>
                    </div>

                    <button
                      onClick={handleCreateMatch}
                      className="btn-enter-game-cta"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1.1rem', justifyContent: 'center' }}
                    >
                      <Swords size={20} />
                      <span>CREATE ROOM AS HOST</span>
                    </button>
                  </div>

                  {/* Join Card */}
                  <div style={{ background: 'rgba(14, 22, 42, 0.85)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color: 'var(--neon-gold)' }}>
                        JOIN EXISTING MATCH
                      </h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Enter the 6-character Match Room code provided by your host.
                      </p>
                      <input
                        type="text"
                        placeholder="ENTER 6-DIGIT CODE"
                        value={matchId}
                        onChange={e => setMatchId(e.target.value.toUpperCase())}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1.5px solid var(--neon-gold)',
                          borderRadius: '10px',
                          padding: '12px',
                          color: '#fff',
                          fontSize: '1.2rem',
                          textAlign: 'center',
                          letterSpacing: '3px',
                          textTransform: 'uppercase',
                          boxSizing: 'border-box',
                          marginBottom: '18px'
                        }}
                      />
                    </div>

                    <button
                      onClick={handleJoinMatch}
                      disabled={!matchId}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: matchId ? 'pointer' : 'not-allowed',
                        background: matchId ? 'linear-gradient(90deg, #ffd700 0%, #ff9900 100%)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: matchId ? '#000' : 'rgba(255,255,255,0.4)',
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
                </div>
              </div>
            ) : (
              /* In-Lobby Room View */
              <div style={{ maxWidth: '650px', margin: '0 auto', zIndex: 10, background: 'rgba(14, 22, 42, 0.9)', border: '1.5px solid var(--neon-cyan)', borderRadius: '20px', padding: '32px', textAlign: 'center', boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '6px' }}>
                  MATCH CODE (SHARE WITH OPPONENTS)
                </div>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--neon-cyan)', letterSpacing: '8px', fontFamily: 'Rajdhani, sans-serif', textShadow: '0 0 20px rgba(0, 240, 255, 0.6)', marginBottom: '24px' }}>
                  {matchId}
                </div>

                {/* Player List */}
                <div style={{ textAlign: 'left', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>WARRIORS IN LOBBY</strong>
                    <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{gameState.players?.length}/7 PLAYERS</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {gameState.players?.map((pId, idx) => {
                      const charKey = gameState.characterSelections?.[pId] || (pId === playerId ? selectedCharacter : 'chynaman');
                      const charData = KONTROLA_CHARACTERS[charKey] || KONTROLA_CHARACTERS.chynaman;
                      const isMe = pId === playerId;
                      const isRoomHost = idx === 0;

                      return (
                        <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isMe ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 0, 0, 0.4)', border: isMe ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${charData.themeColor}` }}>
                              <img src={getAssetUrl(charData.image)} alt={charData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>
                                {charData.name} {isMe ? '(You)' : ''}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{pId}</div>
                            </div>
                          </div>

                          {isRoomHost && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 230, 0, 0.15)', border: '1px solid var(--neon-gold)', color: 'var(--neon-gold)', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              <Crown size={12} /> HOST
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
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1.3rem', justifyContent: 'center', cursor: gameState.players?.length >= 2 ? 'pointer' : 'not-allowed', opacity: gameState.players?.length >= 2 ? 1 : 0.5 }}
                  >
                    <Swords size={24} />
                    <span>{gameState.players?.length >= 2 ? 'COMMENCE BATTLE' : 'WAITING FOR PLAYERS (MIN 2)...'}</span>
                  </button>
                ) : (
                  <div style={{ color: 'var(--neon-gold)', fontSize: '1.1rem', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                    ⏳ Waiting for host to start the game...
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
  // Replicates BattleArena.jsx exactly
  // ==========================================
  const myHand = gameState.hands?.[playerId] || [];
  const myCharacter = gameState.characterStates?.[playerId] || KONTROLA_CHARACTERS[selectedCharacter];
  const isMyTurn = gameState.turn === playerId;
  const opponents = gameState.players.filter(p => p !== playerId);
  const turnNum = gameState.turnNumber || 1;
  const roundNum = gameState.roundNumber || 1;

  return (
    <div className="webgl-canvas-frame portrait-mode" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <DynamicScaleWrapper>
        <div className={`webgl-screen arena-screen ${isShaking ? 'shake-animation damage-flash-overlay' : ''}`} style={{ width: '100%', height: '100%' }}>
          
          {/* Leave Confirmation Modal */}
          {showLeaveConfirm && (
            <div className="arena-modal-backdrop" onClick={() => setShowLeaveConfirm(false)}>
              <div className="arena-modal-card" style={{ border: '2px solid var(--neon-crimson)' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ color: 'var(--neon-crimson)', margin: '0 0 10px 0' }}>Surrender Match?</h2>
                <p style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 20px 0' }}>
                  Are you sure you want to leave? Your match progress will be forfeited.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowLeaveConfirm(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => { setShowLeaveConfirm(false); setGameState(null); setMatchId(''); }} style={{ padding: '8px 20px', background: 'var(--neon-crimson)', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
                    Confirm Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Winner Modal */}
          {winner && (
            <div className="arena-modal-backdrop">
              <div className="arena-modal-card" style={{ border: '2px solid var(--neon-gold)', textAlign: 'center', padding: '32px' }}>
                <Trophy size={64} color="var(--neon-gold)" style={{ margin: '0 auto 16px auto' }} />
                <h1 style={{ color: 'var(--neon-gold)', fontFamily: 'Rajdhani, sans-serif', fontSize: '2.4rem', margin: '0 0 8px 0' }}>
                  VICTORY ACHIEVED!
                </h1>
                <p style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 24px 0' }}>
                  <strong>{winner.name}</strong> collected 3 Stability Crystals and restored balance to their universe!
                </p>
                <button
                  onClick={() => { setGameState(null); setMatchId(''); setWinner(null); navigate('/'); }}
                  className="btn-enter-game-cta"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', justifyContent: 'center' }}
                >
                  RETURN TO HUB
                </button>
              </div>
            </div>
          )}

          {/* Top HUD Bar (Matches BattleArena.jsx) */}
          <header className="arena-top-hud">
            <div className="hud-title-group">
              <span className="hud-sparkle">✦</span>
              <div className="hud-brand-title">
                <strong>ATTENTION 注意 TCG</strong>
                <span className="hud-format-tag">KONTROLA MULTIPLAYER</span>
              </div>
            </div>

            <div className="hud-turn-badge" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--neon-cyan)" />
                <span className="hud-turn-text">TURN {turnNum} · ROUND {roundNum}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neon-cyan)', fontSize: '0.8rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                <Wifi size={14} /> ROOM: {matchId}
              </div>

              {/* ET Claim Reminder */}
              {isMyTurn && !myCharacter?.claimedTurnET && (
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

          {/* 3-Column Arena Stage Grid (Matches BattleArena.jsx) */}
          <div className="arena-stage-grid">
            
            {/* Left Column: Scoreboard & Player Standings */}
            <aside className="arena-col-left">
              <div className="arena-panel scoreboard-panel">
                <div className="panel-title-bar">
                  <span className="panel-kicker">WARRIORS SCOREBOARD</span>
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
                          <div style={{ position: 'absolute', top: '-36px', left: '10px', background: '#fff', color: '#000', padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            🗣️ {activeTauntBubble.text}
                          </div>
                        )}

                        <div className={`arena-num-pill pill-${idx + 1}`}>{idx + 1}</div>

                        <div className="arena-score-avatar" style={{ borderColor: pChar.themeColor || 'var(--neon-cyan)', overflow: 'hidden', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                          <img src={getAssetUrl(pChar.image)} alt={pChar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                          <span className="arena-lp-number" style={{ color: pChar.hp < 30 ? 'var(--neon-crimson)' : 'var(--neon-cyan)' }}>
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
            <main className="arena-col-center" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="combat-orbit-stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                
                {/* Orbit Circle with Turn Status */}
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
                    background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    border: isMyTurn ? '2px dashed var(--neon-cyan)' : '2px dashed rgba(255,255,255,0.1)'
                  }}
                >
                  <Swords size={56} color={isMyTurn ? 'var(--neon-cyan)' : 'var(--neon-crimson)'} style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: isMyTurn ? 'var(--neon-cyan)' : 'var(--neon-crimson)', fontFamily: 'Rajdhani, sans-serif' }}>
                    {isMyTurn ? "YOUR TURN" : "WAITING FOR OPPONENT"}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    {isMyTurn ? 'Select a card from your hand to act' : `Current turn: ${gameState.turn}`}
                  </div>
                </div>

              </div>
            </main>

            {/* Right Column: Hand and Combat Actions */}
            <aside className="arena-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Hand of 10 Action Cards */}
              <div className="arena-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="panel-title-bar">
                  <span className="panel-kicker">YOUR HAND ({myHand.length}/10 CARDS)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '10px', overflowY: 'auto' }}>
                  {myHand.map(card => {
                    const isSelected = selectedActionCard?.id === card.id;
                    const cardArt = getCardGraphicUrl(card.name, myCharacter.id);

                    return (
                      <div
                        key={card.id}
                        onClick={() => { playClick(); setSelectedActionCard(card); }}
                        style={{
                          background: isSelected ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                          border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected ? '0 0 15px var(--neon-cyan)' : 'none',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
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
              {selectedActionCard?.type === 'ATTACK' && (
                <div className="arena-panel" style={{ background: 'rgba(20, 10, 20, 0.9)', border: '1.5px solid var(--neon-crimson)', padding: '12px' }}>
                  <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                    <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>1. SELECT TARGET</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {opponents.map(oId => {
                      const oChar = gameState.characterStates?.[oId];
                      if (!oChar || oChar.isDefeated) return null;
                      const isSelectedTarget = selectedTargetId === oId;

                      return (
                        <button
                          key={oId}
                          onClick={() => { playClick(); setSelectedTargetId(oId); }}
                          style={{
                            flex: 1,
                            background: isSelectedTarget ? 'rgba(255, 51, 102, 0.25)' : 'rgba(0, 0, 0, 0.5)',
                            border: isSelectedTarget ? '1.5px solid var(--neon-crimson)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSelectedTarget ? 'var(--neon-crimson)' : '#fff',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          <div>{oChar.name}</div>
                          <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{oChar.hp} HP</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="panel-title-bar" style={{ marginBottom: '8px' }}>
                    <span className="panel-kicker" style={{ color: 'var(--neon-crimson)' }}>2. SELECT CHARACTER MOVE</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(myCharacter.attacks || {}).map(([atkName, atkData]) => {
                      const isSelectedAtk = selectedCharacterAttack === atkName;
                      return (
                        <button
                          key={atkName}
                          onClick={() => { playClick(); setSelectedCharacterAttack(atkName); }}
                          style={{
                            background: isSelectedAtk ? 'rgba(255, 51, 102, 0.25)' : 'rgba(0, 0, 0, 0.4)',
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
                </div>
              )}

            </aside>
          </div>

          {/* Bottom Controls Bar (Matches BattleArena.jsx) */}
          <footer className="arena-bottom-controls">
            <div className="bottom-left-buttons">
              <button
                className="btn-arena-chat"
                onClick={() => { playClick(); setShowChat(true); }}
              >
                <MessageSquare size={16} />
                <span>CHAT</span>
              </button>
              <button
                className="btn-arena-chat"
                onClick={() => { playClick(); setShowTaunt(true); }}
                style={{ borderColor: 'var(--neon-gold)', color: 'var(--neon-gold)' }}
              >
                <span>🗣️</span>
                <span>TAUNT</span>
              </button>
            </div>

            <div className="bottom-right-actions">
              <button
                className={`btn-end-turn-cta ${isMyTurn && selectedActionCard ? 'flashing-end-turn-cta' : ''}`}
                disabled={!isMyTurn || !selectedActionCard || (selectedActionCard.type === 'ATTACK' && !selectedActionCard.name.includes('BLITZ') && (!selectedCharacterAttack || !selectedTargetId))}
                onClick={playTurn}
                style={{
                  boxShadow: (isMyTurn && selectedActionCard) ? '0 0 20px #39ff14' : 'none',
                  border: (isMyTurn && selectedActionCard) ? '2px solid #39ff14' : '2px solid rgba(255,255,255,0.1)',
                  background: (isMyTurn && selectedActionCard) ? 'rgba(57, 255, 20, 0.15)' : 'rgba(0,0,0,0.5)',
                  color: (isMyTurn && selectedActionCard) ? '#39ff14' : 'rgba(255,255,255,0.3)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: (isMyTurn && selectedActionCard) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Dices size={18} />
                <span>{selectedActionCard?.type === 'ATTACK' ? 'ROLL COMBAT CLASH' : 'PLAY ACTION CARD'}</span>
              </button>
            </div>
          </footer>

          {/* Modals */}
          {showChat && (
            <KontrolaChatModal
              players={gameState.players.map(p => ({ id: p, name: gameState.characterStates?.[p]?.name }))}
              activePlayerIndex={gameState.players.indexOf(playerId)}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onClose={() => setShowChat(false)}
            />
          )}

          {showTaunt && (
            <KontrolaTauntModal
              activePlayerName={myCharacter?.name || 'Warrior'}
              onClose={() => setShowTaunt(false)}
              onTaunt={handleSendTaunt}
            />
          )}

          {activeCombat && (
            <KontrolaDiceRoller
              combatData={activeCombat}
              precalculatedRolls={activeCombat.precalculatedRolls}
              onClose={() => setActiveCombat(null)}
              onCombatComplete={() => {
                if (isHost) {
                  handleActionResolution(activeCombat, activeCombat.precalculatedRolls);
                } else {
                  takeTurn(matchId, { type: 'CLASH_COMPLETE', payload: { combatData: activeCombat, precalculatedRolls: activeCombat.precalculatedRolls } });
                }
              }}
            />
          )}

        </div>
      </DynamicScaleWrapper>
    </div>
  );
}
