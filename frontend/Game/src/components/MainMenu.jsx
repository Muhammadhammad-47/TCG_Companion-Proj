import React, { useState } from 'react';
import { 
  Swords, Zap, HelpCircle, UserPlus, Cast, Sparkles, 
  RotateCw, Play, Volume2, VolumeX, Music, Tv, ChevronRight, ArrowLeft
} from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { soundFX } from '../utils/audio';

export default function MainMenu({
  onStartCustomGame,
  onStartQuickDuel,
  onOpenRules,
  tvMode,
  setTvMode,
  isMuted,
  onToggleMute
}) {
  const [selectedCharId, setSelectedCharId] = useState('chynaman');
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');

  const charList = Object.values(CHARACTERS);
  const activeChar = CHARACTERS[selectedCharId] || charList[0];

  const handleAskQuick = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    soundFX.playCard();
    const q = quickQuestion.toLowerCase();
    if (q.includes('poison') || q.includes('zombie')) {
      setQuickAnswer('Accumulating 5 Poison cards infects the warrior into Zombie Mode with 10 HP revive and Venom Strike!');
    } else if (q.includes('dp') || q.includes('defense') || q.includes('6')) {
      setQuickAnswer('Innate DP reduces damage if the defender rolls a sum of 6+ on 2 Gold dice, even if they lose the battle.');
    } else if (q.includes('et') || q.includes('energy')) {
      setQuickAnswer('Players start with 5 ET (cap 10). Claim +1 ET at the start of each turn if remembered. Regular=1ET, Super=2ET, Blitz=5ET.');
    } else if (q.includes('crystal') || q.includes('win')) {
      setQuickAnswer('Win Condition: Defeat opponents to collect Stability Crystals. The first warrior to hold 3 Crystals wins!');
    } else {
      setQuickAnswer('Rules Ruling: Attacks require pairing a Character Card with an Action Card and spending Energy Tokens. 2 Red vs 2 Gold dice determine hit!');
    }
  };

  return (
    <div className="img-dashboard-container">
      {/* Top Brand Banner & Active Player Grid */}
      <div className="img-dashboard-grid">
        {/* Left Column: Brand & Rules Bot */}
        <div className="img-brand-col">
          <div className="img-logo-unit">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div className="img-badge-attention">注意!</div>
              <button 
                onClick={() => { window.location.href = '../index.html'; }}
                style={{
                  background: 'rgba(225, 29, 72, 0.2)',
                  border: '1px solid #e11d48',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> EXIT TO HUB
              </button>
            </div>
            <h1 className="img-logo-dance-with">Dance With</h1>
            <div className="img-logo-mii">Mii!</div>
            <div className="img-logo-subbar">
              <span className="img-tcg-sub">TCG COMPANION</span>
              <span className="img-tagline">Track. Play. Win Together.</span>
            </div>
          </div>

          {/* Rules Bot Widget */}
          <div className="img-rules-bot-card">
            <div className="img-bot-top">
              <div className="img-bot-avatar">🤖</div>
              <div className="img-bot-text">
                <div className="img-bot-badge-row">
                  <strong>RULES BOT</strong>
                  <span className="img-beta-badge">BETA</span>
                </div>
                <p>Need a rule clarification? I'm here to help!</p>
              </div>
            </div>

            <form onSubmit={handleAskQuick} className="img-bot-input-row">
              <input
                type="text"
                placeholder="Ask a question (e.g. poison rules)..."
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                className="img-bot-input"
              />
              <button type="submit" className="img-bot-send">➔</button>
            </form>

            {quickAnswer && (
              <div className="img-bot-answer-pop">
                <span>💡 {quickAnswer}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Active Player Hero Spotlight */}
        <div className="img-center-spotlight-col">
          <div className="img-active-player-header">
            <span className="img-crown-mini">👑</span>
            <span className="img-hdr-text">ACTIVE PLAYER SPOTLIGHT</span>
          </div>

          <div className="img-hero-spotlight-card" style={{ '--hero-color': activeChar.themeColor }}>
            <div className="img-hero-avatar-wrap">
              <span className="img-hero-avatar-emoji">{activeChar.avatar}</span>
              <div className="img-hero-card-glow"></div>
            </div>

            <div className="img-hero-info">
              <h2 className="img-hero-name">{activeChar.name}</h2>
              <div className="img-hero-lp-display">
                <span className="img-lp-label">HP</span>
                <span className="img-lp-value">100</span>
                <span className="img-lp-max">/ 150</span>
              </div>
            </div>

            <div className="img-next-turn-ribbon" onClick={onStartCustomGame}>
              <span>START BATTLE</span>
            </div>

            <div className="img-hero-meta-row">
              <span className="img-meta-tag">🧠 Mind: {activeChar.mindStrength}</span>
              <span className="img-meta-tag">🛡️ DP -{activeChar.defaultDP} (6+)</span>
              <span className="img-meta-tag">⚡ Weak: {activeChar.weakness.type}</span>
            </div>
          </div>
        </div>

        {/* Center-Right: Circular Turn Order Dial */}
        <div className="img-turn-dial-col">
          <div className="img-turn-dial-stage">
            <div className="img-turn-dial-ring">
              <div className="img-dial-inner">
                <span className="dial-turn-lbl">TURN</span>
                <span className="dial-turn-num">1</span>
                <span className="dial-turn-inf">/ ∞</span>
              </div>
            </div>
            <div className="img-dial-subtext">
              <RotateCw size={14} className="spin-slow" />
              <span>CLOCKWISE TURN ORDER</span>
            </div>
          </div>
        </div>

        {/* Right Column: Score Summary */}
        <div className="img-scoreboard-col">
          <div className="img-score-summary-header">
            <span>SCORE SUMMARY</span>
          </div>

          <div className="img-score-list">
            {charList.slice(0, 4).map((c, i) => (
              <div 
                key={c.id} 
                className={`img-score-row ${c.id === selectedCharId ? 'active-row' : ''}`}
                onClick={() => {
                  soundFX.playMenuHover();
                  setSelectedCharId(c.id);
                }}
              >
                <div className="img-score-avatar" style={{ borderColor: c.themeColor }}>
                  <span>{c.avatar}</span>
                </div>
                <div className="img-score-names">
                  <strong>{c.name}</strong>
                  <span>HP 100</span>
                </div>
                <div className="img-score-val-wrap">
                  <span className="score-num">100</span>
                  <span className={`img-rank-pill ${i === 0 ? 'rank-1' : 'rank-other'}`}>{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Cards Bar matching Image 1 */}
      <div className="img-dashboard-bottom-bar">
        <button className="img-action-btn primary-start" onClick={onStartCustomGame}>
          <div className="img-action-icon"><Swords size={24} /></div>
          <div className="img-action-text">
            <strong>START MATCH</strong>
            <span>Begin a new duel</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={onStartQuickDuel}>
          <div className="img-action-icon"><Zap size={22} color="#38bdf8" /></div>
          <div className="img-action-text">
            <strong>QUICK 1v1 DUEL</strong>
            <span>Chynaman vs. Bee</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={() => setTvMode(!tvMode)}>
          <div className="img-action-icon"><Tv size={22} color="#ffe600" /></div>
          <div className="img-action-text">
            <strong>CAST SCREEN</strong>
            <span>{tvMode ? 'TV Mode Active' : 'Tabletop Projector'}</span>
          </div>
        </button>

        <button className="img-action-btn" onClick={onToggleMute}>
          <div className="img-action-icon">
            {isMuted ? <VolumeX size={22} color="#e11d48" /> : <Volume2 size={22} color="#22c55e" />}
          </div>
          <div className="img-action-text">
            <strong>SOUND FX</strong>
            <span>{isMuted ? 'Muted' : 'Enabled'}</span>
          </div>
        </button>
      </div>

      {/* Footer info */}
      <div className="img-dashboard-footer">
        <span>✦ Built for Duelists. Designed for Victory. ✦</span>
        <span className="img-version-tag">v1.0.0</span>
      </div>
    </div>
  );
}
