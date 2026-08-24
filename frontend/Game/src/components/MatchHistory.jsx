import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function MatchHistory({ logs, onUndo, canUndo }) {
  return (
    <div className="match-history-panel">
      <div className="history-header">
        <div className="history-title">
          <History size={16} />
          <span>Match Action Log</span>
        </div>
        {canUndo && (
          <button
            className="btn-undo"
            title="Undo last action"
            onClick={() => {
              soundFX.playCard();
              onUndo();
            }}
          >
            <RotateCcw size={14} /> Undo Move
          </button>
        )}
      </div>

      <div className="history-logs-scroller">
        {logs.length === 0 ? (
          <div className="no-logs">Game match commenced. Waiting for first action...</div>
        ) : (
          logs.slice().reverse().map((log, idx) => (
            <div key={idx} className="log-item">
              <span className="log-turn-badge">Turn {log.turn}</span>
              <span className="log-text">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
