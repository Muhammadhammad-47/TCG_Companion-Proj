import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Sparkles, Volume2, VolumeX, ShieldCheck, Gift } from 'lucide-react';
import { adService } from '../services/adService';
import { soundFX } from '../game/utils/audio';

export default function AdModal({
  isOpen = false,
  userId = null,
  onClose,
  onRewardGranted
}) {
  const [adData, setAdData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const ad = adService.getNextAd();
      setAdData(ad);
      setSecondsRemaining(5);
      setCanSkip(false);
      setRewardClaimed(false);
      adService.recordAdShown();

      try { soundFX.playCard(); } catch (e) {}

      // 5-second countdown timer
      const interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanSkip(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !adData) return null;

  const handleClose = async () => {
    if (!rewardClaimed && adData.bonusGold > 0) {
      setRewardClaimed(true);
      const res = await adService.grantAdReward(userId, adData.bonusGold);
      try { soundFX.playLevelUp(); } catch (e) {}
      if (onRewardGranted) onRewardGranted(adData.bonusGold);
    }
    if (onClose) onClose();
  };

  const handleCtaClick = () => {
    if (adData.ctaUrl.startsWith('http')) {
      window.open(adData.ctaUrl, '_blank', 'noopener,noreferrer');
    } else if (adData.ctaUrl === '#store') {
      window.dispatchEvent(new CustomEvent('open_store_modal'));
    }
    handleClose();
  };

  return (
    <div
      className="arena-modal-backdrop"
      style={{
        zIndex: 9999999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="arena-modal-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(145deg, #0d121f 0%, #060911 100%)',
          border: `2px solid ${adData.accentColor}`,
          boxShadow: `0 0 35px ${adData.accentColor}55`,
          borderRadius: '18px',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'rgba(0, 0, 0, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}
            >
              Sponsored Ad
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          <div>
            {canSkip ? (
              <button
                onClick={handleClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '4px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>SKIP AD</span>
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Reward in <strong style={{ color: adData.accentColor }}>{secondsRemaining}s</strong>
              </span>
            )}
          </div>
        </div>

        {/* Ad Body Content */}
        <div style={{ padding: '24px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Advertiser & Tagline */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {adData.advertiser}
            </span>
            <div
              style={{
                display: 'inline-block',
                marginTop: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: adData.accentColor,
                background: `${adData.accentColor}18`,
                border: `1px solid ${adData.accentColor}55`,
                padding: '2px 10px',
                borderRadius: '10px'
              }}
            >
              {adData.badgeText}
            </div>
          </div>

          {/* Ad Visual Graphic Showcase */}
          <div
            style={{
              position: 'relative',
              borderRadius: '14px',
              padding: '24px 16px',
              background: `radial-gradient(circle at center, ${adData.accentColor}25 0%, rgba(5, 8, 16, 0.95) 75%)`,
              border: `1px solid ${adData.accentColor}44`,
              overflow: 'hidden'
            }}
          >
            {/* Ambient Graphic Backdrop */}
            <div
              style={{
                fontSize: '4.5rem',
                lineHeight: 1,
                marginBottom: '10px',
                filter: `drop-shadow(0 0 16px ${adData.accentColor})`
              }}
            >
              {adData.imageType === 'booster' ? '🎴' : adData.imageType === 'vip' ? '👑' : '🏆'}
            </div>

            <h2
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.9rem',
                color: '#fff',
                letterSpacing: '1.5px',
                margin: '0 0 6px 0',
                textShadow: `0 0 12px ${adData.accentColor}88`
              }}
            >
              {adData.title}
            </h2>

            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.88rem', lineHeight: '1.45', margin: 0 }}>
              {adData.description}
            </p>
          </div>

          {/* Bonus Reward Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(251, 200, 13, 0.1)',
              border: '1px solid rgba(251, 200, 13, 0.35)',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#FBC80D'
            }}
          >
            <Gift size={16} />
            <span>Watch reward: <strong>+{adData.bonusGold} Bonus Gold</strong> awarded upon closing</span>
          </div>

          {/* Action CTA Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleCtaClick}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: `linear-gradient(135deg, ${adData.accentColor} 0%, #ff8800 100%)`,
                border: 'none',
                color: '#000',
                fontWeight: 'bold',
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.25rem',
                letterSpacing: '1px',
                padding: '12px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: `0 0 18px ${adData.accentColor}66`,
                transition: 'transform 0.15s ease'
              }}
            >
              <span>{adData.ctaText}</span>
              <ExternalLink size={16} />
            </button>

            {canSkip && (
              <button
                onClick={handleClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 'bold',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                CLOSE
              </button>
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div
          style={{
            padding: '8px',
            textAlign: 'center',
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            background: 'rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          Attention TCG Pilot Network · Ads support server hosting & multiplayer matchmaking
        </div>
      </div>
    </div>
  );
}
