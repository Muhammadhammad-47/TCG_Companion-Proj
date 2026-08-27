import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { CHARACTERS, getAssetUrl } from '../data/characters';
import { soundFX } from '../utils/audio';

const QUICK_SHOUTOUTS = [
  { icon: '⚔️', text: 'I challenge you to a duel!' },
  { icon: '🛡️', text: 'My DP Armor is impenetrable!' },
  { icon: '⚡', text: 'Charging up Energy Tokens!' },
  { icon: '☣️', text: 'Beware the Poison Stacks!' },
  { icon: '👑', text: 'Stability Crystal is mine!' },
  { icon: '🎲', text: 'Let the dice decide!' },
  { icon: '🔥', text: 'Special technique ready!' },
  { icon: '🤝', text: 'Good game, warrior!' }
];

export default function LocalMatchChatModal({
  players = [],
  activePlayerIndex = 0,
  chatMessages = [],
  onSendMessage,
  onClose
}) {
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(
    players[activePlayerIndex]?.id || players[0]?.id
  );
  const [messageInput, setMessageInput] = useState('');
  const chatListRef = useRef(null);

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (textToSend) => {
    const text = (textToSend || messageInput).trim();
    if (!text) return;

    soundFX.playMenuSelect();
    const speaker = players.find(p => p.id === selectedSpeakerId) || players[0];
    onSendMessage({
      id: 'msg_' + Date.now(),
      senderId: speaker.id,
      senderName: speaker.name,
      characterId: speaker.characterId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setMessageInput('');
  };

  const activeSpeaker = players.find(p => p.id === selectedSpeakerId) || players[0];
  const charInfo = CHARACTERS[activeSpeaker?.characterId] || CHARACTERS.chynaman;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: '68px',
        left: '24px',
        width: '380px',
        maxWidth: 'calc(100% - 48px)',
        height: '430px',
        maxHeight: '62vh',
        background: 'linear-gradient(180deg, #0d1b38 0%, #060e20 100%)',
        border: '2px solid rgba(0, 240, 255, 0.45)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 30px rgba(0, 240, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'rgba(0, 240, 255, 0.08)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#00f0ff', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={13} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#fff', letterSpacing: '0.5px' }}>
              MATCH CHAT
            </h4>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Speaker Selector Strip */}
      <div
        style={{
          padding: '6px 10px',
          background: 'rgba(0, 0, 0, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '0.62rem', color: 'var(--neon-gold)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          AS:
        </span>
        <div
          style={{
            display: 'flex',
            gap: '5px',
            flex: 1,
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {players.map((p) => {
            const isSelected = p.id === selectedSpeakerId;
            const char = CHARACTERS[p.characterId] || CHARACTERS.chynaman;
            return (
              <button
                key={p.id}
                onClick={() => {
                  soundFX.playMenuHover();
                  setSelectedSpeakerId(p.id);
                }}
                style={{
                  background: isSelected ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  border: isSelected ? '1.5px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '2px 7px',
                  color: isSelected ? '#00f0ff' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 6px rgba(0, 240, 255, 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', border: `1px solid ${char.themeColor || '#00f0ff'}` }}>
                  <img src={getAssetUrl(char.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Chat Messages Feed */}
      <div
        ref={chatListRef}
        style={{
          flex: 1,
          padding: '10px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {chatMessages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <MessageSquare size={24} color="rgba(0, 240, 255, 0.3)" />
            <p style={{ margin: 0, fontSize: '0.78rem' }}>No messages yet.</p>
            <span style={{ fontSize: '0.66rem' }}>Send a tactical shoutout below!</span>
          </div>
        )}

        {chatMessages.map(msg => {
          const isMe = msg.senderId === selectedSpeakerId;
          const msgChar = CHARACTERS[msg.characterId] || CHARACTERS.chynaman;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '6px',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                flexDirection: isMe ? 'row-reverse' : 'row'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `1.5px solid ${msgChar.themeColor || '#00f0ff'}`,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                }}
              >
                <img src={getAssetUrl(msgChar.image)} alt={msg.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 'bold', color: msgChar.themeColor || '#00f0ff' }}>
                    {msg.senderName}
                  </span>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)' }}>
                    {msg.time}
                  </span>
                </div>

                <div
                  style={{
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(0, 119, 255, 0.4) 0%, rgba(0, 240, 255, 0.25) 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: isMe ? '1px solid rgba(0, 240, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: isMe ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                    padding: '5px 9px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    lineHeight: '1.3',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tactical Shoutouts */}
      <div
        style={{
          padding: '5px 8px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto'
        }}
      >
        {QUICK_SHOUTOUTS.map((shout, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(shout.text)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '2px 6px',
              fontSize: '0.66rem',
              color: '#fff',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
              e.currentTarget.style.borderColor = '#00f0ff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <span>{shout.icon}</span>
            <span>{shout.text}</span>
          </button>
        ))}
      </div>

      {/* Message Input & Send Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: '8px 10px',
          background: 'rgba(5, 12, 28, 0.95)',
          borderTop: '1px solid rgba(0, 240, 255, 0.2)',
          display: 'flex',
          gap: '6px'
        }}
      >
        <input
          type="text"
          placeholder={`Type as ${activeSpeaker?.name}...`}
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#fff',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(90deg, #00f0ff, #0077ff)',
            border: 'none',
            borderRadius: '6px',
            padding: '0 12px',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.35)'
          }}
        >
          <Send size={12} />
          <span>SEND</span>
        </button>
      </form>
    </div>
  );
}


