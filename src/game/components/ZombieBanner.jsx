import React from 'react';
import { Skull, Flame, Zap, ShieldAlert, Heart } from 'lucide-react';

export default function ZombieBanner({ zombiePlayers }) {
  if (!zombiePlayers || zombiePlayers.length === 0) return null;

  return (
    <div className="zombie-global-banner">
      <div className="zombie-banner-left">
        <div className="zombie-pulse-badge">
          <Skull size={18} className="pulse-icon" /> ZOMBIE
        </div>
        <span className="zombie-banner-text">
          <strong>{zombiePlayers.map(p => p.name).join(', ')}</strong>
        </span>
      </div>

      <div className="zombie-banner-rules">
        <span className="rule-chip" title="40 HP, +10 regen"><Heart size={12} /> 40 · +10</span>
        <span className="rule-chip" title="Venom Strike: +1 poison"><Skull size={12} /> +1</span>
        <span className="rule-chip" title="Immune to Kontrol"><ShieldAlert size={12} /></span>
        <span className="rule-chip" title="Fire / Lightning clears poison"><Flame size={12} /></span>
      </div>
    </div>
  );
}
