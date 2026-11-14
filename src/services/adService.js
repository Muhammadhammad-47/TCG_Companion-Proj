// ============================================================================
// AD SYSTEM SERVICE (Placeholder & Real AdMob / AdSense / UnityAds Bridge)
// Handles interstitial and rewarded ads for game-end, revives, and bonuses
// ============================================================================

import { economyService } from './economyService';

export const PLACEHOLDER_ADS = [
  {
    id: 'ad_booster_box_s1',
    advertiser: 'Attention TCG Official Store',
    tagline: 'Physical Trading Card Game',
    title: 'ATTENTION TCG — SERIES 1 BOOSTER BOX',
    description: 'Collect all 60 physical foil cards! Scan the unique QR codes inside each booster pack to permanently unlock exclusive digital combat pilots in this app.',
    ctaText: 'VISIT STORE & SHOP DECKS',
    ctaUrl: 'https://attentiontcg.com',
    bonusGold: 50,
    accentColor: '#FBC80D',
    badgeText: 'PHYSICAL CARDS & QR UNLOCKS',
    imageType: 'booster'
  },
  {
    id: 'ad_master_vip_pass',
    advertiser: 'Kontrolla Pilot Headquarters',
    tagline: 'All-Warriors Unlock Pass',
    title: 'MASTER VIP 7-PILOT BUNDLE',
    description: 'Instant permanent unlock for Chynaman, Queeny, Bee, Katsumi, Poochi, Shroomy & Kiko, plus 10,000 Gold, 1,000 Gems, and all holographic cardbacks!',
    ctaText: 'OPEN IN-GAME STORE',
    ctaUrl: '#store',
    bonusGold: 50,
    accentColor: '#00f0ff',
    badgeText: 'INSTANT PILOT UNLOCK',
    imageType: 'vip'
  },
  {
    id: 'ad_discord_community',
    advertiser: 'Global Pilot League',
    tagline: 'Official Discord & Tournaments',
    title: 'COMPETE IN WEEKLY TOURNAMENTS',
    description: 'Join over 5,000 pilots in the official Attention TCG Discord! Weekly cash prizes, physical promo card giveaways, and meta deck strategies.',
    ctaText: 'JOIN OFFICIAL DISCORD',
    ctaUrl: 'https://discord.gg',
    bonusGold: 50,
    accentColor: '#39ff14',
    badgeText: 'COMMUNITY & CASH PRIZES',
    imageType: 'tournament'
  }
];

class AdService {
  constructor() {
    this.isEnabled = true;
    this.isTestMode = true;
    this.countdownSeconds = 5;
    this.adIndex = 0;
    this.lastAdTimestamp = 0;
    this.minimumIntervalMs = 15000; // 15s debounce
  }

  // Check if an ad should be displayed (rate-limited)
  canShowAd() {
    if (!this.isEnabled) return false;
    const now = Date.now();
    return now - this.lastAdTimestamp >= this.minimumIntervalMs;
  }

  // Record that an ad was shown
  recordAdShown() {
    this.lastAdTimestamp = Date.now();
  }

  // Get the next placeholder ad
  getNextAd() {
    const ad = PLACEHOLDER_ADS[this.adIndex % PLACEHOLDER_ADS.length];
    this.adIndex++;
    return ad;
  }

  // Reward player for watching ad (adds +50 Gold)
  async grantAdReward(userId, bonusGold = 50) {
    if (!userId) {
      // Local storage fallback for guests
      try {
        const raw = localStorage.getItem('tcg_local_wallet');
        let wallet = raw ? JSON.parse(raw) : { gold: 500, gems: 50 };
        wallet.gold = (wallet.gold || 0) + bonusGold;
        localStorage.setItem('tcg_local_wallet', JSON.stringify(wallet));
      } catch (e) {}
      return { success: true, bonusGold };
    }

    try {
      const res = await economyService.modifyWallet(userId, 'gold', bonusGold, 'ad_reward');
      return { success: true, bonusGold, newGold: res.new_balance };
    } catch (e) {
      console.warn('[AdService] Error granting reward:', e);
      return { success: false, error: e.message };
    }
  }
}

export const adService = new AdService();
export default adService;
