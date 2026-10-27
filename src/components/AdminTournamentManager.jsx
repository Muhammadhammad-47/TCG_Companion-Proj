import React, { useState, useEffect } from 'react';
import {
  Trophy, Plus, RefreshCw, AlertTriangle, CheckCircle2, Shield,
  Coins, Users, Swords, Play, X, Eye, Trash2, ArrowRight
} from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import { economyService } from '../services/economyService';
import KontrolaBracketView from '../game/kontrola/KontrolaBracketView';

export default function AdminTournamentManager({ currentUser, userProfile }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'public' | 'private' | 'active'
  const [notice, setNotice] = useState(null);

  // Settings State
  const [settings, setSettings] = useState({
    tournament_admin_deduction_pct: 10.0,
    tournament_min_entry_fee: 0,
    tournament_max_entry_fee: 500
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Create Public Tournament Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubBracketSize, setPubBracketSize] = useState(8);
  const [pubSeriesFormat, setPubSeriesFormat] = useState('bo1');
  const [pubEntryFee, setPubEntryFee] = useState(10);
  const [pubBonusPrize, setPubBonusPrize] = useState(100);
  const [pubDeductionPct, setPubDeductionPct] = useState(10);
  const [creatingPub, setCreatingPub] = useState(false);

  // Inspect Bracket Modal State
  const [inspectTournamentId, setInspectTournamentId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTourneys, appSettings] = await Promise.all([
        tournamentService.getAllTournaments(),
        economyService.getAppSettings()
      ]);
      setTournaments(allTourneys);
      if (appSettings) {
        setSettings({
          tournament_admin_deduction_pct: appSettings.tournament_admin_deduction_pct ?? 10.0,
          tournament_min_entry_fee: appSettings.tournament_min_entry_fee ?? 0,
          tournament_max_entry_fee: appSettings.tournament_max_entry_fee ?? 500
        });
        setPubDeductionPct(appSettings.tournament_admin_deduction_pct ?? 10.0);
      }
    } catch (e) {
      console.error('Error loading admin tournament data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text, type = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const success = await economyService.updateAppSettings({
      tournament_admin_deduction_pct: parseFloat(settings.tournament_admin_deduction_pct) || 10.0,
      tournament_min_entry_fee: parseInt(settings.tournament_min_entry_fee, 10) || 0,
      tournament_max_entry_fee: parseInt(settings.tournament_max_entry_fee, 10) || 500
    });
    setSavingSettings(false);
    if (success) {
      showToast('Tournament global financial settings updated!', 'success');
    } else {
      showToast('Failed to update tournament settings.', 'error');
    }
  };

  const handleCreatePublicTournament = async (e) => {
    e.preventDefault();
    if (!pubTitle.trim()) {
      showToast('Please enter a tournament title.', 'error');
      return;
    }

    setCreatingPub(true);
    const res = await tournamentService.createTournament({
      title: pubTitle.trim(),
      description: pubDesc.trim(),
      type: 'public',
      bracket_size: pubBracketSize,
      series_format: pubSeriesFormat,
      entry_fee: pubEntryFee,
      bonus_prize: pubBonusPrize,
      admin_deduction_pct: pubDeductionPct,
      creator_id: currentUser?.id || null,
      creator_name: 'Official Admin'
    });
    setCreatingPub(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Public Tournament "${pubTitle}" successfully created!`, 'success');
      setShowCreateForm(false);
      setPubTitle('');
      setPubDesc('');
      loadData();
    }
  };

  const handleCancelTournament = async (tourney) => {
    if (!window.confirm(`Are you sure you want to cancel "${tourney.title}"? All entry fees will be 100% refunded to registered players.`)) {
      return;
    }

    const res = await tournamentService.cancelTournament(tourney.id, currentUser?.id);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Tournament "${tourney.title}" cancelled and refunded.`, 'success');
      loadData();
    }
  };

  // Math previews for creation form
  const totalEstimatedPot = (pubBracketSize * pubEntryFee) + pubBonusPrize;
  const adminRakeEstimated = Math.floor(totalEstimatedPot * (pubDeductionPct / 100));
  const winnerPayoutEstimated = totalEstimatedPot - adminRakeEstimated;

  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'public') return t.type === 'public';
    if (filter === 'private') return t.type === 'private';
    if (filter === 'active') return t.status === 'in_progress' || t.status === 'registration';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notice */}
      {notice && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${notice.type === 'error' ? '#ef4444' : '#22c55e'}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem'
          }}
        >
          {notice.type === 'error' ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#22c55e" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* TOP METRICS & FINANCIAL CONTROLS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Global Financial Settings Card */}
        <div
          style={{
            background: 'var(--bg-card, #111)',
            border: '1px solid rgba(251, 200, 13, 0.3)',
            borderRadius: '14px',
            padding: '20px',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Coins size={22} color="var(--neon-gold)" />
            <h3 style={{ margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: 'var(--neon-gold)' }}>
              GLOBAL TOURNAMENT FINANCIAL RULES
            </h3>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '4px' }}>
                ADMIN DEDUCTION / HOUSE RAKE (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={settings.tournament_admin_deduction_pct}
                onChange={(e) => setSettings({ ...settings, tournament_admin_deduction_pct: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: 'var(--neon-gold)',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                Percentage automatically deducted by platform from total prize pot
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '4px' }}>
                  MIN ENTRY (💎)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.tournament_min_entry_fee}
                  onChange={(e) => setSettings({ ...settings, tournament_min_entry_fee: parseInt(e.target.value, 10) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '4px' }}>
                  MAX PRIVATE FEE (💎)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.tournament_max_entry_fee}
                  onChange={(e) => setSettings({ ...settings, tournament_max_entry_fee: parseInt(e.target.value, 10) || 500 })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--neon-gold)',
                color: '#000',
                fontWeight: 'bold',
                border: 'none',
                cursor: savingSettings ? 'not-allowed' : 'pointer'
              }}
            >
              {savingSettings ? 'SAVING...' : 'SAVE FINANCIAL RULES'}
            </button>
          </form>
        </div>

        {/* Aggregate Revenue & Active Tournaments Overview */}
        <div
          style={{
            background: 'var(--bg-card, #111)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '20px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Trophy size={22} color="var(--neon-cyan)" />
              <h3 style={{ margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: 'var(--neon-cyan)' }}>
                TOURNAMENT PLATFORM LEDGER
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Total Tournaments</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Bebas Neue' }}>
                  {tournaments.length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Active Duels</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue' }}>
                  {tournaments.filter(t => t.status === 'in_progress' || t.status === 'registration').length}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Admin Rake Collected</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399', fontFamily: 'Bebas Neue' }}>
                  💎 {tournaments.reduce((sum, t) => sum + (t.admin_deducted_amount || 0), 0)}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Total Escrow Awarded</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue' }}>
                  💎 {tournaments.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.winner_payout || 0), 0)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--neon-cyan)',
              color: '#000',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} /> CREATE OFFICIAL PUBLIC TOURNAMENT
          </button>
        </div>
      </div>

      {/* CREATE OFFICIAL PUBLIC TOURNAMENT MODAL */}
      {showCreateForm && (
        <div className="arena-modal-backdrop" style={{ zIndex: 99999 }}>
          <div
            className="arena-modal-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'var(--bg-card, #111)',
              border: '1.5px solid var(--neon-cyan)',
              borderRadius: '16px',
              padding: '24px',
              color: '#fff',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowCreateForm(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 4px 0', fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--neon-cyan)' }}>
              CREATE OFFICIAL PUBLIC TOURNAMENT
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              Published directly to all players in the Kontrola Tournament Hub.
            </p>

            <form onSubmit={handleCreatePublicTournament}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  TOURNAMENT TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Kontrola Championship Season 1"
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official single elimination championship. High crystal rewards!"
                  value={pubDesc}
                  onChange={(e) => setPubDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    BRACKET SIZE (PLAYERS)
                  </label>
                  <select
                    value={pubBracketSize}
                    onChange={(e) => setPubBracketSize(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value={4} style={{ background: '#111' }}>4 Players (2 Rounds)</option>
                    <option value={8} style={{ background: '#111' }}>8 Players (3 Rounds)</option>
                    <option value={16} style={{ background: '#111' }}>16 Players (4 Rounds)</option>
                    <option value={32} style={{ background: '#111' }}>32 Players (5 Rounds)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    MATCH SERIES FORMAT
                  </label>
                  <select
                    value={pubSeriesFormat}
                    onChange={(e) => setPubSeriesFormat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="bo1" style={{ background: '#111' }}>Best of 1 (First to 1 win)</option>
                    <option value="bo3" style={{ background: '#111' }}>Best of 3 (First to 2 wins)</option>
                    <option value="bo5" style={{ background: '#111' }}>Best of 5 (First to 3 wins)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    ENTRY FEE (💎)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pubEntryFee}
                    onChange={(e) => setPubEntryFee(parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    ADMIN BONUS POT (💎)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pubBonusPrize}
                    onChange={(e) => setPubBonusPrize(parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    ADMIN RAKE (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={pubDeductionPct}
                    onChange={(e) => setPubDeductionPct(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              {/* Math preview */}
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Total Pot (Players + Bonus):</span>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>💎 {totalEstimatedPot}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Admin Deduction ({pubDeductionPct}%):</span>
                  <span style={{ color: '#ef4444' }}>- 💎 {adminRakeEstimated}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', fontWeight: 'bold', color: 'var(--neon-gold)' }}>
                  <span>Winner 1st Place Payout:</span>
                  <span>🏆 💎 {winnerPayoutEstimated} Crystals</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingPub}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--neon-cyan)',
                  color: '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: creatingPub ? 'not-allowed' : 'pointer'
                }}
              >
                {creatingPub ? 'PUBLISHING...' : 'PUBLISH PUBLIC TOURNAMENT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOURNAMENTS TABLE & LEDGER */}
      <div
        style={{
          background: 'var(--bg-card, #111)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '20px',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.4rem', color: '#fff' }}>
            ALL TOURNAMENTS LEDGER ({filteredTournaments.length})
          </h3>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active / Registration' },
              { id: 'public', label: 'Public' },
              { id: 'private', label: 'Private' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: filter === t.id ? 'var(--neon-gold)' : 'rgba(255,255,255,0.06)',
                  color: filter === t.id ? '#000' : '#fff',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neon-gold)' }}>
            <RefreshCw className="spin" size={24} style={{ margin: '0 auto 8px auto' }} />
            <div>Loading Tournaments...</div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No tournaments found matching the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>TITLE</th>
                  <th style={{ padding: '10px' }}>TYPE</th>
                  <th style={{ padding: '10px' }}>HOST</th>
                  <th style={{ padding: '10px' }}>FORMAT</th>
                  <th style={{ padding: '10px' }}>PLAYERS</th>
                  <th style={{ padding: '10px' }}>TOTAL POT</th>
                  <th style={{ padding: '10px' }}>ADMIN RAKE</th>
                  <th style={{ padding: '10px' }}>WINNER PAYOUT</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTournaments.map((t) => {
                  const isReg = t.status === 'registration';
                  const isComp = t.status === 'completed';
                  const isCan = t.status === 'cancelled';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#fff' }}>
                        {t.title}
                        {t.invite_code && (
                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--neon-cyan)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.invite_code}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            background: t.type === 'public' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                            color: t.type === 'public' ? '#38bdf8' : '#c084fc'
                          }}
                        >
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.8)' }}>
                        {t.creator_name || 'Admin'}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--neon-gold)', fontWeight: 'bold' }}>
                        {t.series_format?.toUpperCase()}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#fff' }}>
                        {t.participantsCount || 0} / {t.bracket_size}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#fff' }}>
                        💎 {t.total_pot}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#34d399', fontWeight: 'bold' }}>
                        💎 {t.admin_deducted_amount} ({t.admin_deduction_pct}%)
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--neon-gold)', fontWeight: 'bold' }}>
                        💎 {t.winner_payout}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            background: isComp ? 'rgba(34, 197, 94, 0.2)' : isReg ? 'rgba(251, 191, 36, 0.2)' : isCan ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.2)',
                            color: isComp ? '#22c55e' : isReg ? '#fbbf24' : isCan ? 'rgba(255,255,255,0.5)' : '#ef4444'
                          }}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setInspectTournamentId(t.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Eye size={12} /> Inspect
                          </button>

                          {!isComp && !isCan && (
                            <button
                              onClick={() => handleCancelTournament(t)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              <Trash2 size={12} /> Cancel & Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT BRACKET MODAL */}
      {inspectTournamentId && (
        <div className="arena-modal-backdrop" style={{ zIndex: 999999 }}>
          <div
            className="arena-modal-card"
            style={{
              width: '95%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#0a0a0a',
              border: '2px solid var(--neon-gold)',
              borderRadius: '16px',
              padding: '24px',
              color: '#fff',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setInspectTournamentId(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <KontrolaBracketView
              tournamentId={inspectTournamentId}
              currentUser={currentUser}
              userProfile={userProfile}
              onLaunchMatch={() => {}}
              onBack={() => setInspectTournamentId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

