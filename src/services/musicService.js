import { supabase } from './supabaseClient';
import { autoReportError } from './bugReportService';

export const musicService = {
  // Upload music file to Supabase Storage and create database entry
  async uploadAndSubmitMusic(userId, username, title, audioFile) {
    if (!supabase) return { success: false, message: 'DB not connected' };
    
    try {
      // 1. Validate file
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
      if (!allowedTypes.includes(audioFile.type)) {
        return { success: false, message: 'Invalid file type. Please upload MP3, WAV, or OGG files.' };
      }

      // Max size 10MB
      const maxSize = 10 * 1024 * 1024;
      if (audioFile.size > maxSize) {
        return { success: false, message: 'File too large. Maximum size is 10MB.' };
      }

      // 2. Generate unique filename
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `user-music/${fileName}`;

      // 3. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(filePath);

      // 5. Create database entry
      const { data, error } = await supabase
        .from('user_music')
        .insert({
          user_id: userId,
          username,
          title,
          music_url: publicUrl,
          file_path: filePath,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Rollback - delete uploaded file
        await supabase.storage.from('music').remove([filePath]);
        throw error;
      }

      return { success: true, message: 'Music uploaded and submitted for approval!', data };
    } catch (e) {
      console.error('Music: Failed to upload', e);
      
      // Auto-report error to admin
      autoReportError(e, {
        userId,
        username,
        errorType: 'storage_error',
        section: 'music_upload'
      });
      
      return { success: false, message: e.message || 'Failed to upload music.' };
    }
  },

  // User: Submit music for approval (PRO only) - LEGACY URL method
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

  // Admin: Delete music entry and file from storage
  async deleteMusic(musicId) {
    if (!supabase) return false;
    try {
      // First get the file_path
      const { data: music } = await supabase
        .from('user_music')
        .select('file_path')
        .eq('id', musicId)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('user_music')
        .delete()
        .eq('id', musicId);

      if (error) throw error;

      // Delete from storage if file_path exists
      if (music?.file_path) {
        await supabase.storage
          .from('music')
          .remove([music.file_path]);
      }

      return true;
    } catch (e) {
      console.error('Music: Failed to delete', e);
      return false;
    }
  }
};
