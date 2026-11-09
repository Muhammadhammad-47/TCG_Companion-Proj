import { supabase } from './supabaseClient';
import { economyService } from './economyService';
import { CHARACTERS } from '../game/data/characters';

const STORAGE_KEY = 'tcg_character_licenses';
export const FREE_USAGE_LIMIT = 10;

// Character Store Pricing
export const CHARACTER_PRICES = {
  chynaman: { gold: 1500, gems: 150 },
  bee:      { gold: 1500, gems: 150 },
  katsumi:  { gold: 1500, gems: 150 },
  kiko:     { gold: 1500, gems: 150 },
  shroomy:  { gold: 2000, gems: 200 },
  poochi:   { gold: 2000, gems: 200 },
  queeny:   { gold: 2500, gems: 250 }
};

class CharacterLicenseService {
  constructor() {
    this._listeners = new Set();
  }

  // Subscribe to license / quota changes
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    this._listeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('License listener error:', err); }
    });
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('character_license_updated'));
      } catch (e) {}
    }
  }

  // Retrieve raw local storage cache
  _getLocalData(userId = 'guest') {
    const key = `${STORAGE_KEY}_${userId || 'guest'}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // Save raw local storage cache
  _saveLocalData(userId = 'guest', data) {
    const key = `${STORAGE_KEY}_${userId || 'guest'}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (typeof window !== 'undefined') {
      try { window.dispatchEvent(new CustomEvent('tcg_wallet_updated')); } catch (e) {}
    }

    this._notify();
    } catch (e) {
      console.warn('Failed to save character licenses locally', e);
    }
  }

  // Get license status for a single character
  async getCharacterLicense(userId, characterId) {
    const charKey = (characterId || 'chynaman').toLowerCase();
    const localData = this._getLocalData(userId);
    let record = localData[charKey] || {
      usageCount: 0,
      isUnlocked: false,
      unlockedVia: null,
      unlockedAt: null
    };

    // If online with a logged-in user, fetch from Supabase
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('character_licenses')
          .select('*')
          .eq('user_id', userId)
          .eq('character_id', charKey)
          .maybeSingle();

        if (!error && data) {
          record = {
            usageCount: data.usage_count ?? record.usageCount,
            isUnlocked: Boolean(data.is_unlocked),
            unlockedVia: data.unlocked_via || record.unlockedVia,
            unlockedAt: data.unlocked_at || record.unlockedAt
          };
          // Sync local cache
          localData[charKey] = record;
          this._saveLocalData(userId, localData);
        }
      } catch (err) {
        // Silently fallback to local cache
      }
    }

    const usesRemaining = record.isUnlocked
      ? Infinity
      : Math.max(0, FREE_USAGE_LIMIT - (record.usageCount || 0));

    const canPlay = record.isUnlocked || usesRemaining > 0;

    return {
      characterId: charKey,
      characterName: CHARACTERS[charKey]?.name || charKey,
      usageCount: record.usageCount || 0,
      limit: FREE_USAGE_LIMIT,
      usesRemaining,
      isUnlocked: Boolean(record.isUnlocked),
      unlockedVia: record.unlockedVia,
      unlockedAt: record.unlockedAt,
      canPlay
    };
  }

  // Get license status for all known characters synchronously/asynchronously
  async getAllCharacterLicenses(userId) {
    const allChars = Object.keys(CHARACTERS);
    const results = {};
    for (const charId of allChars) {
      results[charId] = await this.getCharacterLicense(userId, charId);
    }
    return results;
  }

  // Synchronous read from local cache for instant UI rendering
  getLicenseSync(userId, characterId) {
    const charKey = (characterId || 'chynaman').toLowerCase();
    const localData = this._getLocalData(userId);
    const record = localData[charKey] || {
      usageCount: 0,
      isUnlocked: false,
      unlockedVia: null
    };

    const usesRemaining = record.isUnlocked
      ? Infinity
      : Math.max(0, FREE_USAGE_LIMIT - (record.usageCount || 0));

    return {
      characterId: charKey,
      characterName: CHARACTERS[charKey]?.name || charKey,
      usageCount: record.usageCount || 0,
      limit: FREE_USAGE_LIMIT,
      usesRemaining,
      isUnlocked: Boolean(record.isUnlocked),
      unlockedVia: record.unlockedVia,
      canPlay: record.isUnlocked || usesRemaining > 0
    };
  }

  // Check if player has at least one playable character available (async)
  async hasAnyPlayableCharacter(userId) {
    for (const charKey of Object.keys(CHARACTERS)) {
      const lic = await this.getCharacterLicense(userId, charKey);
      if (lic.canPlay) return true;
    }
    return false;
  }

  // Check if player has at least one playable character available (sync)
  hasAnyPlayableCharacterSync(userId) {
    for (const charKey of Object.keys(CHARACTERS)) {
      const lic = this.getLicenseSync(userId, charKey);
      if (lic.canPlay) return true;
    }
    return false;
  }

  // Get the first playable character ID for a user, or null if all are locked
  getFirstPlayableCharacter(userId) {
    for (const charKey of Object.keys(CHARACTERS)) {
      const lic = this.getLicenseSync(userId, charKey);
      if (lic.canPlay) return charKey;
    }
    return null;
  }

  // Record a match usage when game starts
  async recordMatchUse(userId, characterId) {
    const charKey = (characterId || 'chynaman').toLowerCase();
    const localData = this._getLocalData(userId);
    const current = localData[charKey] || {
      usageCount: 0,
      isUnlocked: false,
      unlockedVia: null
    };

    // Increment usage count
    const newUsage = (current.usageCount || 0) + 1;
    current.usageCount = newUsage;
    localData[charKey] = current;
    this._saveLocalData(userId, localData);

    // Sync to Supabase if logged in
    if (userId && supabase) {
      try {
        await supabase
          .from('character_licenses')
          .upsert({
            user_id: userId,
            character_id: charKey,
            usage_count: newUsage,
            is_unlocked: current.isUnlocked,
            unlocked_via: current.unlockedVia,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,character_id' });
      } catch (e) {
        console.warn('Failed to sync character match usage to Supabase', e);
      }
    }

    return this.getLicenseSync(userId, charKey);
  }

  // Purchase character permanent access via in-game wallet (Gold or Gems)
  async purchaseCharacter(userId, characterId, currency = 'gold') {
    const charKey = (characterId || 'chynaman').toLowerCase();
    const prices = CHARACTER_PRICES[charKey] || { gold: 1500, gems: 150 };
    const cost = prices[currency] || prices.gold;

    if (userId) {
      const res = await economyService.modifyWallet(
        userId,
        currency,
        -cost,
        'character_unlock',
        charKey
      );

      if (!res.success && !res.localOnly) {
        return { success: false, error: res.error || `Insufficient ${currency} balance.` };
      }
    } else {
      // Guest wallet deduction in localStorage to prevent unauthorized free unlocks
      let localGold = 500;
      let localGems = 50;
      try {
        const raw = localStorage.getItem('tcg_local_wallet');
        if (raw) {
          const parsed = JSON.parse(raw);
          localGold = parsed.gold ?? 500;
          localGems = parsed.gems ?? 50;
        }
      } catch {}

      const currentBalance = currency === 'gems' ? localGems : localGold;
      if (currentBalance < cost) {
        return { success: false, error: `Insufficient ${currency.toUpperCase()} balance (${currentBalance}/${cost}). Please earn more or sign in.` };
      }

      try {
        const newGold = currency === 'gold' ? localGold - cost : localGold;
        const newGems = currency === 'gems' ? localGems - cost : localGems;
        localStorage.setItem('tcg_local_wallet', JSON.stringify({ gold: newGold, gems: newGems }));
      } catch {}
    }

    // Mark as permanently unlocked
    const localData = this._getLocalData(userId);
    localData[charKey] = {
      ...(localData[charKey] || {}),
      isUnlocked: true,
      unlockedVia: `store_${currency}`,
      unlockedAt: new Date().toISOString()
    };
    this._saveLocalData(userId, localData);

    if (userId && supabase) {
      try {
        await supabase
          .from('character_licenses')
          .upsert({
            user_id: userId,
            character_id: charKey,
            is_unlocked: true,
            unlocked_via: `store_${currency}`,
            unlocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,character_id' });
      } catch (err) {
        console.warn('Failed to upsert character purchase to Supabase', err);
      }
    }

    return {
      success: true,
      characterId: charKey,
      message: `Unlocked ${CHARACTERS[charKey]?.name || charKey} permanently!`
    };
  }

  // Redeem a QR Code or Promo String
  async redeemQRCode(userId, rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
      return { success: false, error: 'Invalid QR code.' };
    }

    const clean = rawInput.trim().toUpperCase();

    // Check for Universal VIP Unlock Code (unlocks all characters)
    if (clean === 'KTRL-ALL-PASS' || clean === 'KTRL-VIP-TOURNAMENT' || clean.includes('VIP_ALL_CHARACTERS')) {
      const localData = this._getLocalData(userId);
      for (const key of Object.keys(CHARACTERS)) {
        localData[key] = {
          ...(localData[key] || {}),
          isUnlocked: true,
          unlockedVia: 'qr_scan_vip',
          unlockedAt: new Date().toISOString()
        };
        if (userId && supabase) {
          try {
            await supabase.from('character_licenses').upsert({
              user_id: userId,
              character_id: key,
              is_unlocked: true,
              unlocked_via: 'qr_scan_vip',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,character_id' });
          } catch {}
        }
      }
      this._saveLocalData(userId, localData);
      return {
        success: true,
        allUnlocked: true,
        message: 'VIP Tournament Pass Verified! All characters permanently unlocked!'
      };
    }

    // Check specific character formats:
    // Format 1: KTRL-CHAR-[NAME]-[TOKEN] (e.g. KTRL-CHAR-CHYNAMAN-8892)
    // Format 2: UNLOCK-[NAME]
    // Format 3: JSON payload {"type": "char_unlock", "char": "..."}
    let targetChar = null;

    if (clean.startsWith('KTRL-CHAR-')) {
      const parts = clean.split('-');
      if (parts.length >= 3) {
        targetChar = parts[2].toLowerCase();
      }
    } else if (clean.startsWith('UNLOCK-')) {
      targetChar = clean.replace('UNLOCK-', '').toLowerCase();
    } else if (rawInput.includes('{') && rawInput.includes('}')) {
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.char || parsed.characterId) {
          targetChar = (parsed.char || parsed.characterId).toLowerCase();
        }
      } catch {}
    } else {
      // Check if code contains any character name directly
      for (const charKey of Object.keys(CHARACTERS)) {
        if (clean.includes(charKey.toUpperCase())) {
          targetChar = charKey;
          break;
        }
      }
    }

    if (!targetChar || !CHARACTERS[targetChar]) {
      return {
        success: false,
        error: 'Unrecognized QR code or character voucher. Please scan an authentic Kontrolla TCG QR code.'
      };
    }

    // Unlock the detected character
    const localData = this._getLocalData(userId);
    localData[targetChar] = {
      ...(localData[targetChar] || {}),
      isUnlocked: true,
      unlockedVia: 'qr_scan',
      unlockedAt: new Date().toISOString()
    };
    this._saveLocalData(userId, localData);

    if (userId && supabase) {
      try {
        await supabase
          .from('character_licenses')
          .upsert({
            user_id: userId,
            character_id: targetChar,
            is_unlocked: true,
            unlocked_via: 'qr_scan',
            unlocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,character_id' });
      } catch (err) {
        console.warn('Failed to record QR unlock in database', err);
      }
    }

    const charName = CHARACTERS[targetChar]?.name || targetChar;
    return {
      success: true,
      characterId: targetChar,
      characterName: charName,
      message: `QR Card Verified! ${charName} has been permanently unlocked for your account!`
    };
  }

  // Admin: Grant permanent access or reset/refill match quota
  async adminGrantCharacter(targetUserId, characterId, isUnlocked = true, resetCount = false) {
    const charKey = (characterId || 'chynaman').toLowerCase();
    const localData = this._getLocalData(targetUserId);
    const existing = localData[charKey] || { usageCount: 0, isUnlocked: false };

    const updated = {
      ...existing,
      isUnlocked: Boolean(isUnlocked),
      unlockedVia: isUnlocked ? 'admin_grant' : existing.unlockedVia,
      unlockedAt: isUnlocked ? new Date().toISOString() : existing.unlockedAt,
      usageCount: resetCount ? 0 : existing.usageCount
    };

    localData[charKey] = updated;
    this._saveLocalData(targetUserId, localData);

    if (targetUserId && supabase) {
      try {
        await supabase
          .from('character_licenses')
          .upsert({
            user_id: targetUserId,
            character_id: charKey,
            is_unlocked: updated.isUnlocked,
            unlocked_via: updated.unlockedVia,
            unlocked_at: updated.unlockedAt,
            usage_count: updated.usageCount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,character_id' });
      } catch (err) {
        console.error('Admin grant failed on database', err);
      }
    }

    return {
      success: true,
      message: `Admin successfully updated ${CHARACTERS[charKey]?.name || charKey} for user.`
    };
  }

  // Admin: Grant ALL characters to a user with 1 click
  async adminGrantAllCharacters(targetUserId, isUnlocked = true) {
    const localData = this._getLocalData(targetUserId);
    const now = new Date().toISOString();

    for (const charKey of Object.keys(CHARACTERS)) {
      const existing = localData[charKey] || { usageCount: 0, isUnlocked: false };
      localData[charKey] = {
        ...existing,
        isUnlocked: Boolean(isUnlocked),
        unlockedVia: isUnlocked ? 'admin_grant_all' : existing.unlockedVia,
        unlockedAt: isUnlocked ? now : existing.unlockedAt
      };

      if (targetUserId && supabase) {
        try {
          await supabase
            .from('character_licenses')
            .upsert({
              user_id: targetUserId,
              character_id: charKey,
              is_unlocked: Boolean(isUnlocked),
              unlocked_via: isUnlocked ? 'admin_grant_all' : (existing.unlockedVia || null),
              unlocked_at: isUnlocked ? now : (existing.unlockedAt || null),
              updated_at: now
            }, { onConflict: 'user_id,character_id' });
        } catch (e) {
          console.warn(`Database sync failed for ${charKey}:`, e);
        }
      }
    }

    this._saveLocalData(targetUserId, localData);
    return {
      success: true,
      message: `Successfully granted ALL ${Object.keys(CHARACTERS).length} playable characters to user!`
    };
  }

  // Admin: Reset/refill all character match quotas back to 10
  async adminResetAllQuotas(targetUserId) {
    const localData = this._getLocalData(targetUserId);
    const now = new Date().toISOString();

    for (const charKey of Object.keys(CHARACTERS)) {
      const existing = localData[charKey] || { usageCount: 0, isUnlocked: false };
      localData[charKey] = {
        ...existing,
        usageCount: 0
      };

      if (targetUserId && supabase) {
        try {
          await supabase
            .from('character_licenses')
            .upsert({
              user_id: targetUserId,
              character_id: charKey,
              usage_count: 0,
              updated_at: now
            }, { onConflict: 'user_id,character_id' });
        } catch (e) {}
      }
    }

    this._saveLocalData(targetUserId, localData);
    return {
      success: true,
      message: 'Successfully refilled all character match quotas to 10 free matches!'
    };
  }

  // Admin: Grant Gold and Gems to user wallet (both Supabase and local guest wallet)
  async adminGrantWallet(targetUserId, goldAmount = 5000, gemsAmount = 500) {
    // 1. Local wallet update
    let localGold = 500;
    let localGems = 50;
    try {
      const raw = localStorage.getItem('tcg_local_wallet');
      if (raw) {
        const p = JSON.parse(raw);
        localGold = p.gold ?? 500;
        localGems = p.gems ?? 50;
      }
      const newGold = localGold + goldAmount;
      const newGems = localGems + gemsAmount;
      localStorage.setItem('tcg_local_wallet', JSON.stringify({ gold: newGold, gems: newGems }));
    } catch {}

    // 2. Supabase wallet update if user exists
    if (targetUserId && targetUserId !== 'guest' && targetUserId !== 'admin_self') {
      try {
        await economyService.modifyWallet(targetUserId, 'gold', goldAmount, 'admin_grant', 'Admin Credit');
        await economyService.modifyWallet(targetUserId, 'gems', gemsAmount, 'admin_grant', 'Admin Credit');
      } catch (err) {
        console.warn('Failed to update remote wallet:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try { window.dispatchEvent(new CustomEvent('tcg_wallet_updated')); } catch (e) {}
    }

    this._notify();
    return {
      success: true,
      message: `Granted +${goldAmount.toLocaleString()} Gold & +${gemsAmount.toLocaleString()} Gems!`
    };
  }

  // Admin: Grant Master VIP Pass (All Characters + 10k Gold + 1k Gems + All Cosmetics)
  async adminGrantFullVIP(targetUserId, cosmeticsService = null) {
    await this.adminGrantAllCharacters(targetUserId, true);
    await this.adminResetAllQuotas(targetUserId);
    await this.adminGrantWallet(targetUserId, 10000, 1000);
    if (cosmeticsService && cosmeticsService.unlockAllCosmetics) {
      cosmeticsService.unlockAllCosmetics(targetUserId);
    }
    if (typeof window !== 'undefined') {
      try { window.dispatchEvent(new CustomEvent('tcg_wallet_updated')); } catch (e) {}
    }

    this._notify();
    return {
      success: true,
      message: '🌟 MASTER VIP GRANTED! All 7 Characters Unlocked + 10,000 Gold + 1,000 Gems + All Cosmetics!'
    };
  }

  // Admin: Generate a printable / displayable QR Code string
  generateQRPayload(characterId) {
    const charKey = (characterId || 'chynaman').toUpperCase();
    const randToken = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `KTRL-CHAR-${charKey}-${randToken}`;
  }
}

export const characterLicenseService = new CharacterLicenseService();

