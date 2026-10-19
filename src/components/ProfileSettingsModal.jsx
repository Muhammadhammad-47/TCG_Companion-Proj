import React, { useState } from 'react';
import { X, User, Lock, Award, Trophy, Check, AlertCircle, Save, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import { AVAILABLE_AVATARS, getAvatarUrl, DEFAULT_AVATAR } from '../utils/avatarUtils';
import PlayerAvatar from './PlayerAvatar';

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onProfileUpdated
}) {
  const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' | 'account' | 'stats'
  
  // Avatar selection state
  const currentAvatar = userProfile?.avatar_id || DEFAULT_AVATAR;
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  // Username edit state
  const [username, setUsername] = useState(userProfile?.username || '');
  const [usernameError, setUsernameError] = useState('');
  
  // Password edit state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Status messages
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep state synchronized when modal opens or userProfile changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(userProfile?.avatar_id || DEFAULT_AVATAR);
      setUsername(userProfile?.username || '');
      setUsernameError('');
      setPasswordError('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  // Handle saving chosen Avatar
  const handleSaveAvatar = async (avatarFilename) => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await authService.updateProfile(currentUser.id, {
        avatar_id: avatarFilename
      });
      setSelectedAvatar(avatarFilename);
      setSuccessMsg('Profile avatar updated successfully!');
      if (onProfileUpdated) onProfileUpdated(updated || { ...userProfile, avatar_id: avatarFilename });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setErrorMsg(err.message || 'Failed to update avatar');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating Username
  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setUsernameError('');
    setErrorMsg('');
    setSuccessMsg('');

    const clean = username.trim();
    if (!clean) {
      setUsernameError('Username cannot be empty.');
      return;
    }

    if (clean === userProfile?.username) {
      setUsernameError('This is already your current username.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await authService.updateProfile(currentUser.id, {
        username: clean
      });
      setSuccessMsg('Username updated successfully!');
      if (onProfileUpdated) onProfileUpdated(updated || { ...userProfile, username: clean });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update username:', err);
      setUsernameError(err.message || 'Username already taken or invalid.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      await authService.updatePassword(newPassword);
      setSuccessMsg('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update password:', err);
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  const matchesPlayed = userProfile?.matches_played || 0;
  const matchesWon = userProfile?.matches_won || 0;
  const crystals = userProfile?.crystals_collected || 0;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, rgba(8, 20, 44, 0.98), rgba(2, 6, 18, 0.99))',
          border: '1.5px solid rgba(251, 200, 13, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(251, 200, 13, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Barlow Condensed, sans-serif'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <PlayerAvatar
              avatarId={selectedAvatar}
              username={userProfile?.username}
              size={46}
              borderColor="var(--neon-gold, #FBC80D)"
              showGlow={true}
            />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.4rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{userProfile?.username || 'PLAYER'} PROFILE</span>
                {userProfile?.is_admin && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(251, 200, 13, 0.2)',
                      border: '1px solid var(--neon-gold, #FBC80D)',
                      color: 'var(--neon-gold, #FBC80D)',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                {currentUser?.email}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 42, 85, 0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          {[
            { id: 'avatar', label: 'SELECT AVATAR', icon: Sparkles },
            { id: 'account', label: 'ACCOUNT SETTINGS', icon: User },
            { id: 'stats', label: 'PLAYER STATS', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: isActive ? 'rgba(251, 200, 13, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid var(--neon-gold, #FBC80D)' : '3px solid transparent',
                  color: isActive ? 'var(--neon-gold, #FBC80D)' : 'rgba(255,255,255,0.6)',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div
            style={{
              padding: '10px 18px',
              background: 'rgba(57, 255, 20, 0.15)',
              borderBottom: '1px solid rgba(57, 255, 20, 0.4)',
              color: '#39ff14',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 42, 85, 0.15)',
              borderBottom: '1px solid rgba(255, 42, 85, 0.4)',
              color: '#ff8899',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: AVATAR PICKER */}
          {activeTab === 'avatar' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '1.2rem',
                    color: '#fff',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '0.5px'
                  }}
                >
                  CHOOSE YOUR PROFILE AVATAR
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  Select any avatar below. It will represent your player callsign in all matches, leaderboards, and the app header.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
                  gap: '14px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  padding: '10px 4px'
                }}
              >
                {AVAILABLE_AVATARS.map((avatarFile) => {
                  const isSelected = selectedAvatar === avatarFile;
                  return (
                    <div
                      key={avatarFile}
                      onClick={() => handleSaveAvatar(avatarFile)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '14px',
                        background: isSelected ? 'rgba(251, 200, 13, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid var(--neon-gold, #FBC80D)' : '1.5px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isSelected ? '0 0 16px rgba(251, 200, 13, 0.35)' : 'none',
                        cursor: isSaving ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'var(--neon-cyan, #00f0ff)';
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <img
                        src={getAvatarUrl(avatarFile)}
                        alt={avatarFile}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                        }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'var(--neon-gold, #FBC80D)',
                            color: '#000',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 8px rgba(251, 200, 13, 0.8)'
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: isSelected ? 'var(--neon-gold, #FBC80D)' : 'rgba(255,255,255,0.5)',
                          fontFamily: 'Bebas Neue, sans-serif',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {avatarFile.replace('.png', '').toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT SETTINGS (USERNAME & PASSWORD) */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Username Update Form */}
              <form
                onSubmit={handleUpdateUsername}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '1.15rem',
                    color: 'var(--neon-cyan, #00f0ff)',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <User size={18} />
                  <span>CHANGE USERNAME / CALLSIGN</span>
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Must be unique across all players (3 to 20 letters, numbers, hyphens, and underscores).
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError('');
                    }}
                    placeholder="Enter callsign..."
                    maxLength={20}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: usernameError ? '1.5px solid #ff2a55' : '1px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      letterSpacing: '0.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                      border: 'none',
                      color: '#000',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      fontFamily: 'Bebas Neue, sans-serif',
                      cursor: isSaving ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Save size={16} />
                    <span>SAVE</span>
                  </button>
                </div>
                {usernameError && (
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#ff8899' }}>
                    {usernameError}
                  </div>
                )}
              </form>

              {/* Password Update Form */}
              <form
                onSubmit={handleUpdatePassword}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <h4
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '1.15rem',
                    color: 'var(--neon-gold, #FBC80D)',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Lock size={18} />
                  <span>CHANGE PASSWORD</span>
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Enter a new password (minimum 6 characters).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="New password (min 6 characters)"
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: passwordError ? '1.5px solid #ff2a55' : '1px solid rgba(251, 200, 13, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Confirm new password"
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: passwordError ? '1.5px solid #ff2a55' : '1px solid rgba(251, 200, 13, 0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        background: 'linear-gradient(135deg, #FBC80D, #ff9900)',
                        border: 'none',
                        color: '#000',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        fontFamily: 'Bebas Neue, sans-serif',
                        cursor: isSaving ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={16} />
                      <span>UPDATE PASSWORD</span>
                    </button>
                  </div>
                  {passwordError && (
                    <div style={{ fontSize: '0.82rem', color: '#ff8899' }}>
                      {passwordError}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: STATS & PROGRESS */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '1.2rem',
                    color: '#fff',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '0.5px'
                  }}
                >
                  PLAYER STATS & COMBAT RECORD
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  Your live competitive performance across all multiplayer Kontrola arenas.
                </p>
              </div>

              {/* Stats Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '14px',
                  marginBottom: '24px'
                }}
              >
                {/* Matches Played */}
                <div
                  style={{
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    MATCHES
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'Bebas Neue, sans-serif' }}>
                    {matchesPlayed}
                  </div>
                </div>

                {/* Matches Won */}
                <div
                  style={{
                    background: 'rgba(57, 255, 20, 0.08)',
                    border: '1px solid rgba(57, 255, 20, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    VICTORIES
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#39ff14', fontFamily: 'Bebas Neue, sans-serif' }}>
                    {matchesWon}
                  </div>
                </div>

                {/* Win Rate */}
                <div
                  style={{
                    background: 'rgba(251, 200, 13, 0.08)',
                    border: '1px solid rgba(251, 200, 13, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    WIN RATE
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue, sans-serif' }}>
                    {winRate}%
                  </div>
                </div>

                {/* Crystals Collected */}
                <div
                  style={{
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    CRYSTALS
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c084fc', fontFamily: 'Bebas Neue, sans-serif' }}>
                    {crystals}
                  </div>
                </div>
              </div>

              {/* Progress Summary Bar */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                    COMBAT RATIO
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue, sans-serif' }}>
                    {matchesWon} WINS / {Math.max(0, matchesPlayed - matchesWon)} LOSSES
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    borderRadius: '5px',
                    background: 'rgba(255, 42, 85, 0.3)',
                    overflow: 'hidden',
                    display: 'flex'
                  }}
                >
                  <div
                    style={{
                      width: `${winRate}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #39ff14, #00f0ff)',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
