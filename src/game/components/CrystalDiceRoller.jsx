import React, { useState, useEffect } from 'react';
import { Dices, Trophy } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function CrystalDiceRoller({
  player1,
  player2,
  onRollComplete
}) {
  const [phase, setPhase] = useState('ready'); // 'ready' | 'rolling' | 'result'
  const [player1Roll, setPlayer1Roll] = useState(null);
  const [player2Roll, setPlayer2Roll] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRollDice = () => {
    if (phase !== 'ready' || isAnimating) return;

    setIsAnimating(true);
    setPhase('rolling');
    soundFX.playDiceRoll();

    // Animate the dice rolling
    let roll1 = 1;
    let roll2 = 1;
    let rollCount = 0;

    const rollInterval = setInterval(() => {
      roll1 = Math.floor(Math.random() * 6) + 1;
      roll2 = Math.floor(Math.random() * 6) + 1;
      setPlayer1Roll(roll1);
      setPlayer2Roll(roll2);
      rollCount++;

      if (rollCount > 15) {
        clearInterval(rollInterval);
        
        // Determine winner
        const finalRoll1 = Math.floor(Math.random() * 6) + 1;
        const finalRoll2 = Math.floor(Math.random() * 6) + 1;
        
        setPlayer1Roll(finalRoll1);
        setPlayer2Roll(finalRoll2);

        setTimeout(() => {
          const winnerPlayer = finalRoll1 > finalRoll2 ? player1 : (finalRoll2 > finalRoll1 ? player2 : null);
          setWinner(winnerPlayer);
          setPhase('result');
          setIsAnimating(false);
          
          if (winnerPlayer) {
            soundFX.playVictory?.();
          }
        }, 300);
      }
    }, 100);
  };

  const handleConfirmResult = () => {
    if (phase === 'result' && winner) {
      onRollComplete(winner);
    }
  };

  return (
    <div className="crystal-dice-roller-container">
      <h2 className="roller-title">🎲 CRYSTAL DICE ROLL</h2>
      <p className="roller-subtitle">Higher roll wins the Stability Crystal!</p>

      <div className="roller-players">
        {/* Player 1 */}
        <div className="roller-player-slot">
          <div className="player-avatar">
            <div className="player-name">{player1.name}</div>
          </div>
          <div className={`dice-display ${phase === 'rolling' ? 'rolling' : ''}`}>
            <div className={`dice-face ${player1Roll === 1 ? 'active' : ''}`}>1</div>
            <div className={`dice-face ${player1Roll === 2 ? 'active' : ''}`}>2</div>
            <div className={`dice-face ${player1Roll === 3 ? 'active' : ''}`}>3</div>
            <div className={`dice-face ${player1Roll === 4 ? 'active' : ''}`}>4</div>
            <div className={`dice-face ${player1Roll === 5 ? 'active' : ''}`}>5</div>
            <div className={`dice-face ${player1Roll === 6 ? 'active' : ''}`}>6</div>
            {player1Roll !== null && (
              <div className={`dice-result ${phase === 'result' ? 'show-result' : ''}`}>
                {player1Roll}
              </div>
            )}
          </div>
        </div>

        {/* VS Badge */}
        <div className="roller-vs-badge">VS</div>

        {/* Player 2 */}
        <div className="roller-player-slot">
          <div className="player-avatar">
            <div className="player-name">{player2.name}</div>
          </div>
          <div className={`dice-display ${phase === 'rolling' ? 'rolling' : ''}`}>
            <div className={`dice-face ${player2Roll === 1 ? 'active' : ''}`}>1</div>
            <div className={`dice-face ${player2Roll === 2 ? 'active' : ''}`}>2</div>
            <div className={`dice-face ${player2Roll === 3 ? 'active' : ''}`}>3</div>
            <div className={`dice-face ${player2Roll === 4 ? 'active' : ''}`}>4</div>
            <div className={`dice-face ${player2Roll === 5 ? 'active' : ''}`}>5</div>
            <div className={`dice-face ${player2Roll === 6 ? 'active' : ''}`}>6</div>
            {player2Roll !== null && (
              <div className={`dice-result ${phase === 'result' ? 'show-result' : ''}`}>
                {player2Roll}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Message */}
      {phase === 'result' && winner && (
        <div className="roller-result-message">
          <Trophy size={32} className="trophy-icon" />
          <p className="result-text">{winner.name} WINS THE CRYSTAL!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="roller-actions">
        {phase === 'ready' && (
          <button
            className="roll-button primary-btn"
            onClick={handleRollDice}
            disabled={isAnimating}
          >
            <Dices size={20} /> ROLL DICE
          </button>
        )}
        {phase === 'result' && (
          <button
            className="confirm-button primary-btn"
            onClick={handleConfirmResult}
          >
            ✓ CONFIRM
          </button>
        )}
      </div>

      <style jsx>{`
        .crystal-dice-roller-container {
          padding: 32px 24px;
        }

        .roller-title {
          text-align: center;
          font-size: 28px;
          color: #fbc80d;
          margin: 0 0 8px 0;
          font-weight: bold;
          text-shadow: 0 0 20px rgba(251, 200, 13, 0.5);
          letter-spacing: 2px;
        }

        .roller-subtitle {
          text-align: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 32px 0;
        }

        .roller-players {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin: 32px 0;
        }

        .roller-player-slot {
          flex: 1;
          max-width: 150px;
          text-align: center;
        }

        .player-avatar {
          background: linear-gradient(135deg, #4a7c59 0%, #2a4a39 100%);
          border: 2px solid #39ff14;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
        }

        .player-name {
          font-size: 16px;
          color: #39ff14;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .dice-display {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 3px solid #fbc80d;
          border-radius: 12px;
          box-shadow: 
            0 0 20px rgba(251, 200, 13, 0.3),
            inset 0 0 15px rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .dice-display.rolling {
          animation: diceShake 0.1s infinite;
        }

        @keyframes diceShake {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
          25% { transform: rotateX(15deg) rotateY(15deg); }
          50% { transform: rotateX(-15deg) rotateY(-15deg); }
          75% { transform: rotateX(10deg) rotateY(10deg); }
        }

        .dice-face {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: bold;
          color: #fbc80d;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .dice-face.active {
          opacity: 1;
        }

        .dice-result {
          position: absolute;
          font-size: 48px;
          font-weight: bold;
          color: #39ff14;
          opacity: 0;
          transition: opacity 0.3s ease;
          text-shadow: 0 0 20px rgba(57, 255, 20, 0.8);
        }

        .dice-result.show-result {
          opacity: 1;
          animation: resultPulse 0.6s ease-out;
        }

        @keyframes resultPulse {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .roller-vs-badge {
          font-size: 24px;
          font-weight: bold;
          color: #fbc80d;
          text-transform: uppercase;
          letter-spacing: 2px;
          padding: 0 16px;
          animation: pulseBadge 1.5s infinite;
        }

        @keyframes pulseBadge {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .roller-result-message {
          text-align: center;
          margin: 32px 0;
          padding: 20px;
          background: rgba(57, 255, 20, 0.1);
          border: 2px solid #39ff14;
          border-radius: 12px;
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .trophy-icon {
          color: #fbc80d;
          margin-bottom: 12px;
          animation: bounce 0.6s ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .result-text {
          margin: 0;
          font-size: 22px;
          font-weight: bold;
          color: #39ff14;
          text-shadow: 0 0 15px rgba(57, 255, 20, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .roller-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }

        .roll-button,
        .confirm-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .primary-btn {
          background: linear-gradient(135deg, #39ff14 0%, #2fe010 100%);
          color: #000;
          border: 2px solid #39ff14;
          box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
        }

        .primary-btn:hover:not(:disabled) {
          box-shadow: 0 0 30px rgba(57, 255, 20, 0.6);
          transform: translateY(-2px);
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
