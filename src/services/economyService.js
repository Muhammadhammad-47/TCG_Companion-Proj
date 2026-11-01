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
      return data || { match_cost: 1, premium_modules: [], module_costs: {} };
    } catch (e) {
      console.warn('Economy: Failed to fetch app_settings, using fallback.', e);
      return { match_cost: 1, premium_modules: [], module_costs: {} };
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
,
  // =========================================================================
  // DOMAIN 1: MULTI-CURRENCY WALLET & FIRST DAILY WIN ENGINE
  // =========================================================================

  // Atomic wallet modification (Gold, Gems, Tournament Credits, Crystals)
  async modifyWallet(userId, currency, amount, transactionType, referenceId = null) {
    if (!userId) return { success: false, error: 'User ID required' };
    if (!supabase) {
      console.warn('[Economy] Supabase offline, using local fallback.');
      return { success: true, localOnly: true, new_balance: amount };
    }
    try {
      // 1. Try atomic database RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_modify_wallet', {
        p_user_id: userId,
        p_currency: currency,
        p_amount: amount,
        p_type: transactionType,
        p_reference_id: referenceId
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return rpcRes;
      }

      // 2. Client fallback if RPC is not yet registered in database
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('gold, gems, tournament_credits, crystals_collected')
        .eq('id', userId)
        .single();

      if (profErr || !profile) return { success: false, error: 'Profile not found' };

      const col = currency === 'gold' ? 'gold'
        : currency === 'gems' ? 'gems'
        : currency === 'tournament_credits' ? 'tournament_credits'
        : 'crystals_collected';

      const currentBal = profile[col] ?? (currency === 'gold' ? 500 : currency === 'gems' ? 50 : 0);
      if (currentBal + amount < 0) {
        return { success: false, error: `Insufficient ${currency} balance.` };
      }

      const newBal = currentBal + amount;
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ [col]: newBal, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updErr) throw updErr;

      // Try logging to wallet_transactions if table exists
      try {
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          currency,
          amount,
          balance_after: newBal,
          transaction_type: transactionType,
          reference_id: referenceId
        });
      } catch (logErr) {
        // Non-blocking log error
      }

      return { success: true, currency, new_balance: newBal };
    } catch (e) {
      console.error('[Economy] modifyWallet error:', e);
      return { success: false, error: e.message || 'Transaction failed' };
    }
  },

  // Check and grant First Daily Win (+200 Gold)
  async checkDailyWinReward(userId) {
    if (!userId) return { granted: false };
    if (!supabase) return { granted: false };
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_daily_win_at, gold')
        .eq('id', userId)
        .single();

      const now = new Date();
      const lastWin = profile?.last_daily_win_at ? new Date(profile.last_daily_win_at) : null;
      const isNewDay = !lastWin || (
        now.getUTCDate() !== lastWin.getUTCDate() ||
        now.getUTCFullYear() !== lastWin.getUTCFullYear() ||
        now.getUTCMonth() !== lastWin.getUTCMonth()
      );

      if (isNewDay) {
        await supabase
          .from('profiles')
          .update({ last_daily_win_at: now.toISOString() })
          .eq('id', userId);

        const res = await this.modifyWallet(userId, 'gold', 200, 'first_daily_win');
        return { granted: true, bonusGold: 200, newGold: res.new_balance };
      }
      return { granted: false };
    } catch (e) {
      console.warn('[Economy] checkDailyWinReward error:', e);
      return { granted: false };
    }
  },

  // Fetch all wallet balances
  async getWalletBalances(userId) {
    if (!userId || !supabase) {
      return { gold: 500, gems: 50, tournament_credits: 0, crystals: 0 };
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gold, gems, tournament_credits, crystals_collected, crystals')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return { gold: 500, gems: 50, tournament_credits: 0, crystals: 0 };
      }

      return {
        gold: data.gold ?? 500,
        gems: data.gems ?? 50,
        tournament_credits: data.tournament_credits ?? 0,
        crystals: data.crystals_collected ?? data.crystals ?? 0
      };
    } catch (e) {
      return { gold: 500, gems: 50, tournament_credits: 0, crystals: 0 };
    }
  },

  // Get transaction ledger history
  async getWalletLedger(userId, limit = 20) {
    if (!userId || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }
};