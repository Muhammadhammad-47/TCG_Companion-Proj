import React, { useState, useEffect } from 'react';
import {
  X, ShoppingCart, Sparkles, Trophy, Gift, Check, Shield, Flame,
  Zap, Crown, Coins, Tag, ArrowRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { authService } from '../services/authService';
import { economyService } from '../services/economyService';
import {
  cosmeticsService,
  COSMETIC_FRAMES,
  COSMETIC_CARDBACKS,
  COSMETIC_EMOTES,
  COSMETIC_TITLES,
  GEM_PACKS,
  FEATURED_BUNDLES,
  DAILY_LOGIN_SCHEDULE,
  SEASON_CONFIG
} from '../services/cosmeticsService';
import { CHARACTERS, getAssetUrl } from '../game/data/characters';
import { characterLicenseService, CHARACTER_PRICES, FREE_USAGE_LIMIT } from '../services/characterLicenseService';
import PlayerAvatar from './PlayerAvatar';

export const StoreModal = ({ isOpen, onClose, userProfile, onPurchaseComplete, initialTab = 'featured' }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'featured' | 'characters' | 'season_pass' | 'gems' | 'gold_items' | 'gem_items' | 'daily' | 'promo'

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [wallet, setWallet] = useState({ gold: 500, gems: 50, tournament_credits: 0, crystals: 0 });
  const [characterLicenses, setCharacterLicenses] = useState({});
  const [ownedCosmetics, setOwnedCosmetics] = useState([]);
  const [equippedCosmetics, setEquippedCosmetics] = useState({});
  const [dailyStatus, setDailyStatus] = useState(null);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [seasonPassState, setSeasonPassState] = useState(null);
  
  // Purchase confirmation modal state
  const [confirmItem, setConfirmItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Promo code & legacy bundles
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState({ text: '', type: '' });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [diamondBundles, setDiamondBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);

  const userId = userProfile?.id || null;
  const isAdmin = Boolean(
    userProfile?.is_admin ||
    userProfile?.role === 'admin' ||
    (typeof window !== 'undefined' && localStorage.getItem('tcg_admin_mode') === 'true')
  );

  // Refresh wallet and inventory
  const refreshData = async () => {
    if (userId) {
      const balances = await economyService.getWalletBalances(userId);
      setWallet(balances);
    } else {
      let gGold = 500;
      let gGems = 50;
      try {
        const raw = localStorage.getItem('tcg_local_wallet');
        if (raw) {
          const p = JSON.parse(raw);
          gGold = p.gold ?? 500;
          gGems = p.gems ?? 50;
        }
      } catch {}
      setWallet({
        gold: userProfile?.gold ?? gGold,
        gems: userProfile?.gems ?? gGems,
        tournament_credits: userProfile?.tournament_credits ?? 0,
        crystals: userProfile?.crystals_collected ?? userProfile?.crystals ?? 0
      });
    }

    try {
      const lics = await characterLicenseService.getAllCharacterLicenses(userId);
      setCharacterLicenses(lics);
    } catch {}

    const owned = cosmeticsService.getOwnedCosmetics(userId);
    setOwnedCosmetics(owned);

    const equipped = cosmeticsService.getEquippedCosmetics(userId);
    setEquippedCosmetics(equipped);

    const dStatus = cosmeticsService.getDailyRewardStatus(userId);
    setDailyStatus(dStatus);

    const quests = cosmeticsService.getDailyQuests(userId);
    setDailyQuests(quests);

    const spState = cosmeticsService.getSeasonPassState(userId);
    setSeasonPassState(spState);
  };

  const handlePurchaseCharacter = async (charId, currency = 'gold') => {
    setIsProcessing(true);
    try {
      const res = await characterLicenseService.purchaseCharacter(userId, charId, currency);
      if (res.success) {
        showToast(res.message, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete();
      } else {
        showToast(res.error || 'Failed to unlock character.', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Purchase error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminGrantAllCharacters = async () => {
    setIsProcessing(true);
    try {
      const res = await characterLicenseService.adminGrantAllCharacters(userId || 'guest', true);
      showToast(res.message, 'success');
      await refreshData();
      if (onPurchaseComplete) onPurchaseComplete();
    } catch (e) {
      showToast('Admin grant failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeSeasonPass = async () => {
    if (!userId) {
      showToast('Please log in to upgrade your Season Pass.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.upgradeToPremiumPass(userId);
      if (res.success) {
        showToast(res.message, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete();
      } else {
        showToast(res.error || 'Failed to upgrade Season Pass.', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Error upgrading pass.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimSeasonReward = async (tierNumber, isPremiumTrack) => {
    if (!userId) {
      showToast('Please log in to claim Season rewards.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.claimSeasonReward(userId, tierNumber, isPremiumTrack);
      if (res.success) {
        showToast(res.message, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete();
      } else {
        showToast(res.error || 'Failed to claim reward.', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Error claiming reward.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();

    // Fetch legacy diamond bundles
    setLoadingBundles(true);
    economyService.getStoreBundles().then(data => {
      setDiamondBundles(data || []);
      setLoadingBundles(false);
    }).catch(() => setLoadingBundles(false));
  }, [isOpen, userId]);

  const showToast = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3800);
  };

  // 1. Purchase Gem Pack (Simulated App Store / Google Play / Web IAP)
  const handleBuyGemPack = async (pack) => {
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.purchaseGemPack(userId, pack);
      if (res.success) {
        showToast(`🎉 ${res.message} (Receipt: ${res.receiptId})`, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete(pack.gems);
      } else {
        showToast(res.error || 'Transaction could not be completed.', 'error');
      }
    } catch (e) {
      showToast('Purchase error: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
      setConfirmItem(null);
    }
  };

  // 2. Purchase Bundle
  const handleBuyBundle = async (bundle, payWithGems = false) => {
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.purchaseBundle(userId, bundle, payWithGems);
      if (res.success) {
        showToast(`✨ ${res.message}`, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete(0);
      } else {
        showToast(res.error || 'Failed to unlock bundle.', 'error');
      }
    } catch (e) {
      showToast('Bundle purchase failed: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
      setConfirmItem(null);
    }
  };

  // 3. Purchase Cosmetic Item with Gold or Gems
  const handleBuyCosmetic = async (item) => {
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.purchaseCosmetic(userId, item);
      if (res.success) {
        showToast(`🎉 ${res.message} Equipped to your pilot profile!`, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete(0);
      } else {
        showToast(res.error || 'Purchase failed.', 'error');
      }
    } catch (e) {
      showToast('Purchase error: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
      setConfirmItem(null);
    }
  };

  // 4. Equip / Unequip Cosmetic Item
  const handleEquip = async (slot, cosmeticId) => {
    try {
      await cosmeticsService.equipCosmetic(userId, slot, cosmeticId);
      await refreshData();
      showToast('Cosmetic equipped!', 'info');
    } catch (e) {
      showToast('Failed to equip item.', 'error');
    }
  };

  // 5. Claim Daily Login Reward
  const handleClaimDailyReward = async () => {
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.claimDailyReward(userId);
      if (res.success) {
        showToast(`🎁 ${res.message}`, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete(0);
      } else {
        showToast(res.error || 'Could not claim daily reward.', 'error');
      }
    } catch (e) {
      showToast('Daily claim error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Claim Daily Quest
  const handleClaimQuest = async (questId) => {
    setIsProcessing(true);
    try {
      const res = await cosmeticsService.claimQuestReward(userId, questId);
      if (res.success) {
        cosmeticsService.addSeasonXP(userId, 50);
        showToast(`⭐ ${res.message} (+50 Season XP)`, 'success');
        await refreshData();
        if (onPurchaseComplete) onPurchaseComplete(0);
      } else {
        showToast(res.error || 'Could not claim quest reward.', 'error');
      }
    } catch (e) {
      showToast('Quest claim error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Promo Code Redemption
  const handleRedeemPromo = async () => {
    if (!userId || !promoCode.trim() || isRedeeming) return;
    setIsRedeeming(true);
    setPromoMsg({ text: 'Verifying code...', type: 'info' });

    const res = await economyService.redeemCode(userId, promoCode.trim());
    if (res.success) {
      setPromoMsg({ text: res.message, type: 'success' });
      setPromoCode('');
      await refreshData();
      if (onPurchaseComplete) onPurchaseComplete(0);
    } else {
      setPromoMsg({ text: res.message, type: 'error' });
    }
    setIsRedeeming(false);
  };

  // 8. Purchase Diamond Bundle (Legacy)
  const handlePurchaseDiamondBundle = async (bundle) => {
    if (!userId) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1200));

    const success = await authService.savePlayerMatchResult(userId, {
      won: false,
      crystalsDelta: bundle.crystal_amount,
      appSource: 'store_diamond_bundle'
    });

    setIsProcessing(false);
    if (success) {
      showToast(`💎 Added ${bundle.crystal_amount} Diamonds to your account!`, 'success');
      await refreshData();
      if (onPurchaseComplete) onPurchaseComplete(bundle.crystal_amount);
    } else {
      showToast('Failed to credit diamonds.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Barlow Condensed, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          height: '92vh',
          maxHeight: '820px',
          background: 'linear-gradient(135deg, rgba(10, 18, 38, 0.98) 0%, rgba(4, 8, 20, 0.99) 100%)',
          border: '2px solid var(--neon-gold, #FBC80D)',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 0 50px rgba(251, 200, 13, 0.3)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,85,0.4)'; e.currentTarget.style.borderColor = '#ff0055'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        >
          <X size={20} />
        </button>

        {/* HEADER: Title & Multi-Currency Live Wallet Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid rgba(251,200,13,0.2)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(251,200,13,0.2) 0%, rgba(255,100,0,0.1) 100%)',
              border: '1.5px solid var(--neon-gold, #FBC80D)',
              borderRadius: '12px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingCart size={28} color="var(--neon-gold, #FBC80D)" />
            </div>
            <div>
              <h2 style={{
                color: 'var(--neon-gold, #FBC80D)',
                margin: 0,
                fontSize: '2rem',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '2px',
                lineHeight: 1
              }}>
                ATTENTION TCG STORE & VAULT
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Equip cosmetics, purchase gems, and claim daily rewards
              </div>
            </div>
          </div>

          {/* Wallet Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div title="Gold: Earned from matches and daily rewards" style={{
              background: 'rgba(251, 200, 13, 0.12)',
              border: '1px solid rgba(251, 200, 13, 0.4)',
              borderRadius: '16px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              <span style={{ fontSize: '1rem' }}>🪙</span>
              <span style={{ color: 'var(--neon-gold, #FBC80D)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {wallet.gold.toLocaleString()}
              </span>
            </div>

            <div title="Gems: Premium store currency" style={{
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              borderRadius: '16px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              <span style={{ fontSize: '1rem' }}>💎</span>
              <span style={{ color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {wallet.gems.toLocaleString()}
              </span>
            </div>

            <div title="Tournament Credits: Earned from tournaments" style={{
              background: 'rgba(157, 78, 221, 0.15)',
              border: '1px solid rgba(157, 78, 221, 0.4)',
              borderRadius: '16px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              <span style={{ fontSize: '1rem' }}>🏆</span>
              <span style={{ color: '#c77dff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {wallet.tournament_credits.toLocaleString()}
              </span>
            </div>

            <div title="Diamonds: Match toll bypass" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              <span style={{ fontSize: '0.9rem' }}>💠</span>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                {wallet.crystals.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'error' ? 'rgba(255,0,85,0.95)' : 'rgba(10,40,25,0.95)',
            border: `1.5px solid ${notification.type === 'error' ? '#ff0055' : '#39ff14'}`,
            borderRadius: '12px',
            padding: '10px 24px',
            color: '#fff',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 'bold',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.2s ease'
          }}>
            {notification.type === 'error' ? <AlertCircle size={20} color="#fff" /> : <CheckCircle2 size={20} color="#39ff14" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'featured', label: '⭐ FEATURED & BUNDLES' },
            { id: 'characters', label: '🛡️ PLAYABLE WARRIORS' },
            { id: 'season_pass', label: '⚡ SEASON PASS' },
            { id: 'gems', label: '💎 BUY GEMS (IAP)' },
            { id: 'gold_items', label: '🪙 GOLD ITEMS' },
            { id: 'gem_items', label: '🔮 GEM COSMETICS' },
            { id: 'daily', label: '🎁 DAILY REWARDS & QUESTS' },
            { id: 'promo', label: '🏷️ PROMO & DIAMONDS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(251,200,13,0.2) 0%, rgba(255,100,0,0.1) 100%)' : 'rgba(255,255,255,0.04)',
                border: activeTab === tab.id ? '1.5px solid var(--neon-gold, #FBC80D)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '8px 16px',
                color: activeTab === tab.id ? 'var(--neon-gold, #FBC80D)' : 'rgba(255,255,255,0.7)',
                fontWeight: 'bold',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.05rem',
                cursor: 'pointer',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FEATURED OFFERS & BUNDLES */}
        {activeTab === 'featured' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {FEATURED_BUNDLES.map(bundle => (
                <div
                  key={bundle.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 30, 60, 0.8) 0%, rgba(10, 15, 35, 0.95) 100%)',
                    border: '2px solid var(--neon-gold, #FBC80D)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 8px 30px rgba(251, 200, 13, 0.2)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'linear-gradient(90deg, #ff0055 0%, #ff5500 100%)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}>
                    {bundle.discountBadge}
                  </div>

                  <div style={{ fontSize: '1.6rem', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px', marginBottom: '4px' }}>
                    {bundle.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                    {bundle.subtitle}
                  </div>

                  {/* Included Items */}
                  <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      INCLUDES:
                    </div>
                    {bundle.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: '#fff' }}>
                        <Check size={16} color="#39ff14" />
                        <span>{it.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setConfirmItem({ type: 'bundle_usd', bundle })}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(90deg, #39ff14 0%, #00cc66 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        fontFamily: 'Bebas Neue, sans-serif',
                        letterSpacing: '1px',
                        cursor: 'pointer'
                      }}
                    >
                      BUY FOR ${bundle.priceUsd}
                    </button>
                    {bundle.canBuyWithGems && (
                      <button
                        onClick={() => setConfirmItem({ type: 'bundle_gems', bundle })}
                        style={{
                          flex: 1,
                          background: 'rgba(0, 240, 255, 0.15)',
                          border: '1.5px solid var(--neon-cyan, #00f0ff)',
                          borderRadius: '10px',
                          padding: '12px',
                          color: 'var(--neon-cyan, #00f0ff)',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          fontFamily: 'Bebas Neue, sans-serif',
                          letterSpacing: '1px',
                          cursor: 'pointer'
                        }}
                      >
                        💎 {bundle.gemEquivalent} GEMS
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PLAYABLE WARRIORS (MATCH CHARACTERS & 10-MATCH QUOTA) */}
        {activeTab === 'characters' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
            
            {/* Explanatory Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(251,200,13,0.15) 0%, rgba(157,78,221,0.15) 100%)',
              border: '1.5px solid rgba(251, 200, 13, 0.4)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'var(--neon-gold, #FBC80D)', letterSpacing: '1px' }}>
                      PLAYABLE DUEL WARRIORS
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                      Fighters chosen for match duels with specific HP, elements, and moves. 10 free trial matches per warrior.
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleAdminGrantAllCharacters}
                    disabled={isProcessing}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      color: '#000',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    👑 ADMIN: UNLOCK ALL 7 WARRIORS (VIP)
                  </button>
                )}
              </div>
            </div>

            {/* Warriors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {Object.values(CHARACTERS).map(char => {
                const lic = characterLicenses[char.id] || characterLicenseService.getLicenseSync(userId, char.id);
                const prices = CHARACTER_PRICES[char.id] || { gold: 1500, gems: 150 };
                const isExhausted = !lic.isUnlocked && (lic.usageCount || 0) >= FREE_USAGE_LIMIT;
                const left = Math.max(0, FREE_USAGE_LIMIT - (lic.usageCount || 0));

                return (
                  <div
                    key={char.id}
                    style={{
                      background: lic.isUnlocked
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 25, 20, 0.95) 100%)'
                        : isExhausted
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(25, 10, 15, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(20, 25, 40, 0.8) 0%, rgba(10, 15, 25, 0.95) 100%)',
                      border: lic.isUnlocked
                        ? '2px solid rgba(16, 185, 129, 0.6)'
                        : isExhausted
                        ? '2px solid rgba(239, 68, 68, 0.6)'
                        : `1.5px solid ${char.themeColor || 'rgba(255,255,255,0.2)'}`,
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: lic.isUnlocked ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{
                        position: 'relative',
                        width: '70px',
                        height: '85px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        flexShrink: 0,
                        background: '#000'
                      }}>
                        <img
                          src={getAssetUrl(char.image)}
                          alt={char.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                        />
                        {lic.isUnlocked && (
                          <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#10b981', color: '#000', borderRadius: '4px', padding: '1px 4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            👑
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            color: char.themeColor || '#fff'
                          }}>
                            {char.element || 'Elemental'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>HP: {char.baseHP || 100}</span>
                        </div>
                        <h4 style={{ margin: '4px 0 2px 0', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: '#fff', letterSpacing: '1px' }}>
                          {char.name}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                          {char.title || 'Duel Champion'}
                        </div>
                      </div>
                    </div>

                    {/* Quota Status Pill */}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Access Status:</span>
                      {lic.isUnlocked ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          👑 UNLIMITED LIFETIME ACCESS
                        </span>
                      ) : isExhausted ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔒 10/10 FREE MATCHES USED
                        </span>
                      ) : (
                        <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>
                          ⚡ {left} of 10 Free Matches Remaining
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      {lic.isUnlocked ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1.5px solid rgba(16, 185, 129, 0.5)',
                            color: '#10b981',
                            borderRadius: '8px',
                            padding: '10px',
                            fontFamily: 'Bebas Neue, sans-serif',
                            fontSize: '1.05rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            cursor: 'default'
                          }}
                        >
                          ✓ PERMANENTLY UNLOCKED & READY
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePurchaseCharacter(char.id, 'gold')}
                            disabled={isProcessing || wallet.gold < prices.gold}
                            style={{
                              flex: 1,
                              background: wallet.gold >= prices.gold
                                ? 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)'
                                : 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: wallet.gold >= prices.gold ? '#000' : 'rgba(255,255,255,0.4)',
                              borderRadius: '8px',
                              padding: '10px',
                              fontFamily: 'Bebas Neue, sans-serif',
                              fontSize: '1.05rem',
                              fontWeight: 'bold',
                              letterSpacing: '1px',
                              cursor: wallet.gold >= prices.gold ? 'pointer' : 'not-allowed'
                            }}
                          >
                            🪙 {prices.gold.toLocaleString()} GOLD
                          </button>

                          <button
                            onClick={() => handlePurchaseCharacter(char.id, 'gems')}
                            disabled={isProcessing || wallet.gems < prices.gems}
                            style={{
                              flex: 1,
                              background: wallet.gems >= prices.gems
                                ? 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)'
                                : 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: wallet.gems >= prices.gems ? '#000' : 'rgba(255,255,255,0.4)',
                              borderRadius: '8px',
                              padding: '10px',
                              fontFamily: 'Bebas Neue, sans-serif',
                              fontSize: '1.05rem',
                              fontWeight: 'bold',
                              letterSpacing: '1px',
                              cursor: wallet.gems >= prices.gems ? 'pointer' : 'not-allowed'
                            }}
                          >
                            💎 {prices.gems.toLocaleString()} GEMS
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: SEASON PASS */}
        {activeTab === 'season_pass' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Season Banner Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.25) 0%, rgba(0, 240, 255, 0.15) 100%)',
              border: '1.5px solid rgba(157, 78, 221, 0.4)',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(157, 78, 221, 0.3)', border: '1px solid #c77dff', color: '#c77dff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    OFFICIAL BATTLE PASS
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    Ends December 31, 2026
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '1px' }}>
                  {seasonPassState?.season?.name || 'Season 1: Neon Vanguard'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                  Earn Season XP from matches, victories, and daily quests to unlock exclusive prestige rewards!
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {seasonPassState?.isPremium ? (
                  <div style={{
                    background: 'rgba(57, 255, 20, 0.15)',
                    border: '1.5px solid #39ff14',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    color: '#39ff14',
                    fontWeight: 'bold',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.1rem',
                    letterSpacing: '1px'
                  }}>
                    ✓ PREMIUM PASS ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={handleUpgradeSeasonPass}
                    disabled={isProcessing}
                    style={{
                      background: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 22px',
                      color: '#000',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.1rem',
                      letterSpacing: '0.8px',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                    }}
                  >
                    ⭐ UNLOCK PREMIUM PASS (400 💎)
                  </button>
                )}
              </div>
            </div>

            {/* Current Tier & XP Bar */}
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem', color: 'var(--neon-gold)', fontWeight: 'bold', fontFamily: 'Bebas Neue, sans-serif' }}>
                    TIER {seasonPassState?.currentTier || 0} OF {seasonPassState?.maxTier || 8}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    ({seasonPassState?.xp || 0} XP Total)
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', fontFamily: 'Bebas Neue, sans-serif' }}>
                  Next Unlock: {seasonPassState?.nextTierXP || 100} XP ({seasonPassState?.progressPercent || 0}%)
                </span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${seasonPassState?.progressPercent || 0}%`,
                  background: 'linear-gradient(90deg, #9d4edd, #00f0ff)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Dual Progression Track */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '1.1rem', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.8px' }}>
                SEASON REWARD TRACKS
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '12px'
              }}>
                {seasonPassState?.season?.tiers.map(t => {
                  const isReached = (seasonPassState?.currentTier || 0) >= t.tier;
                  const isFreeClaimed = seasonPassState?.claimedFreeTiers?.includes(t.tier);
                  const isPremiumClaimed = seasonPassState?.claimedPremiumTiers?.includes(t.tier);

                  return (
                    <div
                      key={t.tier}
                      style={{
                        background: isReached ? 'rgba(8, 20, 44, 0.85)' : 'rgba(4, 10, 24, 0.6)',
                        border: isReached ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Tier Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: isReached ? '#00f0ff' : 'rgba(255,255,255,0.5)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem' }}>
                          TIER {t.tier}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          {t.xpRequired} XP
                        </span>
                      </div>

                      {/* Free Track Row */}
                      <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>FREE TRACK</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                            {t.freeReward.icon} {t.freeReward.name}
                          </div>
                        </div>
                        {isFreeClaimed ? (
                          <span style={{ fontSize: '0.75rem', color: '#39ff14', fontWeight: 'bold' }}>✓ CLAIMED</span>
                        ) : (
                          <button
                            onClick={() => handleClaimSeasonReward(t.tier, false)}
                            disabled={!isReached || isProcessing}
                            style={{
                              background: isReached ? 'var(--neon-gold)' : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: isReached ? '#000' : 'rgba(255,255,255,0.4)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: isReached ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {isReached ? 'CLAIM' : 'LOCKED'}
                          </button>
                        )}
                      </div>

                      {/* Premium Track Row */}
                      <div style={{
                        background: seasonPassState?.isPremium ? 'rgba(255, 215, 0, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                        border: seasonPassState?.isPremium ? '1px solid rgba(255, 215, 0, 0.25)' : '1px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--neon-gold)', fontWeight: 'bold', textTransform: 'uppercase' }}>⭐ PREMIUM TRACK</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                            {t.premiumReward.icon} {t.premiumReward.name}
                          </div>
                        </div>
                        {isPremiumClaimed ? (
                          <span style={{ fontSize: '0.75rem', color: '#39ff14', fontWeight: 'bold' }}>✓ CLAIMED</span>
                        ) : (
                          <button
                            onClick={() => handleClaimSeasonReward(t.tier, true)}
                            disabled={!isReached || !seasonPassState?.isPremium || isProcessing}
                            style={{
                              background: isReached && seasonPassState?.isPremium ? 'linear-gradient(135deg, #ffd700, #ff8800)' : 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: isReached && seasonPassState?.isPremium ? '#000' : 'rgba(255,255,255,0.4)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: isReached && seasonPassState?.isPremium ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {isReached && seasonPassState?.isPremium ? 'CLAIM' : !seasonPassState?.isPremium ? 'LOCKED (PASS)' : 'LOCKED'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUY GEMS (IAP PACKS) */}
        {activeTab === 'gems' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {GEM_PACKS.map(pack => (
                <div
                  key={pack.id}
                  style={{
                    background: pack.popular ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(10, 25, 45, 0.95) 100%)' : 'rgba(255,255,255,0.04)',
                    border: pack.popular ? '2px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {pack.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      background: 'var(--neon-cyan, #00f0ff)',
                      color: '#000',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold'
                    }}>
                      MOST POPULAR
                    </div>
                  )}
                  {pack.bonusText && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#39ff14', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {pack.bonusText}
                    </div>
                  )}

                  <div style={{ fontSize: '3rem', margin: '10px 0 6px 0', textShadow: '0 0 20px rgba(0,240,255,0.8)' }}>
                    💎
                  </div>
                  <div style={{ fontSize: '1.7rem', color: '#fff', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                    {pack.gems.toLocaleString()} GEMS
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                    {pack.title}
                  </div>

                  <button
                    onClick={() => setConfirmItem({ type: 'gem_pack', pack })}
                    style={{
                      marginTop: 'auto',
                      width: '100%',
                      background: 'linear-gradient(90deg, #00f0ff 0%, #0099ff 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '1.15rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '1px',
                      cursor: 'pointer'
                    }}
                  >
                    ${pack.priceUsd} USD
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GOLD COSMETICS */}
        {activeTab === 'gold_items' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px', marginBottom: '12px' }}>
              FRAMES & SLEEVES (PURCHASABLE WITH EARNED GOLD)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[...COSMETIC_FRAMES.filter(f => f.currency === 'gold'), ...COSMETIC_CARDBACKS.filter(c => c.currency === 'gold')].map(item => {
                const isOwned = ownedCosmetics.includes(item.id);
                const isEquipped = equippedCosmetics[item.type] === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      border: isEquipped ? '2px solid #39ff14' : isOwned ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    {/* Item Preview */}
                    {item.type === 'frame' ? (
                      <div style={{ marginBottom: '12px' }}>
                        <PlayerAvatar
                          avatarId={userProfile?.avatar_id || 'frame_001.png'}
                          frameId={item.id}
                          size={64}
                          showGlow={true}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '84px',
                        borderRadius: '8px',
                        background: item.pattern,
                        border: `2px solid ${item.accentColor}`,
                        boxShadow: `0 0 12px ${item.accentColor}`,
                        marginBottom: '12px'
                      }} />
                    )}

                    <div style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 'bold', fontFamily: 'Bebas Neue', letterSpacing: '0.5px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                      {item.description}
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%' }}>
                      {isEquipped ? (
                        <div style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid #39ff14', color: '#39ff14', borderRadius: '8px', padding: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          EQUIPPED
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquip(item.type, item.id)}
                          style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmItem({ type: 'cosmetic', item })}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)',
                            border: 'none',
                            color: '#000',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            fontFamily: 'Bebas Neue',
                            letterSpacing: '0.5px',
                            cursor: 'pointer'
                          }}
                        >
                          BUY FOR 🪙 {item.cost.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Emotes Section */}
            <div style={{ fontSize: '1.2rem', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px', marginBottom: '12px' }}>
              COMBAT EMOTES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {COSMETIC_EMOTES.filter(e => e.currency === 'gold').map(em => {
                const isOwned = ownedCosmetics.includes(em.id);
                return (
                  <div key={em.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{em.emoji}</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}>{em.name}</div>
                    {isOwned ? (
                      <span style={{ fontSize: '0.75rem', color: '#39ff14', fontWeight: 'bold' }}>UNLOCKED</span>
                    ) : (
                      <button
                        onClick={() => setConfirmItem({ type: 'cosmetic', item: em })}
                        style={{ background: 'rgba(251,200,13,0.2)', border: '1px solid var(--neon-gold)', color: 'var(--neon-gold)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                      >
                        🪙 {em.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: GEM COSMETICS */}
        {activeTab === 'gem_items' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--neon-cyan)', fontFamily: 'Bebas Neue', letterSpacing: '1px', marginBottom: '12px' }}>
              PRESTIGE & HOLOGRAPHIC VAULT (EXCLUSIVE GEM ITEMS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[...COSMETIC_FRAMES.filter(f => f.currency === 'gems'), ...COSMETIC_CARDBACKS.filter(c => c.currency === 'gems')].map(item => {
                const isOwned = ownedCosmetics.includes(item.id);
                const isEquipped = equippedCosmetics[item.type] === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(10, 20, 40, 0.95) 100%)',
                      border: isEquipped ? '2px solid #39ff14' : isOwned ? '1.5px solid var(--neon-cyan)' : '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    {item.type === 'frame' ? (
                      <div style={{ marginBottom: '12px' }}>
                        <PlayerAvatar
                          avatarId={userProfile?.avatar_id || 'frame_001.png'}
                          frameId={item.id}
                          size={64}
                          showGlow={true}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '84px',
                        borderRadius: '8px',
                        background: item.pattern,
                        border: `2px solid ${item.accentColor}`,
                        boxShadow: `0 0 16px ${item.accentColor}`,
                        marginBottom: '12px'
                      }} />
                    )}

                    <div style={{ fontSize: '1.15rem', color: 'var(--neon-cyan)', fontWeight: 'bold', fontFamily: 'Bebas Neue', letterSpacing: '0.5px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                      {item.description}
                    </div>

                    <div style={{ marginTop: 'auto', width: '100%' }}>
                      {isEquipped ? (
                        <div style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid #39ff14', color: '#39ff14', borderRadius: '8px', padding: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          EQUIPPED
                        </div>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquip(item.type, item.id)}
                          style={{
                            width: '100%',
                            background: 'rgba(0, 240, 255, 0.15)',
                            border: '1px solid var(--neon-cyan)',
                            color: 'var(--neon-cyan)',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmItem({ type: 'cosmetic', item })}
                          style={{
                            width: '100%',
                            background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
                            border: 'none',
                            color: '#000',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            fontFamily: 'Bebas Neue',
                            letterSpacing: '0.5px',
                            cursor: 'pointer'
                          }}
                        >
                          BUY FOR 💎 {item.cost} GEMS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: DAILY LOGIN REWARDS & QUESTS */}
        {activeTab === 'daily' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {/* 7-Day Login Streak Calendar */}
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', color: 'var(--neon-gold)', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>
                    7-DAY PILOT LOGIN STREAK
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    Log in every calendar day to claim escalating rewards!
                  </div>
                </div>
                {dailyStatus?.canClaimToday && (
                  <button
                    onClick={handleClaimDailyReward}
                    disabled={isProcessing}
                    style={{
                      background: 'linear-gradient(90deg, #39ff14 0%, #00cc66 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      color: '#000',
                      fontWeight: 'bold',
                      fontFamily: 'Bebas Neue',
                      fontSize: '1.1rem',
                      cursor: 'pointer'
                    }}
                  >
                    CLAIM TODAY'S REWARD
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
                {DAILY_LOGIN_SCHEDULE.map(day => {
                  const isClaimed = dailyStatus ? day.day < dailyStatus.currentDay || (day.day === dailyStatus.currentDay && dailyStatus.alreadyClaimedToday) : false;
                  const isCurrent = dailyStatus?.currentDay === day.day && dailyStatus.canClaimToday;

                  return (
                    <div
                      key={day.day}
                      style={{
                        background: isCurrent ? 'rgba(57, 255, 20, 0.15)' : isClaimed ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.5)',
                        border: isCurrent ? '1.5px solid #39ff14' : isClaimed ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '10px 6px',
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      {isClaimed && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#39ff14', color: '#000', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: isCurrent ? '#39ff14' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                        {day.label}
                      </div>
                      <div style={{ fontSize: '1.8rem', margin: '4px 0' }}>{day.icon}</div>
                      <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                        {day.rewardType === 'gold' ? `${day.amount} G` : day.rewardType === 'gems' ? `${day.amount} Gems` : 'Grand Cache'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Quests List */}
            <div style={{ fontSize: '1.3rem', color: 'var(--neon-cyan)', fontFamily: 'Bebas Neue', letterSpacing: '1px', marginBottom: '10px' }}>
              DAILY COMBAT MISSIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dailyQuests.map(q => (
                <div
                  key={q.id}
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{q.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{q.desc}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', marginTop: '4px' }}>
                      Reward: +{q.rewardGold} Gold {q.rewardGems > 0 ? `+ ${q.rewardGems} Gems 💎` : ''}
                    </div>
                  </div>

                  <div>
                    {q.claimed ? (
                      <span style={{ color: '#39ff14', fontWeight: 'bold', fontSize: '0.9rem' }}>COMPLETED</span>
                    ) : q.current >= q.target ? (
                      <button
                        onClick={() => handleClaimQuest(q.id)}
                        style={{
                          background: 'linear-gradient(90deg, #39ff14 0%, #00cc66 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#000',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        CLAIM
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Bebas Neue' }}>
                        PROGRESS: {q.current}/{q.target}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PROMO CODES & DIAMONDS */}
        {activeTab === 'promo' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {/* Promo Code Box */}
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '14px', padding: '20px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--neon-gold)', fontSize: '1.2rem', fontFamily: 'Bebas Neue', letterSpacing: '1px' }}>
                REDEEM PROMOTIONAL CODE
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="ENTER PROMO CODE..."
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    textTransform: 'uppercase'
                  }}
                />
                <button
                  onClick={handleRedeemPromo}
                  disabled={isRedeeming || !promoCode.trim()}
                  style={{
                    background: 'linear-gradient(90deg, #FBC80D 0%, #ff9900 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 24px',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    fontFamily: 'Bebas Neue',
                    cursor: (isRedeeming || !promoCode.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isRedeeming || !promoCode.trim()) ? 0.5 : 1
                  }}
                >
                  {isRedeeming ? 'VERIFYING...' : 'REDEEM'}
                </button>
              </div>
              {promoMsg.text && (
                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: promoMsg.type === 'error' ? '#ff4444' : '#39ff14' }}>
                  {promoMsg.text}
                </div>
              )}
            </div>

            {/* Diamond Bundles */}
            <div style={{ fontSize: '1.3rem', color: '#fff', fontFamily: 'Bebas Neue', letterSpacing: '1px', marginBottom: '12px' }}>
              DIAMOND PACKAGES (MATCH ENTRY BYPASS)
            </div>
            {loadingBundles ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>Loading bundles...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {diamondBundles.map(bundle => (
                  <div
                    key={bundle.id}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>💠</div>
                    <div style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'Bebas Neue' }}>
                      {bundle.crystal_amount} Diamonds
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
                      {bundle.title}
                    </div>
                    <button
                      onClick={() => handlePurchaseDiamondBundle(bundle)}
                      style={{
                        marginTop: 'auto',
                        width: '100%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ${bundle.price_usd} USD
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION PURCHASE MODAL */}
        {confirmItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 1000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => !isProcessing && setConfirmItem(null)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #101c38 0%, #060c1c 100%)',
                border: '2px solid var(--neon-gold, #FBC80D)',
                borderRadius: '16px',
                padding: '28px',
                maxWidth: '420px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 40px rgba(251, 200, 13, 0.4)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '1px' }}>
                CONFIRM TRANSACTION
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: '0 0 20px 0' }}>
                {confirmItem.type === 'cosmetic' && `Unlock ${confirmItem.item.name} for ${confirmItem.item.cost} ${confirmItem.item.currency.toUpperCase()}?`}
                {confirmItem.type === 'gem_pack' && `Purchase ${confirmItem.pack.gems.toLocaleString()} Gems for $${confirmItem.pack.priceUsd} USD?`}
                {confirmItem.type === 'bundle_usd' && `Purchase ${confirmItem.bundle.title} for $${confirmItem.bundle.priceUsd} USD?`}
                {confirmItem.type === 'bundle_gems' && `Unlock ${confirmItem.bundle.title} for ${confirmItem.bundle.gemEquivalent} Gems?`}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setConfirmItem(null)}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (confirmItem.type === 'cosmetic') handleBuyCosmetic(confirmItem.item);
                    else if (confirmItem.type === 'gem_pack') handleBuyGemPack(confirmItem.pack);
                    else if (confirmItem.type === 'bundle_usd') handleBuyBundle(confirmItem.bundle, false);
                    else if (confirmItem.type === 'bundle_gems') handleBuyBundle(confirmItem.bundle, true);
                  }}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(90deg, #39ff14 0%, #00cc66 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? 'PROCESSING...' : 'CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
