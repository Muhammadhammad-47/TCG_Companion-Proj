import React, { useState, useEffect } from 'react';
import { Heart, X, Clock, ShieldAlert, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';

/**
 * ReviveOfferModal
 * Displays peer-to-peer Revive offer between living Provider and defeated Exile.
 * Per Nov 21 Spec: Exile is revived through a Revive Action Card provided by another player.
 */
export default function ReviveOfferModal({
  isOpen,
  isProvider = false, // true = player offering revive, false = exile receiving revive
  providerName = 'Ally',
  exileName = 'Player',
  reviveHP = 50,
  maxHP = 100,
  countdownSeconds = 15,
  onAccept = () => {},
  onDecline = () => {},
  onCancelOffer = () => {}
}) {
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(countdownSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isProvider) {
            onCancelOffer();
          } else {
            onDecline();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdownSeconds, isProvider, onDecline, onCancelOffer]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(2, 6, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.96) 0%, rgba(8, 12, 28, 0.98) 100%)',
          border: '2px solid rgba(251, 200, 13, 0.6)',
          borderRadius: '16px',
          padding: '24px',
          color: '#fff',
          boxShadow: '0 0 40px rgba(251, 200, 13, 0.35)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251, 200, 13, 0.3) 0%, transparent 70%)',
              border: '2px solid #FBC80D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 0 20px rgba(251, 200, 13, 0.5)'
            }}
          >
            <Heart size={36} color="#FBC80D" fill="#FBC80D" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#FBC80D', letterSpacing: '0.05em' }}>
            {isProvider ? 'OFFERING REVIVAL TO EXILE' : '⚔️ RESCUE OFFER FROM ' + providerName.toUpperCase()}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            {isProvider
              ? `You are using a REVIVE Card to bring ${exileName} back from defeat into The Empire Era.`
              : `${providerName} is using a REVIVE Action Card to bring you back into the game as an Exile!`}
          </p>
        </div>

        {/* Benefits breakdown */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Restored Health:</span>
            <strong style={{ color: '#10b981' }}>+{reviveHP} HP (50% of {maxHP} max)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.88rem' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Properties Retained:</span>
            <span style={{ color: '#00f0ff' }}>ET, Reserve HP & Character Moves</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Next Step:</span>
            <span style={{ color: '#FBC80D' }}>Diplomatic Relationship Selection</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
            fontSize: '0.92rem',
            color: countdown <= 4 ? '#ef4444' : '#FBC80D'
          }}
        >
          <Clock size={16} />
          <span>Decision required in: <strong>{countdown}s</strong></span>
        </div>

        {/* Action Buttons */}
        {isProvider ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                try { soundFX.playCard(); } catch {}
                onCancelOffer();
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel Offer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                try { soundFX.playDamage(); } catch {}
                onDecline();
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ff8888',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <X size={18} /> DECLINE & QUIT
            </button>
            <button
              onClick={() => {
                try { soundFX.playLevelUp(); } catch {}
                onAccept();
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Heart size={18} fill="#fff" /> ACCEPT REVIVAL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
