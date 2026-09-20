import { supabase, isSupabaseConfigured } from './supabaseClient';

export const authService = {
  // Sign up a new player
  async signUp(email, password, username, appSource = 'companion_hub') {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Please check your .env settings.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      throw new Error('Please choose a warrior username.');
    }

    // 1. Check if username is already taken in profiles
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      throw new Error('That username is already claimed by another warrior! Please choose another.');
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
      // 3. Insert or update the player profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: cleanEmail,
          username: cleanUsername,
          avatar_id: 'chynaman',
          is_admin: false,
          registered_app: appSource,
          last_active_app: appSource,
          matches_played: 0,
          matches_won: 0,
          crystals_collected: 0,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Profile creation error during signup:', profileError);
      }
    }

    return data;
  },

  // Sign in existing player or administrator
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

  // Update profile
  async updateProfile(userId, updates) {
    if (!supabase || !userId) return null;
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

  // Real-time auth state listener
  onAuthStateChange(callback) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(async (event, session) => {
      let profile = null;
      if (session?.user) {
        profile = await this.getProfile(session.user.id);
      }
      callback(event, session, profile);
    });
  }
};
