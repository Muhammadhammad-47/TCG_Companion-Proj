import { supabase } from './supabaseClient';

export const economyService = {
  // Fetch global app settings (match costs, premium modules)
  async getAppSettings() {
    if (!supabase) return { match_cost: 1, premium_modules: [] };
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error) throw error;
      return data || { match_cost: 1, premium_modules: [] };
    } catch (e) {
      console.warn('Economy: Failed to fetch app_settings, using fallback.', e);
      return { match_cost: 1, premium_modules: [] };
    }
  },

  // Admin: Update global app settings
  async updateAppSettings(updates) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 'global', ...updates, updated_at: new Date().toISOString() });
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to update app_settings', e);
      return false;
    }
  },

  // Fetch active store bundles
  async getStoreBundles() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('store_bundles')
        .select('*')
        .eq('is_active', true)
        .order('price_usd', { ascending: true });
      
      if (error) throw error;
      
      // Defensive deduplication: prevent duplicate bundles from rendering
      // (DB should have unique constraints, but this ensures clean UI)
      const seen = new Set();
      const deduped = (data || []).filter(b => {
        const key = `${b.crystals_amount || b.crystal_amount}_${b.price_usd}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      return deduped;
    } catch (e) {
      console.warn('Economy: Failed to fetch store bundles.', e);
      return [];
    }
  },

  // Admin: Upsert a store bundle
  async upsertStoreBundle(bundleData) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('store_bundles')
        .upsert({
          ...bundleData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to upsert store bundle', e);
      return false;
    }
  },

  // Admin: Delete a store bundle
  async deleteStoreBundle(bundleId) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('store_bundles')
        .delete()
        .eq('id', bundleId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to delete store bundle', e);
      return false;
    }
  },

  // Fetch all redeem codes (Admin)
  async getAllRedeemCodes() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('redeem_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Economy: Failed to fetch redeem codes', e);
      return [];
    }
  },

  // Upsert redeem code (Admin)
  async upsertRedeemCode(codeData) {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('redeem_codes').upsert(codeData);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to upsert redeem code', e);
      return false;
    }
  },

  // Delete redeem code (Admin)
  async deleteRedeemCode(codeId) {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('redeem_codes').delete().eq('id', codeId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to delete redeem code', e);
      return false;
    }
  },

  // Redeem a code (User)
  async redeemCode(userId, code) {
    if (!supabase) return { success: false, message: 'DB not connected' };
    try {
      // 1. Fetch the code
      const { data: codeData, error: codeErr } = await supabase.from('redeem_codes').select('*').eq('code', code).single();
      if (codeErr || !codeData) return { success: false, message: 'Invalid code.' };
      
      if (!codeData.is_active || codeData.uses_count >= codeData.max_uses) {
        return { success: false, message: 'Code has expired or reached maximum uses.' };
      }

      // 2. Increment user's crystals (Using authService profile update logic)
      const { data: profile, error: profErr } = await supabase.from('profiles').select('crystals').eq('id', userId).single();
      if (profErr) return { success: false, message: 'Failed to fetch user profile.' };

      const newCrystals = (profile.crystals || 0) + codeData.crystal_amount;
      
      // We do a pseudo-transaction here (in production use RPC)
      const { error: updateProfErr } = await supabase.from('profiles').update({ crystals: newCrystals }).eq('id', userId);
      if (updateProfErr) throw updateProfErr;

      // 3. Increment code usage
      await supabase.from('redeem_codes').update({ uses_count: codeData.uses_count + 1 }).eq('id', codeData.id);

      return { success: true, message: `Successfully redeemed! Added ${codeData.crystal_amount} crystals.` };
    } catch (e) {
      console.error('Economy: Code redemption failed', e);
      return { success: false, message: 'An error occurred during redemption.' };
    }
  },

  // Admin: Assign premium to user
  async assignPremiumUser(userId, isPremium) {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('profiles').update({ is_premium: isPremium }).eq('id', userId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Economy: Failed to update user premium status', e);
      return false;
    }
  }
};
