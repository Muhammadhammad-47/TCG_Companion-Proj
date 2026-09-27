import React, { useState, useEffect } from 'react';
import { Trophy, X, Medal } from 'lucide-react';
import { authService } from '../services/authService';

export const LeaderboardModal = ({ isOpen, onClose, fixedAppSource = null }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(fixedAppSource || 'global');

  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    setLoading(true);
    
    // If fixedAppSource is suddenly provided when already open, force update
    if (fixedAppSource && activeTab !== fixedAppSource) {
      setActiveTab(fixedAppSource);
    }

    const fetchBoard = async () => {
      try {
        const appSource = activeTab === 'global' ? null : activeTab;
        const data = await authService.getLeaderboard(25, appSource);
        if (isMounted) {
          setPlayers(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Leaderboard fetch error:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchBoard();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 18, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(10, 20, 40, 0.95)',
          border: '2px solid var(--neon-gold, #ffe600)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.25)',
          fontFamily: 'Rajdhani, sans-serif',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Trophy size={48} color="var(--neon-gold, #ffe600)" style={{ margin: '0 auto 10px auto' }} />
          <h2 style={{ color: 'var(--neon-gold, #ffe600)', margin: '0 0 4px 0', fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            HALL OF FAME
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>Top Ranked Attention TCG Players</p>
        </div>

        {/* Tabs for multiple leaderboards (hidden if locked to a specific product) */}
        {!fixedAppSource && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveTab('global')}
              style={{
                background: activeTab === 'global' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.05)',
                border: activeTab === 'global' ? '1px solid var(--neon-gold, #ffe600)' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === 'global' ? 'var(--neon-gold, #ffe600)' : 'rgba(255,255,255,0.6)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Global Overall
            </button>
            <button
              onClick={() => setActiveTab('kontrola')}
              style={{
                background: activeTab === 'kontrola' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                border: activeTab === 'kontrola' ? '1px solid var(--neon-cyan, #00f0ff)' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === 'kontrola' ? 'var(--neon-cyan, #00f0ff)' : 'rgba(255,255,255,0.6)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Kontrola Mode
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
            Loading rankings...
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scrollbar">
            {players.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '30px 0' }}>
                No ranked players found for this category.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : idx === 1 ? 'rgba(192, 192, 192, 0.1)' : idx === 2 ? 'rgba(205, 127, 50, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: idx === 0 ? '1px solid rgba(255, 215, 0, 0.4)' : idx === 1 ? '1px solid rgba(192, 192, 192, 0.4)' : idx === 2 ? '1px solid rgba(205, 127, 50, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      boxShadow: idx < 3 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    <div style={{ width: '40px', fontSize: '1.2rem', fontWeight: 'bold', color: idx === 0 ? '#ffe600' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.4)' }}>
                      #{idx + 1}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                        {p.username || 'Anonymous'}
                      </div>
                      {idx < 3 && <Medal size={16} color={idx === 0 ? '#ffe600' : idx === 1 ? '#c0c0c0' : '#cd7f32'} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 'bold' }}>Crystals</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--neon-cyan, #00f0ff)', fontWeight: 'bold' }}>{p.crystals_collected || 0}</div>
                      </div>
                      <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 'bold' }}>Wins</div>
                        <div style={{ fontSize: '1.1rem', color: '#39ff14', fontWeight: 'bold' }}>{p.matches_won || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
