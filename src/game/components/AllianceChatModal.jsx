import React, { useState, useRef, useEffect } from 'react';
import { X, Send, CheckCircle2, Clock } from 'lucide-react';
import { soundFX } from '../utils/audio';

const TERM_SUGGESTIONS = [
  {
    id: 'card_sharing',
    label: '🎴 Card Sharing',
    description: 'Can trade action cards',
    type: 'CARD_SHARING'
  },
  {
    id: 'joint_attack',
    label: '⚔️ Joint Attack',
    description: 'Must attack same opponent',
    type: 'JOINT_ATTACK'
  },
  {
    id: 'protection',
    label: '🛡️ Protection/Healing',
    description: 'Share defense and healing',
    type: 'PROTECTION'
  }
];

export default function AllianceChatModal({
  isOpen,
  player1 = {},
  player2 = {},
  currentPlayerId,
  chatHistory = [],
  selectedTerms = [],
  confirmationStatus = { player1: false, player2: false },
  onSendMessage = () => {},
  onSelectTerm = () => {},
  onRemoveTerm = () => {},
  onConfirmAgreement = () => {},
  onCancel = () => {}
}) {
  const [messageInput, setMessageInput] = useState('');
  const chatListRef = useRef(null);
  const [customAgreement, setCustomAgreement] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatListRef.current && Array.isArray(chatHistory)) {
      setTimeout(() => {
        chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
      }, 0);
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text) return;

    soundFX.playMenuSelect();
    onSendMessage(text);
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTermToggle = (termType) => {
    const isSelected = selectedTerms.some(t => t === termType);
    if (isSelected) {
      onRemoveTerm(termType);
    } else {
      onSelectTerm(termType);
    }
  };

  const isPlayer1 = currentPlayerId === player1.id;
  const currentPlayerName = isPlayer1 ? player1.name : player2.name;
  const allyName = isPlayer1 ? player2.name : player1.name;
  const myConfirmation = isPlayer1 ? confirmationStatus.player1 : confirmationStatus.player2;
  const allyConfirmation = isPlayer1 ? confirmationStatus.player2 : confirmationStatus.player1;

  const hasSelectedTerms = selectedTerms.length > 0;
  const bothConfirmed = confirmationStatus.player1 && confirmationStatus.player2;

  if (!isOpen) return null;

  return (
    <div className="alliance-chat-modal-overlay">
      <div className="alliance-chat-modal-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <span className="alliance-icon">🤝</span>
            <span>Alliance with {allyName}</span>
          </div>
          <button className="chat-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="chat-content-area">
          {/* Chat Messages */}
          <div className="chat-messages-container">
            <div className="chat-messages-list" ref={chatListRef}>
              {!chatHistory || chatHistory.length === 0 ? (
                <div className="chat-empty-state">
                  <p>Start negotiating your alliance terms</p>
                  <p className="chat-empty-hint">Only you and {allyName} can see this chat</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-message ${msg.senderId === currentPlayerId ? 'own-message' : 'ally-message'}`}
                  >
                    <div className="message-sender">
                      {msg.senderName}
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Terms Selection Panel */}
          <div className="terms-panel">
            <div className="terms-header">
              <span className="terms-title">💬 Negotiate Terms</span>
            </div>

            <div className="terms-suggestion-grid">
              {TERM_SUGGESTIONS.map(term => (
                <div
                  key={term.id}
                  className={`term-suggestion ${selectedTerms.includes(term.type) ? 'selected' : ''}`}
                  onClick={() => handleTermToggle(term.type)}
                >
                  <div className="term-label">{term.label}</div>
                  <div className="term-description">{term.description}</div>
                  {selectedTerms.includes(term.type) && (
                    <div className="term-check">✓</div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Agreement */}
            <div className="custom-agreement-section">
              <button
                className="custom-agreement-btn"
                onClick={() => setShowCustomInput(!showCustomInput)}
              >
                {showCustomInput ? '−' : '+'} Custom Agreement
              </button>
              {showCustomInput && (
                <textarea
                  className="custom-agreement-input"
                  placeholder="Enter custom terms (e.g., 'Share crystals equally')"
                  value={customAgreement}
                  onChange={(e) => setCustomAgreement(e.target.value)}
                  maxLength={100}
                />
              )}
            </div>

            {/* Selected Terms Display */}
            <div className="selected-terms-display">
              <div className="selected-terms-label">Selected Terms:</div>
              {selectedTerms.length === 0 ? (
                <div className="no-terms-selected">No terms selected yet</div>
              ) : (
                <div className="selected-terms-list">
                  {selectedTerms.map(term => {
                    const termData = TERM_SUGGESTIONS.find(t => t.type === term);
                    return (
                      <span key={term} className="selected-term-badge">
                        {termData?.label}
                      </span>
                    );
                  })}
                  {customAgreement && (
                    <span className="selected-term-badge custom">
                      "{customAgreement}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="chat-input-area">
          <textarea
            className="chat-message-input"
            placeholder={`Say something to ${allyName}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="2"
            maxLength={150}
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            <Send size={18} />
          </button>
        </div>

        {/* Confirmation Area */}
        <div className="confirmation-area">
          <div className="confirmation-status">
            <div className={`player-status ${myConfirmation ? 'confirmed' : ''}`}>
              <span className="status-indicator">
                {myConfirmation ? '✓' : '○'}
              </span>
              <span className="status-text">
                {myConfirmation ? 'You Ready' : 'Not Ready'}
              </span>
            </div>
            <div className="vs-dot">vs</div>
            <div className={`player-status ${allyConfirmation ? 'confirmed' : ''}`}>
              <span className="status-indicator">
                {allyConfirmation ? '✓' : '○'}
              </span>
              <span className="status-text">
                {allyConfirmation ? `${allyName} Ready` : `${allyName} Waiting`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="confirmation-buttons">
            <button
              className="btn-cancel"
              onClick={onCancel}
            >
              <X size={16} /> Cancel
            </button>
            <button
              className={`btn-confirm ${myConfirmation ? 'confirmed' : ''}`}
              onClick={() => onConfirmAgreement()}
              disabled={!hasSelectedTerms}
            >
              {myConfirmation ? (
                <>
                  <CheckCircle2 size={16} /> Agreement Confirmed
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Confirm Agreement
                </>
              )}
            </button>
          </div>

          {/* Auto-dismiss info for demo */}
          {bothConfirmed && (
            <div className="both-confirmed-message">
              ✓ Both players confirmed! Alliance will be established.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .alliance-chat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9997;
          backdrop-filter: blur(5px);
        }

        .alliance-chat-modal-container {
          background: linear-gradient(135deg, #1a2a3a 0%, #0f1a2a 100%);
          border: 2px solid #9d4edd;
          border-radius: 12px;
          padding: 0;
          max-width: 700px;
          width: 90%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 30px rgba(157, 78, 221, 0.4);
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 2px solid rgba(157, 78, 221, 0.3);
          background: linear-gradient(90deg, rgba(157, 78, 221, 0.1) 0%, transparent 100%);
        }

        .chat-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: bold;
          color: #9d4edd;
          text-shadow: 0 0 8px rgba(157, 78, 221, 0.4);
        }

        .alliance-icon {
          font-size: 24px;
        }

        .chat-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .chat-close-btn:hover {
          color: #9d4edd;
          transform: rotate(90deg);
        }

        .chat-content-area {
          flex: 1;
          display: flex;
          gap: 10px;
          padding: 12px;
          overflow: hidden;
        }

        .chat-messages-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-messages-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
        }

        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .chat-empty-state p {
          margin: 4px 0;
          font-size: 14px;
        }

        .chat-empty-hint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .chat-message.own-message {
          align-items: flex-end;
        }

        .chat-message.ally-message {
          align-items: flex-start;
        }

        .message-sender {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: bold;
          color: #9d4edd;
          margin-bottom: 2px;
        }

        .message-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: normal;
        }

        .message-text {
          background: rgba(157, 78, 221, 0.15);
          border: 1px solid rgba(157, 78, 221, 0.3);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.85);
          max-width: 80%;
          word-wrap: break-word;
        }

        .chat-message.own-message .message-text {
          background: rgba(57, 255, 20, 0.1);
          border-color: rgba(57, 255, 20, 0.4);
        }

        .terms-panel {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
        }

        .terms-header {
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(157, 78, 221, 0.2);
        }

        .terms-title {
          font-size: 13px;
          font-weight: bold;
          color: #9d4edd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .terms-suggestion-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .term-suggestion {
          background: rgba(157, 78, 221, 0.08);
          border: 1px solid rgba(157, 78, 221, 0.3);
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .term-suggestion:hover {
          background: rgba(157, 78, 221, 0.15);
          border-color: #9d4edd;
        }

        .term-suggestion.selected {
          background: rgba(57, 255, 20, 0.12);
          border-color: #39ff14;
          box-shadow: 0 0 8px rgba(57, 255, 20, 0.2);
        }

        .term-label {
          font-size: 12px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2px;
        }

        .term-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        .term-check {
          position: absolute;
          top: 6px;
          right: 8px;
          color: #39ff14;
          font-weight: bold;
          font-size: 14px;
        }

        .custom-agreement-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .custom-agreement-btn {
          background: rgba(157, 78, 221, 0.1);
          border: 1px solid rgba(157, 78, 221, 0.3);
          color: rgba(255, 255, 255, 0.7);
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .custom-agreement-btn:hover {
          background: rgba(157, 78, 221, 0.2);
          border-color: #9d4edd;
        }

        .custom-agreement-input {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.8);
          padding: 6px 8px;
          font-size: 11px;
          font-family: inherit;
          resize: vertical;
          min-height: 30px;
          max-height: 50px;
        }

        .custom-agreement-input:focus {
          outline: none;
          border-color: #9d4edd;
        }

        .selected-terms-display {
          padding: 8px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 4px;
          border: 1px solid rgba(157, 78, 221, 0.2);
        }

        .selected-terms-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 6px;
          font-weight: bold;
        }

        .no-terms-selected {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        .selected-terms-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .selected-term-badge {
          background: rgba(57, 255, 20, 0.15);
          border: 1px solid rgba(57, 255, 20, 0.4);
          color: #39ff14;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }

        .selected-term-badge.custom {
          background: rgba(96, 165, 250, 0.15);
          border-color: rgba(96, 165, 250, 0.4);
          color: #60a5fa;
        }

        .chat-input-area {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(157, 78, 221, 0.2);
          background: rgba(0, 0, 0, 0.2);
        }

        .chat-message-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(157, 78, 221, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          font-family: inherit;
          font-size: 13px;
          resize: none;
        }

        .chat-message-input:focus {
          outline: none;
          border-color: #9d4edd;
        }

        .chat-send-btn {
          background: linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%);
          border: 1px solid #9d4edd;
          color: #fff;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-send-btn:hover:not(:disabled) {
          box-shadow: 0 0 12px rgba(157, 78, 221, 0.6);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .confirmation-area {
          padding: 12px;
          border-top: 1px solid rgba(157, 78, 221, 0.3);
          background: rgba(157, 78, 221, 0.05);
        }

        .confirmation-status {
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin-bottom: 12px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }

        .player-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .player-status.confirmed {
          color: #39ff14;
        }

        .status-indicator {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid currentColor;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
        }

        .vs-dot {
          color: rgba(255, 255, 255, 0.3);
          font-size: 12px;
          font-weight: bold;
        }

        .confirmation-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-cancel,
        .btn-confirm {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
        }

        .btn-cancel {
          background: rgba(255, 107, 107, 0.2);
          color: #fca5a5;
          border: 1px solid #ff6b6b;
        }

        .btn-cancel:hover {
          background: rgba(255, 107, 107, 0.3);
        }

        .btn-confirm {
          background: rgba(57, 255, 20, 0.2);
          color: #39ff14;
          border: 1px solid #39ff14;
        }

        .btn-confirm:hover:not(:disabled) {
          background: rgba(57, 255, 20, 0.3);
          box-shadow: 0 0 12px rgba(57, 255, 20, 0.4);
        }

        .btn-confirm.confirmed {
          background: rgba(57, 255, 20, 0.3);
          box-shadow: 0 0 12px rgba(57, 255, 20, 0.3);
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .both-confirmed-message {
          margin-top: 10px;
          padding: 8px;
          background: rgba(57, 255, 20, 0.15);
          border: 1px solid rgba(57, 255, 20, 0.4);
          border-radius: 4px;
          color: #39ff14;
          font-size: 12px;
          text-align: center;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
