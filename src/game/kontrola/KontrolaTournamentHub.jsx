import React, { useState, useEffect } from 'react';
import {
  Trophy, Plus, Users, Shield, Sparkles, Search, RefreshCw, Key,
  CheckCircle2, AlertCircle, ArrowRight, Eye, Swords, Trash2, Clock
} from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';
import CreateTournamentModal from './CreateTournamentModal';

export default function KontrolaTournamentHub({
  currentUser,
  userProfile,
  onSelectTournament,
  adminSettings
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'public' | 'private'
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const loadTournaments = async () => {
    setLoading(true);
    let list = [];
    if (filterTab === 'public') {
      list = await tournamentService.getPublicTournaments();
    } else if (filterTab === 'private') {
      list = await tournamentService.getPrivateTournaments(currentUser?.id);
    } else {
      const pubs = await tournamentService.getPublicTournaments();
      const privs = await tournamentService.getPrivateTournaments(currentUser?.id);
      list = [...pubs, ...privs];
    }
    setTournaments(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTournaments();
  }, [filterTab, currentUser]);

  const showToast = (text, type = 'info') => {
    setToastNotice({ text, type });
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setJoiningCode(true);
    const tourney = await tournamentService.getTournamentByCode(inviteCodeInput.trim());
    setJoiningCode(false);

    if (!tourney) {
      showToast('Invalid tournament code. Please verify with the host.', 'error');
      return;
    }

    onSelectTournament(tourney.id);
  };

  const handleRegister = async (tourney) => {
    if (!currentUser) {
      showToast('Please log in to register for tournaments.', 'error');
      return;
    }

    const crystals = userProfile?.crystals_collected || 0;
    if (tourney.entry_fee > crystals) {
      showToast(`Insufficient Stability Crystals! Requires ${tourney.entry_fee} 💎 (You have ${crystals} 💎).`, 'error');
      return;
    }

    const res = await tournamentService.joinTournament({
      tournamentId: tourney.id,
      userId: currentUser.id,
      playerName: userProfile?.username || 'Player',
      characterId: userProfile?.avatar_id || 'chynaman'
    });

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Successfully registered for ${tourney.title}!`, 'success');
      loadTournaments();
      onSelectTournament(tourney.id);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* HUB HEADER BAR */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(251, 200, 13, 0.25)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} color="var(--neon-gold)" />
            <h2
              style={{
                margin: 0,
                fontSize: '1.8rem',
                fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                color: 'var(--neon-gold)',
                letterSpacing: '1px'
              }}
            >
              KONTROLA TOURNAMENT HUB
            </h2>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Compete in Public & Private single-elimination brackets. Win the crystal pot!
          </div>
        </div>

        {/* Action Controls: Host & Join Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Join Code Input Form */}
          <form onSubmit={handleJoinByCode} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                placeholder="INVITE CODE"
                maxLength={6}
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                style={{
                  padding: '10px 12px 10px 32px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'var(--neon-cyan)',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  width: '130px',
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={joiningCode || !inviteCodeInput.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              JOIN
            </button>
          </form>

          {/* Host Private Tournament Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-enter-game-cta"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} /> HOST PRIVATE TOURNAMENT
          </button>
        </div>
      </div>

      {toastNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: toastNotice.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${toastNotice.type === 'error' ? '#ef4444' : '#22c55e'}`,
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.9rem'
          }}
        >
          {toastNotice.text}
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        {[
          { id: 'all', label: 'ALL TOURNAMENTS' },
          { id: 'public', label: 'PUBLIC OFFICIAL' },
          { id: 'private', label: 'PRIVATE (FRIENDS)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: filterTab === tab.id ? 'rgba(251, 200, 13, 0.15)' : 'rgba(0,0,0,0.3)',
              border: filterTab === tab.id ? '1.5px solid var(--neon-gold)' : '1px solid rgba(255,255,255,0.08)',
              color: filterTab === tab.id ? 'var(--neon-gold)' : '#fff',
              fontWeight: 'bold',
              fontFamily: 'Bebas Neue',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOURNAMENTS LIST CARDS */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neon-gold)' }}>
          <RefreshCw className="spin" size={28} style={{ margin: '0 auto 10px auto' }} />
          <div>Loading Tournaments...</div>
        </div>
      ) : tournaments.length === 0 ? (
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '50px 20px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)'
          }}
        >
          <Trophy size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>No Active Tournaments Found</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {filterTab === 'private' ? 'Create a private tournament and invite your friends with a 6-character code!' : 'No public tournaments currently scheduled.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {tournaments.map((t) => {
            const isReg = t.status === 'registration';
            const isComp = t.status === 'completed';
            const isProg = t.status === 'in_progress';
            const partCount = t.participantsCount || 0;

            return (
              <div
                key={t.id}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: isComp ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(251, 200, 13, 0.3)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Badge Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: t.type === 'public' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        color: t.type === 'public' ? '#38bdf8' : '#c084fc',
                        border: `1px solid ${t.type === 'public' ? '#38bdf8' : '#c084fc'}`
                      }}
                    >
                      {t.type.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isComp ? 'rgba(34, 197, 94, 0.15)' : isReg ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isComp ? '#22c55e' : isReg ? '#fbbf24' : '#ef4444'
                      }}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Creator */}
                  <h3
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '1.25rem',
                      fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                      color: '#fff',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {t.title}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                    Hosted by: <strong style={{ color: '#fff' }}>{t.creator_name || 'Admin'}</strong> • Format: <strong>{t.series_format?.toUpperCase()}</strong>
                  </div>

                  {/* Metrics Box */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Entry Fee:</span>
                      <div style={{ fontWeight: 'bold', color: 'var(--neon-gold)' }}>💎 {t.entry_fee} Crystals</div>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Prize Pot:</span>
                      <div style={{ fontWeight: 'bold', color: '#22c55e' }}>💎 {t.winner_payout} Crystals</div>
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Contenders:</span>
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>{partCount} / {t.bracket_size} Players</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isReg && (
                    <button
                      onClick={() => handleRegister(t)}
                      className="btn-enter-game-cta"
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        justifyContent: 'center'
                      }}
                    >
                      REGISTER (💎 {t.entry_fee})
                    </button>
                  )}
                  <button
                    onClick={() => onSelectTournament(t.id)}
                    style={{
                      flex: isReg ? '0 0 auto' : 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isReg ? 'rgba(255,255,255,0.08)' : 'var(--neon-cyan)',
                      color: isReg ? '#fff' : '#000',
                      border: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={16} /> VIEW BRACKET
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Private Tournament Modal */}
      <CreateTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        adminDeductionPct={adminSettings?.tournament_admin_deduction_pct ?? 10}
        minEntryFee={adminSettings?.tournament_min_entry_fee ?? 0}
        maxEntryFee={adminSettings?.tournament_max_entry_fee ?? 500}
        onTournamentCreated={(tourney) => {
          loadTournaments();
          onSelectTournament(tourney.id);
        }}
        onViewExistingTournament={(id) => {
          onSelectTournament(id);
        }}
      />
    </div>
  );
}
