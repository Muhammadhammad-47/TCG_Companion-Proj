import { supabase } from './supabaseClient';
import { economyService } from './economyService';

/**
 * Tournament Service — Handles Public & Private Tournaments, Brackets,
 * Series Formats (Bo1, Bo3, Bo5), Escrow Crystal Deductions and Winner Payouts.
 */

// Generate a random, human-friendly 6-character room/invite code
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get required wins for series format
export function getTargetWins(seriesFormat = 'bo1') {
  if (seriesFormat === 'bo5') return 3;
  if (seriesFormat === 'bo3') return 2;
  return 1;
}

export const tournamentService = {
  // Auto-expire unfilled tournaments whose registration deadline has passed and refund 100%
  async checkAndExpireTournaments() {
    if (!supabase) return;
    try {
      // 1. Try atomic RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_check_and_expire_tournaments');
      if (!rpcErr && rpcRes && rpcRes.success) {
        return rpcRes;
      }

      // 2. Client fallback
      const now = new Date().toISOString();
      const { data: expiredList } = await supabase
        .from('kontrola_tournaments')
        .select('id, title, bracket_size')
        .eq('status', 'registration')
        .not('registration_deadline', 'is', null)
        .lte('registration_deadline', now);

      if (expiredList && expiredList.length > 0) {
        for (const tourney of expiredList) {
          const parts = await this.getParticipants(tourney.id);
          if (parts.length < tourney.bracket_size) {
            console.log(`Tournament "${tourney.title}" registration deadline expired (${parts.length}/${tourney.bracket_size} players). Refunding all participants...`);
            await this.cancelTournament(tourney.id, null);
          } else {
            await this.autoStartTournamentIfFull(tourney.id);
          }
        }
      }
    } catch (e) {
      console.warn('tournamentService.checkAndExpireTournaments warning:', e);
    }
  },

  // Check if player already has an active private tournament (limit 1 at a time)
  async getActiveTournamentForUser(userId) {
    if (!supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select('*')
        .eq('creator_id', userId)
        .eq('type', 'private')
        .in('status', ['registration', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0) ? data[0] : null;
    } catch (e) {
      console.warn('tournamentService.getActiveTournamentForUser error:', e);
      return null;
    }
  },

  // Fetch active and upcoming public tournaments
  async getPublicTournaments() {
    await this.checkAndExpireTournaments();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select(`
          *,
          participants:kontrola_tournament_participants(count)
        `)
        .eq('type', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        participantsCount: t.participants?.[0]?.count || 0
      }));
    } catch (e) {
      console.warn('tournamentService.getPublicTournaments failed:', e);
      return [];
    }
  },

  // Fetch private tournaments created by or joined by the user
  async getPrivateTournaments(userId) {
    await this.checkAndExpireTournaments();
    if (!supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select(`
          *,
          participants:kontrola_tournament_participants(count)
        `)
        .eq('type', 'private')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        participantsCount: t.participants?.[0]?.count || 0
      }));
    } catch (e) {
      console.warn('tournamentService.getPrivateTournaments failed:', e);
      return [];
    }
  },

  // Admin: Fetch all tournaments
  async getAllTournaments() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select(`
          *,
          participants:kontrola_tournament_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        participantsCount: t.participants?.[0]?.count || 0
      }));
    } catch (e) {
      console.warn('tournamentService.getAllTournaments failed:', e);
      return [];
    }
  },

  // Get single tournament by ID
  async getTournamentById(tournamentId) {
    if (!supabase || !tournamentId) return null;
    try {
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('tournamentService.getTournamentById failed:', e);
      return null;
    }
  },

  // Look up private tournament by 6-char code
  async getTournamentByCode(inviteCode) {
    if (!supabase || !inviteCode) return null;
    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .select('*')
        .eq('invite_code', cleanCode)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('tournamentService.getTournamentByCode failed:', e);
      return null;
    }
  },

  // Fetch participants roster for a tournament
  async getParticipants(tournamentId) {
    if (!supabase || !tournamentId) return [];
    try {
      const { data, error } = await supabase
        .from('kontrola_tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('tournamentService.getParticipants failed:', e);
      return [];
    }
  },

  // Create tournament (Public or Private)
  async createTournament({
    title,
    description = '',
    type = 'private',
    bracket_size = 8,
    series_format = 'bo1',
    entry_fee = 0,
    bonus_prize = 0,
    admin_deduction_pct = null,
    creator_id = null,
    creator_name = 'Player',
    registration_deadline = null,
    durationHours = 24
  }) {
    if (!supabase) return { error: 'Database not connected' };

    try {
      // 1. Fetch Admin Global Limits from app_settings
      const appSettings = await economyService.getAppSettings();
      const minFee = appSettings.tournament_min_entry_fee ?? 0;
      const maxFee = appSettings.tournament_max_entry_fee ?? 500;
      const globalRakePct = parseFloat(appSettings.tournament_admin_deduction_pct) || 10.0;

      const parsedFee = Math.max(0, parseInt(entry_fee, 10) || 0);

      // 2. Enforce limits for Private Tournaments
      if (type === 'private') {
        if (parsedFee < minFee) {
          return { error: `Entry fee cannot be less than the minimum required by Admin (${minFee} 💎).` };
        }
        if (parsedFee > maxFee) {
          return { error: `Entry fee cannot exceed the maximum limit set by Admin (${maxFee} 💎).` };
        }
        // Force admin deduction percentage to match global platform settings
        admin_deduction_pct = globalRakePct;

        // 3. Enforce single active private tournament per player
        if (creator_id) {
          const activeTourney = await this.getActiveTournamentForUser(creator_id);
          if (activeTourney) {
            return {
              error: `You already have an active private tournament: "${activeTourney.title}". You must finish or cancel your existing tournament before creating a new one.`,
              existingTournament: activeTourney
            };
          }
        }
      } else {
        // Public Tournament: use provided rake or fallback to global
        if (admin_deduction_pct === null || admin_deduction_pct === undefined) {
          admin_deduction_pct = globalRakePct;
        }
      }

      // 4. Calculate Registration Deadline / Expiry
      let finalDeadline = registration_deadline;
      if (!finalDeadline) {
        const safeHours = Math.max(1, parseInt(durationHours, 10) || 24);
        finalDeadline = new Date(Date.now() + safeHours * 60 * 60 * 1000).toISOString();
      }

      const inviteCode = type === 'private' ? generateInviteCode() : null;
      const initialTotalPot = (type === 'public' ? (parseInt(bonus_prize, 10) || 0) : 0);
      const initialAdminRake = Math.floor(initialTotalPot * (admin_deduction_pct / 100));
      const initialWinnerPayout = initialTotalPot - initialAdminRake;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        creator_id,
        creator_name,
        invite_code: inviteCode,
        bracket_size: parseInt(bracket_size, 10),
        series_format,
        entry_fee: parsedFee,
        bonus_prize: Math.max(0, parseInt(bonus_prize, 10) || 0),
        admin_deduction_pct: parseFloat(admin_deduction_pct) || 10.0,
        total_pot: initialTotalPot,
        admin_deducted_amount: initialAdminRake,
        winner_payout: initialWinnerPayout,
        registration_deadline: finalDeadline,
        status: 'registration',
        bracket_data: {}
      };

      const { data, error } = await supabase
        .from('kontrola_tournaments')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { success: true, tournament: data };
    } catch (err) {
      console.error('tournamentService.createTournament error:', err);
      return { error: err.message || 'Failed to create tournament' };
    }
  },

  // Join tournament with atomic RPC and crystal deduction
  async joinTournament({ tournamentId, userId, playerName, characterId = 'chynaman' }) {
    if (!supabase || !tournamentId || !userId) {
      return { error: 'Missing tournament or user credentials' };
    }

    try {
      // 1. Try atomic PostgreSQL RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_join_tournament', {
        p_tournament_id: tournamentId,
        p_user_id: userId,
        p_player_name: playerName || 'Player',
        p_character_id: characterId
      });

      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) {
          return { error: rpcRes.error || 'Failed to join tournament' };
        }
        // Auto-seed bracket if tournament reached full capacity
        if (rpcRes.total_participants >= rpcRes.bracket_size) {
          await this.autoStartTournamentIfFull(tournamentId);
        }
        return { success: true, data: rpcRes };
      }

      // 2. Graceful Client Fallback (if RPC not yet registered in live DB)
      console.warn('RPC not found, using client fallback for joinTournament...');
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney) return { error: 'Tournament not found' };
      if (tourney.status !== 'registration') return { error: 'Registration is closed' };
      if (tourney.registration_deadline && new Date(tourney.registration_deadline) <= new Date()) {
        return { error: 'Registration deadline has expired. This tournament is closed.' };
      }

      const existingParticipants = await this.getParticipants(tournamentId);
      if (existingParticipants.length >= tourney.bracket_size) {
        return { error: 'Tournament bracket is already full' };
      }
      if (existingParticipants.some(p => p.user_id === userId)) {
        return { error: 'You are already registered in this tournament' };
      }

      // Check balance
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('crystals_collected')
        .eq('id', userId)
        .single();

      if (profErr || !profile) return { error: 'Unable to verify player crystals' };
      if ((profile.crystals_collected || 0) < tourney.entry_fee) {
        return { error: `Insufficient Stability Crystals. Requires ${tourney.entry_fee} crystals.` };
      }

      // Deduct balance
      if (tourney.entry_fee > 0) {
        const { error: deductErr } = await supabase
          .from('profiles')
          .update({
            crystals_collected: profile.crystals_collected - tourney.entry_fee,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (deductErr) throw deductErr;
      }

      // Insert participant
      const seed = existingParticipants.length + 1;
      const { error: partErr } = await supabase
        .from('kontrola_tournament_participants')
        .insert([{
          tournament_id: tournamentId,
          user_id: userId,
          player_name: playerName || 'Player',
          character_id: characterId,
          seed,
          status: 'registered',
          entry_fee_paid: tourney.entry_fee
        }]);

      if (partErr) throw partErr;

      // Update tournament pot
      const newCount = existingParticipants.length + 1;
      const newPot = (newCount * tourney.entry_fee) + (tourney.bonus_prize || 0);
      const rake = Math.floor(newPot * ((tourney.admin_deduction_pct || 10) / 100));
      const payout = newPot - rake;

      await supabase
        .from('kontrola_tournaments')
        .update({
          total_pot: newPot,
          admin_deducted_amount: rake,
          winner_payout: payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      // Auto start if full
      if (newCount >= tourney.bracket_size) {
        await this.autoStartTournamentIfFull(tournamentId);
      }

      return { success: true };
    } catch (err) {
      console.error('joinTournament error:', err);
      return { error: err.message || 'Error joining tournament' };
    }
  },

  // Build Single Elimination Bracket Structure
  buildBracket(participants, bracketSize, seriesFormat = 'bo1') {
    const targetWins = getTargetWins(seriesFormat);
    const numRounds = Math.log2(bracketSize);
    const rounds = [];

    // Helper: Seeding layout (e.g. 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6)
    const seedPairs = {
      4: [[1, 4], [2, 3]],
      8: [[1, 8], [4, 5], [2, 7], [3, 6]],
      16: [
        [1, 16], [8, 9], [4, 13], [5, 12],
        [2, 15], [7, 10], [3, 14], [6, 11]
      ],
      32: [
        [1, 32], [16, 17], [8, 25], [9, 24],
        [4, 29], [13, 20], [5, 28], [12, 21],
        [2, 31], [15, 18], [7, 26], [10, 23],
        [3, 30], [14, 19], [6, 27], [11, 22]
      ]
    };

    const roundNames = {
      1: numRounds === 2 ? 'Semifinals' : numRounds === 3 ? 'Quarterfinals' : 'Round 1',
      2: numRounds === 2 ? 'Grand Finals' : numRounds === 3 ? 'Semifinals' : 'Round 2',
      3: numRounds === 3 ? 'Grand Finals' : 'Round 3',
      4: numRounds === 4 ? 'Grand Finals' : 'Round 4',
      5: 'Grand Finals'
    };

    const pairs = seedPairs[bracketSize] || seedPairs[8];
    const partBySeed = {};
    participants.forEach(p => {
      partBySeed[p.seed] = p;
    });

    // Round 1
    const r1Matches = pairs.map((pair, idx) => {
      const p1 = partBySeed[pair[0]] || null;
      const p2 = partBySeed[pair[1]] || null;
      return {
        matchId: `m_r1_${idx + 1}`,
        round: 1,
        matchIndex: idx + 1,
        seriesFormat,
        targetWins,
        player1: p1 ? { id: p1.user_id, name: p1.player_name, character: p1.character_id, wins: 0, seed: pair[0] } : null,
        player2: p2 ? { id: p2.user_id, name: p2.player_name, character: p2.character_id, wins: 0, seed: pair[1] } : null,
        games: [],
        status: (p1 && p2) ? 'ready' : 'waiting',
        roomCode: `TRN_${idx + 1}_R1_${generateInviteCode().substring(0, 4)}`,
        winnerId: null,
        winnerName: null
      };
    });

    rounds.push({
      roundNumber: 1,
      name: roundNames[1] || 'Round 1',
      matches: r1Matches
    });

    // Generate subsequent rounds
    let currentMatchCount = pairs.length / 2;
    for (let r = 2; r <= numRounds; r++) {
      const matches = [];
      for (let m = 0; m < currentMatchCount; m++) {
        matches.push({
          matchId: `m_r${r}_${m + 1}`,
          round: r,
          matchIndex: m + 1,
          seriesFormat,
          targetWins,
          player1: null,
          player2: null,
          games: [],
          status: 'waiting',
          roomCode: `TRN_${m + 1}_R${r}_${generateInviteCode().substring(0, 4)}`,
          winnerId: null,
          winnerName: null
        });
      }
      rounds.push({
        roundNumber: r,
        name: roundNames[r] || `Round ${r}`,
        matches
      });
      currentMatchCount = currentMatchCount / 2;
    }

    return { rounds, currentRound: 1, totalRounds: numRounds };
  },

  // Auto-start tournament and initialize bracket when full
  async autoStartTournamentIfFull(tournamentId) {
    if (!supabase || !tournamentId) return;

    try {
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney || tourney.status !== 'registration') return;

      const participants = await this.getParticipants(tournamentId);
      if (participants.length < tourney.bracket_size) return;

      const bracketData = this.buildBracket(
        participants,
        tourney.bracket_size,
        tourney.series_format || 'bo1'
      );

      await supabase
        .from('kontrola_tournaments')
        .update({
          status: 'in_progress',
          bracket_data: bracketData,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);
    } catch (e) {
      console.error('autoStartTournamentIfFull error:', e);
    }
  },

  // Manual start tournament by creator or admin
  async startTournament(tournamentId) {
    if (!supabase || !tournamentId) return { error: 'Missing tournament ID' };

    try {
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney) return { error: 'Tournament not found' };

      const participants = await this.getParticipants(tournamentId);
      if (participants.length < 2) {
        return { error: 'At least 2 players required to begin' };
      }

      // If participants count < bracket_size, we fit to next lower power of 2 or pad
      const effectiveSize = participants.length <= 4 ? 4 : participants.length <= 8 ? 8 : 16;
      const bracketData = this.buildBracket(
        participants,
        effectiveSize,
        tourney.series_format || 'bo1'
      );

      const { error } = await supabase
        .from('kontrola_tournaments')
        .update({
          status: 'in_progress',
          bracket_data: bracketData,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('startTournament error:', err);
      return { error: err.message || 'Failed to start tournament' };
    }
  },

  // Record game result and advance bracket or crown champion
  async recordGameResult({ tournamentId, round, matchIndex, winnerUserId, winnerName, roomCode }) {
    if (!supabase || !tournamentId || !winnerUserId) return { error: 'Invalid parameters' };

    try {
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney || tourney.status !== 'in_progress') return { error: 'Tournament is not active' };

      const bracket = tourney.bracket_data || {};
      const rounds = bracket.rounds || [];
      const currentRoundObj = rounds.find(r => r.roundNumber === round);
      if (!currentRoundObj) return { error: 'Round not found in bracket' };

      const match = currentRoundObj.matches.find(m => m.matchIndex === matchIndex);
      if (!match) return { error: 'Match not found in round' };

      // Update series wins
      if (match.player1 && match.player1.id === winnerUserId) {
        match.player1.wins = (match.player1.wins || 0) + 1;
      } else if (match.player2 && match.player2.id === winnerUserId) {
        match.player2.wins = (match.player2.wins || 0) + 1;
      }

      match.games = match.games || [];
      match.games.push({
        gameNumber: match.games.length + 1,
        winnerId: winnerUserId,
        winnerName,
        roomCode,
        timestamp: new Date().toISOString()
      });

      const p1Wins = match.player1?.wins || 0;
      const p2Wins = match.player2?.wins || 0;
      const targetWins = match.targetWins || getTargetWins(match.seriesFormat);

      // Check if series is won
      if (p1Wins >= targetWins || p2Wins >= targetWins) {
        match.status = 'completed';
        match.winnerId = winnerUserId;
        match.winnerName = winnerName || (p1Wins >= targetWins ? match.player1?.name : match.player2?.name);

        const isFinals = round === bracket.totalRounds;

        if (isFinals) {
          // Final match won: Crown Champion and award Escrow Pot!
          await this.concludeTournament(tournamentId, winnerUserId, match.winnerName);
        } else {
          // Advance winner to next round
          const nextRoundObj = rounds.find(r => r.roundNumber === round + 1);
          if (nextRoundObj) {
            const nextMatchIdx = Math.ceil(matchIndex / 2);
            const nextMatch = nextRoundObj.matches.find(m => m.matchIndex === nextMatchIdx);
            if (nextMatch) {
              const isSlot1 = (matchIndex % 2) !== 0;
              const advancedPlayer = match.player1?.id === winnerUserId ? match.player1 : match.player2;
              
              const pData = {
                id: advancedPlayer.id,
                name: advancedPlayer.name,
                character: advancedPlayer.character,
                wins: 0,
                seed: advancedPlayer.seed
              };

              if (isSlot1) {
                nextMatch.player1 = pData;
              } else {
                nextMatch.player2 = pData;
              }

              if (nextMatch.player1 && nextMatch.player2) {
                nextMatch.status = 'ready';
              }
            }
          }
        }
      } else {
        // More games needed in Bo3 / Bo5 series
        match.status = 'ready';
        match.roomCode = `TRN_${matchIndex}_R${round}_G${match.games.length + 1}_${generateInviteCode().substring(0, 4)}`;
      }

      // Save updated bracket state
      const { error: updateErr } = await supabase
        .from('kontrola_tournaments')
        .update({
          bracket_data: bracket,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (updateErr) throw updateErr;

      return { success: true, bracket };
    } catch (err) {
      console.error('recordGameResult error:', err);
      return { error: err.message || 'Failed to record game result' };
    }
  },

  // Conclude tournament & award winner
  async concludeTournament(tournamentId, winnerId, winnerName) {
    if (!supabase || !tournamentId) return;

    try {
      // 1. Try atomic RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_conclude_tournament', {
        p_tournament_id: tournamentId,
        p_winner_id: winnerId,
        p_winner_name: winnerName || 'Champion'
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return rpcRes;
      }

      // 2. Client fallback
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney) return;

      if (tourney.winner_payout > 0 && winnerId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('crystals_collected, matches_won')
          .eq('id', winnerId)
          .single();

        if (prof) {
          await supabase
            .from('profiles')
            .update({
              crystals_collected: (prof.crystals_collected || 0) + tourney.winner_payout,
              matches_won: (prof.matches_won || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', winnerId);
        }
      }

      await supabase
        .from('kontrola_tournament_participants')
        .update({ status: 'winner' })
        .eq('tournament_id', tournamentId)
        .eq('user_id', winnerId);

      await supabase
        .from('kontrola_tournaments')
        .update({
          status: 'completed',
          winner_id: winnerId,
          winner_name: winnerName || 'Champion',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);
    } catch (e) {
      console.error('concludeTournament error:', e);
    }
  },

  // Cancel tournament and issue 100% refunds
  async cancelTournament(tournamentId, requesterId) {
    if (!supabase || !tournamentId) return { error: 'Missing parameters' };

    try {
      // 1. Try atomic RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_cancel_tournament', {
        p_tournament_id: tournamentId,
        p_requester_id: requesterId
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return { success: true };
      }

      // 2. Client fallback
      const tourney = await this.getTournamentById(tournamentId);
      if (!tourney) return { error: 'Tournament not found' };

      if (requesterId) {
        const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', requesterId).single();
        const isAdmin = prof?.is_admin === true;
        if (tourney.creator_id !== requesterId && !isAdmin) {
          return { error: 'Unauthorized. Only the tournament host or an admin can cancel.' };
        }
      }

      const participants = await this.getParticipants(tournamentId);
      for (const p of participants) {
        if (p.entry_fee_paid > 0) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('crystals_collected')
            .eq('id', p.user_id)
            .single();

          if (prof) {
            await supabase
              .from('profiles')
              .update({
                crystals_collected: (prof.crystals_collected || 0) + p.entry_fee_paid,
                updated_at: new Date().toISOString()
              })
              .eq('id', p.user_id);
          }
        }
      }

      const { error } = await supabase
        .from('kontrola_tournaments')
        .update({
          status: 'cancelled',
          total_pot: 0,
          winner_payout: 0,
          admin_deducted_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('cancelTournament error:', err);
      return { error: err.message || 'Failed to cancel tournament' };
    }
  },

  // Subscribe to real-time tournament changes
  subscribeToTournament(tournamentId, onUpdate) {
    if (!supabase || !tournamentId) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`tournament_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kontrola_tournaments',
          filter: `id=eq.${tournamentId}`
        },
        payload => {
          onUpdate({ type: 'TOURNAMENT_UPDATED', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kontrola_tournament_participants',
          filter: `tournament_id=eq.${tournamentId}`
        },
        () => {
          onUpdate({ type: 'PARTICIPANTS_CHANGED' });
        }
      );

    if (channel.state !== 'joined' && channel.state !== 'joining') {
      try {
        channel.subscribe();
      } catch (err) {
        console.warn('[Supabase] subscribeToTournament ignored re-subscribe:', err);
      }
    }

    return {
      unsubscribe: () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      }
    };
  }
};
