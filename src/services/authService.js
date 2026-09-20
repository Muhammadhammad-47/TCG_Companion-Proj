import { supabase, isSupabaseConfigured } from './supabaseClient';

export const authService = {
  // Validate warrior username format and check unique availability
  async checkUsernameAvailable(username, excludeUserId = null) {
    if (!isSupabaseConfigured || !supabase) {
      return { available: true };
    }

    const cleanUsername = (username || '').trim();
    if (!cleanUsername) {
      return { available: false, error: 'Callsign cannot be blank.' };
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return { available: false, error: 'Callsign must be between 3 and 20 characters.' };
    }

    const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validCharsRegex.test(cleanUsername)) {
      return { available: false, error: 'Callsign can only contain letters, numbers, hyphens, and underscores.' };
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
        error: `The warrior callsign "${cleanUsername}" is already taken. Please choose a unique name.`
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
      // 3. Upsert initial warrior profile
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
        throw new Error('This warrior account has been suspended by the Game Masters.');
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
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session user
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
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

    return data;
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
    const redirectUrl = window.location.origin + window.location.pathname;
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

  // Save player match result and update crystals
  async savePlayerMatchResult(userId, { won = false, crystalsDelta = 0, appSource = 'companion_hub' } = {}) {
    if (!supabase || !userId) return null;
    const current = await this.getProfile(userId);
    if (!current) return null;

    const newPlayed = (current.matches_played || 0) + 1;
    const newWon = (current.matches_won || 0) + (won ? 1 : 0);
    const newCrystals = Math.max(0, (current.crystals_collected || 0) + crystalsDelta);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        matches_played: newPlayed,
        matches_won: newWon,
        crystals_collected: newCrystals,
        last_active_app: appSource,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Failed to save match result:', error);
      return null;
    }
    return data;
  },

  // Query top warriors leaderboard
  async getLeaderboard(limit = 10) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_id, crystals_collected, matches_won, matches_played')
      .order('crystals_collected', { ascending: false })
      .limit(limit);

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
  // ADMIN WARRIOR DIRECTORY & MODERATION
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
    winnerName = 'Warrior',
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
