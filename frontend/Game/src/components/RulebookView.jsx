import React from 'react';
import { RULES_KNOWLEDGE } from '../data/rulesKnowledge';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function RulebookView({ onBack }) {
  return (
    <div className="rulebook-container">
      <div className="rulebook-top-bar">
        {onBack && (
          <button
            className="btn-rulebook-back"
            onClick={() => {
              soundFX.playMenuHover();
              onBack();
            }}
          >
            <ArrowLeft size={18} />
            <span>RETURN</span>
          </button>
        )}
      </div>

      <div className="rulebook-header">
        <div className="badge-glow">
          <BookOpen size={16} /> OFFICIAL RULES & CODEX
        </div>
        <h2>注意! Attention TCG Comprehensive Rulebook</h2>
        <p>
          Complete official reference for 2-Dice Rolling, Defense Thresholds (6+ roll DP),
          Zombie Transformation (5 poison cards), Mind Strength, and Stability Crystals.
        </p>
      </div>

      <div className="rulebook-cards-grid">
        {RULES_KNOWLEDGE.map((item, idx) => (
          <div key={idx} className="rule-doc-card">
            <div className="rule-card-header">
              <span className="rule-idx">0{idx + 1}</span>
              <h3>{item.topic}</h3>
            </div>
            <div className="rule-summary-box">
              <CheckCircle size={16} color="#00f0ff" />
              <span>{item.shortAnswer}</span>
            </div>
            <div className="rule-body-text" style={{ whiteSpace: 'pre-line' }}>
              {item.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
