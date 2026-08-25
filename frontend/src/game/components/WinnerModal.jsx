import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';
import { Trophy, Gem, Swords, Home, Shield, RotateCcw, Award } from 'lucide-react';

export default function WinnerModal({ winner, players, turnNumber, onRematch, onHome }) {
  const winnerChar = CHARACTERS[winner.characterId] || CHARACTERS.chynaman;

  useEffect(() => {
    soundFX.playVictory();
    
    // Confetti celebration
    const end = Date.now() + 3 * 1000;
    const colors = ['#38bdf8', '#e11d48', '#ffe600', '#22c55e'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const sortedOtherPlayers = (players || [])
    .filter(p => p.id !== winner.id)
    .sort((a, b) => (b.crystals - a.crystals) || (b.hp - a.hp));

  return (
    <div className="pdf-modal-backdrop">
      <div className="pdf-winner-modal-container">
        {/* Header matching PDF Page 9 */}
        <div className="pdf-winner-header-block">
          <div className="pdf-crown-wrap">
            <Trophy size={36} color="#ffe600" />
          </div>
          <h1 className="pdf-winner-main-title">WINNER</h1>
          <span className="pdf-winner-subtitle">• VICTORY IS YOURS •</span>
        </div>

        {/* 2-Column Winner Content Grid matching PDF Page 9 */}
        <div className="pdf-winner-content-grid">
          {/* Left Column: #1 Champion Spotlight */}
          <div className="pdf-winner-champion-card" style={{ borderColor: winnerChar.themeColor }}>
            <div className="pdf-champ-top-row">
              <div className="pdf-champ-rank-circle">
                <span className="pdf-crown-mini">👑</span>
                <span className="pdf-rank-num">1</span>
              </div>

              <div className="pdf-champ-name-group">
                <h2 className="champ-name">{winner.name}</h2>
                <span className="champ-title">{winnerChar.name} ({winnerChar.title})</span>
              </div>
            </div>

            <div className="pdf-champ-avatar-large">
              <span className="champ-emoji">{winnerChar.avatar}</span>
            </div>

            <div className="pdf-champ-score-box">
              <span className="score-lbl">FINAL HEALTH / SCORE</span>
              <strong className="score-val">{winner.hp} HP</strong>
            </div>

            {/* Performance Stats */}
            <div className="pdf-champ-stats-list">
              <div className="champ-stat-row">
                <span>Damage Dealt:</span>
                <strong>{winner.stats?.damageDealt || 0} AP</strong>
              </div>
              <div className="champ-stat-row">
                <span>Damage Taken:</span>
                <strong>{winner.stats?.damageTaken || 0} HP</strong>
              </div>
              <div className="champ-stat-row">
                <span>Stability Crystals:</span>
                <strong style={{ color: '#38bdf8' }}>💎 {winner.crystals || 1} Crystals</strong>
              </div>
              <div className="champ-stat-row">
                <span>Total Match Turns:</span>
                <strong>{turnNumber} Turns</strong>
              </div>
            </div>

            <p className="pdf-champ-quote">"You have to believe in your own strength and strategic discipline."</p>
          </div>

          {/* Right Column: Other Player Standings */}
          <div className="pdf-winner-standings-card">
            <h3 className="standings-title">FINAL RUNNERS-UP STANDINGS</h3>

            <div className="pdf-runners-up-list">
              {sortedOtherPlayers.map((p, idx) => {
                const char = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
                return (
                  <div key={p.id} className="pdf-runner-up-item">
                    <div className="runner-rank-badge">
                      <span>{idx + 2}</span>
                    </div>

                    <div className="runner-avatar-box" style={{ borderColor: char.themeColor }}>
                      <span>{char.avatar}</span>
                    </div>

                    <div className="runner-name-block">
                      <strong>{p.name}</strong>
                      <span>{char.name}</span>
                    </div>

                    <div className="runner-score-block">
                      <span className="r-hp">{p.hp} HP</span>
                      <span className="r-crystals">💎 {p.crystals}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pdf-match-summary-badge">
              <span>🏆 Excellent Strategy! Every move brought you closer to victory.</span>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons matching PDF Page 9 */}
        <div className="pdf-winner-footer-actions">
          <button className="pdf-btn-play-again" onClick={onRematch}>
            <RotateCcw size={18} />
            <span>PLAY AGAIN / REMATCH</span>
          </button>

          {onHome && (
            <button className="pdf-btn-back-home" onClick={onHome}>
              <Home size={18} />
              <span>BACK TO HOME</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
