import { supabase } from './supabaseClient';

export const musicService = {
  // User: Submit music for approval (PRO only)
  async submitMusic(userId, username, title, musicUrl) {
    if (!supabase) return { success: false, message: 'DB not connected' };
    try {
      const { data, error } = await supabase
        .from('user_music')
        .insert({
          user_id: userId,
          username,
          title,
          music_url: musicUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: 'Music submitted for approval!', data };
    } catch (e) {
      console.error('Music: Failed to submit', e);
      return { success: false, message: e.message || 'Failed to submit music.' };
    }
  },

  // Fetch approved music (public — for in-game playlist)
  async getApprovedMusic() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Music: Failed to fetch approved tracks', e);
      return [];
    }
  },

  // Fetch user's own submissions
  async getUserSubmissions(userId) {
    if (!supabase || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Music: Failed to fetch user submissions', e);
      return [];
    }
  },

  // Admin: Fetch pending submissions
  async getPendingMusic() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Music: Failed to fetch pending tracks', e);
      return [];
    }
  },

  // Admin: Fetch all music (any status)
  async getAllMusic() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('user_music')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Music: Failed to fetch all music', e);
      return [];
    }
  },

  // Admin: Update music status (approve/reject)
  async updateMusicStatus(musicId, newStatus) {
    if (!supabase) return false;
    if (!['approved', 'rejected', 'pending'].includes(newStatus)) return false;
    try {
      const { error } = await supabase
        .from('user_music')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', musicId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Music: Failed to update status', e);
      return false;
    }
  },

  // Admin: Delete music entry
  async deleteMusic(musicId) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('user_music')
        .delete()
        .eq('id', musicId);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Music: Failed to delete', e);
      return false;
    }
  }
};
