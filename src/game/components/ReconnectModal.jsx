import React, { useState } from 'react';
import { fetchGameRoom, rejoinGameRoom } from '../../services/roomService';
import { RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export default function ReconnectModal({ onRoomFound, onClose }) {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoomCodeChange = (e) => {
    setRoomCode(e.target.value.toUpperCase().slice(0, 6));
    setError(null);
  };

  const handleFetchRoom = async () => {
    if (roomCode.length !== 6) {
      setError('Room code must be exactly 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await fetchGameRoom(roomCode);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Room found, pass back to parent
      onRoomFound({
        roomCode,
        gameState: result.gameState,
        players: result.players
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(3, 7, 18, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
          border: '2px solid #FBC80D',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          color: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(251, 200, 13, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Orbitron, sans-serif' }}>
            ⚔️ REJOIN GAME
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginBottom: '24px', lineHeight: '1.5' }}>
          Enter your 6-character room code to reconnect to your active game. Room codes expire after 2 hours.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', color: '#FBC80D', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            ROOM CODE
          </label>
          <input
            type="text"
            placeholder="e.g., ABC123"
            value={roomCode}
            onChange={handleRoomCodeChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(251, 200, 13, 0.5)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              fontFamily: 'Courier New, monospace',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              boxSizing: 'border-box',
              cursor: isLoading ? 'not-allowed' : 'text'
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(237, 30, 36, 0.1)',
            border: '1px solid #ED1E24',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#ED1E24',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleFetchRoom}
            disabled={roomCode.length !== 6 || isLoading}
            style={{
              flex: 1,
              background: roomCode.length === 6 && !isLoading ? 'linear-gradient(90deg, #FBC80D 0%, #FFD700 100%)' : 'rgba(255,255,255,0.1)',
              color: roomCode.length === 6 && !isLoading ? '#000' : 'rgba(255,255,255,0.5)',
              border: '2px solid ' + (roomCode.length === 6 ? '#FBC80D' : 'rgba(255,255,255,0.2)'),
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: roomCode.length === 6 && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
            {isLoading ? 'SEARCHING...' : 'RECONNECT'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '12px 24px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
