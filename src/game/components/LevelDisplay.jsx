import React from 'react';
import { Zap } from 'lucide-react';

export default function LevelDisplay({ level = 1, maxLevel = 10 }) {
  return (
    <div className="level-display-container">
      <div className="level-badge">
        <Zap size={16} className="level-icon" />
        <span className="level-text">LEVEL {level}</span>
      </div>
      <div className="level-progress">
        <div className="level-bar-bg">
          <div 
            className="level-bar-fill" 
            style={{ width: `${(level / maxLevel) * 100}%` }}
          />
        </div>
      </div>

      <style jsx>{`
        .level-display-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          background: rgba(251, 200, 13, 0.1);
          border: 1px solid rgba(251, 200, 13, 0.3);
          border-radius: 6px;
          width: 100%;
        }

        .level-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: bold;
          color: #fbc80d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .level-icon {
          color: #fbc80d;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .level-text {
          color: #fbc80d;
        }

        .level-progress {
          width: 100%;
        }

        .level-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(251, 200, 13, 0.2);
        }

        .level-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #fbc80d 0%, #ff9900 100%);
          transition: width 0.3s ease;
          box-shadow: 0 0 6px rgba(251, 200, 13, 0.5);
        }
      `}</style>
    </div>
  );
}
