import React, { useState, useEffect } from 'react';
import {
  QrCode, Users, Shield, Sparkles, CheckCircle2, AlertTriangle,
  RefreshCw, Unlock, Lock, Search, Copy, Check, ExternalLink,
  Crown, Coins, Gem, ArrowRight, Zap, Filter
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../game/data/characters';
import { characterLicenseService, CHARACTER_PRICES, FREE_USAGE_LIMIT } from '../services/characterLicenseService';
import { supabase } from '../services/supabaseClient';

export default function AdminCharacterManager({ currentUser, usersList = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userLicenses, setUserLicenses] = useState({});
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ text: '', type: '' });

  // QR Generator state
  const [qrCharId, setQrCharId] = useState('chynaman');
  const [qrPassType, setQrPassType] = useState('single'); // 'single' | 'vip_all'
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-generate initial QR voucher
  useEffect(() => {
    generateNewQR();
  }, [qrCharId, qrPassType]);

  const generateNewQR = () => {
    if (qrPassType === 'vip_all') {
      setGeneratedPayload('KTRL-VIP-TOURNAMENT');
    } else {
      setGeneratedPayload(characterLicenseService.generateQRPayload(qrCharId));
    }
  };

  // Filter users by search
  const filteredUsers = usersList.filter(u => {
    const q = userSearch.toLowerCase();
    const name = (u.username || u.email || u.id || '').toLowerCase();
    return name.includes(q);
  });

  // Load licenses for selected user
  const loadUserLicenses = async (user) => {
    if (!user) return;
    setSelectedUser(user);
    setIsLoadingLicenses(true);
    setActionFeedback({ text: '', type: '' });

    try {
      const res = await characterLicenseService.getAllCharacterLicenses(user.id);
      setUserLicenses(res);
    } catch (e) {
      console.error('Failed to load user licenses:', e);
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  // Execute admin grant or reset
  const handleAdminAction = async (charId, isUnlocked, resetCount) => {
    if (!selectedUser) return;
    try {
      const res = await characterLicenseService.adminGrantCharacter(
        selectedUser.id,
        charId,
        isUnlocked,
        resetCount
      );
      if (res.success) {
        setActionFeedback({ text: res.message, type: 'success' });
        loadUserLicenses(selectedUser);
      }
    } catch (err) {
      setActionFeedback({ text: 'Failed to update license.', type: 'error' });
    }
  };

  // Grant all characters to user
  const handleGrantAll = async () => {
    if (!selectedUser) return;
    try {
      for (const charId of Object.keys(CHARACTERS)) {
        await characterLicenseService.adminGrantCharacter(selectedUser.id, charId, true, false);
      }
      setActionFeedback({ text: `Granted permanent access for ALL characters to ${selectedUser.username || 'user'}!`, type: 'success' });
      loadUserLicenses(selectedUser);
    } catch (e) {
      setActionFeedback({ text: 'Error granting all characters.', type: 'error' });
    }
  };

  const qrImageUrl = generatedPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedPayload)}&color=000000&bgcolor=ffffff&margin=10`
    : '';

  return (
    <div className="flex flex-col gap-6 text-white p-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 text-amber-400 font-extrabold tracking-wider text-sm mb-1 uppercase">
            <Shield size={18} />
            <span>Character Access & Licensing Authority</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            CHARACTER QUOTAS & QR GENERATOR
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Players are restricted to 10 free matches per character card. Once exhausted, they must buy it, scan a physical card QR code, or receive an admin grant. Manage user quotas and generate scannable QR passes below.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Trial Quota Limit</div>
            <div className="text-lg font-black text-amber-400">10 MATCHES</div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Total Characters</div>
            <div className="text-lg font-black text-cyan-400">{Object.keys(CHARACTERS).length} WARRIORS</div>
          </div>
        </div>
      </div>

      {/* Grid: Left = QR Generator Tool, Right = User Quotas & Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 1: QR VOUCHER GENERATOR (4 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-[#0a0e17] border border-cyan-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
              <QrCode size={18} />
              <span>QR PASS GENERATOR</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              EVENT / RETAIL PASS
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                Pass Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQrPassType('single')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    qrPassType === 'single'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-black/40 text-gray-400'
                  }`}
                >
                  Single Character
                </button>
                <button
                  type="button"
                  onClick={() => setQrPassType('vip_all')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    qrPassType === 'vip_all'
                      ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                      : 'border-white/10 bg-black/40 text-gray-400'
                  }`}
                >
                  👑 All Characters VIP
                </button>
              </div>
            </div>

            {qrPassType === 'single' && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Select Character:
                </label>
                <select
                  value={qrCharId}
                  onChange={(e) => setQrCharId(e.target.value)}
                  className="w-full bg-black/70 border border-white/20 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {Object.values(CHARACTERS).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.title})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={generateNewQR}
              className="py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} /> Regenerate New Token
            </button>
          </div>

          {/* Scannable Card Preview */}
          <div className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-cyan-500/50 rounded-xl p-4 flex flex-col items-center shadow-[0_0_25px_rgba(0,240,255,0.15)] mt-2">
            
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-2">
              KONTROLLA AUTHENTIC TCG ACCESS CARD
            </div>

            <div className="w-48 h-48 bg-white rounded-lg p-2.5 shadow-xl flex items-center justify-center">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Scannable QR Voucher"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode size={80} className="text-black/50" />
              )}
            </div>

            <div className="mt-3 text-center w-full">
              <div className="text-xs font-bold text-white tracking-wide">
                {qrPassType === 'vip_all' ? 'VIP ALL CHARACTERS UNLOCK' : CHARACTERS[qrCharId]?.name}
              </div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <code className="text-xs font-mono font-bold bg-black/80 px-2.5 py-1 rounded border border-cyan-500/40 text-cyan-300">
                  {generatedPayload}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPayload);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                  title="Copy code"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Players can point their phone camera at this QR code in the app to instantly unlock access!
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: USER QUOTAS & DIRECT MANAGEMENT (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-[#0a0e17] border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <Users size={18} />
              <span>PLAYER QUOTA INSPECTOR & GRANT TOOL</span>
            </div>

            {/* User Search Input */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* User selector chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {filteredUsers.slice(0, 15).map(u => {
              const isSel = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => loadUserLicenses(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all border ${
                    isSel
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  {u.username || u.email?.split('@')[0] || u.id.substring(0, 8)}
                </button>
              );
            })}
          </div>

          {/* Selected User Details & Character Cards */}
          {selectedUser ? (
            <div className="flex flex-col gap-3">
              
              {/* Header card for selected user */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">Inspecting Player:</div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>{selectedUser.username || selectedUser.email || selectedUser.id}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({selectedUser.id.substring(0, 8)}...)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGrantAll}
                  className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Crown size={14} /> Grant All Characters (VIP)
                </button>
              </div>

              {/* Action feedback */}
              {actionFeedback.text && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}>
                  {actionFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{actionFeedback.text}</span>
                </div>
              )}

              {/* Characters Grid */}
              {isLoadingLicenses ? (
                <div className="p-8 text-center text-gray-400 text-xs">Loading player license quotas...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {Object.values(CHARACTERS).map(char => {
                    const lic = userLicenses[char.id] || { usageCount: 0, isUnlocked: false };
                    const isExhausted = !lic.isUnlocked && lic.usageCount >= FREE_USAGE_LIMIT;

                    return (
                      <div
                        key={char.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          lic.isUnlocked
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isExhausted
                            ? 'bg-rose-950/20 border-rose-500/50'
                            : 'bg-black/50 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={getAssetUrl(char.image)}
                            alt={char.name}
                            className="w-10 h-12 object-cover object-top rounded-lg border border-white/20 bg-black shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{char.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{char.title}</div>
                            <div className="mt-1">
                              {lic.isUnlocked ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                                  <CheckCircle2 size={10} /> UNLIMITED (OWNED)
                                </span>
                              ) : isExhausted ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-fit">
                                  <Lock size={10} /> LOCKED ({lic.usageCount}/{FREE_USAGE_LIMIT})
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 w-fit">
                                  {FREE_USAGE_LIMIT - (lic.usageCount || 0)}/10 Free Left
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                          {lic.isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleAdminAction(char.id, false, false)}
                              className="flex-1 py-1 px-2 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-gray-400 text-[10px] font-semibold border border-white/10 transition-colors"
                            >
                              Revoke Unlimited
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdminAction(char.id, true, false)}
                              className="flex-1 py-1 px-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 transition-colors flex items-center justify-center gap-1"
                            >
                              <Unlock size={10} /> Grant Access
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAdminAction(char.id, lic.isUnlocked, true)}
                            className="py-1 px-2 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1"
                            title="Reset matches back to 0"
                          >
                            <RefreshCw size={10} /> Refill 10
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Users size={36} className="text-gray-600" />
              <p className="text-xs">Select a player from the list above to inspect character quotas or grant access.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
