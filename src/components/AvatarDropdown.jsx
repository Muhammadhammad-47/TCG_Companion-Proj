import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CHAT_AVATARS } from '../chatAvatars';

export function AvatarDropdown({ selectedAvatarId, onSelectAvatar, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  const currentAvatar = CHAT_AVATARS[selectedAvatarId] || CHAT_AVATARS.chyna;

  const handleSelect = (avatarId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onSelectAvatar(avatarId);
    setIsOpen(false);
  };

  return (
    <div 
      className="avatar-dropdown-container"
      style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 1001 : 1 }}
    >
      {/* Invisible backdrop to dismiss dropdown on outside click */}
      {isOpen && (
        <div
          id="avatar-dropdown-backdrop"
          onClick={() => setIsOpen(false)}
          onTouchEnd={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'transparent',
            cursor: 'default',
          }}
        />
      )}

      {/* Main Trigger Button */}
      <button
        id="avatar-trigger-btn"
        type="button"
        className="avatar-dropdown-trigger"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title={disabled ? "Please wait until the bot stops speaking" : "Select AI Companion Avatar"}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(5, 12, 28, 0.85)',
          border: `1.5px solid ${isOpen ? (currentAvatar.themeColor || 'var(--neon-cyan)') : 'rgba(0, 240, 255, 0.4)'}`,
          boxShadow: isOpen ? `0 0 14px ${currentAvatar.themeColor || '#00f0ff'}66` : '0 2px 8px rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          padding: '4px 10px 4px 6px',
          color: 'var(--text-light, #ffffff)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '0.78rem',
          transition: 'all 0.2s ease',
          outline: 'none',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          zIndex: isOpen ? 9999 : 'auto',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Idle Icon Thumbnail */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `1.5px solid ${currentAvatar.themeColor || '#00f0ff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0f1d',
            flexShrink: 0,
            boxShadow: `0 0 8px ${currentAvatar.themeColor}55`,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}${currentAvatar.idlePath}`}
            alt={currentAvatar.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${currentAvatar.scale ? currentAvatar.scale * 1.5 : 1})`,
              transformOrigin: 'center center',
            }}
          />
        </div>

        <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
          {currentAvatar.shortName || currentAvatar.name}
        </span>

        <ChevronDown 
          size={14} 
          style={{ 
            color: currentAvatar.themeColor || 'var(--neon-cyan, #00f0ff)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="avatar-dropdown-menu"
          className="avatar-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            maxHeight: '360px',
            overflowY: 'auto',
            background: 'rgba(8, 14, 30, 0.96)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 240, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeInMenu 0.15s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '1px',
              padding: '4px 8px 6px 8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Select AI Companion</span>
            <span style={{ color: 'var(--neon-cyan)', fontSize: '0.6rem' }}>4 Bots</span>
          </div>

          {Object.values(CHAT_AVATARS).map((avatar) => {
            const isSelected = avatar.id === selectedAvatarId;
            return (
              <button
                key={avatar.id}
                id={`avatar-option-${avatar.id}`}
                data-avatar-id={avatar.id}
                type="button"
                onClick={(e) => handleSelect(avatar.id, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isSelected 
                    ? `linear-gradient(90deg, ${avatar.themeColor}28, rgba(0, 240, 255, 0.12))` 
                    : 'transparent',
                  border: isSelected 
                    ? `1px solid ${avatar.themeColor}aa` 
                    : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  color: '#fff',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {/* Idle Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${isSelected ? avatar.themeColor : 'rgba(255, 255, 255, 0.25)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0f1d',
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 12px ${avatar.themeColor}88` : 'none',
                  }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${avatar.idlePath}`}
                    alt={avatar.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: `scale(${avatar.scale ? avatar.scale * 1.5 : 1})`,
                      transformOrigin: 'center center',
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isSelected ? (avatar.themeColor || '#00f0ff') : '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {avatar.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {avatar.subtitle}
                  </div>
                </div>

                {isSelected && (
                  <Check size={16} style={{ color: avatar.themeColor || 'var(--neon-cyan)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
