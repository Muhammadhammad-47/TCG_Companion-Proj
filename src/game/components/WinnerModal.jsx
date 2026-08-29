import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';
import {
  Trophy, Crown, Swords, Shield, Heart, Clock,
  RotateCcw, Home, Sparkles, ScrollText, Layers, Skull
} from 'lucide-react';

export default function WinnerModal({ winner, players, turnNumber, onRematch, onHome, onContinue }) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const winnerChar = CHARACTERS[winner?.characterId] || CHARACTERS.chynaman;

  useEffect(() => {
    soundFX.playVictory();

    // Confetti celebration (Stability Crystals)
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#00f0ff', '#39ff14', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 70,
        origin: { x: 0.1, y: 0.6 },
        colors: colors,
        shapes: ['square'] // Like crystals
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 70,
        origin: { x: 0.9, y: 0.6 },
        colors: colors,
        shapes: ['square']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const otherPlayers = (players || [])
    .filter(p => p.id !== winner.id)
    .sort((a, b) => b.hp - a.hp);

  const runnerUp1 = otherPlayers[0] || { name: 'Bee', characterId: 'bee', hp: 7200 };
  const runnerUp2 = otherPlayers[1] || { name: 'Katsumi', characterId: 'katsumi', hp: 6500 };

  const char1 = CHARACTERS[runnerUp1.characterId] || CHARACTERS.bee;
  const char2 = CHARACTERS[runnerUp2.characterId] || CHARACTERS.katsumi;

  return (
    <div className="winner-screen-overlay">
      {/* Golden Overhead Light Rays & Ambient Glow */}
      <div className="victory-light-cone"></div>
      <div className="victory-particles-ambient"></div>

      <div className="winner-canvas-card winner-card">
        {/* Top Header */}
        <header className="winner-top-header">
          <h1 className="winner-title-text">WINNER</h1>
          <div className="winner-sub-victory">
            <span className="gold-diamond">✦</span>
            <span>VICTORY IS YOURS</span>
            <span className="gold-diamond">✦</span>
          </div>
        </header>

        {/* 2-Column Champion & Podium Grid */}
        <div className="winner-content-grid">
          {/* Left Column: Champion Showcase Card */}
          <div className="champion-showcase-card">
            <div className="champ-laurel-badge">
              <div className="wreath-crown-icon">
                <Crown size={22} color="#ffd700" fill="#ffd700" />
              </div>
              <div className="wreath-circle">
                <span className="wreath-leaf leaf-left">🌿</span>
                <span className="wreath-number">1</span>
                <span className="wreath-leaf leaf-right">🌿</span>
              </div>
            </div>

            <div className="champ-name-header">
              <h2 className="champ-hero-name">{winner.name || winnerChar.name}</h2>
              <div className="champ-signature-technique">
                <Swords size={16} color="var(--neon-crimson)" />
                <span>{winnerChar.signatureMove || 'Shadow Strike'}</span>
              </div>
            </div>

            <div className="champ-score-box">
              <span className="champ-score-label">SCORE</span>
              <strong className="champ-score-value">
                {winnerChar.stats?.score ? Number(winnerChar.stats.score).toLocaleString() : '12,450'}
              </strong>
            </div>

            {/* Performance Stats Breakdown */}
            <div className="champ-stats-breakdown">
              <div className="breakdown-row">
                <div className="breakdown-stat-label">
                  <Swords size={14} color="var(--neon-crimson)" />
                  <span>Damage Dealt</span>
                </div>
                <strong className="breakdown-val">8,500</strong>
              </div>

              <div className="breakdown-row">
                <div className="breakdown-stat-label">
                  <Shield size={14} color="var(--neon-cyan)" />
                  <span>Damage Taken</span>
                </div>
                <strong className="breakdown-val">2,150</strong>
              </div>

              <div className="breakdown-row">
                <div className="breakdown-stat-label">
                  <Layers size={14} color="#ffd700" />
                  <span>Cards Played</span>
                </div>
                <strong className="breakdown-val">23</strong>
              </div>

              <div className="breakdown-row">
                <div className="breakdown-stat-label">
                  <Skull size={14} color="var(--neon-pink)" />
                  <span>Effects Triggered</span>
                </div>
                <strong className="breakdown-val">14</strong>
              </div>
            </div>

            {/* Champion Quote */}
            <div className="champ-quote-box">
              <p>“{winnerChar.quote || 'You have to believe in your own strength.'}”</p>
            </div>

            {/* Champion Art Frame */}
            <div className="champ-character-art-frame">
              <img
                src={getAssetUrl(winnerChar.image)}
                alt={winnerChar.name}
                className="champ-full-art"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="champ-emoji-large">{winnerChar.avatar}</div>
              <div className="champ-aura-glow"></div>
            </div>
          </div>

          {/* Right Column: Runners Up Podium Cards */}
          <div className="winner-podium-column">
            {/* Rank 2 Card */}
            <div className="podium-runner-card runner-rank-2">
              <div className="podium-laurel-badge silver-laurel">
                <div className="wreath-circle">
                  <span className="wreath-number">2</span>
                </div>
              </div>

              <div className="podium-avatar-holder" style={{ borderColor: char1.themeColor }}>
                <img
                  src={getAssetUrl(char1.image)}
                  alt={char1.name}
                  className="podium-avatar-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="podium-emoji">{char1.avatar}</span>
              </div>

              <div className="podium-info-block">
                <strong className="podium-player-name">{runnerUp1.name}</strong>
                <div className="podium-move-tag">
                  <Shield size={13} color="var(--neon-cyan)" />
                  <span>{char1.signatureMove || 'Azure Guard'}</span>
                </div>
              </div>

              <div className="podium-score-block">
                <span className="podium-score-lbl">SCORE</span>
                <strong className="podium-score-num">7,200</strong>
              </div>
            </div>

            {/* Rank 3 Card */}
            <div className="podium-runner-card runner-rank-3">
              <div className="podium-laurel-badge bronze-laurel">
                <div className="wreath-circle">
                  <span className="wreath-number">3</span>
                </div>
              </div>

              <div className="podium-avatar-holder" style={{ borderColor: char2.themeColor }}>
                <img
                  src={getAssetUrl(char2.image)}
                  alt={char2.name}
                  className="podium-avatar-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="podium-emoji">{char2.avatar}</span>
              </div>

              <div className="podium-info-block">
                <strong className="podium-player-name">{runnerUp2.name}</strong>
                <div className="podium-move-tag">
                  <Swords size={13} color="var(--neon-crimson)" />
                  <span>{char2.signatureMove || 'Blazing Vanguard'}</span>
                </div>
              </div>

              <div className="podium-score-block">
                <span className="podium-score-lbl">SCORE</span>
                <strong className="podium-score-num">6,500</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Match Metrics Bar */}
        <div className="winner-metrics-bar">
          <div className="metric-chip">
            <Clock size={16} color="var(--neon-cyan)" />
            <div className="metric-text-group">
              <span className="metric-label">MATCH DURATION</span>
              <strong className="metric-value">14:32</strong>
            </div>
          </div>

          <div className="metric-chip">
            <RotateCcw size={16} color="var(--neon-cyan)" />
            <div className="metric-text-group">
              <span className="metric-label">TOTAL TURNS</span>
              <strong className="metric-value">{turnNumber || 20}</strong>
            </div>
          </div>

          <div className="metric-praise-box">
            <Sparkles size={16} color="#ffd700" />
            <div className="praise-text">
              <strong>EXCELLENT STRATEGY!</strong>
              <span>Every move brought you closer to victory.</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <footer className="winner-footer-actions">
          <button className="btn-winner-secondary" onClick={onContinue || (() => setShowHistoryModal(true))}>
            <ScrollText size={16} />
            <span>CONTINUE TO PLAY</span>
          </button>

          <button className="btn-winner-play-again" onClick={onRematch}>
            <RotateCcw size={22} />
            <span className="play-again-text">RESTART GAME</span>
            <RotateCcw size={22} />
          </button>

          {onHome && (
            <button className="btn-winner-secondary" onClick={onHome} style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1px solid #ff3366', color: '#ff3366' }}>
              <X size={16} />
              <span>END GAME</span>
            </button>
          )}
        </footer>

        {/* History Modal Popup */}
        {showHistoryModal && (
          <div className="arena-modal-backdrop" onClick={() => setShowHistoryModal(false)}>
            <div className="arena-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3>MATCH SUMMARY LOG</h3>
                <button className="btn-close-modal" onClick={() => setShowHistoryModal(false)}>✕</button>
              </div>
              <div className="full-history-list">
                <div className="full-history-item"><span>Turn 7</span><strong>{winner.name}</strong><span>Executed Shadow Strike</span></div>
                <div className="full-history-item"><span>Turn 6</span><strong>Bee</strong><span>Played Azure Guard</span></div>
                <div className="full-history-item"><span>Turn 5</span><strong>Katsumi</strong><span>Attacked Chynaman (-500 LP)</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
