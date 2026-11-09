import React, { useState, useEffect } from 'react';
import {
  X, Lock, Unlock, ShieldAlert, Coins, Gem, QrCode,
  Sparkles, CheckCircle2, AlertCircle, Crown, ArrowRight,
  Flame, Zap, RefreshCw
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../game/data/characters';
import { characterLicenseService, CHARACTER_PRICES, FREE_USAGE_LIMIT } from '../services/characterLicenseService';
import { economyService } from '../services/economyService';
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
  const [license, setLicense] = useState(null);
  const [wallet, setWallet] = useState({ gold: 500, gems: 50 });
  const [selectedCurrency, setSelectedCurrency] = useState('gold'); // 'gold' | 'gems'
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);

  const charKey = (characterId || 'chynaman').toLowerCase();
  const character = CHARACTERS[charKey] || CHARACTERS.chynaman;
  const pricing = CHARACTER_PRICES[charKey] || { gold: 1500, gems: 150 };
  const isAdmin = Boolean(userProfile?.is_admin);

  // Load wallet and license status
  const loadStatus = async () => {
    if (!charKey) return;
    const lic = await characterLicenseService.getCharacterLicense(userId, charKey);
    setLicense(lic);

    if (userId) {
      const balances = await economyService.getWalletBalances(userId);
      setWallet(balances);
    } else {
      setWallet({
        gold: userProfile?.gold ?? 500,
        gems: userProfile?.gems ?? 50
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
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ text: res.error || 'Purchase failed.', type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Transaction error. Please try again.', type: 'error' });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle Admin Quick Grant
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
          text: resetOnly ? 'Quota successfully refilled to 10 free matches!' : 'Admin: Character permanently unlocked!',
          type: 'success'
        });
        await loadStatus();
        if (onUnlockSuccess) onUnlockSuccess(charKey);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (e) {
      setFeedback({ text: 'Admin action failed.', type: 'error' });
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
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-wider text-amber-400 uppercase">
                  CHARACTER ACCESS GATE
                </h3>
                <p className="text-xs text-gray-400">
                  Free 10-Match Trial Quota Reached
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

          {/* Character Showcase Banner */}
          <div className="p-5 flex items-center gap-4 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
            <div className="relative w-20 h-24 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg shrink-0 bg-black">
              <img
                src={getAssetUrl(character.image || 'Kontrolla_Data/Graphics/WILD CARDS/CHYNA WILD CARD REG.png')}
                alt={character.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Lock size={22} className="text-amber-400 drop-shadow-[0_0_8px_#f59e0b]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {character.title || 'Warrior'}
                </span>
                <span className="text-xs text-gray-400">HP: {character.baseHP || 100}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide mt-1 truncate">
                {character.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <ShieldAlert size={14} /> 10 / 10 Free Uses Exhausted
                </span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback.text && (
            <div className={`mx-5 mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
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
          <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[55vh]">
            
            {/* OPTION 1: Buy with In-Game Currency */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                  <Coins size={16} /> OPTION 1: UNLOCK PERMANENT ACCESS
                </div>
                <span className="text-[11px] text-gray-400">One-time purchase</span>
              </div>

              {/* Currency Selector */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('gold')}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    selectedCurrency === 'gold'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Coins size={15} className="text-amber-400" />
                    <span>{pricing.gold.toLocaleString()} Gold</span>
                  </div>
                  <span className="text-[10px] text-gray-400">({wallet.gold.toLocaleString()} owned)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCurrency('gems')}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    selectedCurrency === 'gems'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Gem size={15} className="text-cyan-400" />
                    <span>{pricing.gems.toLocaleString()} Gems</span>
                  </div>
                  <span className="text-[10px] text-gray-400">({wallet.gems.toLocaleString()} owned)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
              >
                <Unlock size={14} />
                BUY UNLIMITED LICENSE ({selectedCurrency === 'gold' ? `${pricing.gold} GOLD` : `${pricing.gems} GEMS`})
              </button>
            </div>

            {/* OPTION 2: Scan Physical Card QR Code */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                  <QrCode size={16} /> OPTION 2: SCAN PHYSICAL CARD QR
                </div>
                <span className="text-[11px] text-cyan-300/70">TCG Physical Deck</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                Have the physical card pack, tournament slip, or convention promo? Scan the QR code on the back to instantly verify and unlock.
              </p>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                <QrCode size={14} />
                OPEN CAMERA / CODE SCANNER
              </button>
            </div>

            {/* OPTION 3: Admin Grant / Organizer Access */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                  <Crown size={16} /> OPTION 3: ADMIN & TOURNAMENT GRANT
                </div>
                {isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/50">
                    ADMIN ACTIVE
                  </span>
                )}
              </div>

              {isAdmin ? (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-xs text-purple-200">
                    You have Admin privileges. You can unlock this character immediately or refill match uses.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      disabled={isAdminActionLoading}
                      onClick={() => handleAdminGrant(false)}
                      className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      <Zap size={14} /> Grant Unlimited
                    </button>
                    <button
                      type="button"
                      disabled={isAdminActionLoading}
                      onClick={() => handleAdminGrant(true)}
                      className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-purple-400/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw size={14} /> Refill +10 Uses
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                    Tournament organizers and game masters can issue direct character licenses to your user ID.
                  </p>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 flex items-center justify-between text-xs text-gray-400">
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
          <div className="p-3 border-t border-white/10 bg-black/50 text-center text-[11px] text-gray-500">
            Unlocked characters remain permanently accessible across all game modes.
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
