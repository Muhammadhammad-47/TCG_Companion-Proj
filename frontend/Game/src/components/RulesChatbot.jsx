import React, { useState } from 'react';
import { RULES_KNOWLEDGE, SUGGESTED_QUERIES } from '../data/rulesKnowledge';
import { CHARACTERS } from '../data/characters';
import { ACTION_CARDS } from '../data/cards';
import { soundFX } from '../utils/audio';
import { Bot, Send, Sparkles, BookOpen, Shield, HelpCircle, ChevronRight, Search } from 'lucide-react';

export default function RulesChatbot() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings, Warrior! I am your **TCG GPT Rules Assistant** for 注意! (Attention TCG). Ask me any question about 2-dice defense, Zombie Mode, Energy Tokens, Mind Strength, or character weaknesses!',
      topic: 'Welcome',
      citation: 'Official Attention TCG Rulebook v1.0'
    }
  ]);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('chat'); // 'chat' | 'cards' | 'glossary'

  const handleAskQuestion = (textToAsk) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    soundFX.playCard();

    // Add user message
    const userMsg = { sender: 'user', text: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery('');

    // Search rules knowledge
    setTimeout(() => {
      const lowerQ = q.toLowerCase();
      let matchedRule = RULES_KNOWLEDGE.find(rule =>
        rule.keywords.some(k => lowerQ.includes(k.toLowerCase())) ||
        rule.topic.toLowerCase().includes(lowerQ)
      );

      // Character specific check
      const matchedChar = Object.values(CHARACTERS).find(c =>
        lowerQ.includes(c.name.toLowerCase()) || lowerQ.includes(c.id)
      );

      let botResponse = {};

      if (matchedRule) {
        botResponse = {
          sender: 'bot',
          topic: matchedRule.topic,
          text: `**${matchedRule.shortAnswer}**\n\n${matchedRule.details}`,
          citation: `Section: ${matchedRule.topic}`
        };
      } else if (matchedChar) {
        botResponse = {
          sender: 'bot',
          topic: `${matchedChar.name} Character Card`,
          text: `**${matchedChar.name} (${matchedChar.title})**\n• Mind Strength: **${matchedChar.mindStrength}**\n• Defense Power (DP): **-${matchedChar.defaultDP}** (activates when rolling ≥6 on 2 dice)\n• Weakness: **${matchedChar.weakness.type}** (Takes +${matchedChar.weakness.bonusAP} AP damage)\n• Retreat Requirement: **${matchedChar.retreatTarget}+ on 1 die**\n• Techniques: ${matchedChar.moves.map(m => m.name).join(', ')}`,
          citation: `Character Roster: ${matchedChar.name}`
        };
      } else {
        botResponse = {
          sender: 'bot',
          topic: 'Attention TCG Ruling',
          text: `Here is the general ruling: In Attention TCG, attacks must be paired with an action card and paid in Energy Tokens (1 ET for regular, 2 ET for super, 3 ET for Kontrol, 5 ET for Blitz). Combat uses 2 Red vs 2 Gold dice where rolling 6+ activates defense DP. Accumulating 5 Poison turns a warrior into a Zombie!`,
          citation: 'Universal Rule Guidelines'
        };
      }

      setMessages([...newMessages, botResponse]);
      soundFX.playEnergy();
    }, 400);
  };

  return (
    <div className="rules-assistant-container">
      {/* Sub tabs */}
      <div className="assistant-subnav">
        <button
          className={`subnav-btn ${activeSubTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('chat')}
        >
          <Bot size={16} /> TCG GPT Chatbot
        </button>
        <button
          className={`subnav-btn ${activeSubTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cards')}
        >
          <BookOpen size={16} /> Card & Character Database
        </button>
        <button
          className={`subnav-btn ${activeSubTab === 'glossary' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('glossary')}
        >
          <HelpCircle size={16} /> Rules Glossary & FAQ
        </button>
      </div>

      {/* Main Chat Tab */}
      {activeSubTab === 'chat' && (
        <div className="chatbot-chat-area">
          {/* Quick suggestions */}
          <div className="suggestions-bar">
            <span className="suggest-label"><Sparkles size={14} /> Quick Inquiries:</span>
            <div className="chips-scroller">
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  className="prompt-chip"
                  onClick={() => handleAskQuestion(sq)}
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>

          {/* Messages list */}
          <div className="chat-messages-box">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message-row ${m.sender === 'user' ? 'msg-user' : 'msg-bot'}`}>
                {m.sender === 'bot' && (
                  <div className="bot-avatar-circle">
                    <Bot size={18} color="#00f0ff" />
                  </div>
                )}
                <div className="msg-bubble">
                  {m.topic && <div className="msg-topic-header">{m.topic}</div>}
                  <div className="msg-content" style={{ whiteSpace: 'pre-line' }}>
                    {m.text}
                  </div>
                  {m.citation && (
                    <div className="msg-citation">
                      <span>Source: {m.citation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat input form */}
          <form
            className="chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion();
            }}
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a rule question (e.g. Can Zombies win Stability Crystals?)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-send-chat" disabled={!query.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Cards Database Tab */}
      {activeSubTab === 'cards' && (
        <div className="database-view">
          <div className="db-section-header">
            <h3>Playable Characters (7 Warriors)</h3>
          </div>
          <div className="characters-db-grid">
            {Object.values(CHARACTERS).map(char => (
              <div key={char.id} className="db-char-card" style={{ borderLeftColor: char.themeColor }}>
                <div className="db-char-top">
                  <span className="db-avatar">{char.avatar}</span>
                  <div>
                    <h4 className="db-char-name">{char.name}</h4>
                    <span className="db-char-title">{char.title}</span>
                  </div>
                </div>

                <div className="db-stats-row">
                  <span>Mind: <strong>{char.mindStrength}</strong></span>
                  <span>DP: <strong>-{char.defaultDP}</strong> (6+ Roll)</span>
                  <span>Retreat: <strong>{char.retreatTarget}+</strong></span>
                  <span>Weakness: <strong>{char.weakness.type} (+{char.weakness.bonusAP} AP)</strong></span>
                </div>

                <div className="db-moves-list">
                  <strong>Techniques:</strong>
                  <ul>
                    {char.moves.map(m => (
                      <li key={m.id}>
                        <span className="m-name">{m.name}</span>
                        <span className="m-cost">({m.costET} ET)</span>: {m.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="db-section-header" style={{ marginTop: '2rem' }}>
            <h3>Action & Status Cards</h3>
          </div>
          <div className="action-cards-db-grid">
            {ACTION_CARDS.map(c => (
              <div key={c.id} className="db-action-card" style={{ borderTopColor: c.color }}>
                <div className="db-card-header">
                  <span className="db-icon">{c.icon}</span>
                  <span className="db-cost">{c.costET} Energy Token{c.costET !== 1 ? 's' : ''}</span>
                </div>
                <h4>{c.name}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glossary Tab */}
      {activeSubTab === 'glossary' && (
        <div className="glossary-view">
          <div className="glossary-list">
            {RULES_KNOWLEDGE.map((item, idx) => (
              <div key={idx} className="glossary-item-card">
                <h4><ChevronRight size={18} color="#00f0ff" /> {item.topic}</h4>
                <div className="glossary-short">{item.shortAnswer}</div>
                <div className="glossary-details" style={{ whiteSpace: 'pre-line' }}>{item.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
