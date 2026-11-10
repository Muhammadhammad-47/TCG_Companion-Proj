import { supabase } from './supabaseClient';
import { economyService } from './economyService';
import { authService } from './authService';

// Local storage fallback keys
const LS_OWNED_COSMETICS = 'attention_tcg_owned_cosmetics';
const LS_EQUIPPED_COSMETICS = 'attention_tcg_equipped_cosmetics';
const LS_DAILY_REWARD_CLAIM = 'attention_tcg_daily_reward_claim';
const LS_DAILY_QUESTS = 'attention_tcg_daily_quests';

// ============================================================================
// COSMETICS & ECONOMY CATALOG
// ============================================================================

export const COSMETIC_FRAMES = [
  {
    id: 'frame_standard',
    name: 'Standard Gold',
    type: 'frame',
    rarity: 'Common',
    currency: 'gold',
    cost: 0,
    isDefault: true,
    borderColor: 'var(--neon-gold, #FBC80D)',
    glowColor: 'rgba(251, 200, 13, 0.5)',
    description: 'Standard combat-ready pilot frame.'
  },
  {
    id: 'frame_neon_cyan',
    name: 'Cyber Matrix Cyan',
    type: 'frame',
    rarity: 'Rare',
    currency: 'gold',
    cost: 600,
    borderColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.7)',
    description: 'Electrified cyan pulse border.'
  },
  {
    id: 'frame_crimson_dragon',
    name: 'Crimson Fury',
    type: 'frame',
    rarity: 'Epic',
    currency: 'gold',
    cost: 1200,
    borderColor: '#ff0055',
    glowColor: 'rgba(255, 0, 85, 0.8)',
    description: 'Burning red neon border of intense passion.'
  },
  {
    id: 'frame_void_purple',
    name: 'Void Shadow',
    type: 'frame',
    rarity: 'Epic',
    currency: 'gold',
    cost: 1500,
    borderColor: '#b5179e',
    glowColor: 'rgba(181, 23, 158, 0.8)',
    description: 'Ethereal shadow rift frame.'
  },
  {
    id: 'frame_pioneer',
    name: 'Cyber Pioneer',
    type: 'frame',
    rarity: 'Legendary',
    currency: 'gems',
    cost: 200,
    borderColor: '#7209b7',
    glowColor: 'rgba(114, 9, 183, 0.9)',
    description: 'Exclusive frame awarded to early pioneer pilots.'
  },
  {
    id: 'frame_tournament_champion',
    name: 'Apex Champion',
    type: 'frame',
    rarity: 'Prestige',
    currency: 'gems',
    cost: 350,
    borderColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 1)',
    animated: true,
    description: 'Prestige holographic champion border with victory aura.'
  }
];

export const COSMETIC_CARDBACKS = [
  {
    id: 'cardback_classic',
    name: 'Attention Classic',
    type: 'card_back',
    rarity: 'Common',
    currency: 'gold',
    cost: 0,
    isDefault: true,
    accentColor: '#FBC80D',
    pattern: 'radial-gradient(circle at center, #1b2838 0%, #050a14 100%)',
    description: 'Standard black obsidian battle sleeve.'
  },
  {
    id: 'cardback_cyber_neon',
    name: 'Cyber Neon Circuit',
    type: 'card_back',
    rarity: 'Rare',
    currency: 'gems',
    cost: 200,
    accentColor: '#00f0ff',
    pattern: 'linear-gradient(135deg, #030d22 0%, #003554 50%, #006494 100%)',
    description: 'Futuristic integrated circuit board pattern.'
  },
  {
    id: 'cardback_crimson_dragon',
    name: 'Crimson Dragon Scale',
    type: 'card_back',
    rarity: 'Epic',
    currency: 'gold',
    cost: 1200,
    accentColor: '#ff0055',
    pattern: 'linear-gradient(135deg, #2b0914 0%, #590d22 50%, #800f2f 100%)',
    description: 'Scales forged from ancient mythical dragons.'
  },
  {
    id: 'cardback_toxic_venom',
    name: 'Zombie Venom Spores',
    type: 'card_back',
    rarity: 'Rare',
    currency: 'gold',
    cost: 800,
    accentColor: '#39ff14',
    pattern: 'linear-gradient(135deg, #0d2818 0%, #164227 50%, #2d6a4f 100%)',
    description: 'Bioluminescent toxic spores sleeve.'
  },
  {
    id: 'cardback_golden_saigo',
    name: 'Royal Saigo Blitz',
    type: 'card_back',
    rarity: 'Legendary',
    currency: 'gems',
    cost: 350,
    accentColor: '#ffd700',
    pattern: 'linear-gradient(135deg, #3d2600 0%, #704700 50%, #b8860b 100%)',
    description: 'Gold foil finish with radiant lightning sigil.'
  }
];

