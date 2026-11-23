import React, { useState } from 'react';
import { Shield, Swords, Crown, Handshake, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { soundFX } from '../utils/audio';

export const RELATIONSHIP_OPTIONS = [
  {
    id: 'INDEPENDENT',
    title: 'Independent',
    badge: 'No Allegiance',
    icon: '🕊️',
    color: '#00f0ff',
    desc: 'Exile returns as a free agent with no diplomatic obligations.',
    rules: [
      'Both players remain free to attack any opponent.',
      'No penalties for engaging each other.',
      'Can form an alliance later using a Soul Alliance Card.'
    ]
  },
  {
    id: 'ALLIANCE',
    title: 'Alliance (NSA)',
    badge: 'Non-Sovereign Alliance',
    icon: '🤝',
    color: '#10b981',
    desc: 'Mutual non-aggression pact. Work together against common enemies.',
    rules: [
      'Friendly fire locked: neither player can target the other.',
      'Coordinate attacks against common opponents.',
      'Clean breakup requires ABANDON or BACK STAB Card.',
      '⚠️ Attacking without proper card inflicts -40 HP penalty!'
    ]
  },
  {
    id: 'SERVANT',
    title: 'Servant',
    badge: 'Master & Slave',
    icon: '👑',
    color: '#f59e0b',
    desc: 'Reviver becomes Master; Exile becomes Servant/Vassal with task rewards.',
    rules: [
      'Master can summon Slave for tasks (attack or defend common enemies).',
      'Slave receives stated reward (+1 Energy Token per turn).',
      'Breaking agreement without proper card inflicts -40 HP.',
      '⚔️ Slave can REBEL via BACK STAB to defeat Master and claim their World!'
    ]
  },
  {
    id: 'MERCENARY',
    title: 'Mercenary',
    badge: 'Paid Contract (3 Turns)',
    icon: '⚔️',
    color: '#a855f7',
    desc: 'Temporary 3-turn paid contract to complete a specific combat assignment.',
    rules: [
      'Contract lasts strictly 3 turns.',
      'Client agrees to pay bounty (Energy Tokens or Action Cards) upon completion.',
      'Friendly fire locked for the duration of the contract.',
      'Auto-dissolves back to Independent upon turn 3 completion.'
    ]
  }
];

export default function RelationshipSelectModal({
  isOpen,
  isProvider = true,
  partnerName = 'Opponent',
  onConfirmRelationship = () => {},
  onCancel = null
}) {
  const [selectedRelId, setSelectedRelId] = useState('ALLIANCE');

  if (!isOpen) return null;

  const currentOption = RELATIONSHIP_OPTIONS.find((o) => o.id === selectedRelId) || RELATIONSHIP_OPTIONS[0];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(2, 6, 18, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 100001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(14, 22, 44, 0.98) 0%, rgba(6, 10, 24, 0.99) 100%)',
          border: '2px solid rgba(251, 200, 13, 0.7)',
          borderRadius: '18px',
          padding: '24px',
          color: '#fff',
          boxShadow: '0 0 50px rgba(251, 200, 13, 0.4)',
          position: 'relative'
        }}
      >
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🏛️</div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#FBC80D', letterSpacing: '0.05em' }}>
            THE EMPIRE ERA: DIPLOMATIC TERMS
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Choose the diplomatic relationship between you and <strong>{partnerName}</strong>.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          {RELATIONSHIP_OPTIONS.map((opt) => {
            const isSelected = opt.id === selectedRelId;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  try { soundFX.playCard(); } catch {}
                  setSelectedRelId(opt.id);
                }}
                style={{
                  background: isSelected ? 'rgba(251, 200, 13, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? `2px solid ${opt.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 20px ${opt.color}40` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: `${opt.color}20`,
                        border: `1px solid ${opt.color}60`,
                        color: opt.color
                      }}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.9)' }}>
                    {opt.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.3' }}>
                    {opt.desc}
                  </p>
                </div>

                {isSelected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', color: opt.color, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <CheckCircle2 size={14} /> Selected Option
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Details Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${currentOption.color}50`,
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: currentOption.color, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{currentOption.icon}</span>
            <span>Rules for {currentOption.title}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: '1.5' }}>
            {currentOption.rules.map((rule, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{rule}</li>
            ))}
          </ul>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => {
            try { soundFX.playMenuSelect(); } catch {}
            onConfirmRelationship(selectedRelId);
          }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(90deg, #FBC80D 0%, #FF9900 100%)',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 0 25px rgba(251, 200, 13, 0.5)'
          }}
        >
          <span>CONFIRM {currentOption.title.toUpperCase()} RELATIONSHIP</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
