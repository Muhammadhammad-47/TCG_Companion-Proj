import React, { useState, useEffect } from 'react';
import { X, Zap, Sparkles, Lock, Unlock, QrCode, Heart, Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAssetUrl, CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';

export default function ReserveEnergyModal({
  isOpen,
  onClose,
  character,           // { id, name, hp, maxHp, energyTokens, reserveHp, maxReserveHp, reserveUnlocked, ... }
  isMyTurn = true,
  onConfirmRecovery,   // (amount: number) => void
  onReleaseReserve,    // (reserveHp?: number) => void
  onOpenQRScanner      // () => void (optional external QR trigger)
}) {
  const [amount, setAmount] = useState(10);
  const [manualCode, setManualCode] = useState('');
  const [codeFeedback, setCodeFeedback] = useState({ text: '', type: '' });

  const currentHp = character?.hp || 0;
  const maxHp = character?.maxHp || 100;
  const missingHp = Math.max(0, maxHp - currentHp);
  const currentReserve = character?.reserveHp || 0;
  const maxPossible = Math.min(currentReserve, missingHp);
  const etCount = character?.energyTokens || 0;
  const hasEnoughET = etCount >= 2;
  const isUnlocked = Boolean(character?.reserveUnlocked);

  // Initialize amount whenever modal opens or maxPossible changes
  useEffect(() => {
    if (isOpen && character) {
      if (maxPossible > 0) {
        setAmount(Math.min(maxPossible, Math.max(1, amount > 0 ? amount : maxPossible)));
      } else {
        setAmount(0);
      }
      setCodeFeedback({ text: '', type: '' });
    }
  }, [isOpen, maxPossible, isUnlocked, character]);

  if (!isOpen || !character) return null;

  const handleStep = (delta) => {
    try { soundFX.playCard(); } catch {}
    setAmount(prev => Math.min(maxPossible, Math.max(1, prev + delta)));
  };

  const handleQuickSelect = (val) => {
    try { soundFX.playCard(); } catch {}
    setAmount(Math.min(maxPossible, Math.max(1, val)));
  };

  const handleExecuteRecovery = () => {
    if (!hasEnoughET) {
      try { soundFX.playError(); } catch {}
      return;
    }
    if (amount <= 0 || amount > maxPossible) return;
    try {
      if (soundFX && soundFX.playReserveEnergy) soundFX.playReserveEnergy();
      else if (soundFX && soundFX.playHeal) soundFX.playHeal();
    } catch {}
    onConfirmRecovery(amount);
    onClose();
  };

  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    const clean = manualCode.trim().toUpperCase();
    if (!clean) return;

    if (
      clean.includes('RELEASE-RESERVE') ||
      clean.includes('UNLOCK-RESERVE') ||
      clean.includes('KTRL-RESERVE') ||
      clean.includes('RELEASE_RESERVE') ||
      clean.includes('RELEASE') ||
      clean.includes('RESERVE')
    ) {
      try { soundFX.playLevelUp(); } catch {}
      setCodeFeedback({ text: '✅ QR Code Signature Verified! Energy Reserve Released (+30 Reserve HP)!', type: 'success' });
      setTimeout(() => {
        if (onReleaseReserve) onReleaseReserve(30);
      }, 700);
    } else {
      try { soundFX.playError(); } catch {}
      setCodeFeedback({ text: '❌ Invalid QR Release Code. Enter "RELEASE-RESERVE" or scan an official card QR.', type: 'error' });
    }
  };

  const charDef = CHARACTERS[character.id] || {};
  const charImage = getAssetUrl(character.image || charDef.image || 'characters/chynaman.png');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(180deg, #0d1624 0%, #080d17 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 0 45px rgba(16, 185, 129, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            background: 'rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${isUnlocked ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isUnlocked ? <Zap size={20} color="#10b981" /> : <Lock size={20} color="#ef4444" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.5px', fontFamily: 'Orbitron, Bebas Neue, sans-serif', color: isUnlocked ? '#10b981' : '#f87171' }}>
                {isUnlocked ? 'ENERGY RESERVE RECOVERY SYSTEM' : 'ENERGY RESERVE LOCKED'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                {isUnlocked ? 'Choose however much energy reserve you wish to use (Cost: 2 ET)' : 'Scan QR code to release Energy Reserve'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Character Summary Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px 14px'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                background: '#000',
                flexShrink: 0
              }}
            >
              <img
                src={charImage}
                alt={character.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{character.name}</strong>
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 'bold' }}>
                  🔋 {isUnlocked ? `${currentReserve} / ${character.maxReserveHp || character.baseReserveHP || currentReserve} HP Reserve` : 'LOCKED'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                <span>❤️ HP: <strong>{currentHp} / {maxHp}</strong></span>
                <span>⚡ ET: <strong>{etCount}</strong> (Cost: 2 ET)</span>
              </div>
              {/* HP Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentHp / maxHp) * 100))}%`,
                    height: '100%',
                    background: currentHp < 30 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* LOCKED STATE: When character's reserve is locked */}
          {!isUnlocked ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#e5e7eb', lineHeight: 1.5 }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#f87171' }}>
                    Energy Reserve Locked for {character.name}
                  </p>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)' }}>
                    The only characters whose energy reserve system is available at the beginning of the game are: <strong>Shroomy</strong>, <strong>Poochi</strong>, and <strong>Zambina aka "Bee"</strong>.
                  </p>
                  <p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.75)' }}>
                    All other characters' Energy Reserve system is locked at the beginning of the game until the player has scanned in the QR Code to Release their Energy Reserve.
                  </p>
                </div>
              </div>

              {/* QR Scan & Voucher Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {onOpenQRScanner && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenQRScanner();
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #00d2ff, #0066ff)',
                      border: 'none',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 0 20px rgba(0, 210, 255, 0.35)'
                    }}
                  >
                    <QrCode size={18} />
                    <span>SCAN PHYSICAL CARD QR CODE</span>
                  </button>
                )}

                <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Or enter code: RELEASE-RESERVE"
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '0.82rem'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    RELEASE
                  </button>
                </form>

                {codeFeedback.text && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: codeFeedback.type === 'success' ? '#10b981' : '#f87171',
                      textAlign: 'center',
                      padding: '4px'
                    }}
                  >
                    {codeFeedback.text}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* UNLOCKED STATE: Interactive Choose However Much Energy Reserve to Use */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Recovery Status Alert */}
              {!hasEnoughET ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} />
                  <span>Reserve Energy Recovery requires <strong>2 Energy Tokens (ET)</strong>. You have <strong>{etCount} ET</strong>.</span>
                </div>
              ) : currentReserve <= 0 ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} />
                  <span>Your Reserve Energy pool is completely depleted (0 HP remaining).</span>
                </div>
              ) : missingHp <= 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>Your character is already at maximum HP ({maxHp} HP)!</span>
                </div>
              ) : (
                /* Interactive Amount Selection Section */
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1.5px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#10b981' }}>
                      SELECT AMOUNT TO RECOVER
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>+</span>
                      <input
                        type="number"
                        min={1}
                        max={maxPossible}
                        value={amount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            setAmount(Math.min(maxPossible, Math.max(1, val)));
                          }
                        }}
                        style={{
                          width: '74px',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1.5px solid #10b981',
                          borderRadius: '8px',
                          color: '#fff',
                          fontWeight: '900',
                          fontSize: '1.25rem',
                          fontFamily: 'Orbitron, sans-serif',
                          textAlign: 'center',
                          padding: '4px'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>HP</span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min={1}
                    max={maxPossible}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#10b981',
                      cursor: 'pointer'
                    }}
                  />

                  {/* Step Buttons (-10, -5, +5, +10) */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleStep(-10)}
                      disabled={amount <= 1}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: amount <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(-5)}
                      disabled={amount <= 1}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: amount <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(5)}
                      disabled={amount >= maxPossible}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: amount >= maxPossible ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStep(10)}
                      disabled={amount >= maxPossible}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        cursor: amount >= maxPossible ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +10
                    </button>
                  </div>

                  {/* Quick Select Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickSelect(1)}
                      style={{
                        padding: '6px 8px',
                        background: amount === 1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.04)',
                        border: amount === 1 ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      MIN (1)
                    </button>
                    {maxPossible >= 10 && (
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(10)}
                        style={{
                          padding: '6px 8px',
                          background: amount === 10 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.04)',
                          border: amount === 10 ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        10 HP
                      </button>
                    )}
                    {maxPossible >= 20 && (
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(20)}
                        style={{
                          padding: '6px 8px',
                          background: amount === 20 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.04)',
                          border: amount === 20 ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        20 HP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickSelect(maxPossible)}
                      style={{
                        padding: '6px 8px',
                        background: amount === maxPossible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.04)',
                        border: amount === maxPossible ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      MAX ({maxPossible})
                    </button>
                  </div>

                  {/* Outcome Preview Math Box */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '0.78rem',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>HP After Recovery:</span>
                      <strong style={{ color: '#34d399' }}>{currentHp + amount} / {maxHp} HP</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Remaining Reserve HP:</span>
                      <strong style={{ color: '#10b981' }}>{currentReserve - amount} HP</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Energy Token Cost:</span>
                      <strong style={{ color: 'var(--neon-gold, #FBC80D)' }}>2 ET (Leaves {etCount - 2} ET)</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              CLOSE
            </button>
            {isUnlocked && maxPossible > 0 && hasEnoughET && (
              <button
                type="button"
                onClick={handleExecuteRecovery}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                }}
              >
                <Sparkles size={16} />
                <span>CONFIRM RECOVERY (+{amount} HP)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
