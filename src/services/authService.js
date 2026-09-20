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
  // Sign in existing player or administrator
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

  // Dedicated Admin Authentication with auto-registration if account not yet created in Supabase
  async signInOrRegisterAdmin(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const isDesignatedAdmin = cleanEmail === 'admin@tcgcompanion.com';

    let result = null;
    let lastError = null;

    // 1. First attempt direct sign-in
    try {
      const signInRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });
      if (signInRes.error) throw signInRes.error;
      result = signInRes.data;
    } catch (err) {
      lastError = err;
      // 2. If designated admin credentials and user doesn't exist, auto-register!
      if (isDesignatedAdmin) {
        try {
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                username: 'TCG_Admin',
                is_admin: true,
                registered_app: 'admin_portal'
              }
            }
          });
          if (signUpRes.error) throw signUpRes.error;
          result = signUpRes.data;
        } catch (regErr) {
          throw new Error(err.message || regErr.message || 'Admin authentication failed.');
        }
      } else {
        throw err;
      }
    }

    // 3. Ensure profiles table row has is_admin = true for this user
    if (result?.user) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: result.user.id,
            email: cleanEmail,
            username: result.user.user_metadata?.username || 'TCG_Admin',
            is_admin: true,
            registered_app: 'admin_portal',
            last_active_app: 'admin_portal',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (upsertErr) {
        console.warn('Admin profile upsert warning:', upsertErr);
      }
    }

    return result;
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

  // Get profile by user ID
  async getProfile(userId) {
    if (!supabase || !userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }

    // Automatic admin guarantee for designated admin email
    if (data && data.email && data.email.toLowerCase() === 'admin@tcgcompanion.com') {
      data.is_admin = true;
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

  // Check if current user is an administrator
  async checkIsAdmin(userId, userEmail) {
    if (userEmail && userEmail.toLowerCase() === 'admin@tcgcompanion.com') {
      return true;
    }
    if (!supabase || !userId) return false;
    const profile = await this.getProfile(userId);
    if (profile?.email && profile.email.toLowerCase() === 'admin@tcgcompanion.com') {
      return true;
    }
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
