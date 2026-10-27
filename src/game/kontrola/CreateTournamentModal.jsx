import React, { useState } from 'react';
import { X, Trophy, Users, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';

export default function CreateTournamentModal({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  adminDeductionPct = 10,
  maxEntryFee = 500,
  onTournamentCreated
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bracketSize, setBracketSize] = useState(8);
  const [seriesFormat, setSeriesFormat] = useState('bo1'); // 'bo1' | 'bo3' | 'bo5'
  const [entryFee, setEntryFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Live pot and deduction calculations
  const totalPot = bracketSize * entryFee;
  const adminRake = Math.floor(totalPot * (adminDeductionPct / 100));
  const winnerPayout = totalPot - adminRake;
  const userCrystals = userProfile?.crystals_collected || 0;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a tournament title.');
      return;
    }

    if (entryFee > userCrystals) {
      setError(`You do not have enough Stability Crystals (${userCrystals} available) to fund the host entry fee.`);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await tournamentService.createTournament({
      title: title.trim(),
      description: description.trim(),
      type: 'private',
      bracket_size: bracketSize,
      series_format: seriesFormat,
      entry_fee: entryFee,
      bonus_prize: 0,
      admin_deduction_pct: adminDeductionPct,
      creator_id: currentUser?.id,
      creator_name: userProfile?.username || 'Player'
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    // Auto-join the creator to the tournament they created
    if (res.tournament && currentUser?.id) {
      await tournamentService.joinTournament({
        tournamentId: res.tournament.id,
        userId: currentUser.id,
        playerName: userProfile?.username || 'Host',
        characterId: userProfile?.avatar_id || 'chynaman'
      });
    }

    setLoading(false);
    onTournamentCreated(res.tournament);
    onClose();
  };

  return (
    <div className="arena-modal-backdrop" style={{ zIndex: 999999 }}>
      <div
        className="arena-modal-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          border: '1.5px solid var(--neon-gold)',
          background: 'linear-gradient(180deg, #161208 0%, #0c0a06 100%)',
          borderRadius: '16px',
          padding: '28px',
          color: '#fff',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(251, 200, 13, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--neon-gold)'
            }}
          >
            <Trophy size={26} color="var(--neon-gold)" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.6rem',
                fontFamily: 'var(--font-display, "Bebas Neue", sans-serif)',
                letterSpacing: '1px',
                color: 'var(--neon-gold)'
              }}
            >
              HOST PRIVATE TOURNAMENT
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              Invite friends via code & battle through elimination brackets
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate}>
          {/* Title */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              TOURNAMENT TITLE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shadow Warriors Showdown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
              RULES / DESCRIPTION (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Standard rules, Winner takes all!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Bracket Size & Series Format */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                BRACKET SIZE (PLAYERS)
              </label>
              <select
                value={bracketSize}
                onChange={(e) => setBracketSize(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value={4} style={{ background: '#111' }}>4 Players (2 Rounds)</option>
                <option value={8} style={{ background: '#111' }}>8 Players (3 Rounds)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                MATCH SERIES FORMAT
              </label>
              <select
                value={seriesFormat}
                onChange={(e) => setSeriesFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="bo1" style={{ background: '#111' }}>Best of 1 (First to 1 win)</option>
                <option value="bo3" style={{ background: '#111' }}>Best of 3 (First to 2 wins)</option>
                <option value="bo5" style={{ background: '#111' }}>Best of 5 (First to 3 wins)</option>
              </select>
            </div>
          </div>

          {/* Entry Fee Slider */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>
                ENTRY FEE PER PLAYER
              </label>
              <span style={{ color: 'var(--neon-gold)', fontWeight: 'bold', fontSize: '1rem' }}>
                💎 {entryFee} Crystals
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={maxEntryFee}
              step="5"
              value={entryFee}
              onChange={(e) => setEntryFee(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--neon-gold)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              <span>Free (0)</span>
              <span>Available: {userCrystals} 💎</span>
              <span>Max: {maxEntryFee} 💎</span>
            </div>
          </div>

          {/* Live Prize Pot & Admin Deduction Breakdown */}
          <div
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(251, 200, 13, 0.25)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '22px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--neon-cyan)', marginBottom: '10px', letterSpacing: '0.5px' }}>
              ESCROW PRIZE POOL BREAKDOWN
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Total Pot ({bracketSize} × {entryFee}):</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>💎 {totalPot}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(255,255,255,0.8)' }}>
              <span>Admin House Deduction ({adminDeductionPct}%):</span>
              <span style={{ color: '#f87171' }}>- 💎 {adminRake}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
                marginTop: '4px',
                color: 'var(--neon-gold)'
              }}
            >
              <span>1st Place Champion Payout:</span>
              <span>🏆 💎 {winnerPayout} Crystals</span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="btn-enter-game-cta"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Sparkles size={20} />
            {loading ? 'CREATING TOURNAMENT...' : 'CREATE & GET INVITE CODE'}
          </button>
        </form>
      </div>
    </div>
  );
}
