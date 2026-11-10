import React, { useState, useEffect } from 'react';
import { getAvatarUrl, DEFAULT_AVATAR } from '../utils/avatarUtils';
import { COSMETIC_FRAMES, cosmeticsService } from '../services/cosmeticsService';
import DiscordAvatarDecoration from './DiscordAvatarDecoration';

/**
 * Universal PlayerAvatar Component
 * Displays user's chosen PFP avatar from public/PFP Avatars/
 * Enhanced with Discord-style Foreground Avatar Decorations,
 * Tiered Halos, VIP Wings, In-Match Combat Beacons & Voice Ripples.
 */
export default function PlayerAvatar({
  avatarId,
  frameId = null,
  tier = null, // 'common' | 'rare' | 'epic' | 'legendary' | 'cosmic' | 'vip'
  username = 'Player',
  size = 40,
  borderColor = 'var(--neon-gold, #FBC80D)',
  borderWidth = 2,
  className = '',
  style = {},
  onClick = null,
  showGlow = false,
  isActiveTurn = false,
  isLowHp = false,
  hasShield = false,
  isZombie = false,
  isSpeaking = false,
  isVip = false
}) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [avatarId]);

  const [activeEquippedFrame, setActiveEquippedFrame] = useState(() => {
    return typeof window !== 'undefined' ? cosmeticsService.getEquippedCosmetics()?.frame : 'frame_standard';
  });

  useEffect(() => {
    if (frameId) return;
    const handleUpdate = () => {
      setActiveEquippedFrame(cosmeticsService.getEquippedCosmetics()?.frame || 'frame_standard');
    };
    window.addEventListener('cosmetics_updated', handleUpdate);
    return () => window.removeEventListener('cosmetics_updated', handleUpdate);
  }, [frameId]);

  const avatarUrl = getAvatarUrl(avatarId);
  const initial = (username || 'P').charAt(0).toUpperCase();

  // Resolve frame styling: fallback to equipped frame from cosmeticsService if not explicitly specified
  const isNoFrame = frameId === false || frameId === 'none';
  const resolvedFrameId = isNoFrame
    ? null
    : (frameId || activeEquippedFrame);

  const frameData = resolvedFrameId ? COSMETIC_FRAMES.find(f => f.id === resolvedFrameId) : null;
  const finalBorderColor = frameData?.borderColor || borderColor;
  const finalGlowColor = frameData?.glowColor || finalBorderColor;
  const hasGlow = showGlow || Boolean(frameData?.glowColor);

  // Resolve tier halo class
  let haloClass = '';
  const resolvedTier = tier || (frameData?.rarity ? frameData.rarity.toLowerCase() : null);
  if (resolvedTier === 'rare') haloClass = 'avatar-halo-rare';
  else if (resolvedTier === 'epic') haloClass = 'avatar-halo-epic';
  else if (resolvedTier === 'legendary') haloClass = 'avatar-halo-legendary';
  else if (resolvedTier === 'cosmic') haloClass = 'avatar-halo-cosmic';
  else if (resolvedTier === 'vip' || isVip) haloClass = 'avatar-halo-legendary avatar-wings-vip';

  const avatarClasses = [
    'player-avatar-wrapper',
    className,
    frameData?.animated ? 'champion-halo-animated' : '',
    haloClass,
    isActiveTurn ? 'avatar-active-turn-beacon' : '',
    isLowHp ? 'avatar-low-hp-distress' : '',
    hasShield ? 'avatar-shield-hex' : '',
    isZombie ? 'avatar-zombie-infected' : '',
    isVip ? 'avatar-wings-vip' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={avatarClasses}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(2, 6, 18, 0.98))',
        border: resolvedFrameId ? 'none' : `${borderWidth}px solid ${finalBorderColor}`,
        boxShadow: hasGlow ? `0 0 14px ${finalGlowColor}` : 'none',
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {/* 1. Background: Circular avatar portrait masked with hidden overflow */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        border: resolvedFrameId ? '1.5px solid rgba(255,255,255,0.15)' : 'none'
      }}>
        {!imgError ? (
          <img
            src={avatarUrl}
            alt={username}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: finalBorderColor,
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: `${Math.max(12, Math.round(size * 0.45))}px`,
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* 2. Discord-Style Avatar Decoration (FOREGROUND on top of avatar circle) */}
      <DiscordAvatarDecoration frameId={resolvedFrameId} size={size} />

      {/* Voice-reactive acoustic ripples for speech */}
      {isSpeaking && (
        <>
          <span className="avatar-speech-wave" />
          <span className="avatar-speech-wave avatar-speech-wave-delayed" />
        </>
      )}
    </div>
  );
}
