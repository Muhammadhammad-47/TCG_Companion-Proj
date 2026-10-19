import React, { useState } from 'react';
import { getAvatarUrl, DEFAULT_AVATAR } from '../utils/avatarUtils';

/**
 * Universal PlayerAvatar Component
 * Displays the user's chosen PFP avatar from public/PFP Avatars/
 * Automatically handles image error fallback so it never displays an empty circle.
 */
export default function PlayerAvatar({
  avatarId,
  username = 'Player',
  size = 40,
  borderColor = 'var(--neon-gold, #FBC80D)',
  borderWidth = 2,
  className = '',
  style = {},
  onClick = null,
  showGlow = false
}) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(avatarId);
  const initial = (username || 'P').charAt(0).toUpperCase();

  return (
    <div
      className={`player-avatar-wrapper ${className}`}
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
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: showGlow ? `0 0 12px ${borderColor}` : 'none',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
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
            color: borderColor,
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
  );
}
