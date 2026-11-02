import { supabase, isSupabaseConfigured } from './supabaseClient';

let activeSessionUserId = null;

export const authService = {
  // Validate username format and check unique availability
  async checkUsernameAvailable(username, excludeUserId = null) {
    if (!isSupabaseConfigured || !supabase) {
      return { available: true };
    }

    const cleanUsername = (username || '').trim();
    if (!cleanUsername) {
      return { available: false, error: 'Username cannot be blank.' };
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return { available: false, error: 'Username must be between 3 and 20 characters.' };
    }

    const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validCharsRegex.test(cleanUsername)) {
      return { available: false, error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
    }

    let query = supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn('Error checking username availability:', error);
      return { available: true };
    }

    if (data) {
      return {
        available: false,
        error: `The username "${cleanUsername}" is already taken. Please choose a unique name.`
      };
    }

    return { available: true };
  },

  // Sign up a new player with unique username verification
  async signUp(email, password, username, appSource = 'companion_hub') {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env settings.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // 1. Pre-validate unique username (case-insensitive)
    const availability = await this.checkUsernameAvailable(cleanUsername);
    if (!availability.available) {
      throw new Error(availability.error);
    }

    // 2. Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          username: cleanUsername,
          registered_app: appSource
        }
      }
    });

    if (error) throw error;

    const user = data?.user;
    if (user) {
      // 3. Upsert initial user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: cleanEmail,
          username: cleanUsername,
          avatar_id: 'chynaman',
          is_admin: false,
          is_banned: false,
          registered_app: appSource,
          last_active_app: appSource,
          matches_played: 0,
          matches_won: 0,
          crystals_collected: 0,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Profile creation warning during signup:', profileError);
      }
    }

    return data;
  },

  // Sign in existing player or administrator against Supabase Auth
  async signIn(email, password, appSource = 'companion_hub') {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) throw error;

    if (data?.user) {
      // Check if user is suspended/banned
      const profile = await this.getProfile(data.user.id);
      if (profile?.is_banned) {
        await this.signOut();
        throw new Error('This account has been suspended by an administrator.');
      }

      // Update last active app
      await supabase
        .from('profiles')
        .update({
          last_active_app: appSource,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id);
    }

    return data;
  },

  // Sign out
  async signOut() {
    activeSessionUserId = null;
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session user
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      activeSessionUserId = null;
      return null;
    }
    activeSessionUserId = user.id;
    return user;
  },

  // Get profile strictly from the database
  async getProfile(userId) {
    if (!supabase || !userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile from database:', error);
      return null;
    }

    if (!data) return null;

    // Default multi-currency wallet values if columns were recently added
    return {
      ...data,
      gold: data.gold ?? 500,
      gems: data.gems ?? 50,
      tournament_credits: data.tournament_credits ?? 0,
      crystals_collected: data.crystals_collected ?? data.crystals ?? 0
    };
  },

  // Update profile with unique callsign check if username changed
  async updateProfile(userId, updates) {
    if (!supabase || !userId) return null;

    if (updates.username) {
      const availability = await this.checkUsernameAvailable(updates.username, userId);
      if (!availability.available) {
        throw new Error(availability.error);
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Send password reset email
  async resetPassword(email) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }
    const cleanEmail = email.trim().toLowerCase();
    // For GitHub Pages (or custom domains), ensure pathname has trailing slash
    let originPath = window.location.origin + window.location.pathname;
    if (!originPath.endsWith('/')) {
      originPath += '/';
    }
    const redirectUrl = originPath;
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });
    if (error) throw error;
    return data;
  },

  // Update password (when authenticated or in recovery session)
  async updatePassword(newPassword) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  // Save player match result and update crystals & gold (Domain 1 Multi-Currency)
  async savePlayerMatchResult(userId, { won = false, crystalsDelta = 0, goldDelta = null, appSource = 'companion_hub' } = {}) {
    if (!supabase || !userId) return null;
    const current = await this.getProfile(userId);
    if (!current) return null;

    const isMatch = !appSource.includes('toll') && appSource !== 'store';
    const newPlayed = (current.matches_played || 0) + (isMatch ? 1 : 0);
    const newWon = (current.matches_won || 0) + (won && isMatch ? 1 : 0);
    const newCrystals = Math.max(0, (current.crystals_collected || 0) + crystalsDelta);

    let effectiveGoldDelta = goldDelta !== null ? goldDelta : (isMatch ? (won ? 100 : 40) : 0);
    let dailyWinBonus = 0;
    let dailyWinGranted = false;

    // Check First Daily Win bonus (+200 Gold) on match victory
    if (won && isMatch) {
      try {
        const now = new Date();
        const lastWin = current.last_daily_win_at ? new Date(current.last_daily_win_at) : null;
        const isNewDay = !lastWin || (
          now.getUTCDate() !== lastWin.getUTCDate() ||
          now.getUTCFullYear() !== lastWin.getUTCFullYear() ||
          now.getUTCMonth() !== lastWin.getUTCMonth()
        );

        if (isNewDay) {
          dailyWinBonus = 200;
          dailyWinGranted = true;
          effectiveGoldDelta += dailyWinBonus;
        }
      } catch (e) {
        console.warn('Daily win check error:', e);
      }
    }

    const newGold = Math.max(0, (current.gold ?? 500) + effectiveGoldDelta);

    const updatePayload = {
      matches_played: newPlayed,
      matches_won: newWon,
      crystals_collected: newCrystals,
      gold: newGold,
      last_active_app: appSource,
      updated_at: new Date().toISOString()
    };

    if (dailyWinGranted) {
      updatePayload.last_daily_win_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Failed to save match result:', error);
      return null;
    }

    // Try logging to wallet_transactions ledger if table exists
    if (effectiveGoldDelta !== 0) {
      try {
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          currency: 'gold',
          amount: effectiveGoldDelta,
          balance_after: newGold,
          transaction_type: dailyWinGranted ? 'match_win_with_daily_bonus' : (won ? 'match_win' : 'match_loss'),
          reference_id: appSource
        });
      } catch (logErr) {
        // Non-blocking log error
      }
    }

    return {
      ...data,
      dailyWinAwarded: dailyWinGranted,
      bonusGold: dailyWinBonus,
      goldEarned: effectiveGoldDelta
    };
  },

  // Query top players leaderboard (unified or tournaments)
  async getLeaderboard(limit = 25, category = 'crystals') {
    if (!supabase) return [];
    
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_id, crystals_collected, matches_won, matches_played, tournament_trophies, tournament_credits, equipped_title');
    
    if (category === 'tournaments') {
      query = query
        .order('tournament_trophies', { ascending: false })
        .order('tournament_credits', { ascending: false });
    } else {
      query = query
        .gt('matches_played', 0)
        .order('crystals_collected', { ascending: false });
    }
    
    query = query.limit(limit);
    const { data, error } = await query;

    if (error) {
      console.warn('Failed to fetch leaderboard:', error);
      return [];
    }
    return data || [];
  },
  // Check if user is an administrator strictly from their database profile
  async checkIsAdmin(userId) {
    if (!supabase || !userId) return false;
    const profile = await this.getProfile(userId);
    return Boolean(profile && profile.is_admin);
  },

  // =========================================================================
  // ADMIN USER DIRECTORY & MODERATION
  // =========================================================================
  async fetchAllUsers(searchQuery = '') {
    if (!supabase) return [];
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching users for admin:', error);
      return [];
    }
    return data || [];
  },

  async toggleUserBan(userId, isBanned) {
    if (!supabase || !userId) throw new Error('Invalid user ID');
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_banned: isBanned,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async adjustUserCrystals(userId, newCrystals) {
    if (!supabase || !userId) throw new Error('Invalid user ID');
    const safeCount = Math.max(0, parseInt(newCrystals, 10) || 0);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        crystals_collected: safeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =========================================================================
  // MATCH HISTORY ("WHO WON") TRACKING
  // =========================================================================
  async logMatchResult({
    roomCode = '',
    winnerId = null,
    winnerName = 'Player',
    playerIds = [],
    playerNames = [],
    gameMode = 'kontrola',
    crystalsAwarded = 1,
    durationSeconds = 0
  }) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('matches')
      .insert({
        room_code: roomCode,
        winner_id: winnerId,
        winner_name: winnerName,
        player_ids: playerIds,
        player_names: playerNames,
        game_mode: gameMode,
        crystals_awarded: crystalsAwarded,
        duration_seconds: durationSeconds
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to log match result to database:', error);
      return null;
    }
    return data;
  },

  async fetchMatchHistory(limit = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch match history:', error);
      return [];
    }
    return data || [];
  },

  // Real-time auth state listener with automatic ban-check
  onAuthStateChange(callback) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent browser minimize / tab switch / window focus from causing full reload or state reset.
      // Supabase emits TOKEN_REFRESHED on window focus / restore. If user hasn't changed, ignore it.
      if (event === 'TOKEN_REFRESHED' && session?.user && activeSessionUserId === session.user.id) {
        return;
      }
      if (event === 'SIGNED_OUT' || !session?.user) {
        activeSessionUserId = null;
      } else if (session?.user?.id) {
        activeSessionUserId = session.user.id;
      }

      let profile = null;
      if (session?.user) {
        profile = await this.getProfile(session.user.id);
        if (profile?.is_banned) {
          await this.signOut();
          profile = null;
        }
      }
      callback(event, session, profile);
    });
  }
};
