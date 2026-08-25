import React from 'react';
import { CHARACTERS, ZOMBIE_PROFILE } from '../data/characters';
import { Shield, Skull, Zap, Gem, Plus, Minus, Flame, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function PlayerCard({
  player,
  isActive,
  onSelectAction,
  onAdjustHP,
  onAdjustPoison,
  onAdjustET,
  onAdjustCrystals,
  tvMode
}) {
  const char = CHARACTERS[player.characterId] || CHARACTERS.chynaman;
  const isZombie = player.isZombie;
  const isLevel2 = player.hp >= 150;

  const hpPercentage = Math.min(100, Math.max(0, (player.hp / (isZombie ? ZOMBIE_PROFILE.baseHP : 150)) * 100));

  return (
    <div
      className={`player-board-card ${isActive ? 'active-turn-glow' : ''} ${isZombie ? 'zombie-theme-card' : ''} ${tvMode ? 'tv-card' : ''}`}
      style={{
        '--player-accent': isZombie ? '#52c41a' : char.themeColor
      }}
    >
      {/* Active turn badge */}
      {isActive && (
        <div className="active-turn-banner">
          <Sparkles size={14} className="spin-icon" /> ACTIVE TURN
        </div>
      )}

      {/* Card Header */}
      <div className="card-top-row">
        <div className="player-avatar-box">
          <span className="avatar-emoji">{isZombie ? '🧟‍♂️' : char.avatar}</span>
          {isZombie && <span className="zombie-tag-overlay">ZOMBIE</span>}
        </div>

        <div className="player-meta-box">
          <div className="name-and-crystals">
            <h3 className="player-display-name">{player.name}</h3>
            <div className="crystals-cluster" title={`${player.crystals}/3 Stability Crystals (Need 3 to win!)`}>
              {[...Array(3)].map((_, i) => (
                <Gem
                  key={i}
                  size={16}
                  className={`crystal-icon ${i < player.crystals ? 'crystal-active' : 'crystal-empty'}`}
                />
              ))}
            </div>
          </div>
          <span className="char-sub-name">{isZombie ? 'Undead' : char.name}</span>
        </div>
      </div>

      {/* HP Bar */}
      <div className="hp-section">
        <div className="hp-header-row">
          <span className="hp-label">HP</span>
          <div className="hp-value-group">
            <span className={`hp-num ${player.hp < 30 ? 'critical-hp' : ''}`}>{player.hp}</span>
            <span className="hp-max">/ {isZombie ? ZOMBIE_PROFILE.baseHP : 150}</span>
            {isLevel2 && <span className="lvl2-badge" title="Level 2 cards unlocked">LVL 2</span>}
          </div>
        </div>

        <div className="hp-bar-track">
          <div
            className={`hp-bar-fill ${isZombie ? 'zombie-hp-fill' : ''} ${player.hp < 30 ? 'hp-danger' : ''}`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>

        {/* Quick HP adjustment buttons */}
        <div className="quick-adjust-row">
          <button className="quick-btn dmg" onClick={() => onAdjustHP(player.id, -10)} title="-10 HP">
            -10
          </button>
          <button className="quick-btn dmg" onClick={() => onAdjustHP(player.id, -5)} title="-5 HP">
            -5
          </button>
          <button className="quick-btn heal" onClick={() => onAdjustHP(player.id, +10)} title="+10 HP">
            +10
          </button>
          <button className="quick-btn heal" onClick={() => onAdjustHP(player.id, +20)} title="+20 HP">
            +20
          </button>
        </div>
      </div>

      {/* Energy & Status Grid */}
      <div className="stats-badges-grid">
        {/* Energy Tokens */}
        <div className="stat-pill et-pill" title="Energy tokens">
          <div className="pill-left">
            <Zap size={14} color="#ffe93d" />
            <span className="pill-val">{player.energyTokens}/10</span>
          </div>
          <div className="mini-pm-group">
            <button className="mini-btn" onClick={() => onAdjustET(player.id, -1)} disabled={player.energyTokens <= 0}>-</button>
            <button className="mini-btn" onClick={() => onAdjustET(player.id, +1)} disabled={player.energyTokens >= 10}>+</button>
          </div>
        </div>

        {/* Poison Cards */}
        <div
          className={`stat-pill poison-pill ${player.poisonCards >= 5 ? 'zombie-alert' : ''}`}
          title="Poison — 5 turns you into a zombie"
        >
          <div className="pill-left">
            <Skull size={14} color={player.poisonCards >= 5 ? '#39ff14' : '#a0d911'} />
            <span className="pill-val">{player.poisonCards}/10</span>
          </div>
          <div className="mini-pm-group">
            <button className="mini-btn" onClick={() => onAdjustPoison(player.id, -1)} disabled={player.poisonCards <= 0}>-</button>
            <button className="mini-btn" onClick={() => onAdjustPoison(player.id, +1)} disabled={player.poisonCards >= 10}>+</button>
          </div>
        </div>
      </div>

      {/* Active Badges */}
      <div className="status-badges-row">
        {isZombie ? (
          <>
            <div className="status-tag zombie-status" title="Immune to Kontrol · +10 HP regen">
              🧟 ZOMBIE · {player.poisonCards >= 8 ? '40' : player.poisonCards >= 6 ? '20' : '10'} HP
            </div>
            {player.poisonCards >= 8 && (
              <div className="status-tag fury-tag" title="Venom Strike +10 AP">
                🔥 FURY +10
              </div>
            )}
          </>
        ) : (
          <>
            <div className="status-tag dp-tag" title="Defence on a 6+ roll">
              <Shield size={12} /> -{char.defaultDP} · 6+
            </div>
            <div className="status-tag weak-tag" title={`Weak to ${char.weakness.type}`}>
              {char.weakness.icon} {char.weakness.type} +{char.weakness.bonusAP}
            </div>
          </>
        )}

        {player.shield > 0 && (
          <div className="status-tag shield-active" title="Shield">
            🛡️ +{player.shield}
          </div>
        )}

        {player.isStunned && (
          <div className="status-tag stun-active" title="Skips next turn">
            ⚡ STUNNED
          </div>
        )}
      </div>

      {/* Play Move Action for Active Player */}
      {isActive && (
        <button
          className="btn-play-action"
          onClick={() => {
            soundFX.playCard();
            onSelectAction(player);
          }}
        >
          <Sparkles size={16} /> PLAY
        </button>
      )}
    </div>
  );
}
