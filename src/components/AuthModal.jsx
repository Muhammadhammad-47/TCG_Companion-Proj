import React, { useState } from 'react';
import { authService } from '../services/authService';
import { X, User, Mail, Lock, Sparkles, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Please choose a warrior username.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const res = await authService.signUp(email, password, username);
        setSuccessMsg('Account created successfully! Welcome to Attention TCG.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 1200);
      } else {
        const res = await authService.signIn(email, password);
        setSuccessMsg('Welcome back, warrior!');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
          onClose();
        }, 800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(135deg, rgba(10, 20, 42, 0.95) 0%, rgba(5, 10, 24, 0.98) 100%)',
          border: '2px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 0 40px rgba(0, 240, 255, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          boxSizing: 'border-box',
          fontFamily: 'Rajdhani, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', marginBottom: '4px' }}>
            <Sparkles size={20} />
            <span style={{ fontSize: '0.9rem', letterSpacing: '3px', fontWeight: 'bold' }}>ATTENTION TCG AUTH</span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: '4px 0 6px 0', color: '#fff', fontWeight: '900', letterSpacing: '1px' }}>
            {isSignUp ? 'CREATE WARRIOR' : 'WARRIOR LOGIN'}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.92rem', margin: 0 }}>
            {isSignUp
              ? 'Join the arena and preserve your battle crystals & stats'
              : 'Sign in to access your profile, deck stats, and sister apps'}
          </p>
        </div>

        {/* Tabs: Sign In / Sign Up */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: !isSignUp ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: !isSignUp ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.6)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: isSignUp ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: isSignUp ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.6)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            REGISTER
          </button>
        </div>

        {/* Error and Success Alerts */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1.5px solid var(--neon-crimson)',
              color: '#ff88aa',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
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
              borderRadius: '10px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold' }}>
                WARRIOR USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. BlazingTiger"
                  required={isSignUp}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px 12px 40px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1.5px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold' }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="warrior@attentiontcg.com"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 'bold' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(90deg, #00f0ff 0%, #0099ff 100%)',
              color: '#000',
              fontWeight: '900',
              fontSize: '1.1rem',
              letterSpacing: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE WARRIOR ACCOUNT' : 'ENTER ARENA'}
          </button>
        </form>

        {/* Guest fallback note */}
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue as Guest Warrior (Without Cloud Sync)
          </button>
        </div>
      </div>
    </div>
  );
}
