import React from 'react';
import { X, Info } from 'lucide-react';
import { ACTION_CARDS } from '../data/cards';

export default function CardZoneModal({ player, onClose }) {
  const hand = player.actionCardsHand || [];
  
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999999, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
          border: '1.5px solid #00f0ff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(0, 240, 255, 0.3)',
          width: '100%', maxWidth: '500px', maxHeight: '80vh',
          padding: '20px', color: '#fff',
          display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'Orbitron, sans-serif', color: '#00f0ff' }}>YOUR ACTION CARDS ({hand.length}/10)</h2>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Privately view the cards in your hand.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ overflowY: 'auto', display: 'grid', gap: '8px', paddingRight: '4px' }}>
          {hand.map((card, i) => {
            const def = ACTION_CARDS.find(c => c.id === card.id) || card;
            return (
              <div
                key={card.instanceId || i}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${def.color || '#fff'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{def.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: def.color || '#fff', fontSize: '0.95rem' }}>{def.name}</strong>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      ⚡ {def.costET || 0} ET
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px', lineHeight: '1.3' }}>
                    {def.desc}
                  </div>
                </div>
              </div>
            );
          })}
          {hand.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>
              No Action Cards in hand.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