export const COSMETIC_EMOTES = [
  { id: 'emote_gg', name: 'Good Game 🤝', emoji: '🤝', type: 'emote', cost: 300, currency: 'gold' },
  { id: 'emote_fire', name: 'On Fire! 🔥', emoji: '🔥', type: 'emote', cost: 400, currency: 'gold' },
  { id: 'emote_laugh', name: 'Mwahaha 😂', emoji: '😂', type: 'emote', cost: 400, currency: 'gold' },
  { id: 'emote_shock', name: 'Lightning Shock ⚡', emoji: '⚡', type: 'emote', cost: 400, currency: 'gold' },
  { id: 'emote_shield', name: 'Impenetrable 🛡️', emoji: '🛡️', type: 'emote', cost: 500, currency: 'gold' },
  { id: 'emote_flex', name: 'Unstoppable 💪', emoji: '💪', type: 'emote', cost: 80, currency: 'gems' }
];

export const COSMETIC_TITLES = [
  { id: 'title_pilot', name: 'Pilot', type: 'title', cost: 0, currency: 'gold', isDefault: true },
  { id: 'title_cyber_pioneer', name: 'Cyber Pioneer', type: 'title', cost: 150, currency: 'gems' },
  { id: 'title_arena_veteran', name: 'Arena Veteran', type: 'title', cost: 1000, currency: 'gold' },
  { id: 'title_tournament_champion', name: 'Tournament Champion', type: 'title', cost: 300, currency: 'gems' },
  { id: 'title_dragon_slayer', name: 'Dragon Slayer', type: 'title', cost: 250, currency: 'gems' }
];

export const GEM_PACKS = [
  { id: 'gem_pack_100', gems: 100, priceUsd: 0.99, title: 'Pouch of Gems', bonusText: null, popular: false },
  { id: 'gem_pack_550', gems: 550, priceUsd: 4.99, title: 'Sack of Gems', bonusText: '+10% Bonus', popular: false },
  { id: 'gem_pack_1200', gems: 1200, priceUsd: 9.99, title: 'Chest of Gems', bonusText: '+20% Bonus', popular: true },
  { id: 'gem_pack_2500', gems: 2500, priceUsd: 19.99, title: 'Vault of Gems', bonusText: '+25% Bonus', popular: false },
  { id: 'gem_pack_6500', gems: 6500, priceUsd: 49.99, title: 'Grand Hoard', bonusText: '+30% Bonus', popular: false }
];

export const FEATURED_BUNDLES = [
  {
    id: 'bundle_starter',
    title: 'Cyber Cadet Starter Pack',
    subtitle: 'Everything a new combat pilot needs to dominate the Arena!',
    priceUsd: 4.99,
    gemEquivalent: 250,
    canBuyWithGems: true,
    discountBadge: '80% VALUE',
    items: [
      { name: '💎 500 Gems', type: 'currency' },
      { name: '🪙 2,500 Gold', type: 'currency' },
      { name: 'Cyber Pioneer Frame', type: 'frame', id: 'frame_pioneer' },
      { name: 'Cyber Neon Circuit Card Back', type: 'card_back', id: 'cardback_cyber_neon' },
      { name: 'Cyber Pioneer Title', type: 'title', id: 'title_cyber_pioneer' }
    ]
  },
  {
    id: 'bundle_tournament_contender',
    title: 'Apex Contender Bundle',
    subtitle: 'Competitive package with credits and champion prestige frame.',
    priceUsd: 9.99,
    gemEquivalent: 500,
    canBuyWithGems: true,
    discountBadge: 'MOST POPULAR',
    items: [
      { name: '💎 1,200 Gems', type: 'currency' },
      { name: '🪙 5,000 Gold', type: 'currency' },
      { name: '🏆 50 Tournament Credits', type: 'currency' },
      { name: 'Apex Champion Frame', type: 'frame', id: 'frame_tournament_champion' }
    ]
  }
];

