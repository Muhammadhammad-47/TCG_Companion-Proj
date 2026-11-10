import React, { useState, useEffect } from 'react';
import {
  X, Lock, Unlock, ShieldAlert, Coins, Gem, QrCode,
  Sparkles, CheckCircle2, AlertCircle, Crown, ArrowRight,
  Flame, Zap, RefreshCw, Palette, Gift, ChevronDown
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../game/data/characters';
import { characterLicenseService, CHARACTER_PRICES, FREE_USAGE_LIMIT } from '../services/characterLicenseService';
import { economyService } from '../services/economyService';
import { cosmeticsService } from '../services/cosmeticsService';
import { soundFX } from '../game/utils/audio';
import QRScannerModal from './QRScannerModal';

export default function CharacterUnlockModal({
  isOpen,
  onClose,
  characterId,
  userId,
  userProfile,
  onUnlockSuccess
}) {
  const [activeCharKey, setActiveCharKey] = useState((characterId || 'chynaman').toLowerCase());
  const [allLicenses, setAllLicenses] = useState({});
  const [license, setLicense] = useState(null);
  const [wallet, setWallet] = useState({ gold: 500, gems: 50 });
  const [selectedCurrency, setSelectedCurrency] = useState('gold'); // 'gold' | 'gems'
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);

  useEffect(() => {
    if (characterId) {
      setActiveCharKey(characterId.toLowerCase());
    }
  }, [characterId]);

  const charKey = activeCharKey;
  const character = CHARACTERS[charKey] || CHARACTERS.chynaman;
  const pricing = CHARACTER_PRICES[charKey] || { gold: 1500, gems: 150 };
  const isAdmin = Boolean(
    userProfile?.is_admin ||
    userProfile?.role === 'admin' ||
    showAdminTools ||
    (typeof window !== 'undefined' && localStorage.getItem('tcg_admin_mode') === 'true')
  );

  // Load wallet and license status
  const loadStatus = async () => {
    if (!charKey) return;
    const lic = await characterLicenseService.getCharacterLicense(userId, charKey);
    setLicense(lic);

    const allLics = await characterLicenseService.getAllCharacterLicenses(userId);
    setAllLicenses(allLics);

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
        gems: userProfile?.gems ?? gGems
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback({ text: '', type: '' });
      loadStatus();
    }
  }, [isOpen, charKey, userId]);

  // Handle in-game store purchase
  const handlePurchase = async () => {
    setIsPurchasing(true);
    setFeedback({ text: '', type: '' });
    const cost = pricing[selectedCurrency] || pricing.gold;
    const userBal = wallet[selectedCurrency] || 0;

    if (userBal < cost) {
      setFeedback({
        text: `Insufficient ${selectedCurrency.toUpperCase()}! You have ${userBal.toLocaleString()} but need ${cost.toLocaleString()}.`,
        type: 'error'
      });
      setIsPurchasing(false);
      return;
    }

    try {
      const res = await characterLicenseService.purchaseCharacter(userId, charKey, selectedCurrency);
      if (res.success) {
        try { soundFX.playLevelUp(); } catch {}
        setFeedback({ text: res.message, type: 'success' });
        await loadStatus();
        if (onUnlockSuccess) onUnlockSuccess(charKey);
      } else {
        setFeedback({ text: res.error || 'Purchase failed.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Transaction error. Please try again.', type: 'error' });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle Admin Quick Grant for single character
  const handleAdminGrant = async (resetOnly = false) => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await characterLicenseService.adminGrantCharacter(
        userId || 'admin_self',
        charKey,
        !resetOnly, // isUnlocked
        resetOnly   // resetCount
      );
      if (res.success) {
        try { soundFX.playLevelUp(); } catch {}
        setFeedback({
          text: resetOnly ? `Refilled ${character.name}'s quota to 10 free matches!` : `Admin: ${character.name} permanently unlocked!`,
          type: 'success'
        });
        await loadStatus();
        if (onUnlockSuccess) onUnlockSuccess(charKey);
      }
    } catch (e) {
      setFeedback({ text: 'Admin action failed.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Handle Admin Grant ALL characters with 1 click
  const handleGrantAllCharacters = async () => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await characterLicenseService.adminGrantAllCharacters(userId || 'admin_self', true);
      try { soundFX.playLevelUp(); } catch {}
      setFeedback({ text: res.message, type: 'success' });
      await loadStatus();
      if (onUnlockSuccess) onUnlockSuccess(charKey);
    } catch (e) {
      setFeedback({ text: 'Error granting all characters.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Handle Admin Grant Master VIP (All Characters + 10k Gold + 1k Gems + All Cosmetics)
  const handleGrantMasterVIP = async () => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await characterLicenseService.adminGrantFullVIP(userId || 'admin_self', cosmeticsService);
      try { soundFX.playLevelUp(); } catch {}
      setFeedback({ text: res.message, type: 'success' });
      await loadStatus();
      if (onUnlockSuccess) onUnlockSuccess(charKey);
    } catch (e) {
      setFeedback({ text: 'Error granting Master VIP.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Handle Admin Grant Gold & Gems
  const handleGrantWalletFunds = async (gold = 5000, gems = 500) => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await characterLicenseService.adminGrantWallet(userId || 'admin_self', gold, gems);
      setFeedback({ text: res.message, type: 'success' });
      await loadStatus();
    } catch (e) {
      setFeedback({ text: 'Error granting currency.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Handle Admin Unlock All Cosmetics
  const handleGrantAllCosmetics = async () => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      cosmeticsService.unlockAllCosmetics(userId || 'admin_self');
      setFeedback({ text: 'Unlocked all Profile Avatars, Frames, Card Backs, and Emotes!', type: 'success' });
    } catch (e) {
      setFeedback({ text: 'Error unlocking cosmetics.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  // Handle Admin Refill All Quotas
  const handleResetAllQuotas = async () => {
    setIsAdminActionLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await characterLicenseService.adminResetAllQuotas(userId || 'admin_self');
      setFeedback({ text: res.message, type: 'success' });
      await loadStatus();
      if (onUnlockSuccess) onUnlockSuccess(charKey);
    } catch (e) {
      setFeedback({ text: 'Error refilling quotas.', type: 'error' });
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-[#0c101a] border border-amber-500/40 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col text-white">
          
          {/* Top Decorative Header */}
          <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-black to-black">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-wider text-amber-400 uppercase">
                  PLAYABLE WARRIOR ACCESS GATE
                </h3>
                <p className="text-[11px] text-gray-400">
                  Duel Champions (10 Free Matches Per Warrior Card)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Warrior Switcher Ribbon: View/Select all 7 characters without leaving modal */}
          <div className="flex items-center gap-1.5 p-2.5 bg-black/70 border-b border-white/10 overflow-x-auto scrollbar-thin">
            {Object.values(CHARACTERS).map(c => {
              const isCur = c.id === charKey;
              const cLic = allLicenses[c.id] || characterLicenseService.getLicenseSync(userId, c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCharKey(c.id);
                    setFeedback({ text: '', type: '' });
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all border ${
                    isCur
                      ? 'border-amber-400 bg-amber-500/25 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{c.avatar || '⚔️'}</span>
                  <span>{c.name}</span>
                  {cLic.isUnlocked ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">👑</span>
                  ) : cLic.usageCount >= FREE_USAGE_LIMIT ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">🔒</span>
                  ) : (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">{FREE_USAGE_LIMIT - (cLic.usageCount || 0)}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Character Showcase Banner */}
          <div className="p-4 flex items-center gap-4 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
            <div className="relative w-20 h-24 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg shrink-0 bg-black">
              <img
                src={getAssetUrl(character.image || 'Kontrolla_Data/Graphics/WILD CARDS/CHYNA WILD CARD REG.png')}
                alt={character.name}
                className="w-full h-full object-cover object-top"
              />
              {license?.isUnlocked ? (
                <div className="absolute top-1 right-1 bg-emerald-500 text-black p-1 rounded-md shadow-md">
                  <Crown size={14} />
                </div>
              ) : (license?.usageCount || 0) >= FREE_USAGE_LIMIT ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock size={22} className="text-rose-400 drop-shadow-[0_0_8px_#f43f5e]" />
                </div>
              ) : null}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {character.title || 'Duel Champion'}
                </span>
                <span className="text-xs text-gray-400">HP: {character.baseHP || 100}</span>
                <span className="text-xs text-cyan-400 font-mono">{character.element || 'Elemental'}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide mt-1 truncate">
                {character.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {license?.isUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> 👑 Unlimited Permanent Access Active
                  </span>
                ) : (license?.usageCount || 0) >= FREE_USAGE_LIMIT ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <ShieldAlert size={14} /> 10 / 10 Free Matches Exhausted
                  </span>
                ) : (
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <Zap size={14} /> {FREE_USAGE_LIMIT - (license?.usageCount || 0)} / 10 Free Trial Matches Left
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback.text && (
            <div className={`mx-4 mt-3 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
              )}
              <span className="font-semibold">{feedback.text}</span>
            </div>
          )}

          {/* The 3 Unlock Options */}
          <div className="p-4 flex flex-col gap-3.5 overflow-y-auto max-h-[50vh]">
            
            {/* OPTION 1: Buy with In-Game Currency */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                  <Coins size={15} /> OPTION 1: BUY WITH GOLD OR GEMS
                </div>
                <span className="text-[10px] text-gray-400">Instant Unlock</span>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('gold')}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                    selectedCurrency === 'gold'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Coins size={14} className="text-amber-400" />
                    <span>{pricing.gold.toLocaleString()} Gold</span>
                  </div>
                  <span className="text-[10px] text-gray-400">({wallet.gold.toLocaleString()} owned)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCurrency('gems')}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                    selectedCurrency === 'gems'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Gem size={14} className="text-cyan-400" />
                    <span>{pricing.gems.toLocaleString()} Gems</span>
                  </div>
                  <span className="text-[10px] text-gray-400">({wallet.gems.toLocaleString()} owned)</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isPurchasing || license?.isUnlocked}
                onClick={handlePurchase}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {license?.isUnlocked ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>ALREADY OWNED & UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <Crown size={14} />
                    <span>
                      {isPurchasing ? 'PROCESSING UNLOCK...' : `UNLOCK ${character.name.toUpperCase()} (${pricing[selectedCurrency]} ${selectedCurrency.toUpperCase()})`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* OPTION 2: Scan QR Code Voucher */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
                  <QrCode size={15} /> OPTION 2: SCAN PHYSICAL CARD QR
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Retail Card
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-2.5">
                Bought physical Attention TCG booster packs? Scan the QR code or enter voucher token.
              </p>
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <QrCode size={14} /> Open Camera Scanner / Enter Code
              </button>
            </div>

            {/* OPTION 3: Admin Grants & Quick Tools */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                  <Crown size={15} /> OPTION 3: ADMIN GRANTS & MANAGEMENT
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminTools(!showAdminTools)}
                  className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-semibold hover:bg-purple-500/30"
                >
                  <span>{isAdmin ? 'Admin Mode Active' : 'Toggle Admin Controls'}</span>
                  <ChevronDown size={11} className={showAdminTools ? 'rotate-180' : ''} />
                </button>
              </div>

              {isAdmin ? (
                <div className="flex flex-col gap-2.5 mt-1">
                  <p className="text-[11px] text-purple-200">
                    Administrator authority active for <code className="text-white">{userId || 'active_user'}</code>:
                  </p>

                  {/* Character Single Grant */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isAdminActionLoading}
                      onClick={() => handleAdminGrant(false)}
                      className="py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Zap size={13} /> Grant {character.name}
                    </button>
                    <button
                      type="button"
                      disabled={isAdminActionLoading}
                      onClick={() => handleAdminGrant(true)}
                      className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-purple-400/40 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                    >
                      <RefreshCw size={13} /> Refill {character.name} (10)
                    </button>
                  </div>

                  {/* Master Bulk Grants */}
                  <div className="pt-2 border-t border-purple-500/30 flex flex-col gap-1.5">
                    <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">
                      Bulk Master Grants:
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isAdminActionLoading}
                        onClick={handleGrantAllCharacters}
                        className="py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-black font-black text-[11px] flex items-center justify-center gap-1 shadow-md transition-all tracking-wide"
                      >
                        <Crown size={13} /> GRANT ALL 7 WARRIORS
                      </button>

                      <button
                        type="button"
                        disabled={isAdminActionLoading}
                        onClick={handleGrantMasterVIP}
                        className="py-2 px-2.5 rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 hover:brightness-110 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-md transition-all tracking-wide"
                      >
                        <Sparkles size={13} /> 🌟 FULL MASTER VIP
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                      <button
                        type="button"
                        disabled={isAdminActionLoading}
                        onClick={() => handleGrantWalletFunds(5000, 500)}
                        className="py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                      >
                        <Coins size={12} /> +5,000G +500💎
                      </button>

                      <button
                        type="button"
                        disabled={isAdminActionLoading}
                        onClick={handleGrantAllCosmetics}
                        className="py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                      >
                        <Palette size={12} /> Unlock All Avatars
                      </button>

                      <button
                        type="button"
                        disabled={isAdminActionLoading}
                        onClick={handleResetAllQuotas}
                        className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 font-bold text-[10px] flex items-center justify-center gap-1 border border-purple-400/30"
                      >
                        <RefreshCw size={12} /> Refill All Quotas
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
                    Tournament organizers can issue character licenses to your ID.
                  </p>
                  <div className="p-2 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-xs text-gray-400">
                    <span className="truncate">User ID: <code className="text-white">{userId || 'guest_user'}</code></span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(userId || 'guest_user');
                          setFeedback({ text: 'User ID copied to clipboard for Admin!', type: 'success' });
                        } catch {}
                      }}
                      className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold shrink-0 ml-2"
                    >
                      Copy ID
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer note */}
          <div className="p-2.5 border-t border-white/10 bg-black/60 text-center text-[11px] text-gray-400 flex items-center justify-center gap-2">
            <span>🛡️ Playable duel warriors unlocked are permanent.</span>
            <span className="text-gray-600">•</span>
            <span className="text-amber-400 font-semibold">10-match free trial resets on unlock.</span>
          </div>

        </div>
      </div>

      {/* Embedded QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        userId={userId}
        onUnlockSuccess={(res) => {
          setIsQRScannerOpen(false);
          setFeedback({ text: res.message, type: 'success' });
          loadStatus();
          if (onUnlockSuccess) onUnlockSuccess(charKey);
        }}
      />
    </>
  );
}
