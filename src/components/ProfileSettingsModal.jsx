import React, { useState } from 'react';
import { X, User, Lock, Award, Trophy, Check, AlertCircle, Save, Sparkles, Edit3 } from 'lucide-react';
import { authService } from '../services/authService';
import { AVAILABLE_AVATARS, getAvatarUrl, DEFAULT_AVATAR } from '../utils/avatarUtils';
import PlayerAvatar from './PlayerAvatar';

/**
 * ProfileSettingsView
 * Full-screen single page showing Avatar, Account Settings, and Stats in one clean view.
 * Clicking the avatar or 'Change Avatar' button opens a dedicated avatar selection modal.
 */
export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onProfileUpdated
}) {
  // Avatar picker modal sub-state
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

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

  // Live profile state fetched directly from database
  const [profileData, setProfileData] = useState(userProfile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Keep state synchronized and fetch fresh data directly from DB when opened
  React.useEffect(() => {
    if (isOpen) {
      const activeProf = profileData || userProfile;
      setSelectedAvatar(activeProf?.avatar_id || DEFAULT_AVATAR);
      setUsername(activeProf?.username || '');
      setUsernameError('');
      setPasswordError('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('');
      setErrorMsg('');
      setIsAvatarPickerOpen(false);

      // Fetch fresh authoritative stats & profile directly from Supabase DB
      if (currentUser?.id) {
        setIsLoadingProfile(true);
        authService.getProfile(currentUser.id)
          .then((fresh) => {
            if (fresh) {
              setProfileData(fresh);
              setSelectedAvatar(fresh.avatar_id || DEFAULT_AVATAR);
              setUsername(fresh.username || '');
              if (onProfileUpdated) onProfileUpdated(fresh);
            }
          })
          .catch((err) => console.warn('Failed to fetch fresh profile:', err))
          .finally(() => setIsLoadingProfile(false));
      }
    }
  }, [isOpen, currentUser?.id]);

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
      setProfileData(prev => ({ ...(prev || userProfile), avatar_id: avatarFilename }));
      setSuccessMsg('Avatar updated successfully!');
      setIsAvatarPickerOpen(false);
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
      setProfileData(prev => ({ ...(prev || userProfile), username: clean }));
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

  const activeProfile = profileData || userProfile;
  const matchesPlayed = activeProfile?.matches_played || 0;
  const matchesWon = activeProfile?.matches_won || 0;
  const crystals = activeProfile?.crystals_collected || 0;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(ellipse at top, #0a1936 0%, #030814 65%, #000208 100%)',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        fontFamily: 'Barlow Condensed, sans-serif'
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          width: '100%',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(4, 10, 24, 0.85)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          backdropFilter: 'blur(16px)',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => setIsAvatarPickerOpen(true)}
            title="Click to change avatar"
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <PlayerAvatar
              avatarId={selectedAvatar}
              username={activeProfile?.username}
              size={48}
              borderColor="var(--neon-gold, #FBC80D)"
              showGlow={true}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
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
              <Edit3 size={11} strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1px',
                  color: '#fff'
                }}
              >
                {activeProfile?.username || 'PLAYER'} PROFILE
              </h1>
              {activeProfile?.is_admin && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(251, 200, 13, 0.2)',
                    border: '1px solid var(--neon-gold, #FBC80D)',
                    color: 'var(--neon-gold, #FBC80D)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    letterSpacing: '0.5px',
                    fontWeight: 'bold'
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {currentUser?.email}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Back to Hub"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 42, 85, 0.3)';
            e.currentTarget.style.borderColor = '#ff2a55';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <X size={22} />
        </button>
      </div>

      {/* Global Notice Banners */}
      {successMsg && (
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(57, 255, 20, 0.15)',
            borderBottom: '1px solid rgba(57, 255, 20, 0.4)',
            color: '#39ff14',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
            padding: '12px 24px',
            background: 'rgba(255, 42, 85, 0.15)',
            borderBottom: '1px solid rgba(255, 42, 85, 0.4)',
            color: '#ff8899',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Single-Page Content Container */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '36px 24px 60px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        {/* SECTION 1: AVATAR & CALLSIGN HERO BANNER */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(8, 24, 52, 0.7), rgba(4, 12, 28, 0.9))',
            border: '1.5px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <div
              onClick={() => setIsAvatarPickerOpen(true)}
              title="Click to choose a new avatar"
              style={{
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <PlayerAvatar
                avatarId={selectedAvatar}
                username={activeProfile?.username}
                size={96}
                borderColor="var(--neon-gold, #FBC80D)"
                showGlow={true}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  background: 'var(--neon-gold, #FBC80D)',
                  color: '#000',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(251, 200, 13, 0.8)'
                }}
              >
                <Edit3 size={15} strokeWidth={2.5} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan, #00f0ff)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                ACTIVE PILOT CALLSIGN
              </div>
              <h2
                style={{
                  margin: '4px 0 6px 0',
                  fontSize: '2.4rem',
                  color: '#fff',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '1.5px'
                }}
              >
                {activeProfile?.username || 'Player'}
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                Avatar File: <span style={{ color: 'var(--neon-gold, #FBC80D)' }}>{selectedAvatar}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAvatarPickerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '1rem',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.7)')}
            onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.4)')}
          >
            <Sparkles size={18} />
            <span>CHANGE AVATAR</span>
          </button>
        </div>

        {/* SECTION 2: PLAYER STATS & PROGRESS */}
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.4rem',
              color: 'var(--neon-gold, #FBC80D)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trophy size={20} />
            <span>PLAYER STATS & COMPETITIVE RECORD</span>
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            {/* Matches Played */}
            <div
              style={{
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1.5px solid rgba(0, 240, 255, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                MATCHES PLAYED
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--neon-cyan, #00f0ff)', fontFamily: 'Bebas Neue, sans-serif' }}>
                {matchesPlayed}
              </div>
            </div>

            {/* Victories */}
            <div
              style={{
                background: 'rgba(57, 255, 20, 0.08)',
                border: '1.5px solid rgba(57, 255, 20, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                VICTORIES
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#39ff14', fontFamily: 'Bebas Neue, sans-serif' }}>
                {matchesWon}
              </div>
            </div>

            {/* Win Rate */}
            <div
              style={{
                background: 'rgba(251, 200, 13, 0.08)',
                border: '1.5px solid rgba(251, 200, 13, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                WIN RATE
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue, sans-serif' }}>
                {winRate}%
              </div>
            </div>

            {/* Crystals */}
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1.5px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                CRYSTALS
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#c084fc', fontFamily: 'Bebas Neue, sans-serif' }}>
                {crystals}
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '14px',
              padding: '16px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                COMBAT PERFORMANCE RATIO
              </span>
              <span style={{ fontSize: '0.95rem', color: 'var(--neon-gold, #FBC80D)', fontFamily: 'Bebas Neue, sans-serif' }}>
                {matchesWon} WINS / {Math.max(0, matchesPlayed - matchesWon)} LOSSES
              </span>
            </div>
            <div
              style={{
                height: '12px',
                borderRadius: '6px',
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

        {/* SECTION 3: ACCOUNT SETTINGS (USERNAME & PASSWORD) */}
        <div>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.4rem',
              color: 'var(--neon-cyan, #00f0ff)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <User size={20} />
            <span>ACCOUNT & SECURITY SETTINGS</span>
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Username Update Form */}
            <form
              onSubmit={handleUpdateUsername}
              style={{
                background: 'rgba(4, 12, 28, 0.75)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  color: 'var(--neon-cyan, #00f0ff)',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '0.5px'
                }}
              >
                CHANGE CALLSIGN / USERNAME
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                3 to 20 letters, numbers, hyphens, and underscores.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
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
                    border: usernameError ? '1.5px solid #ff2a55' : '1px solid rgba(0, 240, 255, 0.35)',
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
                <div style={{ fontSize: '0.82rem', color: '#ff8899' }}>
                  {usernameError}
                </div>
              )}
            </form>

            {/* Password Update Form */}
            <form
              onSubmit={handleUpdatePassword}
              style={{
                background: 'rgba(4, 12, 28, 0.75)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(251, 200, 13, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  color: 'var(--neon-gold, #FBC80D)',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Lock size={16} />
                <span>CHANGE PASSWORD</span>
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                Minimum 6 characters.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    border: passwordError ? '1.5px solid #ff2a55' : '1px solid rgba(251, 200, 13, 0.35)',
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
                    border: passwordError ? '1.5px solid #ff2a55' : '1px solid rgba(251, 200, 13, 0.35)',
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
        </div>
      </div>

      {/* MODAL: AVATAR SELECTION DIALOG */}
      {isAvatarPickerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              background: 'linear-gradient(135deg, rgba(8, 20, 44, 0.98), rgba(2, 6, 18, 0.99))',
              border: '2px solid var(--neon-gold, #FBC80D)',
              borderRadius: '20px',
              boxShadow: '0 16px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(251, 200, 13, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0, 0, 0, 0.4)'
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontFamily: 'Bebas Neue, sans-serif',
                    color: 'var(--neon-gold, #FBC80D)',
                    letterSpacing: '1px'
                  }}
                >
                  SELECT YOUR PROFILE AVATAR
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Click any avatar below to pick it.
                </p>
              </div>

              <button
                onClick={() => setIsAvatarPickerOpen(false)}
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
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Grid */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: '14px'
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
                      padding: '10px 8px',
                      borderRadius: '14px',
                      background: isSelected ? 'rgba(251, 200, 13, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid var(--neon-gold, #FBC80D)' : '1.5px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isSelected ? '0 0 16px rgba(251, 200, 13, 0.4)' : 'none',
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
                          top: '6px',
                          right: '6px',
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
        </div>
      )}
    </div>
  );
}
