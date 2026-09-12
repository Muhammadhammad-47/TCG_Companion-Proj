import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { soundFX } from '../utils/audio';

const PREMADE_TAUNTS = [
  "You can't handle my true power!",
  "Is that all you've got?",
  "I'll crush you in the next round!",
  "Better luck next time, scrub!",
  "My victory is inevitable."
];

export default function TauntModal({ activePlayerName, onClose, onTaunt }) {
  const [customTaunt, setCustomTaunt] = useState('');
  const [recentTaunts, setRecentTaunts] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tcg_recent_taunts');
      if (saved) {
        setRecentTaunts(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecent = (msg) => {
    try {
      const updated = [msg, ...recentTaunts.filter(t => t !== msg)].slice(0, 3);
      setRecentTaunts(updated);
      localStorage.setItem('tcg_recent_taunts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = (msg) => {
    if (!msg.trim()) return;
    soundFX.playMenuClick();
    saveRecent(msg);
    onTaunt(msg);
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999999, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          border: '1.5px solid #6366f1',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(99, 102, 241, 0.3)',
          width: '100%', maxWidth: '450px',
          padding: '20px', color: '#fff'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>SEND A TAUNT</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Custom Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>CUSTOM TAUNT</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customTaunt}
              onChange={e => setCustomTaunt(e.target.value)}
              placeholder="Type something witty..."
              maxLength={60}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)',
                color: '#fff', outline: 'none', fontSize: '0.9rem'
              }}
              onKeyDown={e => e.key === 'Enter' && handleSend(customTaunt)}
            />
            <button
              onClick={() => handleSend(customTaunt)}
              style={{
                background: '#6366f1', color: '#fff', border: 'none',
                padding: '0 16px', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Recent Taunts */}
        {recentTaunts.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>RECENT TAUNTS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentTaunts.map((t, i) => (
                <button
                  key={i} onClick={() => handleSend(t)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0', padding: '8px 12px', borderRadius: '6px', textAlign: 'left',
                    cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  "{t}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premade Taunts */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>PRE-MADE TAUNTS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PREMADE_TAUNTS.map((t, i) => (
              <button
                key={i} onClick={() => handleSend(t)}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#c7d2fe', padding: '8px 12px', borderRadius: '6px', textAlign: 'left',
                  cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                "{t}"
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
