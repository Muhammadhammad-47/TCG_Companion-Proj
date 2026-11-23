import React, { useState, useEffect } from 'react';
import {
  QrCode, Users, Shield, Sparkles, CheckCircle2, AlertTriangle,
  RefreshCw, Unlock, Lock, Search, Copy, Check, ExternalLink,
  Crown, Coins, Gem, ArrowRight, Zap, Filter, Gift, Palette
} from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../game/data/characters';
import { characterLicenseService, CHARACTER_PRICES, FREE_USAGE_LIMIT } from '../services/characterLicenseService';
import { cosmeticsService } from '../services/cosmeticsService';
import { supabase } from '../services/supabaseClient';

export default function AdminCharacterManager({ currentUser, usersList = [] }) {
  const [selectedUser, setSelectedUser] = useState(currentUser || null);
  const [userSearch, setUserSearch] = useState('');
  const [userLicenses, setUserLicenses] = useState({});
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ text: '', type: '' });
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // QR Generator state
  const [qrCharId, setQrCharId] = useState('chynaman');
  const [qrPassType, setQrPassType] = useState('single'); // 'single' | 'vip_all'
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-generate initial QR voucher
  useEffect(() => {
    generateNewQR();
  }, [qrCharId, qrPassType]);

  // Load licenses on initial mount if currentUser available
  useEffect(() => {
    if (currentUser && !selectedUser) {
      loadUserLicenses(currentUser);
    }
  }, [currentUser]);

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

  // Execute admin grant or reset for single character
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

  // 1. Grant ALL 7 characters to user
  const handleGrantAll = async () => {
    if (!selectedUser) return;
    setIsPerformingBulkAction(true);
    try {
      const res = await characterLicenseService.adminGrantAllCharacters(selectedUser.id, true);
      setActionFeedback({ text: res.message || `Granted ALL characters to ${selectedUser.username || 'user'}!`, type: 'success' });
      await loadUserLicenses(selectedUser);
    } catch (e) {
      setActionFeedback({ text: 'Error granting all characters.', type: 'error' });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // 2. Refill character move quotas back to 10
  const handleResetAllQuotas = async () => {
    if (!selectedUser) return;
    setIsPerformingBulkAction(true);
    try {
      const res = await characterLicenseService.adminResetAllQuotas(selectedUser.id);
      setActionFeedback({ text: res.message || 'Refilled starting move deck quotas (10/10)!', type: 'success' });
      await loadUserLicenses(selectedUser);
    } catch (e) {
      setActionFeedback({ text: 'Error refilling quotas.', type: 'error' });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // 3. Grant Gold and Gems currency to user
  const handleGrantWallet = async (gold = 5000, gems = 500) => {
    if (!selectedUser) return;
    setIsPerformingBulkAction(true);
    try {
      const res = await characterLicenseService.adminGrantWallet(selectedUser.id, gold, gems);
      setActionFeedback({ text: res.message, type: 'success' });
    } catch (e) {
      setActionFeedback({ text: 'Error granting wallet funds.', type: 'error' });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // 4. Grant all cosmetics, avatars, frames, cardbacks, emotes
  const handleGrantCosmetics = async () => {
    if (!selectedUser) return;
    setIsPerformingBulkAction(true);
    try {
      cosmeticsService.unlockAllCosmetics(selectedUser.id);
      setActionFeedback({ text: `Unlocked ALL Profile Avatars, Frames, Card Backs, and Emotes for ${selectedUser.username || 'user'}!`, type: 'success' });
    } catch (e) {
      setActionFeedback({ text: 'Error unlocking cosmetics.', type: 'error' });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // 5. Grant Master VIP Package (All Warriors + 10k Gold + 1k Gems + All Cosmetics)
  const handleGrantFullVIP = async () => {
    if (!selectedUser) return;
    setIsPerformingBulkAction(true);
    try {
      const res = await characterLicenseService.adminGrantFullVIP(selectedUser.id, cosmeticsService);
      setActionFeedback({ text: res.message, type: 'success' });
      await loadUserLicenses(selectedUser);
    } catch (e) {
      setActionFeedback({ text: 'Error granting Master VIP.', type: 'error' });
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Inspect arbitrary user by typed ID or Email
  const handleInspectCustomTarget = () => {
    if (!userSearch.trim()) return;
    const clean = userSearch.trim();
    const mockUser = {
      id: clean,
      username: clean.includes('@') ? clean.split('@')[0] : clean,
      email: clean.includes('@') ? clean : null
    };
    loadUserLicenses(mockUser);
  };

  const qrImageUrl = generatedPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedPayload)}&color=000000&bgcolor=ffffff&margin=10`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#fff', padding: '10px 0', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(35, 20, 5, 0.85) 0%, rgba(20, 10, 30, 0.85) 50%, rgba(5, 5, 10, 0.95) 100%)',
        border: '1.5px solid rgba(251, 200, 13, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBC80D', fontWeight: 800, letterSpacing: '1px', fontSize: '0.82rem', marginBottom: '6px', textTransform: 'uppercase' }}>
            <Shield size={18} />
            <span>Character Access & Licensing Authority</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.5px' }}>
            CHARACTER ACCESS PASS & QR GENERATOR
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '6px 0 0 0', lineHeight: 1.5, maxWidth: '680px' }}>
            Unlimited character play enabled. At game start, players receive 10 Character Move Cards; once depleted, players purchase digital packs or scan physical QR cards to unlock full decks. Manage player accounts and generate scannable event/retail QR passes below.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '10px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Starting Move Pool</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FBC80D' }}>10 MOVES / MATCH</div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '10px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Total Characters</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00f0ff' }}>{Object.keys(CHARACTERS).length} WARRIORS</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = QR Generator Tool, Right = User Quotas & Direct Management */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* SECTION 1: QR VOUCHER GENERATOR */}
        <div style={{
          background: '#0a0e17',
          border: '1.5px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem', color: '#00f0ff' }}>
              <QrCode size={18} />
              <span>QR PASS GENERATOR</span>
            </div>
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.35)', fontFamily: 'monospace' }}>
              EVENT / RETAIL PASS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Pass Type:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setQrPassType('single')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: qrPassType === 'single' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                    border: qrPassType === 'single' ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: qrPassType === 'single' ? '#00f0ff' : '#cbd5e1'
                  }}
                >
                  Single Character
                </button>
                <button
                  type="button"
                  onClick={() => setQrPassType('vip_all')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: qrPassType === 'vip_all' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                    border: qrPassType === 'vip_all' ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: qrPassType === 'vip_all' ? '#d8b4fe' : '#cbd5e1'
                  }}
                >
                  👑 All Characters VIP
                </button>
              </div>
            </div>

            {qrPassType === 'single' && (
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                  Select Character:
                </label>
                <select
                  value={qrCharId}
                  onChange={(e) => setQrCharId(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.82rem',
                    color: '#fff',
                    outline: 'none'
                  }}
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
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} /> Regenerate New Token
            </button>
          </div>

          {/* Scannable Card Preview */}
          <div style={{
            background: 'linear-gradient(180deg, #0e1626 0%, #05070c 100%)',
            border: '2px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.15)',
            marginTop: '6px'
          }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '1.5px', color: '#00f0ff', textTransform: 'uppercase', marginBottom: '10px' }}>
              KONTROLLA AUTHENTIC TCG ACCESS CARD
            </div>

            <div style={{ width: '180px', height: '180px', background: '#fff', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)' }}>
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Scannable QR Voucher"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <QrCode size={80} color="#000" />
              )}
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                {qrPassType === 'vip_all' ? 'VIP ALL CHARACTERS UNLOCK' : CHARACTERS[qrCharId]?.name}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 'bold', background: 'rgba(0,0,0,0.85)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,240,255,0.4)', color: '#00f0ff' }}>
                  {generatedPayload}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPayload);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}
                  title="Copy code"
                >
                  {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px', margin: '8px 0 0 0' }}>
                Players can point their phone camera at this QR code in the app to instantly unlock access!
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: USER QUOTAS & DIRECT MANAGEMENT */}
        <div style={{
          background: '#0a0e17',
          border: '1.5px solid rgba(251, 200, 13, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem', color: '#FBC80D' }}>
              <Users size={18} />
              <span>PLAYER QUOTA INSPECTOR & GRANT TOOL</span>
            </div>

            {/* User Search & Custom Target Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', maxWidth: '320px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search user ID/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInspectCustomTarget(); }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 10px 6px 30px',
                    fontSize: '0.78rem',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
              {userSearch.trim() && (
                <button
                  type="button"
                  onClick={handleInspectCustomTarget}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(251, 200, 13, 0.2)', border: '1px solid rgba(251, 200, 13, 0.4)', color: '#FBC80D', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Inspect
                </button>
              )}
            </div>
          </div>

          {/* Quick Target Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {currentUser && (
              <button
                type="button"
                onClick={() => loadUserLicenses(currentUser)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: selectedUser?.id === currentUser.id ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                  border: selectedUser?.id === currentUser.id ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: selectedUser?.id === currentUser.id ? '#00f0ff' : '#cbd5e1'
                }}
              >
                <Crown size={12} color="#00f0ff" />
                <span>Me ({currentUser.username || currentUser.email?.split('@')[0] || 'Admin'})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadUserLicenses({ id: 'guest', username: 'Local Guest Player', email: 'guest@device' })}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: selectedUser?.id === 'guest' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0, 0, 0, 0.5)',
                border: selectedUser?.id === 'guest' ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.15)',
                color: selectedUser?.id === 'guest' ? '#d8b4fe' : '#cbd5e1'
              }}
            >
              <span>🎮 Local Guest Player</span>
            </button>

            {filteredUsers.slice(0, 15).map(u => {
              if (currentUser && u.id === currentUser.id) return null;
              const isSel = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => loadUserLicenses(u)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: isSel ? 'rgba(251, 200, 13, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                    border: isSel ? '1.5px solid #FBC80D' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSel ? '#FBC80D' : '#94a3b8'
                  }}
                >
                  {u.username || u.email?.split('@')[0] || u.id.substring(0, 8)}
                </button>
              );
            })}
          </div>

          {/* Selected User Details & Character Cards */}
          {selectedUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Header card for selected user with multi-grant actions */}
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Admin Target:</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{selectedUser.username || selectedUser.email || selectedUser.id}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>({selectedUser.id})</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(251, 200, 13, 0.15)', color: '#FBC80D', border: '1px solid rgba(251, 200, 13, 0.3)', fontWeight: 700 }}>
                    ADMIN TARGET READY
                  </span>
                </div>

                {/* Bulk Action Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    disabled={isPerformingBulkAction}
                    onClick={handleGrantAll}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #FBC80D, #f59e0b)',
                      color: '#000',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Crown size={13} /> Grant All 7 Characters
                  </button>

                  <button
                    type="button"
                    disabled={isPerformingBulkAction}
                    onClick={() => handleGrantWallet(5000, 500)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #059669, #0d9488)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Coins size={13} /> +5,000G & +500💎
                  </button>

                  <button
                    type="button"
                    disabled={isPerformingBulkAction}
                    onClick={handleGrantCosmetics}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'linear-gradient(90deg, #0284c7, #2563eb)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Palette size={13} /> Unlock All Cosmetics
                  </button>

                  <button
                    type="button"
                    disabled={isPerformingBulkAction}
                    onClick={handleResetAllQuotas}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={13} /> Refill 10 Moves
                  </button>
                </div>

                {/* Master VIP Pass Banner */}
                <button
                  type="button"
                  disabled={isPerformingBulkAction}
                  onClick={handleGrantFullVIP}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                    letterSpacing: '0.5px'
                  }}
                >
                  <Sparkles size={14} color="#FBC80D" />
                  <span>⚡ 1-Click Master VIP Bundle (All 7 Warriors + 10k Gold + 1k Gems + All Cosmetics)</span>
                </button>
              </div>

              {/* Action feedback */}
              {actionFeedback.text && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: actionFeedback.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                  color: actionFeedback.type === 'success' ? '#34d399' : '#f87171'
                }}>
                  {actionFeedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{actionFeedback.text}</span>
                </div>
              )}

              {/* Characters Grid with Fixed-Size Constrained Thumbnails */}
              {isLoadingLicenses ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Loading player licenses...</div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {Object.values(CHARACTERS).map(char => {
                    const lic = userLicenses[char.id] || { usageCount: 0, isUnlocked: false };

                    return (
                      <div
                        key={char.id}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: lic.isUnlocked ? '1.5px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                          background: lic.isUnlocked ? 'rgba(6, 78, 59, 0.25)' : 'rgba(0, 0, 0, 0.55)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* CRITICAL: Explicit width & height bounds so raw card graphics never burst out */}
                          <img
                            src={getAssetUrl(char.image)}
                            alt={char.name}
                            style={{
                              width: '44px',
                              height: '58px',
                              objectFit: 'cover',
                              objectPosition: 'top',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              background: '#000',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {char.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {char.title}
                            </div>
                            <div style={{ marginTop: '4px' }}>
                              {lic.isUnlocked ? (
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={10} /> FULL DECK (OWNED)
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.35)' }}>
                                  🎴 10 Moves / Match (Unlimited Play)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          {lic.isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleAdminAction(char.id, false, false)}
                              style={{
                                flex: 1,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#94a3b8',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Revoke Unlimited
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAdminAction(char.id, true, false)}
                              style={{
                                flex: 1,
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.25)',
                                border: '1px solid rgba(16, 185, 129, 0.45)',
                                color: '#34d399',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <Unlock size={10} /> Grant Access
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAdminAction(char.id, lic.isUnlocked, true)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
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
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Users size={36} color="#475569" />
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Select a player from the list above to inspect character quotas or grant access.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