export const DAILY_LOGIN_SCHEDULE = [
  { day: 1, label: 'Day 1', rewardType: 'gold', amount: 100, icon: '🪙', title: '100 Gold' },
  { day: 2, label: 'Day 2', rewardType: 'gold', amount: 150, icon: '🪙', title: '150 Gold' },
  { day: 3, label: 'Day 3', rewardType: 'gems', amount: 20, icon: '💎', title: '20 Gems' },
  { day: 4, label: 'Day 4', rewardType: 'gold', amount: 250, icon: '🪙', title: '250 Gold' },
  { day: 5, label: 'Day 5', rewardType: 'gold', amount: 300, icon: '🪙', title: '300 Gold' },
  { day: 6, label: 'Day 6', rewardType: 'gems', amount: 50, icon: '💎', title: '50 Gems' },
  { day: 7, label: 'Day 7', rewardType: 'bundle', amount: 500, bonusGems: 25, bonusCredits: 25, icon: '🎁', title: 'Grand Cache: 500 Gold + 25 Gems + 25 Credits!' }
];

export const SEASON_CONFIG = {
  id: 'season_1',
  name: 'Season 1: Neon Vanguard',
  seasonNumber: 1,
  startDate: '2026-11-01',
  endDate: '2026-12-31',
  premiumPriceGems: 400,
  tiers: [
    {
      tier: 1,
      xpRequired: 100,
      freeReward: { type: 'gold', amount: 150, name: '150 Gold', icon: '🪙' },
      premiumReward: { type: 'gems', amount: 50, name: '50 Gems', icon: '💎' }
    },
    {
      tier: 2,
      xpRequired: 250,
      freeReward: { type: 'gold', amount: 200, name: '200 Gold', icon: '🪙' },
      premiumReward: { type: 'cosmetic', id: 'frame_neon_cyan', name: 'Cyber Matrix Cyan Frame', icon: '🖼️' }
    },
    {
      tier: 3,
      xpRequired: 450,
      freeReward: { type: 'gems', amount: 20, name: '20 Gems', icon: '💎' },
      premiumReward: { type: 'credits', amount: 25, name: '25 Tournament Credits', icon: '🏆' }
    },
    {
      tier: 4,
      xpRequired: 700,
      freeReward: { type: 'gold', amount: 300, name: '300 Gold', icon: '🪙' },
      premiumReward: { type: 'cosmetic', id: 'cardback_toxic_venom', name: 'Venom Spores Card Back', icon: '🃏' }
    },
    {
      tier: 5,
      xpRequired: 1000,
      freeReward: { type: 'credits', amount: 15, name: '15 Tournament Credits', icon: '🏆' },
      premiumReward: { type: 'gems', amount: 100, name: '100 Gems', icon: '💎' }
    },
    {
      tier: 6,
      xpRequired: 1400,
      freeReward: { type: 'gold', amount: 500, name: '500 Gold', icon: '🪙' },
      premiumReward: { type: 'cosmetic', id: 'title_cyber_pioneer', name: 'Cyber Pioneer Title', icon: '🎖️' }
    },
    {
      tier: 7,
      xpRequired: 1900,
      freeReward: { type: 'gems', amount: 50, name: '50 Gems', icon: '💎' },
      premiumReward: { type: 'credits', amount: 50, name: '50 Tournament Credits', icon: '🏆' }
    },
    {
      tier: 8,
      xpRequired: 2500,
      freeReward: { type: 'bundle', amount: 1000, bonusGems: 50, name: 'Vanguard Cache (1000 Gold + 50 Gems)', icon: '🎁' },
      premiumReward: { type: 'cosmetic', id: 'frame_tournament_champion', name: 'Apex Champion Halo Frame', icon: '👑' }
    }
  ]
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const cosmeticsService = {
  // 1. Get all owned cosmetics for user
  getOwnedCosmetics(userId = null) {
    const defaults = ['frame_standard', 'cardback_classic', 'title_pilot'];
    try {
      const stored = localStorage.getItem(`${LS_OWNED_COSMETICS}_${userId || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.from(new Set([...defaults, ...(Array.isArray(parsed) ? parsed : [])]));
      }
    } catch {}
    return defaults;
  },

  // 2. Add cosmetic to owned list
  addOwnedCosmetic(userId, cosmeticId) {
    const owned = this.getOwnedCosmetics(userId);
    if (!owned.includes(cosmeticId)) {
      owned.push(cosmeticId);
      try {
        localStorage.setItem(`${LS_OWNED_COSMETICS}_${userId || 'guest'}`, JSON.stringify(owned));
      } catch {}
    }
    return owned;
  },

  // Admin: Unlock ALL cosmetic items (Frames, Card Backs, Emotes, Titles)
  unlockAllCosmetics(userId = null) {
    const allIds = [
      ...COSMETIC_FRAMES.map(f => f.id),
      ...COSMETIC_CARDBACKS.map(cb => cb.id),
      ...COSMETIC_EMOTES.map(e => e.id),
      ...COSMETIC_TITLES.map(t => t.id)
    ];
    try {
      localStorage.setItem(`${LS_OWNED_COSMETICS}_${userId || 'guest'}`, JSON.stringify(allIds));
    } catch {}
    if (userId && supabase) {
      try {
        allIds.forEach(async (id) => {
          await supabase.from('user_cosmetics').upsert({ user_id: userId, cosmetic_id: id }, { onConflict: 'user_id,cosmetic_id' });
        });
      } catch {}
    }
    return allIds;
  },

  // 3. Get currently equipped cosmetics
  getEquippedCosmetics(userId = null) {
    const fallback = {
      frame: 'frame_standard',
      card_back: 'cardback_classic',
      title: 'title_pilot',
      emote: 'emote_gg'
    };
    try {
      const stored = localStorage.getItem(`${LS_EQUIPPED_COSMETICS}_${userId || 'guest'}`);
      if (stored) {
        return { ...fallback, ...JSON.parse(stored) };
      }
    } catch {}
    return fallback;
  },

  // 4. Equip cosmetic
  async equipCosmetic(userId, slot, cosmeticId) {
    const equipped = this.getEquippedCosmetics(userId);
    equipped[slot] = cosmeticId;
    try {
      localStorage.setItem(`${LS_EQUIPPED_COSMETICS}_${userId || 'guest'}`, JSON.stringify(equipped));
    } catch {}

    // Persist to Supabase if authenticated
    if (supabase && userId) {
      const colMap = {
        frame: 'equipped_frame',
        card_back: 'equipped_card_back',
        title: 'equipped_title',
        emote: 'equipped_emote'
      };
      const col = colMap[slot];
      if (col) {
        try {
          await supabase.from('profiles').update({ [col]: cosmeticId }).eq('id', userId);
        } catch (e) {
          console.warn('[Cosmetics] Failed to sync equip to Supabase:', e);
        }
      }
    }

    this.trackEvent('cosmetic_equipped', { userId, slot, cosmeticId });
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('cosmetics_updated', { detail: { slot, cosmeticId } }));
      } catch (e) {}
    }
    return equipped;
  },

  // 5. Purchase Cosmetic Item with Gold or Gems
  async purchaseCosmetic(userId, item) {
    if (!userId) return { success: false, error: 'Authentication required to purchase items.' };

    const owned = this.getOwnedCosmetics(userId);
    if (owned.includes(item.id)) {
      return { success: false, error: 'You already own this item!' };
    }

    const currency = item.currency || 'gold';
    const cost = item.cost || 0;

    if (cost > 0) {
      // Modify wallet via atomic economy service
      const res = await economyService.modifyWallet(userId, currency, -cost, 'cosmetic_purchase', item.id);
      if (!res.success) {
        return { success: false, error: res.error || `Insufficient ${currency} balance.` };
      }
    }

    // Grant item
    this.addOwnedCosmetic(userId, item.id);

    // Auto-equip on purchase
    if (item.type) {
      await this.equipCosmetic(userId, item.type, item.id);
    }

    this.trackEvent('store_purchase', { userId, itemId: item.id, currency, cost });
    return { success: true, item, message: `Successfully unlocked ${item.name}!` };
  },

  // 6. Purchase Gem Pack (IAP / Web Platform Checkout)
  async purchaseGemPack(userId, pack) {
    if (!userId) return { success: false, error: 'Authentication required for purchases.' };

    // Simulate platform store handshake & receipt generation
    await new Promise(r => setTimeout(r, 1200));

    const res = await economyService.modifyWallet(userId, 'gems', pack.gems, 'gem_pack_purchase', pack.id);
    if (!res.success && !res.localOnly) {
      return { success: false, error: res.error || 'Failed to credit Gems to wallet.' };
    }

    const receiptId = 'ATTN_IAP_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();

    this.trackEvent('gem_purchase', { userId, packId: pack.id, gems: pack.gems, priceUsd: pack.priceUsd, receiptId });
    return {
      success: true,
      gemsAwarded: pack.gems,
      receiptId,
      message: `Transaction verified! +${pack.gems} Gems added to your wallet.`
    };
  },

  // 7. Purchase Starter / Featured Bundle
  async purchaseBundle(userId, bundle, payWithGems = false) {
    if (!userId) return { success: false, error: 'Authentication required for bundles.' };

    if (payWithGems) {
      const res = await economyService.modifyWallet(userId, 'gems', -bundle.gemEquivalent, 'bundle_purchase_gems', bundle.id);
      if (!res.success) {
        return { success: false, error: res.error || 'Insufficient Gems balance.' };
      }
    } else {
      // Simulated USD IAP flow
      await new Promise(r => setTimeout(r, 1200));
    }

    // Grant all bundle items
    for (const it of bundle.items) {
      if (it.name.includes('Gems')) {
        const amt = parseInt(it.name.replace(/\D/g, ''), 10) || 500;
        await economyService.modifyWallet(userId, 'gems', amt, 'bundle_grant', bundle.id);
      } else if (it.name.includes('Gold')) {
        const amt = parseInt(it.name.replace(/\D/g, ''), 10) || 2500;
        await economyService.modifyWallet(userId, 'gold', amt, 'bundle_grant', bundle.id);
      } else if (it.name.includes('Credits')) {
        const amt = parseInt(it.name.replace(/\D/g, ''), 10) || 50;
        await economyService.modifyWallet(userId, 'tournament_credits', amt, 'bundle_grant', bundle.id);
      } else if (it.id) {
        this.addOwnedCosmetic(userId, it.id);
        if (it.type) await this.equipCosmetic(userId, it.type, it.id);
      }
    }

    this.trackEvent('bundle_purchase', { userId, bundleId: bundle.id, payWithGems });
    return {
      success: true,
      message: `Bundle Unlocked! All rewards and exclusive cosmetics have been added to your inventory.`
    };
  },

  // 8. Daily Login Reward Status
  getDailyRewardStatus(userId = null) {
    const key = `${LS_DAILY_REWARD_CLAIM}_${userId || 'guest'}`;
    let record = { streak: 0, lastClaimDate: null };
    try {
      const stored = localStorage.getItem(key);
      if (stored) record = JSON.parse(stored);
    } catch {}

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    const alreadyClaimedToday = record.lastClaimDate === todayStr;

    // Check if streak was broken (missed more than 1 calendar day)
    let isStreakActive = true;
    if (record.lastClaimDate) {
      const last = new Date(record.lastClaimDate);
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 2) {
        isStreakActive = false;
      }
    }

    const currentStreak = isStreakActive ? (record.streak % 7) : 0;
    const nextClaimDay = alreadyClaimedToday ? currentStreak : currentStreak + 1;

    return {
      canClaimToday: !alreadyClaimedToday,
      alreadyClaimedToday,
      currentDay: Math.max(1, Math.min(7, nextClaimDay)),
      streakCount: isStreakActive ? record.streak : 0,
      todayStr
    };
  },

  // 9. Claim Daily Reward
  async claimDailyReward(userId = null) {
    const status = this.getDailyRewardStatus(userId);
    if (!status.canClaimToday) {
      return { success: false, error: 'You have already claimed today\'s daily login reward!' };
    }

    const dayReward = DAILY_LOGIN_SCHEDULE[status.currentDay - 1] || DAILY_LOGIN_SCHEDULE[0];

    // Grant currency
    if (dayReward.rewardType === 'gold') {
      await economyService.modifyWallet(userId, 'gold', dayReward.amount, 'daily_login_reward');
    } else if (dayReward.rewardType === 'gems') {
      await economyService.modifyWallet(userId, 'gems', dayReward.amount, 'daily_login_reward');
    } else if (dayReward.rewardType === 'bundle') {
      await economyService.modifyWallet(userId, 'gold', dayReward.amount, 'daily_login_reward');
      if (dayReward.bonusGems) await economyService.modifyWallet(userId, 'gems', dayReward.bonusGems, 'daily_login_reward');
      if (dayReward.bonusCredits) await economyService.modifyWallet(userId, 'tournament_credits', dayReward.bonusCredits, 'daily_login_reward');
    }

    // Save claim
    const key = `${LS_DAILY_REWARD_CLAIM}_${userId || 'guest'}`;
    const nextStreak = status.streakCount + 1;
    try {
      localStorage.setItem(key, JSON.stringify({ streak: nextStreak, lastClaimDate: status.todayStr }));
    } catch {}

    this.trackEvent('daily_reward_claimed', { userId, day: status.currentDay, reward: dayReward.title });
    return {
      success: true,
      day: status.currentDay,
      reward: dayReward,
      message: `Day ${status.currentDay} Reward Claimed: ${dayReward.title}!`
    };
  },

  // 10. Daily Quests Tracker
  getDailyQuests(userId = null) {
    const key = `${LS_DAILY_QUESTS}_${userId || 'guest'}`;
    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    let data = null;
    try {
      const stored = localStorage.getItem(key);
      if (stored) data = JSON.parse(stored);
    } catch {}

    if (!data || data.date !== todayStr) {
      // New day: generate fresh quests
      data = {
        date: todayStr,
        quests: [
          { id: 'q_play_1', title: 'Arena Combatant', desc: 'Play 1 multiplayer match', target: 1, current: 0, rewardGold: 100, rewardGems: 0, claimed: false },
          { id: 'q_win_1', title: 'Victorious Strike', desc: 'Win 1 match in the arena', target: 1, current: 0, rewardGold: 150, rewardGems: 10, claimed: false },
          { id: 'q_cards_3', title: 'Tactical Deployer', desc: 'Play 3 Action Cards in combat', target: 3, current: 0, rewardGold: 100, rewardGems: 0, claimed: false }
        ]
      };
      try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    }

    return data.quests;
  },

  // 11. Claim Quest Reward
  async claimQuestReward(userId, questId) {
    const quests = this.getDailyQuests(userId);
    const q = quests.find(item => item.id === questId);
    if (!q) return { success: false, error: 'Quest not found.' };
    if (q.current < q.target) return { success: false, error: 'Quest requirements not met yet.' };
    if (q.claimed) return { success: false, error: 'Reward already claimed.' };

    q.claimed = true;
    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
    const key = `${LS_DAILY_QUESTS}_${userId || 'guest'}`;
    try {
      localStorage.setItem(key, JSON.stringify({ date: todayStr, quests }));
    } catch {}

    if (q.rewardGold) await economyService.modifyWallet(userId, 'gold', q.rewardGold, 'quest_reward', questId);
    if (q.rewardGems) await economyService.modifyWallet(userId, 'gems', q.rewardGems, 'quest_reward', questId);

    this.trackEvent('quest_claimed', { userId, questId, rewardGold: q.rewardGold, rewardGems: q.rewardGems });
    return {
      success: true,
      message: `Claimed quest reward: +${q.rewardGold} Gold${q.rewardGems ? ` and +${q.rewardGems} Gems` : ''}!`
    };
  },

  // 12. Record match progress for daily quests
  recordMatchProgress(userId, won = false) {
    const quests = this.getDailyQuests(userId);
    let changed = false;
    for (const q of quests) {
      if (q.id === 'q_play_1' && q.current < q.target) {
        q.current += 1;
        changed = true;
      }
      if (won && q.id === 'q_win_1' && q.current < q.target) {
        q.current += 1;
        changed = true;
      }
    }
    if (changed) {
      const now = new Date();
      const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
      const key = `${LS_DAILY_QUESTS}_${userId || 'guest'}`;
      try { localStorage.setItem(key, JSON.stringify({ date: todayStr, quests })); } catch {}
    }
  },

  // 13. Record action card played for daily quest
  recordCardPlayed(userId) {
    const quests = this.getDailyQuests(userId);
    let changed = false;
    for (const q of quests) {
      if (q.id === 'q_cards_3' && q.current < q.target) {
        q.current += 1;
        changed = true;
      }
    }
    if (changed) {
      const now = new Date();
      const todayStr = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
      const key = `${LS_DAILY_QUESTS}_${userId || 'guest'}`;
      try { localStorage.setItem(key, JSON.stringify({ date: todayStr, quests })); } catch {}
    }
  },

  // 14. Structured Analytics Event Logger
  trackEvent(eventName, payload) {
    try {
      console.log(`[Analytics Event] ${eventName}:`, payload);
      // Can be integrated with PostHog, Mixpanel, or Supabase telemetry table
    } catch {}
  },

  // 15. Season Pass state getter
  getSeasonPassState(userId = null) {
    const key = `attention_tcg_season_pass_${SEASON_CONFIG.id}_${userId || 'guest'}`;
    let state = {
      xp: 0,
      isPremium: false,
      claimedFreeTiers: [],
      claimedPremiumTiers: []
    };
    try {
      const stored = localStorage.getItem(key);
      if (stored) state = { ...state, ...JSON.parse(stored) };
    } catch {}

    // Calculate current reached tier
    let currentTier = 0;
    for (const t of SEASON_CONFIG.tiers) {
      if (state.xp >= t.xpRequired) {
        currentTier = t.tier;
      }
    }

    const nextTierObj = SEASON_CONFIG.tiers.find(t => t.tier === currentTier + 1);
    const prevTierXP = currentTier > 0 ? (SEASON_CONFIG.tiers.find(t => t.tier === currentTier)?.xpRequired || 0) : 0;
    const nextTierXP = nextTierObj ? nextTierObj.xpRequired : (SEASON_CONFIG.tiers[SEASON_CONFIG.tiers.length - 1].xpRequired);
    const progressPercent = nextTierObj
      ? Math.min(100, Math.max(0, Math.round(((state.xp - prevTierXP) / (nextTierXP - prevTierXP)) * 100)))
      : 100;

    return {
      ...state,
      currentTier,
      maxTier: SEASON_CONFIG.tiers.length,
      nextTierXP,
      progressPercent,
      season: SEASON_CONFIG
    };
  },

  // 16. Add Season Pass XP
  addSeasonXP(userId, amount) {
    if (!amount || amount <= 0) return;
    const state = this.getSeasonPassState(userId);
    const newXP = state.xp + amount;
    const key = `attention_tcg_season_pass_${SEASON_CONFIG.id}_${userId || 'guest'}`;
    const updated = {
      ...state,
      xp: newXP
    };
    try {
      localStorage.setItem(key, JSON.stringify({
        xp: updated.xp,
        isPremium: updated.isPremium,
        claimedFreeTiers: updated.claimedFreeTiers,
        claimedPremiumTiers: updated.claimedPremiumTiers
      }));
    } catch {}
    this.trackEvent('season_xp_gained', { userId, amount, totalXP: newXP });
    return this.getSeasonPassState(userId);
  },

  // 17. Upgrade to Premium Pass with Gems
  async upgradeToPremiumPass(userId) {
    if (!userId) return { success: false, error: 'Authentication required to upgrade Season Pass.' };
    const cost = SEASON_CONFIG.premiumPriceGems;
    const res = await economyService.modifyWallet(userId, 'gems', -cost, 'season_pass_upgrade', SEASON_CONFIG.id);
    if (!res.success) {
      return { success: false, error: res.error || `Insufficient Gems (Requires ${cost} Gems).` };
    }

    const key = `attention_tcg_season_pass_${SEASON_CONFIG.id}_${userId || 'guest'}`;
    const state = this.getSeasonPassState(userId);
    state.isPremium = true;
    try {
      localStorage.setItem(key, JSON.stringify({
        xp: state.xp,
        isPremium: true,
        claimedFreeTiers: state.claimedFreeTiers,
        claimedPremiumTiers: state.claimedPremiumTiers
      }));
    } catch {}

    this.trackEvent('season_pass_purchased', { userId, seasonId: SEASON_CONFIG.id, costGems: cost });
    return { success: true, message: `Upgraded to ${SEASON_CONFIG.name} Premium Pass! Premium track unlocked.` };
  },

  // 18. Claim Tier Reward
  async claimSeasonReward(userId, tierNumber, isPremiumTrack = false) {
    const state = this.getSeasonPassState(userId);
    const tierConfig = SEASON_CONFIG.tiers.find(t => t.tier === tierNumber);
    if (!tierConfig) return { success: false, error: 'Tier not found.' };

    if (state.currentTier < tierNumber) {
      return { success: false, error: `You need ${tierConfig.xpRequired} XP to unlock Tier ${tierNumber} (Current XP: ${state.xp}).` };
    }

    if (isPremiumTrack && !state.isPremium) {
      return { success: false, error: 'Premium Pass required to claim rewards on this track.' };
    }

    const claimedList = isPremiumTrack ? state.claimedPremiumTiers : state.claimedFreeTiers;
    if (claimedList.includes(tierNumber)) {
      return { success: false, error: 'Reward already claimed!' };
    }

    const reward = isPremiumTrack ? tierConfig.premiumReward : tierConfig.freeReward;
    if (!reward) return { success: false, error: 'No reward found for this tier.' };

    // Grant reward
    if (reward.type === 'gold') {
      await economyService.modifyWallet(userId, 'gold', reward.amount, 'season_pass_reward', `tier_${tierNumber}`);
    } else if (reward.type === 'gems') {
      await economyService.modifyWallet(userId, 'gems', reward.amount, 'season_pass_reward', `tier_${tierNumber}`);
    } else if (reward.type === 'credits') {
      await economyService.modifyWallet(userId, 'tournament_credits', reward.amount, 'season_pass_reward', `tier_${tierNumber}`);
    } else if (reward.type === 'bundle') {
      await economyService.modifyWallet(userId, 'gold', reward.amount, 'season_pass_reward', `tier_${tierNumber}`);
      if (reward.bonusGems) await economyService.modifyWallet(userId, 'gems', reward.bonusGems, 'season_pass_reward', `tier_${tierNumber}`);
    } else if (reward.type === 'cosmetic' && reward.id) {
      this.addOwnedCosmetic(userId, reward.id);
    }

    // Save claim
    claimedList.push(tierNumber);
    const key = `attention_tcg_season_pass_${SEASON_CONFIG.id}_${userId || 'guest'}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        xp: state.xp,
        isPremium: state.isPremium,
        claimedFreeTiers: state.claimedFreeTiers,
        claimedPremiumTiers: state.claimedPremiumTiers
      }));
    } catch {}

    this.trackEvent('season_reward_claimed', { userId, tier: tierNumber, isPremiumTrack, reward: reward.name });
    return { success: true, reward, message: `Claimed Tier ${tierNumber}: ${reward.name}!` };
  }
};
