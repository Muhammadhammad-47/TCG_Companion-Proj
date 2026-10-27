import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Trophy, Users, Copy, Check, Swords, Shield, Clock,
  Eye, AlertTriangle, Play, Sparkles, RefreshCw, Trash2
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';

export default function KontrolaBracketView({
  tournamentId,
  currentUser,
  userProfile,
  onLaunchMatch,
  onBack
}) {
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [forfeitTimers, setForfeitTimers] = useState({});
  const [actionNotice, setActionNotice] = useState(null);

  // Load tournament & participants
  const loadData = async () => {
    if (!tournamentId) return;
    const t = await tournamentService.getTournamentById(tournamentId);
    if (t) setTournament(t);
    const p = await tournamentService.getParticipants(tournamentId);
    setParticipants(p);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates for bracket and participants
    const sub = tournamentService.subscribeToTournament(tournamentId, (event) => {
      if (event.type === 'TOURNAMENT_UPDATED' && event.payload) {
        setTournament(event.payload);
      } else {
        loadData();
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [tournamentId]);

  const copyInviteCode = () => {
    if (!tournament?.invite_code) return;
    navigator.clipboard.writeText(tournament.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleStartTournament = async () => {
    const res = await tournamentService.startTournament(tournamentId);
    if (res.error) {
      setActionNotice({ type: 'error', text: res.error });
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      loadData();
    }
  };

  const handleCancelTournament = async () => {
    if (!tournament || !currentUser) return;
    if (!window.confirm(`Are you sure you want to cancel "${tournament.title}"? All entry fees will be immediately 100% refunded to all registered contenders.`)) {
      return;
    }

    const res = await tournamentService.cancelTournament(tournament.id, currentUser.id);
    if (res.error) {
      setActionNotice({ type: 'error', text: res.error });
    } else {
      setActionNotice({ type: 'success', text: 'Tournament successfully cancelled and all entry fees were 100% refunded!' });
      loadData();
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleForfeit = async (match, absentPlayer) => {
    if (!tournament || !currentUser) return;
    const opponent = match.player1?.id === absentPlayer.id ? match.player2 : match.player1;
    if (!opponent) return;

    const res = await tournamentService.recordGameResult({
      tournamentId,
      round: match.round,
      matchIndex: match.matchIndex,
      winnerUserId: opponent.id,
      winnerName: opponent.name,
      roomCode: match.roomCode
    });

    if (res.error) {
      setActionNotice({ type: 'error', text: res.error });
    } else {
      setActionNotice({ type: 'success', text: `${opponent.name} awarded forfeit victory!` });
      loadData();
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--neon-gold)' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px auto' }} />
        <div>Loading Tournament Bracket...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>
        <h3>Tournament not found</h3>
        <button onClick={onBack} className="btn-enter-game-cta" style={{ marginTop: '16px' }}>
          Back to Lobby
        </button>
      </div>
    );
  }

  const bracket = tournament.bracket_data || {};
  const rounds = bracket.rounds || [];
  const isHost = tournament.creator_id === currentUser?.id;
  const isRegistration = tournament.status === 'registration';
  const isCompleted = tournament.status === 'completed';
  const myParticipant = participants.find(p => p.user_id === currentUser?.id);

  return (
    <div style={{ width: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Tournament Navigation Bar */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(251, 200, 13, 0.3)',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>LOBBY</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.6rem',
                  fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                  color: 'var(--neon-gold)',
                  letterSpacing: '1px'
                }}
              >
                {tournament.title}
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  background: tournament.type === 'public' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                  color: tournament.type === 'public' ? '#38bdf8' : '#c084fc',
                  border: `1px solid ${tournament.type === 'public' ? '#38bdf8' : '#c084fc'}`
                }}
              >
                {tournament.type.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  background: isCompleted ? 'rgba(34, 197, 94, 0.2)' : isRegistration ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isCompleted ? '#22c55e' : isRegistration ? '#fbbf24' : '#ef4444'
                }}
              >
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              Format: <strong>{tournament.series_format.toUpperCase()}</strong> ({tournament.series_format === 'bo5' ? 'Best of 5' : tournament.series_format === 'bo3' ? 'Best of 3' : 'Best of 1'}) • {tournament.bracket_size} Player Bracket
            </div>
          </div>
        </div>

        {/* Prize Pool and Invite Code Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Prize Pot Badge */}
          <div
            style={{
              background: 'rgba(251, 200, 13, 0.1)',
              border: '1px solid var(--neon-gold)',
              borderRadius: '10px',
              padding: '8px 14px',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>1ST PLACE PRIZE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue' }}>
              💎 {tournament.winner_payout} Crystals
            </div>
          </div>

          {/* Private Invite Code */}
          {tournament.invite_code && (
            <button
              onClick={copyInviteCode}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '8px 16px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>INVITE CODE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--neon-cyan)', letterSpacing: '2px' }}>
                  {tournament.invite_code}
                </div>
              </div>
              {copiedCode ? <Check size={18} color="#34d399" /> : <Copy size={18} />}
            </button>
          )}

          {/* Host Start Button during registration */}
          {isRegistration && (isHost || currentUser?.is_admin) && (
            <button
              onClick={handleStartTournament}
              disabled={participants.length < 2}
              className="btn-enter-game-cta"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                opacity: participants.length < 2 ? 0.5 : 1,
                cursor: participants.length < 2 ? 'not-allowed' : 'pointer'
              }}
            >
              <Play size={16} /> START BRACKET ({participants.length}/{tournament.bracket_size})
            </button>
          )}

          {/* Host / Admin Cancel & 100% Refund Button */}
          {!isCompleted && tournament.status !== 'cancelled' && (isHost || currentUser?.is_admin) && (
            <button
              onClick={handleCancelTournament}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={16} /> CANCEL & REFUND
            </button>
          )}
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            padding: '12px 18px',
            background: actionNotice.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${actionNotice.type === 'error' ? '#ef4444' : '#22c55e'}`,
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        >
          {actionNotice.text}
        </div>
      )}

      {/* REGISTRATION DEADLINE COUNTDOWN BANNER */}
      {isRegistration && tournament.registration_deadline && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            color: '#fff',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#38bdf8" />
            <span>
              <strong>Registration Deadline:</strong> {new Date(tournament.registration_deadline).toLocaleString()}
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
            Unfilled brackets automatically expire with 100% crystal refunds to all players.
          </span>
        </div>
      )}

      {/* TOURNAMENT CANCELLED BANNER */}
      {tournament.status === 'cancelled' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            color: '#fff'
          }}
        >
          <AlertTriangle size={42} color="#f87171" style={{ margin: '0 auto 8px auto' }} />
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: '#f87171', margin: '0 0 6px 0' }}>
            TOURNAMENT CANCELLED
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>
            This tournament has been cancelled. All contenders have received a 100% refund of their entry fees.
          </p>
        </div>
      )}

      {/* REGISTRATION WAITING ROOM (if not yet in_progress) */}
      {isRegistration && (
        <div
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.4rem', color: 'var(--neon-gold)' }}>
              REGISTERED CONTENDERS ({participants.length} / {tournament.bracket_size})
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              Waiting for players to join...
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {Array.from({ length: tournament.bracket_size }).map((_, idx) => {
              const p = participants[idx];
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: p ? 'rgba(251, 200, 13, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: p ? '1px solid rgba(251, 200, 13, 0.3)' : '1px dashed rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: p ? 'var(--neon-gold)' : 'rgba(255,255,255,0.1)',
                      color: p ? '#000' : 'rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.85rem'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: p ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {p ? p.player_name : 'Awaiting Contender'}
                    </div>
                    {p && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>
                        {p.character_id?.toUpperCase() || 'WARRIOR'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CHAMPION BANNER (if completed) */}
      {isCompleted && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(251, 200, 13, 0.25) 0%, rgba(0,0,0,0.8) 50%, rgba(251, 200, 13, 0.25) 100%)',
            border: '2px solid var(--neon-gold)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            color: '#fff'
          }}
        >
          <Trophy size={48} color="var(--neon-gold)" style={{ margin: '0 auto 8px auto' }} />
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2.4rem', color: 'var(--neon-gold)', margin: 0 }}>
            TOURNAMENT CHAMPION: {tournament.winner_name || 'VICTOR'}
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>
            Claimed the Grand Prize of <strong>💎 {tournament.winner_payout} Crystals</strong>!
          </p>
        </div>
      )}

      {/* INTERACTIVE VISUAL BRACKET TREE */}
      {rounds.length > 0 && (
        <div
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px',
            overflowX: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '40px',
              minWidth: `${rounds.length * 280}px`,
              alignItems: 'stretch'
            }}
          >
            {rounds.map((roundObj) => {
              return (
                <div
                  key={roundObj.roundNumber}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  {/* Round Header */}
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '8px',
                      background: 'rgba(251, 200, 13, 0.12)',
                      border: '1px solid rgba(251, 200, 13, 0.3)',
                      borderRadius: '8px',
                      fontFamily: 'Bebas Neue',
                      fontSize: '1.2rem',
                      color: 'var(--neon-gold)',
                      letterSpacing: '1px'
                    }}
                  >
                    {roundObj.name.toUpperCase()}
                  </div>

                  {/* Matches Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      flexGrow: 1,
                      gap: '24px'
                    }}
                  >
                    {roundObj.matches.map((match) => {
                      const isMyMatch = (match.player1?.id === currentUser?.id || match.player2?.id === currentUser?.id);
                      const isReadyToDuel = match.status === 'ready' && match.player1 && match.player2;
                      const isComplete = match.status === 'completed';
                      const targetWins = match.targetWins || 1;

                      return (
                        <div
                          key={match.matchId}
                          style={{
                            background: isMyMatch ? 'rgba(251, 200, 13, 0.08)' : 'rgba(0,0,0,0.4)',
                            border: isMyMatch ? '1.5px solid var(--neon-gold)' : '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            padding: '14px',
                            position: 'relative',
                            boxShadow: isMyMatch ? '0 0 16px rgba(251, 200, 13, 0.15)' : 'none'
                          }}
                        >
                          {/* Match Header Badge */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>MATCH #{match.matchIndex}</span>
                            <span style={{ color: isComplete ? '#22c55e' : isReadyToDuel ? '#fbbf24' : 'inherit' }}>
                              {isComplete ? 'FINISHED' : isReadyToDuel ? 'READY' : 'PENDING'}
                            </span>
                          </div>

                          {/* Player 1 Row */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: match.winnerId && match.winnerId === match.player1?.id ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                              border: match.winnerId && match.winnerId === match.player1?.id ? '1px solid #22c55e' : '1px solid transparent',
                              marginBottom: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                #{match.player1?.seed || '-'}
                              </span>
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: match.player1 ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                {match.player1?.name || 'TBD'}
                              </span>
                            </div>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--neon-gold)' }}>
                              {match.player1?.wins || 0}
                            </span>
                          </div>

                          {/* Player 2 Row */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: match.winnerId && match.winnerId === match.player2?.id ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)',
                              border: match.winnerId && match.winnerId === match.player2?.id ? '1px solid #22c55e' : '1px solid transparent'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                #{match.player2?.seed || '-'}
                              </span>
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: match.player2 ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                                {match.player2?.name || 'TBD'}
                              </span>
                            </div>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--neon-gold)' }}>
                              {match.player2?.wins || 0}
                            </span>
                          </div>

                          {/* Active Duel Action Bar */}
                          {isReadyToDuel && !isComplete && (
                            <div style={{ marginTop: '12px' }}>
                              {isMyMatch ? (
                                <button
                                  onClick={() => onLaunchMatch(tournament, match)}
                                  className="btn-enter-game-cta"
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <Swords size={16} /> ENTER TOURNAMENT DUEL
                                </button>
                              ) : (
                                <button
                                  onClick={() => onLaunchMatch(tournament, match, true)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <Eye size={14} /> SPECTATE DUEL
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
