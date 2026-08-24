import React from 'react';
import { Skull, Flame, Zap, ShieldAlert, Heart } from 'lucide-react';

export default function ZombieBanner({ zombiePlayers }) {
  if (!zombiePlayers || zombiePlayers.length === 0) return null;

  return (
    <div className="zombie-global-banner">
      <div className="zombie-banner-left">
        <div className="zombie-pulse-badge">
          <Skull size={18} className="pulse-icon" /> ZOMBIE OUTBREAK ACTIVE
        </div>
        <span className="zombie-banner-text">
          Infected Warriors: <strong>{zombiePlayers.map(p => p.name).join(', ')}</strong>
        </span>
      </div>

      <div className="zombie-banner-rules">
        <span className="rule-chip"><Heart size={12} /> HP 40 (+10 Regen/Turn)</span>
        <span className="rule-chip"><Skull size={12} /> Venom Strike (Infects +1 Poison)</span>
        <span className="rule-chip"><Zap size={12} /> Immune to Kontrol</span>
        <span className="rule-chip"><Flame size={12} /> Fire/Lightning removes Poison</span>
      </div>
    </div>
  );
}
