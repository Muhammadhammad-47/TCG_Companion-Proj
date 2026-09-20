import React, { useState } from 'react';
import { authService } from '../services/authService';
import { X, User, Mail, Lock, Sparkles, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess, preventClose = false }) {
  // authMode: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!username.trim()) {
          throw new Error('Please choose a username.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const res = await authService.signUp(email, password, username);
        setSuccessMsg('Account created successfully! Welcome to Attention TCG.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          if (onClose) onClose();
        }, 1200);

      } else if (authMode === 'signin') {
        const res = await authService.signIn(email, password);
        setSuccessMsg('Welcome back!');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          if (onClose) onClose();
        }, 800);

      } else if (authMode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please provide your registered email.');
        }
        await authService.resetPassword(email);
        setSuccessMsg('Password recovery email sent! Check your inbox to reset your password.');
      }
    } catch (err) {
      if (err?.status === 429 || (err?.message && (err.message.includes('429') || err.message.toLowerCase().includes('rate limit')))) {
        setErrorMsg('Too many attempts from this IP. For security, please wait 60 seconds before trying again.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 18, 0.92)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={() => {
        if (!preventClose && onClose) onClose();
      }}
    >
      {/* Ambient Neon Streaks matching App */}
      <div className="menu-bg-elements" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="neon-streak-red" style={{ opacity: 0.35 }}></div>
        <div className="neon-streak-blue" style={{ opacity: 0.35 }}></div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, rgba(10, 20, 42, 0.96) 0%, rgba(5, 10, 24, 0.98) 100%)',
          border: '2px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '24px',
          padding: '36px 30px',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
          zIndex: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (only if not full app guard) */}
        {!preventClose && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-pill-badge" style={{ margin: '0 auto 10px auto', fontSize: '0.85rem', padding: '2px 12px' }}>注意!</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan, #00f0ff)', marginBottom: '4px' }}>
            <Sparkles size={20} />
            <span style={{ fontSize: '0.9rem', letterSpacing: '3px', fontWeight: 'bold' }}>ATTENTION TCG AUTH GATE</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', margin: '4px 0 6px 0', color: '#fff', fontWeight: '900', letterSpacing: '1.5px' }}>
            {authMode === 'signup' && 'PLAYER REGISTRATION'}
            {authMode === 'signin' && 'PLAYER LOGIN'}
            {authMode === 'forgot' && 'ACCOUNT RECOVERY'}
          </h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem', margin: 0, fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
            {authMode === 'signup' && 'Create your player profile to preserve battle crystals & ranking.'}
            {authMode === 'signin' && 'Authenticate to enter the battle arena, chatbot & simulator.'}
            {authMode === 'forgot' && 'Enter your registered email to receive a password reset link.'}
          </p>
        </div>

        {/* Tabs: Sign In / Register (Hidden on forgot password) */}
        {authMode !== 'forgot' ? (
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: authMode === 'signin' ? 'rgba(0, 240, 255, 0.22)' : 'transparent',
                color: authMode === 'signin' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                letterSpacing: '1px',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                transition: 'all 0.2s'
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: authMode === 'signup' ? 'rgba(0, 240, 255, 0.22)' : 'transparent',
                color: authMode === 'signup' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                letterSpacing: '1px',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                transition: 'all 0.2s'
              }}
            >
              REGISTER
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--neon-cyan, #00f0ff)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </div>
        )}

        {/* Error and Success Alerts */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1.5px solid var(--neon-crimson, #ff3366)',
              color: '#ff88aa',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(57, 255, 20, 0.15)',
              border: '1.5px solid #39ff14',
              color: '#39ff14',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
              fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'signup' && (
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan, #00f0ff)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. BlazingTiger"
                  autoComplete="username"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 40px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan, #00f0ff)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@attentiontcg.com"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(5, 10, 24, 0.8)',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
                }}
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                  PASSWORD
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--neon-gold, #ffe600)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display, "Rajdhani", sans-serif)',
                      fontWeight: 'bold'
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan, #00f0ff)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 40px',
                    background: 'rgba(5, 10, 24, 0.8)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sub, "Outfit", sans-serif)'
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #00f0ff 0%, #0088ff 100%)',
              color: '#050a18',
              fontWeight: '900',
              fontSize: '1.15rem',
              letterSpacing: '1.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-display, "Rajdhani", sans-serif)'
            }}
          >
            {loading ? 'PROCESSING...' : authMode === 'signup' ? 'CREATE ACCOUNT' : authMode === 'signin' ? 'ENTER ATTENTION TCG' : 'SEND RESET LINK'}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sub, "Outfit", sans-serif)' }}>
          Secured by Attention TCG Ecosystem Database & Postgres RLS
        </div>
      </div>
    </div>
  );
}

